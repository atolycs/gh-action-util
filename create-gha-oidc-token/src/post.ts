import { debug, getState, info, setFailed } from "@actions/core";
import { HttpClient } from "@actions/http-client";

async function postRun() {
  try {
    const apiUrl = process.env["GITHUB_API_URL"] || "https://api.github.com";
    const client = new HttpClient("actions-github-app-token");

    const token = getState("token");

    if (!token) {
      info("==> Token is revoked. Skip Post Action");
      return 0;
    }

    const resp = await client.del(`${apiUrl}/installation/token`, {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    });

    const statusCode = resp.message.statusCode;

    if (statusCode === 204) {
      info("===> Token revoked succuessfully.");
      return 0;
    }
    const body = await resp.readBody();

    info(`==> [WARN] unexpected ${statusCode}, ${body}`);
  } catch (error) {
    setFailed(`${error}`);
  }
}
