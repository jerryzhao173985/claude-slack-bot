import { Env, GitHubWorkflowInputs, SlackMessage } from '../types/env';

export class GitHubDispatcher {
  constructor(private env: Env) {}

  async dispatchWorkflow(inputs: GitHubWorkflowInputs): Promise<void> {
    const url = `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/actions/workflows/${this.env.GITHUB_WORKFLOW_FILE}/dispatches`;

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
          mcp_tools: inputs.mcp_tools,
          slack_channel: inputs.slack_channel,
          slack_ts: inputs.slack_ts,
          slack_thread_ts: inputs.slack_thread_ts || '',
          system_prompt: inputs.system_prompt,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }
  }

  buildSystemPrompt(context: SlackMessage[]): string {
    if (context.length === 0) {
      return 'You are a helpful assistant responding to a Slack message.';
    }

    const threadHistory = context.map((msg) => `${msg.user} (${msg.ts}): ${msg.text}`).join('\n');

    return `You are a helpful assistant responding to a Slack thread. Here is the conversation history:

${threadHistory}

Please provide a helpful response to the latest message. When you're done, use the mcp__slack__chat_update tool to update the placeholder message.`;
  }
}
