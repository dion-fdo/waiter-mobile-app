import React, { createContext, useContext, useMemo, useState } from 'react';
import { Waiter } from '../types/waiter';
import { RestaurantTable } from '../types/table';
import { CartItem } from '../types/cart';
import { MenuItem } from '../types/menuItem';

type ItemSize = string;

type AddToCartInput = {
  menuItem: MenuItem;
  qty: number;
  size?: ItemSize;
  addOns?: string[];
};

type PlacedOrder = {
  id: string;
  table: RestaurantTable | null;
  waiter: Waiter | null;
  items: CartItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
};

type AppContextType = {
  selectedWaiter: Waiter | null;
  selectedTable: RestaurantTable | null;
  //
  authToken: string | null;
  setAuthToken: (token: string | null) => void;

  cartItems: CartItem[];
  serviceCharge: number;
  subtotal: number;
  total: number;

  placedOrder: PlacedOrder | null;
  editOrderItems: CartItem[];

  setSelectedWaiter: (waiter: Waiter | null) => void;
  setSelectedTable: (table: RestaurantTable | null) => void;
  startNewOrderSession: (table: RestaurantTable) => void;

  addToCart: (input: AddToCartInput) => void;
  updateCartItemQty: (id: string, type: 'inc' | 'dec') => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;

  placeOrder: () => void;

  startEditPlacedOrder: () => void;
  updateEditOrderItemQty: (id: string, type: 'inc' | 'dec') => void;
  removeEditOrderItem: (id: string) => void;
  confirmEditPlacedOrder: () => void;
  cancelEditPlacedOrder: () => void;

  editSubtotal: number;
  editTotal: number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const SERVICE_CHARGE = 300;

function buildCartItemId(menuItemId: string, size?: ItemSize, addOns?: string[]) {
  const normalizedAddOns = [...(addOns ?? [])].sort().join('|');
  return `${menuItemId}__${size ?? 'NA'}__${normalizedAddOns}`;
}

function cloneCartItems(items: CartItem[]) {
  return items.map((item) => ({
    ...item,
    addOns: item.addOns ? [...item.addOns] : [],
  }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [editOrderItems, setEditOrderItems] = useState<CartItem[]>([]);

  const addToCart = ({ menuItem, qty, size, addOns = [] }: AddToCartInput) => {
    const cartItemId = buildCartItemId(menuItem.id, size, addOns);

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === cartItemId);

      if (existingItem) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, qty: item.qty + qty } : item
        );
      }

      return [
        ...prev,
        {
          id: cartItemId,
          name: menuItem.name,
          qty,
          price: menuItem.price,
          size,
          addOns,
        },
      ];
    });
  };

  const updateCartItemQty = (id: string, type: 'inc' | 'dec') => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQty = type === 'inc' ? item.qty + 1 : item.qty - 1;
          return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [cartItems]
  );

  const total = subtotal + SERVICE_CHARGE;

  const startNewOrderSession = (table: RestaurantTable) => {
    setSelectedTable(table);
    setCartItems([]);
    setPlacedOrder(null);
    setEditOrderItems([]);
  };

  const placeOrder = () => {
    const snapshotItems = cloneCartItems(cartItems);

    setPlacedOrder({
      id: `TEMP-ORDER-${Date.now()}`,
      table: selectedTable,
      waiter: selectedWaiter,
      items: snapshotItems,
      subtotal,
      serviceCharge: SERVICE_CHARGE,
      total,
    });
  };

  const startEditPlacedOrder = () => {
    if (!placedOrder) {
      setEditOrderItems([]);
      return;
    }

    setEditOrderItems(cloneCartItems(placedOrder.items));
  };

  const updateEditOrderItemQty = (id: string, type: 'inc' | 'dec') => {
    setEditOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQty = type === 'inc' ? item.qty + 1 : item.qty - 1;
          return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeEditOrderItem = (id: string) => {
    setEditOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const confirmEditPlacedOrder = () => {
    if (!placedOrder) return;

    const nextSubtotal = editOrderItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    setPlacedOrder({
      ...placedOrder,
      items: cloneCartItems(editOrderItems),
      subtotal: nextSubtotal,
      serviceCharge: SERVICE_CHARGE,
      total: nextSubtotal + SERVICE_CHARGE,
    });
  };

  const cancelEditPlacedOrder = () => {
    setEditOrderItems([]);
  };

  const editSubtotal = useMemo(
    () => editOrderItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [editOrderItems]
  );

  const editTotal = editSubtotal + SERVICE_CHARGE;

  const value = useMemo(
    () => ({
      selectedWaiter,
      selectedTable,
      authToken,
      cartItems,
      serviceCharge: SERVICE_CHARGE,
      subtotal,
      total,
      placedOrder,
      editOrderItems,
      setSelectedWaiter,
      setSelectedTable,
      startNewOrderSession,
      setAuthToken,
      addToCart,
      updateCartItemQty,
      removeCartItem,
      clearCart,
      placeOrder,
      startEditPlacedOrder,
      updateEditOrderItemQty,
      removeEditOrderItem,
      confirmEditPlacedOrder,
      cancelEditPlacedOrder,
      editSubtotal,
      editTotal,
    }),
    [
      selectedWaiter,
      selectedTable,
      authToken,
      cartItems,
      subtotal,
      total,
      placedOrder,
      editOrderItems,
      editSubtotal,
      editTotal,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
}