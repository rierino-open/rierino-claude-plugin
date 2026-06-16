# SKILLS.MD: Lister Builder

## Description
React component generator for Rierino Low-Code Lister components. Produces ready-to-paste Lister UIs that display lists of records for a specific data model and can be embedded into pages. Use this skill whenever the user asks to create, modify, or fix a Lister component — including menu listers, sidebar listers, full-page listers, Kanban boards, card grids, table views, or any React-based list/collection display intended for the Rierino page builder. Also trigger when the user mentions `itemList`, or discusses listing/browsing records in a context.

## Triggers
* Requests to build lister components for the Rierino page builder.
* Requests for list views, card grids, Kanban boards, sidebar menus, or table layouts for data.
* Mentions of `props.itemList`.
* Requests to create record browsers, item pickers, or navigational list panels for pages.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All data paths and property keys must follow **`CONVENTIONS.MD`**.

---

## Pre-Generation Step: Fetch Available Resources

Before generating any lister, you **must** either:
1. Fetch the data schema from the rierino MCP server using **`State_Get_schema_write`** tool. The output contains the JSON schema for the data you will list and edit. 
2. Or receive the data schema specification from the user.
Do not assume the data schema unless user explicitly asks you to do so.

If the user doesn't specify the data schema id specifically, you can get the list of all schemas using **`State_GetAll_schema_write`** tool and pick the most relevant one.

When creating "Full Scope" type listers, you will need the ids for sources you can use. You can retrieve the full list using **`State_GetAll_source_write`** tool and pick relevant ones unless the user gives you IDs to use explicitly. For other lister types, you do not need this tool as sources are defined elsewhere.

---

## Core Behavior & Logic

Your responsibility is to generate a lister screen code, without custom implementation of authentication, authorization or API integrations. Rierino backend and core UI platform takes care of these.

### 1. Lister Types

There are 4 types of listers, which can be requested by the user:

1. **Full Scope:** In this format, the code you will produce will provide the whole layout, including editors and take care of connections with the backend APIs for populating data. It is typically used when the user wants to create a user interface that accesses and possibly edits data across multiple sources at once.
2. **List & Editor:** In this format, the code you will produce will provide the whole layout, including editors, but will have access to pre-established connections to the backend APIs for a specific data source (and possibly nested children data sources) through functions passed in its props.
3. **Complete List:** In this format, the code you will provide will only be responsible for creating a listing and menus/buttons related to it, and editors for records in that listing will be displayed and manipulated by an independent component. 
4. **Basic List:** In this format, the code you will provide will produce a listing, without menus/buttons or filters. All the rest will be handled by different components.

|Format             |Listing Component  |Listing Menus/Actions |Listing Filters    |Record Editor/Display|Backend Access     |
|-------------------|-------------------|----------------------|-------------------|---------------------|-------------------|
|Full Scope         |yes                |yes                   |yes                |yes                  |yes                |
|List & Editor      |yes                |yes                   |yes                |yes                  |no                 |
|Complete List      |yes                |yes                   |yes                |no                   |no                 |
|Basic List         |yes                |no                    |no                 |no                   |no                 |

The code you generate will have a different structure based on the format you are building for. Always clarify the type of lister you'll be building with the user before creating it.

### 2. Connecting the Full Scope Lister

Unlike other lister types, full scope lister needs to establish access to backend APIs itself, as it doesn't automatically have access to CRUD-like endpoints otherwise. Rierino provides a helper which allows using existing state management logic by simply wrapping lister components inside it, instead of writing custom code for making fetch calls and establishing a state structure. To use this wrapper, you can simply use the following structure:

```jsx
import ConnectionWrapper from "operations/connectionwrapper";

function ConnectedComponent(props) {

  return (
    <ConnectionWrapper source='DATA_SOURCE'>
        <Component/>
    </ConnectionWrapper>
  );
}

function Component(props){
    
    //... your code

}

export default ConnectedComponent;
```

If you are implementing screens that access multiple data sources independently, you can wrap all those components inside ConnectionWrappers with different source properties.
All other lister types are already wrapped inside ConnectionWrappers, so they do not require this configuration, yet they still have access to all properties provided by a ConnectionWrapper.

### 2. Available Props

Every component that is wrapped inside ConnectionWrapper (including automatically wrapped listers) have access to the following properties, which you can use when coding:

