import {
  getInput,
  setFailed,
  setOutput,
  saveState,
  setSecret,
  info,
  debug,
} from "@actions/core";

import * as jwt from "jsonwebtoken";

const main = async () => {
  info("==> Getting the inputs...");
  const GITHUB_CLIENT_ID = getInput("app-id") || getInput("app_id");
  const GITHUB_PRIVATE_KEY = getInput("private-key") || getInput("private_key");

  const repositories =
    getInput("repositories") ||
    String(process.env.GITHUB_REPOSITORY).split("/")[1];

  const payload = {
    iat: Math.floor(Date.now() / 1000) - 1 * 60, // Issues 60 seconds in the past
    exp: Math.floor(Date.now() / 1000) + 1 * 60, // Expire 10 min in the feature
    iss: GITHUB_CLIENT_ID,
  };

  const access_repositories = JSON.stringify({
    repositories: [`${repositories}`],
  });

  const resultJWT = jwt.sign(payload, GITHUB_PRIVATE_KEY, {
    algorithm: "RS256",
  });

  const url = "https://api.github.com/app/installations";
  const resultInstallation = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${resultJWT}`,
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const installations = await resultInstallation.json();
  const installation = installations[0];

  const bot_commit_sign = {
    name: installation.app_slug,
    email: `${installation.app_id}+${installation.app_slug}@users.noreply.github.com`,
  };

  const resultAccessToken = await fetch(installation.access_tokens_url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resultJWT}`,
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: access_repositories,
  });

  const accessToken = await resultAccessToken.json();

  if (!accessToken) {
    throw new Error("Failed to get access token");
  }

  info("==>: Setting the outputs...");
  setSecret(accessToken.token);
  setOutput("token", accessToken.token);
  setOutput("app_slug", installation.app_slug);
  setOutput("installation_id", installation.id);
  setOutput("commit-email", bot_commit_sign.email);
  saveState("token", accessToken.token);

  info(`==> Welcome back! 🎉 ${installation.app_slug}!`);
  info(`==> Token Alive for 60 seconds`);
};

main();
