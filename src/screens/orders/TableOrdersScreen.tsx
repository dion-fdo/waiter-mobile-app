import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { getActiveOrdersByTable } from '../../services/api/orderApi';

type Props = NativeStackScreenProps<RootStackParamList, 'TableOrders'>;

type TableOrder = {
  order_id: number;
  order_status: number;
};

function getStatusLabel(status: number) {
  switch (status) {
    case 1:
      return 'Pending';
    case 2:
      return 'Processing';
    case 3:
      return 'Ready';
    case 4:
      return 'Served';
    case 5:
      return 'Cancelled';
    case 6:
      return 'Waiter Order';
    default:
      return 'Unknown';
  }
}

export default function TableOrdersScreen({ navigation, route }: Props) {
  const { tableId, tableName, tableStatus } = route.params;
  const {
    ensureValidToken,
    setSelectedTable,
    startNewOrderSession,
    setSelectedPersonCount,
  } = useAppContext();

  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const token = await ensureValidToken();
        const response = await getActiveOrdersByTable(
          tableId,
          token || undefined
        );

        const activeOrders = response.data.filter(
          (order) => ![4, 5].includes(order.order_status)
        );

        setOrders(activeOrders);
      } catch (error: any) {
        Alert.alert(
          'Failed to load table orders',
          error?.message || 'Please try again'
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [tableId]);

  const handleOpenOrder = (orderId: number) => {
    navigation.push('OrderDetails', { orderId });
  };

  const handleAddNewOrder = async () => {
    const table = {
      id: String(tableId),
      name: tableName,
      number: Number(tableName.match(/\d+/)?.[0] ?? tableId),
      status: tableStatus,
    } as any;

    setSelectedTable(table);
    await startNewOrderSession(table);
    setSelectedPersonCount(1);
    navigation.navigate('CustomerSelection');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F05A22" />
        <Text style={styles.loadingText}>Loading table orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{tableName}</Text>
      <Text style={styles.subHeader}>Current Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.order_id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.orderCard}
            onPress={() => handleOpenOrder(item.order_id)}
          >
            <View>
              <Text style={styles.orderId}>Order #{item.order_id}</Text>
              <Text style={styles.orderStatus}>
                {getStatusLabel(item.order_status)}
              </Text>
            </View>

            <Text style={styles.viewText}>View</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No active orders for this table.</Text>
          </View>
        }
      />

      {tableStatus === 'partially_occupied' ? (
        <Pressable style={styles.addButton} onPress={handleAddNewOrder}>
          <Text style={styles.addButtonText}>Add New Order</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
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
    color: '#6B7280',
    fontSize: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  orderCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewText: {
    color: '#F05A22',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#F05A22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});