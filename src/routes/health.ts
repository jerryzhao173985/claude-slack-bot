import { z } from 'zod';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { Env } from '../types/env';

const app = new OpenAPIHono<{ Bindings: Env }>();

const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  version: z.string(),
});

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      description: 'Health check successful',
      content: {
        'application/json': {
          schema: healthResponseSchema,
        },
      },
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export const healthRoutes = app;
