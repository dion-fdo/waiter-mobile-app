import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Waiter } from '../../types/waiter';
import { getWaiters } from '../../services/api/waiterApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterSelection'>;

export default function WaiterSelectionScreen({ navigation }: Props) {
  const { ensureValidToken, setSelectedWaiter } = useAppContext();

  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loadingWaiters, setLoadingWaiters] = useState(true);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);

  const loadWaiters = async () => {
    try {
      const token = await ensureValidToken();
      const data = await getWaiters(token || undefined);
      setWaiters(data);
    } catch (error: any) {
      Alert.alert(
        'Failed to load waiters',
        error?.message || 'Please try again'
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingWaiters(true);
        await loadWaiters();
      } finally {
        setLoadingWaiters(false);
      }
    };

    init();
  }, []);

  const filteredWaiters = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return waiters;

    return waiters.filter((waiter) =>
      (waiter.email || waiter.name).toLowerCase().includes(keyword)
    );
  }, [searchText, waiters]);

  const handleContinue = () => {
    const waiter = waiters.find((item) => item.id === selectedWaiterId);

    if (!waiter) {
      Alert.alert('Please select a waiter');
      return;
    }

    setSelectedWaiter(waiter);

    navigation.navigate('WaiterPin', {
      waiterName: waiter.email || waiter.name,
    });
  };

  const renderWaiter = ({ item }: { item: Waiter }) => {
    const isSelected = selectedWaiterId === item.id;

    return (
      <Pressable
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => setSelectedWaiterId(item.id)}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {item.email || item.name}
        </Text>
      </Pressable>
    );
  };

  if (loadingWaiters) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading waiters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiter Login</Text>
      <Text style={styles.subtitle}>Select a waiter to continue</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search waiter..."
        placeholderTextColor="#9CA3AF"
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredWaiters}
        keyExtractor={(item) => item.id}
        renderItem={renderWaiter}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No waiters found.</Text>
          </View>
        }
      />

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#FDBA74',
    borderColor: '#F97316',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  selectedItemText: {
    color: '#111827',
    fontWeight: '700',
  },
  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});