import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { tables } from '../../data/mock/tables';
import { RestaurantTable, TableStatus as BaseTableStatus } from '../../types/table';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TableDashboard'>;

type TableFilter = 'all' | BaseTableStatus;

export default function TableDashboardScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<TableFilter>('all');
  const { width } = useWindowDimensions();
  const { setSelectedTable, clearCart, startNewOrderSession, logout} = useAppContext();

  const numColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const filteredTables = useMemo(() => {
    if (filter === 'all') return tables;
    return tables.filter((table) => table.status === filter);
  }, [filter]);

  const handleTablePress = (table: RestaurantTable) => {
    if (table.status === 'free') {
      startNewOrderSession(table);
      navigation.navigate('Category');
      return;
    }

    setSelectedTable(table);
    navigation.navigate('OrderStatus');
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
        : item.status === 'booked'
        ? styles.reservedCard
        : styles.occupiedCard;

    const statusTextStyle =
      item.status === 'free'
        ? styles.freeText
        : item.status === 'booked'
        ? styles.reservedText
        : styles.occupiedText;

    return (
      <Pressable
        style={[styles.tableCard, statusStyle]}
        onPress={() => handleTablePress(item)}
      >
        <Text style={styles.tableNumber}>Table {item.number}</Text>
        <Text style={[styles.tableStatus, statusTextStyle]}>
          {item.status.toUpperCase()}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Tables</Text>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <FilterButton label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterButton label="Free" active={filter === 'free'} onPress={() => setFilter('free')} />
        <FilterButton
          label="Reserved"
          active={filter === 'booked'}
          onPress={() => setFilter('booked')}
        />
        {/* <FilterButton
          label="Occupied"
          active={filter === 'booked'}
          onPress={() => setFilter('booked')}
        /> */}
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
  freeCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  reservedCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  occupiedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
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
  reservedText: {
    color: '#C2410C',
  },
  occupiedText: {
    color: '#B91C1C',
  },
});