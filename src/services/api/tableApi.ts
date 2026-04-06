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

type TablesResponse = {
  status: string;
  data: Array<{
    tableid: number;
    tablename: string;
    person_capicity: number;
    table_icon: string;
    floor: number | null;
    status: 0 | 1;
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

  const [availabilityResponse, tablesResponse] = await Promise.all([
    apiClient.get<TableAvailabilityResponse>('/api/table-availability', { headers }),
    apiClient.get<TablesResponse>('/api/tables', { headers }),
  ]);

  const activeTableIds = new Set(
    tablesResponse.data
      .filter((table) => table.status !== 0)
      .map((table) => table.tableid)
  );

  return availabilityResponse.data
    .filter((table) => activeTableIds.has(table.table_id))
    .map((table) => ({
      id: String(table.table_id),
      number: extractTableNumber(table.table_name, table.table_id),
      name: table.table_name,
      capacity: table.capacity,
      occupiedPeople: table.occupied_people,
      remainingCapacity: table.remaining_capacity,
      status: mapAvailabilityStatus(table.status),
    }));
}
