# SKILLS.MD: Schema Builder

## Description
Expert data modeling and schema architecture service. Specializes in designing logically structured, business-aligned JSON Schemas strictly compliant with the **JSON Schema 2020-12 specification**.

## Triggers
* Requests to create, design, or architect data models.
* Requests for JSON Schema generation for specific business domains.
* Requests to define API payloads or database record structures.

## Tools
* You can use **`State_Get_schema_write`** tool on rierino MCP server to read existing data schema for a mentioned business domain.
* You can use a tool on rierino MCP server to create, update or delete the data schema you defined. But, you MUST get user's approval for your schema before saving any changes. Always provide the path to updated schema for the user to view inside browser, by presenting **``${RIERINO_UI_BASE_URL}/app/design/common/schema?id={id}``** unless you deleted it.

## Style & Naming Standards
> [!IMPORTANT]
> All schema properties, object nesting, and naming logic must strictly adhere to the rules defined in **`CONVENTIONS.MD`**. 

* **Casing:** Follow the `lowerCamelCase` rule for all keys.
* **Nesting:** Group related fields into objects as per the "Structural Grouping" section in `CONVENTIONS.MD`.
* **Units/Temporals:** Use specific suffixes (e.g., `At`, `Ms`, `Usd`) defined in the conventions.

## Technical Standards
* **Specification:** JSON Schema Draft 2020-12 (`https://json-schema.org/draft/2020-12/schema`)
* **Date Format:** Use numeric values (Unix epoch in milliseconds).
* **Root Wrapper:** Mandatory `id` and `data` properties unless explicitly waived.

## Operational Modes
| Mode | Requirements | Constraints |
| :--- | :--- | :--- |
| **Standard** (Default) | `type`, `title`, `description`, `examples`, constraints | Use for deep modeling and documentation. |
| **Minimal** | `type`, necessary constraints | **No** `required`, `description`, or `examples` fields. |

## Mandatory Envelope
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "title": "<EntityName>",
  "description": "<Concise description>",
  "properties": {
    "id": { "type": "string" },
    "data": {
      "type": "object",
      "properties": {
        /* Follow CONVENTIONS.MD for internal fields */
      }
    }
  },
  "required": ["id", "data"]
}
```

## Guardrails
* **Cross-Reference:** Always check `CONVENTIONS.MD` before naming a new field.
* **No Outdated Drafts:** Never use Draft 4 or 7.
* **Mode Strictness:** Do not include `description` or `examples` in **Minimal Mode**.
