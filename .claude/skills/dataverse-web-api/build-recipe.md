# End-to-End Model-Driven App Build Recipe

> This is the **master build sequence** for creating a complete Dataverse solution via Web API.
> Each phase references the detailed sub-file for that topic.

## Before You Start

1. **Use Python** for builds — NOT bash. Bash mangles OData `$filter`/`$select` parameters and can't safely handle multi-line JSON/XML. See auth-and-scripting.md.
2. **Authenticate** via Azure CLI: `az account get-access-token --resource "https://{org}.crm6.dynamics.com/"`. See auth-and-scripting.md.
3. **Generate real GUIDs** for every form/view XML element — never use placeholder zeros.
4. **Every script must be idempotent** — check-before-create on every operation. See auth-and-scripting.md.

---

## Build Sequence (8 Phases)

### Phase 1: Publisher + Solution

```python
# 1. Check/create publisher
publisher = api_get(f"publishers?$filter=uniquename eq '{prefix}'&$select=publisherid")
if not publisher["value"]:
    api_post("publishers", {
        "uniquename": prefix,
        "friendlyname": friendly_name,
        "customizationprefix": prefix,
        "customizationoptionvalueprefix": 10000
    })

# 2. Check/create solution
solution = api_get(f"solutions?$filter=uniquename eq '{solution_name}'&$select=solutionid")
if not solution["value"]:
    api_post("solutions", {
        "uniquename": solution_name,
        "friendlyname": solution_friendly,
        "version": "1.0.0.0",
        "publisherid@odata.bind": f"/publishers({publisher_id})"
    })
```

> ⚠️ NEVER include `MSCRM.SolutionUniqueName` header when creating the publisher or solution itself — the solution doesn't exist yet. These are the only two API calls where this header must be omitted.

**Reference:** solution-management.md

---

### Phase 2: Tables (Entities)

Create tables with primary name column inline. Always include `@odata.type` at root AND on each inline attribute.

```python
table_payload = {
    "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
    "SchemaName": f"{Prefix}_Project",
    "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Project", "LanguageCode": 1033}]},
    "DisplayCollectionName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Projects", "LanguageCode": 1033}]},
    "Description": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Project tracking", "LanguageCode": 1033}]},
    "OwnershipType": "UserOwned",
    "HasNotes": True,
    "HasActivities": False,
    "IsActivity": False,
    "Attributes": [{
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        "SchemaName": f"{Prefix}_Name",
        "RequiredLevel": {"Value": "ApplicationRequired"},
        "MaxLength": 200,
        "IsPrimaryName": True,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Name", "LanguageCode": 1033}]}
    }]
}
api_post("EntityDefinitions", table_payload, headers={"MSCRM.SolutionUniqueName": solution_name})
```

**Key rules:**
- `@odata.type` required on root EntityMetadata AND each Attribute
- `IsPrimaryName: True` required on exactly one StringAttributeMetadata
- `OwnershipType`: Use `"UserOwned"` for most tables, `"OrganizationOwned"` for reference/lookup tables (affects security depth — see Phase 8)

**Reference:** metadata.md

---

### Phase 3: Columns (Attributes)

Add columns to existing tables. Common types:

```python
# String column
api_post(f"EntityDefinitions(LogicalName='{table}')/Attributes", {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": f"{Prefix}_Description",
    "MaxLength": 2000,
    "FormatName": {"Value": "TextArea"},  # or "Text", "Email", "Url", "Phone"
    "RequiredLevel": {"Value": "None"},
    "DisplayName": label("Description")
}, headers={"MSCRM.SolutionUniqueName": solution_name})

# Choice (OptionSet) column
api_post(f"EntityDefinitions(LogicalName='{table}')/Attributes", {
    "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    "SchemaName": f"{Prefix}_Status",
    "RequiredLevel": {"Value": "ApplicationRequired"},
    "OptionSet": {
        "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
        "IsGlobal": False,
        "OptionSetType": "Picklist",
        "Options": [
            {"Value": None, "Label": label("Active")},
            {"Value": None, "Label": label("Inactive")},
            {"Value": None, "Label": label("Archived")}
        ]
    },
    # ⚠️ Pass None (null) for Value to let the system auto-assign using the publisher's
    # Option Value Prefix. E.g., publisher prefix 88000 → values 88000, 88001, 88002.
    # The prefix is a 5-digit integer (10000-99999), NOT base×1000.
    "DisplayName": label("Status")
}, headers={"MSCRM.SolutionUniqueName": solution_name})

# DateTime column
{"@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata", "Format": "DateOnly", ...}

# Integer column
{"@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata", "MinValue": 0, "MaxValue": 100, ...}

# Decimal/Money column
{"@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata", "PrecisionSource": 2, ...}

# Boolean (Two Option) column
{"@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata", "OptionSet": {"TrueOption": {"Value": 1, "Label": label("Yes")}, "FalseOption": {"Value": 0, "Label": label("No")}}, ...}

# Lookup column — created via relationship (see Phase 3b)
```

