# Plugins — Sandbox Limitations & Performance

## Sandbox Limitations (Dataverse Online)

All plugins in Dataverse Online run in sandbox isolation. Key restrictions:

| Allowed | Not Allowed |
|---|---|
| IOrganizationService calls | File system access |
| HTTP calls (with timeout) | Registry access |
| Tracing | Thread creation |
| JSON/XML parsing | Assembly loading (dynamic) |
| LINQ queries | Reflection (limited) |
| Configuration strings | UI interaction |

### HTTP Calls from Plugins
```csharp
// Allowed but with restrictions:
// - 1-minute timeout enforced per call
// - No self-signed certificates
// - Plugin must complete within 2 minutes total
// - Use HttpClient (not WebClient — WebClient is deprecated)

using (var client = new HttpClient())
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");

    var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
    var response = await client.PostAsync(url, content);
    response.EnsureSuccessStatusCode();
    var result = await response.Content.ReadAsStringAsync();
}
// Note: HttpClient in sandbox plugins is synchronous under the hood
// (async/await is allowed syntactically but the sandbox blocks the thread)
```

---

## Performance Guidelines

- **2-minute timeout** for sync plugins, **2-hour timeout** for async
- Never query all columns: always specify `ColumnSet` with exact columns
- Use `TopCount` on queries to limit results
- Avoid plugins on Retrieve/RetrieveMultiple (performance impact on every read)
- Use filtering attributes to limit Update triggers to specific field changes
- Check `context.Depth > 1` to prevent infinite loops
- Use async mode for non-critical post-processing
