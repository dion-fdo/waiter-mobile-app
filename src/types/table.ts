export type TableStatus = 'free' | 'booked';

export type RestaurantTable = {
  id: string;
  number: number;
  status: TableStatus;
  bookingSlot?: string;
};