**Reference:** metadata.md, advanced-column-types.md

---

### Phase 3b: Relationships

```python
api_post("RelationshipDefinitions", {
    "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
    "SchemaName": f"{prefix}_project_tasks",
    "ReferencedEntity": f"{prefix}_project",
    "ReferencingEntity": f"{prefix}_task",
    "Lookup": {
        "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
        "SchemaName": f"{Prefix}_ProjectId",
        "DisplayName": label("Project"),
        "RequiredLevel": {"Value": "ApplicationRequired"}
    },
    "CascadeConfiguration": {
        "Assign": "NoCascade", "Delete": "RemoveLink", "Merge": "NoCascade",
        "Reparent": "NoCascade", "Share": "NoCascade", "Unshare": "NoCascade",
        "RollupView": "NoCascade"
    }
}, headers={"MSCRM.SolutionUniqueName": solution_name})
```

> ⚠️ All text in XML labels must be XML-escaped. Common failure: `&` in labels ("Time & Materials") → must be `&amp;`. Build an `xml_escape()` helper into your script template: `xml_escape = lambda s: s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')`

**Reference:** metadata.md

---

### Phase 4: Views (SavedQuery)

Create system views with aligned fetchxml + layoutxml.

**Rule:** Every `<cell name='x'/>` in layoutxml MUST have a matching `<attribute name='x'/>` in fetchxml. Missing attributes = blank columns.

```python
api_post("savedqueries", {
    "name": "Active Projects",
    "returnedtypecode": f"{prefix}_project",
    "querytype": 0,
    "isdefault": True,
    "fetchxml": "<fetch><entity name='{prefix}_project'><attribute name='{prefix}_name'/><attribute name='{prefix}_status'/><attribute name='createdon'/><attribute name='statecode'/><filter><condition attribute='statecode' operator='eq' value='0'/></filter><order attribute='{prefix}_name'/></entity></fetch>",
    "layoutxml": "<grid name='resultset' object='1' jump='{prefix}_name' select='1' icon='1' preview='1'><row name='result' id='{prefix}_projectid'><cell name='{prefix}_name' width='250'/><cell name='{prefix}_status' width='150'/><cell name='createdon' width='150'/><cell name='statecode' width='100'/></row></grid>"
}, headers={"MSCRM.SolutionUniqueName": solution_name})
```

**Idempotent check (MANDATORY — views duplicate silently):**

`savedqueries` and `systemforms` have **no unique constraint on name**. Every `POST` creates a new record even if one with the same name exists. Always query by name + `returnedtypecode` before creating:

```python
existing = api_get(f"savedqueries?$filter=name eq 'Active Projects' and returnedtypecode eq '{prefix}_project'&$select=savedqueryid")
if existing["value"]:
    view_id = existing["value"][0]["savedqueryid"]
    print(f"View exists: {view_id}")
else:
    # Create view...
```

### ⚠️ MANDATORY: Update System-Generated Views After Table Creation

Dataverse auto-creates these views when a table is created:

| View | QueryType | Default Columns |
|---|---|---|
| Active [Plural Name] | 0 (Public) | Name + Created On only |
| Inactive [Plural Name] | 0 (Public) | Name + Created On only |
| Quick Find Active [Plural Name] | 8192 | Name only |
| [Plural Name] Lookup View | 64 | Name only |
| [Plural Name] Associated View | 16384 | Name only |
| [Plural Name] Advanced Find View | 1 | Name + Created On only |

