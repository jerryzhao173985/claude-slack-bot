import { Context } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Env } from '../types/env';
import { GitHubDispatcher } from '../services/githubDispatcher';

const app = new OpenAPIHono<{ Bindings: Env }>();

// Debug endpoint to test GitHub workflow dispatch
app.get('/debug/test-dispatch', async (c: Context<{ Bindings: Env }>) => {
  try {
    const dispatcher = new GitHubDispatcher(c.env);
    
    // Test dispatch with minimal inputs
    await dispatcher.dispatchWorkflow({
      question: 'Test dispatch from debug endpoint',
      mcp_tools: 'slack',
      slack_channel: 'debug-test',
      slack_ts: '1234567890.123456',
      slack_thread_ts: '',
      system_prompt: 'This is a test dispatch from the debug endpoint',
      model: '',
    });
    
    return c.json({
      success: true,
      message: 'Workflow dispatch successful',
      workflow: c.env.GITHUB_WORKFLOW_FILE,
      repo: `${c.env.GITHUB_OWNER}/${c.env.GITHUB_REPO}`
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      workflow: c.env.GITHUB_WORKFLOW_FILE,
      repo: `${c.env.GITHUB_OWNER}/${c.env.GITHUB_REPO}`
    }, 500);
  }
});

// Debug endpoint to check configuration
app.get('/debug/config', async (c: Context<{ Bindings: Env }>) => {
  return c.json({
    github: {
      owner: c.env.GITHUB_OWNER,
      repo: c.env.GITHUB_REPO,
      workflow_file: c.env.GITHUB_WORKFLOW_FILE,
      token_set: !!c.env.GITHUB_TOKEN,
      token_length: c.env.GITHUB_TOKEN ? c.env.GITHUB_TOKEN.length : 0
    },
    slack: {
      bot_token_set: !!c.env.SLACK_BOT_TOKEN,
      signing_secret_set: !!c.env.SLACK_SIGNING_SECRET
    },
    kv: {
      thread_cache_bound: !!c.env.THREAD_CACHE
    }
  });
});

export const debugRoutes = app;