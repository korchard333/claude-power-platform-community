# Bulk & Batch Operations

## Bulk Operations (CreateMultiple / UpdateMultiple / DeleteMultiple)

Bulk APIs are significantly faster than individual CRUD calls or $batch for high-volume operations. They work on both standard and elastic tables.

### CreateMultiple
```http
POST /api/data/v9.2/contoso_orders/Microsoft.Dynamics.CRM.CreateMultiple
Content-Type: application/json

{
  "Targets": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_name": "Order A",
      "contoso_totalamount": 100.00
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_name": "Order B",
      "contoso_totalamount": 250.00
    }
  ]
}
```

### UpdateMultiple
```http
POST /api/data/v9.2/contoso_orders/Microsoft.Dynamics.CRM.UpdateMultiple
Content-Type: application/json

{
  "Targets": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_orderid": "guid-1",
      "contoso_status": 100000001
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_orderid": "guid-2",
      "contoso_status": 100000001
    }
  ]
}
```

### UpsertMultiple (Create or Update)
```http
POST /api/data/v9.2/contoso_orders/Microsoft.Dynamics.CRM.UpsertMultiple
Content-Type: application/json
Prefer: return=representation

{
  "Targets": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_ordernumber": "ORD-001",
      "contoso_name": "Updated or Created Order"
    }
  ]
}
```
UpsertMultiple requires an alternate key on the target table. If a record matching the key exists, it updates; otherwise, it creates.

### DeleteMultiple
```http
POST /api/data/v9.2/contoso_orders/Microsoft.Dynamics.CRM.DeleteMultiple
Content-Type: application/json

{
  "Targets": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_orderid": "guid-1"
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.contoso_order",
      "contoso_orderid": "guid-2"
    }
  ]
}
```

### Performance Guidelines
- Recommended batch size: 100–1,000 records per call (depends on payload size)
- Maximum: limited by message size (16 MB) and 2-minute timeout
- For very large imports: use multiple sequential calls with progress tracking
- Bulk APIs run as a single database transaction (all succeed or all fail)
- Prefer over `$batch` for homogeneous operations on a single table

---

## Batch Operations ($batch — Heterogeneous Requests)

### $batch Request
```http
POST /api/data/v9.2/$batch
Content-Type: multipart/mixed; boundary=batch_001

--batch_001
Content-Type: application/http
Content-Transfer-Encoding: binary

GET /api/data/v9.2/contacts(guid1)?$select=fullname HTTP/1.1
Accept: application/json

--batch_001
Content-Type: multipart/mixed; boundary=changeset_001

--changeset_001
Content-Type: application/http
Content-Transfer-Encoding: binary
Content-ID: 1

POST /api/data/v9.2/contacts HTTP/1.1
Content-Type: application/json

{"firstname":"Batch","lastname":"Contact1"}

--changeset_001
Content-Type: application/http
Content-Transfer-Encoding: binary
Content-ID: 2

POST /api/data/v9.2/contacts HTTP/1.1
Content-Type: application/json

{"firstname":"Batch","lastname":"Contact2","parentcustomerid_account@odata.bind":"$1"}

--changeset_001--
--batch_001--
```

**Rules:**
- Max 1000 operations per batch
- Changesets are transactional (all succeed or all fail)
- Reference earlier items in changeset via `$1`, `$2` (Content-ID)
- GET requests CANNOT be inside a changeset
- Use batch for bulk imports, multi-record updates
