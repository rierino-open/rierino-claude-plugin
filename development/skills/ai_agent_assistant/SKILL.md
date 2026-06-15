# SKILLS.MD: AI Agent Assistant

## Description
GenAI agent record generator for the Rierino core platform. Translates a user's natural-language requirements — the agent's role, purpose, desired behavior, and model settings — into a single production-ready, schema-compliant agent configuration JSON object. The generated record is fully populated with model parameters, memory strategy, tool sagas, a complete set of proportional guardrails, and a specialist system prompt written directly to the agent. Use this skill whenever the user asks to create, modify, debug, or improve a GenAI agent, assistant, bot, copilot, or LLM-backed system prompt — even if they don't say "agent" explicitly but the context involves configuring an LLM to play a role, follow instructions, call tools, or run inside the Rierino platform. Also trigger when the user mentions agent instructions, guardrails, risk policies, tool sagas, memory strategy, or model settings (model name, temperature, response format).

## Triggers
* Requests to create or modify a GenAI agent, assistant, bot, or copilot record.
* Requests to write or repair an agent's instructions / system prompt for a specific role and domain.
* Requests to configure model settings (model name, temperature, response format), memory strategy, or allowed audiences for an agent.
* Mentions of guardrails, risk policy, input/output guardrails, tool-response guardrails, jailbreak protection, PII masking, or tool sagas.
* Requests to attach business flows (tool sagas) to an agent or restrict what tools an agent may execute.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All data paths, identifiers, and property keys must follow **`CONVENTIONS.MD`**.

---

## Pre-Generation Step: Fetch Available Saga Catalog

Before generating any agent that uses tools, you **must** fetch the catalog of sagas (flows that can be used as tools in Rierino) available. Always start by retrieving the available sagas. If the user specified any specific runner for the AI agent, filter these sagas using the runner from the agent's `allowedFor` array.

Use the appropriate tool with the following calls:

| Resource | Call | Returns |
| --- | --- | --- |
| **Saga Catalog** | List sagas available for AI agents | Saga `id`, `data.name`, `data.description`, and `data.steps` — used to populate `data.parameters.toolSagas` |
| **Existing Agent** | Read an existing agent by ID | The current agent record, when modifying or improving an agent rather than creating one |

**Rules:**
- **Never invent saga IDs** — only use saga `id` values returned from the catalog. If none apply, use `[]`.
- When tool sagas are needed but unspecified by the user, select appropriate saga IDs from the fetched catalog.
- If a call fails, inform the user and do not proceed with guessed values.

## Tools
* You can use **`State_Get_genai_model_write`** tool on the rierino MCP server to read an existing agent for a mentioned role or flow.
* You can use **`Saga_sagas`** tool on the rierino MCP server to fetch the available saga catalog when you need valid IDs for `toolSagas`. This is only required if the user wants the agent to execute some actions as tools.
* You can use a tool on the rierino MCP server to create, update, or delete the agent you defined. But, you **MUST** get the user's approval for your agent before saving any changes. Always provide the path to the saved agent for the user to view inside the browser, by presenting **``${RIERINO_UI_BASE_URL}/app/ds/common/genai_model?id={id}``** unless you deleted it.

---

## Core Behavior & Logic

### 1. Information Sufficiency
- Always determine whether enough information exists before generating an agent.
- Always derive missing information from what is given, or fall back to the defined defaults.
- Never invent critical information unless the user explicitly asks for defaults.
- Never mix clarifying questions and JSON in the same response. If information is incomplete, derive it; if you must ask, ask **without** emitting JSON.

### 2. Instruction Voice
- Always write generated instructions **directly to the agent** (second person), never as a description of the agent.
- ✅ Good: `You are an expert SQL engineer. Always validate SQL before responding.`
- ❌ Bad: `This agent acts as a SQL engineer. The agent should validate SQL before responding.`

### 3. Guardrail Mandate
- Always generate complete, mandatory guardrails proportional to the agent's capabilities and risk level.
- Jailbreak protection and a risk policy are **always** present.

---

## Agent JSON Schema

Every agent must be a single JSON object with this structure:

```json
{
  "id": "string — unique identifier, recommended format {role}_assistant (e.g. sales_assistant)",
  "data": {
    "name": "string — human-readable agent name (e.g. Sales Assistant)",
    "description": "string — one-paragraph summary of the agent's purpose",
    "tags": ["string — relevant tags (e.g. sales, crm, customer-support)"],
    "version": "string — version string, default \"0\"",
    "status": "string — agent status, default \"A\"",
    "domain": "string — the folder the agent lives in (e.g. development, training, content)",
    "allowedFor": ["string — runner IDs the agent runs on; leave empty unless specified by user"],
    "icon": "string — agent icon; leave empty unless specified by user",
    "parameters": {
      "class": "string — component type, default io.rierino.rai.openai.OpenAiChatModel",
      "methods": "object — model configuration (see methods default)",
      "memory": "string — state to store memory in, default genai_memory",
      "toolSagas": ["string — saga IDs the agent may execute for custom business flows"],
      "guardrails": "object — guardrails configuration (see Guardrails)",
      "instructions": "string — production-ready specialist system prompt (see Generated Instructions)"
    }
  }
}
```

### ID Assignment
- Derive `id` using the recommended format `{role}_assistant` (e.g. `sales_assistant`) unless the user provides one.
- If the user provided an existing agent with an already-assigned `id`, **do not change** its value.

### `data.parameters.methods` default

For the default `io.rierino.rai.openai.OpenAiChatModel` class, the following default values should be used. If the user specifies a different chat model class, leave empty:

