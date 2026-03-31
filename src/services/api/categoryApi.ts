import { apiClient } from './client';
import { Category } from '../../types/category';

type CategoriesResponse = {
  status: string;
  data: Array<{
    CategoryID: number;
    Name: string;
    CategoryImage: string | null;
    CategoryIsActive: number;
  }>;
};

export async function getCategories(token?: string): Promise<Category[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<CategoriesResponse>(
    '/api/categories',
    { headers }
  );

  return response.data
    .filter((category) => category.CategoryIsActive === 1)
    .map((category) => ({
      id: String(category.CategoryID),
      name: category.Name,
    }));
}