```json
  {
    itemList:{
      list: ["object - list of items from the source, received from query/list endpoint (if paginated, returns current page)"],
      totalCount: "number - total number of items in the list (applying filters, but without pagination)"
    },
    item: "object - current item record that is being viewed / edited (automatically retrieved after an onSelect call)"
    
    onList: "function () - calls listing endpoint on source, getting records without any filters or pagination",
    onQuery: "function ({method, params}) - calls query endpoint on source, passing all filter fields, skip, limit parameters in params",
    onSelect: "function (itemId) - automatically retrieves item with given ID calling get endpoint on source and returning it in item property",
    onNew: "function (item) - replaces current item with the given data, as a new record to save",
    onSave: "function (item, changes, force = null, callback = null) - calls a save endpoint on source (can be post, put or patch based on item & changes passed)",
    onDelete: "function (item, callback = null) - calls delete endpoint on source passing item.id as the record to be deleted",
    onReload: "function () - forces reload of the current item from source",
    sendMessage: "function (text, alertSeverity, detail = null) - displays a small info box for notifying user on an action taken or error received"

  }
```

You can access these properties using props.[property] such as props.itemList?.list.

For Basic List & Complete List types, onSelect automatically activates the editor that is used to display & edit selected item record (as well as onNew call). For others, you need to handle this logic and render your own item editor when calling these functions.

