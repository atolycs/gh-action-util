export interface GetTokenParams {
  providerEndpoint: string;
  audience: string;
  repositories: string[];
}

export interface GetTokenPayload {
  api_url: string;
  repositories: string[];
}

export interface GetTokenError {
  messages: string;
}
