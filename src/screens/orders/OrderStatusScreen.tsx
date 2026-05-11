import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  Modal,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

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

type KitchenReminderState = {
  orderId: number;
  preparingStartedAt: number;
  nextReminderAt: number;
  confirmedReady: boolean;
  popupPending: boolean;
};

const ORDER_PLACED_GIF = require('../../../assets/status/order-placed.gif');
const PREPARING_GIF = require('../../../assets/status/preparing.gif');
const READY_GIF = require('../../../assets/status/ready.gif');
const SERVED_GIF = require('../../../assets/status/served.gif');

const FIRST_REMINDER_MS = 1 * 60 * 1000;
const REPEAT_REMINDER_MS = 30 * 1000;
const AUTO_REFRESH_MS = 3000;

function getReminderKey(orderId: number) {
  return `kitchen_ready_reminder_order_${orderId}`;
}

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
    { id: '1', label: 'Order Placed', completed: currentStep >= 1, current: currentStep === 1 },
    { id: '2', label: 'Preparing', completed: currentStep >= 2, current: currentStep === 2 },
    { id: '3', label: 'Ready', completed: currentStep >= 3, current: currentStep === 3 },
    { id: '4', label: 'Served', completed: currentStep >= 4, current: currentStep === 4 },
  ];
}

