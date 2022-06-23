const { PAGE_WIDE_SCOPE, TYPE_PERSONALIZATION } = require("./aepEdgeClient");

const { getAddress } = require("./utils");
const { getCookieEntries } = require("./cookies");

/**
 * Requests propositions from the Adobe Experience Edge API
 * @param aepEdgeClient instance of aepEdgeClient
 * @param req request object
 * @param decisionScopes array of decision scopes to retrieve (global page-wide scope included by default)
 * @param identityMap object with identities
 * @returns {Promise<*>}
 */
function requestAepEdgePersonalization(
  aepEdgeClient,
  req,
  decisionScopes = [],
  identityMap = {}
) {
  const address = getAddress(req);
  const cookieEntries = getCookieEntries(req);

  return aepEdgeClient.getPropositions({
    decisionScopes: [PAGE_WIDE_SCOPE, ...decisionScopes],
    xdm: {
      web: {
        webPageDetails: { URL: address },
        webReferrer: { URL: "" },
      },
      identityMap: {
        ...identityMap,
      },
    },
    meta: {
      state: {
        domain: req.headers.host,
        cookiesEnabled: true,
        entries: cookieEntries,
      },
    },
    requestHeaders: {
      Referer: address,
    },
  });
}

function getPersonalizationPayloads(aepEdgeResult) {
  const { response = {} } = aepEdgeResult;
  const { body = {} } = response;
  const { handle: aepEdgeHandles = [] } = body;

  const personalization =
    aepEdgeHandles.find((handle) => handle.type === TYPE_PERSONALIZATION) || {};

  const { payload: payloadList = [] } = personalization;
  return payloadList;
}

function getPersonalizationOfferItems(aepEdgeResult, decisionScopeName) {
  const offer =
    getPersonalizationPayloads(aepEdgeResult).find(
      (payload) => payload.scope === decisionScopeName
    ) || {};
  const { items: offerItems = [] } = offer;
  return offerItems;
}

module.exports = {
  requestAepEdgePersonalization,
  getPersonalizationPayloads,
  getPersonalizationOfferItems,
};
