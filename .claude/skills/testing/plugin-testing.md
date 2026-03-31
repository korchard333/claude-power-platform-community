# Testing — Plugin Testing (xUnit + FakeXrmEasy)

> For comprehensive plugin testing patterns including FakeXrmEasy setup, entity images, and advanced mocking, load the `plugins` skill → [testing sub-file](../plugins/testing.md).

## Quick Example

```csharp
[Fact]
public void Validation_Plugin_Rejects_Negative_Total()
{
    var context = new XrmFakedContext();
    var target = new Entity("contoso_order")
    {
        Id = Guid.NewGuid(),
        ["contoso_totalamount"] = new Money(-100m)
    };

    var pluginContext = context.GetDefaultPluginContext();
    pluginContext.MessageName = "Create";
    pluginContext.Stage = 10; // Pre-Validation
    pluginContext.InputParameters = new ParameterCollection { { "Target", target } };

    var ex = Assert.Throws<InvalidPluginExecutionException>(() =>
        context.ExecutePluginWith<ValidateOrderTotal>(pluginContext));

    Assert.Contains("cannot be negative", ex.Message);
}
```

## Integration Testing Approaches

Unit tests with FakeXrmEasy cover isolated plugin logic. For integration verification:

| Approach | When to Use | Notes |
|---|---|---|
| **Dataverse test environment** | Full pipeline validation | Deploy plugin to a dev/test environment, trigger via API or UI |
| **Plugin Trace Log** | Debugging deployed plugins | Enable via Power Platform Admin Center → Environment → Plugin Trace Log |
| **Custom API test harness** | Plugin registered on Custom API | Call the Custom API via Web API with test payloads |

## Solution Checker Plugin Rules

Run Solution Checker before deploying — it catches common plugin issues:

| Rule | What It Checks |
|---|---|
| `web-use-org-service-context` | Avoid `OrganizationServiceContext` (deprecated pattern) |
| `web-remove-non-overridden-members` | Remove unnecessary inherited member overrides |
| `meta-avoid-reg-no-attribute` | Register filtering attributes on Update messages |
| `il-avoid-batch-in-loop` | Don't execute batch requests inside loops |
| `il-specify-column` | Always use `ColumnSet` with specific columns, never `new ColumnSet(true)` |

## CI/CD Plugin Test Integration

```yaml
# GitHub Actions — build and test plugins
- name: Build plugin project
  run: dotnet build src/Plugins/Contoso.Plugins.csproj --configuration Release

- name: Run plugin unit tests
  run: dotnet test tests/Contoso.Plugins.Tests.csproj --configuration Release --logger trx

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: plugin-test-results
    path: "**/*.trx"
```
