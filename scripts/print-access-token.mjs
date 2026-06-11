#!/usr/bin/env node
// Print a Google OAuth2 access token using the firebase-tools CLI login.
// Requires `firebase login` to have been run on this machine.
// The client id/secret are firebase-tools' public open-source constants.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const store = JSON.parse(
  readFileSync(join(homedir(), ".config", "configstore", "firebase-tools.json"), "utf8")
);
const refreshToken = store?.tokens?.refresh_token;
if (!refreshToken) {
  console.error("No refresh token found — run `firebase login` first.");
  process.exit(1);
}

const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});
if (!res.ok) {
  console.error(`Token exchange failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
process.stdout.write(data.access_token);
