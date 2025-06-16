import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { Env } from '../types/env';

const app = new Hono<{ Bindings: Env }>();

app.get(
  '/docs',
  swaggerUI({
    url: '/doc',
  })
);

app.get('/doc', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Claude Slack Bot API',
      version: '1.0.0',
      description: 'Slack bot powered by Claude with MCP integration',
    },
    servers: [
      {
        url: 'https://claude-slack-bot.workers.dev',
        description: 'Production server',
      },
    ],
    paths: {},
  });
});

export const docsRoutes = app;
