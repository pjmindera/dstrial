# Notes on DocuSign Integration

The classic redirect/callback system seems to be the most appropriate for our solution. I’ve created a demonstration
app that shows a simple flow that uses their sandbox service to demonstrate integration.

To use:

```
git clone https://github.com/pjmindera/dstrial.git
cd dstrial
npm i
DEBUG=dstrial:* npm start
```

There's now an express server at <http://localhost:3000>

Before doing anything...

- Get a sandbox account at <https://developers.docusign.com/>
- Once registered, get your account ID by clicking on your profil
- Get an oAuth token at <https://developers.docusign.com/oauth-token-generator>
- Edit `./docusign.js` with your account ID

Now click on 'Sign It!' at you'll be redirected to DocuSign, be able to sign the
document and be returned to `/dsreturn`.

## Code

Everything of interest is in `./docusign.js`.

## Authentication

This is the tricky bit. DocuSign has many different methods of authentication to suit different
use cases. tHere we're using a local account and oAuth flow, but this is unsuitable for an SPA.

The only open for SPAs is for the end user to have an account, and we don't want that.

The best solution is for our API to act as a gatekeeper (this also helps with state).

The initial calls to set up the 'envelope' will need to be performed by the API using a
JWT token for authentication. See <https://developers.docusign.com/esign-rest-api/guides/authentication/oauth2-jsonwebtoken>
or Auth code grant as used in this example.

For details on auth types: <https://developers.docusign.com/esign-rest-api/guides/authentication>

The returned value is a URl to redirect to. This can be handed back to the SPA then the SPA
redirects (will need to use localStorage to hold state here).

The callback will hit the SPA directly, so it will be the SPA's responsibility to report the result
to the API.
