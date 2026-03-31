# Plugin Sample — SetDefaultsOnCreate

This directory contains a reference implementation of a **Dataverse C# plugin** registered on Pre-Operation Create.

## What This Demonstrates

| Pattern | Where |
|---|---|
| `IPlugin` interface implementation | `SetDefaultsOnCreate.cs` |
| `IPluginExecutionContext` — accessing Target entity | Input parameter extraction |
| `IOrganizationServiceFactory` — creating org service | System context for lookups |
| `ITracingService` — diagnostic logging | Trace calls throughout execution |
| Pre-Operation stage — setting defaults before save | Sets priority, due date, owner team |
| Input validation with `InvalidPluginExecutionException` | User-friendly error messages |
| Exception handling — catch and rethrow pattern | Proper error propagation |

## Registration

This plugin would be registered as:

- **Message:** Create
- **Stage:** Pre-Operation (Stage 20)
- **Entity:** `contoso_case`
- **Filtering Attributes:** (none — fires on all creates)

## Important Constraints

- Plugins run in a sandbox — no file system access, limited HTTP
- 2-minute timeout for synchronous plugins
- Always use `InvalidPluginExecutionException` (not generic `Exception`)
- Always implement `ITracingService` logging for debugging
- Sign the assembly with a strong name key before registration
