# Model-Driven Apps — Sitemap

## Sitemap Architecture

```
App Module
└── SiteMap
    └── <SiteMap>
        └── <Area>              ← Bottom tabs (if >1 Area)
            └── <Group>         ← Left-nav groups (within an Area)
                └── <SubArea>   ← Individual page links (entity, dashboard, URL)
```

### ⚠️ CRITICAL: Single Area = Left-Nav, Multiple Areas = Bottom Tabs

In Unified Interface, **each `<Area>` renders as a bottom tab** and **each `<Group>` renders as a left-nav section** within the currently selected Area.

| Structure | Rendering |
|---|---|
| 1 Area + N Groups | Left-nav with N collapsible sections (✅ recommended) |
| N Areas + Groups | Bottom tab bar with N tabs, each having its own left-nav |

**For most business apps, use a single `<Area>` with multiple `<Group>` elements.** This gives users a clean left-nav panel without the confusion of bottom tabs.

```xml
<!-- ✅ CORRECT: Single Area, multiple Groups = clean left-nav -->
<SiteMap>
  <Area Id="MainArea" IntroducedVersion="1.0" ShowGroups="true">
    <Titles><Title LCID="1033" Title="Main"/></Titles>
    <Group Id="Operations" IntroducedVersion="1.0">
      <Titles><Title LCID="1033" Title="Operations"/></Titles>
      <SubArea Id="Orders" Entity="contoso_order" IntroducedVersion="1.0">
        <Titles><Title LCID="1033" Title="Orders"/></Titles>
      </SubArea>
      <SubArea Id="Tasks" Entity="contoso_task" IntroducedVersion="1.0">
        <Titles><Title LCID="1033" Title="Tasks"/></Titles>
      </SubArea>
    </Group>
    <Group Id="Configuration" IntroducedVersion="1.0">
      <Titles><Title LCID="1033" Title="Configuration"/></Titles>
      <SubArea Id="Settings" Entity="contoso_setting" IntroducedVersion="1.0">
        <Titles><Title LCID="1033" Title="Settings"/></Titles>
      </SubArea>
    </Group>
  </Area>
</SiteMap>

<!-- ❌ WRONG: Multiple Areas = unexpected bottom tab bar -->
<SiteMap>
  <Area Id="Operations" ...>
    <Group Id="Ops">
      <SubArea Id="Orders" Entity="contoso_order" .../>
    </Group>
  </Area>
  <Area Id="Configuration" ...>
    <Group Id="Config">
      <SubArea Id="Settings" Entity="contoso_setting" .../>
    </Group>
  </Area>
</SiteMap>
```

---

## Sitemap XML Schema Rules

### Required Attributes

| Attribute | Required On | Notes |
|---|---|---|
| `Id` | Area, Group, SubArea | Unique identifier — use meaningful names |
| `IntroducedVersion` | Area, Group, SubArea | **Required** — omitting causes XSD validation errors. Use `"1.0"` |

### Labels: Use `<Titles>` Child Elements

Sitemap labels are NOT plain attributes — they use `<Titles>` child elements with LCID:

```xml
<!-- ✅ CORRECT: Titles as child elements -->
<Area Id="MainArea" IntroducedVersion="1.0" ShowGroups="true">
  <Titles><Title LCID="1033" Title="Main"/></Titles>
</Area>

<!-- ❌ WRONG: Title as direct attribute (not valid in sitemap XML schema) -->
<Area Id="MainArea" Title="Main" IntroducedVersion="1.0"/>
```

LCID `1033` = English (US). For multi-language apps, add additional `<Title>` elements with different LCIDs.

### SubArea Types

| Type | Attribute | Example |
|---|---|---|
| Entity (table) | `Entity="contoso_order"` | Standard entity page — shows views/forms |
| Dashboard | `GetStartedPanePath="Default_Dashboard"` | Links to a dashboard |
| URL | `Url="https://..."` | External or internal web page |
| Web Resource | `Url="$webresource:contoso_/pages/custom.html"` | HTML web resource |

### ⚠️ Invalid Attributes — Do NOT Use

| Attribute | Problem |
|---|---|
| `DashboardType` | Fails XSD validation — not a valid sitemap attribute |
| `Title` (direct on element) | Use `<Titles><Title LCID="..." Title="..."/></Titles>` instead |

---

## Sitemap via Web API

### Retrieve and PATCH the Auto-Generated Sitemap

When you create an app module, Dataverse auto-generates a sitemap with placeholder content ("Area1", "Group1"). You must PATCH it with proper XML.

```python
# 1. Find the sitemap for this app module
sitemaps = api_get(f"sitemaps?$select=sitemapid,sitemapxml")
sitemap_id = sitemaps["value"][0]["sitemapid"]

# 2. PATCH with proper XML
sitemap_xml = '''<SiteMap>
  <Area Id="MainArea" IntroducedVersion="1.0" ShowGroups="true">
    <Titles><Title LCID="1033" Title="Main"/></Titles>
    <Group Id="Operations" IntroducedVersion="1.0">
      <Titles><Title LCID="1033" Title="Operations"/></Titles>
      <SubArea Id="Orders" Entity="contoso_order" IntroducedVersion="1.0">
        <Titles><Title LCID="1033" Title="Orders"/></Titles>
      </SubArea>
    </Group>
  </Area>
</SiteMap>'''

api_patch(f"sitemaps({sitemap_id})", {"sitemapxml": sitemap_xml}, token)
```

### Bind Sitemap to App Module

```python
api_post("AddAppComponents", {
    "AppId": app_module_id,
    "Components": [
        {"@odata.type": "Microsoft.Dynamics.CRM.sitemap", "sitemapid": sitemap_id}
    ]
}, token, extra_headers={"MSCRM.SolutionUniqueName": solution_name})
```

### ⚠️ Sitemap OData Filter Limitation

`sitemaps` entity does NOT support filtering by `_appmoduleid_value`. To find the correct sitemap for a specific app module, query all sitemaps and match by context, or use the app module's sitemap binding.

---

## Dashboard Navigation in Sitemap

Dashboards are accessible via the built-in dashboard selector in Unified Interface — you do NOT need a dedicated sitemap SubArea for dashboards. If you add a dashboard SubArea, it may conflict with entity SubAreas.

**Recommended approach:** Bind dashboards to the app module via `AddAppComponents` — they appear automatically in the dashboard selector without a sitemap entry.

---

## Common Failures

| Issue | Cause | Fix |
|---|---|---|
| Sitemap shows "Area1" placeholder | Auto-generated sitemap not patched | PATCH with proper XML |
| XSD validation error | Missing `IntroducedVersion` attribute | Add `IntroducedVersion="1.0"` on all elements |
| Bottom tabs instead of left-nav | Multiple `<Area>` elements | Restructure to single Area with multiple Groups |
| `DashboardType` error | Invalid attribute on SubArea | Remove `DashboardType` — use entity SubAreas or built-in dashboard selector |
| Labels not showing | Using `Title` attribute directly | Use `<Titles><Title LCID="1033" Title="..."/></Titles>` |
| SubAreas not visible | Entity not added to app module | Add entity via `AddAppComponents` first |
