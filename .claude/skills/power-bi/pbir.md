# Power BI — PBIR Report Definition

## Page Definition (page.json)
```json
{
  "displayName": "Sales Overview",
  "displayOption": "FitToPage",
  "height": 720,
  "width": 1280,
  "defaultDrillFilterOtherVisuals": true
}
```

## Visual Definition (visual.json)
```json
{
  "visual": {
    "visualType": "clusteredBarChart",
    "query": {
      "queryState": {
        "Category": {
          "projections": [{"field": {"Column": {"Expression": {"SourceRef": {"Entity": "Product"}}, "Property": "Category"}}}]
        },
        "Y": {
          "projections": [{"field": {"Measure": {"Expression": {"SourceRef": {"Entity": "Sales"}}, "Property": "Total Sales"}}}]
        }
      }
    },
    "objects": {
      "categoryAxis": [{"properties": {"labelDisplayUnits": {"expr": {"Literal": {"Value": "1000000L"}}}}}],
      "legend": [{"properties": {"show": {"expr": {"Literal": {"Value": "false"}}}}}]
    },
    "position": {
      "x": 20, "y": 80, "width": 600, "height": 400, "z": 1000, "tabOrder": 1000
    }
  }
}
```

## Theme Definition
```json
{
  "name": "Contoso Enterprise Theme",
  "dataColors": [
    "#2563EB", "#7C3AED", "#DC2626", "#059669",
    "#D97706", "#4F46E5", "#0891B2", "#BE185D"
  ],
  "background": "#FFFFFF",
  "foreground": "#1F2937",
  "tableAccent": "#2563EB",
  "textClasses": {
    "title": { "fontFace": "Segoe UI Semibold", "fontSize": 14, "color": "#1F2937" },
    "header": { "fontFace": "Segoe UI Semibold", "fontSize": 12, "color": "#374151" },
    "label": { "fontFace": "Segoe UI", "fontSize": 10, "color": "#6B7280" },
    "callout": { "fontFace": "Segoe UI Semibold", "fontSize": 24, "color": "#1F2937" }
  },
  "visualStyles": {
    "*": {
      "*": {
        "background": [{"color": {"solid": {"color": "#FFFFFF"}}, "transparency": 0}],
        "border": [{"color": {"solid": {"color": "#E5E7EB"}}, "width": 1}],
        "visualHeader": [{"show": false}]
      }
    }
  }
}
```
