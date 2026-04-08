import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import {
  deleteOrder,
  getOrderDetails,
  OrderDetailsResponse,
} from '../../services/api/orderApi';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen({ navigation, route }: Props) {
  const routeOrderId = route.params?.orderId;
  const {
    placedOrder,
    startEditPlacedOrder,
    startEditBackendOrder,
    ensureValidToken,
    selectedTable,
    selectedWaiter,
  } = useAppContext();

  const isRouteDrivenOrder = routeOrderId != null;

  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse['data'] | null>(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      const effectiveOrderId =
        routeOrderId != null
          ? routeOrderId
          : placedOrder?.id
          ? Number(placedOrder.id)
          : null;

      if (effectiveOrderId == null) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await ensureValidToken();
        const response = await getOrderDetails(
          effectiveOrderId,
          token || undefined
        );
       // console.log('ORDER DETAILS RESPONSE =', JSON.stringify(response));
        setOrderDetails(response.data);
      } catch (error: any) {
        Alert.alert(
          'Failed to load order details',
          error?.message || 'Please try again'
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [routeOrderId, placedOrder?.id, ensureValidToken]);

  const handleEditOrder = () => {
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

  const handleDeleteOrder = () => {
    if (isRouteDrivenOrder) {
      Alert.alert('Deleting from table order list is not connected yet');
      return;
    }

    if (!placedOrder?.id) {
      Alert.alert('No order found');
      return;
    }

    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteOrder },
      ]
    );
  };

  const confirmDeleteOrder = async () => {
    try {
      setDeleting(true);

      const token = await ensureValidToken();

      await deleteOrder(
        Number(placedOrder?.id),
        token || undefined
      );

      Alert.alert('Success', 'Order deleted successfully');

      navigation.reset({
        index: 0,
        routes: [{ name: 'TableDashboard' }],
      });
    } catch (error: any) {
      Alert.alert(
        'Delete Failed',
        error?.message || 'Please try again'
      );
    } finally {
      setDeleting(false);
    }
  };

  const formattedItems = useMemo(() => {
    if (orderDetails?.itemsinfo && orderDetails.itemsinfo.length > 0) {
      return orderDetails.itemsinfo;
    }

    if (!isRouteDrivenOrder) {
      return placedOrder?.items ?? [];
    }

    return [];
  }, [orderDetails?.itemsinfo, placedOrder?.items, isRouteDrivenOrder]);

  const subtotal = useMemo(() => {
    if (orderDetails?.itemsinfo && orderDetails.itemsinfo.length > 0) {
      return orderDetails.itemsinfo.reduce((sum, item) => {
        const qty = item.menuqty ?? 0;
        const price = Number(item.menuprice ?? item.price ?? 0);
        return sum + qty * price;
      }, 0);
    }

    if (!isRouteDrivenOrder) {
      return placedOrder?.subtotal ?? 0;
    }

    return 0;
  }, [orderDetails?.itemsinfo, placedOrder?.subtotal, isRouteDrivenOrder]);

  const serviceCharge = !isRouteDrivenOrder ? placedOrder?.serviceCharge ?? 0 : 0;
  const total = !isRouteDrivenOrder ? placedOrder?.total ?? subtotal : subtotal;

  const renderItem = ({ item }: { item: any }) => {
    const isBackendItem = 'row_id' in item;

    const itemName = isBackendItem
      ? item.food_name || item.ProductName || 'Unnamed Item'
      : item.name;

    const qty = isBackendItem
      ? item.menuqty ?? 0
      : item.qty ?? 0;

    const price = isBackendItem
      ? Number(item.menuprice ?? item.price ?? 0)
      : item.price ?? 0;

    const variantName = isBackendItem
      ? item.variantName || item.variant_name
      : item.variantName;

    const note = isBackendItem
      ? item.itemnote
      : item.note;

    const addOnsText = isBackendItem
      ? item.add_on_id && item.add_on_id.trim() !== ''
        ? item.add_on_id
        : ''
      : item.selectedAddOns && item.selectedAddOns.length > 0
      ? item.selectedAddOns.map((addOn: any) => addOn.addOnName).join(', ')
      : '';

    const totalPrice = qty * price;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{itemName}</Text>

          <Text style={styles.itemMeta}>
            Qty: {qty} × LKR {price}
          </Text>

          {variantName ? (
            <Text style={styles.itemSubMeta}>Variant: {variantName}</Text>
          ) : null}

          {addOnsText ? (
            <Text style={styles.itemSubMeta}>Add-ons: {addOnsText}</Text>
          ) : null}

          {note ? (
            <Text style={styles.itemSubMeta}>Note: {note}</Text>
          ) : null}
        </View>

        <Text style={styles.itemTotal}>LKR {totalPrice}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F05A22" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Details</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Order ID: {orderDetails?.orderinfo?.order_id ?? placedOrder?.id ?? '--'}
        </Text>
        <Text style={styles.infoText}>
          Table: {selectedTable?.name ?? selectedTable?.number ?? '--'}
        </Text>
        <Text style={styles.infoText}>
          Waiter:{' '}
          {placedOrder?.waiter?.name
            ?? selectedWaiter?.name
            ?? selectedWaiter?.email
            ?? 'Not available'}
        </Text>
        <Text style={styles.infoText}>
          Items: {formattedItems.length}
        </Text>
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
            <Text style={styles.emptyText}>No items in this order.</Text>
          </View>
        }
      />

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
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleEditOrder}
        >
          <Text style={styles.secondaryButtonText}>Edit Order</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() =>
            navigation.navigate('OrderStatus', {
              orderId: routeOrderId ?? (placedOrder?.id ? Number(placedOrder.id) : undefined),
            })
          }
        >
          <Text style={styles.primaryButtonText}>Order Status</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.deleteOrderButton}
        onPress={handleDeleteOrder}
        disabled={deleting}
      >
        <Text style={styles.deleteOrderButtonText}>
          {deleting ? 'Deleting...' : 'Delete Order'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
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
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
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
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F05A22',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#F05A22',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteOrderButton: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteOrderButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '700',
  },
});