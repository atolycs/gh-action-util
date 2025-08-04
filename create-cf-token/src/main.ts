import {
  getInput,
  saveState,
  setOutput,
  setSecret,
  info,
  debug,
  setFailed,
} from "@actions/core";
import { getOctokit } from "@actions/github";

import Cloudflare from "cloudflare";

import { TokenCreateParams } from "cloudflare/resources/accounts/index.mjs";

import {
  PermissionGroupGetResponse,
  PermissionGroupGetResponseSinglePage,
} from "cloudflare/resources/accounts/tokens/permission-groups.mjs";

import { resourceLimits } from "worker_threads";

async function getGithubIP(
  batch: string = "actions",
  retries: number = 3,
): Promise<string[] | undefined> {
  try {
    const githubToken = getInput("github_token");
    const octokit = getOctokit(githubToken);

    const response = (await octokit.rest.meta.get()).data.actions;
    return response || [];
  } catch (e) {
    console.log(e);
  }
}

export async function run(): Promise<void> {
  try {
    const control_token = getInput("token");
    const groupList = ["Pages Write", "Pages Read"];

    info("==> Getting GitHub action metadata...");
    const client = new Cloudflare({
      apiToken: control_token,
    });

    info("==> Checking Generate only Token is Available...");

    const account_id = getInput("account_id");
    const response = await client.accounts.tokens.verify({
      account_id: account_id,
    });

    info(`Token status: ${response.status}`);

    info("==> Creating Pages Deploy Only Secure Token...");

    const perm_response = await client.accounts.tokens.permissionGroups.list({
      account_id: account_id,
    });

    debug("==> Creating Payload...");
    const payload: TokenCreateParams = {
      account_id,
      name: "Github Actions Temporaly Token",
      policies: await Promise.all(
        groupList.map(async (permission) => {
          const temp_permission = await perm_response.result.find((g: any) => {
            return g.name === permission;
          });

          let resource = `${temp_permission.scopes}.${account_id}`;

          return {
            effect: "allow",
            permission_groups: [
              {
                id: temp_permission.id,
              },
            ],

            resources: {
              [resource]: "*",
            },
          };
        }),
      ),
      condition: {
        request_ip: {
          in: await getGithubIP(),
        },
      },
      not_before: new Date().toISOString().split(".")[0] + "Z",
    };

    debug(payload);
    const token_response = await client.accounts.tokens.create(payload);

    info("==> Temporaly Token Generated");

    setSecret(token_response.value);
    setOutput("cf-token", token_response.value);
    saveState("cf-token-id", token_response.id);
    saveState("cf-token", token_response.value);
    saveState("controller-token", control_token);
  } catch (error) {
    if (error instanceof Error) setFailed(error.message);
  }
}

run();
