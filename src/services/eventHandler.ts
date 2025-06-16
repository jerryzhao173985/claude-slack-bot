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
      // Extract model early to include in placeholder
      const model = this.extractModel(text);
      const modelDisplay = model ? ` (using ${this.getModelDisplayName(model)})` : '';
      
      // Post placeholder message
      const placeholder = await this.slackClient.postMessage(
        channel,
        `:thinking_face: Working on your request${modelDisplay}...`,
        thread_ts || ts
      );

      // Get thread context if this is a threaded message
      const context = thread_ts ? await this.slackClient.getThreadContext(channel, thread_ts) : [];

      // Extract tools and question (model already extracted above)
      const tools = this.extractMCPTools(text);
      const question = this.extractQuestion(text);

      // Log placeholder details for debugging
      this.logger.info('Placeholder message created', {
        placeholderTs: placeholder.ts,
        channel: placeholder.channel,
        threadTs: thread_ts || ts
      });

      // Dispatch to GitHub Actions
      await this.githubDispatcher.dispatchWorkflow({
        question,
        mcp_tools: tools.join(','),
        slack_channel: channel,
        slack_ts: placeholder.ts,
        slack_thread_ts: thread_ts || ts,
        system_prompt: this.githubDispatcher.buildSystemPrompt(context),
        model,
      });

      const duration = Date.now() - startTime;
      this.logger.info('Successfully dispatched workflow', {
        userId: user,
        channel,
        duration,
        tools: tools.length,
        contextMessages: context.length,
        model: model || 'default'
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
    // Remove @mentions and model references
    return text
      .replace(/<@[A-Z0-9]+>/g, '')
      .replace(/\b(model:|using|with)\s+(claude-3-7-sonnet-20250219|claude-3-5-sonnet-20241022|claude-sonnet-4-20250514|sonnet-3\.7|sonnet-3\.5|sonnet-4|opus-4)\b/gi, '')
      .trim();
  }

  private extractModel(text: string): string | undefined {
    const modelAliases: Record<string, string> = {
      'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
      'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
      'sonnet-3.7': 'claude-3-7-sonnet-20250219',
      'sonnet-3.5': 'claude-3-5-sonnet-20241022',
      'sonnet-4': 'claude-sonnet-4-20250514',
      'opus-4': 'claude-sonnet-4-20250514', // alias for sonnet-4
    };

    // Look for model specification patterns
    const patterns = [
      /\b(?:model:|using|with)\s+([a-z0-9.-]+)/i,
      /\b(claude-3-7-sonnet-20250219|claude-3-5-sonnet-20241022|claude-sonnet-4-20250514)\b/i,
      /\b(sonnet-3\.7|sonnet-3\.5|sonnet-4|opus-4)\b/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const modelRef = match[1].toLowerCase();
        // Check if it's a valid model or alias
        for (const [alias, model] of Object.entries(modelAliases)) {
          if (modelRef === alias.toLowerCase()) {
            this.logger.info('Model extracted from message', { modelRef, model });
            return model;
          }
        }
      }
    }

    return undefined;
  }

  private getModelDisplayName(model: string): string {
    const displayNames: Record<string, string> = {
      'claude-3-7-sonnet-20250219': 'Sonnet 3.7',
      'claude-3-5-sonnet-20241022': 'Sonnet 3.5',
      'claude-sonnet-4-20250514': 'Sonnet 4',
    };
    return displayNames[model] || model;
  }
}
