const bodyParser = require('body-parser');
const express = require('express');
const config = require('./lib/config');
const stripe = require('stripe')(config.stripeSecretKey);
const { proxyWebhookRequest } = require('./lib/proxy');

const app = express();

app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
    // verify webhook request
    if (config.stripeVerifyWebhookSignature) {
        const signature = request.headers['stripe-signature'];

        try {
            stripe.webhooks.constructEvent(
                request.body,
                signature,
                config.stripeEndpointSecret
            );
        } catch (err) {
            response.sendStatus(400);
            return;
        }
    }

    // proxy request if valid
    proxyWebhookRequest(request);

    // immediately return 200 to Stripe
    response.sendStatus(200);
});

app.listen(config.port, () => console.log(`Proxy listening for requests on port: ${config.port}`));
