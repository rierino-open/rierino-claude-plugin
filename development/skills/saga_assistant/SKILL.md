# SKILLS.MD: Saga Assistant

## Description
Saga configuration generator for the Rierino core platform. Translates high-level business process descriptions into production-ready Saga JSON configurations — directed graphs of steps that orchestrate microservice actions, transformations, conditions, and branching logic. Use this skill whenever the user asks to create, modify, debug, or improve a Saga flow, business process, workflow, orchestration, or event pipeline — even if they don't say "saga" explicitly but the context involves chaining actions across services. Also trigger when the user mentions steps, event handlers, transform nodes, condition branching, or runner capabilities.

## Triggers
* Requests to create or modify Saga configurations or business process flows.
* Requests to orchestrate microservice actions, data transformations, or conditional branching.
* Mentions of saga steps, event nodes, transform nodes, condition nodes, runners, or flow graphs.
* Requests to chain read/write/query/REST operations into a sequential or branching flow.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All data paths and property keys must follow **`CONVENTIONS.MD`**.

---

## Pre-Generation Step: Fetch Runner Capabilities

Before generating any saga configuration, you **must** fetch the capabilities of the target runner. Always start by getting details of runner capabilities and actions enabled on it, using the first entry in the saga's `allowedFor` array.

Use the appropriate tool with the following calls:

| Resource | Call | Returns |
| --- | --- | --- |
| **Runner Capabilities** | `GetRunnerCapabilities` with the runner ID | State managers, query managers, REST systems, available actions (event steps), transformations, and conditions — with their IDs, types, names, descriptions, classes, and configurable props |

**Rules:**
- **Never invent actions, transformations, or conditions** — only use those returned by the runner capabilities.
- **Never invent parameter keys** — only use parameters defined in the specification for the selected action/transform/condition class.
- If a call fails, inform the user and do not proceed with guessed values.

## Tools
* You can use **`State_Get_saga`** tool on rierino MCP server to read existing saga for a mentioned flow.
* You can also use **`State_GetAll_query_write`** tool on rierino MCP server to fetch query definitions if you need to use them in saga steps.
* You can use a tool on rierino MCP server to create, update or delete the saga you defined. But, you MUST get user's approval for your saga before saving any changes. Always provide the path to updated saga for the user to view inside browser, by presenting **``${RIERINO_UI_BASE_URL}/app/devops/common/saga?id={id}``** unless you deleted it.

---

## Core Behavior & Logic

### 1. Output Requirements
- Return **only** the JSON object — no greetings, code fences, explanations, or commentary.
- Ensure all node IDs are unique across the `steps` and `links` arrays.
- If the user provided an existing saga with already-assigned IDs, **do not change** their values.
- Validate that the graph is logical and leads to a terminal node (FINISH or FAIL).

### 2. Users can create new sagas from scratch or ask for assistance improving existing sagas.

### 3. User-provided inputs (e.g., body of an API call) are always wrapped inside a `"parameters"` element in the event payload — this should be considered when defining `inputElement` paths.

---

## Saga JSON Schema

Every saga must be a single JSON object with this structure:

```json
{
  "id": "string",
  "data": {
    "path": "string — URL path from which the saga is called, in /Path format",
    "name": "string — logical name of the saga",
    "description": "string — logical description of what the saga does",
    "allowedFor": ["string — runner IDs on which the saga is allowed to run"],
    "schema": {
      "input": "object — JSON schema representing input data model and validation rules",
      "output": "object — JSON schema representing output data model and example values for mocking APIs"
    },
    "steps": [
      {
        "id": "integer — unique step ID, assigned sequentially, must not overlap with link IDs either",
        "name": "string — logical name of the step",
        "description": "string — logical description of the step",
        "type": "START | FINISH | FAIL | EVENT | CONDITION | TRANSFORM",
        "position": {
          "x": "number — X position on flow diagram",
          "y": "number — Y position on flow diagram"
        },
        "links": [
          {
            "id": "integer — unique link ID, assigned sequentially, must not overlap with step IDs either",
            "toStepID": "integer — next step to execute",
            "conditionValues": ["string — values for which this link is traversed (optional)"]
          }
        ]
      }
    ]
  }
}
```

### Step & Link ID Assignment

Steps and Links must not have any overlapping IDs (i.e. a step can not have same ID as a link). Make sure that you have a global sequence generator for these IDs and always make sure your new ID doesn't exist anywhere inside the saga when assigning it to a step or a link.

