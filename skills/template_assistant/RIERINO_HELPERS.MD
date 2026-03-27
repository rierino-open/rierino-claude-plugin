# RIERINO_HELPERS.MD: Custom Handlebars Reference

This file serves as the authoritative signature and usage reference for Rierino custom Handlebars helpers. All templates must strictly follow these signatures for using non-standard helpers.

---

## 1. Logic & Comparison
Use these for all conditional logic. **Never** use JavaScript operators (`==`, `&&`, etc.).

| Helper | Signature | Returns | Example |
|:---|:---|:---|:---|
| `not` | `not(value: boolean)` | `boolean` | `{{#if (not isVisible)}}` |
| `eq` | `eq(left, right)` | `boolean` | `{{#if (eq status "active")}}` |
| `neq` | `neq(left, right)` | `boolean` | `{{#if (neq role "guest")}}` |
| `gt` | `gt(left, right)` | `boolean` | `{{#if (gt price 0)}}` |
| `gte` | `gte(left, right)` | `boolean` | `{{#if (gte qty minOrder)}}` |
| `lt` | `lt(left, right)` | `boolean` | `{{#if (lt stock 5)}}` |
| `lte` | `lte(left, right)` | `boolean` | `{{#if (lte discount 100)}}` |
| `and` | `and(...booleans)` | `boolean` | `{{#if (and inStock isActive)}}` |
| `or` | `or(...booleans)` | `boolean` | `{{#if (or isSale isFeatured)}}` |
| `cond` | `cond(test, ifTrue, ifFalse)` | `any` | `{{cond inStock "Buy Now" "Notify Me"}}` |

---

## 2. Arrays & Collections
Standard helpers for list manipulation and safety.

| Helper | Signature | Returns | Example |
|:---|:---|:---|:---|
| `max` | `max(values: array)` | `any` | `{{max product.prices}}` |
| `min` | `min(values: array)` | `any` | `{{min product.prices}}` |
| `range` | `range(end: number)` | `array` | `{{#each (range 5)}}` |
| `slice` | `slice(list, start?, end?)` | `array` | `{{#each (slice items 0 4)}}` |
| `size` | `size(list: array)` | `number` | `{{#if (gt (size images) 1)}}` |
| `arr` | `arr(...values)` | `array` | `{{#each (arr "S" "M" "L")}}` |
| `coalesce` | `coalesce(...values)` | `any` | `{{coalesce salePrice price}}` |

---

## 3. Math & Strings
| Helper | Signature | Returns | Example |
|:---|:---|:---|:---|
| `math` | `math(left, op, right)` | `number` | `{{math price "*" quantity}}` (ops: `+`, `-`, `*`, `/`, `%`) |
| `len` | `len(value: string)` | `number` | `{{#if (gt (len title) 0)}}` |
| `lines` | `lines(text: string)` | `array` | `{{#each (lines description)}}` |

---

## 4. Data Transformation & JSON
| Helper | Signature | Returns | Example |
|:---|:---|:---|:---|
| `fromJson` | `fromJson(value: any)` | `string` | `data-params='{{fromJson paramsObj}}'` |
| `toJson` | `toJson(value: string)` | `any` | `{{#with (toJson rawString)}}` |
| `md` | `md(text: string)` | `string` | `{{{md product.description}}}` (Needs `{{{ }}}`) |
| `eval` | `eval(input, expr: string)` | `any` | `{{eval product "variants[?color=='red'].sku"}}` |

---

## 5. Date & Time
| Helper | Signature | Returns | Example |
|:---|:---|:---|:---|
| `dateToString` | `dateToString(ms, loc?, pat?)` | `string` | `{{dateToString launchDate "en-US" "dd/MM/yyyy"}}` |
| `stringToDate` | `stringToDate(val, loc?, pat?)` | `number` | `{{stringToDate "12-31-2025"}}` |

*Default Locale:* `"en-US"` | *Default Pattern:* `"MM-dd-yyyy"`

---

## 6. Variables & Context
| Helper | Signature | Returns | Example |
|:---|:---|:---|:---|
| `setVar` | `setVar(name, value)` | `any` | `{{setVar "total" (math price "*" qty)}}` |
| `dataLookup` | `dataLookup(source, ids)` | `any` | `{{#with (dataLookup "products" id)}}` |

---

> **Developer Note:** When using `dataLookup`, ensure the source name matches a valid runner state or data provider. For `md`, always use triple-braces to prevent escaping the generated HTML.