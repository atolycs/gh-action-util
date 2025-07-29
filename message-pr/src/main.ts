import { getOctokit, context } from "@actions/github";
import { debug, info, getInput, setFailed } from "@actions/core";

const main = async () => {
  debug("Get Octokit");

  info(`==> Add comment to PR #${context.payload.pull_requet?.number}`);

  const token = getInput("token");
  const message = getInput("message");
  const octokit = getOctokit(token);

  const pull_number = context.payload.pull_requet?.number;

  try {
    await octokit.rest.pulls.createReview({
      ...context.repo,
      pull_number,
      event: "COMMENT",
      body: message,
    });
  } catch (e) {
    setFailed(`==> ${err.message}`);
  }
};

main();