At the end of your saga generation, make a final review of the IDs you've assigned. Check for duplicate values across the combined list. If duplicates exist:
1. Reassign only the IDs you generated in this session — never change IDs that were present in the original user-provided saga. 
2. Reassign conflicting IDs to new values larger than the largest ID already present, respecting the even/odd rule (even for steps, odd for links). 
3. Update any toStepID references that pointed to a reassigned ID so the graph remains consistent.

### Position Layout
- Use a logical layout with spacing between steps.
- Each step has **100 width** and **50 height** — space them accordingly.

### Links & Condition Values
- `conditionValues` depend on the output produced by `conditionClass` of the originating step.
- Use `*` as a wildcard for a default "else" branch.
- For EVENT type steps, `SUCCESS` and `FAIL` values can route failed events to a different next step — but only if the user explicitly mentions following a different flow on failure.
- You do **not** need to provide `conditionValues` if there is a single next step that will always be executed.

---

## Step Types

### 1. START
- Every saga **must** begin with exactly one `type: "START"` node.

### 2. EVENT
Used to call microservice actions. EVENT steps include additional `eventMeta`:

```json
{
  "eventMeta": {
    "handler": "string — alias of the handler (e.g., read, write, query, rest)",
    "action": "string — name of the action/function (e.g., Get, Create, GetQuery, CallRest)",
    "domain": "string — domain for the action (e.g., database table for Create)",
    "inputElement": "string — JSON path of the data field in event payload used as input (never starts with $, always relative to event payload root)",
    "outputElement": "string — JSON path where outputs are written (relative to inputElement unless prefixed with $, which makes event payload the root)",
    "parameters": "key-value pair, specific to handler action (as received from runner capabilities steps)"
  }
}
```

<!-- TODO: Document relationship between action props from GetParameterSpecifications and eventMeta.parameters — action props should be placed inside eventMeta.parameters. -->

### 3. TRANSFORM
Local payload manipulation. TRANSFORM steps include additional properties:

```json
{
  "transformClass": "string — Java class for transformation (e.g., com.rierino.handler.transform.JMESPayloadTransform)",
  "transformParameters": "key-value pair, specific to transformClass (as received from runner capabilities steps)"
}
```

### 4. CONDITION
Used for branching logic. CONDITION steps include additional properties:

```json
{
  "conditionClass": "string — Java class for condition logic (e.g., com.rierino.handler.saga.condition.ElementValueCondition)",
  "conditionParameters": "key-value pair, specific to conditionClass (as received from runner capabilities steps)"
}
```

### 5. FINISH / FAIL
Terminal nodes for successful or failed execution. Every flow path must end at one of these.

---

## Runner Member Elements

The runner capabilities response includes member elements that define the infrastructure available to the saga:

| Element Type | Description |
| --- | --- |
| **State Managers** (`type: STATE`) | Data stores the saga can be used as domains in read and write handler actions |
| **Query Managers** (`type: QUERY`) | Query engines available for data retrieval, used as domains in query handler actions  |
| **REST Systems** (`type: SYSTEM`, `typeDetail: rest`) | External REST APIs the saga can call, used as domains in rest handler actions |

---

## Output Format Constraints
1. **NO Markdown Code Fences:** Do not wrap the response in ` ```json ` or ` ``` `.
2. **NO Prose:** Do not include introductory text, explanations, greetings, or commentary.
3. **Raw JSON Only:** Respond with the saga JSON object and nothing else.

---

## Example

**Prompt:** *"Create a saga for runner-admin_rpc-0001 which reads all records from GenAI Model state and creates copies in dummy state"*

The agent should:
1. Call `GetRunnerCapabilities` for `runner-admin_rpc-0001`.
2. Identify the available read and write actions, state managers, and their parameter schemas.
3. Produce a saga JSON with: START → read all from GenAI Model state → write copies to dummy state → FINISH, with a FAIL terminal for error paths if appropriate.

---

## Forbidden Actions
- ❌ Never output text, greetings, or explanations outside the JSON.
- ❌ Never wrap output in markdown code fences.
- ❌ Never invent actions, transformations, or conditions not returned by the runner capabilities.
- ❌ Never invent parameter keys not defined in the parameter specifications.
- ❌ Never create a saga without exactly one START node.
- ❌ Never create a saga where any flow path does not terminate at a FINISH or FAIL node.
- ❌ Never change existing step or link IDs when modifying a user-provided saga.
- ❌ Never skip the runner capabilities fetch — always call GetRunnerCapabilities before generating output.
- ❌ Never change the ID of a runner in tool calls, in case user provided an explicit runner ID. Do NOT guess or add any prefix/suffix yourself.