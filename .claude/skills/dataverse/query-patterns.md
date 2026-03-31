# Dataverse — Query Patterns

## OData (Web API) — For Simple Queries
```http
GET /api/data/v9.2/contoso_orders
  ?$select=contoso_name,contoso_duedate,statecode
  &$expand=contoso_AccountId($select=name)
  &$filter=statecode eq 0
  &$orderby=contoso_duedate asc
  &$top=50
```

**Rules:**
- ALWAYS use `$select` — never fetch all columns
- ALWAYS use `$top` for pagination
- ALWAYS use `$orderby` for deterministic results
- Use `$expand` sparingly — prefer on-demand lookup resolution for large tables

---

## FetchXML — For Complex Queries
```xml
<fetch aggregate="true" top="50" no-lock="true">
  <entity name="contoso_order">
    <attribute name="contoso_accountid" groupby="true" alias="account"/>
    <attribute name="contoso_orderid" aggregate="count" alias="order_count"/>
    <attribute name="contoso_totalamount" aggregate="sum" alias="total_value"/>
    <filter>
      <condition attribute="statecode" operator="eq" value="0"/>
    </filter>
  </entity>
</fetch>
```

Use FetchXML when: aggregates, OR filters, linked entity conditions, complex multi-entity joins.

---

## Dataverse Lookup Handling in Code Apps
```tsx
// Reading: lookup fields appear as _schemaname_value (GUID)
const accountId = record._contoso_accountid_value;

// Writing: use OData bind syntax
const payload = {
  "contoso_AccountId@odata.bind": `/accounts(${selectedAccountId})`,
};

// Resolving: fetch on-demand per visible record
function useLookupResolver(entitySet: string, id: string | null) {
  return useQuery({
    queryKey: [entitySet, id],
    queryFn: () => service.get(id!, { select: ["name"] }),
    enabled: !!id,
  });
}
```
