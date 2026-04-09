import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { deleteOrder, getOrderDetails } from '../../services/api/orderApi';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'OrderDetails'
>;

export default function OrderDetailsScreen({
  navigation,
  route,
}: Props) {
  const routeOrderId = route.params?.orderId;

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
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);

      const orderId =
        routeOrderId ??
        (placedOrder?.id
          ? Number(placedOrder.id)
          : undefined);

      if (!orderId) {
        setLoading(false);
        return;
      }

      const token = await ensureValidToken();
      const response = await getOrderDetails(
        orderId,
        token || undefined
      );

      setOrderDetails(response.data);
    } catch (error) {
      console.error(
        'Failed to load order details',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [routeOrderId, placedOrder?.id, ensureValidToken]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const formattedItems = useMemo(() => {
    if (orderDetails?.itemsinfo) {
      return orderDetails.itemsinfo;
    }

    return placedOrder?.items ?? [];
  }, [orderDetails, placedOrder]);

  const subtotal = useMemo(() => {
    return formattedItems.reduce(
      (sum: number, item: any) => {
        const qty =
          item.menuqty ??
          item.qty ??
          1;

        const price = Number(
          item.price ??
            item.menuprice ??
            0
        );

        return sum + qty * price;
      },
      0
    );
  }, [formattedItems]);

  const serviceCharge = 0;
  const total = subtotal + serviceCharge;

  const handleDeleteOrder = () => {
    const orderId =
      routeOrderId ??
      (placedOrder?.id
        ? Number(placedOrder.id)
        : undefined);

    if (!orderId) return;

    setDeleteSheetVisible(true);
  };

  const confirmDeleteOrder = async () => {
    const orderId =
      routeOrderId ??
      (placedOrder?.id
        ? Number(placedOrder.id)
        : undefined);

    if (!orderId) return;

    try {
      setDeleting(true);
      setDeleteSheetVisible(false);

      const token = await ensureValidToken();

      await deleteOrder(
        orderId,
        token || undefined
      );

      Alert.alert(
        'Success',
        'Order deleted successfully'
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Delete Failed',
        'Could not delete the order'
      );
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
      navigation.navigate('EditPlacedOrder');
      return;
    }

    if (!placedOrder) {
      Alert.alert('No placed order found');
      return;
    }

    startEditPlacedOrder();
    navigation.navigate('EditPlacedOrder');
  };

  const renderItem = ({
    item,
  }: {
    item: any;
  }) => {
    const itemName =
      item.ProductName ??
      item.food_name ??
      item.name ??
      'Unknown Item';

    const qty =
      item.menuqty ??
      item.qty ??
      1;

    const price = Number(
      item.price ??
        item.menuprice ??
        0
    );

    const totalPrice = qty * price;

    const variantName =
      item.variantName ??
      item.variant_name;

    const note =
      item.itemnote ??
      item.note ??
      '';

    let addOnsText = '';

    if (
      item.selectedAddOns &&
      item.selectedAddOns.length > 0
    ) {
      addOnsText = item.selectedAddOns
        .map((addon: any) => addon.addOnName)
        .join(', ');
    }

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {itemName}
          </Text>

          <Text style={styles.itemMeta}>
            Qty: {qty} × LKR {price}
          </Text>

          {variantName ? (
            <Text style={styles.itemSubMeta}>
              Variant: {variantName}
            </Text>
          ) : null}

          {addOnsText ? (
            <Text style={styles.itemSubMeta}>
              Add-ons: {addOnsText}
            </Text>
          ) : null}

          {note ? (
            <Text style={styles.itemSubMeta}>
              Note: {note}
            </Text>
          ) : null}
        </View>

        <View style={styles.itemPriceWrap}>
          <Text style={styles.itemTotal}>
            LKR {totalPrice}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            styles.centered,
          ]}
        >
          <ActivityIndicator
            size="large"
            color="#F05822"
          />
          <Text style={styles.loadingText}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <Text style={styles.topTableText}>
            {' '}
            {selectedTable?.name ??
              selectedTable?.number ??
              '--'}
          </Text>

          <Text style={styles.topTitle}>
            Order Details
          </Text>

          <View style={styles.topBottomRow}>
            <View>
              <Text style={styles.topMetaText}>
                Order ID :{' '}
                {orderDetails?.orderinfo
                  ?.order_id ??
                  placedOrder?.id ??
                  '--'}
              </Text>

              <Text style={styles.topMetaText}>
                Waiter :{' '}
                {placedOrder?.waiter?.name ??
                  selectedWaiter?.name ??
                  selectedWaiter?.email ??
                  'Not available'}
              </Text>
            </View>

            <Text style={styles.topMetaText}>
              Items {formattedItems.length}
            </Text>
          </View>
        </View>

        <FlatList
          data={formattedItems}
          keyExtractor={(
            item: any,
            index
          ) => {
            if (
              'row_id' in item &&
              item.row_id != null
            ) {
              return `backend-${item.row_id}`;
            }

            if ('id' in item && item.id) {
              return `local-${item.id}`;
            }

            return `fallback-${index}`;
          }}
          renderItem={renderItem}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                No Items
              </Text>
              <Text style={styles.emptyText}>
                No items in this order.
              </Text>
            </View>
          }
        />

        <View style={styles.bottomSection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal
              </Text>
              <Text style={styles.summaryValue}>
                LKR {subtotal}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Service Charge
              </Text>
              <Text style={styles.summaryValue}>
                LKR {serviceCharge}
              </Text>
            </View>

            <View
              style={[
                styles.summaryRow,
                styles.totalRow,
              ]}
            >
              <Text style={styles.totalLabel}>
                Total
              </Text>
              <Text style={styles.totalValue}>
                LKR {total}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.smallActionButton,
                styles.secondaryButton,
              ]}
              onPress={handleEditOrder}
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Edit order
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.smallActionButton,
                styles.secondaryButton,
              ]}
              onPress={handleDeleteOrder}
              disabled={deleting}
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete order'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.statusButtonFull}
            onPress={() =>
              navigation.navigate(
                'OrderStatus',
                {
                  orderId:
                    routeOrderId ??
                    (placedOrder?.id
                      ? Number(
                          placedOrder.id
                        )
                      : undefined),
                }
              )
            }
          >
            <Text
              style={styles.primaryButtonText}
            >
              View order status
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={deleteSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteSheetVisible(false)}
      >
        <View style={styles.deleteSheetOverlay}>
          <Pressable
            style={styles.deleteSheetBackdrop}
            onPress={() => setDeleteSheetVisible(false)}
          />

          <View style={styles.deleteSheetCard}>
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
              onPress={() => setDeleteSheetVisible(false)}
              disabled={deleting}
            >
              <Text style={styles.deleteCancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#F05822',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  topTableText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#F05822',
  },

  bottomSection: {
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: 'rgb(255, 248, 245)',
    borderWidth: 1,
    borderColor: '#ffc1a9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  summaryLabel: {
    fontSize: 15,
    color: '#565c67',
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
    borderTopColor: '#a5a5a7',
    marginBottom: 0,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F05822',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },

  smallActionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusButtonFull: {
    width: '100%',
    backgroundColor: '#F05822',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButton: {
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteCancelButtonText: {
    color: '#4e4e4e',
    fontSize: 15,
    fontWeight: '700',
  },
});