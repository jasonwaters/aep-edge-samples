const {
  getAepCookieName,
  COOKIE_NAME_AEP_EDGE_PATH,
  getAepEdgePath,
  TYPE_STATE_STORE,
  AEP_COOKIE_PREFIX,
} = require("./aepEdgeClient");

const SECONDS_PER_MINUTE = 60;
const DEFAULT_COOKIE_EXPIRE_MINS = 31;

/**
 * Sets cookies in the response object
 * @param req request
 * @param res response to be returned to the client
 * @param cookie cookie to be set
 */
function saveCookie(req, res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name || cookie.key, cookie.value, {
    maxAge: cookie.maxAge * 1000,
    domain: req.headers.host.includes(".")
      ? `.${req.headers.host}`
      : req.headers.host,
  });
}

function saveAepEdgeCookies(organizationId, { req, res, aepEdgeResult }) {
  //location hint cookie
  saveCookie(req, res, {
    name: getAepCookieName(organizationId, COOKIE_NAME_AEP_EDGE_PATH),
    value: getAepEdgePath(aepEdgeResult.response.headers["x-adobe-edge"]),
    maxAge: SECONDS_PER_MINUTE * DEFAULT_COOKIE_EXPIRE_MINS,
  });

  // set cookies from state:store
  const { handle = [] } = aepEdgeResult.response.body;
  handle
    .filter((item) => item.type === TYPE_STATE_STORE)
    .forEach((item) => {
      const { payload = [] } = item;

      payload.forEach((cookie) => {
        saveCookie(req, res, cookie);
      });
    });
}

/**
 *
 * Extracts an array of AEP cookies found in the request headers
 * AEP cookies are prefixed with 'kndctr_'
 * @param req request object
 * @returns {*[]} Array of cookies
 */
function getCookieEntries(req) {
  const entries = [];

  Object.keys(req.cookies)
    .filter((key) => key.startsWith(AEP_COOKIE_PREFIX))
    .forEach((key) => {
      entries.push({
        key,
        value: req.cookies[key],
      });
    });

  return entries;
}

module.exports = {
  saveAepEdgeCookies,
  getCookieEntries,
};
