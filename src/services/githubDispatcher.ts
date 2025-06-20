import { Env, GitHubWorkflowInputs, SlackMessage } from '../types/env';

export class GitHubDispatcher {
  constructor(private env: Env) {}

  async dispatchWorkflow(inputs: GitHubWorkflowInputs): Promise<void> {
    const url = `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/actions/workflows/${this.env.GITHUB_WORKFLOW_FILE}/dispatches`;

    // Log the inputs for debugging
    console.log('Dispatching workflow with inputs:', {
      ...inputs,
      system_prompt: inputs.system_prompt ? `[${inputs.system_prompt.length} chars]` : undefined,
      max_turns: inputs.max_turns,
      timeout_minutes: inputs.timeout_minutes
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${this.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'claude-slack-bot/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          question: inputs.question,
          slack_channel: inputs.slack_channel,
          slack_ts: inputs.slack_ts,
          slack_thread_ts: inputs.slack_thread_ts || '',
          system_prompt: inputs.system_prompt,
          model: inputs.model || '',
          max_turns: inputs.max_turns || '15',
          timeout_minutes: inputs.timeout_minutes || '10',
          session_id: inputs.session_id || '',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API Response:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        url: url,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Provide more specific error messages
      if (response.status === 404) {
        throw new Error(`GitHub workflow not found: ${this.env.GITHUB_WORKFLOW_FILE}. Check if the file exists and the name matches exactly.`);
      } else if (response.status === 401) {
        throw new Error('GitHub authentication failed. Check if GITHUB_TOKEN is set in Cloudflare Worker secrets.');
      } else if (response.status === 403) {
        throw new Error('GitHub permission denied. Ensure your token has "repo" and "workflow" scopes.');
      } else if (response.status === 422) {
        throw new Error(`Invalid workflow inputs: ${error}`);
      }
      
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }
  }

  buildSystemPrompt(context: SlackMessage[]): string {
    if (context.length === 0) {
      return '';
    }

    // Sort messages by timestamp to ensure chronological order
    const sortedContext = [...context].sort((a, b) => Number(a.ts) - Number(b.ts));
    
    // Format timestamps to be more readable
    const formatTimestamp = (ts: string) => {
      const date = new Date(Number(ts) * 1000);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    // Build thread history with better formatting
    const threadHistory = sortedContext.map((msg, index) => {
      const time = formatTimestamp(msg.ts);
      const userLabel = msg.isBot ? `${msg.user} (bot)` : msg.user;
      const prefix = index === sortedContext.length - 1 ? '➤' : '•';
      
      return `${prefix} [${time}] ${userLabel}: ${msg.text}`;
    }).join('\n');

    return `

SLACK THREAD CONTEXT:
This is a Slack thread with ${context.length} messages. Here is the complete conversation history in chronological order:

${threadHistory}

The message marked with ➤ is the most recent one that you're responding to.

IMPORTANT CONTEXT INTERPRETATION:
- If the latest message is short (e.g., "do it", "solve this", "continue", "go ahead"), it refers to completing a task mentioned earlier in the thread
- Review the ENTIRE thread history to understand what task needs to be completed
- Look for any unfinished work, requests, or problems that were discussed but not resolved
- If a previous message mentioned creating a PR, fixing an issue, or any other specific task, that's what the user wants you to complete
- DO NOT ask for clarification if the context makes the task clear - proceed with the implementation

Use this context to provide relevant and contextual responses.
When summarizing, consider the flow of conversation and key points from each participant.`;
  }
}
