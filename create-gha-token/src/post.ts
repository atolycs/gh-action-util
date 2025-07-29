import { getInput, getState, info, debug } from "@actions/core";

const main = async () => {
  info("==> Revoking the access token...");

  const token = getState("token");
  const url = "https://api.github.com/installation/token";

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    info("==> Access token revoked successfully!");
  }
};

main();
