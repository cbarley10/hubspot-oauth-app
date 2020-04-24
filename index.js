// Packages
require("dotenv").config();
const express = require("express");
const NodeCache = require("node-cache");
const session = require("express-session");
const app = express();
const { fetchTokens, fetchContact, refreshTokens } = require("./utils");

// Constants
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPE } = process.env;
const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;

// "Database"
const refreshTokenStore = {};
const accessTokenCache = new NodeCache({ deleteOnExpire: true });

// Middleware
app.use(
  session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
app.get("/home", (req, res) => {
  res.send("<a href='/authorize'>Link</a>");
});

app.get("/authorize", (req, res) => {
  console.log("");
  console.log("=== Initiating OAuth 2.0 flow with HubSpot ===");
  console.log("");
  console.log("===> Step 1: Redirecting user to your app's OAuth URL");
  res.redirect(authUrl);
  console.log("");
  console.log("===> Step 2: User is being prompted for consent by HubSpot");
});

app.get("/redirect", async (req, res) => {
  console.log("");
  console.log("===> Step 3: Redirecting user to your app's OAuth URL");
  console.log("");
  console.log(
    "===> Step 4: Attempting to use the redirect code to fetch access and refresh tokens"
  );
  const { code } = req.query;
  const userId = req.sessionID;

  if (code) {
    console.log("       > Received an authorization token");
    try {
      const response = await fetchTokens(
        code,
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
      );
      if (response.status === 401) {
        res.redirect("/retry");
      }
      const { refresh_token, access_token, expires_in } = response.data;
      console.log("");
      console.log("===> Step 5: Received Tokens!");
      console.log("");
      console.log("===> Step 6: Saving to database and redirecting");
      refreshTokenStore[userId] = refresh_token;
      accessTokenCache.set(userId, access_token, Math.round(expires_in * 0.75));
      res.redirect("/");
      res.end();
    } catch (e) {
      console.log(e);
    }
  }
});

app.get("/retry", (req, res) => {
  const userId = req.sessionID;
  const refreshToken = refreshTokenStore[userId];
  const response = refreshTokens(CLIENT_ID, CLIENT_SECRET, refreshToken);
  const { access_token, expires_in } = response.data;
  accessTokenCache.set(userId, access_token, Math.round(expires_in * 0.75));
});

app.get("/", async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.write(`<h2>OAuth App</h2>`);
  console.log("");
  console.log("===> Fetching One Contact");
  const accessToken = accessTokenCache.get(req.sessionID);
  const contacts = await fetchContact(accessToken);
  const randomNumber = Math.floor(Math.random() * 19) + 1;
  const contact = contacts[randomNumber];

  res.write(`<p>Access token: ${accessToken}</p>`);
  res.write(
    `<h3>Contact: <a href="${contact["profile-url"]}">${contact.properties.firstname.value} ${contact.properties.lastname.value}</h3>`
  );
  console.log(
    `      > Found Contact ${contact.properties.firstname.value} ${contact.properties.lastname.value}`
  );
  res.end();
});

// Start Server
app.listen("3000", () => console.log("started on 3000"));
