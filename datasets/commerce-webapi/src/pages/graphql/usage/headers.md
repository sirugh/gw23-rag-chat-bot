---
title: GraphQL headers
description: Learn about the headers that Adobe Commerce accepts and how to specify them.
keywords:
  - GraphQL
---

# GraphQL headers

Adobe Commerce and Magento Open Source GraphQL supports the HTTP GET and POST methods. You can send a query as a GET or POST request. Mutations must be POST requests. You can optionally send a GET query request in a URL. In these requests, you must specify `query` as the query string. You might need to encode the query, as shown below:

`http://<host>/graphql?query=%7Bproducts(filter%3A%7Bsku%3A%7Beq%3A%2224-WB01%22%7D%7D)%7Bitems%7Bname%20sku%7D%7D%7D`

The previous example is equivalent to the following query. You could send the query as either a GET or POST request.

**Request:**

```graphql
{
  products(
    filter: { sku: { eq: "24-WB01" } }
  ) {
    items {
      name
      sku
    }
  }
}
```

**Response:**

```json
{
  "data": {
    "products": {
      "items": [
        {
          "name": "Voyage Yoga Bag",
          "sku": "24-WB01"
        }
      ]
    }
  }
}
```

Some queries sent as a GET request can be cached. See [GraphQL caching](../usage/caching.md) for more information.

## Request headers

The application accepts the following headers in a GraphQL request:

Header name | Value | Description
--- | --- | ---
`Authorization` | `Bearer <authorization_token>` | A customer or admin token. [Authorization tokens](authorization-tokens.md) describes how to generate tokens.
`Content-Currency` | A valid currency code, such as `USD` | This header is required only if the currency is not the store view's default currency.
`Content-Type` | `application/json` | Required for all requests.
`Preview-Version` | A timestamp (seconds since January 1, 1970). | Use this header to query products, categories, price rules, and other entities that are scheduled to be in a campaign (staged content). Staging is supported in Adobe Commerce only.
`Store` | `<store_view_code>` | The store view code on which to perform the request. The value can be `default` or the code that is defined when a store view is created.
`X-Captcha` | Shopper-entered CAPTCHA value | Required when a shopper enters a CAPTCHA value on the frontend, unless an integration token is provided. Forms requiring CAPTCHA values are configured at **Stores** > **Configuration** > **Customers** > **Customer Configuration** > **CAPTCHA** > **Forms**.
`X-Magento-Cache-Id` | A Secure Hash Algorithm value. | Used for logged-in customers only. It is a hash value that identifies a customer based on factors such as the store ID, the store's currency code, whether the customer is logged in, the customer group, and the tax rate. The cache ID provides a way to serve cached query results to customers that share the same identifying factors. [Caching for logged-in customers](../usage/caching.md#caching-for-logged-in-customers) provides additional information.
`X-ReCaptcha` | A value generated by the Google reCAPTCHA API. It is required when reCAPTCHA is enabled for certain forms, unless an integration token is provided. Forms requiring reCAPTCHA values are configured at **Stores** > **Security** > **Google reCAPTCHA Storefront** > **Storefront**. | String

### Specify request headers in a GraphQL browser

GraphQL browsers, such as GraphiQL, allow you to enter a set of header name/value pairs. The following example shows an example customer authorization token and content type headers.

![GraphiQL Authorization Bearer](../../_images/graphql/graphql-authorization.png)

### Specify request headers with the `curl` command

Use the curl command with a separate `-H` argument to specify each request header. The following example uses the same request headers as those used in the GraphQL browser.

```bash
curl 'http://magento.config/graphql' -H 'Authorization: Bearer hoyz7k697ubv5hcpq92yrtx39i7x10um' -H 'Content-Type: application/json'  --data-binary '{"query":"query {\n  customer {\n    firstname\n    lastname\n    email\n  }\n}"}'
```