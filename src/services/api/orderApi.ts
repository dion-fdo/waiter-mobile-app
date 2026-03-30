import { apiClient } from './client';

export type PlaceOrderItemPayload = {
  menuItemId: string;
  qty: number;
  size?: string;
  addOns?: string[];
};

export type PlaceOrderPayload = {
  tableId: string;
  waiterId: string;
  items: PlaceOrderItemPayload[];
};

export async function placeOrder(payload: PlaceOrderPayload) {
  return apiClient.post('/orders', payload);
}