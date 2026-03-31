import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Customer } from '../../types/customer';
import { getCustomers, addCustomer } from '../../services/api/customerApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerSelection'>;

export default function CustomerSelectionScreen({ navigation }: Props) {
  const {
    ensureValidToken,
    selectedTable,
    selectedCustomer,
    setSelectedCustomer,
  } = useAppContext();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const walkInCustomer: Customer = {
    id: '1',
    name: 'Walkin',
    phone: '0774125879',
    membershipName: null,
  };

  const loadCustomers = async (name?: string, phone?: string) => {
    try {
      const token = await ensureValidToken();
      const data = await getCustomers(token || undefined, {
        customer_name: name,
        customer_phone: phone,
      });

      const merged = [walkInCustomer, ...data.filter((c) => c.id !== '1')];
      setCustomers(merged);

      if (!selectedCustomer) {
        setSelectedCustomer(walkInCustomer);
      }
    } catch (error: any) {
      Alert.alert(
        'Failed to load customers',
        error?.message || 'Please try again'
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingCustomers(true);
        await loadCustomers();
      } finally {
        setLoadingCustomers(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCustomers(searchName, searchPhone);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchName, searchPhone]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleContinue = () => {
    if (!selectedCustomer) {
      Alert.alert('Please select a customer');
      return;
    }

    navigation.navigate('Category');
  };

  const handleAddCustomer = async () => {
    if (!searchName.trim() || !searchPhone.trim()) {
      Alert.alert('Enter customer name and phone');
      return;
    }

    try {
      setCreatingCustomer(true);

      const token = await ensureValidToken();

      const response = await addCustomer(
        {
          customer_name: searchName.trim(),
          customer_phone: searchPhone.trim(),
        },
        token || undefined
      );

      const newCustomer: Customer = {
        id: String(response.customer_id),
        name: searchName.trim(),
        phone: searchPhone.trim(),
        membershipName: null,
      };

      setSelectedCustomer(newCustomer);
      await loadCustomers(searchName, searchPhone);

      Alert.alert('Success', 'Customer created successfully');
    } catch (error: any) {
      Alert.alert(
        'Failed to create customer',
        error?.message || 'Please try again'
      );
    } finally {
      setCreatingCustomer(false);
    }
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const isSelected = selectedCustomer?.id === item.id;

    return (
      <Pressable
        style={[styles.customerCard, isSelected && styles.selectedCustomerCard]}
        onPress={() => handleSelectCustomer(item)}
      >
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerPhone}>{item.phone}</Text>
        {item.membershipName ? (
          <Text style={styles.membershipText}>{item.membershipName}</Text>
        ) : null}
      </Pressable>
    );
  };

  if (loadingCustomers) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Customer</Text>

      {selectedTable ? (
        <Text style={styles.subText}>Table {selectedTable.number}</Text>
      ) : null}

      <Text style={styles.subText}>Customer type: Dine-in</Text>

      <TextInput
        style={styles.input}
        placeholder="Search by name"
        placeholderTextColor="#9CA3AF"
        value={searchName}
        onChangeText={setSearchName}
      />

      <TextInput
        style={styles.input}
        placeholder="Search by phone"
        placeholderTextColor="#9CA3AF"
        value={searchPhone}
        onChangeText={setSearchPhone}
        keyboardType="phone-pad"
      />

      <Pressable
        style={styles.addButton}
        onPress={handleAddCustomer}
        disabled={creatingCustomer}
      >
        <Text style={styles.addButtonText}>
          {creatingCustomer ? 'Adding...' : 'Add Customer'}
        </Text>
      </Pressable>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No customers found.</Text>
          </View>
        }
      />

      <Pressable style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
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
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 16,
  },
  customerCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  selectedCustomerCard: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  membershipText: {
    fontSize: 13,
    color: '#F97316',
    marginTop: 6,
    fontWeight: '600',
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
  continueButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});