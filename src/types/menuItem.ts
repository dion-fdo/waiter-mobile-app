export type ItemSizeOption = 'S' | 'M' | 'L' | 'Regular' | 'Large';

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId?: string;

  sizeOptions?: ItemSizeOption[];
  addOnOptions?: string[];
  allowMultipleAddOns?: boolean;
};