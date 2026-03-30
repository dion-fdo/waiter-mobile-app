import { apiClient } from './client';
import { RestaurantTable } from '../../types/table';

export async function getTables(): Promise<RestaurantTable[]> {
  return apiClient.get<RestaurantTable[]>('/tables');
}