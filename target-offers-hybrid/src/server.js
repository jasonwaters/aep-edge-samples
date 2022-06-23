const path = require("path");

require("dotenv").config({ path: path.resolve(process.cwd(), "..", ".env") });

const express = require("express");
const cookieParser = require("cookie-parser");

const {
  createAepEdgeClient,
  createIdentityPayload,
} = require("aep-edge-samples-common/aepEdgeClient");

const {
  loadHandlebarsTemplate,
} = require("aep-edge-samples-common/templating");

const { isDefined } = require("@adobe/target-tools");
const {
  getAepEdgePathCookie,
  TYPE_STATE_STORE,
  getResponseHandles,
} = require("aep-edge-samples-common");
const {
  requestAepEdgePersonalization,
  getPersonalizationOfferItems,
} = require("aep-edge-samples-common/personalization");
const { saveAepEdgeCookies } = require("aep-edge-samples-common/cookies");
const { sendResponse } = require("aep-edge-samples-common/utils");

const { EDGE_CONFIG_ID, ORGANIZATION_ID, demoDecisionScopeName, FPID } =
  process.env;

// Initialize the Express app
const app = express();
const PORT = process.env.PORT;

// Setup cookie parsing middleware and static file serving from the /public directory
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "..", "public")));

function prepareTemplateVariables(handles) {
  return {
    demoDecisionScopeName,
    edgeConfigId: EDGE_CONFIG_ID,
    orgId: ORGANIZATION_ID,
    applyHandlesParam: JSON.stringify(
      {
        renderDecisions: true,
        handles: handles.filter((item) => item.type !== TYPE_STATE_STORE),
      },
      null,
      2
    ),
  };
}

// Setup the root route Express app request handler for GET requests
app.get("/", async (req, res) => {
  const aepEdgeClient = createAepEdgeClient(
    EDGE_CONFIG_ID,
    getAepEdgePathCookie(ORGANIZATION_ID, req)
  );

  const aepEdgeResult = await requestAepEdgePersonalization(
    aepEdgeClient,
    req,
    [demoDecisionScopeName],
    {
      FPID: [isDefined(FPID) ? createIdentityPayload(FPID) : []],
    }
  );

  const template = loadHandlebarsTemplate("index");

  const templateVariables = prepareTemplateVariables(
    getResponseHandles(aepEdgeResult),
    getPersonalizationOfferItems(aepEdgeResult, demoDecisionScopeName)
  );

  const context = {
    req,
    res,
    template,
    templateVariables,
    aepEdgeResult,
  };

  saveAepEdgeCookies(ORGANIZATION_ID, context);
  sendResponse(context);
});

// Startup the Express server listener
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

// Stop the server on any app warnings
process.on("warning", (e) => {
  console.warn("Node application warning", e);
  process.exit(-1);
});
