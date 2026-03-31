# HTML Web Resources & Dashboards

HTML web resources provide custom UI within Model-Driven Apps -- dashboards, dialogs, data visualizations, and embedded tools.

---

## Accessing Parent Xrm Context

HTML web resources run in an iframe. Access the parent's Xrm context to call Dataverse APIs:

```javascript
function getXrm() {
  // Try parent first (embedded in form)
  if (window.parent && window.parent.Xrm) return window.parent.Xrm;
  // Try opener (opened in dialog/new window)
  if (window.opener && window.opener.Xrm) return window.opener.Xrm;
  return null;
}
```

> **Important:** `getXrm()` may return null if the web resource is opened outside of a Model-Driven App context (e.g., direct URL access). Always null-check before using.

---

## Custom Dashboard Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Project Dashboard</title>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 16px; background: #f5f5f5; }
    .card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 8px 0; color: #333; }
    .metric { font-size: 32px; font-weight: 600; color: #2563eb; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
    .loading { color: #888; font-style: italic; }
    .error { color: #dc2626; }
  </style>
</head>
<body>
  <div class="grid">
    <div class="card">
      <h3>Active Projects</h3>
      <div id="activeCount" class="metric loading">Loading...</div>
    </div>
    <div class="card">
      <h3>Overdue Tasks</h3>
      <div id="overdueCount" class="metric loading">Loading...</div>
    </div>
    <div class="card">
      <h3>Total Budget</h3>
      <div id="totalBudget" class="metric loading">Loading...</div>
    </div>
  </div>

  <script>
    function getXrm() {
      if (window.parent && window.parent.Xrm) return window.parent.Xrm;
      if (window.opener && window.opener.Xrm) return window.opener.Xrm;
      return null;
    }

    async function loadDashboardData() {
      const Xrm = getXrm();
      if (!Xrm) {
        document.querySelectorAll('.metric').forEach(el => {
          el.textContent = 'Xrm not available';
          el.className = 'metric error';
        });
        return;
      }

      try {
        // Active projects count
        const projects = await Xrm.WebApi.retrieveMultipleRecords(
          "contoso_project",
          "?$select=contoso_projectid&$filter=statecode eq 0"
        );
        document.getElementById("activeCount").textContent = projects.entities.length;
        document.getElementById("activeCount").className = "metric";

        // Overdue tasks
        const today = new Date().toISOString().split("T")[0];
        const tasks = await Xrm.WebApi.retrieveMultipleRecords(
          "contoso_task",
          `?$select=contoso_taskid&$filter=statecode eq 0 and contoso_duedate lt ${today}`
        );
        document.getElementById("overdueCount").textContent = tasks.entities.length;
        document.getElementById("overdueCount").className = "metric";

        // Total budget (FetchXML aggregation)
        const fetchXml = encodeURIComponent(`
          <fetch aggregate="true">
            <entity name="contoso_project">
              <attribute name="contoso_budget" aggregate="sum" alias="total"/>
              <filter>
                <condition attribute="statecode" operator="eq" value="0"/>
              </filter>
            </entity>
          </fetch>
        `);
        const budgetResult = await Xrm.WebApi.retrieveMultipleRecords(
          "contoso_project", `?fetchXml=${fetchXml}`
        );
        const total = budgetResult.entities[0]?.total || 0;
        document.getElementById("totalBudget").textContent =
          "$" + Number(total).toLocaleString("en-AU", { minimumFractionDigits: 0 });
        document.getElementById("totalBudget").className = "metric";
      } catch (err) {
        console.error("Dashboard error:", err);
        document.querySelectorAll('.loading').forEach(el => {
          el.textContent = 'Error loading data';
          el.className = 'metric error';
        });
      }
    }

    document.addEventListener("DOMContentLoaded", loadDashboardData);
  </script>
</body>
</html>
```

---

## Responsive Sizing

HTML web resources embedded in dashboards or forms resize with the container. Design for flexible layouts:

```css
/* Fill available space */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

/* Responsive grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 12px;
}

/* For embedded in form sections (fixed height) */
.compact-view {
  max-height: 400px;
  overflow-y: auto;
}
```

### Handling Resize Events

```javascript
// Respond to parent container resize
window.addEventListener("resize", () => {
  // Adjust chart sizes, table layouts, etc.
  adjustLayout(window.innerWidth, window.innerHeight);
});
```

---

## Communication with Parent Form

### Receiving Data from Parent (Query Parameters)

When a form embeds a web resource, it can pass data via the `data` parameter:

```
Form > Web Resource Properties > Custom Parameter (data): contactId={contactid}
```

```javascript
// Read custom parameters
function getDataParameter() {
  const params = new URLSearchParams(window.location.search);
  return params.get("data"); // "contactId=GUID-VALUE"
}

const data = getDataParameter();
if (data) {
  const pairs = data.split("&").reduce((acc, pair) => {
    const [key, value] = pair.split("=");
    acc[key] = value;
    return acc;
  }, {});
  const contactId = pairs.contactId;
}
```

### postMessage Communication

For bidirectional communication between the web resource and the parent form:

**In the HTML web resource (child):**
```javascript
// Send message to parent
window.parent.postMessage({
  type: "DASHBOARD_ACTION",
  action: "openRecord",
  entityName: "contoso_project",
  entityId: projectId
}, "*");

// Listen for messages from parent
window.addEventListener("message", (event) => {
  if (event.data.type === "REFRESH_DASHBOARD") {
    loadDashboardData();
  }
});
```

**In a form script (parent):**
```typescript
// Get the web resource iframe content window
const wrControl = formContext.getControl("WebResource_dashboard");
const contentWindow = wrControl?.getContentWindow();
if (contentWindow) {
  // Send refresh message
  contentWindow.then((win: Window) => {
    win.postMessage({ type: "REFRESH_DASHBOARD" }, "*");
  });
}
```

---

## Embedding in Dashboards vs Forms

| Placement | How to Add | Sizing |
|---|---|---|
| **System Dashboard** | Dashboard editor > Add Web Resource > Select HTML file | Set rows/columns in dashboard layout |
| **Form Section** | Form editor > Add Web Resource control | Set row height in section properties |
| **Form Tab** | Form editor > Add Web Resource to full-width section | Fills tab width, set row height |
| **Dialog** | `Xrm.Navigation.openWebResource()` from script | Set height/width in options |

---

## Anti-Patterns

- Not null-checking `getXrm()` -- web resource may load before parent context is ready
- Using `document.domain` manipulation for cross-frame access -- unsupported and unreliable
- Loading large JavaScript libraries (React, Angular) in dashboard web resources -- keep dashboards lightweight for fast load
- Not showing loading states -- data takes time to fetch; show loading indicators
- Hardcoding environment URLs in HTML -- use `Xrm.Utility.getGlobalContext().getClientUrl()` for dynamic org URL
- Direct DOM manipulation of the parent form from inside the web resource -- use postMessage or Xrm API only
- Not handling the case where Xrm context is unavailable -- show a meaningful error message
