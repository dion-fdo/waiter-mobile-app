import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { getOrderDetails, OrderDetailsResponse } from '../../services/api/orderApi';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderStatus'>;

type StatusStep = {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
};

const ORDER_PLACED_GIF = require('../../../assets/status/order-placed.gif');
const PREPARING_GIF = require('../../../assets/status/preparing.gif');
const READY_GIF = require('../../../assets/status/ready.gif');
const SERVED_GIF = require('../../../assets/status/served.gif');

function getCurrentStep(orderStatus: number): number {
  if (orderStatus === 1 || orderStatus === 6) return 1;
  if (orderStatus === 2) return 2;
  if (orderStatus === 3) return 3;
  if (orderStatus === 4) return 4;
  return 1;
}

function buildSteps(orderStatus: number): StatusStep[] {
  const currentStep = getCurrentStep(orderStatus);

  return [
    {
      id: '1',
      label: 'Order Placed',
      completed: currentStep >= 1,
      current: currentStep === 1,
    },
    {
      id: '2',
      label: 'Preparing',
      completed: currentStep >= 2,
      current: currentStep === 2,
    },
    {
      id: '3',
      label: 'Ready',
      completed: currentStep >= 3,
      current: currentStep === 3,
    },
    {
      id: '4',
      label: 'Served',
      completed: currentStep >= 4,
      current: currentStep === 4,
    },
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

function getStatusGif(orderStatus: number) {
  const currentStep = getCurrentStep(orderStatus);

  switch (currentStep) {
    case 1:
      return ORDER_PLACED_GIF;
    case 2:
      return PREPARING_GIF;
    case 3:
      return READY_GIF;
    case 4:
      return SERVED_GIF;
    default:
      return ORDER_PLACED_GIF;
  }
}

export default function OrderStatusScreen({ navigation, route }: Props) {
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

  const orderStatus = orderDetails?.orderinfo?.status ?? 1;

  const steps = useMemo(() => {
    return buildSteps(orderStatus);
  }, [orderStatus]);

  const tableDisplay =
    (orderDetails as any)?.tablename ??
    (orderDetails as any)?.table_name ??
    (orderDetails as any)?.table?.name ??
    (orderDetails as any)?.table_no
      ? `Table ${(orderDetails as any)?.table_no}`
      : selectedTable?.name ??
        (selectedTable?.number ? `Table ${selectedTable.number}` : '--');

  const waiterDisplay =
    placedOrder?.waiter?.name ??
    selectedWaiter?.name ??
    selectedWaiter?.email ??
    'Not selected';

  const statusGif = getStatusGif(orderStatus);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#F05822" />
          <Text style={styles.loadingText}>Loading order status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <Text style={styles.topTableText}>{tableDisplay}</Text>
          <Text style={styles.topTitle}>Order Status</Text>

          <View style={styles.topBottomRow}>
            <View>
              <Text style={styles.topMetaText}>
                Order ID : {orderDetails?.orderinfo?.order_id ?? placedOrder?.id ?? '--'}
              </Text>
              <Text style={styles.topMetaText}>
                Waiter : {waiterDisplay}
              </Text>
            </View>

            <Text style={styles.topMetaText}>
              {getStatusText(orderStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.timelineWrap}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.dot,
                        step.completed ? styles.completedDot : styles.pendingDot,
                        step.current && styles.currentDot,
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
                        step.current && styles.currentStepLabel,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.gifWrap}>
            <Image source={statusGif} style={styles.statusGif} resizeMode="contain" />
          </View>
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
            onPress={() =>
              navigation.navigate('OrderDetails', { orderId: routeOrderId })
            }
          >
            <Text style={styles.buttonText}>View Order</Text>
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  topTableText: {
    color: '#FFFFFF',
    fontSize: 14,
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

  contentArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  timelineWrap: {
    paddingTop: 8,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 72,
  },

  timelineLeft: {
    width: 34,
    alignItems: 'center',
  },

  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
  },

  currentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  completedDot: {
    backgroundColor: '#F05822',
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
    backgroundColor: '#F05822',
  },

  pendingLine: {
    backgroundColor: '#E5E7EB',
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
  },

  stepLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  currentStepLabel: {
    fontSize: 24,
    fontWeight: '800',
  },

  completedText: {
    color: '#111827',
  },

  pendingText: {
    color: '#9CA3AF',
  },

  gifWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },

  statusGif: {
    width: 220,
    height: 220,
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

  button: {
    flex: 1,
    backgroundColor: '#F05822',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});