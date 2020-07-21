/* eslint no-undef:0 */

jest.mock('axios');
jest.mock('dotenv');

const axios = require('axios');
const dotenv = require('dotenv');

/* Environment Variables **************************************************** */
dotenv.config.mockImplementation(() => {
    process.env.HEROKU_API_KEY = 'test_key';
    process.env.HEROKU_PIPELINE_ID = 'test-pipeline-id';
    process.env.WEBHOOK_PATH = '/test-webhooks';
});

const {
    getApps,
    getAppURLs,
    proxyWebhookRequest,
    sendRequests,
} = require('./proxy');

/* Test Fixtures ************************************************************ */
const reviewApps = [{ app: { id: '1' } }, { app: { id: '2' } }];

const mockReviewAppsResponse = {
    data: reviewApps,
    headers: {},
    status: 200,
    statusText: 'OK',
};

const mockAppResponseOne = {
    data: { web_url: 'https://awesomesite.com' },
    headers: {},
    status: 200,
    statusText: 'OK',
};

const mockAppResponseTwo = {
    data: { web_url: 'https://amazingsite.com' },
    headers: {},
    status: 200,
    statusText: 'OK',
};

const mockWebhookResponse = {
    data: {},
    headers: {},
    status: 200,
    statusText: 'OK',
};

async function mockGetRequest(path) {
    if (path.indexOf('pipelines') !== -1) {
        return mockReviewAppsResponse;
    }
    if (parseInt(path.substr(-1), 10) % 2 === 0) {
        return mockAppResponseTwo;
    }
    return mockAppResponseOne;
}

async function mockPostRequest() {
    return mockWebhookResponse;
}

let mockGet;
let mockPost;

/* Setup ******************************************************************** */
beforeEach(() => {
    // reset mock state
    axios.post.mockReset();
    axios.get.mockReset();

    // mock implementations for  GET and POST requests
    mockGet = axios.get.mockImplementation(mockGetRequest);
    mockPost = axios.post.mockImplementation(mockPostRequest);
});

/* Test Cases *************************************************************** */
test('getApps returns array of Heroku app IDs', async () => {
    const apps = await getApps('test-pipeline-id');

    // makes expected number of get calls
    expect(mockGet.mock.calls.length).toBe(1);

    // calls get with expected arguments
    const expectedURL =
        'https://api.heroku.com/pipelines/test-pipeline-id/review-apps';
    const expectedOptions = {
        headers: {
            Accept: 'application/vnd.heroku+json; version=3',
            Authorization: 'Bearer test_key',
        },
    };

    const args = mockGet.mock.calls[0];
    expect(args[0]).toBe(expectedURL);
    expect(args[1]).toEqual(expectedOptions);

    // has expected return value
    expect(apps).toEqual(['1', '2']);
});

test('getAppURLs returns array of app URLs', async () => {
    const appIds = ['1', '2', '3'];
    const appURLs = await getAppURLs(appIds);
    const expectedAppURLs = [
        'https://awesomesite.com',
        'https://amazingsite.com',
        'https://awesomesite.com',
    ];

    // makes expected number of get calls
    expect(mockGet.mock.calls.length).toBe(3);

    // calls get with expected arguments
    const expectedOptions = {
        headers: {
            Accept: 'application/vnd.heroku+json; version=3',
            Authorization: 'Bearer test_key',
        },
    };
    const firstExpectedURL = 'https://api.heroku.com/apps/1';
    const secondExpectedURL = 'https://api.heroku.com/apps/2';
    const thirdExpectedURL = 'https://api.heroku.com/apps/3';

    const firstCallArgs = mockGet.mock.calls[0];
    const secondCallArgs = mockGet.mock.calls[1];
    const thirdCallArgs = mockGet.mock.calls[2];

    expect(firstCallArgs[0]).toBe(firstExpectedURL);
    expect(firstCallArgs[1]).toEqual(expectedOptions);
    expect(secondCallArgs[0]).toBe(secondExpectedURL);
    expect(secondCallArgs[1]).toEqual(expectedOptions);
    expect(thirdCallArgs[0]).toBe(thirdExpectedURL);
    expect(thirdCallArgs[1]).toEqual(expectedOptions);

    // has expected return value
    expect(appURLs).toEqual(expectedAppURLs);
});

test('sendRequests calls post for each URL', async () => {
    const request = { body: {}, headers: {} };
    await sendRequests(request, ['website1.com', 'website2.com'], '/webhook');

    // makes expected number of post calls
    expect(mockPost.mock.calls.length).toBe(2);

    // calls post with expected arguments
});

test('sendRequests calls post for each URL even when first call fails', async () => {
    const mockPostFails = jest
        .fn()
        .mockRejectedValueOnce(new Error('Request failed'));
    const mockPostSucceeds = jest
        .fn()
        .mockResolvedValueOnce(mockWebhookResponse);

    axios.post.mockImplementationOnce(mockPostFails);
    axios.post.mockImplementationOnce(mockPostSucceeds);

    const request = { body: {}, headers: {} };

    await sendRequests(request, ['website1.com', 'website2.com'], '/webhook');

    // makes expected number of post calls
    expect(mockPostSucceeds.mock.calls.length).toBe(1);
    expect(mockPostFails.mock.calls.length).toBe(1);
});

test('proxyWebhookRequest calls post as expected', async () => {
    const request = {
        body: {},
        headers: { host: 'website.com', 'x-headers-proxied': 'yes' },
    };
    await proxyWebhookRequest(request);

    // makes expected number of post calls
    expect(mockPost.mock.calls.length).toBe(2);

    // has expected arguments on first post call
    const firstCallArguments = mockPost.mock.calls[0];
    const firstExpectedURL = 'https://awesomesite.com/test-webhooks';
    const firstExpectedBody = {};
    const firstExpectedHeaders = {
        host: 'awesomesite.com',
        'x-headers-proxied': 'yes',
    };
    expect(firstCallArguments[0]).toEqual(firstExpectedURL);
    expect(firstCallArguments[1]).toEqual(firstExpectedBody);
    expect(firstCallArguments[2]).toEqual({ headers: firstExpectedHeaders });

    // has expected arguments on second post call
    const secondCallArguments = mockPost.mock.calls[1];
    const secondExpectedURL = 'https://amazingsite.com/test-webhooks';
    const secondExpectedBody = {};
    const secondExpectedHeaders = {
        host: 'amazingsite.com',
        'x-headers-proxied': 'yes',
    };
    expect(secondCallArguments[0]).toEqual(secondExpectedURL);
    expect(secondCallArguments[1]).toEqual(secondExpectedBody);
    expect(secondCallArguments[2]).toEqual({ headers: secondExpectedHeaders });
});
