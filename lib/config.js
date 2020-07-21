const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    herokuAPIKey: process.env.HEROKU_API_KEY,
    herokuPipelineId: process.env.HEROKU_PIPELINE_ID,
    port: process.env.PORT,
    stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeVerifyWebhookSignature: process.env.STRIPE_VERIFY_WEBHOOK_SIGNATURE,
    testProxyURL: process.env.TEST_PROXY_URL,
    webhookPath: process.env.WEBHOOK_PATH,
};
