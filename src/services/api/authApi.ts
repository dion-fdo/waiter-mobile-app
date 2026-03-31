import { apiClient } from './client';

export type M2MTokenRequest = {
  client_id: string;
  client_secret: string;
};

export type M2MTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export async function getM2MToken(payload: M2MTokenRequest) {
  return apiClient.post<M2MTokenResponse>('/api/m2m/token', payload);
}