const { uuid, isDefined, isUndefined } = require("@adobe/target-tools");
const fetch = require("node-fetch");

const PAGE_WIDE_SCOPE = "__view__";
const AEP_COOKIE_PREFIX = "kndctr";

const TYPE_STATE_STORE = "state:store";
const TYPE_IDENTITY_RESULT = "identity:result";
const TYPE_PERSONALIZATION = "personalization:decisions";

const COOKIE_NAME_AEP_EDGE_PATH = "path";

let DEFAULT_REQUEST_HEADERS = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "content-type": "text/plain; charset=UTF-8",
  pragma: "no-cache",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "sec-gpc": "1",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const AEP_EDGE_CLUSTERS = {
  "SGP3;3": "konductor-prod.ethos11-prod-sgp3.ethos.adobe.net",
  "IRL1;6": "konductor-prod.ethos12-prod-irl1.ethos.adobe.net",
  "VA6;7": "konductor-prod.ethos10-prod-va6.ethos.adobe.net",
  "AUS3;8": "konductor-prod.ethos11-prod-aus3.ethos.adobe.net",
  "OR2;9": "konductor-prod.ethos12-prod-or2.ethos.adobe.net",
  "JPN3;11": "konductor-prod.ethos12-prod-jpn3.ethos.adobe.net",
  "IND1;12": "konductor-prod.ethos11-prod-ind1.ethos.adobe.net",
};

const AEP_EDGE_DEFAULT_BASE_URL = "edge.adobedc.net/ee";

const SCHEMAS_PERSONALIZATION = [
  "https://ns.adobe.com/personalization/default-content-item",
  "https://ns.adobe.com/personalization/html-content-item",
  "https://ns.adobe.com/personalization/json-content-item",
  "https://ns.adobe.com/personalization/redirect-item",
  "https://ns.adobe.com/personalization/dom-action",
];

function getBaseUrl(locationHint) {
  if (isUndefined(locationHint)) {
    return AEP_EDGE_DEFAULT_BASE_URL;
  }

  const base_url = AEP_EDGE_CLUSTERS[locationHint];

  return isDefined(base_url) ? base_url : AEP_EDGE_DEFAULT_BASE_URL;
}

function convertHeadersToSimpleJson(res) {
  const headersPromise = new Promise((resolve) => {
    const result = {};
    for (const pair of res.headers.entries()) {
      result[pair[0]] = pair[1];
    }
    resolve(result);
  });

  return Promise.all([headersPromise, res.json()]);
}

function prepareAepResponse(requestHeaders, requestBody) {
  return ([responseHeaders, responseBody]) => ({
    request: {
      headers: requestHeaders,
      body: requestBody,
    },
    response: {
      headers: responseHeaders,
      body: responseBody,
    },
  });
}

function logResult(message) {
  return (result) => {
    console.log(message, JSON.stringify(result, null, 2));
    return result;
  };
}

/**
 *
 * @param {string} edgeConfigId
 * @param {string} aepEdgePath
 */
function createAepEdgeClient(
  edgeConfigId,
  aepEdgePath = AEP_EDGE_DEFAULT_BASE_URL
) {
  function interact(requestBody, requestHeaders = {}) {
    const requestId = uuid();
    const requestUrl = `https://${aepEdgePath}/v2/interact?dataStreamId=${edgeConfigId}&requestId=${requestId}`;

    const headers = {
      ...DEFAULT_REQUEST_HEADERS,
      ...requestHeaders,
    };

    return fetch(requestUrl, {
      headers,
      body: JSON.stringify(requestBody),
      method: "POST",
    })
      .then(convertHeadersToSimpleJson)
      .then(prepareAepResponse(headers, requestBody))
      .then(logResult(`AEP EDGE REQUEST: ${requestUrl}`));
  }

  function getPropositions({
    decisionScopes = [PAGE_WIDE_SCOPE],
    xdm = {},
    data = {},
    meta = {},
    requestHeaders = {},
  }) {
    const requestBody = {
      event: {
        xdm: {
          ...xdm,
          timestamp: new Date().toISOString(),
        },
        data: {
          ...data,
        },
      },
      query: {
        identity: { fetch: ["ECID"] },
        personalization: {
          schemas: SCHEMAS_PERSONALIZATION,
          decisionScopes,
        },
      },
      meta: {
        ...meta,
      },
    };

    return interact(requestBody, requestHeaders);
  }

  return {
    interact,
    getPropositions,
  };
}

function getAepCookieName(organizationId, name) {
  return [AEP_COOKIE_PREFIX, organizationId.replace("@", "_"), name].join("_");
}

function getAepEdgePathCookie(organizationId, req) {
  const cookieName = getAepCookieName(
    organizationId,
    COOKIE_NAME_AEP_EDGE_PATH
  );

  return req.cookies[cookieName];
}

function createIdentityPayload(
  id,
  authenticatedState = "ambiguous",
  primary = true
) {
  if (id.length === 0) {
    return undefined;
  }

  return {
    id,
    authenticatedState,
    primary,
  };
}

function getResponseHandles(aepEdgeResult) {
  const { response = {} } = aepEdgeResult;
  const { body = {} } = response;
  const { handle: handles = [] } = body;
  return handles;
}

module.exports = {
  getAepCookieName,
  getAepEdgePathCookie,
  createAepEdgeClient,
  AEP_COOKIE_PREFIX,
  PAGE_WIDE_SCOPE,
  COOKIE_NAME_AEP_EDGE_PATH,
  TYPE_PERSONALIZATION,
  TYPE_STATE_STORE,
  TYPE_IDENTITY_RESULT,
  getAepEdgePath: getBaseUrl,
  createIdentityPayload,
  getResponseHandles,
};
