import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Waiter } from '../types/waiter';
import { RestaurantTable } from '../types/table';
import { CartItem } from '../types/cart';
import { MenuItem } from '../types/menuItem';
import { getM2MToken } from '../services/api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';


type ItemSize = string;

const M2M_CLIENT_ID = '019d4274-4a0a-71b5-a30b-15cbe9d9c522';
const M2M_CLIENT_SECRET = '1jvKvb6WLlaSHTy4odfHTtsjA5tIlpjWKukKaBBP';

const ORDER_DRAFT_STORAGE_KEY = 'waiter_app_table_order_draft';

type AddToCartInput = {
  menuItem: MenuItem;
  qty: number;
  size?: ItemSize;
  addOns?: string[];
};

type TableOrderDraft = {
  table: RestaurantTable;
  cartItems: CartItem[];
};

type TableOrderDraftMap = Record<string, TableOrderDraft>;

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

  tokenExpiryTime: number | null;
  setTokenExpiryTime: (time: number | null) => void;
  ensureValidToken: () => Promise<string | null>;

  logout: () => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  cartItems: CartItem[];
  
  serviceCharge: number;
  setServiceCharge: (amount: number) => void;
  
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
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [editOrderItems, setEditOrderItems] = useState<CartItem[]>([]);

  const [serviceCharge, setServiceCharge] = useState(300);

  const fetchM2MToken = async () => {
  const response = await getM2MToken({
      client_id: M2M_CLIENT_ID,
      client_secret: M2M_CLIENT_SECRET,
    });

    const expiryTime = Date.now() + response.expires_in * 1000;

    setAuthToken(response.access_token);
    setTokenExpiryTime(expiryTime);

    return response.access_token;
  };

  const getAllTableDraftsFromStorage = async (): Promise<TableOrderDraftMap> => {
    try {
      const raw = await AsyncStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as TableOrderDraftMap;
    } catch (error) {
      console.log('Failed to read table drafts', error);
      return {};
    }
  };

  const saveAllTableDraftsToStorage = async (drafts: TableOrderDraftMap) => {
    try {
      await AsyncStorage.setItem(
        ORDER_DRAFT_STORAGE_KEY,
        JSON.stringify(drafts)
      );
    } catch (error) {
      console.log('Failed to save table drafts', error);
    }
  };

  const clearAllTableDraftsFromStorage = async () => {
    try {
      await AsyncStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    } catch (error) {
      console.log('Failed to clear all table drafts', error);
    }
  };

  const loadDraftForTable = async (table: RestaurantTable) => {
    try {
      const drafts = await getAllTableDraftsFromStorage();
      const tableDraft = drafts[table.id];

      if (tableDraft) {
        setCartItems(tableDraft.cartItems ?? []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.log('Failed to load draft for table', error);
      setCartItems([]);
    }
  };

  const clearDraftForTable = async (tableId: string) => {
    try {
      const drafts = await getAllTableDraftsFromStorage();
      delete drafts[tableId];
      await saveAllTableDraftsToStorage(drafts);
    } catch (error) {
      console.log('Failed to clear draft for table', error);
    }
  };

  useEffect(() => {
    const saveCurrentTableDraft = async () => {
      if (!selectedTable) return;

      try {
        const drafts = await getAllTableDraftsFromStorage();

        if (cartItems.length === 0) {
          delete drafts[selectedTable.id];
        } else {
          drafts[selectedTable.id] = {
            table: selectedTable,
            cartItems,
          };
        }

        await saveAllTableDraftsToStorage(drafts);
      } catch (error) {
        console.log('Failed to save current table draft', error);
      }
    };

    saveCurrentTableDraft();
  }, [selectedTable, cartItems]);

  const ensureValidToken = async () => {
    if (authToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 30000) {
      return authToken;
    }

    return await fetchM2MToken();
  }; 

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

  const logout = () => {
    setSelectedWaiter(null);
    setSelectedTable(null);
    setAuthToken(null);
    setTokenExpiryTime(null);
    setCartItems([]);
    setPlacedOrder(null);
    setEditOrderItems([]);
    clearAllTableDraftsFromStorage();
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [cartItems]
  );

  const total = subtotal + serviceCharge;

  const startNewOrderSession = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setPlacedOrder(null);
    setEditOrderItems([]);
    await loadDraftForTable(table);
  };

  const placeOrder = () => {
    const snapshotItems = cloneCartItems(cartItems);

    setPlacedOrder({
      id: `TEMP-ORDER-${Date.now()}`,
      table: selectedTable,
      waiter: selectedWaiter,
      items: snapshotItems,
      subtotal,
      serviceCharge,
      total,
    });

    if (selectedTable) {
      clearDraftForTable(selectedTable.id);
    }
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
      serviceCharge,
      total: nextSubtotal + serviceCharge,
    });
  };

  const cancelEditPlacedOrder = () => {
    setEditOrderItems([]);
  };

  const editSubtotal = useMemo(
    () => editOrderItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [editOrderItems]
  );

  const editTotal = editSubtotal + serviceCharge;

  const value = useMemo(
    () => ({
      selectedWaiter,
      selectedTable,
      authToken,

      tokenExpiryTime,
      setTokenExpiryTime,
      ensureValidToken,

      isLoading,
      setIsLoading,

      logout,

      cartItems,
      serviceCharge,
      subtotal,

      setServiceCharge,

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
      tokenExpiryTime,
      setTokenExpiryTime,
      ensureValidToken,
      logout,
      isLoading,
      cartItems,
      subtotal,
      serviceCharge,
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