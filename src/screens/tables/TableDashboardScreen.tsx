import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { getTables } from '../../services/api/tableApi';
import { getActiveOrdersByTable } from '../../services/api/orderApi';
import { useAppContext } from '../../context/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RestaurantTable } from '../../types/table';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'TableDashboard'>;

type TableFilter = 'all' | 'free' | 'partially_occupied' | 'full';

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 772;

export default function TableDashboardScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<TableFilter>('all');
  const { width, height } = useWindowDimensions();
  const {
    setSelectedTable,
    startNewOrderSession,
    logout,
    ensureValidToken,
    selectedPersonCount,
    setSelectedPersonCount,
    selectedWaiter,
  } = useAppContext();

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [personCountModalVisible, setPersonCountModalVisible] = useState(false);
  const [pendingTable, setPendingTable] = useState<RestaurantTable | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const personSheetAnim = useState(new Animated.Value(320))[0];
  const logoutSheetAnim = useState(new Animated.Value(320))[0];

  const scaleW = width / DESIGN_WIDTH;
  const scaleH = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleW, scaleH);

  const numColumns = width >= 900 ? 4 : 3;

  const filteredTables = useMemo(() => {
    if (filter === 'all') return tables;
    return tables.filter((table) => table.status === filter);
  }, [filter, tables]);

  const handleTablePress = async (table: RestaurantTable) => {
    try {
      const token = await ensureValidToken();

      const activeOrders = await getActiveOrdersByTable(
        Number(table.id),
        token || undefined
      );

      const activeTableOrders = activeOrders.data.filter(
        (order) => ![4, 5].includes(order.order_status)
      );

      if (activeTableOrders.length > 0) {
        setSelectedTable(table);

        navigation.navigate('TableOrders', {
          tableId: Number(table.id),
          tableName: table.name ?? `Table ${table.number}`,
          tableStatus: table.status,
        });

        return;
      }
    } catch (error: any) {
      const message = error?.message || '';

      if (
        message.toLowerCase().includes('active order not found') ||
        message.toLowerCase().includes('404')
      ) {
        // continue to new-order flow
      } else {
        Alert.alert('Failed to load table order', message || 'Please try again');
        return;
      }
    }

    const maxAllowed = getMaxAllowedPeople(table);

    if (maxAllowed <= 0) {
      Alert.alert('Table is full');
      return;
    }

    setPendingTable(table);
    setSelectedPersonCount(1);
    setPersonCountModalVisible(true);
  };

  const handleConfirmPersonCount = async () => {
    if (!pendingTable) return;

    await startNewOrderSession(pendingTable);
    setPersonCountModalVisible(false);
    navigation.navigate('CustomerSelection');
  };

  const handleDecreasePersonCount = () => {
    setSelectedPersonCount(Math.max(1, selectedPersonCount - 1));
  };

  const handleIncreasePersonCount = () => {
    if (!pendingTable) return;

    const maxAllowed = getMaxAllowedPeople(pendingTable);
    setSelectedPersonCount(Math.min(maxAllowed, selectedPersonCount + 1));
  };

  const loadTables = async () => {
    try {
      const token = await ensureValidToken();
      const data = await getTables(token || undefined);
      setTables(data);
    } catch (error: any) {
      Alert.alert('Failed to load tables', error?.message || 'Please try again');
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshTables = async () => {
        try {
          setLoadingTables(true);
          await loadTables();
        } finally {
          if (isActive) {
            setLoadingTables(false);
          }
        }
      };

      refreshTables();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const getMaxAllowedPeople = (table: RestaurantTable) => {
    if (
      typeof table.remainingCapacity === 'number' &&
      table.remainingCapacity > 0
    ) {
      return table.remainingCapacity;
    }

    return table.capacity ?? 1;
  };

  useEffect(() => {
    Animated.timing(personSheetAnim, {
      toValue: personCountModalVisible ? 0 : 320,
      duration: personCountModalVisible ? 260 : 180,
      easing: personCountModalVisible
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [personCountModalVisible, personSheetAnim]);

  useEffect(() => {
    Animated.timing(logoutSheetAnim, {
      toValue: logoutModalVisible ? 0 : 320,
      duration: logoutModalVisible ? 260 : 180,
      easing: logoutModalVisible
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [logoutModalVisible, logoutSheetAnim]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTables();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);

    logout();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const getTableIcon = (status: RestaurantTable['status']) => {
    if (status === 'free') {
      return require('../../../assets/tables/table-free.png');
    }

    if (status === 'partially_occupied') {
      return require('../../../assets/tables/table-not-full.png');
    }

    return require('../../../assets/tables/table-full.png');
  };

  const getFilterLabel = () => {
    if (filter === 'free') return 'Free Tables';
    if (filter === 'partially_occupied') return 'Not Full Tables';
    if (filter === 'full') return 'Full Tables';
    return 'All Tables';
  };

  const horizontalListPadding = 22 * scaleW;
  const cardGap = 12 * scaleW;

  const cardSize =
    (width - horizontalListPadding * 2 - cardGap * (numColumns - 1)) / numColumns;


  const renderTable = ({ item }: { item: RestaurantTable }) => {
    const cardBg =
      item.status === 'free'
        ? '#DDDDDD'
        : item.status === 'partially_occupied'
        ? '#f9dea9'
        : '#FF9D92';

    const cornerBg =
      item.status === 'free'
        ? '#AAAAAA'
        : item.status === 'partially_occupied'
        ? '#bd611a'
        : '#9F0C00';

    return (
      <Pressable
        style={[
          styles.tableCard,
          {
            backgroundColor: cardBg,
            width: cardSize,
            height: cardSize,
            borderRadius: 16 * scale,
            marginBottom: 14 * scaleH,
          },
        ]}
        onPress={() => handleTablePress(item)}
      >
        <View
          style={[
            styles.tableCorner,
            {
              backgroundColor: cornerBg,
              width: 40 * scale,
              height: 40 * scale,
              borderBottomLeftRadius: 28 * scale,
              borderTopRightRadius: 16 * scale,
            },
          ]}
        >
          <Text
            style={[
              styles.tableNumber,
              {
                fontSize: 14 * scale,
              },
            ]}
          >
            {item.number}
          </Text>
        </View>

        <Image
          source={getTableIcon(item.status)}
          style={{
            width: 82 * scale,
            height: 64 * scaleH,
            marginTop: 30 * scaleH,
          }}
          resizeMode="contain"
        />
      </Pressable>
    );
  };


  if (loadingTables) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingWrap,
        ]}
      >
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#F05A22" />
        <Text style={styles.loadingText}>Loading tables...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.topHeader,
          {
            marginTop: 0,
            marginHorizontal: 6 * scaleW,
            minHeight: 60 * scaleH,
            borderRadius: 10 * scale,
            paddingHorizontal: 8 * scaleW,
          },
        ]}
      >
        <View style={styles.leftHeader}>
          <Image
            source={require('../../../assets/logo-icon.png')}
            style={{
              width: 42 * scale,
              height: 42 * scale,
              marginRight: 5 * scaleW,
            }}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.waiterName,
              {
                fontSize: 12 * scale,
              },
            ]}
            numberOfLines={2}
          >
            {selectedWaiter?.email || selectedWaiter?.name || 'Waiter 01'}
          </Text>
        </View>

        <View style={styles.rightHeader}>
          {/* <Pressable style={styles.headerAction}>
            <Text
              style={[
                styles.statsText,
                {
                  fontSize: 13 * scale,
                },
              ]}
            >
              Your Stats
            </Text>
          </Pressable> */}

          <Pressable style={styles.headerAction} onPress={handleLogout}>
            <Text
              style={[
                styles.logoutText,
                {
                  fontSize: 13 * scale,
                },
              ]}
            >
              Logout
            </Text>
          </Pressable>
        </View>
      </View>

      <Text
        style={[
          styles.screenTitle,
          {
            fontSize: 16 * scale,
            marginTop: 20 * scaleH,
            marginBottom: 20 * scaleH,
          },
        ]}
      >
        {getFilterLabel()}
      </Text>

      <FlatList
        key={numColumns}
        data={filteredTables}
        keyExtractor={(item) => item.id}
        renderItem={renderTable}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: horizontalListPadding,
            paddingBottom: 110 * scaleH,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <View
        style={[
          styles.bottomFilterBar,
          {
            width: '72%',
            alignSelf: 'center',
            height: 62 * scaleH,
            borderTopLeftRadius: 22 * scale,
            borderTopRightRadius: 22 * scale,
            paddingHorizontal: 18 * scaleW,
            paddingBottom: 6 * scaleH,
            marginBottom: 0,

          },
        ]}
      >
        <BottomTab
          label="All"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
          scale={scale}
        />
        <BottomTab
          label="Free"
          active={filter === 'free'}
          onPress={() => setFilter('free')}
          scale={scale}
        />
        <BottomTab
          label="Not Full"
          active={filter === 'partially_occupied'}
          onPress={() => setFilter('partially_occupied')}
          scale={scale}
        />
        <BottomTab
          label="Full"
          active={filter === 'full'}
          onPress={() => setFilter('full')}
          scale={scale}
        />
      </View>

      <Modal
        visible={personCountModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setPersonCountModalVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable
            style={styles.bottomSheetBackdrop}
            onPress={() => setPersonCountModalVisible(false)}
          />

          <Animated.View
            style={[
              styles.bottomSheetCard,
              {
                paddingVertical: 28 * scaleH,
                paddingHorizontal: 24 * scaleW,
                transform: [{ translateY: personSheetAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  fontSize: 18 * scale,
                  marginBottom: 8 * scaleH,
                },
              ]}
            >
              Table Person Count
            </Text>

            {pendingTable ? (
              <Text
                style={[
                  styles.modalSubText,
                  {
                    fontSize: 14 * scale,
                    marginBottom: 24 * scaleH,
                  },
                ]}
              >
                Max allowed: {getMaxAllowedPeople(pendingTable)}
              </Text>
            ) : null}

            <View
              style={[
                styles.personCountRow,
                {
                  marginBottom: 28 * scaleH,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.personCountButton,
                  {
                    width: 50 * scale,
                    height: 50 * scaleH,
                    borderRadius: 14 * scale,
                  },
                ]}
                onPress={handleDecreasePersonCount}
              >
                <Text
                  style={[
                    styles.personCountButtonText,
                    {
                      fontSize: 20 * scale,
                    },
                  ]}
                >
                  -
                </Text>
              </Pressable>

              <View
                style={[
                  styles.personCountValueBox,
                  {
                    minWidth: 74 * scale,
                    height: 66 * scaleH,
                    borderRadius: 14 * scale,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.personCountValueText,
                    {
                      fontSize: 24 * scale,
                    },
                  ]}
                >
                  {selectedPersonCount}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.personCountButton,
                  {
                    width: 50 * scale,
                    height: 50 * scaleH,
                    borderRadius: 14 * scale,
                  },
                ]}
                onPress={handleIncreasePersonCount}
              >
                <Text
                  style={[
                    styles.personCountButtonText,
                    {
                      fontSize: 20 * scale,
                    },
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.confirmPersonButton,
                {
                  paddingVertical: 14 * scaleH,
                  borderRadius: 14 * scale,
                  marginBottom: 10 * scaleH,
                },
              ]}
              onPress={handleConfirmPersonCount}
            >
              <Text
                style={[
                  styles.confirmPersonButtonText,
                  {
                    fontSize: 16 * scale,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.cancelPersonButton,
                {
                  paddingVertical: 12 * scaleH,
                  borderRadius: 14 * scale,
                },
              ]}
              onPress={() => setPersonCountModalVisible(false)}
            >
              <Text
                style={[
                  styles.cancelPersonButtonText,
                  {
                    fontSize: 15 * scale,
                  },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable
            style={styles.bottomSheetBackdrop}
            onPress={() => setLogoutModalVisible(false)}
          />

          <Animated.View
            style={[
              styles.bottomSheetCard,
              {
                transform: [{ translateY: logoutSheetAnim }],
              },
            ]}
          >
            <Text style={styles.logoutSheetTitle}>Are you sure?</Text>

            <Pressable
              style={styles.logoutYesButton}
              onPress={confirmLogout}
            >
              <Text style={styles.logoutYesButtonText}>Yes</Text>
            </Pressable>

            <Pressable
              style={styles.logoutCancelButton}
              onPress={() => setLogoutModalVisible(false)}
            >
              <Text style={styles.logoutCancelButtonText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

type BottomTabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  scale: number;
};

function BottomTab({ label, active, onPress, scale }: BottomTabProps) {
  return (
    <Pressable style={styles.bottomTab} onPress={onPress}>
      <Text
        style={[
          styles.bottomTabText,
          active && styles.bottomTabTextActive,
          {
            fontSize: 14 * scale,
          },
        ]}
      >
        {label}
      </Text>
      {active ? <View style={styles.bottomTabUnderline} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },

  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontSize: 15,
  },

  topHeader: {
    backgroundColor: '#F55A1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  headerAction: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  waiterName: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSerif-Regular',
    fontStyle: 'italic',
    flexShrink: 1,
  },

  statsText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  logoutText: {
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  screenTitle: {
    textAlign: 'center',
    color: '#F05A22',
    fontFamily: 'Inter',
    fontWeight: '700',
  },

  listContent: {
    paddingTop: 0,
  },

  row: {
    justifyContent: 'flex-start',
    gap: 12,
  },

  tableCard: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },

  tableCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  tableNumber: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '700',
    marginTop: 2,
  },

  bottomFilterBar: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#000000',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  bottomTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },

  bottomTabText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '400',
  },

  bottomTabTextActive: {
    color: '#F55A1F',
    fontWeight: '600',
  },

  bottomTabUnderline: {
    marginTop: 8,
    width: 48,
    height: 2,
    backgroundColor: '#F55A1F',
    borderRadius: 999,
  },

  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },

  bottomSheetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 24,
    marginBottom: 0,
  },

  modalTitle: {
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '700',
    textAlign: 'center',
  },

  modalSubText: {
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },

  personCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },

  personCountButton: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  personCountButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '700',
    lineHeight: 36,
  },

  personCountValueBox: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  personCountValueText: {
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '700',
  },

  confirmPersonButton: {
    width: '100%',
    backgroundColor: '#F05822',
    alignItems: 'center',
  },

  confirmPersonButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '700',
  },

  cancelPersonButton: {
    width: '100%',
    alignItems: 'center',
  },

  cancelPersonButtonText: {
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '600',
  },

  logoutSheetTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#111111',
    marginBottom: 26,
  },

  logoutYesButton: {
    width: '100%',
    backgroundColor: '#F55A1F',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },

  logoutYesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
  },

  logoutCancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutCancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});