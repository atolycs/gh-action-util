import {
  getIDToken,
  error,
  info,
  setSecret,
  setOutput,
  saveState,
  setFailed,
} from "@actions/core";

import { HttpClient, HttpCodes } from "@actions/http-client";

import type {
  GetTokenError,
  GetTokenParams,
  GetTokenPayload,
} from "../types/genToken.d.ts";

export async function assumeRole(params: GetTokenParams) {
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  const GITHUB_API_URL =
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

  const token = getIDToken(params.audience);
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  headers["Authorization"] = `Bearer ${token}`;

  const client = new HttpClient("github-app-token");

  const result = await client.postJson<GetTokenError>(
    params.providerEndpoint,
    payload,
    headers,
  );
  if (result.statusCode !== HttpCodes.OK) {
    const resp = result.result as GetTokenError;
    setFailed(resp?.messages || "unknown error");
    return;
  }
}

const isIdTokenAvailable = (): boolean => {
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  const token = process.env["ACTIONS_ID_TOKEN_REQEUEST_TOKEN"];
  // biome-ignore lint/complexity/useLiteralKeys: <explanation>
  const url = process.env["ACTIONS_ID_TOKEN_REQUEST_URL"];
  // biome-ignore lint/complexity/noUselessTernary: <explanation>
  return token && url ? true : false;
};
