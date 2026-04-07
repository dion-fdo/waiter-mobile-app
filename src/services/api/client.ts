const BASE_URL = 'https://cuisine.kernelencode.com';

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    let message = `Request failed with status ${response.status}`;

    try {
      const parsed = JSON.parse(errorText);
      message =
        parsed.message ||
        parsed.error ||
        JSON.stringify(parsed);
    } catch {
      message = errorText.includes('<!DOCTYPE html>')
        ? `Server returned HTML instead of JSON. Status: ${response.status}`
        : errorText;
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(text) as T;
  }

  return text as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};