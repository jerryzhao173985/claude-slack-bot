import { Env, SlackMessage, ThreadContext } from '../types/env';

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  messages?: Array<{
    text: string;
    user: string;
    ts: string;
    bot_id?: string;
  }>;
  user?: {
    real_name?: string;
    name: string;
  };
}

export class SlackClient {
  constructor(
    private env: Env,
    private botToken: string
  ) {}

  async postMessage(channel: string, text: string, threadTs?: string): Promise<{ ts: string; channel: string }> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text,
        thread_ts: threadTs,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const data = (await response.json()) as SlackApiResponse;
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return { ts: data.ts || '', channel };
  }

  async getThreadContext(
    channel: string,
    threadTs: string,
    limit: number = 50
  ): Promise<SlackMessage[]> {
    const cacheKey = `thread:${channel}:${threadTs}`;

    const cached = await this.env.THREAD_CACHE.get<ThreadContext>(cacheKey, 'json');
    if (cached && Date.now() - cached.cachedAt < 60000) {
      return cached.messages;
    }

    const response = await fetch(
      `https://slack.com/api/conversations.replies?channel=${channel}&ts=${threadTs}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.botToken}`,
        },
      }
    );

    const data = (await response.json()) as SlackApiResponse;
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    const messages: SlackMessage[] = await Promise.all(
      (data.messages || []).map(async (msg) => ({
        text: msg.text,
        user: await this.resolveUserName(msg.user),
        ts: msg.ts,
        isBot: msg.bot_id !== undefined,
      }))
    );

    const context: ThreadContext = {
      messages,
      cachedAt: Date.now(),
    };

    await this.env.THREAD_CACHE.put(cacheKey, JSON.stringify(context), {
      expirationTtl: 300,
    });

    return messages;
  }

  private async resolveUserName(userId: string): Promise<string> {
    if (!userId) return 'Unknown';

    const cacheKey = `user:${userId}`;
    const cached = await this.env.THREAD_CACHE.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: {
        Authorization: `Bearer ${this.botToken}`,
      },
    });

    const data = (await response.json()) as SlackApiResponse;
    if (!data.ok || !data.user) return userId;

    const name = data.user.real_name || data.user.name;
    await this.env.THREAD_CACHE.put(cacheKey, name, {
      expirationTtl: 86400,
    });

    return name;
  }
}
