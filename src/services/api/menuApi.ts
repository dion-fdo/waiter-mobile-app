import { apiClient } from './client';
import { Category } from '../../types/category';
import { MenuItem } from '../../types/menuItem';

export async function getCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>('/categories');
}

export async function getMenuItems(): Promise<MenuItem[]> {
  return apiClient.get<MenuItem[]>('/menu-items');
}