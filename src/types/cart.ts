export type SelectedAddOn = {
  addOnId: string;
  addOnName: string;
  price: number;
  qty: number;
};

export type CartItem = {
  id: string;

  menuId: string;
  name: string;

  qty: number;
  price: number;

  variantId?: string;
  variantName?: string;

  selectedAddOns?: SelectedAddOn[];
  note?: string;
};