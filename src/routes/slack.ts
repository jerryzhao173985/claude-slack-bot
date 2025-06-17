import { Context } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, SlackEventPayload } from '../types/env';
import { verifySlack } from '../middleware/verifySlack';
import { EventHandler } from '../services/eventHandler';
import { RateLimiter } from '../services/rateLimiter';

type Variables = {
  rawBody: string;
};

const app = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();

// Rate limiter instance (10 requests per minute per user)
const rateLimiter = new RateLimiter(10, 60000);

// Use regular route handler with middleware
app.post(
  '/slack/events',
  verifySlack,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const rawBody = c.get('rawBody');
    const payload: SlackEventPayload = JSON.parse(rawBody);

    // Handle URL verification challenge
    if (payload.challenge) {
      return c.text(payload.challenge);
    }

    // Handle app_mention events
    if (payload.type === 'event_callback' && payload.event?.type === 'app_mention') {
      // Rate limiting per user
      const userId = payload.event.user;
      if (!rateLimiter.isAllowed(userId)) {
        console.warn(`Rate limit exceeded for user ${userId}`);
        return c.text('ok'); // Still return ok to Slack
      }

      const eventHandler = new EventHandler(c.env, c.env.SLACK_BOT_TOKEN);

      // Process asynchronously
      c.executionCtx.waitUntil(
        eventHandler.handleAppMention(payload).catch((error) => {
          console.error('Error handling app mention:', {
            error: error.message,
            stack: error.stack,
            payload: JSON.stringify(payload),
            env: {
              hasGithubToken: !!c.env.GITHUB_TOKEN,
              githubOwner: c.env.GITHUB_OWNER,
              githubRepo: c.env.GITHUB_REPO,
              githubWorkflow: c.env.GITHUB_WORKFLOW_FILE
            }
          });
        })
      );
      
      // Cleanup old rate limit entries periodically
      c.executionCtx.waitUntil(
        Promise.resolve().then(() => rateLimiter.cleanup())
      );
    }

    return c.text('ok');
  }
);

export const slackRoutes = app;
