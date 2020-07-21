# Mariana Heroku Stripe Proxy

As you may have gathered from the name, this application is a simple proxy 
that forwards webhook event requests from Stripe to all of the Heroku 
review apps for a given Heroku pipeline. Using a single webhook endpoint
for all review apps rather than one each allows us to stay under Stripe's
webhook endpoint limit and consistently receive events in review apps.


## Development

Environment setup:

Make a file called `.env` in the application root and copy the values from
`.env.example`. Replace the values for `HEROKU_API_KEY` and `HEROKU_PIPELINE_ID`
with a valid API key for your Heroku account and the ID of the Heroku pipeline 
you want to proxy Stripe events.

Install dependencies:

```bash
$ npm install
```

Start the server:

```bash
$ npm start
```

More on environment variables:

If you decide to turn on incoming webhook verification by setting 
`STRIPE_VERIFY_WEBHOOK_SIGNATURE` to `true`, you'll need a valid Stripe secret 
key for `STRIPE_SECRET_KEY`. For development purposes, you can override the 
proxy destination URLs by setting `TEST_PROXY_URL`; when set incoming requests 
will be proxied only to the URL specified.

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```
