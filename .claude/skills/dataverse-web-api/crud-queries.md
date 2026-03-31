# CRUD Operations, Queries & Relationships

## CRUD Operations

### Create
```http
POST /api/data/v9.2/contacts
Content-Type: application/json
Prefer: return=representation

{
  "firstname": "Jane",
  "lastname": "Smith",
  "emailaddress1": "jane@contoso.com",
  "telephone1": "+61 400 123 456",
  "contoso_AccountId@odata.bind": "/accounts(00000000-0000-0000-0000-000000000001)"
}
```

> ⚠️ **Lookup binding uses the navigation property name (SchemaName casing, NOT logical name)**
> The `@odata.bind` key must match the **navigation property name** from the relationship metadata — this is the column's SchemaName (PascalCase), NOT the logical name (lowercase).
> - ✅ Correct: `"ds_ClientId@odata.bind": "/accounts(guid)"`
> - ❌ Wrong: `"ds_clientid@odata.bind": "/accounts(guid)"` (returns 400: undeclared property)
> To discover the exact navigation property name: `GET /api/data/v9.2/EntityDefinitions(LogicalName='entity')/Attributes/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=SchemaName`

Response: `201 Created` with `OData-EntityId` header containing the new record URL.

**With `return=representation`**: Response body contains the full created record.

### Read (Single Record)
```http
GET /api/data/v9.2/contacts(00000000-0000-0000-0000-000000000001)
  ?$select=firstname,lastname,emailaddress1,statecode
  &$expand=contoso_AccountId($select=name,accountnumber)
```

### Read (Collection with Query)
```http
GET /api/data/v9.2/contacts
  ?$select=firstname,lastname,emailaddress1
  &$filter=statecode eq 0 and contains(lastname,'Smith')
  &$orderby=lastname asc,firstname asc
  &$top=50
  &$count=true
```
Response includes `@odata.count` (total matching records) when `$count=true`.

### Update (PATCH — Partial Update)
```http
PATCH /api/data/v9.2/contacts(00000000-0000-0000-0000-000000000001)
Content-Type: application/json
If-Match: *

{
  "emailaddress1": "jane.smith@contoso.com",
  "telephone1": "+61 400 999 888"
}
```
Response: `204 No Content` (or full record if `Prefer: return=representation`).

### Upsert (Create or Update via Alternate Key)
```http
PATCH /api/data/v9.2/contoso_orders(contoso_ordernumber='ORD-001')
Content-Type: application/json

{
  "contoso_name": "Order 001",
  "contoso_totalamount": 5000.00,
  "contoso_AccountId@odata.bind": "/accounts(00000000-0000-0000-0000-000000000001)"
}
```
- Record exists → Updates (returns `204`)
- Record doesn't exist → Creates (returns `201`)

### Delete
```http
DELETE /api/data/v9.2/contacts(00000000-0000-0000-0000-000000000001)
```
Response: `204 No Content`.

### Delete Single Property Value
```http
DELETE /api/data/v9.2/contacts(00000000-0000-0000-0000-000000000001)/emailaddress1
```

---

## Query Options Reference

### $filter Operators
| Operator | Example | Notes |
|---|---|---|
| `eq` | `statecode eq 0` | Equals |
| `ne` | `statecode ne 1` | Not equals |
| `gt`, `ge`, `lt`, `le` | `revenue gt 1000000` | Comparison |
| `and`, `or`, `not` | `statecode eq 0 and revenue gt 100` | Logical |
| `contains()` | `contains(name,'Contoso')` | Substring match (case-insensitive) |
| `startswith()` | `startswith(name,'Con')` | Prefix match |
| `endswith()` | `endswith(email,'@contoso.com')` | Suffix match |
| Lookup filter | `_accountid_value eq 00000000-...` | Filter by lookup GUID |
| Null check | `emailaddress1 ne null` | Not null |
| Date filter | `createdon ge 2024-01-01T00:00:00Z` | ISO 8601 dates |
| In operator | `Microsoft.Dynamics.CRM.In(PropertyName='statecode',PropertyValues=[0,1])` | Multiple values |
| Between | `Microsoft.Dynamics.CRM.Between(PropertyName='revenue',PropertyValues=[1000,5000])` | Range |

### $expand (Related Records)
```http
# Single lookup expansion
$expand=primarycontactid($select=fullname,emailaddress1)

# Collection-valued navigation (1:N children)
$expand=contact_customer_accounts($select=fullname;$filter=statecode eq 0;$top=10;$orderby=fullname)

# Nested expand (2 levels max)
$expand=primarycontactid($select=fullname;$expand=ownerid($select=fullname))
```

### $apply (Aggregations)
```http
GET /api/data/v9.2/opportunities
  ?$apply=
    filter(statecode eq 0)
    /groupby((ownerid),aggregate(estimatedvalue with sum as total_pipeline,opportunityid with countdistinct as deal_count))
  &$orderby=total_pipeline desc
```

### Pagination
```http
# First page
GET /api/data/v9.2/contacts?$top=100&$select=fullname

# Response includes @odata.nextLink if more pages exist:
"@odata.nextLink": "https://org.api.crm.dynamics.com/api/data/v9.2/contacts?$select=fullname&$skiptoken=..."
```
**Rule:** Always follow `@odata.nextLink` — never construct skip tokens manually.

### Formatted Values
```http
# Request:
Prefer: odata.include-annotations="OData.Community.Display.V1.FormattedValue"

# Response includes formatted values alongside raw:
{
  "statecode": 0,
  "statecode@OData.Community.Display.V1.FormattedValue": "Active",
  "_ownerid_value": "guid-here",
  "_ownerid_value@OData.Community.Display.V1.FormattedValue": "John Smith"
}
```

---

## FetchXML via Web API

```http
GET /api/data/v9.2/contacts?fetchXml=
<fetch top="50" no-lock="true">
  <entity name="contact">
    <attribute name="fullname"/>
    <attribute name="emailaddress1"/>
    <filter>
      <condition attribute="statecode" operator="eq" value="0"/>
      <filter type="or">
        <condition attribute="address1_city" operator="eq" value="Sydney"/>
        <condition attribute="address1_city" operator="eq" value="Melbourne"/>
      </filter>
    </filter>
    <link-entity name="account" from="accountid" to="parentcustomerid" alias="acc">
      <attribute name="name"/>
      <filter>
        <condition attribute="revenue" operator="gt" value="1000000"/>
      </filter>
    </link-entity>
    <order attribute="fullname" descending="false"/>
  </entity>
</fetch>
```
**Note:** URL-encode the FetchXML. Use FetchXML for: aggregates, OR filters, linked entity joins, complex multi-table queries.

---

## Relationship Operations

### Associate (Link Records)
```http
POST /api/data/v9.2/accounts(guid1)/contact_customer_accounts/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/contacts(guid2)"
}
```

### Disassociate (Unlink Records)
```http
# Single-valued navigation (lookup)
DELETE /api/data/v9.2/contacts(guid1)/parentcustomerid/$ref

# Collection-valued navigation (N:N)
DELETE /api/data/v9.2/accounts(guid1)/contact_customer_accounts(guid2)/$ref
```

### Set Lookup (Single-valued)
```http
PUT /api/data/v9.2/contacts(guid1)/parentcustomerid/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/accounts(guid2)"
}
```
