# Power Pages — Web Roles & Table Permissions

## Web Roles

Web roles are the equivalent of security roles for portal users. They control page access and table permissions.

```
Web Role: "Customer"
  ├── Table Permissions: Read own cases, Create new cases
  ├── Page Permissions: Access "My Cases", "Submit Request"
  └── Cannot access: Admin pages, internal data

Web Role: "Partner Manager"
  ├── Table Permissions: Read/Write partner-scoped records
  ├── Page Permissions: Access "Partner Dashboard"
  └── Additional: See records for their partner account
```

## Table Permissions (Row-Level Security for Portals)

**CRITICAL:** By default, NO external user can see ANY Dataverse data. You must explicitly grant access via table permissions.

> **Note:** Table permissions can be managed via the **Design Studio** (primary interface) or the Portal Management app. The Parent scope is only configurable via Portal Management app.

| Scope | What It Controls | Use Case |
|---|---|---|
| Global | All records of this table | Public data (product catalog) |
| Contact | Records owned by the logged-in contact | "My cases", "My orders" |
| Account | Records linked to the contact's parent account | Partner data sharing |
| Parent | Child records of a parent table the user has access to | Order lines under an order |
| Self | The user's own contact record | Profile page |

> **Limitation:** Polymorphic lookups are **not supported** in parent-child table permissions. Use a specific relationship, not a polymorphic lookup column.

## Table Permission Configuration

```
Table: contoso_case
  Scope: Contact (user sees only their own cases)
  Privileges: Read, Create, Write (no Delete)
  Related table: Note (Append + AppendTo)

Table: contoso_product
  Scope: Global (everyone sees all products)
  Privileges: Read only

Table: contoso_order
  Scope: Account (user sees orders for their company)
  Privileges: Read
  Child permission:
    Table: contoso_orderline
    Scope: Parent (lines visible when parent order is visible)
    Relationship: contoso_order_orderlines
    Privileges: Read
```

## Page Permissions

```
Page: "Submit Support Request"
  Web Role: Customer
  Access: Grant Change (read + interact with forms)

Page: "Admin Dashboard"
  Web Role: Administrator
  Access: Grant Change
  ✗ No access for Customer role — page is invisible to them
```

## Table Permissions for Code Sites

Code Sites respect the same Power Pages table permissions as Liquid sites.

| Scope | Code | Use Case |
|---|---|---|
| Global | 756150000 | Public reference data (read-only recommended) |
| Contact | 756150001 | "My records" — owned by logged-in user |
| Account | 756150002 | Records linked to user's parent account |
| Parent | 756150003 | Child records of accessible parent (`parententitypermission` + `parentrelationshipname`) |
| Self | 756150004 | User's own contact record (profile page) |

**Append/AppendTo for lookups:** When a table has lookup columns and `create` or `write` is enabled:
- Source table (with the lookup) needs `append: true`
- Target table needs `appendto: true`
