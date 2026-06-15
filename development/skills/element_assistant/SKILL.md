# SKILLS.MD: Element Assistant

## Description
Configuration generator for Rierino SYSTEM type Elements — configuration components that grant microservices access to external systems, databases, APIs, and more. Produces valid Element JSON objects with correct settings derived from the platform's element catalog. Use this skill whenever the user asks to create, modify, or configure a system element, external integration, database connection, API connector, or service binding — including REST APIs, ERPs, CRMs, message brokers, or any external system the platform connects to. Also trigger when the user mentions system settings, connection parameters, authentication configuration, or element types like REST, MongoDB, Kafka, etc.

## Triggers
* Requests to create or modify SYSTEM elements or external system integrations.
* Requests to configure database connections, API connectors, or service bindings.
* Mentions of system types (REST, MongoDB, Elasticsearch, Kafka, etc.) in a configuration context.
* Mentions of element settings, authentication methods, connection URLs, or credentials placeholders.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All property keys and naming conventions must follow **`CONVENTIONS.MD`**.

---

## Pre-Generation Step: Fetch Element Catalog

Before generating any element configuration, you **must** fetch the available element type catalog from the Rierino API.

| Resource | Call | Returns |
| --- | --- | --- |
| **Element Type Catalog** | **`State_GetAll_element_parameter_write`** tool on rierino MCP server | List of available system types, their descriptions, and configurable `settings` schemas (including conditional rules like `allOf` / `if` / `then`) |

**Rules:**
- **Never invent or assume system types** — only use types returned by the catalog.
- **Never invent settings keys** — only use parameter names defined in the matched catalog entry's schema, including base `properties` and any additional properties activated by conditional rules.
- If the call fails, inform the user and do not proceed with guessed values.

---

## Core Behavior & Logic

### 1. System Type Selection
- If the user requests an external system like an ERP, CRM, or third-party API, the system type is **REST**.
- If you cannot determine the system type from context, default to **REST**.
- Only use system types returned by the element catalog.

### 2. Element ID Format
- The `id` must follow the pattern `system-[normalized_name]-0001`.
- Normalize the name: lowercase, replace spaces with underscores.
- Example: `system-mongo_master-0001`, `system-sap-0001`.

### 3. Data Type
- The `type` field inside `data` must always be `"SYSTEM"`.

### 4. Settings Construction
- The `settings` array must only include parameters allowed by the matched catalog entry's schema.
- Emit all **required** fields, the field `type`, and any fields explicitly provided by the user.
- Do **not** emit optional fields unless they are explicitly provided by the user, required by an active conditional rule, or needed because the catalog defines a default value that must be materialized.
- If REST is chosen, check for authentication method and follow the `if` / `then` instructions from the catalog schema strictly.

### 5. Parameter Values & Placeholders
- Infer values from user input when provided.
- For values not provided, use descriptive placeholders:
  - **Sensitive data** (credentials, secrets): `#{{rierino.system.[system alias].[field]}}`
  - **Non-sensitive data** (URLs, names): `${{rierino.system.[system alias].[field]}}`

### 6. Pattern Parameters
- When the catalog schema contains pattern parameters such as `x.[name]` or `x.*`, treat them as templates for concrete setting names.
- Instantiate them only when the user provides a real key-value pair.
  - `header.[header]` → `header.Authorization`
  - `client.[property]` → `client.async.threadPoolSize`
  - `auth.claim.*` → `auth.claim.user`
- **Never** emit wildcard placeholders like `[header]`, `[property]`, or `*` literally in the final JSON.

### 7. Authentication Settings
- Use method-specific `auth.*` settings for authentication whenever they are available in the matched catalog schema.
- Do **not** replace them with `header.[header]` authentication headers.

---

## Output Schema

```json
{
  "id": "system-[name]-0001",
  "data": {
    "type": "SYSTEM",
    "name": "[Descriptive Name]",
    "description": "[Logical description of what this element connects to]",
    "settings": [
      {
        "name": "[param_key]",
        "value": "[param_value]"
      }
    ]
  }
}
```

---

## Output Format Constraints
1. **NO Markdown Code Fences:** Do not wrap the response in ` ```json ` or ` ``` `.
2. **NO Prose:** Do not include introductory text, explanations, greetings, or commentary.
3. **Raw JSON Only:** Respond with the JSON object and nothing else.

---

## Example

**Prompt:** *"Create a SYSTEM element for our SAP sandbox, the URL is https://sandbox.api.sap.com"*

**Expected Output:**
```json
{
  "id": "system-sap-0001",
  "data": {
    "type": "SYSTEM",
    "name": "SAP",
    "description": "Integration with SAP sandbox environment",
    "settings": [
      {
        "name": "type",
        "value": "rest"
      },
      {
        "name": "url",
        "value": "https://sandbox.api.sap.com"
      }
    ]
  }
}
```

---

## Forbidden Actions
- ❌ Never invent or assume settings keys outside of the catalog schema for the selected system type.
- ❌ Never use a type other than `"SYSTEM"` in the `data.type` field.
- ❌ Never omit required fields (`id`, `data.type`, `data.name`, `data.description`, `data.settings`).
- ❌ Never use uppercase or spaces in the `id` field.
- ❌ Never wrap output in markdown code fences, prose, or explanation.
- ❌ Never disregard the props corresponding to the selected system type from the catalog.
- ❌ Never emit wildcard or pattern placeholders literally (e.g., `[header]`, `*`) — always instantiate with real names.
- ❌ Never skip the catalog fetch step — always call the API for the element catalog before generating output.