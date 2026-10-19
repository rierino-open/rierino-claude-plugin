# Rierino — Claude Code Plugin

Connect Claude Code to the [Rierino](https://rierino.com) low-code development
platform. Drop this folder into your project and Claude gains full
awareness of the platform — skills, agents, commands, and an authenticated MCP
proxy — all with no build step.

## Architecture

```
Claude Code
    │
    ├── reads skills/global/CONVENTIONS.md       (naming & data standards)
    ├── reads skills/global/RULES.md             (operational rules)
    ├── reads skills/<skill>/SKILL.md            (per-task instructions)
    │
    ├── runs /commands/rierino-status            (health check)
    ├── runs /commands/rierino-mcp               (list MCP capabilities)
    │
    └── calls MCP tools ──► whatever the Rierino server registers
                                  │
                        Token vault (AES-256-GCM)
                        Auth layer (JWT login + auto-refresh)
                                  │
                          Rierino MCP Server
```

The MCP server (`proxy.js`) is a **transparent authenticated proxy** — it
forwards every JSON-RPC call straight to the Rierino server. Tools are
discovered at runtime via `tools/list`; no tool definitions live in this plugin.

Tokens are encrypted in-memory with an ephemeral AES-256-GCM key. Claude only
ever sees opaque masked handles — real JWTs never leave the proxy process.

---

## Setup

### 1. Enter your connection details

When you enable the plugin, Claude Code asks for three plugin options:

| Option | Example |
|---|---|
| Rierino base URL | `https://your-instance.rierino.com` |
| Rierino username | `admin` |
| Rierino password | stored in your system's secure credential store, never in a file |

The plugin's bundled `.mcp.json` passes these to `proxy.js`, so there is no
`.mcp.json` to edit and no path to set. It also registers the `rierino-docs`
MCP server.

To see which are set, run `claude plugin configure rierino-development@rierino-plugins`.
To change them (base URL and username are also editable in `/config`):

```bash
echo '{"base_url":"https://your-instance.rierino.com","username":"admin","password":"..."}' \
  | claude plugin configure rierino-development@rierino-plugins --values-stdin
```

> **Security note:** Do **not** store credentials in `servers/rierino-mcp/.env`
> or anywhere inside the plugin or project folder — Claude can read files there.
> `proxy.js` still reads a `.env` as a fallback for running it by hand.

#### `rierino-docs` via `npx` (alternative)

The plugin connects to `rierino-docs` over HTTP, so no Node or npm is needed.
For clients that only support local (stdio) MCP servers, such as older Claude
Desktop versions, use `mcp-remote` instead:

```json
{
  "mcpServers": {
    "rierino-docs": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://docs.rierino.com/~gitbook/mcp"]
    }
  }
}
```

On native Windows (not WSL), wrap `npx` with `cmd /c`:

```json
{
  "mcpServers": {
    "rierino-docs": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "mcp-remote", "https://docs.rierino.com/~gitbook/mcp"]
    }
  }
}
```

### 2. UI links (optional)

Skills generate direct links to UI records (e.g.
`${RIERINO_UI_BASE_URL}/app/design/common/ui?id={id}`). They use the base URL
above by default. If your UI is served from a different address, create a
`.env` in your **project root** with:

```env
RIERINO_UI_BASE_URL=https://your-ui.rierino.com
```

No `npm install` or build step — `proxy.js` has zero external dependencies.

### 3. Verify

```
> /rierino-status
> /rierino-mcp tools
```

---

## What's included

```
rierino-claude-plugin/
├── .claude-plugin/
│   └── plugin.json                         Plugin manifest and options
├── .mcp.json                               MCP servers (rierino, rierino-docs)
│
├── servers/rierino-mcp/
│   └── proxy.js                            MCP stdio proxy (zero dependencies)
│
├── commands/
│   ├── rierino-status.md                  /rierino-status — health check
│   └── rierino-mcp.md                     /rierino-mcp — list MCP capabilities
│
├── agents/
│   ├── ai_agent_assistant.md              AI agents
│   ├── code_assistant.md                  Groovy & JavaScript scripting
│   ├── component_builder.md               React editor components
│   ├── drools_assistant.md                Drools rule (DRL) generation
│   ├── element_assistant.md               SYSTEM Element configurations
│   ├── jmespath_assistant.md              JMESPath expressions
│   ├── lister_builder.md                  React list/lister components
│   ├── query_builder.md                   Structured query definitions
│   ├── saga_assistant.md                  Saga flows (events, APIs, workflows)
│   ├── schema_builder.md                  JSON Schema (2020-12)
│   ├── template_assistant.md              Handlebars storefront templates
│   ├── test_data_generator.md             Mock JSON test data
│   ├── ui_assistant.md                    Screen/UI configuration
│   └── workflow_explainer.md              Plain-language saga flow explanations
│
└── skills/
    ├── global/
    │   ├── CONVENTIONS.md                 Naming & data-type standards
    │   └── RULES.md                       Operational rules (all skills)
    ├── ai_agent_assistant/SKILL.md
    ├── code_assistant/SKILL.md
    ├── component_builder/SKILL.md
    ├── drools_assistant/SKILL.md
    ├── element_assistant/SKILL.md
    ├── jmespath_assistant/
    │   ├── SKILL.md
    │   └── RIERINO_FUNCTIONS.md           122 custom JMESPath functions
    ├── lister_builder/SKILL.md
    ├── query_builder/SKILL.md
    ├── saga_assistant/SKILL.md
    ├── schema_builder/SKILL.md
    ├── template_assistant/
    │   ├── SKILL.md
    │   └── RIERINO_HELPERS.md             40+ Handlebars helpers
    ├── test_data_generator/SKILL.md
    ├── ui_assistant/SKILL.md
    └── workflow_explainer/SKILL.md
```

---

## MCP tools

Tools are registered by the Rierino server itself and discovered dynamically
at runtime. Run `/rierino-mcp tools` to see the current list.

The proxy forwards all JSON-RPC calls transparently — adding auth headers and
token masking — without defining or restricting which tools are available.

---

## Skills

All skills follow a common pattern:
- Read `CONVENTIONS.md` and `RULES.md` for global standards
- Read the skill's `SKILL.md` for task-specific instructions
- Read any `references/` files before making API calls
- Return **raw output only** (no markdown fences unless specified)

| Skill                | Trigger / purpose                                           |
| -------------------- | ----------------------------------------------------------- |
| `ai_agent_assistant` | AI agent configurations                                     |
| `code_assistant`     | Groovy scripts and JavaScript event handlers                |
| `component_builder`  | React editor components for the page builder                |
| `drools_assistant`   | Drools Rule Language (DRL) rule files                       |
| `element_assistant`  | SYSTEM Element configs for integrations                     |
| `jmespath_assistant` | JMESPath expressions for JSON transformation                |
| `lister_builder`     | React list/lister display components                        |
| `query_builder`      | Structured query definitions (SIMPLE/AGGREGATION/PIPELINE)  |
| `saga_assistant`     | Saga flow definitions (events, APIs, workflows)             |
| `schema_builder`     | JSON Schema (2020-12) definitions                           |
| `template_assistant` | Handlebars templates for storefronts                        |
| `test_data_generator`| Realistic mock JSON test data                               |
| `ui_assistant`       | Screen/UI configuration JSON (12-column grid, tabs)         |
| `workflow_explainer` | Plain-language explanations of saga flows                   |

---

## Agents

Agents are autonomous and run with `model: sonnet`, `maxTurns: 25`.
Each agent's system prompt delegates to its matching skill.

| Agent               | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `ai_agent_assistant`| Design AI agents with instructions, models           |
| `code_assistant`    | Generate and iterate on Groovy/JS scripts            |
| `component_builder` | Build complete React editor components               |
| `drools_assistant`  | Write and validate DRL rules                         |
| `element_assistant` | Scaffold SYSTEM Elements from catalog                |
| `jmespath_assistant`| Build and test JMESPath transformation pipelines     |
| `lister_builder`    | Build React list components with action handlers     |
| `query_builder`     | Compose queries with filters, aggregations, pipelines|
| `saga_assistant`    | Design and iterate on saga flow configurations       |
| `schema_builder`    | Design schemas with proper structure and conventions |
| `template_assistant`| Build defensive, interactive Handlebars templates    |
| `test_data_generator`| Generate sets of varied, realistic test records     |
| `ui_assistant`      | Generate full screen configurations from description |
| `workflow_explainer`| Explain saga flows in plain, human-readable language |

---

## Commands

| Command           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `/rierino-status` | GET `/actuator/health` + Ping — confirms connectivity |
| `/rierino-mcp`    | Calls `tools/list`, `resources/list`, etc. on the MCP server |

---

## Auth flow

```
Request → cached JWT valid? ──► yes → use it
                            └── no  → refresh token valid? ──► yes → refresh → retry
                                                             └── no  → basic auth login
401 response → clear tokens → re-auth → retry once
```

Tokens are encrypted with a randomly generated AES-256-GCM key on startup.
Outbound responses have real JWTs replaced with opaque `[TOKEN:handle]` markers.
Inbound requests from Claude have those markers swapped back before forwarding.

---

## Customization checklist

- [ ] Enter base URL, username and password when enabling the plugin
- [ ] Optionally set `RIERINO_UI_BASE_URL` in the project-root `.env` if the UI lives elsewhere

---

## Troubleshooting

| Problem                       | Fix                                                          |
| ----------------------------- | ------------------------------------------------------------ |
| Login failed (401)            | Re-enter username / password in the plugin options           |
| `python3: command not found`  | Use `node -e` or `jq` instead when parsing tokens in shell   |
| Tools not appearing in Claude | Run `/mcp` to see the server status; run `/rierino-mcp tools` |
| Token errors after restart    | Expected — ephemeral key regenerated each run, re-login auto |
