import Cloudflare from "cloudflare";
import { setFailed, getInput, info, debug, getState } from "@actions/core";

export async function post(): Promise<void> {
  try {
    const client = new Cloudflare({
      apiToken: getState("controller-token"),
    });

    info("==> Revoking Actions Token...");

    const response = await client.accounts.tokens.delete(
      getState("cf-token-id"),
      {
        account_id: getInput("account_id"),
      },
    );

    info("==> Revoked Token.");
  } catch (error) {
    if (error instanceof Error) setFailed(error.message);
  }
}

post();
