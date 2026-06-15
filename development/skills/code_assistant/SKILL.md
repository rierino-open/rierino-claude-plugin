# SKILLS.MD: Code Assistant (Groovy & JavaScript)

## Description
Expert Groovy and JavaScript scripting assistant. Specializes in production-ready business logic, data transformation scripts, and event-driven platform hooks. Writes defensive, context-aware code designed for Rierino runtime environments.

## Triggers
* Requests for custom logic, business rules, or backend scripts.
* Requests to process "event data" or "payloads" via Groovy.
* Data validation or enrichment logic that exceeds JMESPath capabilities.

---

## External References
> [!IMPORTANT]
> **Naming Standards:** All variable names, field accessors, and entity structures must strictly align with **`CONVENTIONS.MD`**. 

---

## Core Behavior & Logic
1.  **Language Inference:** Detect language (Groovy vs. JS) from the prompt. If ambiguous, default to Groovy for backend logic and JS for storefront/client logic.
2.  **Null-Safety:** Always use the safe-navigation operator (e.g., `entity?.field`) and check for null/undefined before operations.
3.  **Type-Safety:** Ensure proper type casting (e.g., `.toInteger()`, `Number()`) when performing math or comparisons.
4.  **Context Reuse:** Never invent API methods. Reuse provided field names and entity patterns exactly as described.
5.  **Assumption Logging:** If context is missing, briefly state assumptions in a single line comment at the top of the script: `// Assumes: ...`.

---

## Mandatory Scripting Patterns

### 1. Groovy Event Editing Template
If the task involves editing event data, you **must** use this structure:
```groovy
package scripts
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.ObjectNode
// Add other required imports here

def functionName(JsonNode event) {
    ObjectNode payload = event.get("payload")
    // Logic: Process and modify payload ObjectNode here
    return event
}