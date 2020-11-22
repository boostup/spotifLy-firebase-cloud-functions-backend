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

exports.login = functions.https.onRequest(async (request, response) => {
  var spotifyApi = new SpotifyWebApi(spotifyConfig);
  // Create the authorization URL
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, showDialog);
  //   console.log(authorizeURL);
  response.redirect(authorizeURL);
});

exports.spotifyCallback = functions.https.onRequest(
  async (request, response) => {
    try {
      const code = request.query.code;
      var spotifyApi = new SpotifyWebApi(spotifyConfig);
      const data = await spotifyApi.authorizationCodeGrant(code);
      console.log("The token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);
      console.log("The refresh token is " + data.body["refresh_token"]);

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body["refresh_token"]);
      const me = await spotifyApi.getMe();
      response.jsonp(me.body);
    } catch (error) {
      console.log(error.toString());
      response.jsonp({ error: error.toString() });
    }
  }
);

exports.getAllMyPlaylists = functions.https.onRequest(
  async (request, response) => {
    console.log(spotifyApi.getAccessToken());
    response.send(spotifyApi.getAccessToken());
  }
);
