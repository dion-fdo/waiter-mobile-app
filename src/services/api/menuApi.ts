import { apiClient } from './client';
import { MenuItem } from '../../types/menuItem';

type BackendVariant = {
  variantid?: number;
  variant_id?: number;
  variantName?: string;
  variant_name?: string;
  price: string | number;
};

type BackendAddOn = {
  menu_id?: number;
  add_on_id?: number;
  addon_id?: number;
  addonid?: number;
  add_on_name?: string;
  addon_name?: string;
  price: string | number;
};

type BackendFoodItem = {
  id: number;
  name: string;
  product_image?: string;
  category_id?: number;
  category_name?: string;
  component?: string;
  itemnotes?: string;
  variant?: BackendVariant[];
  addon?: BackendAddOn[];
};

type FoodsResponse = {
  status: string;
  data: BackendFoodItem[];
};

type SearchResponse = {
  status: string;
  data?: BackendFoodItem[];
  foods?: BackendFoodItem[];
};

function mapFoodItem(item: BackendFoodItem): MenuItem {

  const variants =
    item.variant?.map((variant) => ({
      variantId: String(variant.variantid ?? variant.variant_id ?? ''),
      variantName: variant.variantName ?? variant.variant_name ?? 'Regular',
      price: Number(variant.price),
    })) ?? [];

  const addOns =
    item.addon?.map((addon) => ({
      addOnId: String(addon.addonid ?? addon.add_on_id ?? addon.addon_id ?? ''),
      addOnName: addon.add_on_name ?? addon.addon_name ?? 'Add-on',
      price: Number(addon.price),
    })) ?? [];

  return {
    id: String(item.id),
    name: item.name,
    image: item.product_image
      ? encodeURI(`https://cuisine.kernelencode.com/${item.product_image}`)
      : undefined,
    categoryId: item.category_id ? String(item.category_id) : undefined,
    categoryName: item.category_name,
    component: item.component,
    itemNotes: item.itemnotes,
    price: variants[0]?.price ?? 0,
    variants,
    addOns,
  };
}

export async function getFoodsByCategory(
  categoryId: string,
  token?: string
): Promise<MenuItem[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<FoodsResponse>(
    `/api/foodslist-by-category?category_id=${categoryId}`,
    { headers }
  );

  return response.data.map(mapFoodItem);
}

export async function searchFoods(
  keyword: string,
  token?: string
): Promise<MenuItem[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<SearchResponse>(
    `/api/foods/search?keyword=${encodeURIComponent(keyword)}`,
    { headers }
  );

  const items = response.data ?? response.foods ?? [];
  return items.map(mapFoodItem);
}