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

### 1. Configure credentials

Create (or edit) `servers/rierino-mcp/.env`:

```env
RIERINO_BASE_URL=https://your-instance.rierino.com
RIERINO_USERNAME=your-username
RIERINO_PASSWORD=your-password
```

Add `servers/rierino-mcp/.env` to your `.gitignore`.

### 2. Project root `.env`
Create a `.env` file in your **project root** (next to `.mcp.json`) with:

```env
RIERINO_UI_BASE_URL=https://your-instance.rierino.com
```

This is used by Claude to generate direct links to UI records (e.g. `${RIERINO_UI_BASE_URL}/app/design/common/ui?id={id}`).

Add `.env` to your `.gitignore`.

### 3. Add mcp server for the proxy

In your `.mcp.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rierino": {
      "command": "node",
      "args": ["[PATH]/servers/rierino-mcp/proxy.js"]
    }
  }
}
```

No `npm install` or build step — `proxy.js` has zero external dependencies.

### 4. Verify

```
> /rierino-status
> /rierino-mcp tools
```

---

## What's included

```
rierino-claude-plugin/
├── .env                                    UI url (gitignore this)
├── .claude-plugin/
│   └── plugin.json                         Plugin manifest (v1.0.0)
│
├── servers/rierino-mcp/
│   ├── proxy.js                            MCP stdio proxy (zero dependencies)
│   └── .env                                Credentials (gitignore this)
│
├── commands/
│   ├── rierino-status.md                  /rierino-status — health check
│   └── rierino-mcp.md                     /rierino-mcp — list MCP capabilities
│
├── agents/
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

- [ ] Set `RIERINO_BASE_URL` to your instance URL
- [ ] Set `RIERINO_USERNAME` / `RIERINO_PASSWORD`
- [ ] Set `RIERINO_UI_BASE_URL` to your UI URL
- [ ] Add proxy.js to mcpServers

---

## Troubleshooting

| Problem                       | Fix                                                          |
| ----------------------------- | ------------------------------------------------------------ |
| Login failed (401)            | Check `RIERINO_USERNAME` / `RIERINO_PASSWORD` in `.env`      |
| `python3: command not found`  | Use `node -e` or `jq` instead when parsing tokens in shell   |
| Tools not appearing in Claude | Check `.mcp.json` path; run `/rierino-mcp tools`             |
| Token errors after restart    | Expected — ephemeral key regenerated each run, re-login auto |
