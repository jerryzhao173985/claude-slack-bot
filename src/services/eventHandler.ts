import { Env, SlackEventPayload } from '../types/env';
import { SlackClient } from './slackClient';
import { GitHubDispatcher } from './githubDispatcher';
import { Logger } from '../utils/logger';
import { GitHubUtils } from '../utils/githubUtils';

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
      const modelName = this.getModelDisplayName(model || 'claude-sonnet-4-20250514');
      const supportsThinking = model !== 'claude-3-5-sonnet-20241022';
      const thinkingIndicator = supportsThinking ? ' 🧠' : '';
      const modelDisplay = model ? ` (using ${modelName}${thinkingIndicator})` : '';
      
      // Post placeholder message
      const placeholder = await this.slackClient.postMessage(
        channel,
        `:thinking_face: Working on your request${modelDisplay}...`,
        thread_ts || ts
      );

      // Get thread context if this is a threaded message
      const context = thread_ts ? await this.slackClient.getThreadContext(channel, thread_ts) : [];

      // Extract GitHub context for enhanced repository handling
      const githubUsername = this.env.GITHUB_USERNAME || 'jerryzhao173985'; // Default to your username
      const githubContext = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      // Extract tools and question (model already extracted above)
      const tools = this.extractMCPTools(text);
      const question = this.extractQuestion(text);
      
      // Log extraction results for debugging
      this.logger.info('Extracted components', {
        originalText: text,
        cleanedQuestion: question,
        tools: tools,
        hasGitHub: tools.includes('github')
      });

      // Log placeholder details for debugging
      this.logger.info('Placeholder message created', {
        placeholderTs: placeholder.ts,
        channel: placeholder.channel,
        threadTs: thread_ts || ts,
        githubContext
      });

      // Build system prompt with repository context if detected
      let systemPrompt = this.githubDispatcher.buildSystemPrompt(context);
      if (githubContext) {
        systemPrompt += GitHubUtils.buildGitHubPrompt(githubContext);
      }
      
      // Add explicit instruction for continuation requests
      if (this.isContinuationRequest(text) && context.length > 0) {
        systemPrompt += `\n\nCRITICAL: The user's message "${question}" is a continuation request. You MUST review the thread history above to identify and complete the previously discussed task. Do not ask for clarification - the task is clear from the context.`;
        this.logger.info('Detected continuation request', { question, threadLength: context.length });
      }

      // Calculate optimal turns based on task complexity
      const contextLength = context ? context.length : 0;
      const calculatedTurns = this.calculateTurns(question, tools, contextLength);
      
      // Log turn calculation for debugging
      this.logger.info('Turn calculation result', {
        calculatedTurns,
        contextLength,
        tools: tools.join(',')
      });

      // Dispatch to GitHub Actions
      await this.githubDispatcher.dispatchWorkflow({
        question,
        mcp_tools: tools.join(','),
        slack_channel: channel,
        slack_ts: placeholder.ts,
        slack_thread_ts: thread_ts || ts,
        system_prompt: systemPrompt,
        model,
        repository_context: githubContext ? JSON.stringify(githubContext) : undefined,
        max_turns: calculatedTurns.toString()
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

    // Conditionally add github if mentioned or repository pattern detected
    if (text.toLowerCase().includes('github') || 
        text.toLowerCase().includes('code') ||
        text.toLowerCase().includes('analyze') ||
        this.extractGitHubRepository(text)) {
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

  private isContinuationRequest(text: string): boolean {
    // Common patterns that indicate continuation of a previous request
    const continuationPatterns = [
      /^(do\s+it|solve\s+this|continue|go\s+ahead|proceed|yes|ok|sure|finish)$/i,
      /^(complete|finish|finalize)\s+(it|this|that)?$/i,
      /^(please\s+)?(do|solve|complete|finish)\s+(it|this|that)$/i,
      /^go$/i,
      /^👍|✅|💯$/  // Common affirmative emojis
    ];
    
    const cleanText = this.extractQuestion(text).trim();
    return continuationPatterns.some(pattern => pattern.test(cleanText));
  }

  private extractGitHubRepository(text: string): string | null {
    // Patterns to match GitHub repositories
    const patterns = [
      // Full GitHub URLs with optional .git extension
      /(?:https?:\/\/)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/|$)/i,
      // SSH URLs
      /git@github\.com:([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/|$)/i,
      // Git clone commands
      /git\s+clone\s+(?:https?:\/\/)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?/i,
      // Owner/repo format
      /\b([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)\b/,
      // With common prefixes
      /\b(?:analyze|check|review|examine|inspect|fix|improve)\s+(?:my\s+)?(?:code\s+)?([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)/i,
      // Repository references with "in" or "from"
      /\b(?:in|from)\s+([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const owner = match[1];
        let repo = match[2];
        
        // Remove .git extension if present
        repo = repo.replace(/\.git$/, '');
        
        // Validate it looks like a real repository name
        if (owner.length > 0 && repo.length > 0 && 
            !owner.includes(' ') && !repo.includes(' ') &&
            owner !== 'model' && owner !== 'with' && owner !== 'using') {
          const repository = `${owner}/${repo}`;
          this.logger.info('GitHub repository detected', { repository, pattern: pattern.source });
          return repository;
        }
      }
    }

    return null;
  }

  private calculateTurns(text: string, mcpTools: string[], threadLength: number): number {
    // Base allocation
    let turns = 15;
    
    // Log input parameters
    this.logger.info('calculateTurns input', {
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...',
      mcpTools,
      threadLength
    });
    
    // MCP-based complexity (GitHub = 25 tools = more complexity)
    if (mcpTools.includes('github')) {
      turns += 10;
      this.logger.info('Added 10 turns for GitHub tools');
    }
    
    // Task-specific adjustments (precise patterns)
    const complexityMarkers = {
      multiStep: /\b(first|then|after|finally|step \d+)\b/i,
      refactoring: /\brefactor(ing)?\s+(the\s+)?(entire\s+)?(system|codebase|architecture|api|backend|frontend)/i,
      githubComplex: /\b(create|open|submit|merge)\s*(a\s+|an\s+)?(pr|pull request|issue)|push.*(to\s+)?branch|commit.*changes/i,
      majorWork: /\b(implement|build|develop)\s+(new\s+)?(feature|system|api|service|integration)|migrate\s+to|redesign|architect/i,
      debugging: /\b(debug|fix|resolve)\s+(the\s+)?(bug|issue|error|problem|crash)/i,
      comprehensiveAnalysis: /\banalyze\s+(the\s+)?(entire|whole|complete|all)\s+(codebase|system|project)/i,
      contextualReference: /\b(do\s+(it|this|that)|solve\s+(this|it|that)|continue|proceed|go\s+ahead|finish\s+(it|this))\b/i,
      completionRequest: /\b(complete|finish|finalize|wrap\s+up)\s+(the\s+)?(task|work|job|request)/i
    };
    
    // Add turns for complexity markers
    const markerResults: string[] = [];
    if (complexityMarkers.multiStep.test(text)) {
      turns += 5;
      markerResults.push('multiStep');
    }
    if (complexityMarkers.refactoring.test(text)) {
      turns += 10;
      markerResults.push('refactoring');
    }
    if (complexityMarkers.githubComplex.test(text)) {
      turns += 10; // PR/issue creation needs multiple MCP calls
      markerResults.push('githubComplex');
      const match = text.match(complexityMarkers.githubComplex);
      this.logger.info('githubComplex pattern matched', { match: match?.[0] });
    }
    if (complexityMarkers.majorWork.test(text)) {
      turns += 10;
      markerResults.push('majorWork');
    }
    if (complexityMarkers.debugging.test(text)) {
      turns += 5;
      markerResults.push('debugging');
    }
    if (complexityMarkers.comprehensiveAnalysis.test(text)) {
      turns += 5;
      markerResults.push('comprehensiveAnalysis');
    }
    
    // Check for contextual references that likely refer to complex tasks in thread
    if (complexityMarkers.contextualReference.test(text) && threadLength > 0) {
      turns += 15; // Contextual references usually mean complex unfinished work
      markerResults.push('contextualReference');
      this.logger.info('Detected contextual reference in thread', { 
        text,
        threadLength,
        match: text.match(complexityMarkers.contextualReference)?.[0]
      });
    }
    if (complexityMarkers.completionRequest.test(text)) {
      turns += 10;
      markerResults.push('completionRequest');
    }
    
    this.logger.info('Complexity markers matched', { markerResults, turnsAfterMarkers: turns });
    
    // Thread context (conversations build complexity)
    if (threadLength > 5) turns += 5;
    if (threadLength > 15) turns += 5; // +10 total for long threads
    
    // Short messages in threads often indicate continuation of complex tasks
    if (text.length < 20 && threadLength > 0) {
      turns += 10;
      this.logger.info('Short message in thread detected, likely continuation', {
        textLength: text.length,
        text,
        threadLength
      });
    }
    
    // Cap at reasonable maximum
    const finalTurns = Math.min(turns, 50);
    
    // Log turn calculation for monitoring
    this.logger.info('Turn allocation calculated', {
      base: 15,
      calculated: finalTurns,
      hasGitHub: mcpTools.includes('github'),
      threadLength: threadLength,
      patternsMatched: Object.entries(complexityMarkers)
        .filter(([_, pattern]) => pattern.test(text))
        .map(([name]) => name)
    });
    
    return finalTurns;
  }
}
