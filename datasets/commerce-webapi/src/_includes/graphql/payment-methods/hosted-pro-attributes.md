Attribute |  Data Type | Description
--- | --- | ---
`cancel_url` | String! | The relative URL of the page that PayPal will redirect to when the buyer cancels the transaction in order to choose a different payment method. If the full URL to this page is `https://www.example.com/paypal/action/cancel.html`, the relative URL is `paypal/action/cancel.html`
`return_url` | String! | The relative URL of the final confirmation page that PayPal will redirect to upon payment success. If the full URL to this page is `https://www.example.com/paypal/action/return.html`, the relative URL is `paypal/action/return.html`
