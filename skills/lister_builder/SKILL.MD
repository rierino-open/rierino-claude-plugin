# SKILLS.MD: Lister Builder

## Description
React component generator for Rierino Low-Code Lister components. Produces ready-to-paste Lister UIs that display lists of records for a specific data model and can be embedded into pages. Use this skill whenever the user asks to create, modify, or fix a Lister component — including menu listers, sidebar listers, full-page listers, Kanban boards, card grids, table views, or any React-based list/collection display intended for the Rierino page builder. Also trigger when the user mentions `itemList`, `onSelect`, `onDelete`, `onNew`, or discusses listing/browsing records in a context.

## Triggers
* Requests to build lister components for the Rierino page builder.
* Requests for list views, card grids, Kanban boards, sidebar menus, or table layouts for data.
* Mentions of `props.itemList`, `props.onSelect`, `props.onDelete`, `props.onNew`.
* Requests to create record browsers, item pickers, or navigational list panels for pages.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All data paths and property keys must follow **`CONVENTIONS.MD`**.

---

## Core Behavior & Logic

### 1. Accessing The List
- The item list is provided via `props.itemList?.list`. It is always an array.
- Each item has `id` and `data` properties, unless user has specified a different input item data model:
```jsx
props.itemList = {
  list: [
    {
      id: 123,
      data: {
        there: { could: "be" },
        any: 1,
        data: ["2"],
        inHere: true
      }
    }
  ]
}
```

### 2. Component Actions (Select, New, Delete)
- **Select**: Call `props.onSelect(id)` to open the editor or select an item. Call `props.onSelect(null)` to close the opened editor.
- **Delete**: Call `props.onDelete(wholeRecord)` to delete a record. Pass the **entire record object** (e.g., `{ id: 123, data: {...} }`), not just the ID.
- **New**: Call `props.onNew(data)` to initiate a new record, passing the initial data object as the argument.

### 3. Layout Types
Determine the appropriate layout based on the user's request:
- **Menu Lister:** A persistent sidebar menu displayed alongside the data editor detail page. May include a button to expand or collapse the menu.
- **Full-Page Lister:** A full-width and full-height layout (e.g., a Kanban board) displayed strictly on a dedicated listing page.

Regardless of layout, always fire `props.onSelect(item.id)` when an item is selected.

### 4. Detecting Editor Page State
Use the Next.js router to check if the editor page is open:
```jsx
import nextrouter from "next/router";
const useRouter = nextrouter.useRouter;

// Inside the component:
const router = useRouter();
const [, currentQueryString = ""] = (router.asPath || "").split("?");

useEffect(() => {
  const params = new URLSearchParams(currentQueryString);
  const activeItem = params.get("id");
  if (!activeItem) {
    props.onSelect(null, null, false);
  }
}, [currentQueryString]);
```

> **Note on Next.js imports:** Use sub-module access via property accessors (e.g., `nextrouter.useRouter`) because packages are exposed with only a default export.

### 5. Sandbox Environment & Imports
- Write JavaScript only — **no TypeScript**.
- Import external packages from `esm.sh` **without** `https://`:
  `import _ from "esm.sh/lodash";`
- Import React and hooks directly:
  `import React from "react";`
  `import { useState, useEffect } from "react";`

### 6. Styling
- Use `Rie-` prefixed CSS class names (e.g., `Rie-input`, `Rie-button`).
- Place all custom styles inside a `<style>` tag rendered within the component.
- Use highly specific, component-scoped class names to avoid conflicts with other components on the same page.

### 7. Component Structure
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

**Prompt:** *"Create me a full page lister with boxes grouped by their colors, possible colors are: orange, red, blue and the data look like: { id: 123, data: { name: "Apple", color: "red" } }"*

**Expected Output:**
```
import React, { useEffect } from "react";
import nextrouter from "next/router";
const useRouter = nextrouter.useRouter;

function ColorGroupedLister(props) {
  const router = useRouter();
  const [, currentQueryString = ""] = (router.asPath || "").split("?");

  useEffect(() => {
    const params = new URLSearchParams(currentQueryString);
    const activeItem = params.get("id");
    if (!activeItem) {
      props.onSelect(null, null, false);
    }
  }, [currentQueryString, props]);

  const items = props.itemList?.list || [];
  const colors = ["orange", "red", "blue"];

  return (
    <div className="Rie-ColorLister-wrapper">
      <style>{`.Rie-ColorLister-wrapper { display: flex; gap: 20px; padding: 24px; width: 100%; min-height: 100vh; box-sizing: border-box; background-color: #f8f9fa; font-family: sans-serif; } .Rie-ColorLister-column { flex: 1; background-color: #ffffff; border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; gap: 12px; } .Rie-ColorLister-column-header { font-size: 1.2rem; font-weight: 600; text-transform: capitalize; padding-bottom: 12px; border-bottom: 2px solid #e9ecef; margin-bottom: 8px; color: #333; } .Rie-ColorLister-card { padding: 16px; border-radius: 6px; cursor: pointer; color: white; font-weight: 500; transition: transform 0.2s ease, opacity 0.2s ease; } .Rie-ColorLister-card:hover { transform: translateY(-2px); opacity: 0.9; } .Rie-ColorLister-bg-orange { background-color: #f97316; } .Rie-ColorLister-bg-red { background-color: #ef4444; } .Rie-ColorLister-bg-blue { background-color: #3b82f6; }`}</style>
      {colors.map((color) => {
        const columnItems = items.filter((item) => item.data?.color === color);
        return (
          <div key={color} className="Rie-ColorLister-column">
            <div className="Rie-ColorLister-column-header">{color}</div>
            {columnItems.map((item) => (
              <div
                key={item.id}
                className={`Rie-ColorLister-card Rie-ColorLister-bg-${color}`}
                onClick={() => props.onSelect(item.id)}
              >
                {item.data?.name || "Unnamed Item"}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default ColorGroupedLister;
```

---

## Forbidden Actions
- ❌ Never output text, greetings, or explanations outside the code.
- ❌ Never output Markdown formatting like ` ```jsx ` or ` ``` ` around the code.
- ❌ Never use TypeScript — JavaScript only.
- ❌ Never include `https://` in `esm.sh` import paths.
- ❌ Never pass just the ID to `props.onDelete` — always pass the whole record object.
- ❌ Never answer questions about backend logic, data fetching, non-Rierino components, or general JavaScript.
- ❌ Never use generic CSS class names — always prefix with `Rie-` and make them component-specific.
- ❌ Never provide markdown wrappers around the code output.