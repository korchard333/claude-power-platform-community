# FetchXML Complete Reference

> For basic FetchXML usage via Web API, see crud-queries.md.
> For FetchXML performance tuning, see query-optimization.md.

## Overview

FetchXML is Dataverse's proprietary XML-based query language. Use FetchXML over OData `$filter` when you need:
- Complex aggregations (groupby, sum, avg)
- OR logic in filters
- Link-entity joins beyond 2 levels
- Fiscal date operators
- Hierarchical queries (above/under)
- Cross-column comparisons

---

## Element Hierarchy

```
<fetch>                         <- Root element
  <entity>                      <- Primary table
    <attribute />               <- Columns to return
    <all-attributes />          <- All columns (avoid in production)
    <filter>                    <- WHERE clause
      <condition />             <- Single predicate
      <filter />                <- Nested AND/OR group
    </filter>
    <link-entity>               <- JOIN
      <attribute />
      <filter>
        <condition />
      </filter>
      <link-entity />           <- Nested join
    </link-entity>
    <order />                   <- ORDER BY
  </entity>
</fetch>
```

---

## fetch Element

| Attribute | Values | Notes |
|---|---|---|
| `top` | Number | Max rows returned (mutually exclusive with paging) |
| `count` | Number | Page size (use with `page`) |
| `page` | Number | Page number (1-based) |
| `paging-cookie` | String | Cookie from previous page response |
| `aggregate` | `true` | Enable aggregation mode |
| `distinct` | `true` | Distinct results |
| `latematerialize` | `true` | Performance optimization for wide tables with joins |
| `no-lock` | `true` | No exclusive locks (default behavior in modern Dataverse) |
| `datasource` | `native` | Force Dataverse native query engine |

**Rule:** `top` and `page`/`count` are mutually exclusive. Use `top` for bounded one-off queries; use `page`/`count` for paginated iteration.

---

## entity / link-entity Element

| Attribute | Required | Notes |
|---|---|---|
| `name` | Yes | Logical name of the table |
| `from` | link-entity only | Column in the linked table |
| `to` | link-entity only | Column in the parent table |
| `alias` | No | Required if filtering on linked entity columns from outer filter |
| `link-type` | No | Join type (default: `inner`) |
| `intersect` | No | `true` for N:N relationship junction table |

### Link Types

| Type | SQL Equivalent | Returns | Use Case |
|---|---|---|---|
| `inner` (default) | INNER JOIN | Only matching records | Standard lookup joins |
| `outer` | LEFT OUTER JOIN | All parent records + nulls for unmatched | Include records with no related data |
| `exists` | WHERE EXISTS | Parent records only — no linked columns | Performance variant of inner; filter by existence |
| `in` | WHERE IN | Parent records only — no linked columns | Performance variant of inner; alternative to exists |
| `any` | Correlated subquery | Parent where ANY linked record matches filter | "Accounts with at least one active contact" |
| `not any` | NOT EXISTS | Parent where NO linked records match filter | "Accounts with no active contacts" |
| `all` | Correlated ALL | Parent where rows exist but NONE satisfy filter | Niche — rarely used |
| `not all` | Same as `any` | Equivalent to `any` despite the name | Avoid — use `any` for clarity |
| `matchfirstrowusingcrossapply` | CROSS APPLY TOP 1 | First matching linked record only | Performance: returns single match |

```xml
<!-- Accounts that have at least one active contact -->
<entity name="account">
  <attribute name="name"/>
  <link-entity name="contact" from="parentcustomerid" to="accountid" link-type="any">
    <filter>
      <condition attribute="statecode" operator="eq" value="0"/>
    </filter>
  </link-entity>
</entity>

<!-- Accounts with NO contacts (outer join + null check) -->
<entity name="account">
  <attribute name="name"/>
  <link-entity name="contact" from="parentcustomerid" to="accountid" link-type="outer" alias="c">
    <attribute name="contactid"/>
  </link-entity>
  <filter>
    <condition entityname="c" attribute="contactid" operator="null"/>
  </filter>
</entity>
```

---

## filter Element

| Attribute | Values | Default |
|---|---|---|
| `type` | `and`, `or` | `and` |

Filters can be nested to build complex logic:
```xml
<!-- (City = "Sydney" OR City = "Melbourne") AND Status = Active -->
<filter type="and">
  <condition attribute="statecode" operator="eq" value="0"/>
  <filter type="or">
    <condition attribute="address1_city" operator="eq" value="Sydney"/>
    <condition attribute="address1_city" operator="eq" value="Melbourne"/>
  </filter>
</filter>
```

---

## condition Element

| Attribute | Required | Notes |
|---|---|---|
| `attribute` | Yes | Column logical name |
| `operator` | Yes | Comparison operator |
| `value` | Depends | Single value for most operators |
| `valueof` | No | Cross-column comparison (replaces `value`) |
| `entityname` | No | Alias of link-entity (for filtering on joined columns in outer filter) |

### Multi-value Operators
```xml
<!-- IN list -->
<condition attribute="statecode" operator="in">
  <value>0</value>
  <value>1</value>
</condition>

<!-- BETWEEN -->
<condition attribute="revenue" operator="between">
  <value>100000</value>
  <value>500000</value>
</condition>
```

---

## Condition Operators by Data Type

### String Operators
| Operator | Description |
|---|---|
| `eq`, `ne` | Equal / Not equal |
| `like` | Wildcard match (`%` = any chars, `_` = single char) |
| `not-like` | Wildcard not match |
| `begins-with`, `not-begin-with` | Starts with / Does not start with |
| `ends-with`, `not-end-with` | Ends with / Does not end with |
| `null`, `not-null` | Is null / Is not null |
| `in`, `not-in` | In list / Not in list |

