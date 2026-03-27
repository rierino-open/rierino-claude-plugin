# SKILLS.MD: Query Builder

## Description
Structured query definition generator for the Rierino platform. Translates natural language data requests into complete query JSON objects supporting SIMPLE, AGGREGATION, and PIPELINE types across multiple database systems (MongoDB, SQL, Elasticsearch, etc.). Use this skill whenever the user asks to create, modify, or fix a data query, filter definition, aggregation, or pipeline — including requests to find, list, count, sum, group, sort, or transform records from a collection. Also trigger when the user mentions query conditions, filter trees, aggregation fields, or pipeline steps in a Rierino context.

## Triggers
* Requests to build or modify query definitions for the Rierino platform.
* Requests to filter, search, aggregate, group, sort, or paginate data from a collection.
* Mentions of query types: `SIMPLE`, `AGGREGATION`, `PIPELINE`.
* Mentions of `where` conditions, `orderBy`, `fields`, `aggregateFields`, or `steps`.
* Natural language data requests like "find all X where Y", "get average Z per W", "count records grouped by…".

## Tools
* You can use **`State_Get_query_write`** tool on rierino MCP server to read an existing query mentioned.
* You can use a tool on rierino MCP server to create, update or delete the query you defined. But, you MUST get user's approval for your query before saving any changes. Always provide the path to updated query for the user to view inside browser, by presenting **``${RIERINO_UI_BASE_URL}/app/configuration/common/query?id={id}``** unless you deleted it.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All field paths and property keys must follow **`CONVENTIONS.MD`**.

---

## Core Behavior & Logic

### 1. Query Type Inference
Infer the correct type from context:
- **`SIMPLE`** — basic find/filter/select queries.
- **`AGGREGATION`** — queries involving grouped metrics (count, sum, avg, etc.).
- **`BUNDLE`** — combination of a SIMPLE query and one or more 'bundled' AGGREGATION queries which are calculated on top of the filtered records from SIMPLE query.
- **`PIPELINE`** — complex multi-stage transformations that cannot be expressed with SIMPLE or AGGREGATION types.

### 2. Database System
Use the target database system syntax (provided via context) when writing custom expressions in conditions, fields, or pipeline steps. Default to **MongoDB** if unspecified.

### 3. Condition Simplicity
Prefer the simplest condition category that fits:
- Use **unary operators** (`NULL`, `NOTNULL`, `TRUE`, `FALSE`) over comparison operators when applicable.
- Use **standard operators** (`EQ`, `IN`, `GT`, etc.) before resorting to custom expressions.

### 4. Field Projection Rules
- Only include `fields` or `aggregateFields` when the user **explicitly lists** which fields to return — never invent a field list unprompted.
- Never include both `fields` and `aggregateFields` in the same query.

### 5. Pipeline Constraints
For `PIPELINE` type queries, only include `name`, `description`, `type`, `from`, `limit`, `skip`, and `steps` — do **not** include `where`, `fields`, `aggregateFields`, or `orderBy`.

### 6. Clarification
Do not ask clarifying questions unless the request is truly ambiguous (e.g., unknown collection name).

---

## Query Object Schema

The output must be a single JSON object. Only include keys that are applicable.

```
{
  "id": (string) ID of the query,
  "data": {
    "name":             (string)  Descriptive name of the query
    "description":      (string)  Detailed description of the query
    "type":             (string)  "SIMPLE" | "AGGREGATION" | "PIPELINE" | "BUNDLE"
    "from":             (string)  Source collection or table name
    "limit":            (string)  Number of records to return (omit if not specified)
    "skip":             (string)  Number of records to skip (omit if not specified)
    "where":            (object)  Filter tree (SIMPLE & AGGREGATION only)
    "fields":           (array)   Projection fields (SIMPLE only, user-specified)
    "aggregateFields":  (object)  Grouped metrics (AGGREGATION only, user-specified)
    "orderBy":          (array)   Sort definitions (SIMPLE & AGGREGATION only)
    "steps":            (array)   Pipeline stages (PIPELINE only)
    "bundles":          (array)   Bundled query data (BUNDLE only)
  }
}

```

### `where` — Recursive Filter Tree

Each node is one of:

**Complex (logical combinator):**
```json
{
  "category": "COMPLEX",
  "operator": "AND | OR | NOT",
  "conditions": [ ...nested condition nodes ]
}
```

**Simple — value comparison:**
```json
{
  "category": "SIMPLE",
  "operator": "EQ | NE | LT | GT | LTE | GTE | CONTAINS",
  "command": "<field path only>",
  "value": "<constant value>"
}
```

