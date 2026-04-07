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
    order_id: number;
    saleinvoice: string;
    marge_order_id: number | null;
    customer_id: number | null;
    cutomertype: number;
    isthirdparty: number;
    thirdpartyinvoiceid: number;
    waiter_id: number;
    kitchen: string | null;
    order_date: string;
    order_time: string;
    cookedtime: string;
    table_no: number;
    room_id: number | null;
    reservation_id: number | null;
    tokenno: string;
    totalamount: string;
    customerpaid: string;
    customer_note: string;
    anyreason: string | null;
    order_status: number;
    notification: number;
    orderaccepteject: number | null;
    splitpay_status: number;
    isupdate: number | null;
    shipping_date: string;
    tokenprint: number;
    invoiceprint: number | null;
    happyhour_rate: string;
    happyhour_applied: number;
    stock_deducted: number;
    stock_deducted_at: string | null;
    customer_no: string;
    membership_type: number;
    customer_name: string;
    customer_email: string;
    password: string | null;
    customer_token: string;
    customer_address: string;
    customer_phone: string;
    customer_picture: string | null;
    favorite_delivery_address: string;
    cdate: string | null;
    is_active: number;
    tableid: number | null;
    tablename: string | null;
    person_capicity: number | null;
    table_icon: string | null;
    floor: number | null;
    status: number | null;
    items: OrderDetailsItemResponse[];
    bill: {
      bill_id: number;
      customer_id: number;
      order_id: number;
      room_id: number | null;
      reservation_id: number | null;
      total_amount: number;
      discount: number;
      service_charge: number;
      shipping_type: string | null;
      deliverydate: string | null;
      VAT: number;
      bill_amount: number;
      room_charge: string;
      bill_date: string;
      bill_time: string;
      create_at: string;
      bill_status: number;
      payment_method_id: number;
      create_by: number;
      create_date: string;
      update_by: number;
      update_date: string;
    };
    currency: {
      currencyid: number;
      currencyname: string;
      currencysymbol: string | null;
      curr_icon: string | null;
      position: number;
      curr_rate: string;
    };
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