### Number Operators
| Operator | Description |
|---|---|
| `eq`, `ne`, `gt`, `ge`, `lt`, `le` | Standard comparisons |
| `between`, `not-between` | Range (inclusive) |
| `null`, `not-null` | Is null / Is not null |
| `in`, `not-in` | In list / Not in list |

### DateTime Operators
| Operator | Description |
|---|---|
| `eq`, `ne`, `gt`, `ge`, `lt`, `le` | Standard date comparisons |
| `on`, `on-or-before`, `on-or-after` | Date-specific comparisons |
| `today`, `yesterday`, `tomorrow` | Relative to current date |
| `this-week`, `last-week`, `next-week` | Relative week |
| `this-month`, `last-month`, `next-month` | Relative month |
| `this-year`, `last-year`, `next-year` | Relative year |
| `last-x-days`, `next-x-days` | Last/next N days (value = N) |
| `last-x-months`, `next-x-months` | Last/next N months |
| `last-x-years`, `next-x-years` | Last/next N years |
| `in-fiscal-period`, `in-fiscal-year` | Fiscal period (org-configured) |
| `in-fiscal-period-and-year` | Specific fiscal period + year |
| `in-or-before-fiscal-period-and-year` | On or before fiscal period + year |
| `in-or-after-fiscal-period-and-year` | On or after fiscal period + year |
| `last-fiscal-year`, `this-fiscal-year`, `next-fiscal-year` | Relative fiscal year |

### Lookup / GUID Operators
| Operator | Description |
|---|---|
| `eq`, `ne` | Match by GUID |
| `null`, `not-null` | Is set / Is not set |
| `eq-userid`, `ne-userid` | Current user |
| `eq-userlanguage` | Current user's language |
| `eq-businessid`, `ne-businessid` | Current user's business unit |

### Choice / OptionSet Operators
| Operator | Description |
|---|---|
| `eq`, `ne` | Match by integer value |
| `in`, `not-in` | In list of integer values |
| `contain-values` | Multi-select choice contains ALL specified values |
| `not-contain-values` | Multi-select choice does not contain values |
| `null`, `not-null` | Is set / Is not set |

### Hierarchical Operators
| Operator | Description |
|---|---|
| `above` | Ancestors of specified record |
| `under` | Descendants of specified record |
| `eq-or-above` | Record or its ancestors |
| `eq-or-under` | Record or its descendants |
| `not-under` | Not a descendant |

---

## order Element

| Attribute | Values | Notes |
|---|---|---|
| `attribute` | Column logical name | Required |
| `descending` | `true`/`false` | Default: `false` (ascending) |
| `alias` | String | For ordering by aggregated columns |

**Rule:** Always include an `<order>` element when paging. Without deterministic ordering, pages may return duplicate or missing records.

---

## Aggregation

```xml
<fetch aggregate="true">
  <entity name="opportunity">
    <attribute name="estimatedvalue" aggregate="sum" alias="total_pipeline"/>
    <attribute name="opportunityid" aggregate="countcolumn" alias="deal_count"/>
    <attribute name="ownerid" groupby="true" alias="owner"/>
    <filter>
      <condition attribute="statecode" operator="eq" value="0"/>
    </filter>
  </entity>
</fetch>
```

| Aggregate Function | Description |
|---|---|
| `count` | Count all rows (no attribute needed) |
| `countcolumn` | Count non-null values |
| `sum` | Sum of numeric column |
| `avg` | Average of numeric column |
| `min` / `max` | Minimum / Maximum value |

---

## Paging with Cookies

```python
page = 1
cookie = ""
all_records = []

while True:
    fetch = f'''<fetch count="5000" page="{page}" {cookie}>
      <entity name="contact">
        <attribute name="fullname"/>
        <order attribute="contactid"/>
      </entity>
    </fetch>'''

    result = api_get(f"contacts?fetchXml={url_encode(fetch)}")
    all_records.extend(result["value"])

    if "@Microsoft.Dynamics.CRM.fetchxmlpagingcookie" not in result:
        break  # No more pages

    raw_cookie = result["@Microsoft.Dynamics.CRM.fetchxmlpagingcookie"]
    cookie = f'paging-cookie="{xml_encode(raw_cookie)}"'
    page += 1
```

**Rules:**
- Always include `<order>` with a unique column (e.g., primary key) for deterministic paging
- Simple paging (page + count, no cookie) has a **50,000 row limit**
- Paging cookie paging has **no row limit** but performance degrades past ~500K rows
- The cookie value must be **XML-encoded** when placed in the XML attribute (URL-decode twice, then XML-encode)

---

## Cross-Column Comparison

```xml
<!-- Records where modified date is after created date + 30 days -->
<condition attribute="modifiedon" operator="gt" valueof="createdon"/>
```

`valueof` compares two columns in the same row. Limited to same-entity columns of compatible types.

---

## Anti-Patterns / Gotchas

- Mixing `top` with `page`/`count` — mutually exclusive, causes errors
- Not URL-encoding FetchXML in Web API GET requests — breaks on `&`, `<`, `>`
- Missing `<order>` with paging — causes duplicate/missing records across pages
- Using `<all-attributes/>` — returns every column, severe performance impact
- Forgetting `alias` on `<link-entity>` — cannot reference linked columns in outer `<filter>`
- Not HTML-encoding the paging cookie — the cookie contains XML characters that break the fetch element
- Using `like` without wildcards — `like` without `%` or `_` behaves as exact match

## Official Reference

- https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/overview
- https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/reference/
- https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/page-results
