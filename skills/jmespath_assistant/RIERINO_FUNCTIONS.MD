# RIERINO_FUNCTIONS.MD: Custom JMESPath Reference

This file serves as the authoritative signature and usage reference for Rierino custom JmesPath functions. All expressions must strictly follow these signatures for using non-standard functions.

### Arrays

| Function | Signature | Description |
|---|---|---|
| `add_all` | `add_all(left: array, right: array) -> array` | Merges `left` and `right` into a new array |
| `cartesian` | `cartesian(lists: array) -> array` | Creates the cartesian product of an array of arrays |
| `distinct` | `distinct(values: array) -> array` | Returns distinct values |
| `element_at` | `element_at(list: array, index: number) -> any` | Returns element at `index` |
| `group_by` | `group_by(list: array, field: string) -> array` | Groups entries; returns `[{ id: "", list: [] }]` |
| `index_array` | `index_array(list: array, field: string="index", start: number=0) -> array` | Adds an index field to each entry |
| `intersect` | `intersect(left: array, right: array) -> array` | Returns the intersection of two arrays |
| `remove_all` | `remove_all(list: array, toRemove: array) -> array` | Removes all entries of `toRemove` from `list` |
| `repeat` | `repeat(template: object, list: array, keyField: string) -> array` | Repeats `template` merged with each entry of `list` |
| `split_array` | `split_array(list: array, size: number) -> array` | Chunks `list` into arrays of up to `size` entries |
| `merge_index` | `merge_index(left: array, right: array, leftField: string=null, rightField: string=null) -> array` | Merges two arrays by index; optionally nests under `leftField`/`rightField` |

### Objects & Paths

| Function | Signature | Description |
|---|---|---|
| `deep_merge` | `deep_merge(...objects: object) -> object` | Deep merges nested objects (use `merge()` for shallow) |
| `deep_diff` | `deep_diff(oldValue: any, newValue: any) -> array` | Returns nested list of differences with `"old"` vs `"new"` values |
| `k_vtoo` | `k_vtoo(key: string, value: any) -> object` | Converts a `(key, value)` pair to an object |
| `ltoo` | `ltoo(pairs: array, keyField: string) -> object` | Converts a list of key-value pairs into an object |
| `otol` | `otol(obj: object, keyField: string, valueField: string) -> array` | Converts an object to a list of key-value pairs |
| `get_element` | `get_element(obj: object, path: string) -> any` | Returns element at JSON `path` |
| `set_element` | `set_element(obj: object, path: string, value: any) -> object` | Adds/sets `value` at JSON `path` |
| `remove_elements` | `remove_elements(obj: object, fields: array) -> object` | Removes listed fields from `obj` |
| `remove_nulls` | `remove_nulls(obj: object, removeEmptyStrings: boolean=false) -> object` | Removes null fields; optionally removes empty strings |
| `find_paths` | `find_paths(input: any, regex: string) -> array` | Returns all JSON paths in `input` matching `regex` |
| `type` | `type(value: any) -> string` | Returns type: `OBJECT`, `ARRAY`, `NUMBER`, `STRING`, `BOOLEAN`, `NULL` |

### Dynamic Expressions

| Function | Signature | Description |
|---|---|---|
| `dynamic` | `dynamic(input: any, expr: string) -> any` | Evaluates `expr` string against `input` |
| `dynamic_repeat` | `dynamic_repeat(input: any, list: array, expr: string) -> array` | Evaluates `expr` for each `{input, entry}` and returns results as array |
| `dynamic_filter` | `dynamic_filter(input: any, list: array, expr: string) -> array` | Filters `list` using boolean result of `expr` for each `{input, entry}` |

### Strings & Text

