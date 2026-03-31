import { apiClient } from './client';
import { Customer } from '../../types/customer';

type CustomersResponse = {
  status: string;
  data: Array<{
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    membership_name: string | null;
  }>;
};

type AddCustomerRequest = {
  customer_name: string;
  customer_phone: string;
};

type AddCustomerResponse = {
  status: string;
  message: string;
  customer_id: number;
};

export async function getCustomers(
  token?: string,
  params?: {
    customer_name?: string;
    customer_phone?: string;
  }
): Promise<Customer[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const query = new URLSearchParams();

  if (params?.customer_name?.trim()) {
    query.append('customer_name', params.customer_name.trim());
  }

  if (params?.customer_phone?.trim()) {
    query.append('customer_phone', params.customer_phone.trim());
  }

  const queryString = query.toString();
  const endpoint = queryString
    ? `/api/customers?${queryString}`
    : '/api/customers';

  const response = await apiClient.get<CustomersResponse>(endpoint, { headers });

  return response.data.map((customer) => ({
    id: String(customer.customer_id),
    name: customer.customer_name,
    phone: customer.customer_phone,
    membershipName: customer.membership_name,
  }));
}

export async function addCustomer(
  payload: AddCustomerRequest,
  token?: string
): Promise<AddCustomerResponse> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return apiClient.post<AddCustomerResponse>(
    '/api/add-customers',
    payload,
    { headers }
  );
}