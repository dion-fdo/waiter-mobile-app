import { CartItem } from '../../types/cart';

export const cartItems: CartItem[] = [
  { id: '1', name: 'Chicken Burger', qty: 2, price: 1800, size: 'M', addOns: ['Extra Cheese'] },
  { id: '2', name: 'Orange Juice', qty: 1, price: 700, size: 'L', addOns: [] },
  { id: '3', name: 'Chocolate Cake', qty: 1, price: 950, addOns: [] },
];