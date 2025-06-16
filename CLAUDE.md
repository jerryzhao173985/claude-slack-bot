# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude-powered Slack bot implementation using a distributed architecture with Cloudflare Workers and GitHub Actions. The bot integrates official MCP (Model Context Protocol) servers for Slack, Notion, and GitHub.

## Development Commands

```bash
# Install dependencies
npm install

# Local development with Wrangler
npm run dev

# Build TypeScript
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Run tests
npm test
npm run test:run

# Linting and type checking
npm run lint
npm run typecheck

# Format code
npm run format
```

## Architecture

The project follows a distributed architecture:
- **Cloudflare Worker**: Handles Slack events, verifies signatures, posts placeholder messages
- **GitHub Actions**: Runs Claude Code with MCP servers to process requests
- **KV Storage**: Caches thread context and user information

## Key Implementation Details

### Slack Event Handling
- All Slack events go through signature verification middleware
- Bot responds immediately with a placeholder message
- GitHub workflow is triggered asynchronously
- Thread context (up to 50 messages) is cached in KV

### MCP Integration
- Dynamic MCP configuration generated at runtime
- Supports Slack, Notion, and GitHub MCP servers
- Claude updates the placeholder message when processing completes

### Security
- HMAC-SHA256 signature verification for all Slack requests
- Secrets stored in Cloudflare and GitHub environments
- Request timestamp validation (5-minute window)

---

## One-paragraph executive summary

We split the bot into an *edge* component (a Hono-based Cloudflare Worker) that handles Slack events in <3 s, and a *runner* component (a GitHub Actions workflow) that boots Claude Code plus official MCP servers (Slack, Notion, GitHub, Drive). The Worker verifies Slack signatures, posts a placeholder reply, and triggers the workflow via the `workflow_dispatch` API. The Action checks out code, dynamically writes `mcp-config.json`, then runs `anthropics/claude-code-base-action@beta`, finally calling the Slack MCP tool to edit the placeholder. The design avoids Cloudflare’s 1 MiB bundle limit, respects Slack’s response deadline, and needs **zero** long-running infrastructure.([engineering.0x1.company][1], [engineering.0x1.company][1], [en.wikipedia.org][2], [dev.to][3])

---

## 1. Repository layout

```
.
├── .github/
│   └── workflows/
│       └── claude-code-processor.yml
├── src/
│   ├── index.ts           # Hono entry-point
│   ├── middleware/
│   │   └── verifySlack.ts
│   ├── routes/
│   │   ├── slack.ts
│   │   ├── health.ts
│   │   └── docs.ts
│   └── services/
│       ├── githubDispatcher.ts
│       ├── slackClient.ts
│       └── eventHandler.ts
└── scripts/
    └── prepare-mcp-config.sh
```

Bind a Cloudflare KV namespace named `THREAD_CACHE` for thread context storage.([engineering.0x1.company][1])

---

## 2. Cloudflare Worker (Hono + TypeScript)

### 2.1 Entry point (`src/index.ts`)

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors }          from "hono/cors";
import { logger }        from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId }     from "hono/request-id";
import { slackRoutes }   from "./routes/slack";
import { healthRoutes }  from "./routes/health";
import { docsRoutes }    from "./routes/docs";

const app = new OpenAPIHono<Env>();
app.use("*", requestId(), logger(), secureHeaders(), cors({ origin: o => o, credentials: true }));

app.route("/", slackRoutes);
app.route("/", healthRoutes);
app.route("/", docsRoutes);

