import { Env, SlackEventPayload } from '../types/env';
import { SlackClient } from './slackClient';
import { GitHubDispatcher } from './githubDispatcher';
import { Logger } from '../utils/logger';

export class EventHandler {
  private slackClient: SlackClient;
  private githubDispatcher: GitHubDispatcher;
  private logger: Logger;

  constructor(env: Env, slackBotToken: string) {
    this.slackClient = new SlackClient(env, slackBotToken);
    this.githubDispatcher = new GitHubDispatcher(env);
    this.logger = new Logger('EventHandler');
  }

  async handleAppMention(payload: SlackEventPayload): Promise<void> {
    const startTime = Date.now();
    const event = payload.event;
    
    if (!event || event.type !== 'app_mention') {
      throw new Error('Invalid event type');
    }

    const { channel, text, ts, thread_ts, user } = event;
    
    this.logger.info('Processing app mention', {
      userId: user,
      channel,
      threadTs: thread_ts,
      messageLength: text.length
    });

    try {
      // Post placeholder message
      const placeholder = await this.slackClient.postMessage(
        channel,
        ':thinking_face: Working on your request...',
        thread_ts || ts
      );

      // Get thread context if this is a threaded message
      const context = thread_ts ? await this.slackClient.getThreadContext(channel, thread_ts) : [];

      // Extract tools and question
      const tools = this.extractMCPTools(text);
      const question = this.extractQuestion(text);

      // Dispatch to GitHub Actions
      await this.githubDispatcher.dispatchWorkflow({
        question,
        mcp_tools: tools.join(','),
        slack_channel: channel,
        slack_ts: placeholder.ts,
        slack_thread_ts: thread_ts || ts,
        system_prompt: this.githubDispatcher.buildSystemPrompt(context),
      });

      const duration = Date.now() - startTime;
      this.logger.info('Successfully dispatched workflow', {
        userId: user,
        channel,
        duration,
        tools: tools.length,
        contextMessages: context.length
      });
      
      this.logger.metric('event_handler.success', 1, { type: 'app_mention' });
      this.logger.metric('event_handler.duration', duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to handle app mention', error as Error, {
        userId: user,
        channel,
        duration
      });
      
      this.logger.metric('event_handler.error', 1, { type: 'app_mention' });
      throw error;
    }
  }

  private extractMCPTools(text: string): string[] {
    const defaultTools = ['slack'];

    if (text.toLowerCase().includes('notion')) {
      defaultTools.push('notionApi');
    }
    if (text.toLowerCase().includes('github') || text.toLowerCase().includes('code')) {
      defaultTools.push('github');
    }

    return defaultTools;
  }

  private extractQuestion(text: string): string {
    return text.replace(/<@[A-Z0-9]+>/g, '').trim();
  }
}
