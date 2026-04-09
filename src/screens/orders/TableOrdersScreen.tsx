import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const loadOrders = useCallback(async () => {
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
        const message = error?.message || '';

        if (
          message.toLowerCase().includes('active order not found') ||
          message.toLowerCase().includes('404')
        ) {
          setOrders([]);
          return;
        }

        Alert.alert(
          'Failed to load table orders',
          message || 'Please try again'
        );
      } finally {
        setLoading(false);
      }
  }, [tableId, ensureValidToken]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

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

    await startNewOrderSession(table);
    setSelectedPersonCount(1);
    navigation.navigate('CustomerSelection');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F05822" />
        <Text style={styles.loadingText}>Loading table orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <Text style={styles.header}>{tableName}</Text>
          <Text style={styles.subHeader}>Current Orders</Text>

          <View style={styles.tableMetaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {orders.length} Active
              </Text>
            </View>

            <View
              style={[
                styles.metaBadge,
                tableStatus === 'full'
                  ? styles.fullBadge
                  : styles.partialBadge,
              ]}
            >
              <Text style={styles.metaBadgeText}>
                {tableStatus === 'full'
                  ? 'Full'
                  : 'Partially Occupied'}
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.order_id)}
          renderItem={({ item }) => (
            <Pressable
              style={styles.orderCard}
              onPress={() => handleOpenOrder(item.order_id)}
            >
              <View style={styles.orderLeft}>
                <Text style={styles.orderId}>
                  Order #{item.order_id}
                </Text>

                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {getStatusLabel(item.order_status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.viewText}>View</Text>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                No Active Orders
              </Text>
              <Text style={styles.emptyText}>
                This table currently has no active orders.
              </Text>
            </View>
          }
        />

        <View style={styles.bottomActions}>
          {tableStatus === 'partially_occupied' && (
            <Pressable
              style={styles.addButton}
              onPress={handleAddNewOrder}
            >
              <Text style={styles.addButtonText}>
                Add New Order
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
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
    paddingTop: 0,
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

  topCard: {
    backgroundColor: '#F05822',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  subHeader: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 14,
  },

  tableMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },

  metaBadge: {
    backgroundColor: '#6a3000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  partialBadge: {
    backgroundColor: '#000000',
  },

  fullBadge: {
    backgroundColor: '#000000',
  },

  metaBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: {
    paddingBottom: 20,
  },

  orderCard: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  orderLeft: {
    flex: 1,
  },

  orderId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusPillText: {
    color: '#F05822',
    fontSize: 13,
    fontWeight: '700',
  },

  viewText: {
    color: '#F05822',
    fontSize: 15,
    fontWeight: '700',
  },

  emptyBox: {
    backgroundColor: '#efefef',
    borderWidth: 1,
    borderColor: '#c3c3c3',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
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

  bottomActions: {
    paddingTop: 12,
    paddingBottom: 16,
    marginHorizontal: -16,
    marginBottom: -20,
    paddingHorizontal: 16,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },

  addButton: {
    backgroundColor: '#F05822',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    width: '100%',
  },

  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  backButtonText: {
    color: '#5a5a5a',
    fontSize: 16,
    fontWeight: '400',
  },
});