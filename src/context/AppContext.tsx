import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Waiter } from '../types/waiter';
import { RestaurantTable } from '../types/table';
import { CartItem, SelectedAddOn } from '../types/cart';
import { MenuItem } from '../types/menuItem';
import { getM2MToken } from '../services/api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../types/customer';
import { createOrder, updateOrder, OrderDetailsResponse} from '../services/api/orderApi';


type ItemSize = string;

const M2M_CLIENT_ID = '019d4274-4a0a-71b5-a30b-15cbe9d9c522';
const M2M_CLIENT_SECRET = '1jvKvb6WLlaSHTy4odfHTtsjA5tIlpjWKukKaBBP';

const ORDER_DRAFT_STORAGE_KEY = 'waiter_app_table_order_draft';

type AddToCartInput = {
  menuItem: MenuItem;
  qty: number;
  variantId?: string;
  variantName?: string;
  selectedAddOns?: SelectedAddOn[];
  note?: string;
};

type TableOrderDraft = {
  table: RestaurantTable;
  cartItems: CartItem[];
  selectedCustomer: Customer | null;
  selectedPersonCount: number;
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
  customerId?: number | null;
};


type AppContextType = {
  selectedWaiter: Waiter | null;
  selectedTable: RestaurantTable | null;
  
  authToken: string | null;
  setAuthToken: (token: string | null) => void;

  tokenExpiryTime: number | null;
  setTokenExpiryTime: (time: number | null) => void;
  ensureValidToken: () => Promise<string | null>;

  logout: () => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  selectedPersonCount: number;
  setSelectedPersonCount: React.Dispatch<React.SetStateAction<number>>;

  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;

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

  placeOrder: () => Promise<boolean>;

  startEditPlacedOrder: () => void;
  updateEditOrderItemQty: (id: string, type: 'inc' | 'dec') => void;
  removeEditOrderItem: (id: string) => void;
  confirmEditPlacedOrder: () => Promise<boolean>;
  cancelEditPlacedOrder: () => void;

  editSubtotal: number;
  editTotal: number;

  isEditingPlacedOrder: boolean;
  setIsEditingPlacedOrder: (value: boolean) => void;

  startEditBackendOrder: (
    orderData: OrderDetailsResponse['data'],
    table?: RestaurantTable | null
  ) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function buildCartItemId(
  menuItemId: string,
  variantId?: string,
  selectedAddOns?: SelectedAddOn[],
  note?: string
) {
  const normalizedAddOns = [...(selectedAddOns ?? [])]
    .map((item) => `${item.addOnId}:${item.qty}`)
    .sort()
    .join('|');

  return `${menuItemId}__${variantId ?? 'NA'}__${normalizedAddOns}__${note ?? ''}`;
}

function cloneCartItems(items: CartItem[]) {
  return items.map((item) => ({
    ...item,
    selectedAddOns: item.selectedAddOns
      ? item.selectedAddOns.map((addOn) => ({ ...addOn }))
      : [],
  }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonCount, setSelectedPersonCount] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [editOrderItems, setEditOrderItems] = useState<CartItem[]>([]);
  const [isEditingPlacedOrder, setIsEditingPlacedOrder] = useState(false);

  const [serviceCharge, setServiceCharge] = useState(0);

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
        setSelectedCustomer(tableDraft.selectedCustomer ?? null);
        setSelectedPersonCount(tableDraft.selectedPersonCount ?? 1);
      } else {
        setCartItems([]);
        setSelectedCustomer(null);
        setSelectedPersonCount(1);
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

        drafts[selectedTable.id] = {
        table: selectedTable,
        cartItems,
        selectedCustomer,
        selectedPersonCount,
      };

        await saveAllTableDraftsToStorage(drafts);
      } catch (error) {
        console.log('Failed to save current table draft', error);
      }
    };

    saveCurrentTableDraft();
  }, [selectedTable, cartItems, selectedCustomer, selectedPersonCount]);

  const ensureValidToken = async () => {
    if (authToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 30000) {
      return authToken;
    }

    return await fetchM2MToken();
  }; 

  const addToCart = ({
    menuItem,
    qty,
    variantId,
    variantName,
    selectedAddOns = [],
    note = '',
  }: AddToCartInput) => {
    const cartItemId = buildCartItemId(
      menuItem.id,
      variantId,
      selectedAddOns,
      note
    );

    const targetSetter = isEditingPlacedOrder
      ? setEditOrderItems
      : setCartItems;

    targetSetter((prev) => {
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
          menuId: menuItem.id,
          name: menuItem.name,
          qty,
          price: menuItem.price,
          variantId,
          variantName,
          selectedAddOns,
          note,
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
    setSelectedPersonCount(1);
    setSelectedCustomer(null);
    setCartItems([]);
    setPlacedOrder(null);
    setEditOrderItems([]);
    setIsEditingPlacedOrder(false);
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

  const placeOrder = async (): Promise<boolean> => {
    try {
      if (!selectedTable) {
        throw new Error('Table not selected');
      }

      if (!selectedWaiter?.waiterId) {
        throw new Error('Waiter not selected');
      }

      if (!selectedCustomer?.id) {
        throw new Error('Customer not selected');
      }

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const token = await ensureValidToken();
      const today = new Date().toISOString().split('T')[0];

      const payload = {
        ctypeid: 1,
        customer_id: Number(selectedCustomer.id),
        order_date: today,
        waiter_id: Number(selectedWaiter.waiterId),
        tableid: Number(selectedTable.id),
        room_id: null,
        reservation_id: null,
        customernote: '',
        grandtotal: subtotal,
        tablemember: selectedPersonCount,
        items: cartItems.map((item) => ({
          food_id: Number(item.menuId),
          variant_id: Number(item.variantId),
          qty: item.qty,
          price: item.price,
          addonsid:
            item.selectedAddOns?.map((addOn) => addOn.addOnId).join(',') ?? '',
          addonsqty:
            item.selectedAddOns?.map((addOn) => String(addOn.qty)).join(',') ?? '',
          itemnote: item.note ?? '',
          isgroup: 0,
        })),
      };

      const response = await createOrder(payload, token || undefined);

      const snapshotItems = cloneCartItems(cartItems);

      setPlacedOrder({
        id: String(response.orderid),
        table: selectedTable,
        waiter: selectedWaiter,
        items: snapshotItems,
        subtotal,
        serviceCharge: 0,
        total: subtotal,
        customerId: Number(selectedCustomer.id),
      });

      await clearDraftForTable(selectedTable.id);
      setCartItems([]);

      return true;
    } catch (error) {
      console.error('placeOrder failed', error);
      return false;
    }
  };

  const startEditPlacedOrder = () => {
    if (!placedOrder) {
      setEditOrderItems([]);
      return;
    }

    setIsEditingPlacedOrder(true);
    setEditOrderItems(cloneCartItems(placedOrder.items));
  };

  const startEditBackendOrder = (
    orderData: OrderDetailsResponse['data'],
    table?: RestaurantTable | null
  ) => {
    const mappedItems: CartItem[] = (orderData.itemsinfo ?? []).map((item) => ({
      id: String(item.row_id),
      menuId: String(item.menu_id),
      name: item.food_name || item.ProductName || 'Unnamed Item',
      qty: item.menuqty ?? 0,
      price: Number(item.menuprice ?? item.price ?? 0),
      variantId: item.variantid != null ? String(item.variantid) : undefined,
      variantName: item.variantName ?? undefined,
      selectedAddOns: [],
      note: item.itemnote ?? '',
    }));

    const nextSubtotal = mappedItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    const nextPlacedOrder: PlacedOrder = {
      id: String(orderData.orderinfo.order_id),
      table: table ?? selectedTable ?? null,
      waiter: selectedWaiter,
      items: mappedItems,
      subtotal: nextSubtotal,
      serviceCharge: 0,
      total: nextSubtotal,
      customerId: orderData.orderinfo.customer_id ?? null,
    };

    setPlacedOrder(nextPlacedOrder);
    setEditOrderItems(cloneCartItems(mappedItems));
    setIsEditingPlacedOrder(true);
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

  const confirmEditPlacedOrder = async (): Promise<boolean> => {
    try {
      if (!placedOrder) {
        throw new Error('No placed order found');
      }

      if (!selectedTable) {
        throw new Error('Table not selected');
      }

      if (!selectedWaiter?.waiterId) {
        throw new Error('Waiter not selected');
      }

      const effectiveCustomerId =
        selectedCustomer?.id != null
          ? Number(selectedCustomer.id)
          : placedOrder?.customerId ?? null;

      if (effectiveCustomerId == null) {
        throw new Error('Customer not selected');
      }

      if (editOrderItems.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      const token = await ensureValidToken();
      const today = new Date().toISOString().split('T')[0];

      const nextSubtotal = editOrderItems.reduce(
        (sum, item) => sum + item.qty * item.price,
        0
      );

      const payload = {
        ctypeid: 1,
        customer_id: effectiveCustomerId,
        order_date: today,
        waiter_id: Number(selectedWaiter.waiterId),
        tableid: Number(selectedTable.id),
        room_id: null,
        reservation_id: null,
        customernote: '',
        grandtotal: nextSubtotal,
        tablemember: selectedPersonCount,
        items: editOrderItems.map((item) => ({
          food_id: Number(item.menuId),
          variant_id: Number(item.variantId ?? 0),
          qty: item.qty,
          price: item.price,
          addonsid:
            item.selectedAddOns?.map((addOn) => addOn.addOnId).join(',') ?? '',
          addonsqty:
            item.selectedAddOns?.map((addOn) => String(addOn.qty)).join(',') ?? '',
          itemnote: item.note ?? '',
          isgroup: 0,
        })),
      };

      await updateOrder(
        Number(placedOrder.id),
        payload,
        token || undefined
      );

      setPlacedOrder({
        ...placedOrder,
        items: cloneCartItems(editOrderItems),
        subtotal: nextSubtotal,
        serviceCharge,
        total: nextSubtotal + serviceCharge,
      });

      setIsEditingPlacedOrder(false);
      setEditOrderItems([]);

      return true;
    } catch (error) {
      console.error('confirmEditPlacedOrder failed', error);
      return false;
    }
  };

  const cancelEditPlacedOrder = () => {
    setEditOrderItems([]);
    setIsEditingPlacedOrder(false);
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

      selectedPersonCount,
      setSelectedPersonCount,

      selectedCustomer,
      setSelectedCustomer,

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
      startEditBackendOrder,
      updateEditOrderItemQty,
      removeEditOrderItem,
      confirmEditPlacedOrder,
      cancelEditPlacedOrder,
      editSubtotal,
      editTotal,

      isEditingPlacedOrder,
      setIsEditingPlacedOrder,
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
      selectedPersonCount,
      selectedCustomer,
      cartItems,
      subtotal,
      serviceCharge,
      total,
      placedOrder,
      editOrderItems,
      editSubtotal,
      editTotal,

      isEditingPlacedOrder,
      startEditBackendOrder,
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