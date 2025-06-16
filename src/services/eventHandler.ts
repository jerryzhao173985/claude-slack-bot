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
    // Always include slack and notionApi for Q&A recording
    const defaultTools = ['slack', 'notionApi'];

    // Conditionally add github if mentioned
    if (text.toLowerCase().includes('github') || text.toLowerCase().includes('code')) {
      defaultTools.push('github');
    }

    return defaultTools;
  }

  private extractQuestion(text: string): string {
    // Remove @mentions and model references
    return text
      .replace(/<@[A-Z0-9]+>/g, '')
      // Remove model specifications with various patterns
      .replace(/\/model\s+[a-z0-9.-]+/gi, '')
      .replace(/\b(model:|using|with)\s+[a-z0-9.-]+/gi, '')
      // Remove model presets
      .replace(/\b(advanced|fast|balanced|smart|quick|deep)\s+mode\b/gi, '')
      .replace(/\/mode\s+[a-z]+/gi, '')
      .trim();
  }

  private extractModel(text: string): string | undefined {
    const modelAliases: Record<string, string> = {
      // Full model IDs
      'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
      'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
      
      // Version aliases
      'sonnet-3.7': 'claude-3-7-sonnet-20250219',
      'sonnet-3.5': 'claude-3-5-sonnet-20241022',
      'sonnet-4': 'claude-sonnet-4-20250514',
      'opus-4': 'claude-sonnet-4-20250514',
      
      // Short aliases
      '3.7': 'claude-3-7-sonnet-20250219',
      '3.5': 'claude-3-5-sonnet-20241022',
      '4': 'claude-sonnet-4-20250514',
      
      // Named presets
      'advanced': 'claude-sonnet-4-20250514',      // Most capable
      'smart': 'claude-sonnet-4-20250514',         // Alias for advanced
      'deep': 'claude-sonnet-4-20250514',          // Alias for advanced
      'fast': 'claude-3-5-sonnet-20241022',        // Good balance
      'balanced': 'claude-3-5-sonnet-20241022',    // Default
      'quick': 'claude-3-5-sonnet-20241022',       // Alias for fast
      'latest': 'claude-3-7-sonnet-20250219',      // Latest release
      'newest': 'claude-3-7-sonnet-20250219',      // Alias for latest
    };

    // Look for model specification patterns
    const patterns = [
      // Slash command style
      /\/model\s+([a-z0-9.-]+)/i,
      /\/mode\s+([a-z]+)/i,
      
      // Natural language style
      /\b(?:model:|using|with)\s+([a-z0-9.-]+)/i,
      
      // Mode patterns
      /\b(advanced|fast|balanced|smart|quick|deep|latest|newest)\s+mode\b/i,
      
      // Direct model references
      /\b(claude-3-7-sonnet-20250219|claude-3-5-sonnet-20241022|claude-sonnet-4-20250514)\b/i,
      /\b(sonnet-3\.7|sonnet-3\.5|sonnet-4|opus-4|3\.7|3\.5|4)\b/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const modelRef = match[1].toLowerCase().replace(/\s+mode$/, '');
        
        // Check if it's a valid model or alias
        if (modelAliases[modelRef]) {
          this.logger.info('Model extracted from message', { 
            modelRef, 
            model: modelAliases[modelRef],
            pattern: pattern.source
          });
          return modelAliases[modelRef];
        }
      }
    }

    // Check for contextual hints that suggest advanced model
    if (text.match(/\b(complex|detailed|comprehensive|thorough|advanced)\b/i)) {
      this.logger.info('Detected advanced request, using Sonnet 4');
      return 'claude-sonnet-4-20250514';
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
