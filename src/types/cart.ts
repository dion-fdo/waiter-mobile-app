export type CartItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  size?: string;
  addOns?: string[];
};