export default app;
```

Skeleton only—bundles to <60 kB.([engineering.0x1.company][1])

### 2.2 Slack signature verification (`src/middleware/verifySlack.ts`)

```ts
export const verifySlack = async (c, next) => {
  const sig = c.req.header("x-slack-signature");
  const ts  = c.req.header("x-slack-request-timestamp");
  if (!sig || !ts) return c.text("Bad signature", 401);

  const age = Math.abs(Date.now()/1000 - Number(ts));
  if (age > 300) return c.text("Stale request", 401);

  const body = await c.req.text();
  const base = `v0:${ts}:${body}`;
  const mac  = await crypto.subtle.importKey(/*…*/); // HMAC-SHA256
  const hex  = `v0=${buf2hex(await crypto.subtle.sign("HMAC", mac, enc.encode(base)))}`;

  if (hex !== sig) return c.text("Bad signature", 401);
  return next();
};
```

Adapted from Slack’s official docs and Cloudflare examples.([api.slack.com][4], [developers.cloudflare.com][5], [gist.github.com][6])

### 2.3 Slack route handler (`src/routes/slack.ts`)

* Accept `app_mention` events.
* Immediately post “\:thinking\_face: Working…” using `chat.postMessage`.
* Cache up to 50 thread messages in `THREAD_CACHE`.
* Dispatch GitHub workflow (see §3) via REST `/repos/:owner/:repo/actions/workflows/:file/dispatches`.([engineering.0x1.company][1], [engineering.0x1.company][1])

Key helper (`githubDispatcher.ts`) builds `inputs`:

```ts
const payload = {
  ref: "main",
  inputs: {
    question:        params.question,
    mcp_tools:       params.tools.join(","),
    slack_channel:   params.channel,
    slack_ts:        params.placeholderTs,
    slack_thread_ts: params.threadTs ?? "",
    system_prompt:   buildSystemPrompt(params.context),
  },
};
```

([engineering.0x1.company][1])

---

## 3. GitHub Actions runner

### 3.1 Workflow file (`.github/workflows/claude-code-processor.yml`)

```yaml
name: Claude Code Processor
on:
  workflow_dispatch:
    inputs:
      question:       { description: "User question",       required: true,  type: string }
      mcp_tools:      { description: "Comma-list tools",    required: false, type: string }
      slack_channel:  { description: "Slack channel ID",    required: true,  type: string }
      slack_ts:       { description: "Placeholder TS",      required: true,  type: string }
      slack_thread_ts:{ description: "Thread TS",           required: false, type: string }

jobs:
  run-claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Prepare MCP config
        run: bash scripts/prepare-mcp-config.sh
        env: { NOTION_API_KEY: ${{ secrets.NOTION_KEY }}, SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}, SLACK_TEAM_ID: ${{ secrets.SLACK_TEAM_ID }}, GH_TOKEN: ${{ secrets.GH_TOKEN }} }

      - name: Run Claude Code
        uses: anthropics/claude-code-base-action@beta
        with:
          prompt:        ${{ github.event.inputs.question }}
          anthropic_api_key:  ${{ secrets.ANTHROPIC_API_KEY }}
          mcp_config_path:    "./mcp-config.json"
          allowed_tools:      "${{ github.event.inputs.mcp_tools }},Bash,Grep,Glob,Read,Write,Edit,MultiEdit,LS,Task,TodoRead,TodoWrite,WebSearch,WebFetch"
          max_turns: 5
```

`claude-code-base-action@beta` is required because the stable action ignores `workflow_dispatch`.([engineering.0x1.company][1], [github.com][7])

### 3.2 Dynamic MCP config (`scripts/prepare-mcp-config.sh`)

```bash
cat > mcp-config.json <<EOF
{
  "mcpServers": {
    "notionApi": {
      "command": "npx",
      "args": ["-y","@notionhq/notion-mcp-server"],
      "env": { "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer ${NOTION_API_KEY}\",\"Notion-Version\":\"2022-06-28\"}" }
    },
    "slack": {
      "command": "npx",
      "args": ["-y","@modelcontextprotocol/server-slack"],
      "env": { "SLACK_BOT_TOKEN":"${SLACK_BOT_TOKEN}","SLACK_TEAM_ID":"${SLACK_TEAM_ID}" }
    },
    "github": {
      "command": "npx",
      "args": ["-y","@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN":"${GH_TOKEN}" }
    }
  }
}
EOF
```

Uses the official MCP servers published on npm.([engineering.0x1.company][1], [mcpmarket.com][8], [apidog.com][9])

### 3.3 Finishing step inside Claude session

The system prompt tells Claude to call

```
mcp__slack__chat_update
  channel: <${slack_channel}>
  ts:      <${slack_ts}>
  text:    "<final answer>"
