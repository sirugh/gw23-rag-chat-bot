---
title: GraphQL authorization
description: Learn how to authorize GraphQL API calls using tokens. 
contributor_name: Atwix
contributor_link: https://www.atwix.com/
keywords:
  - GraphQL
  - Security
---

# GraphQL authorization

Adobe Commerce and Magento Open Source provide two mechanisms for authorizing GraphQL calls:

*  **Authorization tokens**. Commerce generates a JSON Web Token (JWT), a set of cryptographically signed credentials. All calls that perform an action on behalf of a logged-in customer or admin provide an authorization token. Authorization tokens are stateless. Commerce does not need to know the state of a client to execute a request--the token contains all of the information needed for authorization and authentication.

*  **Session cookies**. A session cookie is information generated by Commerce that is stored in the client's browser. It contains details about the session, including the time period the user can access resources. Cookies are stateful, thereby increasing complexity and possibly latency.

Adobe recommends that you use authorization tokens instead of session cookies for GraphQL requests. By default, session cookies are enabled. As of Commerce 2.4.5, you can disable session cookies, eliminating the chances of encountering problems caused by the differences between the two authorization methods. However, merchants with existing implementations that rely on cookies can continue using this method. [Session cookies](#session-cookies) describes how to enable or disable cookies for GraphQL.

## Authorization tokens

Adobe Commerce provides separate token services for customers and administrators. When you request a token from one of these services, the service returns a unique access token in exchange for the account's username and password.

GraphQL provides a mutation that returns a token on behalf of a logged-in customer, but you must use a REST call to fetch an admin token. Any time you make a GraphQL or REST call that requires a token, specify the HTTP `Authorization` request header and assign the value as `Bearer <token>`. [Request headers](headers.md#request-headers) provides an example.

### Customer tokens

The [`generateCustomerToken` mutation](../schema/customer/mutations/generate-token.md) requires the customer email address and password in the payload, as shown in the following example.

By default, a customer token is valid for 1 hour. You can change these values from Admin by selecting **Stores** > **Settings** > **Configuration** > **Services** > **OAuth** > **Access Token Expiration** > **Customer Token Lifetime**.

**Request:**

```text
mutation {
  generateCustomerToken(email: "customer@example.com", password: "password") {
    token
  }
}
```

**Response:**

```json
 {
   "data": {
     "generateCustomerToken": {
       "token": "hoyz7k697ubv5hcpq92yrtx39i7x10um"
     }
   }
 }
```

You can now use this token in the Authorization request header field for any queries and mutations.

![GraphQL Authorization Bearer](../../_images/graphql/graphql-authorization.png)

You can also [revoke the customer's token](../schema/customer/mutations/revoke-token.md) when the customer logs out or changes their password.

The [`generateCustomerTokenAsAdmin`](../schema/customer/mutations/generate-token-as-admin.md) mutation generates a new customer token as an admin so that an administrator can perform remote shopping assistance.
The customer must have enabled the `allow_remote_shopping_assistance` feature while creating the customer profile. The mutation requires the customer email address in the payload, as shown in the following example.

**Request:**

```graphql
mutation{
  generateCustomerTokenAsAdmin(input: {
    customer_email: "customer1@mail.com"
  }){
    customer_token
  }
}
```

**Response:**

```json
{
  "data": {
    "generateCustomerTokenAsAdmin": {
      "customer_token": "cr0717abzoagxty1xjn4lj13kim36r6x"
    }
  }
}
```

### Admin tokens

In Adobe Commerce and Magento Open Source GraphQL, you specify an admin token only if you need to query products, categories, price rules, or other entities that are scheduled to be in a campaign (staged content). Staging is supported in Adobe Commerce only. See [Staging queries](staging-queries.md) for more information.

Adobe Commerce and Magento Open Source do not provide a GraphQL mutation that generates an admin token. You must use a REST endpoint such as `POST /V1/tfa/provider/google/authenticate` instead. [Generate the admin token](https://developer.adobe.com/commerce/webapi/rest/tutorials/prerequisite-tasks/) shows how to use this endpoint.

By default, an admin token is valid for 4 hours. You can change these values from Admin by selecting **Stores** > **Settings** > **Configuration** > **Services** > **OAuth** > **Access Token Expiration** > **Admin Token Lifetime**.

## Session cookies

The client's browser will use a session cookie if the server provides one. Prior to version 2.4.5, Commerce automatically generated session cookies even if an authorization token was specified.

Browser-based applications that make GraphQL calls can continue implementing these cookies without changing the default setting. If you use cookies, avoid specifying Authorization headers to prevent problems caused by using two different authorization methods.

Adobe recommends that you do not use session cookies when developing a Commerce-based application. If you adhere to this best practice, you should configure GraphQL so that the server doesn't generate them. Disabling cookies also prevents system file locks and race conditions on server resources. These problems cause slower HTTP GET request throughputs under peak traffic conditions.

Run the following command to disable session cookies for GraphQL:

`bin/magento config:set graphql/session/disable 1`

To re-enable these cookies, run:

`bin/magento config:set graphql/session/disable 0`