# CONVENTIONS.MD: Data & Naming Standards

## 1. Casing & Formatting
* **Property Keys:** Always use `lowerCamelCase` (e.g., `shippingAddress`, `isUserVerified`).
* **Entity Titles:** Use `PascalCase` for schema titles (e.g., `UserAccount`, `OrderRecord`).
* **No Abbreviations:** Use full words unless the abbreviation is a global industry standard (e.g., use `identifier` or `sku`, but avoid `qty`, `desc`, or `addr`).

## 2. Structural Grouping (Nesting)
Avoid "flat" schemas for complex entities. Group related fields into logical sub-objects to maintain a clean hierarchy.

* **Address:** Group `street`, `city`, `postalCode`, and `countryCode`.
* **Metadata:** Group `createdAt`, `updatedAt`, `version`, and `source`.
* **Financials:** Group `amount`, `currency`, `taxRate`, and `discount`.
* **Contact:** Group `email`, `phone`, and `socialHandle`.

## 3. Naming Specificity & Suffixes
To prevent ambiguity, use the following suffix conventions:

| Category | Suffix | Example |
| :--- | :--- | :--- |
| **Temporal (Time)** | `At` | `createdAt`, `lastLoginAt`, `expiresAt` |
| **Temporal (Date)** | `Date` | `birthDate`, `shipmentDate` |
| **Duration/Time** | `Ms` or `Sec` | `retryIntervalMs`, `timeoutSec` |
| **Currency** | `[ISO Code]` | `priceUsd`, `totalEur` |
| **Weight/Measure** | `[Unit]` | `weightKg`, `lengthCm` |
| **Boolean** | `is`, `has`, `should` | `isActive`, `hasPermission`, `shouldSync` |

## 4. Collection Naming
* **Arrays:** Always use plural nouns for arrays (e.g., `lineItems`, `tags`, `attachments`).
* **Empty States:** Prefer returning an empty array `[]` rather than `null` for collection types.

## 5. Value Standards
* **Timestamps:** Represent all "At" fields as **numeric integers** (Unix epoch in milliseconds).
* **Enums:** Use `SCREAMING_SNAKE_CASE` for enum values (e.g., `STATUS_PENDING`, `ROLE_ADMIN`).
* **Currency:** Use 2-decimal precision for monetary values unless the domain requires higher precision (e.g., crypto).

---

> **Note for Agents:** These conventions are mandatory. If a user provides a flat list of fields or snake_case names, you must automatically transform them to match these standards before generating the final `SKILLS.MD` or JSON Schema.
