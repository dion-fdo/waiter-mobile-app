export type MenuVariant = {
  variantId: string;
  variantName: string;
  price: number;
};

export type MenuAddOn = {
  addOnId: string;
  addOnName: string;
  price: number;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  categoryName?: string;
  component?: string;
  itemNotes?: string;
  variants?: MenuVariant[];
  addOns?: MenuAddOn[];
};