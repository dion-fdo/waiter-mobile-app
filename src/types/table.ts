export type TableStatus = 'free' | 'booked';

export type RestaurantTable = {
  id: string;
  number: number;
  name?: string;
  capacity?: number;
  status: TableStatus;
  bookingSlot?: string;
};