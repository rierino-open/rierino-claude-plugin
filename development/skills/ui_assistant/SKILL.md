# SKILLS.MD: UI Assistant

## Description
UI screen configuration generator for the Rierino Low-Code page builder. Produces valid tab-based layout JSON using the Rierino widget system. Use this skill whenever the user asks to create, modify, or design a screen layout, editor page, form configuration, tab layout, or widget arrangement for a Rierino screen — even if they don't say "screen" explicitly but the context involves arranging editor widgets into tabs and grids. Also trigger when the user mentions widget placement, grid columns, tab organization, or field-to-widget binding.

## Triggers
* Requests to build or modify screen/page configurations for the Rierino.
* Requests to lay out editor widgets in tabs, grids, or rows.
* Mentions of widget IDs, `gridProps`, `props.label`, `path` bindings, or tab layouts.
* Requests to design forms, detail pages, or settings panels from a data schema.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All data paths and property keys must follow **`CONVENTIONS.MD`**.

---

## Pre-Generation Step: Fetch Available Resources

Before generating any screen configuration, you **must** fetch three resource catalogs from the rierino MCP server using **`Saga_component`** tool. The output contains the widget definitions, data sources, and option lists available for the current environment.

**Rules:**
- **Never invent or assume widget IDs** — only use widgets returned by the catalog.
- **Never fabricate source or option IDs** — only reference IDs returned by the respective calls.
- Configure widget editors strictly using the parameter definitions listed in each widget's `props` schema from the catalog.
- If a call fails, inform the user and do not proceed with guessed values.

## Tools
* You can use **`State_Get_ui_write`** tool on rierino MCP server to read existing ui for a mentioned business domain.
* You can also use **`State_Get_schema_write`** tool on rierino MCP server to fetch data schema for the UI you are about to create or edit to understand the data paths to be used in configuring widgets.
* You can use a tool on rierino MCP server to create, update or delete the ui you defined. But, you MUST get user's approval for your ui before saving any changes. Always provide the path to updated ui for the user to view inside browser, by presenting **``${RIERINO_UI_BASE_URL}/app/design/common/ui?id={id}``** unless you deleted it.

---

## Core Behavior & Logic

### 1. Widget Configuration
- Always set a human-readable label on every widget using `props.label`.
- Configure widget `props` strictly according to the schema returned by the widget catalog.
- Bind every widget's `path` exclusively to a valid path from the user-provided data schema — never fabricate paths.

### 2. Grid Layout (12-Column System)
- Each tab must have exactly **one** grid (the `grids` array contains exactly one object).
- Widget `gridProps.sm` values within each row must **sum to 12** (e.g., two widgets at 6, or one at 6 and two at 3).
- Never place a widget on its own row if complementary widgets can fill remaining space up to 12 columns.
- Only allow a single widget to span `sm: 12` if it explicitly requires full-row width (e.g., rich text editors, large tables).
- Group logically related fields on the same row where space allows.

### 3. Tab Organization
- Each tab must have a meaningful, concise `tab` label reflecting its content domain.
- Group fields into tabs by logical domain (e.g., "General Info", "Pricing", "Contact Details").

### 4. Reserved Fields
- Never include an editor for the `id` field — it has its own dedicated built-in editor.

---

## Output Schema

The output must be a single, raw, valid JSON object matching this structure:

```json
{
  "id": "ID of the UI",
  "data": {"tabs": [
    {
      "tab": "string — label of the tab",
      "grids": [
        {
          "contents": [
            {
              "widget": "string — widget ID from catalog",
              "path": "string — JSON path to the data field",
              "props": {
                "label": "string — human-readable field label"
              },
              "valueProps": {},
              "gridProps": {
                "sm": "integer (1–12) — column width, rows must sum to 12"
              }
            }
          ]
        }
      ]
    }
  ]}
}
```

---

## Output Format Constraints
1. **NO Markdown Code Fences:** Do not wrap the response in ` ```json ` or ` ``` `.
2. **NO Prose:** Do not include introductory text, explanations, greetings, or commentary.
3. **Raw JSON Only:** Respond with the JSON object and nothing else.

---

## Example

**Prompt:** *"Create a screen with two tabs for registering persons: 'General Info' and 'Contact Details'. Use the data schema with fields: name, age, email, phone, address."*

**Expected Output:**
```json
{
  "id": "person",
  "data": {"tabs": [
    {
      "tab": "General Info",
      "grids": [
        {
          "contents": [
            {
              "widget": "TextEditor",
              "path": "data.name",
              "props": { "label": "Name" },
              "gridProps": { "sm": 6 }
            },
            {
              "widget": "TextEditor",
              "path": "data.age",
              "props": { "label": "Age", "valueType": "number" },
              "gridProps": { "sm": 6 }
            }
          ]
        }
      ]
    },
    {
      "tab": "Contact Details",
      "grids": [
        {
          "contents": [
            {
              "widget": "TextEditor",
              "path": "data.email",
              "props": { "label": "Email" },
              "gridProps": { "sm": 6 }
            },
            {
              "widget": "TextEditor",
              "path": "data.phone",
              "props": { "label": "Phone" },
              "gridProps": { "sm": 6 }
            },
            {
              "widget": "TextEditor",
              "path": "data.address",
              "props": { "label": "Address" },
              "gridProps": { "sm": 12 }
            }
          ]
        }
      ]
    }
  ]}
}
```

---

## Forbidden Actions
- ❌ Never wrap output in markdown code fences, prose, or explanation.
- ❌ Never use widget IDs not returned by the widget catalog.
- ❌ Never reference source or option IDs not returned by the respective resource calls.
- ❌ Never reference data paths that don't exist in the user-provided schema.
- ❌ Never leave `props.label` empty or omit it entirely.
- ❌ Never let row column widths exceed or fall short of 12 without justification.
- ❌ Never include more than one object in the `grids` array per tab.
- ❌ Never include an editor for the `id` field — it has its own dedicated built-in editor.
- ❌ Never skip the resource fetch step — always call the API for components, sources, and options before generating output.