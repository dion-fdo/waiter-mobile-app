import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { getOrderDetails, OrderDetailsResponse } from '../../services/api/orderApi';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderStatus'>;

type StatusStep = {
  id: string;
  label: string;
  completed: boolean;
};

function buildSteps(orderStatus: number): StatusStep[] {
  const currentStep =
    orderStatus === 1 || orderStatus === 6
      ? 1
      : orderStatus === 2
      ? 2
      : orderStatus === 3
      ? 3
      : orderStatus === 4
      ? 4
      : 1;

  return [
    { id: '1', label: 'Order Placed', completed: currentStep >= 1 },
    { id: '2', label: 'Preparing', completed: currentStep >= 2 },
    { id: '3', label: 'Ready', completed: currentStep >= 3 },
    { id: '4', label: 'Served', completed: currentStep >= 4 },
  ];
}

function getStatusText(orderStatus: number): string {
  switch (orderStatus) {
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

export default function OrderStatusScreen({ navigation, route}: Props) {
  const routeOrderId = route.params?.orderId;
  const { placedOrder, ensureValidToken, selectedTable, selectedWaiter } = useAppContext();

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
        setOrderDetails(response.data);
      } catch (error: any) {
        Alert.alert(
          'Failed to load order status',
          error?.message || 'Please try again'
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [routeOrderId, placedOrder?.id, ensureValidToken]);

  const steps = useMemo(() => {
    return buildSteps(orderDetails?.orderinfo?.status ?? 1);
  }, [orderDetails?.orderinfo?.status]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F05A22" />
        <Text style={styles.loadingText}>Loading order status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Status</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Order ID: {orderDetails?.orderinfo?.order_id ?? placedOrder?.id ?? '--'}
        </Text>
        <Text style={styles.infoText}>
          Table: {selectedTable?.name ?? selectedTable?.number ?? '--'}
        </Text>
        <Text style={styles.infoText}>
          Waiter: {placedOrder?.waiter?.name ?? selectedWaiter?.name ?? selectedWaiter?.email ?? 'Not selected'}
        </Text>
        <Text style={styles.infoText}>
          Current Status: {getStatusText(orderDetails?.orderinfo?.status ?? 1)}
        </Text>
      </View>

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.dot,
                    step.completed ? styles.completedDot : styles.pendingDot,
                  ]}
                />
                {!isLast && (
                  <View
                    style={[
                      styles.line,
                      step.completed ? styles.completedLine : styles.pendingLine,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    step.completed ? styles.completedText : styles.pendingText,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('OrderDetails', { orderId: routeOrderId })}
        >
          <Text style={styles.buttonText}>View Order</Text>
        </Pressable>
      </View>
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
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 6,
  },
  timeline: {
    flex: 1,
    paddingTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
  },
  completedDot: {
    backgroundColor: '#F05A22',
  },
  pendingDot: {
    backgroundColor: '#E5E7EB',
  },
  line: {
    width: 3,
    flex: 1,
    marginTop: 4,
    borderRadius: 2,
  },
  completedLine: {
    backgroundColor: '#F05A22',
  },
  pendingLine: {
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 8,
  },
  stepLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  completedText: {
    color: '#111827',
  },
  pendingText: {
    color: '#6B7280',
  },
  button: {
    flex: 1,
    backgroundColor: '#F05A22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});