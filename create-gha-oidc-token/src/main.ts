import {
  getInput,
  setFailed,
  setOutput,
  saveState,
  setSecret,
  info,
  debug,
  getIDToken
} from "@actions/core"
import  { HttpClient } from "@actions/http-client"

import { assumeRole } from "./lib/genToken"; 


function parseRepository(repo: string):string[] {
  if (!repo) {
    return [];
  }
  return repo.split(/\s+/);
}

async function run() {
  const defaultProviderEndpoint = "http://localhost:8080"
  const defaultAppID = "12345678"
  const audiencePrefix = "https://github-oidc.example.com"

  try {
    const providerEndpoint = getInput("provider-endpoint") || defaultProviderEndpoint
    const appID = getInput("app-id") || defaultAppID
    const audience =  audiencePrefix + appID
    const repositories = parseRepository(getInput("repositories")) 

    assumeRole(
      {
        providerEndpoint,
        audience,
        repositories
      }
    )
  } catch (error) {
    if( error instanceof Error ) {
      setFailed(error)
    } else {
      setFailed(`${error}`)
    }
  }
}
