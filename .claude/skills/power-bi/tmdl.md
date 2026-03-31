# Power BI — TMDL (Tabular Model Definition Language)

## Table Definition
```tmdl
table Sales
    lineageTag: a1b2c3d4-...

    column 'Sales Amount'
        dataType: decimal
        formatString: \$#,0.00;(\$#,0.00);\$#,0.00
        lineageTag: e5f6g7h8-...
        summarizeBy: sum
        sourceColumn: SalesAmount

    column 'Order Date'
        dataType: dateTime
        formatString: Short Date
        lineageTag: i9j0k1l2-...
        sourceColumn: OrderDate

    column CustomerId
        dataType: string
        lineageTag: m3n4o5p6-...
        sourceColumn: CustomerId

    column 'Product Key'
        dataType: int64
        lineageTag: q7r8s9t0-...
        sourceColumn: ProductKey

    measure 'Total Sales'
        = SUM(Sales[Sales Amount])
        formatString: \$#,0.00
        lineageTag: u1v2w3x4-...

    measure 'Sales YTD'
        = TOTALYTD([Total Sales], 'Date'[Date])
        formatString: \$#,0.00

    measure 'Sales vs Prior Year'
        =
            VAR CurrentSales = [Total Sales]
            VAR PriorYearSales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))
            RETURN
                DIVIDE(CurrentSales - PriorYearSales, PriorYearSales, BLANK())
        formatString: 0.0%;-0.0%;0.0%

    partition Sales = m
        mode: import
        source =
            let
                Source = Sql.Database("server.database.windows.net", "SalesDB"),
                dbo_Sales = Source{[Schema="dbo",Item="Sales"]}[Data],
                #"Selected Columns" = Table.SelectColumns(dbo_Sales, {"SalesAmount", "OrderDate", "CustomerId", "ProductKey"})
            in
                #"Selected Columns"
```

## Date Table (Standard Pattern)
```tmdl
table Date
    lineageTag: date-table-...
    dataCategory: Time

    column Date
        dataType: dateTime
        isKey: true
        formatString: Short Date
        sourceColumn: Date

    column Year
        dataType: int64
        sourceColumn: Year

    column Month
        dataType: string
        sourceColumn: Month
        sortByColumn: 'Month Number'

    column 'Month Number'
        dataType: int64
        sourceColumn: MonthNumber
        isHidden: true

    column Quarter
        dataType: string
        sourceColumn: Quarter

    column 'Day of Week'
        dataType: string
        sourceColumn: DayOfWeek
        sortByColumn: 'Day Number'

    column 'Day Number'
        dataType: int64
        sourceColumn: DayNumber
        isHidden: true

    column 'Is Weekend'
        dataType: boolean
        sourceColumn: IsWeekend

    hierarchy 'Calendar Hierarchy'
        level Year
            column: Year
        level Quarter
            column: Quarter
        level Month
            column: Month
        level Date
            column: Date

    partition Date = m
        mode: import
        source =
            let
                Source = List.Dates(#date(2020,1,1), Duration.Days(#date(2030,12,31) - #date(2020,1,1)) + 1, #duration(1,0,0,0)),
                #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), {"Date"}, null, ExtraValues.Error),
                #"Changed Type" = Table.TransformColumnTypes(#"To Table", {{"Date", type date}}),
                #"Added Year" = Table.AddColumn(#"Changed Type", "Year", each Date.Year([Date]), Int64.Type),
                #"Added Month" = Table.AddColumn(#"Added Year", "Month", each Date.ToText([Date], "MMM yyyy"), type text),
                #"Added MonthNumber" = Table.AddColumn(#"Added Month", "MonthNumber", each Date.Year([Date]) * 100 + Date.Month([Date]), Int64.Type),
                #"Added Quarter" = Table.AddColumn(#"Added MonthNumber", "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])) & " " & Text.From(Date.Year([Date])), type text),
                #"Added DayOfWeek" = Table.AddColumn(#"Added Quarter", "DayOfWeek", each Date.DayOfWeekName([Date]), type text),
                #"Added DayNumber" = Table.AddColumn(#"Added DayOfWeek", "DayNumber", each Date.DayOfWeek([Date], Day.Monday), Int64.Type),
                #"Added IsWeekend" = Table.AddColumn(#"Added DayNumber", "IsWeekend", each Date.DayOfWeek([Date], Day.Monday) >= 5, type logical)
            in
                #"Added IsWeekend"
```

## Relationships
```tmdl
relationship Sales_to_Date
    fromColumn: Sales.'Order Date'
    toColumn: 'Date'.Date
    crossFilteringBehavior: singleDirection

relationship Sales_to_Product
    fromColumn: Sales.'Product Key'
    toColumn: Product.'Product Key'
    crossFilteringBehavior: singleDirection

relationship Sales_to_Customer
    fromColumn: Sales.CustomerId
    toColumn: Customer.CustomerId
    crossFilteringBehavior: singleDirection
```

## Row-Level Security
```tmdl
role RegionManager
    modelPermission: read

    tablePermission Sales
        = Sales[Region] = USERPRINCIPALNAME()

role CountryAccess
    modelPermission: read

    tablePermission Sales
        =
            VAR UserEmail = USERPRINCIPALNAME()
            VAR AllowedCountries =
                CALCULATETABLE(
                    VALUES(SecurityMapping[Country]),
                    SecurityMapping[UserEmail] = UserEmail
                )
            RETURN
                Sales[Country] IN AllowedCountries
```
