import { apiClient } from './client';

export type WaiterLoginRequest = {
  email: string;
  password: string;
};

export type WaiterLoginResponse = {
  token?: string;
  access_token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
};

export async function waiterLogin(payload: WaiterLoginRequest) {
  return apiClient.post<WaiterLoginResponse>(
    '/api/auth/waiter-login',
    payload
  );
}