import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getTables } from '../../services/api/tableApi';
import { useAppContext } from '../../context/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RestaurantTable, TableStatus as BaseTableStatus } from '../../types/table';

type Props = NativeStackScreenProps<RootStackParamList, 'TableDashboard'>;

type TableFilter = 'all' | 'free' | 'partially_occupied' | 'full';

export default function TableDashboardScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<TableFilter>('all');
  const { width } = useWindowDimensions();
  const { setSelectedTable, startNewOrderSession, logout, ensureValidToken} = useAppContext();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const numColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const filteredTables = useMemo(() => {
    if (filter === 'all') return tables;
    return tables.filter((table) => table.status === filter);
  }, [filter, tables]);

  const handleTablePress = async (table: RestaurantTable) => {
    if (table.status === 'free') {
      await startNewOrderSession(table);
      navigation.navigate('CustomerSelection');
      return;
    }

    setSelectedTable(table);
    navigation.navigate('OrderStatus');
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

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingTables(true);
        await loadTables();
      } finally {
        setLoadingTables(false);
      }
    };

    init();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTables();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };
  

  const renderTable = ({ item }: { item: RestaurantTable }) => {
    const statusStyle =
      item.status === 'free'
        ? styles.freeCard
        : item.status === 'partially_occupied'
        ? styles.partialCard
        : styles.fullCard;

    const statusTextStyle =
      item.status === 'free'
        ? styles.freeText
        : item.status === 'partially_occupied'
        ? styles.partialText
        : styles.fullText;

    return (
      <Pressable
        style={[styles.tableCard, statusStyle]}
        onPress={() => handleTablePress(item)}
      >
        <Text style={styles.tableNumber}>
          {item.name ?? `Table ${item.number}`}
        </Text>

        <Text style={[styles.tableStatus, statusTextStyle]}>
          {item.status === 'free'
            ? 'FREE'
            : item.status === 'partially_occupied'
            ? 'NOT FULL'
            : 'FULL'}
        </Text>

        {item.capacity ? (
          <Text style={styles.capacityText}>
            Capacity: {item.capacity}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  if (loadingTables) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>
          Loading tables...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Tables</Text>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <FilterButton
          label="All"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />

        <FilterButton
          label="Free"
          active={filter === 'free'}
          onPress={() => setFilter('free')}
        />

        <FilterButton
          label="Not Full"
          active={filter === 'partially_occupied'}
          onPress={() => setFilter('partially_occupied')}
        />

        <FilterButton
          label="Full"
          active={filter === 'full'}
          onPress={() => setFilter('full')}
        />
      </View>

      <FlatList
        key={numColumns}
        data={filteredTables}
        keyExtractor={(item) => item.id}
        renderItem={renderTable}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

type FilterButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterButton({ label, active, onPress }: FilterButtonProps) {
  return (
    <Pressable style={[styles.filterButton, active && styles.activeFilterButton]} onPress={onPress}>
      <Text style={[styles.filterButtonText, active && styles.activeFilterButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  activeFilterButton: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  logoutButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  
  listContent: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableCard: {
    flex: 1,
    minHeight: 110,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  // reservedCard: {
  //   backgroundColor: '#FFF7ED',
  //   borderColor: '#FDBA74',
  // },
  // occupiedCard: {
  //   backgroundColor: '#FEF2F2',
  //   borderColor: '#FECACA',
  // },
  tableNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  tableStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  freeText: {
    color: '#15803D',
  },
  // reservedText: {
  //   color: '#C2410C',
  // },
  // occupiedText: {
  //   color: '#B91C1C',
  // },
  freeCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  partialCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },

  fullCard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },

  partialText: {
    color: '#92400E',
  },

  fullText: {
    color: '#991B1B',
  },

  capacityText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
});