**Simple — set membership or multi value:**
```json
{
  "category": "SIMPLE",
  "operator": "IN | NOTIN | MOD | BTW",
  "command": "<field path only>",
  "values": ["val1", "val2"]
}
```

**Simple — unary:**
```json
{
  "category": "SIMPLE",
  "operator": "TRUE | FALSE | NULL | NOTNULL",
  "command": "<field path only>"
}
```

**Simple — custom expression (last resort only):**
```json
{
  "category": "SIMPLE",
  "operator": null,
  "command": "<database-specific custom expression>",
  "name": "<3-5 word description>"
}
```

### `fields` (SIMPLE only, when user specifies)
```json
[
  {
    "target": "<output path, leave empty if expression is a simple path>",
    "expression": "<field path or database-specific expression>"
  }
]
```

### `aggregateFields` (AGGREGATION only, when user specifies)
```json
{
  "groupby": [
    { "target": "", "expression": "<field path>" }
  ],
  "fields": [
    {
      "target": "",
      "expression": "<field path>",
      "type": "COUNT | COUNTDISTINCT | SUM | AVG | MAX | MIN | STD"
    }
  ]
}
```

### `orderBy` (SIMPLE & AGGREGATION only)
```json
[
  { "name": "<field path>", "ascending": "true | false" }
]
```

### `steps` (PIPELINE only)
```json
[
  { "type": "custom", "content": "<database-specific pipeline stage>" }
]
```

---

## Output Format Constraints
1. Always respond with a **single JSON code block** containing the complete query object.
2. After the JSON, provide a **brief plain-language summary** (1–3 sentences) so the user can verify intent.
3. Never split the query into multiple outputs or function calls.

---

## Examples

### SIMPLE Query
**Prompt:** *"Find all orders from the orders collection where status is 'shipped' or 'delivered' and total is greater than 100, sorted by date descending, limit 50"*

**Expected Output:**
```json
{
  "id": "list_orders_select_shipped_delivered",
  "data": {
    "name": "High-value shipped or delivered orders",
    "description": "Retrieves orders with status shipped or delivered and total exceeding 100, sorted by date descending, limited to 50 results",
    "type": "SIMPLE",
    "from": "orders",
    "limit": "50",
    "where": {
      "category": "COMPLEX",
      "operator": "AND",
      "conditions": [
        {
          "category": "SIMPLE",
          "operator": "IN",
          "command": "status",
          "values": ["shipped", "delivered"]
        },
        {
          "category": "SIMPLE",
          "operator": "GT",
          "command": "total",
          "value": "100"
        }
      ]
    },
    "orderBy": [
      { "name": "date", "ascending": "false" }
    ]
  }
}
```
This query fetches up to 50 orders that are either shipped or delivered with a total above 100, sorted by most recent date first.

### AGGREGATION Query
**Prompt:** *"Get average and total revenue per country from the sales collection where year is 2024"*

**Expected Output:**
```json
{
  "id": "stat_revenue_by_country_2024",
  "data": {
    "name": "Revenue metrics by country for 2024",
    "description": "Calculates average and total revenue grouped by country for sales in 2024",
    "type": "AGGREGATION",
    "from": "sales",
    "where": {
      "category": "SIMPLE",
      "operator": "EQ",
      "command": "year",
      "value": "2024"
    },
    "aggregateFields": {
      "groupby": [
        { "target": "", "expression": "country" }
      ],
      "fields": [
        { "target": "avgRevenue", "expression": "revenue", "type": "AVG" },
        { "target": "totalRevenue", "expression": "revenue", "type": "SUM" }
      ]
    }
  }
}
```
This aggregation groups 2024 sales by country and calculates both average and total revenue per group.

---

## Forbidden Actions
- ❌ Never split the query into multiple separate outputs or function calls — always return one complete JSON object.
- ❌ Never include `fields` and `aggregateFields` in the same query.
- ❌ Never include `where`, `fields`, `aggregateFields`, or `orderBy` in a `PIPELINE` type query.
- ❌ Never include `steps` in a `SIMPLE` or `AGGREGATION` type query.
- ❌ Never invent field projections (`fields` / `aggregateFields`) unless the user explicitly requests specific fields.
- ❌ Never embed values or operators inside the `command` field of a SIMPLE condition — `command` holds the field path only (except for custom expression conditions).
- ❌ Never use a custom expression condition when a standard operator can handle the logic.
- ❌ Never assume a database syntax — use the target database system specified in context, defaulting to MongoDB if unspecified.