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
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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

type KitchenNotification = {
  id: string;
  orderId: number;
  tableName: string;
  message: string;
  updatedAt: number;
};

const KITCHEN_NOTIFICATIONS_KEY = 'kitchen_check_notifications';

const ORDER_PLACED_GIF = require('../../../assets/status/order-placed.gif');
const PREPARING_GIF = require('../../../assets/status/preparing.gif');
const READY_GIF = require('../../../assets/status/ready.gif');
const SERVED_GIF = require('../../../assets/status/served.gif');
const COMPLETED_GIF = require('../../../assets/status/completed.gif');

const FIRST_REMINDER_MS = 1 * 60 * 1000;
const REPEAT_REMINDER_MS = 30 * 1000;
const AUTO_REFRESH_MS = 3000;

function getReminderKey(orderId: number) {
  return `kitchen_ready_reminder_order_${orderId}`;
}

function getServedKey(orderId: number) {
  return `waiter_served_order_${orderId}`;
}

function getCurrentStep(orderStatus: number): number {
  if (orderStatus === 1 || orderStatus === 6) return 1;
  if (orderStatus === 2) return 2;
  if (orderStatus === 3) return 3;
  if (orderStatus === 7) return 4;
  if (orderStatus === 4) return 5;
  return 1;
}

function buildSteps(orderStatus: number): StatusStep[] {
  const currentStep = getCurrentStep(orderStatus);

  return [
    { id: '1', label: 'Order Placed', completed: currentStep >= 1, current: currentStep === 1 },
    { id: '2', label: 'Preparing', completed: currentStep >= 2, current: currentStep === 2 },
    { id: '3', label: 'Ready', completed: currentStep >= 3, current: currentStep === 3 },
    { id: '4', label: 'Served', completed: currentStep >= 4, current: currentStep === 4 },
    { id: '5', label: 'Completed', completed: currentStep >= 5, current: currentStep === 5 },
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
    case 7:
      return 'Served';
    case 4:
      return 'Completed';
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

    case 5:
      return COMPLETED_GIF;

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
  const insets = useSafeAreaInsets();
  const routeOrderId = route.params?.orderId;
  const routeTableName = route.params?.tableName;

  const { placedOrder, ensureValidToken, selectedWaiter } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] =
    useState<OrderDetailsResponse['data'] | null>(null);

  const [localReadyOrderIds, setLocalReadyOrderIds] = useState<number[]>([]);
  const [localServedOrderIds, setLocalServedOrderIds] = useState<number[]>([]);
  const [kitchenModalVisible, setKitchenModalVisible] = useState(false);
  const [elapsedPreparingMs, setElapsedPreparingMs] = useState(0);

  const reminderStateRef = useRef<KitchenReminderState | null>(null);
  const activeOrderIdRef = useRef<number | null>(null);
  const kitchenModalVisibleRef = useRef(false);

  const effectiveOrderId =
    routeOrderId != null
      ? routeOrderId
      : placedOrder?.id
      ? Number(placedOrder.id)
      : null;

  useEffect(() => {
    const loadServedState = async () => {
      if (effectiveOrderId == null) return;

      const saved = await AsyncStorage.getItem(getServedKey(effectiveOrderId));

      if (saved === 'true') {
        setLocalServedOrderIds(prev =>
          prev.includes(effectiveOrderId) ? prev : [...prev, effectiveOrderId]
        );
      }
    };

    loadServedState();
  }, [effectiveOrderId]);

  useEffect(() => {
    activeOrderIdRef.current = effectiveOrderId;
  }, [effectiveOrderId]);

  useEffect(() => {
    kitchenModalVisibleRef.current = kitchenModalVisible;
  }, [kitchenModalVisible]);

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
          token || undefined,
          selectedWaiter?.branchId
        );

        setOrderDetails(response.data);
      } catch (error: any) {
        console.log('Failed to load order status', error);
      } finally {
        setLoading(false);
      }
    },
    [effectiveOrderId, ensureValidToken, selectedWaiter?.branchId]
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
    backendOrderStatus === 4
      ? 4
      : effectiveOrderId != null &&
        localServedOrderIds.includes(effectiveOrderId)
      ? 7
      : effectiveOrderId != null &&
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

  const addOrUpdateKitchenNotification = async () => {
    if (effectiveOrderId == null) return;

    const saved = await AsyncStorage.getItem(KITCHEN_NOTIFICATIONS_KEY);
    const existing: KitchenNotification[] = saved ? JSON.parse(saved) : [];

    const notificationId = `order_${effectiveOrderId}`;
    const message = `Check order #${effectiveOrderId} on ${tableDisplay}`;

    const nextNotification: KitchenNotification = {
      id: notificationId,
      orderId: effectiveOrderId,
      tableName: tableDisplay,
      message,
      updatedAt: Date.now(),
    };

    const updated = [
      nextNotification,
      ...existing.filter((item) => item.id !== notificationId),
    ];

    await AsyncStorage.setItem(
      KITCHEN_NOTIFICATIONS_KEY,
      JSON.stringify(updated)
    );
  };

  const removeKitchenNotification = async () => {
    if (effectiveOrderId == null) return;

    const saved = await AsyncStorage.getItem(KITCHEN_NOTIFICATIONS_KEY);
    const existing: KitchenNotification[] = saved ? JSON.parse(saved) : [];

    const updated = existing.filter(
      (item) => item.id !== `order_${effectiveOrderId}`
    );

    await AsyncStorage.setItem(
      KITCHEN_NOTIFICATIONS_KEY,
      JSON.stringify(updated)
    );
  };

  const showKitchenReminder = useCallback(async () => {
    await addOrUpdateKitchenNotification();

    if (kitchenModalVisibleRef.current) return;

    setKitchenModalVisible(true);
    Vibration.vibrate([0, 500, 300, 500]);
  }, [addOrUpdateKitchenNotification]);

  useEffect(() => {
    const prepareReminder = async () => {
      if (effectiveOrderId == null) return;

      if (
        backendOrderStatus === 3 ||
        backendOrderStatus === 4 ||
        backendOrderStatus === 5
      ) {
        await clearReminderState(effectiveOrderId);
        await removeKitchenNotification();
        return;
      }

      if (backendOrderStatus !== 2) return;

      if (!isOwnWaiterOrder) {
        await removeKitchenNotification();
        return;
      }

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
          if (!kitchenModalVisibleRef.current) {
            await showKitchenReminder();
          }
          return;
        }

        if (now >= parsed.nextReminderAt && !parsed.popupPending) {
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

      if (!isOwnWaiterOrder) return;

      if (state.confirmedReady) return;

      const now = Date.now();

      setElapsedPreparingMs(now - state.preparingStartedAt);

      if (state.popupPending && !kitchenModalVisibleRef.current) {
        await showKitchenReminder();
        return;
      }

      if (now >= state.nextReminderAt && !kitchenModalVisibleRef.current) {
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
  }, [showKitchenReminder]);

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
    await removeKitchenNotification();
    setKitchenModalVisible(false);
  };

  const markOrderServed = async () => {
    if (effectiveOrderId == null) return;

    await AsyncStorage.setItem(getServedKey(effectiveOrderId), 'true');

    setLocalServedOrderIds(prev =>
      prev.includes(effectiveOrderId) ? prev : [...prev, effectiveOrderId]
    );
  };

  const handleOrderServedPress = () => {
    Alert.alert(
      'Mark as Served',
      'Has this order been served to the table?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: markOrderServed,
        },
      ]
    );
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
      await removeKitchenNotification();
      setKitchenModalVisible(false);
      return;
    }

    const updatedState: KitchenReminderState = {
      ...currentState,
      popupPending: false,
      nextReminderAt: Date.now() + REPEAT_REMINDER_MS,
    };

    await saveReminderState(updatedState);

    await removeKitchenNotification();

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

  const loggedWaiterId =
    selectedWaiter?.waiterId != null
      ? String(selectedWaiter.waiterId)
      : null;

  const isOwnWaiterOrder =
    orderWaiterId == null ||
    (
      loggedWaiterId != null &&
      String(orderWaiterId) === loggedWaiterId
    );

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
                    <StatusDot
                      completed={step.completed}
                      current={step.current}
                    />

                    {!isLast ? (
                      <AnimatedTimelineLine
                        completed={steps[index + 1]?.completed}
                        active={step.current && !steps[index + 1]?.completed}
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

        <View
          style={[
            styles.footerArea,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {orderStatus === 2 ? (
            <Pressable
              style={styles.readyButton}
              onPress={handleOrderPreparedPress}
            >
              <Text style={styles.readyButtonText}>Order Prepared</Text>
            </Pressable>
          ) : null}

          {orderStatus === 3 ? (
            <Pressable
              style={styles.readyButton}
              onPress={handleOrderServedPress}
            >
              <Text style={styles.readyButtonText}>Mark as Served</Text>
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

function StatusDot({
  completed,
  current,
}: {
  completed: boolean;
  current: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!current) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [current, pulseAnim]);

  if (current) {
    return (
      <Animated.View
        style={[
          styles.currentDotRing,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.currentDotInner} />
      </Animated.View>
    );
  }

  if (completed) {
    return (
      <View style={styles.completedDotCircle}>
        <Text style={styles.completedDotTick}>✓</Text>
      </View>
    );
  }

  return <View style={styles.pendingDotCircle} />;
}

function AnimatedTimelineLine({
  completed,
  active,
}: {
  completed: boolean;
  active: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!active) {
      slideAnim.stopAnimation();
      slideAnim.setValue(-1);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [active, slideAnim]);

  if (completed) {
    return (
      <View style={styles.lineTrack}>
        <View style={styles.completedStaticLine} />
      </View>
    );
  }

  if (!active) {
    return <View style={styles.lineTrack} />;
  }

  return (
    <View style={styles.lineTrack}>
      <Animated.View
        style={[
          styles.movingLineFill,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-60, 60],
                }),
              },
            ],
          },
        ]}
      />
    </View>
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
    minHeight: 60,
  },

  timelineLeft: {
    width: 34,
    alignItems: 'center',
  },

  completedDotCircle: {
    width: 22,
    height: 22,
    borderRadius: 15,
    backgroundColor: '#F05822',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },

  completedDotTick: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 24,
  },

  currentDotRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#F05822',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },

  currentDotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F05822',
  },

  pendingDotCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginTop: 3,
  },

  lineTrack: {
    width: 3,
    flex: 1,
    marginTop: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  completedStaticLine: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F05822',
    borderRadius: 2,
  },

  movingLineFill: {
    width: '100%',
    height: 40,
    backgroundColor: '#F05822',
    borderRadius: 2,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
  },

  stepLabel: {
    fontSize: 15,
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
    width: 165,
    height: 165,
  },

  footerArea: {
    paddingTop: 8,
  },

  readyButton: {
    backgroundColor: '#000000',
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
    marginTop: 10,
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