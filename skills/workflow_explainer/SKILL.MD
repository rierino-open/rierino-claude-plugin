# SKILLS.MD: Workflow Explainer

## Description
Saga documentation and explanation assistant for the Rierino platform. Reads existing Saga JSON configurations and translates them into clear, human-readable explanations — describing what each step does, how data flows between steps, what conditions drive branching, and how the overall business process works end to end. Use this skill whenever the user asks to explain, document, summarize, or understand a saga, workflow, or business process flow — including questions like "what does this saga do?", "walk me through this flow", "explain step 3", or "how does this process work?". Also trigger when the user asks about specific steps, event handlers, conditions, or transformations within a saga.

## Triggers
* Requests to explain, document, or summarize an existing saga or workflow.
* Questions about what a saga does, how it works, or what a specific step does.
* Requests to translate saga JSON into plain-language documentation.
* Requests to trace data flow, branching logic, or error handling within a saga.
* Mentions of understanding, reviewing, or auditing a saga configuration.

---

## Pre-Explanation Step: Fetch Saga and Supporting Resources

Before explaining a saga, you **must** fetch the saga configuration and any supporting resources referenced by its steps.

### 1. Fetch the Saga Configuration
Read the saga JSON using **`State_Get_saga_write`** tool on rierino MCP server. The user should provide the id of the saga, ask for it if you don't have this information.

### 2. Fetch Referenced Resources
Scan the saga steps and fetch details for any queries or handler code referenced within the flow using **`State_Get_%`** tools on rierino MCP server:

| Resource | When to Fetch | Returns |
| --- | --- | --- |
| **Query definitions** | When a step uses a `query` handler or references a query ID | Query structure, filters, projections — helps explain what data is being retrieved and how |

**Rules:**
- Always fetch supporting resources **before** writing the explanation, so you can describe what each step actually does rather than just echoing field names.
- If a resource fetch fails, note it in the explanation and describe the step based on the available metadata (handler, action, domain, parameters).

---

## Core Behavior & Logic

### 1. Explanation Structure
Produce a structured, human-readable explanation covering:

- **Overview:** A 2–3 sentence summary of what the saga accomplishes as a business process.
- **Trigger:** How the saga is invoked (its `path`, allowed runners).
- **Input / Output:** What data the saga expects and what it returns (from `schema.input` and `schema.output`).
- **Step-by-Step Walkthrough:** For each step in execution order (following the graph links, not array order), explain:
  - What the step does in plain language.
  - For EVENT steps: which handler and action are called, what domain is targeted, what data flows in (`inputElement`) and out (`outputElement`), and what the parameters control.
  - For TRANSFORM steps: what transformation is applied and why (referencing the transform class and parameters).
  - For CONDITION steps: what is being evaluated, what the possible outcomes are, and where each branch leads.
  - For FINISH / FAIL steps: what the terminal state means for the caller.
- **Branching & Error Handling:** Describe any conditional branches, including what triggers each path and how errors or failures are routed.
- **Data Flow Summary:** A brief description of how data moves through the saga — what is read, transformed, written, or returned.

### 2. Graph Traversal
- Follow the `links` from the START node to trace execution order.
- When the graph branches (CONDITION nodes or EVENT nodes with SUCCESS/FAIL routing), explain each path separately.
- Identify and call out any paths that do not terminate at a FINISH or FAIL node.

### 3. Enrichment from Resources
- When you fetch a **query definition**, explain the query's filters and what data it retrieves in business terms, not just field names.
- When you fetch **handler code**, summarize what the code does — its purpose, key logic, and any side effects — without reproducing the entire code verbatim.

### 4. Tone and Audience
- Write for a **non-technical business stakeholder** by default — use plain language, avoid raw JSON paths unless clarifying a technical detail.
- If the user asks for a technical explanation, include JSON paths, class names, and parameter details.
- Use numbered steps matching the step IDs from the saga for easy cross-referencing.

---

## Output Format

Respond with a **structured plain-language explanation** in prose. Use headings and numbered steps for clarity, but do not output raw JSON unless the user explicitly asks for it.

---

## Example

**Prompt:** *"Explain what the order fulfillment saga does"*

**Expected structure of response:**

> **Overview**
> This saga handles the end-to-end order fulfillment process — it validates an incoming order, checks inventory, reserves stock, creates a shipment record, and notifies the customer.
>
> **Trigger**
> Called via `/FulfillOrder`, allowed to run on `runner-commerce_rpc-0001`.
>
> **Input**
> Expects an order object with `orderId`, `items` (array of product IDs and quantities), and `customerId`.
>
> **Step-by-Step Walkthrough**
> 1. **Start** — Entry point of the saga.
> 2. **Validate Order** (EVENT) — Calls the `read` handler's `Get` action on the `orders` domain to retrieve the order by ID and confirm it exists...
> 3. **Check Inventory** (EVENT) — Queries the `inventory` domain to verify stock levels for each item...
> 4. **Sufficient Stock?** (CONDITION) — Evaluates whether all items have sufficient stock. If yes → step 5. If no → step 7.
> 5. **Reserve Stock** (EVENT) — Calls the `write` handler's `Update` action to decrement inventory...
> 6. **Create Shipment** (EVENT) — Writes a new shipment record...
> 7. **Order Complete** (FINISH) — Returns the fulfillment confirmation.
> 8. **Insufficient Stock** (FAIL) — Returns an error indicating which items could not be fulfilled.
>
> **Data Flow Summary**
> Order data enters via `parameters.order`, is validated against the orders state, enriched with inventory checks, and either results in a shipment record and confirmation or a failure with details on missing stock.

---

## Forbidden Actions
- ❌ Never output raw JSON as the explanation — always translate into plain language (unless the user explicitly requests JSON).
- ❌ Never guess what a step does if you haven't fetched the referenced query or handler code — fetch first, then explain.
- ❌ Never skip steps or links — explain every node in the graph.
- ❌ Never ignore branching logic — always explain all paths, including error/failure routes.
- ❌ Never reproduce entire handler code files verbatim — summarize the logic in plain language.