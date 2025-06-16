import { Env, SlackEventPayload } from '../types/env';
import { SlackClient } from './slackClient';
import { GitHubDispatcher } from './githubDispatcher';

export class EventHandler {
  private slackClient: SlackClient;
  private githubDispatcher: GitHubDispatcher;

  constructor(env: Env, slackBotToken: string) {
    this.slackClient = new SlackClient(env, slackBotToken);
    this.githubDispatcher = new GitHubDispatcher(env);
  }

  async handleAppMention(payload: SlackEventPayload): Promise<void> {
    const event = payload.event;
    if (!event || event.type !== 'app_mention') {
      throw new Error('Invalid event type');
    }

    const { channel, text, ts, thread_ts } = event;

    const placeholder = await this.slackClient.postMessage(
      channel,
      ':thinking_face: Working on your request...',
      thread_ts || ts
    );

    const context = thread_ts ? await this.slackClient.getThreadContext(channel, thread_ts) : [];

    const tools = this.extractMCPTools(text);
    const question = this.extractQuestion(text);

    await this.githubDispatcher.dispatchWorkflow({
      question,
      mcp_tools: tools.join(','),
      slack_channel: channel,
      slack_ts: placeholder.ts,
      slack_thread_ts: thread_ts || ts,
      system_prompt: this.githubDispatcher.buildSystemPrompt(context),
    });
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