**These bare 2-column views are the default experience.** They power lookup dialogs, quick find search, subgrid displays, and the main entity grid. Leaving them with only Name + Created On is the **#1 UX complaint** in Dataverse apps.

**Mandatory build step after creating custom tables:**

```python
# 1. Query all system-generated views for the table
sys_views = api_get(
    f"savedqueries?$filter=returnedtypecode eq '{prefix}_project'"
    f"&$select=savedqueryid,name,querytype,isdefault,fetchxml,layoutxml"
)

for view in sys_views["value"]:
    qt = view["querytype"]

    if qt == 0 and "Active" in view["name"]:
        # UPDATE the Active view with full column set
        api_patch(f"savedqueries({view['savedqueryid']})", {
            "fetchxml": active_fetchxml,    # Include all relevant columns
            "layoutxml": active_layoutxml,  # Match columns from fetchxml
            "isdefault": True               # Keep as default
        }, token)

    elif qt == 64:
        # LOOKUP view — show the most useful identifying columns
        api_patch(f"savedqueries({view['savedqueryid']})", {
            "fetchxml": lookup_fetchxml,
            "layoutxml": lookup_layoutxml
        }, token)

    elif qt == 8192:
        # QUICK FIND view — add searchable columns to filter
        # Quick Find fetchxml needs: <filter type="or"> with searchable columns
        api_patch(f"savedqueries({view['savedqueryid']})", {
            "fetchxml": quickfind_fetchxml,
            "layoutxml": quickfind_layoutxml
        }, token)
```

> ⚠️ If you also create custom views and want them as default, set `isdefault=false` on the bare system view and `isdefault=true` on your custom view. Use `PATCH /savedqueries({id})`.

**Reference:** customizations.md

---

### Phase 5: Forms (SystemForm)

Create main forms with tabs, sections, fields, and subgrids.

**Key rules:**
- Generate real GUIDs for every `id` attribute in form XML
- Subgrid classid: `{E7A81278-8635-4d9e-8D4D-59480B391C5B}`
- Query actual view GUIDs for subgrid `ViewId` — never use zeros
- Field control classids: `{4273EDBD-AC1D-40d3-9FB2-095C621B552D}` (text), `{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}` (choice/dropdown), `{5B773807-9FB2-42db-97C3-7A91EFF8ADFF}` (datetime), `{C6D124CA-7EDA-4a60-AEA9-7FB8D318B68F}` (lookup)

**Reference:** customizations.md

---

### Phase 6: Charts + Dashboard

**Charts:** Use attribute-based axis titles (NOT nested elements):
```xml
<AxisY Title="Count"/>    <!-- CORRECT -->
<AxisY><Title>Count</Title></AxisY>  <!-- WRONG — Dataverse rejects this -->
```

**Dashboards:** Form type 0, objecttypecode "none". Do NOT use `IsUserDefined` attribute on tab elements.

> ⚠️ Use solution-specific names for dashboards (e.g., "Contoso HR Operations Dashboard" not "Operations Dashboard"). Idempotent checks by name can accidentally match a dashboard from another solution and bind the wrong one to your app module. Always scope name checks to solution components.

**Reference:** customizations.md (Charts and Dashboards sections)

---

### Phase 7: App Module + Sitemap

**Create the app module:**
- `uniquename`: Do NOT include publisher prefix — it auto-prefixes
- `clienttype: 4` (Unified Interface)
- `webresourceid`: GUID of an existing SVG web resource

**Add components** via `AddAppComponents` — each MUST use **entity-specific** `@odata.type` (e.g., `Microsoft.Dynamics.CRM.savedquery`, `Microsoft.Dynamics.CRM.systemform`) with matching primary key field

**Configure sitemap** — PATCH the auto-generated sitemap with proper Area/Group/SubArea XML:
- Include `IntroducedVersion` on all elements
- Use `<Titles><Title LCID='1033' Title='...'/></Titles>` for labels
- Do NOT use `DashboardType` attribute (fails XSD validation)

**Validate then publish** the app module.

