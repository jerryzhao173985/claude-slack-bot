import { Context } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, SlackEventPayload } from '../types/env';
import { verifySlack } from '../middleware/verifySlack';
import { EventHandler } from '../services/eventHandler';

type Variables = {
  rawBody: string;
};

const app = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();

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
      const eventHandler = new EventHandler(c.env, c.env.SLACK_BOT_TOKEN);

      // Process asynchronously
      c.executionCtx.waitUntil(
        eventHandler.handleAppMention(payload).catch((error) => {
          console.error('Error handling app mention:', error);
        })
      );
    }

    return c.text('ok');
  }
);

export const slackRoutes = app;
