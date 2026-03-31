# File/Image Columns & Change Tracking

## File & Image Column Operations

### Upload File
```http
PATCH /api/data/v9.2/contoso_projects(guid)/contoso_attachment
Content-Type: application/octet-stream
x-ms-file-name: project-plan.pdf

<binary file content>
```

### Download File
```http
GET /api/data/v9.2/contoso_projects(guid)/contoso_attachment/$value
```
Response: Binary file content with `Content-Type` and `x-ms-file-name` headers.

### Delete File
```http
DELETE /api/data/v9.2/contoso_projects(guid)/contoso_attachment
```

### Upload Image
```http
PATCH /api/data/v9.2/contoso_projects(guid)/contoso_logo
Content-Type: application/octet-stream
x-ms-file-name: logo.png

<binary image content>
```

---

## Change Tracking

### Enable Change Tracking on Table
Must be enabled via metadata update:
```http
PATCH /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')
Content-Type: application/json

{
  "ChangeTrackingEnabled": true
}
```

### Query Changes (Delta Token)
```http
# Initial sync (get all + delta token)
GET /api/data/v9.2/contoso_projects
  ?$select=contoso_name,contoso_priority,statecode
Prefer: odata.track-changes

# Response includes:
# @odata.deltaLink: "https://...?$deltatoken=12345"

# Subsequent sync (only changes since last token)
GET /api/data/v9.2/contoso_projects?$deltatoken=12345
Prefer: odata.track-changes

# Response includes:
# - Created/updated records (normal entities)
# - Deleted records (with @removed annotation)
# - New deltaLink for next sync
```
