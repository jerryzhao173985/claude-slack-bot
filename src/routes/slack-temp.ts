import { Context } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, SlackEventPayload } from '../types/env';

type Variables = {
  rawBody: string;
};

const app = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();

// Temporary endpoint for Slack verification
app.post('/slack/events', async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const body = await c.req.json();
  
  // Handle URL verification challenge
  if (body.challenge) {
    console.log('Received challenge:', body.challenge);
    return c.text(body.challenge);
  }

  // For other events, just return ok
  return c.text('ok');
});

export const slackTempRoutes = app;