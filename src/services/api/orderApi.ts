import { apiClient } from './client';

export type OrderItemPayload = {
  food_id: number;
  variant_id: number;
  qty: number;
  price: number;
  addonsid: string;
  addonsqty: string;
  itemnote: string;
  isgroup: number;
};

export type CreateOrderPayload = {
  ctypeid: number;
  customer_id: number;
  order_date: string;
  waiter_id: number;
  tableid: number;
  room_id: null;
  reservation_id: null;
  customernote: string;
  grandtotal: number;
  tablemember: number;
  items: OrderItemPayload[];
};

export type CreateOrderResponse = {
  status: string;
  orderid: number;
};

export async function createOrder(
  payload: CreateOrderPayload,
  token?: string
) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return apiClient.post<CreateOrderResponse>(
    '/api/order-create',
    payload,
    { headers }
  );
}