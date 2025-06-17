import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from 'hono/request-id';
import { Env } from './types/env';
import { slackRoutes } from './routes/slack';
import { healthRoutes } from './routes/health';
import { docsRoutes } from './routes/docs';
import { debugRoutes } from './routes/debug';

const app = new OpenAPIHono<{ Bindings: Env }>();

app.use('*', requestId(), logger(), secureHeaders());

app.use(
  '*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

// Use secure slack routes with verification
app.route('/', slackRoutes);
app.route('/', healthRoutes);
app.route('/', docsRoutes);
app.route('/', debugRoutes);

app.onError((err, c) => {
  console.error('Application error:', err);
  return c.text('Internal Server Error', 500);
});

app.notFound((c) => {
  return c.text('Not Found', 404);
});

export default app;
