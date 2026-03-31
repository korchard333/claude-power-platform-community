# Power BI — Dataverse as Data Source

## Direct Query Connection
```m
// Power Query M expression for Dataverse
let
    Source = CommonDataService.Database("org.crm.dynamics.com"),
    dbo_contoso_order = Source{[Schema="dbo", Item="contoso_order"]}[Data],
    #"Filtered Active" = Table.SelectRows(dbo_contoso_order, each [statecode] = 0),
    #"Selected Columns" = Table.SelectColumns(#"Filtered Active", {
        "contoso_orderid", "contoso_name", "contoso_ordernumber",
        "contoso_totalamount", "createdon", "statecode"
    })
in
    #"Selected Columns"
```

## TDS Endpoint (SQL Access to Dataverse)
```sql
-- Connect via SQL Server Management Studio or Power BI SQL endpoint
-- Server: org.crm.dynamics.com,5558
-- Database: org
-- Authentication: Azure Active Directory

SELECT TOP 100
    c.fullname,
    c.emailaddress1,
    a.name AS accountname,
    c.createdon
FROM contact c
LEFT JOIN account a ON c.parentcustomerid = a.accountid
WHERE c.statecode = 0
ORDER BY c.createdon DESC
```
