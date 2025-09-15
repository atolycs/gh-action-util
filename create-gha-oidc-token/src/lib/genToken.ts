import {
  debug,
  error,
  getIDToken,
  info,
  saveState,
  setFailed,
  setOutput,
  setSecret,
} from "@actions/core";

import { HttpClient, HttpCodes } from "@actions/http-client";

import type {
  GetTokenError,
  GetTokenParams,
  GetTokenPayload,
  OIDCTokenResponse,
} from "../types/genToken.d.ts";

export async function assumeRole(params: GetTokenParams) {
  const GITHUB_API_URL =
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    process.env["GITHUB_API_URL"] || "https://api.github.com";

  const payload: GetTokenPayload = {
    api_url: GITHUB_API_URL,
    repositories: params.repositories,
  };
  const headers: { [name: string]: string } = {};

  if (!isIdTokenAvailable()) {
    error(`
      OIDC provider is not available.
      please enable it.
      https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
    `);
  }

  debug(`Fetch ACTIONS_ID_TOKEN_REQUEST_URL`);
  const response = await fetch(process.env["ACTIONS_ID_TOKEN_REQUEST_URL"], {
    headers: new Headers({
      Authorization: `Bearer ${process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]}`,
    }),
  });

  console.log(await response.json());

  const token = await getIDToken(params.audience);
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  headers["Authorization"] = `Bearer ${token}`;

  const client = new HttpClient("github-app-token");

  const respToken = await client.postJson<OIDCTokenResponse | GetTokenError>(
    params.providerEndpoint,
    payload,
    headers,
  );
  if (respToken.statusCode !== HttpCodes.OK) {
    const result = respToken.result as GetTokenError;
    setFailed(result?.messages || "unknown error");
    return;
  }

  debug(respToken.result);

  const { result } = respToken;

  console.log(`==> ${result.message}`);
  console.log(`==> Token Available to 60 min`);

  console.log(`==> Setting the outputs...`);

  setSecret(result.token);
  setOutput("token", result.token);
  setOutput("app_slug", "");
}

const isIdTokenAvailable = (): boolean => {
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  const token = process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  const url = process.env["ACTIONS_ID_TOKEN_REQUEST_URL"];
  // biome-ignore lint/complexity/noUselessTernary: <explanation>
  return token && url ? true : false;
};
