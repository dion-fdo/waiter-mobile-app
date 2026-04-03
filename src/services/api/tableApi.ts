import { apiClient } from './client';
import { RestaurantTable } from '../../types/table';

type TableAvailabilityResponse = {
  status: string;
  data: Array<{
    table_id: number;
    table_name: string;
    capacity: number;
    occupied_people: number;
    remaining_capacity: number;
    status: 'available' | 'partially_available' | 'overbooked';
  }>;
};

function extractTableNumber(name: string, fallbackId: number): number {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : fallbackId;
}

function mapAvailabilityStatus(
  status: 'available' | 'partially_available' | 'overbooked'
): 'free' | 'partially_occupied' | 'full' {
  if (status === 'available') return 'free';
  if (status === 'partially_available') return 'partially_occupied';
  return 'full';
}

export async function getTables(token?: string): Promise<RestaurantTable[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<TableAvailabilityResponse>(
    '/api/table-availability',
    { headers }
  );

  return response.data.map((table) => ({
    id: String(table.table_id),
    number: extractTableNumber(table.table_name, table.table_id),
    name: table.table_name,
    capacity: table.capacity,
    occupiedPeople: table.occupied_people,
    remainingCapacity: table.remaining_capacity,
    status: mapAvailabilityStatus(table.status),
  }));
}