function getStatusText(orderStatus: number): string {
  switch (orderStatus) {
    case 1:
    case 6:
      return 'Order Placed';
    case 2:
      return 'Preparing';
    case 3:
      return 'Ready';
    case 4:
      return 'Served';
    case 5:
      return 'Cancelled';
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

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function OrderStatusScreen({ navigation, route }: Props) {
  const routeOrderId = route.params?.orderId;
  const routeTableName = route.params?.tableName;

  const { placedOrder, ensureValidToken, selectedWaiter } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] =
    useState<OrderDetailsResponse['data'] | null>(null);

  const [localReadyOrderIds, setLocalReadyOrderIds] = useState<number[]>([]);
  const [kitchenModalVisible, setKitchenModalVisible] = useState(false);
  const [elapsedPreparingMs, setElapsedPreparingMs] = useState(0);

  const reminderStateRef = useRef<KitchenReminderState | null>(null);
  const activeOrderIdRef = useRef<number | null>(null);

  const effectiveOrderId =
    routeOrderId != null
      ? routeOrderId
      : placedOrder?.id
      ? Number(placedOrder.id)
      : null;

  useEffect(() => {
    activeOrderIdRef.current = effectiveOrderId;
  }, [effectiveOrderId]);

  const loadOrderDetails = useCallback(
    async (showLoader = false) => {
      if (effectiveOrderId == null) {
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const token = await ensureValidToken();

        const response = await getOrderDetails(
          effectiveOrderId,
          token || undefined
        );

        setOrderDetails(response.data);
      } catch (error: any) {
        console.log('Failed to load order status', error);
      } finally {
        setLoading(false);
      }
    },
    [effectiveOrderId, ensureValidToken]
  );

  useEffect(() => {
    loadOrderDetails(true);
  }, [loadOrderDetails]);

  useFocusEffect(
    useCallback(() => {
      loadOrderDetails(false);

      const checkPendingPopup = async () => {
        if (effectiveOrderId == null) return;

        const saved = await AsyncStorage.getItem(getReminderKey(effectiveOrderId));
        if (!saved) return;

        const parsed: KitchenReminderState = JSON.parse(saved);
        reminderStateRef.current = parsed;

        if (!parsed.confirmedReady && parsed.popupPending) {
          setKitchenModalVisible(true);
        }
      };

      checkPendingPopup();
    }, [effectiveOrderId, loadOrderDetails])
  );

  useEffect(() => {
    if (effectiveOrderId == null) return;

    const interval = setInterval(() => {
      loadOrderDetails(false);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [effectiveOrderId, loadOrderDetails]);

  const backendOrderStatus = orderDetails?.orderinfo?.status ?? 1;

  const orderStatus =
    effectiveOrderId != null &&
    backendOrderStatus === 2 &&
    localReadyOrderIds.includes(effectiveOrderId)
      ? 3
      : backendOrderStatus;

  const saveReminderState = async (state: KitchenReminderState) => {
    reminderStateRef.current = state;

    await AsyncStorage.setItem(
      getReminderKey(state.orderId),
      JSON.stringify(state)
    );
  };

  const clearReminderState = useCallback(async (orderId: number) => {
    reminderStateRef.current = null;
    setKitchenModalVisible(false);
    setElapsedPreparingMs(0);

    await AsyncStorage.removeItem(getReminderKey(orderId));
  }, []);

  const showKitchenReminder = useCallback(async () => {
    setKitchenModalVisible(true);
    Vibration.vibrate([0, 500, 300, 500]);
  }, []);

  useEffect(() => {
    const prepareReminder = async () => {
      if (effectiveOrderId == null) return;

      if (
        backendOrderStatus === 3 ||
        backendOrderStatus === 4 ||
        backendOrderStatus === 5
      ) {
        await clearReminderState(effectiveOrderId);
        return;
      }

      if (backendOrderStatus !== 2) return;

      if (localReadyOrderIds.includes(effectiveOrderId)) return;

      const key = getReminderKey(effectiveOrderId);
      const saved = await AsyncStorage.getItem(key);
      const now = Date.now();

      if (saved) {
        const parsed: KitchenReminderState = JSON.parse(saved);
        reminderStateRef.current = parsed;

        if (parsed.confirmedReady) {
          setLocalReadyOrderIds(prev =>
            prev.includes(effectiveOrderId) ? prev : [...prev, effectiveOrderId]
          );
          return;
        }

        setElapsedPreparingMs(now - parsed.preparingStartedAt);

        if (parsed.popupPending) {
          await showKitchenReminder();
          return;
        }

        if (now >= parsed.nextReminderAt) {
          const updatedState: KitchenReminderState = {
            ...parsed,
            popupPending: true,
            nextReminderAt: now + REPEAT_REMINDER_MS,
          };

          await saveReminderState(updatedState);
          await showKitchenReminder();
        }

        return;
      }

      const newState: KitchenReminderState = {
        orderId: effectiveOrderId,
        preparingStartedAt: now,
        nextReminderAt: now + FIRST_REMINDER_MS,
        confirmedReady: false,
        popupPending: false,
      };

      await saveReminderState(newState);
      setElapsedPreparingMs(0);
    };

    prepareReminder();
  }, [
    effectiveOrderId,
    backendOrderStatus,
    localReadyOrderIds,
    clearReminderState,
    showKitchenReminder,
  ]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const state = reminderStateRef.current;
      const currentOrderId = activeOrderIdRef.current;

      if (!state || currentOrderId == null || state.orderId !== currentOrderId) return;
      if (state.confirmedReady) return;

      const now = Date.now();

      setElapsedPreparingMs(now - state.preparingStartedAt);

      if (state.popupPending && !kitchenModalVisible) {
        await showKitchenReminder();
        return;
      }

      if (now >= state.nextReminderAt && !kitchenModalVisible) {
        const updatedState: KitchenReminderState = {
          ...state,
          popupPending: true,
          nextReminderAt: now + REPEAT_REMINDER_MS,
        };

        await saveReminderState(updatedState);
        await showKitchenReminder();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [kitchenModalVisible, showKitchenReminder]);

  const markOrderReady = async () => {
    if (effectiveOrderId == null) return;

    const currentState = reminderStateRef.current;

    if (currentState) {
      await saveReminderState({
        ...currentState,
        confirmedReady: true,
        popupPending: false,
      });
    }

    setLocalReadyOrderIds(prev =>
      prev.includes(effectiveOrderId) ? prev : [...prev, effectiveOrderId]
    );

    setKitchenModalVisible(false);
  };

  const handleKitchenReadyYes = () => {
    Alert.alert(
      'Confirm Ready',
      'Are you sure this order is ready?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: markOrderReady,
        },
      ]
    );
  };

  const handleOrderPreparedPress = () => {
    Alert.alert(
      'Mark Order as Ready',
      'Has the kitchen confirmed that this order is prepared and ready?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: markOrderReady,
        },
      ]
    );
  };

  const handleKitchenReadyNo = async () => {
    const currentState = reminderStateRef.current;

    if (!currentState) {
      setKitchenModalVisible(false);
      return;
    }

    const updatedState: KitchenReminderState = {
      ...currentState,
      popupPending: false,
      nextReminderAt: Date.now() + REPEAT_REMINDER_MS,
    };

    await saveReminderState(updatedState);
    setKitchenModalVisible(false);
  };

  const handleKitchenBack = () => {
    setKitchenModalVisible(false);
    navigation.goBack();
  };

  const steps = useMemo(() => {
    return buildSteps(orderStatus);
  }, [orderStatus]);

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
    (orderTableNo != null ? `Table ${orderTableNo}` : '--');

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
        'Not selected';

  const statusText = getStatusText(orderStatus);
  const statusGif = getStatusGif(orderStatus);

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

            <View style={styles.statusRightWrap}>
              <Text style={styles.topMetaText}>{statusText}</Text>

              {backendOrderStatus === 2 && orderStatus === 2 ? (
                <Text style={styles.timerText}>
                  Preparing: {formatElapsed(elapsedPreparingMs)}
                </Text>
              ) : null}
            </View>
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

                    {!isLast ? (
                      <View
                        style={[
                          styles.line,
                          step.completed ? styles.completedLine : styles.pendingLine,
                        ]}
                      />
                    ) : null}
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
            <Image
              source={statusGif}
              style={styles.statusGif}
              resizeMode="contain"
            />
          </View>
        </View>

        {orderStatus === 2 ? (
          <Pressable
            style={styles.readyButton}
            onPress={handleOrderPreparedPress}
          >
            <Text style={styles.readyButtonText}>Order Prepared</Text>
          </Pressable>
        ) : null}

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
              navigation.navigate('OrderDetails', {
                orderId:
                  routeOrderId ??
                  (placedOrder?.id ? Number(placedOrder.id) : undefined),
                tableName: tableDisplay,
              })
            }
          >
            <Text style={styles.buttonText}>View Order</Text>
          </Pressable>
        </View>

        <Modal
          visible={kitchenModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleKitchenBack}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Kitchen check needed</Text>

              <Text style={styles.modalMessage}>
                Please check with the kitchen to confirm whether this order is ready.
              </Text>

              <View style={styles.modalButtonRow}>
                <Pressable
                  style={styles.modalBackButton}
                  onPress={handleKitchenBack}
                >
                  <Text style={styles.modalBackButtonText}>Back</Text>
                </Pressable>

                <Pressable
                  style={styles.modalSecondaryButton}
                  onPress={handleKitchenReadyNo}
                >
                  <Text style={styles.modalSecondaryButtonText}>Not yet</Text>
                </Pressable>

                <Pressable
                  style={styles.modalPrimaryButton}
                  onPress={handleKitchenReadyYes}
                >
                  <Text style={styles.modalPrimaryButtonText}>Yes, ready</Text>
                </Pressable>
              </View>
            </View>
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

  statusRightWrap: {
    alignItems: 'flex-end',
  },

  timerText: {
    color: '#FFF7ED',
    fontSize: 12,
    fontWeight: '700',
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
    paddingBottom: 12,
  },

  statusGif: {
    width: 220,
    height: 220,
  },

  readyButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  readyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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

  loaderGif: {
    width: 100,
    height: 100,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },

  modalMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },

  modalBackButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  modalBackButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },

  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSecondaryButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },

  modalPrimaryButton: {
    flex: 1,
    backgroundColor: '#F05822',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});