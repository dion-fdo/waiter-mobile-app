import { CartItem } from './cart';

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served' | 'pendingApproval';

export type Order = {
  id: string;
  tableNumber: number;
  waiterName: string;
  items: CartItem[];
  serviceCharge: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  date: string;
};