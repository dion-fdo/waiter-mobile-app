import { apiClient } from './client';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  user?: {
    id: string;
    name: string;
    role?: string;
  };
};

export async function loginWaiter(payload: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}