require("dotenv").config();
const functions = require("firebase-functions");
const SpotifyWebApi = require("spotify-web-api-node");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const spotifyConfig = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
};

const queryParams = {
  CODE: "code",
  ACCESS_TOKEN: "access_token",
  EXPIRES_IN: "expires_in",
  REFRESH_TOKEN: "refresh_token",
};

const state = "some-state-of-my-choice-1";
const showDialog = true;

const scopes = [
  "streaming",
  "user-library-read",
  "user-library-modify",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-email",
  "user-read-playback-state",
  "user-read-private",
  "user-read-recently-played",
  "user-top-read",
];

/**
 * 1) This function is invoked by the Front when a user clicks on `Login` in the Frontend
 * 2) This function allows to redirect the Frontend towards the Spotify authorization dialog, where the user can sign in with their account and then autorize the requested scopes.
 * 2) This dialog than redirects the user to `spotifyCallback` Backend function.
 */
exports.authorize = functions.https.onRequest(async (request, response) => {
  var spotifyApi = new SpotifyWebApi(spotifyConfig);
  // Create the authorization URL
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, showDialog);
  response.redirect(authorizeURL);
});

/**
 * 1) This function is invoked when the Spotify authorization dialog is allowed by the user, passing the `code` query parameter in the URL.
 * 2) This function then requests the expiry duration, access and refresh tokens from Spotify API.
 * 3) The Backend then passes these values to the Frontend as query parameters in the `process.env.FRONTEND_REDIRECT_URI` redirection url
 */
exports.spotifyCallback = functions.https.onRequest(
  async (request, response) => {
    try {
      const code = request.query[queryParams.CODE];
      var spotifyApi = new SpotifyWebApi(spotifyConfig);

      const data = await spotifyApi.authorizationCodeGrant(code);

      const expiresIn = data.body[queryParams.EXPIRES_IN];
      const accessToken = data.body[queryParams.ACCESS_TOKEN];
      const refreshToken = data.body[queryParams.REFRESH_TOKEN];
      console.log("The token expires in " + expiresIn);
      console.log("The access token is " + accessToken);
      console.log("The refresh token is " + refreshToken);

      const frontEndRedirect = `${process.env.FRONTEND_REDIRECT_URI}?${queryParams.ACCESS_TOKEN}=${accessToken}&${queryParams.EXPIRES_IN}=${expiresIn}&${queryParams.REFRESH_TOKEN}=${refreshToken}`;
      response.redirect(frontEndRedirect);
    } catch (error) {
      console.log(error.toString());
      const frontEndRedirect = `${
        process.env.FRONTEND_REDIRECT_URI
      }?error=${encodeURIComponent(error.toString())}`;
      response.redirect(frontEndRedirect);
    }
  }
);

/**
 * 1) This function is inovoked by the Frontend when it computes that its access token has expired, passing the `access_token` and `refresh_token` query parameter in the URL.
 * 2) This function requests a refreshed token from Spotify API using the params it received
 * 3) It sends the new refreshed token back to the Frontend using JSON
 */
exports.refresh = functions.https.onRequest(async (request, response) => {
  const expiredAccessToken = request.query[queryParams.ACCESS_TOKEN];
  const refreshToken = request.query[queryParams.REFRESH_TOKEN];

  var spotifyApi = new SpotifyWebApi(spotifyConfig);

  // Set the access token on the API object to use it in later calls
  spotifyApi.setAccessToken(expiredAccessToken);
  spotifyApi.setRefreshToken(refreshToken);

  try {
    const data = await spotifyApi.refreshAccessToken();
    console.log("The access token has been refreshed!", data.body);
    response.set("Access-Control-Allow-Origin", "*");
    response.json({
      [queryParams.ACCESS_TOKEN]: data.body[queryParams.ACCESS_TOKEN],
      [queryParams.EXPIRES_IN]: data.body[queryParams.EXPIRES_IN],
    });
  } catch (error) {
    console.log("Could not refresh access token", error);
    response.json({
      error: "Could not refresh access token",
    });
  }
});

exports.getAllMyPlaylists = functions.https.onRequest(
  async (request, response) => {
    console.log(spotifyApi.getAccessToken());
    response.send(spotifyApi.getAccessToken());
  }
);
