import { apiClient } from './client';
import { Waiter } from '../../types/waiter';

type WaitersResponse = {
  status: string;
  data: Array<{
    id: number;
    waiter_id: number;
    email: string;
  }>;
};

export async function getWaiters(token?: string): Promise<Waiter[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<WaitersResponse>(
    '/api/waiterslist',
    { headers }
  );

  return response.data.map((waiter) => ({
    id: String(waiter.id),
    waiterId: String(waiter.waiter_id),
    email: waiter.email,
    name: waiter.email,
  }));
}