import { MenuItem } from '../../types/menuItem';

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Chicken Burger',
    price: 1800,
    categoryId: '2',
    addOnOptions: ['Extra Cheese', 'Extra Sauce', 'No Onion'],
    allowMultipleAddOns: true,
  },
  {
    id: '2',
    name: 'Beef Burger',
    price: 2200,
    categoryId: '2',
    addOnOptions: ['Extra Cheese', 'Extra Sauce'],
    allowMultipleAddOns: true,
  },
  {
    id: '3',
    name: 'Veggie Pasta',
    price: 1600,
    categoryId: '2',
  },
  {
    id: '4',
    name: 'Seafood Pasta',
    price: 2500,
    categoryId: '5',
    sizeOptions: ['Regular', 'Large'],
  },
  {
    id: '5',
    name: 'Orange Juice',
    price: 700,
    categoryId: '3',
    sizeOptions: ['S', 'M', 'L'],
  },
  {
    id: '6',
    name: 'Chocolate Cake',
    price: 950,
    categoryId: '4',
    addOnOptions: ['Ice Cream'],
    allowMultipleAddOns: false,
  },
];