import { Env, SlackEventPayload, SlackMessage } from '../types/env';
import { SlackClient } from './slackClient';
import { GitHubDispatcher } from './githubDispatcher';
import { Logger } from '../utils/logger';
import { GitHubUtils } from '../utils/githubUtils';

// Task analysis for intelligent timeout calculation
interface TaskAnalysis {
  hasGitHubWrite: boolean;
  estimatedFiles: number;
  requiresDeepAnalysis: boolean;
  mcpToolCount: number;
  complexityScore: number;
  taskPhases: string[];
}

export class EventHandler {
  private slackClient: SlackClient;
  private githubDispatcher: GitHubDispatcher;
  private logger: Logger;
  private env: Env;

  constructor(env: Env, slackBotToken: string) {
    this.env = env;
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
      
      // Get thread context early to analyze task complexity
      const threadContext = thread_ts ? await this.slackClient.getThreadContext(channel, thread_ts) : [];
      
      // Check for automatic continuation
      const isAutoContinuation = this.shouldAutoContinue(text, threadContext);
      
      // Generate or extract session ID
      let sessionId = this.extractSessionId(text);
      if (!sessionId && (thread_ts || isAutoContinuation)) {
        // Generate deterministic session ID for this thread
        sessionId = this.generateSessionId(channel, thread_ts || ts);
        this.logger.info('Generated session ID for thread', { sessionId, channel, threadTs: thread_ts });
      }
      
      const sessionIndicator = sessionId ? ' (resuming session)' : '';
      
      // Post placeholder message
      const placeholder = await this.slackClient.postMessage(
        channel,
        `:thinking_face: Working on your request${modelDisplay}${sessionIndicator}...`,
        thread_ts || ts
      );

      // Use already fetched thread context
      const context = threadContext;

      // Extract GitHub context for enhanced repository handling
      const githubUsername = this.env.GITHUB_USERNAME || 'jerryzhao173985'; // Default to your username
      const githubContext = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      // Extract tools and question (model and sessionId already extracted above)
      const tools = this.extractMCPTools(text);
      const question = this.extractQuestion(text);
      
      // Log extraction results for debugging
      this.logger.info('Extracted components', {
        originalText: text,
        cleanedQuestion: question,
        tools: tools,
        hasGitHub: tools.includes('github'),
        sessionId: sessionId || 'new-session'
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
      if ((this.isContinuationRequest(text) || isAutoContinuation) && context.length > 0) {
        systemPrompt += `\n\nCRITICAL: The user's message "${question}" is a continuation request. You MUST review the thread history above to identify and complete the previously discussed task. Do not ask for clarification - the task is clear from the context.`;
        systemPrompt += `\n\nSESSION INFO: This is a continuation of session ${sessionId}. Check for any saved checkpoints and resume from where the previous run left off.`;
        this.logger.info('Detected continuation request', { 
          question, 
          threadLength: context.length,
          isAutoContinuation,
          sessionId 
        });
      }

      // Analyze task complexity
      const taskAnalysis = this.analyzeTask(question, tools, context);
      
      // Calculate optimal turns based on task complexity
      const contextLength = context ? context.length : 0;
      const calculatedTurns = this.calculateTurns(question, tools, contextLength);
      
      // Calculate dynamic timeout based on task analysis
      const timeoutMinutes = this.calculateDynamicTimeout(calculatedTurns, taskAnalysis);
      
      // Log turn calculation for debugging
      this.logger.info('Turn calculation result', {
        calculatedTurns,
        timeoutMinutes,
        contextLength,
        tools: tools.join(',')
      });

      // Dispatch to GitHub Actions (exactly 10 inputs - at the limit!)
      await this.githubDispatcher.dispatchWorkflow({
        question,
        slack_channel: channel,
        slack_ts: placeholder.ts,
        slack_thread_ts: thread_ts || ts,
        system_prompt: systemPrompt,
        model,
        repository_context: githubContext ? JSON.stringify(githubContext) : undefined,
        max_turns: calculatedTurns.toString(),
        timeout_minutes: timeoutMinutes.toString(),
        session_id: sessionId
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
      // Remove session IDs from continuation requests
      .replace(/\b(continue|resume)\s+session\s+[a-f0-9-]+/gi, 'continue')
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
      /(?:https?:\/\/)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)(?:\.git)?(?:\/|$)/i,
      // SSH URLs
      /git@github\.com:([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)(?:\.git)?(?:\/|$)/i,
      // Git clone commands
      /git\s+clone\s+(?:https?:\/\/)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)(?:\.git)?/i,
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

  private generateSessionId(channel: string, threadTs: string): string {
    // Deterministic session ID based on thread and date
    const date = new Date().toISOString().split('T')[0];
    const data = `${channel}-${threadTs}-${date}`;
    
    // Use Web Crypto API for Cloudflare Workers compatibility
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Simple hash function for deterministic ID generation
    let hash = 0;
    for (let i = 0; i < dataBuffer.length; i++) {
      hash = ((hash << 5) - hash) + dataBuffer[i];
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex and take first 12 chars
    return Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
  }

  private shouldAutoContinue(message: string, threadContext: SlackMessage[]): boolean {
    const continuationPhrases = ['continue', 'keep going', 'finish', 'complete', 'resume', 'go ahead', 'do it'];
    const messageLower = message.toLowerCase().trim();
    
    // Check if it's a short continuation message
    if (messageLower.length < 20 && continuationPhrases.some(phrase => messageLower.includes(phrase))) {
      // Look for recent bot messages mentioning continuation
      const recentBotMessages = threadContext.slice(-5).filter(m => m.isBot);
      return recentBotMessages.some(m => 
        m.text.includes('continue') || 
        m.text.includes('remaining') || 
        m.text.includes('incomplete') ||
        m.text.includes('Made significant progress')
      );
    }
    
    return false;
  }

  private extractSessionId(text: string): string | undefined {
    // Look for explicit session continuation patterns
    const patterns = [
      /continue\s+session\s+([a-f0-9-]+)/i,
      /resume\s+session\s+([a-f0-9-]+)/i,
      /session\s+([a-f0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const sessionId = match[1];
        this.logger.info('Session ID extracted from message', { sessionId });
        return sessionId;
      }
    }

    return undefined;
  }

  private analyzeTask(text: string, mcpTools: string[], threadContext: SlackMessage[]): TaskAnalysis {
    const analysis: TaskAnalysis = {
      hasGitHubWrite: false,
      estimatedFiles: 0,
      requiresDeepAnalysis: false,
      mcpToolCount: mcpTools.length,
      complexityScore: 0,
      taskPhases: []
    };

    // Check for GitHub write operations
    const githubWritePatterns = /\b(create|update|modify|push|commit|merge)\s*(a\s+)?\s*(pr|pull request|branch|file|issue)/i;
    if (githubWritePatterns.test(text) && mcpTools.includes('github')) {
      analysis.hasGitHubWrite = true;
      analysis.complexityScore += 20;
      analysis.taskPhases.push('github-operations');
    }

    // Estimate file operations
    const filePatterns = /\b(file|component|module|class|function|api|endpoint|service)s?\b/gi;
    const fileMatches = text.match(filePatterns) || [];
    analysis.estimatedFiles = Math.min(fileMatches.length, 10);
    analysis.complexityScore += analysis.estimatedFiles * 2;

    // Check for deep analysis requirements
    const analysisPatterns = /\b(analyze|review|audit|investigate|examine)\s+(entire|whole|complete|all|comprehensive)/i;
    if (analysisPatterns.test(text)) {
      analysis.requiresDeepAnalysis = true;
      analysis.complexityScore += 15;
      analysis.taskPhases.push('analysis');
    }

    // Check for implementation phases
    if (/\b(implement|build|create|develop)/i.test(text)) {
      analysis.taskPhases.push('implementation');
      analysis.complexityScore += 10;
    }

    // Check for testing requirements
    if (/\b(test|verify|validate|check)/i.test(text)) {
      analysis.taskPhases.push('testing');
      analysis.complexityScore += 5;
    }

    // Context complexity
    if (threadContext.length > 10) {
      analysis.complexityScore += 10;
    }

    this.logger.info('Task analysis completed', { analysis });
    return analysis;
  }

  private calculateDynamicTimeout(turns: number, taskAnalysis: TaskAnalysis): number {
    // Base formula: 30 seconds per turn + buffer
    const baseSeconds = turns * 30;
    const bufferMinutes = 5;
    
    // Task-specific multipliers
    const multipliers = {
      github_operations: taskAnalysis.hasGitHubWrite ? 1.5 : 1.0,
      file_operations: 1 + (taskAnalysis.estimatedFiles * 0.2),
      analysis_depth: taskAnalysis.requiresDeepAnalysis ? 1.3 : 1.0,
      mcp_operations: 1 + (taskAnalysis.mcpToolCount * 0.1)
    };
    
    // Calculate total multiplier (avoid double counting)
    const totalMultiplier = Object.values(multipliers).reduce((acc, mult) => acc * mult, 1);
    
    // Calculate timeout in minutes
    const calculatedMinutes = Math.ceil((baseSeconds / 60) * totalMultiplier) + bufferMinutes;
    
    // Smart capping: 45 min for workflow, leaving 15 min buffer for GitHub's 60 min limit
    const finalTimeout = Math.min(calculatedMinutes, 45);
    
    this.logger.info('Dynamic timeout calculated', {
      turns,
      baseSeconds,
      multipliers,
      totalMultiplier,
      calculatedMinutes,
      finalTimeout,
      complexityScore: taskAnalysis.complexityScore
    });
    
    return finalTimeout;
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
      githubComplex: /\b(create|open|submit|merge|raise)\s*(a\s+|an\s+)?(pr|pull request|issue)|push.*(to\s+)?branch|commit.*changes/i,
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
