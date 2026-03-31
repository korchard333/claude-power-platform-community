# Power BI — DAX Patterns

## Time Intelligence
```dax
// Year-to-Date
Sales YTD = TOTALYTD([Total Sales], 'Date'[Date])

// Month-to-Date
Sales MTD = TOTALMTD([Total Sales], 'Date'[Date])

// Prior Year Same Period
Sales PY = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))

// Year-over-Year Growth %
YoY Growth % =
    VAR CurrentPeriod = [Total Sales]
    VAR PriorPeriod = [Sales PY]
    RETURN DIVIDE(CurrentPeriod - PriorPeriod, PriorPeriod, BLANK())

// Rolling 12 Months
Sales R12M =
    CALCULATE(
        [Total Sales],
        DATESINPERIOD('Date'[Date], MAX('Date'[Date]), -12, MONTH)
    )

// Moving Average (3 Month)
Sales 3M Avg =
    AVERAGEX(
        DATESINPERIOD('Date'[Date], MAX('Date'[Date]), -3, MONTH),
        CALCULATE([Total Sales])
    )
```

## Ranking & Top N
```dax
// Rank products by sales
Product Rank =
    IF(
        HASONEVALUE(Product[Product Name]),
        RANKX(ALL(Product[Product Name]), [Total Sales], , DESC, Dense)
    )

// Top N filter (use in visual-level filter)
Is Top 10 =
    VAR CurrentRank = [Product Rank]
    RETURN IF(CurrentRank <= 10, 1, 0)
```

## KPIs
```dax
// Gross Margin %
Gross Margin % =
    DIVIDE(
        [Total Sales] - [Total Cost],
        [Total Sales],
        BLANK()
    )

// Customer Lifetime Value
CLV =
    DIVIDE(
        [Total Sales],
        DISTINCTCOUNT(Sales[CustomerId]),
        BLANK()
    )

// Conversion Rate
Conversion Rate =
    DIVIDE(
        CALCULATE(COUNTROWS(Sales), Sales[Status] = "Won"),
        COUNTROWS(Sales),
        BLANK()
    )
```

## Dynamic Measures (Field Parameters)
```dax
// Create a field parameter for measure switching
Metric Selection =
    {
        ("Revenue", NAMEOF([Total Sales]), 0),
        ("Profit", NAMEOF([Total Profit]), 1),
        ("Units", NAMEOF([Total Units]), 2),
        ("Margin %", NAMEOF([Gross Margin %]), 3)
    }
```

## CALCULATE Context Patterns
```dax
// Remove all filters
Total All Sales = CALCULATE([Total Sales], ALL(Sales))

// Keep only specific filter
Sales Selected Category =
    CALCULATE(
        [Total Sales],
        REMOVEFILTERS(Product),
        KEEPFILTERS(VALUES(Product[Category]))
    )

// % of Total
Sales % of Total =
    DIVIDE([Total Sales], CALCULATE([Total Sales], ALL(Sales)), BLANK())

// % of Parent
Sales % of Category =
    DIVIDE(
        [Total Sales],
        CALCULATE([Total Sales], ALLEXCEPT(Product, Product[Category])),
        BLANK()
    )
```
