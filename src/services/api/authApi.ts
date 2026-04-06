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

export type WaiterLoginRequest = {
  email: string;
  password: string;
};

export type WaiterLoginResponse = {
  user: {
    id: number;
    waiter_id: number;
    is_waiter: number;
    firstname: string;
    lastname: string;
    email: string;
    status: number;
  };
  token: string;
};

export async function waiterLogin(payload: WaiterLoginRequest) {
  return apiClient.post<WaiterLoginResponse>(
    '/api/auth/waiter-login',
    payload
  );
}

export async function getM2MToken(payload: M2MTokenRequest) {
  return apiClient.post<M2MTokenResponse>('/api/m2m/token', payload);
}