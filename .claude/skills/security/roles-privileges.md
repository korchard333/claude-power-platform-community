# Security — Roles & Privileges

## Security Roles

### Access Levels (Depth)
| Level | Icon | Scope | Description |
|---|---|---|---|
| None | — | No access | Cannot perform the operation |
| User | Single circle | Own records | Records owned by the user |
| Business Unit | Two circles | BU records | Records owned by anyone in user's BU |
| Parent: Child BU | Three circles | BU + children | Records in user's BU and all child BUs |
| Organization | Four circles | All records | Every record in the environment |

### Privileges (Operations)
| Privilege | Code | Applies To |
|---|---|---|
| Create | `prvCreate` | Creating new records |
| Read | `prvRead` | Viewing records |
| Write | `prvWrite` | Updating records |
| Delete | `prvDelete` | Deleting records |
| Append | `prvAppend` | Attaching record TO another (setting lookup on this record) |
| AppendTo | `prvAppendTo` | Having other records attached TO this one |
| Assign | `prvAssign` | Changing record ownership |
| Share | `prvShare` | Sharing record with another user/team |

### ⚠️ Append/AppendTo Are Required for ALL Lookup Relationships

The most common "confusing save error" in Dataverse: a user has Create/Read/Write on a table but can't save records with a lookup field — because Append/AppendTo are missing.

**Rule:** Every lookup relationship requires:
- `Append` on the **source table** (the table with the lookup column)
- `AppendTo` on the **target table** (the table being referenced)

When designing a security matrix, derive Append/AppendTo requirements directly from the data model:
| Source Table | Lookup Column | Target Table | Privilege Needed |
|---|---|---|---|
| contoso_project | ownerid | systemuser | Append on project, AppendTo on systemuser |
| contoso_task | contoso_projectid | contoso_project | Append on task, AppendTo on project |

Auto-derive this table for every relationship in the schema — don't add it manually as an afterthought.

---

### Standard Role Design Pattern
```
Role: [App] Admin
  All custom tables: Organization-level CRUD
  System tables (User, Team): Organization Read
  Notes/Activities: Organization-level CRUD
  Use: IT admins, support staff needing full access

Role: [App] Manager
  All custom tables: Business Unit-level CRUD
  Child records: Business Unit-level CRUD
  System tables: BU Read
  Notes/Activities: BU-level CRUD
  Use: Team leads, department managers

Role: [App] User
  Custom tables: User-level Create/Read/Write
  Read on reference tables: Organization Read (lookups need this)
  Notes/Activities: User-level CRUD
  Use: Standard end users working with own records

Role: [App] Reader
  Custom tables: Organization-level Read only
  No Create/Write/Delete on any table
  Use: Auditors, executives needing view-only access
```

### ⚠️ Org-Owned Child Tables: Global Visibility Trade-off

Org-owned child tables (e.g., invoice line items owned by org, while the parent invoice is user-owned) do NOT inherit row-level security from their parent. Anyone with Global Read on the child table can see ALL child records, regardless of parent ownership.

**When it's acceptable:** Small teams where all users should see all related records (consulting firms, internal tools). Simpler security = fewer support issues.

**When to revisit:** Growing teams with data sensitivity requirements. At that point, convert child tables to user-owned and implement security through the parent record's team/sharing model.

**Explicit decision:** Document this as a design choice in architecture specs. Don't let it be an accidental gap.

---

### Minimum Viable Privileges
```
For any user to USE an app, they need at minimum:
  ✓ Read on all tables shown in the app (including lookup targets)
  ✓ Create on tables they submit data to
  ✓ Write on tables they edit
  ✓ Append on records they set lookups FROM
  ✓ AppendTo on records they set lookups TO
  ✓ Read on 'Environment Variable Value' (if app uses env vars)
  ✓ prvReadPlugin on 'Plugin Assembly' (if custom APIs are used)

Commonly missed:
  ✗ AppendTo on Account when Contact has Account lookup
  ✗ Read on lookup target tables (e.g., read on Status table for dropdown)
  ✗ Read on 'Model-driven App' or 'Canvas App' entity
```