| Function | Signature | Description |
|---|---|---|
| `replace` | `replace(text: string, search: string, replacement: string) -> string` | Replaces occurrences of `search` with `replacement` |
| `split` | `split(text: string, delimiter: string) -> array` | Splits `text` by `delimiter` |
| `substr` | `substr(text: string, start: number, end: number=null) -> string` | Returns substring from `start` to `end` (exclusive) |
| `trim` | `trim(value: string) -> string` | Trims whitespace |
| `to_lower` | `to_lower(value: string) -> string` | Lowercases string |
| `to_upper` | `to_upper(value: string) -> string` | Uppercases string |
| `slug` | `slug(text: string, transliterate: boolean=false) -> string` | Converts to slug (trims, lowercases, strips special chars, replaces with `-`) |
| `encode_url` | `encode_url(value: string) -> string` | URL-encodes a string |
| `decode_url` | `decode_url(value: string) -> string` | Decodes URL-encoded text |
| `btoa` | `btoa(value: any) -> string` | Base64-encodes `value` |
| `atob` | `atob(value: string) -> string` | Decodes base64 to UTF-8 text |
| `regex` | `regex(value: string, pattern: string) -> any` | Returns regex match result for `value` |

### JSON & CSV

| Function | Signature | Description |
|---|---|---|
| `to_json` | `to_json(value: string) -> any` | Parses JSON text into object/array |
| `from_json` | `from_json(value: any) -> string` | Converts object/array to JSON string |
| `csv_to_json` | `csv_to_json(csv: string, options: object=null) -> array` | Parses CSV text into array of records |
| `json_to_csv` | `json_to_csv(records: array, options: object=null) -> string` | Prints array as CSV text |

### Date & Time

| Function | Signature | Description |
|---|---|---|
| `now` | `now() -> number` | Returns current time in epoch milliseconds |
| `date_to_string` | `date_to_string(epochMs: number, pattern: string="MM-dd-yyyy") -> string` | Formats epoch ms using Java date pattern |
| `string_to_date` | `string_to_date(value: string, pattern: string="MM-dd-yyyy") -> number` | Parses date string into epoch milliseconds |
| `cron` | `cron(pattern: string, action: string, timeZone: string, epochMs: number) -> number\|boolean` | Processes cron pattern; actions: `last`, `next`, `fromLast`, `toNext`, `match` |

### Crypto & Hashing

| Function | Signature | Description |
|---|---|---|
| `encrypt` | `encrypt(plainText: string, key: string, algorithm: string="AES/ECB/PKCS5Padding", keyAlgorithm: string="AES") -> string` | Encrypts plain text |
| `decrypt` | `decrypt(cipherText: string, key: string, algorithm: string="AES/ECB/PKCS5Padding", keyAlgorithm: string="AES") -> string` | Decrypts cipher text |
| `hash` | `hash(plainText: string, key: string, algorithm: string="SHA-256", iterations: number=1) -> string` | Hashes plain text |
| `validate_hash` | `validate_hash(plainText: string, hashedText: string, key: string, algorithm: string="SHA-256", iterations: number=1) -> boolean` | Validates plain text against a hash |
| `salt_key` | `salt_key(length: number) -> string` | Generates a secure random key of `length` characters |

### Lookup & Joins

| Function | Signature | Description |
|---|---|---|
| `lookup` | `lookup(left: array, right: array, key: string, full: boolean=false) -> array` | Joins two arrays on `key`; `full=true` for full join, `false` for left join |

### Math & Logic

| Function | Signature | Description |
|---|---|---|
| `compare` | `compare(left: any, right: any) -> number` | Returns `0` (equal), `-1` (left < right), `1` (left > right) |
| `cond` | `cond(test: boolean, ifTrue: any, ifFalse: any) -> any` | Returns `ifTrue` or `ifFalse` based on `test` |
| `divide` | `divide(dividend: number, divisor: number) -> number\|null` | Divides; returns `null` if divisor is `0` |
| `multiply` | `multiply(left: number, right: number) -> number` | Returns `left * right` |
| `mod` | `mod(value: number, base: number) -> number` | Returns `value % base` |
| `power` | `power(value: number, exponent: number) -> number` | Returns `value ^ exponent` |
| `minus` | `minus(value: number) -> number` | Returns `-value` |
| `to_int` | `to_int(value: number) -> number` | Returns integer (floor) part of `value` |

### IDs & Randomness

| Function | Signature | Description |
|---|---|---|
| `guid` | `guid() -> string` | Generates a globally unique ID |
| `uuid` | `uuid() -> string` | Generates a universally unique ID |
| `rand` | `rand(min: number, max: number) -> number` | Returns random integer between `min` and `max` |

### Environment

| Function | Signature | Description |
|---|---|---|
| `get_env` | `get_env(name: string) -> string\|null` | Returns the value of an environment variable |
