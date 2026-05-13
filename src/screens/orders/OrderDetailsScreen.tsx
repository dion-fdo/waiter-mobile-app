import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { deleteOrder, getOrderDetails } from '../../services/api/orderApi';

import { searchFoods } from '../../services/api/menuApi';
import { MenuItem } from '../../types/menuItem';

import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen({ navigation, route }: Props) {
  const routeOrderId = route.params?.orderId;
  const routeTableName = route.params?.tableName;

  const {
    placedOrder,
    selectedTable,
    selectedWaiter,
    ensureValidToken,
    startEditPlacedOrder,
    startEditBackendOrder,
  } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [foodCatalog, setFoodCatalog] = useState<MenuItem[]>([]);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);

  const deleteSheetTranslateY = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (deleteSheetVisible) {
      deleteSheetTranslateY.setValue(320);
      Animated.timing(deleteSheetTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [deleteSheetVisible, deleteSheetTranslateY]);

  const closeDeleteSheet = () => {
    Animated.timing(deleteSheetTranslateY, {
      toValue: 320,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDeleteSheetVisible(false);
    });
  };

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);

      const orderId =
        routeOrderId ??
        (placedOrder?.id ? Number(placedOrder.id) : undefined);

      if (!orderId) {
        setLoading(false);
        return;
      }

      const token = await ensureValidToken();
      const response = await getOrderDetails(orderId, token || undefined);

      const details = response.data;

      if (details.orderinfo.order_source !== 'WAITER_APP') {
        Alert.alert(
          'Access denied',
          'This order cannot be viewed or edited from the waiter app.'
        );

        navigation.goBack();
        return;
      }

      setOrderDetails(details);

      const foods = await searchFoods(
        '',
        token || undefined,
        selectedWaiter?.branchId
      );
      setFoodCatalog(foods);
    } catch (error) {
      console.error('Failed to load order details', error);
    } finally {
      setLoading(false);
    }
  }, [routeOrderId, placedOrder?.id, ensureValidToken, selectedWaiter?.branchId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();

      const interval = setInterval(() => {
        fetchOrderDetails();
      }, 1500);

      return () => clearInterval(interval);
    }, [fetchOrderDetails])
  );

  const formattedItems = useMemo(() => {
    if (orderDetails?.itemsinfo) {
      return orderDetails.itemsinfo;
    }

    return placedOrder?.items ?? [];
  }, [orderDetails, placedOrder]);

  const findFoodFromCatalog = (menuId: number) => {
    return foodCatalog.find((food) => Number(food.id) === Number(menuId));
  };

  const getBasePriceFromCatalog = (item: any) => {
    const food = findFoodFromCatalog(item.menu_id ?? item.menuId);

    const variantId = item.varientid ?? item.variantid ?? item.variantId;

    const matchedVariant = food?.variants?.find(
      (variant) => Number(variant.variantId) === Number(variantId)
    );

    if (matchedVariant) {
      return matchedVariant.price;
    }

    return Number(item.price ?? item.menuprice ?? 0);
  };

  const getAddOnsFromCatalog = (item: any) => {
    const food = findFoodFromCatalog(item.menu_id ?? item.menuId);

    if (!food?.addOns || !item.add_on_id) {
      return [];
    }

    const addonIds = String(item.add_on_id)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const addonQtys = String(item.addonsqty ?? '')
      .split(',')
      .map((qty) => Number(qty.trim() || 1));

    return addonIds
      .map((addonId, index) => {
        const matchedAddon = food.addOns?.find(
          (addon) => Number(addon.addOnId) === Number(addonId)
        );

        if (!matchedAddon) return null;

        const itemQty = item.menuqty ?? item.qty ?? 1;
        const qty = addonQtys[index] || itemQty;

        return {
          ...matchedAddon,
          qty,
          total: matchedAddon.price * qty,
        };
      })
      .filter(Boolean);
  };

  const subtotal = useMemo(() => {
    return formattedItems.reduce((sum: number, item: any) => {
      const qty = item.menuqty ?? item.qty ?? 1;
      const basePrice = getBasePriceFromCatalog(item);

      const addOnsTotal = getAddOnsFromCatalog(item).reduce(
        (addOnSum: number, addon: any) =>
          addOnSum + Number(addon.total ?? 0),
        0
      );

      return sum + qty * basePrice + addOnsTotal;
    }, 0);
  }, [formattedItems, foodCatalog]);

  const serviceCharge = 0;
  const total = subtotal + serviceCharge;

  const orderInfo = orderDetails?.orderinfo as any;

  const orderTableNo =
    orderInfo?.table_no ??
    orderInfo?.tableid ??
    orderInfo?.table_id ??
    orderInfo?.tableId ??
    orderInfo?.table_number ??
    null;

  const tableDisplay =
    routeTableName ??
    (orderTableNo != null
      ? `Table ${orderTableNo}`
      : selectedTable?.name ??
        (selectedTable?.number ? `Table ${selectedTable.number}` : '--'));

  const orderWaiterId =
    orderInfo?.waiter_id ??
    orderInfo?.waiterid ??
    orderInfo?.waiterId ??
    null;

  const waiterDisplay =
    orderWaiterId != null
      ? `Waiter ${orderWaiterId}`
      : placedOrder?.waiter?.name ??
        selectedWaiter?.name ??
        selectedWaiter?.email ??
        'Not available';

  const handleDeleteOrder = () => {
    const orderId =
      routeOrderId ??
      (placedOrder?.id ? Number(placedOrder.id) : undefined);

    if (!orderId) return;

    setDeleteSheetVisible(true);
  };

  const confirmDeleteOrder = async () => {
    const orderId =
      routeOrderId ??
      (placedOrder?.id ? Number(placedOrder.id) : undefined);

    if (!orderId) return;

    try {
      setDeleting(true);
      closeDeleteSheet();

      const token = await ensureValidToken();

      await deleteOrder(orderId, token || undefined);

      Alert.alert('Success', 'Order deleted successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Delete Failed', 'Could not delete the order');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditOrder = () => {
    const isRouteDrivenOrder = routeOrderId != null;

    if (isRouteDrivenOrder) {
      if (!orderDetails) {
        Alert.alert('Order details not loaded yet');
        return;
      }

      startEditBackendOrder(orderDetails, selectedTable ?? null);

      navigation.navigate('EditPlacedOrder', {
        tableName: tableDisplay,
        tableId: placedOrder?.table?.id
          ? Number(placedOrder.table.id)
          : undefined,
      });

      return;
    }

    if (!placedOrder) {
      Alert.alert('No placed order found');
      return;
    }

    startEditPlacedOrder();

    navigation.navigate('EditPlacedOrder', {
      tableName: tableDisplay,
      tableId: placedOrder?.table?.id
        ? Number(placedOrder.table.id)
        : undefined,
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const itemName =
      item.ProductName ??
      item.food_name ??
      item.name ??
      'Unknown Item';

    const qty = item.menuqty ?? item.qty ?? 1;

    const basePrice = getBasePriceFromCatalog(item);
    const mappedAddOns = getAddOnsFromCatalog(item);

    const addOnsTotal = mappedAddOns.reduce(
      (sum: number, addon: any) => sum + addon.total,
      0
    );

    const totalPrice = qty * basePrice + addOnsTotal;

    const variantName =
      item.variantName ??
      item.variant_name ??
      item.variantName;

    const note = item.itemnote ?? item.note ?? '';

    // let addOnsText = '';

    // if (item.selectedAddOns && item.selectedAddOns.length > 0) {
    //   addOnsText = item.selectedAddOns
    //     .map((addon: any) => addon.addOnName)
    //     .join(', ');
    // }

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{itemName}</Text>

          <Text style={styles.itemMeta}>
            Qty: {qty} × LKR {basePrice}
          </Text>

          {variantName ? (
            <Text style={styles.itemSubMeta}>Variant: {variantName}</Text>
          ) : null}

          {mappedAddOns.length > 0
            ? mappedAddOns.map((addon: any) => (
                <Text key={addon.addOnId} style={styles.itemSubMeta}>
                  Add-on: {addon.addOnName} × {addon.qty} = LKR {addon.total}
                </Text>
              ))
            : null}

          {note ? (
            <Text style={styles.itemSubMeta}>Note: {note}</Text>
          ) : null}
        </View>

        <View style={styles.itemPriceWrap}>
          <Text style={styles.itemTotal}>LKR {totalPrice}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <Image
            source={require('../../../assets/loading.gif')}
            style={styles.loaderGif}
            resizeMode="contain"
          />

          <Text style={styles.loadingText}>Loading</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <Text style={styles.topTableText}>{tableDisplay}</Text>

          <Text style={styles.topTitle}>Order Details</Text>

          <View style={styles.topBottomRow}>
            <View>
              <Text style={styles.topMetaText}>
                Order ID :{' '}
                {orderDetails?.orderinfo?.order_id ??
                  placedOrder?.id ??
                  '--'}
              </Text>

              <Text style={styles.topMetaText}>
                Waiter : {waiterDisplay}
              </Text>
            </View>

            <Text style={styles.topMetaText}>
              Items {formattedItems.length}
            </Text>
          </View>
        </View>

        <FlatList
          data={formattedItems}
          keyExtractor={(item: any, index) => {
            if ('row_id' in item && item.row_id != null) {
              return `backend-${item.row_id}`;
            }

            if ('id' in item && item.id) {
              return `local-${item.id}`;
            }

            return `fallback-${index}`;
          }}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Items</Text>
              <Text style={styles.emptyText}>No items in this order.</Text>
            </View>
          }
        />

        <View style={styles.bottomSection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>LKR {subtotal}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Charge</Text>
              <Text style={styles.summaryValue}>LKR {serviceCharge}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>LKR {total}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.smallActionButton, styles.secondaryButton]}
              onPress={handleEditOrder}
            >
              <Text style={styles.secondaryButtonText}>Edit order</Text>
            </Pressable>

            <Pressable
              style={[styles.smallActionButton, styles.secondaryButton]}
              onPress={handleDeleteOrder}
              disabled={deleting}
            >
              <Text style={styles.secondaryButtonText}>
                {deleting ? 'Deleting...' : 'Delete order'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.statusButtonRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <Pressable
              style={styles.statusButtonFull}
              onPress={() =>
                navigation.navigate('OrderStatus', {
                  orderId:
                    routeOrderId ??
                    (placedOrder?.id ? Number(placedOrder.id) : undefined),
                  tableName: tableDisplay,
                })
              }
            >
              <Text style={styles.primaryButtonText}>View order status</Text>
            </Pressable>
          </View>
        </View>

        <Modal
          visible={deleteSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={closeDeleteSheet}
        >
          <View style={styles.deleteSheetOverlay}>
            <Pressable
              style={styles.deleteSheetBackdrop}
              onPress={closeDeleteSheet}
            />

            <Animated.View
              style={[
                styles.deleteSheetCard,
                { transform: [{ translateY: deleteSheetTranslateY }] },
              ]}
            >
              <Text style={styles.deleteSheetTitle}>Are you sure?</Text>

              <Pressable
                style={styles.deleteYesButton}
                onPress={confirmDeleteOrder}
                disabled={deleting}
              >
                <Text style={styles.deleteYesButtonText}>
                  {deleting ? 'Deleting...' : 'Yes'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.deleteCancelButton}
                onPress={closeDeleteSheet}
                disabled={deleting}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },

  topCard: {
    backgroundColor: '#F05A22',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  topTableText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },

  topTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  topBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  topMetaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  listContent: {
    paddingBottom: 16,
  },

  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  itemMeta: {
    fontSize: 14,
    color: '#6B7280',
  },

  itemSubMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  itemPriceWrap: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  bottomSection: {
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  totalRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F05A22',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  smallActionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusButtonFull: {
    flex: 1,
    backgroundColor: '#F05A22',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButton: {
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#111827',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  deleteSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  deleteSheetBackdrop: {
    flex: 1,
  },

  deleteSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
  },

  deleteSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },

  deleteYesButton: {
    width: '100%',
    backgroundColor: '#F05822',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  deleteYesButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  deleteCancelButton: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  loaderGif: {
    width: 100,
    height: 100,
  },

  statusButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },

  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
});