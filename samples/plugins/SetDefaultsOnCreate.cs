/// <summary>
/// SetDefaultsOnCreate — Pre-Operation plugin that sets default field values
/// when a new contoso_case record is created.
///
/// PATTERNS DEMONSTRATED:
/// 1. IPlugin implementation with IServiceProvider extraction
/// 2. IPluginExecutionContext — reading the Target entity from InputParameters
/// 3. IOrganizationServiceFactory — creating an org service (system context)
/// 4. ITracingService — diagnostic logging (critical for sandbox debugging)
/// 5. Pre-Operation stage — modifying the Target entity before database write
/// 6. Input validation with InvalidPluginExecutionException
/// 7. Exception handling with proper error propagation
///
/// REGISTRATION:
///   Message: Create | Stage: Pre-Operation (20) | Entity: contoso_case
/// </summary>

using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Contoso.Plugins
{
    public class SetDefaultsOnCreate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            // --- Extract platform services from the service provider ---

            // Execution context: contains the Target entity and message metadata
            var context = (IPluginExecutionContext)
                serviceProvider.GetService(typeof(IPluginExecutionContext));

            // Organization service factory: creates service instances for Dataverse queries
            // Pass null for system context (bypasses calling user's security roles)
            var serviceFactory = (IOrganizationServiceFactory)
                serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            var service = serviceFactory.CreateOrganizationService(null);

            // Tracing service: log diagnostic information (visible in Plugin Trace Log)
            var tracingService = (ITracingService)
                serviceProvider.GetService(typeof(ITracingService));

            tracingService.Trace("SetDefaultsOnCreate: Execution started.");

            try
            {
                // --- Validate the execution context ---

                // Ensure this is a Create message with an Entity target
                if (context.MessageName != "Create")
                {
                    tracingService.Trace("SetDefaultsOnCreate: Not a Create message. Exiting.");
                    return;
                }

                if (!(context.InputParameters["Target"] is Entity target))
                {
                    tracingService.Trace("SetDefaultsOnCreate: Target is not an Entity. Exiting.");
                    return;
                }

                if (target.LogicalName != "contoso_case")
                {
                    tracingService.Trace("SetDefaultsOnCreate: Target is not contoso_case. Exiting.");
                    return;
                }

                // --- Input validation ---

                // Require a title on every case
                var title = target.GetAttributeValue<string>("contoso_title");
                if (string.IsNullOrWhiteSpace(title))
                {
                    // InvalidPluginExecutionException shows this message to the user in the UI
                    throw new InvalidPluginExecutionException(
                        "Case title is required. Please enter a descriptive title.");
                }

                // --- Set default values (Pre-Operation: modifying Target before DB write) ---

                // Default priority to Normal (100) if not explicitly set
                if (!target.Contains("contoso_priority"))
                {
                    target["contoso_priority"] = new OptionSetValue(100); // 100 = Normal
                    tracingService.Trace("SetDefaultsOnCreate: Priority defaulted to Normal (100).");
                }

                // Default due date to 5 business days from now if not set
                if (!target.Contains("contoso_duedate"))
                {
                    target["contoso_duedate"] = DateTime.UtcNow.AddDays(7);
                    tracingService.Trace("SetDefaultsOnCreate: Due date defaulted to 7 days from now.");
                }

                // Look up the default support team and assign as owner
                if (!target.Contains("ownerid"))
                {
                    var teamQuery = new QueryExpression("team")
                    {
                        ColumnSet = new ColumnSet("teamid"),
                        TopCount = 1,
                        Criteria =
                        {
                            Conditions =
                            {
                                new ConditionExpression("name", ConditionOperator.Equal, "Support Team")
                            }
                        }
                    };

                    var teams = service.RetrieveMultiple(teamQuery);
                    if (teams.Entities.Count > 0)
                    {
                        var teamId = teams.Entities[0].Id;
                        target["ownerid"] = new EntityReference("team", teamId);
                        tracingService.Trace(
                            "SetDefaultsOnCreate: Owner defaulted to Support Team ({0}).", teamId);
                    }
                    else
                    {
                        tracingService.Trace(
                            "SetDefaultsOnCreate: Support Team not found. Owner not changed.");
                    }
                }

                tracingService.Trace("SetDefaultsOnCreate: Execution completed successfully.");
            }
            catch (InvalidPluginExecutionException)
            {
                // Re-throw validation errors — these show to the user
                throw;
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                tracingService.Trace("SetDefaultsOnCreate: OrgServiceFault — {0}", ex.Message);
                throw new InvalidPluginExecutionException(
                    "An error occurred while setting case defaults. Please try again.", ex);
            }
            catch (Exception ex)
            {
                tracingService.Trace("SetDefaultsOnCreate: Unexpected error — {0}", ex.ToString());
                throw new InvalidPluginExecutionException(
                    "An unexpected error occurred. Please contact your administrator.", ex);
            }
        }
    }
}
