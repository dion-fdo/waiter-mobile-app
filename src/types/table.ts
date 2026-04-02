export type TableStatus = 'free' | 'partially_occupied' |'full';

export type RestaurantTable = {
  id: string;
  number: number;
  name?: string;
  capacity?: number;
  status: TableStatus;
};