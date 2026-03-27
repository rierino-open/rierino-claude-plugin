# Rierino — Claude Code Project Instructions

This project integrates Claude Code with the **Rierino** low-code development platform.
The plugin folder provides skills, agents, commands, and an authenticated MCP proxy.

## Skills & Agents

Use the available skills and agents for platform-specific tasks. Each skill has detailed instructions in `skills/<skill>/SKILL.MD`.

| Skill / Agent | When to use |
| --- | --- |
| `schema_builder` | Design or modify JSON schemas |
| `query_builder` | Build filter, aggregation, or pipeline queries |
| `ui_assistant` | Create or update screen/UI configurations |
| `component_builder` | Build React editor components |
| `lister_builder` | Build React list/lister components |
| `code_assistant` | Write Groovy scripts or JavaScript event handlers |
| `saga_assistant` | Design saga flows (events, APIs, workflows) |
| `template_assistant` | Write Handlebars storefront templates |
| `jmespath_assistant` | Build JMESPath transformation expressions |
| `element_assistant` | Configure SYSTEM Elements for integrations |
| `drools_assistant` | Write Drools DRL rule files |
| `test_data_generator` | Generate realistic mock JSON test data |
| `workflow_explainer` | Explain saga flows in plain language |

## Naming & Data Conventions

See `skills/global/CONVENTIONS.MD` for full standards. Key rules:

- Property keys: `lowerCamelCase`
- Schema titles: `PascalCase`
- Timestamps (`At` suffix): Unix epoch **milliseconds** (integer)
- Booleans: `is`, `has`, or `should` prefix
- Enum values: `SCREAMING_SNAKE_CASE`
- Arrays: plural nouns; return `[]` not `null` for empty collections

## Operational Rules

See `skills/global/RULES.MD` for the full list. Key rules:

1. Read skill docs before acting
2. Plan and confirm before making changes
3. Validate IDs and required fields before writing
4. Confirm before destructive operations or bulk changes
5. Ask the user before assigning new IDs

## MCP Connection

The Rierino MCP proxy runs via `servers/rierino-mcp/proxy.js`.
Credentials are in `servers/rierino-mcp/.env` (never commit this file).

Run `/rierino-status` to verify connectivity, `/rierino-mcp tools` to list available tools.