```

when all tasks finish, replacing the placeholder message.([engineering.0x1.company][1])

---

## 4. Secrets & configuration

| Secret                              | Where used         | Notes                                                    |
| ----------------------------------- | ------------------ | -------------------------------------------------------- |
| `SLACK_SIGNING_SECRET`              | Worker             | Slack “Basic Info” page([api.slack.com][4])              |
| `SLACK_BOT_TOKEN` & `SLACK_TEAM_ID` | MCP Slack server   | Needs `chat:write`, `users:read` scopes([slack.com][10]) |
| `NOTION_KEY`                        | MCP Notion server  | Full-access integration([apidog.com][9])                 |
| `GH_TOKEN`                          | MCP GitHub server  | Classic PAT with `repo` scope                            |
| `ANTHROPIC_API_KEY`                 | Claude Code action | Any Claude-enabled provider                              |

---

## 5. Thread-context helper (`src/services/slackClient.ts`)

* Fetch `conversations.replies` (limit 50).
* Resolve each `user` to real name via `users.info`.
* Serialize into `{text,user,ts,isBot}` array for Claude.([engineering.0x1.company][1])

Caching in KV prevents double API calls if the workflow retries.([engineering.0x1.company][1])

---

## 6. Deployment steps

1. **Create GitHub repo** and push the above files.
2. **Add secrets** per §4.
3. **Deploy Worker** with `wrangler publish`, binding `THREAD_CACHE`.
4. **Configure Slack App**: event subscription URL = Worker endpoint; add `app_mentions:read` & `chat:write`.
5. **Invite the app** to channels.
6. Type `@claude summarise this…` → bot replies instantly, edits later with Claude’s answer (≤ 90 s typical).([engineering.0x1.company][1], [engineering.0x1.company][1])

---

## 7. Extending the bot

* Add any new MCP server by appending to `prepare-mcp-config.sh`.([engineering.0x1.company][1])
* For no-code teams, Runbear offers a hosted Slack MCP client—good reference for user experience but not required.([runbear.io][11])
* Inspiration and patterns: Dev-community posts on Workers-based Slack bots([dev.to][3], [the-guild.dev][12], [medium.com][13], [kymidd.medium.com][14]).

---

## 8. Appendix: rationale

* **Cloudflare Workers** give <100 ms cold-start and free concurrency; but 1 MiB bundle and 10 ms CPU per request make long Claude sessions impossible.([the-guild.dev][12])
* **GitHub Actions** supply long-running Ubuntu VMs, background `tmux`-like process control, and 2 vCPU free minutes—perfect for MCP.([engineering.0x1.company][1])
* **MCP** standardises tool calls; official servers exist for Slack, Notion, GitHub, Drive, etc., so we only orchestrate.([en.wikipedia.org][2], [mcpmarket.com][8])

---

### You now have every piece—copy the skeletons, add credentials, and hit **“Create pull request”**.

[1]: https://engineering.0x1.company/articles/claude-slack-bot-with-mcp "分散アーキテクチャで実現するClaude Slack Bot - MCP統合とGitHub Actions連携 | ONE Engineering"
[2]: https://en.wikipedia.org/wiki/Model_Context_Protocol?utm_source=chatgpt.com "Model Context Protocol"
[3]: https://dev.to/seratch/running-slack-app-on-cloudflare-workers-3hhn?utm_source=chatgpt.com "Running Slack App on Cloudflare Workers - DEV Community"
[4]: https://api.slack.com/authentication/verifying-requests-from-slack?utm_source=chatgpt.com "Verifying requests from Slack"
[5]: https://developers.cloudflare.com/workers/examples/signing-requests/?utm_source=chatgpt.com "Sign requests - Workers - Cloudflare Docs"
[6]: https://gist.github.com/phistrom/3d691a2b4845f9ec9421faaebddc0904?utm_source=chatgpt.com "Function to verify X-Slack-Signature header in a Cloudflare Worker"
[7]: https://github.com/anthropics/claude-code-action?utm_source=chatgpt.com "anthropics/claude-code-action - GitHub"
[8]: https://mcpmarket.com/server/slack?utm_source=chatgpt.com "Slack MCP Server: Integrate Slack with Claude & MCP - MCP Market"
[9]: https://apidog.com/blog/slack-mcp-server/?utm_source=chatgpt.com "How to Use Slack MCP Server Effortlessly - Apidog"
[10]: https://slack.com/marketplace/A04KGS7N9A8-claude?utm_source=chatgpt.com "Claude | Slack Marketplace"
[11]: https://runbear.io/use-cases/Slack-MCP-Client-Run-Claude-with-MCP-directly-in-Slack?utm_source=chatgpt.com "Slack MCP Client — Run Claude with MCP directly in Slack - Runbear"
[12]: https://the-guild.dev/graphql/hive/blog/slack-bot-with-cloudflare?utm_source=chatgpt.com "Building Slack Bot with Cloudflare Workers - GraphQL (The Guild)"
[13]: https://medium.com/slack-developer-blog/building-a-slack-bot-using-cloudflare-workers-57184b7b6276?utm_source=chatgpt.com "Building a Slack bot using Cloudflare Workers - Medium"
[14]: https://kymidd.medium.com/lets-do-devops-building-a-slack-bot-with-ai-capabilities-from-scratch-ca4c8f9ca78b?utm_source=chatgpt.com "Let's Do DevOps: Building a Slack Bot with AI Capabilities — From ..."

