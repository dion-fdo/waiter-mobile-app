import { apiClient } from './client';
import { MenuItem } from '../../types/menuItem';

type FoodByCategoryResponse = {
  status: string;
  data: Array<{
    id: number;
    name: string;
    category_name: string;
    variant: Array<{
      menuid: number;
      variantid: number;
      variantName: string;
      price: string;
    }>;
  }>;
};

export async function getFoodsByCategory(
  categoryId: string,
  token?: string
): Promise<MenuItem[]> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await apiClient.get<FoodByCategoryResponse>(
    `/api/foodslist-by-category?category_id=${categoryId}`,
    { headers }
  );

  return response.data.map((item) => {
    const mappedVariants = item.variant.map((variant) => ({
      variantId: String(variant.variantid),
      variantName: variant.variantName,
      price: Number(variant.price),
    }));

    return {
      id: String(item.id),
      name: item.name,
      categoryName: item.category_name,
      price: mappedVariants[0]?.price ?? 0,
      sizeOptions: mappedVariants.map((variant) => variant.variantName),
      variants: mappedVariants,
      addOnOptions: [],
      allowMultipleAddOns: false,
    };
  });
}