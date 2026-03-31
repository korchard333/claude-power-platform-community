# Conditional Operations & Optimistic Concurrency

> For basic CRUD operations, see crud-queries.md.
> For error codes and retry patterns, see error-handling.md.

## ETags

Every record retrieved from Dataverse includes an `@odata.etag` property:
```json
{
  "@odata.etag": "W/\"12345678\"",
  "accountid": "00000000-0000-0000-0000-000000000001",
  "name": "Contoso"
}
```

- ETags represent the record version at time of retrieval
- Format: `W/"<version>"` (weak validation)
- Treat as opaque — never parse, compare only for equality

---

## Conditional Retrieve (If-None-Match)

Avoid re-downloading unchanged records by sending the stored ETag:
```http
GET /api/data/v9.2/accounts(00000000-0000-0000-0000-000000000001)?$select=name,revenue
If-None-Match: W/"12345678"
```

| Response | Meaning |
|---|---|
| `304 Not Modified` (no body) | Record unchanged — use cached version |
| `200 OK` (with body + new ETag) | Record changed — update cache |

**Limitation:** Conditional retrieve does NOT work with `$expand`. If you need related records, the request always returns `200 OK` regardless of the ETag.

---

## Optimistic Concurrency on Update (If-Match with ETag)

Prevent overwriting changes made by another user since you last read the record:
```http
PATCH /api/data/v9.2/accounts(00000000-0000-0000-0000-000000000001)
Content-Type: application/json
If-Match: W/"12345678"

{
  "revenue": 5000000
}
```

| Response | Meaning |
|---|---|
| `204 No Content` | Update succeeded — record was at expected version |
| `412 Precondition Failed` | Record was modified by someone else — re-read and retry |

### Read-Modify-Write Pattern
```python
# 1. Read current record (store ETag)
record = api_get("accounts(guid)?$select=name,revenue")
etag = record["@odata.etag"]

# 2. User modifies data...

# 3. Write with ETag check
response = requests.patch(
    f"{BASE_URL}/accounts(guid)",
    headers={**HEADERS, "If-Match": etag},
    json={"revenue": new_revenue}
)

if response.status_code == 412:
    # Conflict — re-read, merge, retry
    print("Record modified by another user. Re-reading...")
    record = api_get("accounts(guid)?$select=name,revenue")
    # Show user the conflict, let them decide
elif response.status_code == 204:
    print("Update succeeded")
```

---

## Optimistic Concurrency on Delete (If-Match with ETag)

```http
DELETE /api/data/v9.2/accounts(00000000-0000-0000-0000-000000000001)
If-Match: W/"12345678"
```
Returns `412` if record was modified since the ETag was obtained.

---

## Prevent Create with Upsert (If-Match: *)

Force an upsert to ONLY update — never create a new record:
```http
PATCH /api/data/v9.2/accounts(00000000-0000-0000-0000-000000000001)
Content-Type: application/json
If-Match: *

{
  "name": "Updated Name"
}
```

| Response | Meaning |
|---|---|
| `204 No Content` | Record existed and was updated |
| `404 Not Found` | Record doesn't exist — no create happened |

---

## Prevent Update with Upsert (If-None-Match: *)

Force an upsert to ONLY create — never update an existing record:
```http
PATCH /api/data/v9.2/accounts(00000000-0000-0000-0000-000000000001)
Content-Type: application/json
If-None-Match: *

{
  "name": "New Account"
}
```

| Response | Meaning |
|---|---|
| `204 No Content` | Record didn't exist and was created |
| `412 Precondition Failed` | Record already exists — no update happened |

This is the idempotent "create-if-not-exists" pattern used in build scripts.

---

## Conditional Operations in $batch

ETags work within `$batch` changesets. Each request in the changeset can include its own `If-Match` header:
```
--changeset_boundary
Content-Type: application/http
Content-Transfer-Encoding: binary

PATCH /api/data/v9.2/accounts(guid1) HTTP/1.1
Content-Type: application/json
If-Match: W/"111"

{"revenue": 1000000}
--changeset_boundary
Content-Type: application/http
Content-Transfer-Encoding: binary

PATCH /api/data/v9.2/accounts(guid2) HTTP/1.1
Content-Type: application/json
If-Match: W/"222"

{"revenue": 2000000}
--changeset_boundary--
```

If ANY request in the changeset returns `412`, the **entire changeset** rolls back (transactional behavior).

---

## Checking Optimistic Concurrency Support

Not all tables have optimistic concurrency enabled. Check via metadata:
```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='account')?$select=IsOptimisticConcurrencyEnabled
```

If `false`, `If-Match` with a specific ETag is ignored (behaves like `If-Match: *`).

---

## Anti-Patterns / Gotchas

- Using `If-Match: *` everywhere — loses concurrency protection, equivalent to blind update
- Using `If-None-Match` with ETag on update — this is conditional retrieve semantics, not upsert
- Conditional retrieve with `$expand` — silently returns 200 regardless of ETag
- Parsing or comparing ETag strings — format is implementation-specific and may change
- Not checking `IsOptimisticConcurrencyEnabled` — table may not support it
- Retrying on 412 without re-reading — you need the fresh ETag from a new GET

## Official Reference

- https://learn.microsoft.com/power-apps/developer/data-platform/webapi/perform-conditional-operations-using-web-api
- https://learn.microsoft.com/power-apps/developer/data-platform/optimistic-concurrency
