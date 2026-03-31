# Power Pages — Liquid Templating

Liquid is the templating language used in Power Pages web templates.

## Variables and Output

```liquid
{{ page.title }}
{{ user.fullname }}
{{ now | date: "yyyy-MM-dd" }}
{{ request.params.id }}

{% assign greeting = "Hello, " | append: user.firstname %}
{{ greeting }}
```

## Conditionals

```liquid
{% if user %}
  Welcome, {{ user.fullname }}!
  {% if user.roles contains "Partner Manager" %}
    <a href="/partner-dashboard">Partner Dashboard</a>
  {% endif %}
{% else %}
  <a href="/sign-in">Sign In</a>
{% endif %}
```

## Loops

```liquid
{% entitylist id: "list-guid" %}
  {% for item in entitylist.records %}
    <div class="card">
      <h3>{{ item.contoso_name }}</h3>
      <p>Status: {{ item.statuscode.label }}</p>
    </div>
  {% endfor %}
{% endentitylist %}
```

## FetchXML in Liquid

```liquid
{% fetchxml query %}
  <fetch top="10">
    <entity name="contoso_product">
      <attribute name="contoso_name"/>
      <attribute name="contoso_price"/>
      <filter>
        <condition attribute="statecode" operator="eq" value="0"/>
      </filter>
      <order attribute="contoso_name"/>
    </entity>
  </fetch>
{% endfetchxml %}

{% for product in query.results.entities %}
  <div>{{ product.contoso_name }} — ${{ product.contoso_price }}</div>
{% endfor %}
```

## Web API in Liquid (Server-Side)

```liquid
{% entityview logical_name: "contoso_case", name: "Active Cases" %}
  Total active cases: {{ entityview.total_records }}
{% endentityview %}
```

## Content Snippets

Editable text blocks managed in the portal admin without code changes.

```liquid
<!-- Use in web template -->
{% editable snippets 'Homepage/Welcome' type: 'html' %}

<!-- Default content if snippet doesn't exist -->
{% snippet 'Footer/Copyright' %}
```
