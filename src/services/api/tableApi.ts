import { apiClient } from './client';
import { RestaurantTable } from '../../types/table';

type TablesResponse = {
  status: string;
  data: Array<{
    tableid: number;
    tablename: string;
    person_capicity: number;
    table_icon: string;
    floor: number | null;
    status: number; // 1 = active, 0 = inactive
  }>;
};

function extractTableNumber(name: string, fallbackId: number): number {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : fallbackId;
}

export async function getTables(token?: string): Promise<RestaurantTable[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<TablesResponse>(
    '/api/tables',
    { headers }
  );

  return response.data
    .filter((table) => table.status === 1) // only active tables
    .map((table) => ({
      id: String(table.tableid),
      number: extractTableNumber(table.tablename, table.tableid),
      name: table.tablename,
      capacity: table.person_capicity,
      status: 'free', // temporary until occupancy endpoint is ready
    }));
}