### 3. Imports
- Import Rierino global for custom fetch calls
- Import Rierino store for custom calls to a predefined source (if ConnectionWrapper doesn't provide required data or functions)
- Import React directly
- Use sub-module access via property accessors because packages are exposed with only a default export
- Import external packages from `esm.sh` **without** `https://`:

**Example:**
```jsx
import global from "operations/global";
import store from "operations/store";
import React from "react";
import nextrouter from "next/router";
const useRouter = nextrouter.useRouter;
import _ from "esm.sh/lodash";
```

### 4. Conventions
- Write JavaScript only — **no TypeScript**.
- Use `Rie-` prefixed CSS class names (e.g., `Rie-input`, `Rie-button`).
- Place all custom styles inside a `<style>` tag rendered within the component.
- Use highly specific, component-scoped class names to avoid conflicts with other components on the same page.
- Use functional React components only.
- Always use `export default YourComponentName;`

### 5. CSS Variables

Colors, fonts, gradients and effects are predefined with the following variables in Rierino. Unless the user explicitly asks you to use different colors outside of the schema, always use these variables in CSS style values instead of other, free format values.

```css
:root {

  --fonts--bold-28: normal 700 28px/35px var(--font-family, "Montserrat");
  --fonts--bold-24: normal 700 24px/30px var(--font-family, "Montserrat");
  --fonts--bold-22: normal 700 22px/28px var(--font-family, "Montserrat");
  --fonts--bold-20: normal 700 20px/24px var(--font-family, "Montserrat");
  --fonts--bold-18: normal 700 18px/22px var(--font-family, "Montserrat");
  --fonts--bold-14: normal 700 14px/18px var(--font-family, "Montserrat");
  --fonts--bold-13: normal 700 13px/17px var(--font-family, "Montserrat");
  --fonts--bold-12: normal 700 12px/15px var(--font-family, "Montserrat");
  --fonts--bold-10: normal 700 10px/13px var(--font-family, "Montserrat");

  --fonts--semibold-12: normal 600 12px/15px var(--font-family, "Montserrat");
  --fonts--semibold-8: normal 600 8px/10px var(--font-family, "Montserrat");

  --fonts--medium-14: normal 500 14px/15px var(--font-family, "Montserrat");
  --fonts--medium-12: normal 500 12px/15px var(--font-family, "Montserrat");
  --fonts--medium-11: normal 500 11px/14px var(--font-family, "Montserrat");
  --fonts--medium-10: normal 500 10px/13px var(--font-family, "Montserrat");
  --fonts--medium-8: normal 500 8px/10px var(--font-family, "Montserrat");

  --fonts--medium-zip-11: normal 500 11px/20px var(--font-family, "Montserrat");

  --fonts--regular-22: normal 400 22px/28px var(--font-family, "Montserrat");
  --fonts--regular-16: normal 400 16px/20px var(--font-family, "Montserrat");
  --fonts--regular-14: normal 400 14px/18px var(--font-family, "Montserrat");
  --fonts--regular-12: normal 400 12px/15px var(--font-family, "Montserrat");
  --fonts--regular-11: normal 400 11px/20px var(--font-family, "Montserrat");
  --fonts--regular-10: normal 400 10px/12px var(--font-family, "Montserrat");

  --colors--tolopea: #1B064C;
  --colors--heliotrope: #9A42FF;
  --colors--paris-m: #20075A;
  --colors--electric-violet: #6022F1;
  --colors--purple-heart: #6C3BDE;
  --colors--moon-raker: #D8CBF6;
  --colors--fog: #EAD6FF;
  --colors--blue-chalk: #F4F0FF;
  --colors--magnolia: #FBFAFF;
  --colors--persian-blue: #261FAD;
  --colors--portage: #847EF6;
  --colors--pigeon-post: #B7B5DE;
  --colors--selago: #E9E8FC;
  --colors--titan-white: #F0F0FF;
  --colors--azure: #366DBA;
  --colors--periwinkle: #BDD8FF;
  --colors--hawkes-blue: #DFEBFB;
  --colors--bright-gray: #363B4A;
  --colors--comet: #515A70;
  --colors--lynch: #6B7794;
  --colors--manatee: #8F97AE;
  --colors--mischka: #D3D6DF;
  --colors--athens-gray: #EDEFF2;
  --colors--mandy: #EB475A;
  --colors--pink: #FFBDC4;
  --colors--azalea: #FBDFE2;
  --colors--coral: #FF7E47;
  --colors--romantic: #FFD4C2;
  --colors--peach-schnapps: #FFE6DB;
  --colors--eucalyptus: #259374;
  --colors--shamrock: #33CCA1;
  --colors--jagged-ice: #B4E4D7;
  --colors--polar: #E2F8F2;

  --colors--white: #fff;
  --colors--black: #000;
  --colors--indigo: #5F59CF;
  --colors--perfume: #ADA9F9;
  --colors--forget-me-not: #FFF1EB;

  --colors--white-60: rgba(255, 255, 255, 0.6);
  --colors--white-40: rgba(255, 255, 255, 0.4);

  --colors--alpha-A: #AB83F8;
  --colors--alpha-B: #8C9AF0;
  --colors--alpha-C: #7FAEDC;
  --colors--alpha-D: #7FBFD1;
  --colors--alpha-E: #7FC7B2;
  --colors--alpha-F: #8BC48F;
  --colors--alpha-G: #A8C47F;
  --colors--alpha-H: #C4C07F;
  --colors--alpha-I: #D8B67F;
  --colors--alpha-J: #E0A37F;
  --colors--alpha-K: #D98A7F;
  --colors--alpha-L: #C87F7F;
  --colors--alpha-M: #9B7FE8;
  --colors--alpha-N: #9E7FC8;
  --colors--alpha-O: #8A7FDB;
  --colors--alpha-P: #7F8CE0;
  --colors--alpha-Q: #7FA0E0;
  --colors--alpha-R: #7FB3E0;
  --colors--alpha-S: #7FC3D8;
  --colors--alpha-T: #7FCFD1;
  --colors--alpha-U: #7FCFC0;
  --colors--alpha-V: #8FCFA7;
  --colors--alpha-W: #A7CF8F;
  --colors--alpha-X: #BFCF7F;
  --colors--alpha-Y: #CFAF7F;
  --colors--alpha-Z: #CF8F7F;

  --gradients-g-heliotrope: linear-gradient(270.53deg, #CB47FF -5.4%, #6B35E9 131.2%);
  --gradients-g-hawkes-blue: linear-gradient(347.47deg, #fff 29.33%, #DFEBFB 90.91%);
  --gradients-g-violet: linear-gradient(180deg, #7349FD 0%, #511EC8 100%);
  --gradients-g-manatee: linear-gradient(180deg, #8F97AE 0%, #363B4A 125%);
  --gradients-g-button: linear-gradient(178.24deg, #bb00ea 14.34%, #4630da 106.96%);
  --gradients-g-button2: linear-gradient(180deg, #6335D0 0%, #4D00FF 100%);
  --gradients-g-fill: linear-gradient(180deg, #072982 0%, #5c12d5 40.46%, #a523c6 100%);
  --gradients-g-list: linear-gradient(180deg, #2921a3 0%, #361db0 33.04%, #a351cf 100%);
  --gradients-g-mauve: linear-gradient(#9686FE 7%, #BC96FD 55%, #E9C9FD 100%);

  --effects--s-dropdown: 0px 4px 12px 0px rgb(0 0 0 / 16%);
  --effects--s-button: 0px 1px 5px 0px rgb(0 0 0 / 20%);
  --effects--s-button-select: 0px 4px 20px 0px rgb(0 0 0 / 16%), inset 0px 0px 10px 2px rgb(0 0 0 / 16%);
  --effects--s-tooltip: 0px 4px 12px 0px rgb(0 0 0 / 32%);
  --effects--s-inner: inset 0px 0px 10px 2px rgb(0 0 0 / 16%);
  --effects--s-textbox: 0px 1px 5px 0px rgb(0 0 0 / 3%);
  --effects--s-editor-tab: 0px 0px 6px 1px rgba(108, 59, 222, 0.1);

}
```

### Custom API Calls

While ConnectionWrapper provides CRUD features used for main operations, you can also use custom Rierino backend APIs, if the user specifies them explicitly. In this case, always use the following code structure instead of doing direct fetch calls, as global functions provide extra features:

```jsx
global.fetchWrapper(
  global.getAPIURL(YOUR_PATH),
  config
)
```

fetchWrapper adds authentication and headers, whereas getAPIURL adds base URL for the backend. config is standard fetch config, with method, headers, body, etc.

In some cases, it is also useful to access Redux Toolkit that governs the sources & their data states in Rierino directly, instead of using a ConnectionWrapper or custom fetch calls. In those cases, you can import store and use its APIs which follow regular RTK APIs, such as:

```jsx
const {
  useLazyGetItemQuery,
  useLazyGetListQuery,
  useGetListQuery,
  useGetItemQuery,
  useUpdateItemMutation,
  useNewItemMutation,
  useDeleteItemMutation,
} = store.getApi();

const [
  triggerListQuery,
  {
    data,
    error,
    isSuccess,
    isFetching,
    isUninitialized,
  },
] = useLazyGetListQuery();

const {
  data: listData,
  currentData: listCurrentData,
  error: listError,
  isItemListLoading,
  isSuccess: isListSuccess,
} = useGetListQuery(
  request,
  { skip: skipCondition }
);
```

---

## Example

**Prompt:** *"Create me a full page lister with boxes grouped by their colors, possible colors are: orange, red, blue and the data look like: { id: 123, data: { name: "Apple", color: "red" } }"*

**Expected Output:**
```
import React from "react";
import nextrouter from "next/router";
const useRouter = nextrouter.useRouter;

function ColorGroupedLister(props) {
  const router = useRouter();
  const [, currentQueryString = ""] = (router.asPath || "").split("?");

  React.useEffect(() => {
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

## Output Format

The user can ask you one of the following:
1. To create the lister code and provide it to them
2. Create the lister code and submit it to Rierino as a UI they can use immediately
If they haven't been specific about submitting it to Rierino yourself, always assume it is option #1.

For #2, before you start, you need to pull the current code from Rierino using **`State_Get_ui_write`** tool on rierino MCP server, previous code will be in data.listerProps.code field. If the UI doesn't already exist, that is OK. The user has to provide the ID of the UI to read in this scenario. After you've generated or updated the code in its final form, you have to call **`State_Create_ui_write`** (if it is a new record) or **`State_Set_ui_write`** tool (if you're updating existing record) to update data.listerProps.code field with it. If the UI already existed, you should only change this field. Otherwise, you should create a new record with the following data format:
```json
{
  id: "string - a UUID you generate, unless given specifically by the user",
  data: {
    name: "string - a logical name for the UI",
    domain: "custom",
    global: true,
    status: "A",
    lister: "CustomCodeLister"
    listerProps:{
      code: "string - the code you generated",
      structure: "string - the type you've selected (full, list_editor, complete_list or basic_list)
    }
  }
}
```
Always provide the path to created / updated ui for the user to view inside browser for option #2, by presenting **``${RIERINO_UI_BASE_URL}/app/design/common/ui?id={id}``**.

---

## Forbidden Actions
- ❌ Never use TypeScript — JavaScript only.
- ❌ Never include `https://` in `esm.sh` import paths.
- ❌ Never answer questions about backend logic, data fetching, non-Rierino components, or general JavaScript.
- ❌ Never use generic CSS class names — always prefix with `Rie-` and make them component-specific.
