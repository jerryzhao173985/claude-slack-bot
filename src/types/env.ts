export interface Env {
  THREAD_CACHE: KVNamespace;
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_WORKFLOW_FILE: string;
  GITHUB_USERNAME?: string;
}

export interface SlackEventPayload {
  type: string;
  event?: {
    type: string;
    user: string;
    text: string;
    ts: string;
    thread_ts?: string;
    channel: string;
    event_ts: string;
  };
  team_id: string;
  api_app_id: string;
  event_id: string;
  event_time: number;
  challenge?: string;
}

export interface SlackMessage {
  text: string;
  user: string;
  ts: string;
  isBot: boolean;
}

export interface ThreadContext {
  messages: SlackMessage[];
  cachedAt: number;
}

export interface GitHubWorkflowInputs {
  question: string;
  slack_channel: string;
  slack_ts: string;
  slack_thread_ts: string;
  system_prompt: string;
  model?: string;
  max_turns?: string;
  timeout_minutes?: string;
  session_id?: string;
}
