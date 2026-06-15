# SKILLS.MD: Component Builder

## Description
React component generator for the Rierino Low-Code page builder. Produces ready-to-paste UI editor components that embed into Rierino pages. Use this skill whenever the user asks to create, modify, or fix an editor component, a widget editor, a property panel control, or any React-based input component intended for the Rierino page builder — even if they don't say "editor" explicitly but the context involves configuration UI.

## Triggers
* Requests to build editor components for the Rierino page builder.
* Requests for React input controls that use `data` / `onChange` patterns.
* Mentions of `LabeledEditor`, `EditorProducer`, or `Rie-` CSS class names.
* Requests to create property editors, settings panels, or config forms for widgets.

## Tools
* You can use **`State_Get_component_write`** tool on rierino MCP server to read existing definition for a mentioned component.
* You can use a tool on rierino MCP server to create, update or delete the component you defined. But, you MUST get user's approval for your component before saving any changes. Always provide the path to updated component for the user to view inside browser, by presenting **``${RIERINO_UI_BASE_URL}/app/design/common/component?id={id}``** unless you deleted it.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All data paths and property keys must follow **`CONVENTIONS.MD`**.

---

## Core Behavior & Logic

### 1. LabeledEditor Wrapper
- Wrap editor components with `<LabeledEditor>` imported from:
  `import LabeledEditor from "components/editors/LabeledEditor";`
- Spread incoming props onto it: `<LabeledEditor {...props}>`
- To initialize collapsed, add: `collapse="collapsed"` to `<LabeledEditor>`

### 2. Data Handling (`data` and `onChange`)
- Use `props.data` for displaying the current value.
- Call `props.onChange(newValue)` when the value changes.
- Do **not** use local `useState` for the main `data` prop unless handling high-frequency updates (e.g., live color pickers) — in that case, implement throttle/debounce before calling `props.onChange`.

### 3. Sandbox Environment & Imports
- Write JavaScript only — **no TypeScript**.
- Import external packages from `esm.sh` **without** `https://`:
  `import _ from "esm.sh/lodash";`
- Import React and hooks directly:
  `import React from "react";`
  `import { useState, useEffect } from "react";`

### 4. Styling
- Use `Rie-` prefixed CSS class names (e.g., `Rie-input`, `Rie-button`).
- Place all custom styles inside a `<style>` tag rendered within the component.
- Use highly specific, component-scoped class names to avoid conflicts with other editors on the same page.

### 5. Component Structure
- Use functional React components only.
- Always use `export default YourComponentName;`

---

## Output Format Constraints
To ensure the output can be pasted directly into the Rierino IDE:
1. **NO Markdown Code Fences:** Do not wrap the response in ` ```jsx ` or ` ``` `.
2. **NO Prose:** Do not include introductory text, explanations, greetings, or "Here is your component."
3. **Raw Code Only:** Respond with the component code and nothing else.

---

## Example

**Prompt:** *"I need a text editor that accepts string, number, or integer data. The data type will be provided by a `valueType` prop."*

**Expected Output:**
```
import React from "react";
import LabeledEditor from "components/editors/LabeledEditor";

function TextEditor(props) {
  const { data, onChange, valueType } = props;
  const isNumericType = valueType === "integer" || valueType === "number";

  const handleChange = (e) => {
    let value = e.target.value;
    if (value === "") {
      value = undefined;
    } else if (valueType === "integer") {
      const parsedInt = parseInt(value, 10);
      value = isNaN(parsedInt) ? undefined : parsedInt;
    } else if (valueType === "number") {
      const parsedNum = Number(value);
      value = isNaN(parsedNum) ? undefined : parsedNum;
    }
    onChange(value);
  };

  return (
    <LabeledEditor {...props}>
      <input
        className="Rie-input Rie-input-text"
        type={isNumericType ? "number" : "text"}
        value={data === undefined ? "" : data}
        onChange={handleChange}
        {...(valueType === "number" && { step: "any" })}
        {...(valueType === "integer" && { step: "1" })}
      />
    </LabeledEditor>
  );
}

export default TextEditor;
```

---

## Forbidden Actions
- ❌ Never output text, greetings, or explanations outside the code.
- ❌ Never use TypeScript — JavaScript only.
- ❌ Never include `https://` in `esm.sh` import paths.
- ❌ Never manage the primary `data` prop with `useState` without a throttle/debounce justification.
- ❌ Never define or hardcode the `label` prop — it is injected by `EditorProducer` via `props`.
- ❌ Never answer questions about backend logic, data fetching, non-Rierino components, or general JavaScript.
- ❌ Never use generic CSS class names — always prefix with `Rie-` and make them component-specific.
- ❌ Never provide markdown wrappers around the code output.