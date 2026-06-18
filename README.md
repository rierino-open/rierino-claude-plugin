# Rierino Claude Plugin

Connect [Claude Code](https://claude.ai/code) to the [Rierino](https://rierino.com) low-code development platform. The plugin provides skills, agents, commands, and an authenticated MCP proxy for platform operations.

---

## Installation

### Claude Code (CLI)

Claude Code supports plugins via the **Marketplace** feature. There are two ways to install:

#### Option A — Add the marketplace, then install the plugin

1. Open Claude Code in your terminal.
2. Run `/plugins` to open the plugin manager.
3. Add the marketplace source:
   ```
   https://raw.githubusercontent.com/rierino-open/rierino-claude-plugin/main/.claude-plugin/marketplace.json
   ```
4. Find **rierino-development** in the list and click **Install**.

#### Option B — Install directly from the plugin URL

1. Open Claude Code in your terminal.
2. Run `/plugins` and choose **Add Plugin from URL**.
3. Enter the plugin source URL:
   ```
   https://raw.githubusercontent.com/rierino-open/rierino-claude-plugin/main/development/.claude-plugin/plugin.json
   ```

### Claude Desktop

1. Open **Claude Desktop**.
2. Go to **Settings → Extensions** (or **Plugins**, depending on your version).
3. Click **Add Marketplace** and paste:
   ```
   https://raw.githubusercontent.com/rierino-open/rierino-claude-plugin/main/.claude-plugin/marketplace.json
   ```
4. Locate **rierino-development** and click **Install**.

---

## Updating

When a new version is published to this repository, Claude Code shows an **Update** button in the plugin manager. Click it to pull the latest version.

> If the Update button does not work, follow the troubleshooting steps below.

---

## Troubleshooting

### Update button does nothing / plugin does not reflect new changes

Claude Code caches plugin files locally. If the **Update** button fails or the plugin still behaves like an older version after updating, work through these steps in order:

**Step 1 — Remove and reload the plugin**

1. Open `/plugins` in Claude Code.
2. Find **rierino-development** and click **Remove** (or **Uninstall**).
3. Re-add the plugin using one of the installation methods above.

**Step 2 — Restart Claude**

Close Claude Code (or Claude Desktop) completely and reopen it. On some systems the plugin cache is only cleared on a fresh start.

**Step 3 — Remove and reload the marketplace**

If the plugin still does not update correctly, the marketplace index itself may be cached:

1. Open `/plugins` and remove the **rierino-plugins** marketplace entry.
2. Restart Claude.
3. Re-add the marketplace URL:
   ```
   https://raw.githubusercontent.com/rierino-open/rierino-claude-plugin/main/.claude-plugin/marketplace.json
   ```
4. Reinstall the **rierino-development** plugin.

### MCP proxy not connecting

- Check that credentials are present in `development/servers/rierino-mcp/.env`.
- Run `/rierino-status` to see a connectivity summary.
- Run `/rierino-mcp tools` to list available MCP tools and confirm the proxy is reachable.

### Plugin commands not available

- Confirm the plugin is listed as **Installed** in `/plugins`.
- Restart Claude after installation — commands are registered at startup.

---

## What's Included

| Component | Description |
|---|---|
| **Agents** | Specialized agents: `schema_builder`, `query_builder`, `ui_assistant`, `component_builder`, `lister_builder`, `code_assistant`, `saga_assistant`, `template_assistant`, `jmespath_assistant`, `element_assistant`, `drools_assistant`, `test_data_generator`, `workflow_explainer`, `ai_agent_assistant` |
| **Commands** | `/rierino-status`, `/rierino-mcp` |
| **MCP Proxy** | Authenticated proxy to Rierino REST APIs |

---

## Resources

- [Rierino Platform](https://rierino.com)
- [Rierino Documentation](https://docs.rierino.com)
- [Plugin Source on GitHub](https://github.com/rierino-open/rierino-claude-plugin)