```json
{
  "apiKey": ["#{{rierino.system.openai.apikey}}"],
  "model": "gpt-5.4",
  "temperature": "1"
}
```

**NOTE:** `io.rierino.rai.openai.OpenAiChatModel` can be used by any provider that has OpenAI compatible APIs. For non OpenAI providers, you need to add a `baseUrl` parameter to methods, which should point to the OpenAI compatible base URL of such provider.


---

## Guardrails

Guardrails prevent prompt injection and jailbreaks, prevent sensitive-data leakage, protect and validate tool execution, enforce domain-specific safety, and reduce hallucinations in high-risk domains. Keep them proportional: lightweight for simple informational agents, stronger for tool-enabled and business-critical agents. Prefer masking over blocking when safe, and `REPROMPT` over `BLOCK` for recoverable output issues.

Always generate this complete structure:

```json
{
  "riskPolicy": {
    "blockOnLevelCounts": "object - key-value pairs identifying how many rules should be triggered per risk level to block a content",
    "criticalAutoBlock": "boolean - whether CRITICAL findings should always block"
  },
  "inputGuardrails": ["object - list of rules to apply on user sent messages - e.g. for protecting against prompt injection"],
  "toolResponseGuardrails": ["object - list of rules to apply on tool generated responses - e.g. to mask sensitive data from data tools"],
  "outputGuardrails": ["object - list of rules to apply on AI generated messages - e.g. to block AI from generating irrelevant / unsecure response"]
}
```

Each guardrail can be configured to apply a specific restriction on its input:

| Action | When to use |
| --- | --- |
| `BLOCK` | Severe violations; CRITICAL and (typically) HIGH findings |
| `MODIFY` | When the offending information can be safely masked |
| `REPROMPT` | Recoverable output issues the model can fix on a second pass |

### Guardrail Configurations

Each guardrail type can be configured to include multiple entries for protecting against malicious inputs, outputs and tools. While Rierino provides a flexible set of configurations for guardrails, always use the following as the starting point for the users:

```json
{
  "riskPolicy": {
    "blockOnLevelCounts": {"MEDIUM": 3, "HIGH": 2},
    "criticalAutoBlock": true
  },
  "inputGuardrails": [
    {"preset": "jailbreak-basic", "action": "BLOCK", "riskLevel": "HIGH"},
    {"preset": "pii-basic", "action": "MODIFY", "riskLevel": "HIGH"}
  ],
  "toolResponseGuardrails": [],
  "outputGuardrails": []
}
```

For use cases where security and privacy is more important, switch to "-extended" versions of these presets (i.e. pii-extended, jailbreak-extended) and use "CRITICAL" risk level instead.

---

## Generated Instructions (`data.parameters.instructions`)

Generate a production-ready, specialist system prompt for the requested role and domain. Write **directly to the agent**. Avoid generic AI-assistant language ("be helpful"); prefer explicit operational rules over descriptions; include domain-specific constraints, output contracts, and validation checklists where appropriate.

Use markdown and follow this section structure as H2 level (don't include any H1):

| Section | Required? | Defines |
| --- | --- | --- |
| Role & Expertise | Mandatory | identity, expertise, specialization, authority |
| Core Behavior | Mandatory | operational behavior using `Always` / `Never` / `Prefer` / `Avoid` |
| Domain Rules | Mandatory | role-specific operating rules |
| Tool Usage Rules | When tools are relevant | when to use / not use tools, validation, ordering |
| Output Format | When formatting matters | response structure; required and forbidden formatting |
| Validation Checklist | For technical / structured / high-impact output | self-review steps |
| What Not To Do | Mandatory | prohibited behaviors |

### Domain Rules examples

| Role | Example domain rules |
| --- | --- |
| SQL Agent | Prefer ANSI SQL; avoid `SELECT *`; use explicit `JOIN` syntax |
| Java Agent | Use Java 21 syntax; prefer records where appropriate; avoid deprecated APIs |
| Content Writer | Write for the target audience; avoid marketing clichés; prioritize clarity |
| JMESPath Expert | Always use supported functions; never invent syntax |

---

## Validation Checklist

Before returning an agent, verify:

1. Required and nested fields exist.
2. Arrays contain the correct types.
3. The JSON is valid.
4. Instructions are non-empty.
5. `memory` is defined.
6. `toolSagas` is present.
7. `icon` is present.
8. The `guardrails` object exists and contains `riskPolicy`, `inputGuardrails`, `toolResponseGuardrails`, and `outputGuardrails`; tool-enabled agents include tool response guardrails; sensitive domains include PII protection; jailbreak protection and a risk policy are always present.
9. Generated instructions follow the required structure and is formatted as markdown.

If any check fails, repair the object before returning it.

---

## Forbidden Actions
- ❌ Never invent critical information unless the user explicitly asks for defaults.
- ❌ Never invent saga IDs not present in the fetched catalog, and never guess or alter a runner ID.
- ❌ Never write agent descriptions in place of agent instructions, and never use third person ("this agent…") in generated instructions.
- ❌ Never omit guardrails, the risk policy, or jailbreak protection.
- ❌ Never expose secrets, API keys, tokens, credentials, or internal infrastructure details.
- ❌ Never produce generic chatbot prompts instead of specialist, role-specific ones.
- ❌ Never change an existing agent's `id` when modifying a user-provided agent.
- ❌ Never save (create, update, or delete) an agent without the user's approval.
- ❌ Never return an object that fails the validation checklist — repair it first.