**Reference:** solution-management.md (App Module Management section)

---

### Phase 8: Security Roles

**Create roles** at root business unit. **Assign privileges** per table using `AddPrivilegesRole` (bound action):

```
POST /roles({id})/Microsoft.Dynamics.CRM.AddPrivilegesRole
```

**⚠️ Org-owned tables only support Global depth.** Check `OwnershipType` before assigning.

Typical 3-role pattern:
| Role | User-Owned Tables | Org-Owned Tables |
|---|---|---|
| Admin | Global all operations | Global all operations |
| Manager | Local (BU) CRUD | Global Read |
| User | Basic (own) CRUD | Global Read |

**Reference:** security-model-api.md

---

### Phase 9: Publish All

```python
api_post("PublishAllXml", {})  # Empty body {} is REQUIRED
```

---

## Common Failure Points

| Issue | Phase | Fix |
|---|---|---|
| Double-prefixed uniquename | 7 | Don't include publisher prefix in uniquename |
| Chart rendering broken | 6 | Use axis title as XML attribute, not nested element |
| Dashboard creation fails | 6 | Remove `IsUserDefined` from tab elements; use type=0 |
| App invisible after creation | 7 | Use `RetrieveUnpublishedMultiple` to find unpublished apps |
| AddAppComponents fails | 7 | Use entity-specific `@odata.type` (savedquery, systemform, savedqueryvisualization) — NOT appcomponent |
| Sitemap shows "Area1" placeholder | 7 | PATCH sitemap with proper XML including IntroducedVersion |
| Security role depth error | 8 | Org-owned tables only accept Global depth |
| Blank view columns | 4 | Ensure fetchxml and layoutxml attributes match |
| 412 on re-run kills script | All | Handle 412/409 as "already exists", don't use `set -euo pipefail` |
| PublishAllXml returns 411 | 9 | Send empty body `{}` |
| Subgrid shows no data | 5 | Query real view GUID — never use zero GUID |
| Cleanup deletes other solutions | — | Always scope queries to `_solutionid_value` |

## Python Build Script Template

```python
import subprocess, json, uuid, urllib.parse, requests

def get_token(org_url):
    return subprocess.check_output([
        "az", "account", "get-access-token",
        "--resource", org_url, "--query", "accessToken", "-o", "tsv"
    ]).decode().strip()

ORG_URL = "https://{org}.crm6.dynamics.com"
BASE_URL = f"{ORG_URL}/api/data/v9.2"
SOLUTION = "YourSolution"
PREFIX = "yourprefix"

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "OData-Version": "4.0",
        "Accept": "application/json",
        "MSCRM.SolutionUniqueName": SOLUTION,
        "Prefer": "odata.include-annotations=*"
    }

def api_get(path, token):
    r = requests.get(f"{BASE_URL}/{path}", headers=get_headers(token))
    r.raise_for_status()
    return r.json()

def api_post(path, data, token, extra_headers=None):
    headers = get_headers(token)
    if extra_headers:
        headers.update(extra_headers)
    r = requests.post(f"{BASE_URL}/{path}", headers=headers, json=data)
    if r.status_code in (409, 412):
        print(f"  Already exists (HTTP {r.status_code}), skipping")
        return None
    r.raise_for_status()
    return r

def api_patch(path, data, token):
    r = requests.patch(f"{BASE_URL}/{path}", headers=get_headers(token), json=data)
    r.raise_for_status()
    return r

def new_guid():
    return str(uuid.uuid4())

def label(text, lang=1033):
    return {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [{
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": text, "LanguageCode": lang
        }]
    }

# Token refresh between phases
token = get_token(ORG_URL)

# Phase 1: Publisher + Solution
print("=== Phase 1: Publisher + Solution ===")
# ... (see solution-management.md)

# Phase 2-8: Build sequence
# Refresh token between phases:
token = get_token(ORG_URL)
print("=== Phase 2: Tables ===")
# ... etc
```

## Official Reference

- https://learn.microsoft.com/power-apps/developer/data-platform/webapi/overview
- https://learn.microsoft.com/power-apps/developer/model-driven-apps/create-manage-model-driven-apps-using-code
