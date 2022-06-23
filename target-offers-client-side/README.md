# Target Offers Client-side

## Overview

This sample demonstrates using Adobe Expreience Platform to get personalization content from Adobe Target.  The web page changes based on the personalization content returned.  

This sample uses the [Adobe Experience Platform Web SDK](https://experienceleague.adobe.com/docs/experience-platform/edge/home.html) to get personalization content and to render it entirely client-side. 

Here is what the page looks like before and after personalization content is rendered. 

| without target personalization                              | with target personalization                                       |
|-------------------------------------------------------------|-------------------------------------------------------------------|
| <img src="../.assets/plain.png" alt="drawing" width="800"/> | <img src="../.assets/with-offers.png" alt="drawing" width="800"/> |

Please review the [summary of target activities used](../TargetActivities.md) for this sample. 


## Running the sample

<small>Prerequisite: [install node and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).</small>

To run this sample:

1. Clone the repository to your local machine.
2. Open a terminal and change directory to this sample's folder.
3. Run `npm install`
4. Run `npm start`
5. Open a web browser to [http://localhost](http://localhost)

## How it works

1. [Alloy](https://experienceleague.adobe.com/docs/experience-platform/edge/home.html) is included on the page.
2. The `sendEvent` command is used to fetch personalization content.

```javascript
alloy("sendEvent", {
    "renderDecisions": true,
    decisionScopes: ["sample-json-offer"]
  }
).then(applyPersonalization("sample-json-offer"));
```

3. Alloy renders page load Visual Experience Composer (VEC) offers automatically because the `renderDecisions` flag is set to true.
4. Form-based JSON offers are used in the sample implementation's [`applyPersonalization`](./public/script.js) method to update the DOM based on the offer.
5. For form-based activities, display events must manually be sent in the implementation to indicate when the mbox offer has been displayed. This is done via the `sendEvent` command.

```javascript
function sendDisplayEvent(decision) {
  const { id, scope, scopeDetails = {} } = decision;

  alloy("sendEvent", {
    xdm: {
      eventType: "decisioning.propositionDisplay",
      _experience: {
        decisioning: {
          propositions: [
            {
              id: id,
              scope: scope,
              scopeDetails: scopeDetails,
            },
          ],
        },
      },
    },
  });
}
```

## Beyond the sample

This sample app can serve as a starting point for you to experiment and learn more about Adobe Experience Platform. For example, you can change a few environment variables so the sample app pulls in offers from your own AEP configuration.  To do so, just open the `.env` file at the root of this repository and modify the variables.  Restart the sample app, and you're ready to experiemnt using your own personalization content.
