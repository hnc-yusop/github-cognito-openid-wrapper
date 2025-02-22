const axios = require('axios');
const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  COGNITO_REDIRECT_URI,
//  GITHUB_API_URL,
//  GITHUB_LOGIN_URL
} = require('./config');
const logger = require('./connectors/logger');

const getApiEndpoints = (
//  apiBaseUrl = GITHUB_API_URL,
// loginBaseUrl = GITHUB_LOGIN_URL
) => ({
  userDetails: "https://dev-api.malangmalang.com/accounts/oauth2/me",
  userEmails: "https://dev-api.malangmalang.com/accounts/oauth2/me",
  oauthToken: "https://dev-api.malangmalang.com/accounts/oauth2/token",
  oauthAuthorize: "https://dev-accounts.malangmalang.com/oauth2/authorize"
});

const check = response => {
  logger.debug('Checking response: %j', response, {});
  if (response.data) {
    if (response.data.error) {
      throw new Error(
        `GitHub API responded with a failure: ${response.data.error}, ${
          response.data.error_description
        }`
      );
    } else if (response.status === 200) {
      return response.data;
    }
  }
  throw new Error(
    `GitHub API responded with a failure: ${response.status} (${
      response.statusText
    })`
  );
};

const gitHubGet = (url, accessToken) =>
  axios({
    method: 'get',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

module.exports = (apiBaseUrl, loginBaseUrl) => {
  const urls = getApiEndpoints(apiBaseUrl, loginBaseUrl || apiBaseUrl);

  return {
    getAuthorizeUrl: (client_id, scope, state, response_type) => {
      logger.debug("getAuthroizeUrl");
      return `${urls.oauthAuthorize}?redirect_uri=${COGNITO_REDIRECT_URI}&client_id=${client_id}&state=${state}&scope=${scope}&response_type=${response_type}`;},
    getUserDetails: accessToken =>
      gitHubGet(urls.userDetails, accessToken).then(check),
    getUserEmails: accessToken =>
      gitHubGet(urls.userEmails, accessToken).then(check),
    getToken: (code, state) => {
      const data = {
        // OAuth required fields
        grant_type: 'authorization_code',
        redirect_uri: COGNITO_REDIRECT_URI,
        client_id: GITHUB_CLIENT_ID,
        // GitHub Specific
        response_type: 'code',
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        // State may not be present, so we conditionally include it
        ...(state && { state })
      };

      logger.debug(
        'Getting token from %s with data: %j',
        urls.oauthToken,
        data,
        {}
      );
      return axios({
        method: 'post',
        url: urls.oauthToken,
        params: data,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
      }).then(check);
    }
  };
};
