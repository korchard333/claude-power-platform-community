# Plugins — Unit Testing with FakeXrmEasy

## Unit Testing

```csharp
using FakeXrmEasy.v9;
using Microsoft.Xrm.Sdk;
using Xunit;

public class SetDefaultPriorityTests
{
    [Fact]
    public void Should_Set_Default_Priority_When_Not_Provided()
    {
        // Arrange
        var context = new XrmFakedContext();
        var target = new Entity("contoso_project")
        {
            Id = Guid.NewGuid(),
            ["contoso_name"] = "Test Project"
            // contoso_priority is NOT set
        };

        var pluginContext = context.GetDefaultPluginContext();
        pluginContext.MessageName = "Create";
        pluginContext.Stage = 20; // Pre-Operation
        pluginContext.InputParameters = new ParameterCollection
        {
            { "Target", target }
        };

        // Act
        context.ExecutePluginWith<SetDefaultPriority>(pluginContext);

        // Assert
        Assert.True(target.Contains("contoso_priority"));
        Assert.Equal(100000001, target.GetAttributeValue<OptionSetValue>("contoso_priority").Value);
    }

    [Fact]
    public void Should_Not_Override_Existing_Priority()
    {
        var context = new XrmFakedContext();
        var target = new Entity("contoso_project")
        {
            Id = Guid.NewGuid(),
            ["contoso_name"] = "Test Project",
            ["contoso_priority"] = new OptionSetValue(100000002) // High
        };

        var pluginContext = context.GetDefaultPluginContext();
        pluginContext.MessageName = "Create";
        pluginContext.Stage = 20;
        pluginContext.InputParameters = new ParameterCollection { { "Target", target } };

        context.ExecutePluginWith<SetDefaultPriority>(pluginContext);

        Assert.Equal(100000002, target.GetAttributeValue<OptionSetValue>("contoso_priority").Value);
    }
}
```
