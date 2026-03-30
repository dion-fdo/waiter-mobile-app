import { Order } from '../../types/order';
import { cartItems } from './cartItems';

const subtotal = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);
const serviceCharge = 300;

export const currentOrder: Order = {
  id: 'ORD-1001',
  tableNumber: 5,
  waiterName: 'Waiter 01',
  items: cartItems,
  serviceCharge,
  subtotal,
  total: subtotal + serviceCharge,
  status: 'placed',
  date: '2026-03-26',
};