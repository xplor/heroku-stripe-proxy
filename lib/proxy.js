const axios = require('axios');
const config = require('./config');

const herokuBaseURL = 'https://api.heroku.com/';
const herokuRequestHeaders = {
    Accept: 'application/vnd.heroku+json; version=3',
    Authorization: `Bearer ${config.herokuAPIKey}`,
};

/**
 * Returns an array of URLS for the passed in Heroku App IDs
 *
 * @param {Array<string>} appIds - array of Heroku app ID strings
 * @returns {Promise<string>} appURLs - array of web URLs for each app
 */
async function getAppURLs(appIds) {
    // return configured URL for testing, if any
    if (config.testProxyURL) {
        return [config.testProxyURL];
    }

    let appURLs = [];

    try {
        appURLs = await Promise.all(
            appIds.map(async reviewAppId => {
                const appId = reviewAppId;
                const appPath = `apps/${appId}`;
                const app = await axios.get(`${herokuBaseURL}${appPath}`, {
                    headers: herokuRequestHeaders,
                });

                return app.data.web_url;
            })
        );
    } catch (error) {
        // failed to fetch one or more apps
        // error logging would go here, but for now just catch the error
    }
    return appURLs;
}

/**
 * Returns an array of Heroku apps that belong to the given pipeline
 *
 * @param {string} pipelineId - Heroku pipeline ID string
 * @returns {Promise<Array>} - array of Heroku app ID strings
 */
async function getApps(pipelineId) {
    // get review apps for pipeline from Heroku
    const path = `pipelines/${pipelineId}/review-apps`;

    let reviewAppIds = [];

    try {
        const reviewAppsResponse = await axios.get(`${herokuBaseURL}${path}`, {
            headers: herokuRequestHeaders,
        });
        reviewAppIds = reviewAppsResponse.data.map(
            reviewApp => reviewApp.app.id
        );
    } catch (error) {
        // failed to get review apps for pipeline
        // error logging would go here, but for now just catch the error
    }

    return reviewAppIds;
}

/**
 * Proxies request to each given base URL with path
 *
 * @param {Object} request - Express request object
 * @param {Array<string>} appURLs - array of base URL strings
 * @param {string} path - URL path string
 * @returns {Promise<void>}
 */
async function sendRequests(request, appURLs, path) {
    try {
        await Promise.all(
            appURLs.map(appURL => {
                const headers = { ...request.headers };

                headers.host = appURL.replace(
                    /(^https:\/\/)|(^http:\/\/)|(\/$)/g,
                    ''
                );
                const reviewAppWebhookUrl = `${appURL}${path}`;
                console.log(`Sending request to: ${reviewAppWebhookUrl}`);
                return axios.post(reviewAppWebhookUrl, request.body, {
                    headers,
                });
            })
        );
    } catch (error) {
        // proxied request returned error
        // error logging would go here, but for now just catch the error
    }
}

/**
 * Proxies given request to all Heroku apps belonging to the
 * configured pipeline
 *
 * @param {Object} request - Express request object
 * @returns {Promise<void>}
 */
async function proxyWebhookRequest(request) {
    const { herokuPipelineId, webhookPath } = config;

    // get all Heroku apps for configured pipeline
    const appIds = await getApps(herokuPipelineId);

    // get URL for each Heroku app
    const appURLs = await getAppURLs(appIds);

    // proxy original request to each app
    await sendRequests(request, appURLs, webhookPath);
}

module.exports = { getApps, getAppURLs, sendRequests, proxyWebhookRequest };
