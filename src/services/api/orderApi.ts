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

export async function deleteOrder(
  orderId: number,
  token?: string
) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return apiClient.delete(
    `/api/orders/${orderId}`,
    { headers }
  );
}

export type OrderDetailsItemResponse = {
  row_id: number;
  order_id: number;
  menu_id: number;
  price: string;
  groupmid: number | null;
  notes: string;
  menutyt: number;
  add_on_id: string;
  addonsqty: string;
  variantid: number | null;
  groupvarient: number | null;
  addonsuid: number | null;
  menuqty: number;
  qroupqty: number | null;
  isgroup: number;
  food_status: number;
  item_stock_deducted: number;
  addon_stock_deducted: number;
  stock_deducted_at: string | null;
  allfoodready: number | null;
  isupdate: number | null;
  menuprice: string;
  itemnote: string;
  ProductName: string;
  food_name: string;
  variantName: string | null;
};

export type OrderDetailsResponse = {
  status: string;
  data: {
    orderinfo: {
      order_id: number;
      customer_id: number | null;
      status: number;
    };
    itemsinfo: OrderDetailsItemResponse[];
  };
};

export async function getOrderDetails(
  orderId: number,
  token?: string
) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return apiClient.get<OrderDetailsResponse>(
    `/api/order_details/${orderId}`,
    { headers }
  );
}

export type UpdateOrderItemPayload = {
  food_id: number;
  variant_id: number;
  qty: number;
  price: number;
  addonsid: string;
  addonsqty: string;
  itemnote: string;
  isgroup: number;
};

export type UpdateOrderPayload = {
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
  items: UpdateOrderItemPayload[];
};

export async function updateOrder(
  orderId: number,
  payload: UpdateOrderPayload,
  token?: string
) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return apiClient.put(
    `/api/orders/${orderId}`,
    payload,
    { headers }
  );
}

export type ActiveTableOrderResponse = {
  status: string;
  data: {
    order_id: number;
    order_status: number;
  }[];
};

export async function getActiveOrdersByTable(
  tableId: number,
  token?: string
) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return apiClient.get<ActiveTableOrderResponse>(
    `/api/order_details/table/${tableId}`,
    { headers }
  );
}