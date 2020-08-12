const docusign = require("docusign-esign"),
  path = require("path"),
  fs = require("fs"),
  { promisify } = require("util"), // http://2ality.com/2017/05/util-promisify.html
  basePath = "https://demo.docusign.net/restapi";
// baseUrl is the url of the application's web server. Eg http://localhost:3000
// In some cases, this example can determine the baseUrl automatically.
// See the baseUrl statements at the end of this example.
let baseUrl = "http://localhost:3000";

exports.homey = function (req, res) {
  res.render("index");
};

exports.dsreturn = function (req, res) {
  res.render("return", { result: req.query.event });
};

exports.sign = async function (req, res) {
  // Obtain an OAuth token from https://developers.docusign.com/oauth-token-generator
  const accessToken =
    "eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQsAAAABAAUABwAAP75wpD7YSAgAAH_hfuc-2EgCAOk8hmplHudGprWxQXjqa60VAAEAAAAYAAEAAAAFAAAADQAkAAAAZjBmMjdmMGUtODU3ZC00YTcxLWE0ZGEtMzJjZWNhZTNhOTc4IgAkAAAAZjBmMjdmMGUtODU3ZC00YTcxLWE0ZGEtMzJjZWNhZTNhOTc4EgABAAAACwAAAGludGVyYWN0aXZlMAAAEo1vpD7YSDcAIOXwHgTxbkuWTXBfeKamYA.sBPpc45DqLF92uWThtJw8SbIY7pZr-K2eUHzRpZGRA80sLGgC1qu9gVWp7z2X8_0dRv6ui5t4RSpwLB8DMwl5QU1VWYduPFI6Urk7l0KIBUJKUgXDbdci0ozMnzmymBz056T0cwbwYkor1W3CVaXli4ccqrOjyDaPp0X-nyGGQT1-sCv9W6O_gOYWZh7cJROU96b5KJSsUGQfIx7hsT70L7kcTNaD_OBSqIH34WvOdkWIWsba2nM5nW2r77THd-1bnnT4zsJ49ItS-jWisHtJcukuHTgnUkwSHasER0Brn-AWf00FcSotQMq5FpyOzt6AfGfVOMcT02uYcg_ueXw3A";

  // Obtain your accountId from appdemo.docusign.com -- the account id is shown in the drop down on the
  // upper right corner of the screen by your picture or the default picture.
  const accountId = "11202040";

  // Recipient Information:
  const signerName = "John Signer";
  const signerEmail = "john.signer@mrpjevans.com";

  const clientUserId = "123", // Used to indicate that the signer will use an embedded
    // Signing Ceremony. Represents the signer's userId within
    // your application.

    // How is this application authenticating
    // the signer? See the `authenticationMethod' definition
    // https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeViews/createRecipient
    authenticationMethod = "None";

  // The document to be signed. Path is relative to the root directory of this repo.
  const fileName = "contract.pdf";

  //  Step 1. The envelope definition is created.
  //          One signHere tab is added.
  //          The document path supplied is relative to the working directory

  const envDef = new docusign.EnvelopeDefinition();
  //Set the Email Subject line and email message
  envDef.emailSubject = "Please sign this document sent from the Node example";
  envDef.emailBlurb = "Please sign this document sent from the Node example.";

  // Read the file from the document and convert it to a Base64String
  const pdfBytes = fs.readFileSync(path.resolve(__dirname, fileName)),
    pdfBase64 = pdfBytes.toString("base64");

  // Create the document request object
  const doc = docusign.Document.constructFromObject({
    documentBase64: pdfBase64,
    fileExtension: "pdf", // You can send other types of documents too.
    name: "Sample document",
    documentId: "1",
  });

  // Create a documents object array for the envelope definition and add the doc object
  envDef.documents = [doc];

  // Create the signer object with the previously provided name / email address
  const signer = docusign.Signer.constructFromObject({
    name: signerName,
    email: signerEmail,
    routingOrder: "1",
    recipientId: "1",
    clientUserId: clientUserId,
  });

  // Create the signHere tab to be placed on the envelope
  const signHere = docusign.SignHere.constructFromObject({
    documentId: "1",
    pageNumber: "1",
    recipientId: "1",
    tabLabel: "SignHereTab",
    xPosition: "195",
    yPosition: "147",
  });

  // Create the overall tabs object for the signer and add the signHere tabs array
  // Note that tabs are relative to receipients/signers.
  signer.tabs = docusign.Tabs.constructFromObject({ signHereTabs: [signHere] });

  // Add the recipients object to the envelope definition.
  // It includes an array of the signer objects.
  envDef.recipients = docusign.Recipients.constructFromObject({
    signers: [signer],
  });

  // Set the Envelope status. For drafts, use 'created' To send the envelope right away, use 'sent'
  envDef.status = "sent";

  //
  //  Step 2. Create/send the envelope.
  //          We're using a promise version of the SDK's createEnvelope method.
  //
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(basePath);
  apiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  // Set the DocuSign SDK components to use the apiClient object
  docusign.Configuration.default.setDefaultApiClient(apiClient);

  let envelopesApi = new docusign.EnvelopesApi();
  // createEnvelopePromise returns a promise with the results:
  let createEnvelopePromise = promisify(envelopesApi.createEnvelope).bind(
    envelopesApi
  );
  let results;

  try {
    results = await createEnvelopePromise(accountId, {
      envelopeDefinition: envDef,
    });

    //
    // Step 3. The envelope has been created.
    //         Request a Recipient View URL (the Signing Ceremony URL)
    //
    const envelopeId = results.envelopeId,
      recipientViewRequest = docusign.RecipientViewRequest.constructFromObject({
        authenticationMethod: authenticationMethod,
        clientUserId: clientUserId,
        recipientId: "1",
        returnUrl: baseUrl + "/dsreturn",
        userName: signerName,
        email: signerEmail,
      }),
      createRecipientViewPromise = promisify(
        envelopesApi.createRecipientView
      ).bind(envelopesApi);
    results = await createRecipientViewPromise(accountId, envelopeId, {
      recipientViewRequest: recipientViewRequest,
    });

    //
    // Step 4. The Recipient View URL (the Signing Ceremony URL) has been received.
    //         Redirect the user's browser to it.
    //
    res.redirect(results.url);
  } catch (e) {
    // Handle exceptions
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API exception
      res.send(`<html lang="en"><body>
                  <h3>API problem</h3><p>Status code ${e.response.status}</p>
                  <p>Error message:</p><p><pre><code>${JSON.stringify(
                    body,
                    null,
                    4
                  )}</code></pre></p>`);
    } else {
      // Not a DocuSign exception
      throw e;
    }
  }
};
