export type ItemSizeOption = string;

export type MenuVariant = {
  variantId: string;
  variantName: string;
  price: number;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  categoryName?: string;

  sizeOptions?: ItemSizeOption[];
  addOnOptions?: string[];
  allowMultipleAddOns?: boolean;

  variants?: MenuVariant[];
};