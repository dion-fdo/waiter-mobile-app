import React, { useEffect, useState, useMemo, useRef } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Customer } from '../../types/customer';
import { getCustomers, addCustomer } from '../../services/api/customerApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerSelection'>;

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 772;

export default function CustomerSelectionScreen({ navigation }: Props) {
  const {
    ensureValidToken,
    selectedTable,
    selectedCustomer,
    setSelectedCustomer,
  } = useAppContext();

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scaleW = width / DESIGN_WIDTH;
  const scaleH = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleW, scaleH);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('1');

  const [addModalVisible, setAddModalVisible] = useState(false);

  const sheetTranslateY = useRef(new Animated.Value(300)).current;

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');

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
        setSelectedCustomerId('1');
      }
    } catch (error: any) {
      Alert.alert('Failed to load customers', error?.message || 'Please try again');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingCustomers(true);
        await loadCustomers();
        if (selectedCustomer) {
          setSelectedCustomerId(selectedCustomer.id);
        }
      } finally {
        setLoadingCustomers(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (searchName === '' && searchPhone === '') return;
    const timeout = setTimeout(() => {
      loadCustomers(searchName, searchPhone);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchName, searchPhone]);

  useEffect(() => {
    if (addModalVisible) {
      sheetTranslateY.setValue(300);
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [addModalVisible, sheetTranslateY]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerId(customer.id);
  };

  const handleContinue = () => {
    if (!selectedCustomer) {
      Alert.alert('Please select a customer');
      return;
    }
    navigation.navigate('Category');
  };

  const handleAddCustomer = async () => {
    let valid = true;

    if (!newCustomerName.trim()) {
      setNameError('Customer name is required!');
      valid = false;
    }

    if (!newCustomerPhone.trim()) {
      setPhoneError('Phone number is required!');
      valid = false;
    } else if (!/^0[0-9]{9}$/.test(newCustomerPhone.trim())) {
      setPhoneError('Enter a valid 10-digit phone number starting with 0.');
      valid = false;
    }

    if (!valid) return;

    try {
      setCreatingCustomer(true);
      const token = await ensureValidToken();
      const response = await addCustomer(
        {
          customer_name: newCustomerName.trim(),
          customer_phone: newCustomerPhone.trim(),
        },
        token || undefined
      );
      const newCustomer: Customer = {
        id: String(response.customer_id),
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        membershipName: null,
      };
      setSelectedCustomer(newCustomer);
      setSelectedCustomerId(newCustomer.id);
      await loadCustomers();
      setNewCustomerName('');
      setNewCustomerPhone('');
      closeModal();
      Alert.alert('Success', 'Customer created successfully');
    } catch (error: any) {
      Alert.alert('Failed to create customer', error?.message || 'Please try again');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(keyword) ||
        c.phone.includes(keyword)
    );
  }, [searchText, customers]);

  const closeModal = () => {
    Animated.timing(sheetTranslateY, {
      toValue: 300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNameError('');
      setPhoneError('');
      setAddModalVisible(false);
    });
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const isSelected = selectedCustomer?.id === item.id;
    return (
      <Pressable
        style={[
          styles.customerCard,
          isSelected && styles.selectedCustomerCard,
          {
            borderRadius: 14 * scale,
            padding: 14 * scale,
            marginBottom: 10 * scaleH,
          },
        ]}
        onPress={() => handleSelectCustomer(item)}
      >
        <Text style={[styles.customerName, { fontSize: 16 * scale }]}>
          {item.name}
        </Text>
        <Text style={[styles.customerPhone, { fontSize: 14 * scale, marginTop: 4 * scaleH }]}>
          {item.phone}
        </Text>
        {item.membershipName ? (
          <Text style={[styles.membershipText, { fontSize: 13 * scale, marginTop: 6 * scaleH }]}>
            {item.membershipName}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  if (loadingCustomers) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            styles.centered,
            {
              paddingTop: 16 * scaleH,
              paddingHorizontal: 16 * scaleW,
            },
          ]}
        >
          <ActivityIndicator size="large" />
          <Text
            style={[
              styles.loadingText,
              { fontSize: 14 * scale, marginTop: 12 * scaleH },
            ]}
          >
            Loading customers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          {
            paddingTop: 8 * scaleH,
            paddingHorizontal: 16 * scaleW,
          },
        ]}
      >
        <View style={styles.topContent}>
          <View
            style={[
              styles.topCard,
              {
                borderRadius: 18 * scale,
                paddingVertical: 14 * scaleH,
                paddingHorizontal: 16 * scaleW,
                marginBottom: 16 * scaleH,
              },
            ]}
          >
            <View style={styles.topCardRow}>
              <Text style={[styles.topCardTableText, { fontSize: 17 * scale }]}>
                {selectedTable ? `Table ${selectedTable.number}` : '--'}
              </Text>

              <Pressable
                style={[
                  styles.addIconButton,
                  {
                    width: 34 * scale,
                    height: 34 * scale,
                    borderRadius: 10 * scale,
                  },
                ]}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={[styles.addIconText, { fontSize: 24 * scale }]}>+</Text>
              </Pressable>
            </View>

            <Text style={[styles.topTitle, { fontSize: 24 * scale, marginBottom: 10 * scaleH }]}>
              Select Customer
            </Text>

            <View style={styles.topBottomRow}>
              <View>
                <Text style={[styles.topMetaText, { fontSize: 14 * scale }]}>
                  Customer type : Dine-in
                </Text>
              </View>

              <Text style={[styles.topMetaText, { fontSize: 14 * scale }]}>
                {customers.length} Customers
              </Text>
            </View>
          </View>

          {!dropdownOpen ? (
            <Pressable
              style={[
                styles.closedInputContainer,
                {
                  borderRadius: 14 * scale,
                  paddingHorizontal: 14 * scaleW,
                  minHeight: 52 * scaleH,
                  marginBottom: 12 * scaleH,
                },
              ]}
              onPress={() => {
                setSearchText('');
                setDropdownOpen(true);
              }}
            >
              <Text
                style={[
                  styles.searchInput,
                  {
                    fontStyle: 'italic',
                    color: '#2E2E2E',
                    fontSize: 15 * scale,
                  },
                ]}
                numberOfLines={1}
              >
                {selectedCustomer?.name || 'Walkin'}
              </Text>

              <View style={styles.dropdownArrow}>
                <Image
                  source={require('../../../assets/icons/arrow-down.png')}
                  style={{
                    width: 28 * scale,
                    height: 28 * scale,
                    tintColor: '#F05822',
                  }}
                  resizeMode="contain"
                />
              </View>
            </Pressable>
          ) : (
            <View
              style={[
                styles.openDropdownCard,
                {
                  borderRadius: 18 * scale,
                  padding: 10 * scale,
                  maxHeight: height * 0.42,
                  marginBottom: 12 * scaleH,
                },
              ]}
            >
              <View
                style={[
                  styles.openSearchBar,
                  {
                    borderRadius: 12 * scale,
                    paddingHorizontal: 12 * scaleW,
                    minHeight: 50 * scaleH,
                    marginBottom: 10 * scaleH,
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.searchInputField,
                    { fontSize: 14 * scale, paddingVertical: 10 * scaleH },
                  ]}
                  placeholder={selectedCustomer?.name || 'Search by name or phone...'}
                  placeholderTextColor="#888888"
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />

                <View style={styles.searchIconWrap}>
                  <Image
                    source={require('../../../assets/icons/search.png')}
                    style={{
                      width: 20 * scale,
                      height: 20 * scale,
                      tintColor: '#F05822',
                    }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedCustomerId === item.id;
                  return (
                    <Pressable
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                        {
                          paddingVertical: 12 * scaleH,
                          paddingHorizontal: 12 * scaleW,
                          borderRadius: isSelected ? 10 * scale : 0,
                        },
                      ]}
                      onPress={() => {
                        setSelectedCustomer(item);
                        setSelectedCustomerId(item.id);
                        setSearchText('');
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                          { fontSize: 14 * scale },
                        ]}
                      >
                        {item.name}
                        <Text
                          style={{
                            color: '#6B7280',
                            fontWeight: '400',
                            fontSize: 13 * scale,
                          }}
                        >
                          {' '}({item.phone})
                        </Text>
                      </Text>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={[styles.emptyBox, { padding: 16 * scale }]}>
                    <Text style={[styles.emptyText, { fontSize: 14 * scale }]}>
                      No customers found.
                    </Text>
                  </View>
                }
              />

              <Pressable
                style={[styles.bottomArrowWrap, { marginTop: 8 * scaleH }]}
                onPress={() => {
                  setSearchText('');
                  setDropdownOpen(false);
                }}
                hitSlop={12}
              >
                <View style={styles.dropdownArrow}>
                  <Image
                    source={require('../../../assets/icons/arrow-up.png')}
                    style={{
                      width: 28 * scale,
                      height: 28 * scale,
                      tintColor: '#F05822',
                    }}
                    resizeMode="contain"
                  />
                </View>
              </Pressable>
            </View>
          )}
        </View>

        <View
          style={[
            styles.bottomSection,
            {
              paddingBottom: insets.bottom + 16 * scaleH,
              gap: 10 * scaleH,
            },
          ]}
        >
          <Pressable
            style={[
              styles.continueButton,
              {
                borderRadius: 14 * scale,
                paddingVertical: 15 * scaleH,
              },
            ]}
            onPress={handleContinue}
          >
            <Text style={[styles.continueButtonText, { fontSize: 16 * scale }]}>
              Continue
            </Text>
          </Pressable>
        </View>

        <Modal
          visible={addModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => closeModal()} />

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <Animated.View
                style={[
                  styles.bottomSheet,
                  {
                    borderTopLeftRadius: 28 * scale,
                    borderTopRightRadius: 28 * scale,
                    paddingHorizontal: 24 * scaleW,
                    paddingTop: 20 * scaleH,
                    paddingBottom:
                      insets.bottom + 24 * scaleH,
                    transform: [{ translateY: sheetTranslateY }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.dragHandle,
                    {
                      width: 40 * scaleW,
                      height: 4 * scaleH,
                      marginBottom: 20 * scaleH,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.modalTitle,
                    { fontSize: 18 * scale, marginBottom: 20 * scaleH },
                  ]}
                >
                  Add Customer
                </Text>

                <Text
                  style={[
                    styles.modalLabel,
                    { fontSize: 13 * scale, marginBottom: 6 * scaleH },
                  ]}
                >
                  Customer Name
                </Text>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      fontSize: 15 * scale,
                      borderRadius: 12 * scale,
                      paddingHorizontal: 14 * scaleW,
                      paddingVertical: 12 * scaleH,
                      marginBottom: nameError ? 4 * scaleH : 16 * scaleH,
                      borderColor: nameError ? '#EF4444' : '#E5E7EB',
                    },
                  ]}
                  placeholder="Enter customer name"
                  placeholderTextColor="#9CA3AF"
                  value={newCustomerName}
                  onChangeText={(text) => {
                    setNewCustomerName(text);
                    if (text.trim().length > 0) setNameError('');
                  }}
                />

                {nameError ? (
                  <Text
                    style={[
                      styles.validationError,
                      { fontSize: 12 * scale, marginBottom: 12 * scaleH },
                    ]}
                  >
                    {nameError}
                  </Text>
                ) : null}

                <Text
                  style={[
                    styles.modalLabel,
                    { fontSize: 13 * scale, marginBottom: 6 * scaleH },
                  ]}
                >
                  Phone Number
                </Text>

                {phoneError ? (
                  <Text
                    style={[
                      styles.validationError,
                      { fontSize: 12 * scale, marginBottom: 4 * scaleH },
                    ]}
                  >
                    {phoneError}
                  </Text>
                ) : null}

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      fontSize: 15 * scale,
                      borderRadius: 12 * scale,
                      paddingHorizontal: 14 * scaleW,
                      paddingVertical: 12 * scaleH,
                      marginBottom: 24 * scaleH,
                      borderColor: phoneError ? '#EF4444' : '#E5E7EB',
                    },
                  ]}
                  placeholder="07XXXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  value={newCustomerPhone}
                  onChangeText={(text) => {
                    const numericOnly = text.replace(/[^0-9]/g, '');
                    setNewCustomerPhone(numericOnly);

                    if (numericOnly.length === 0) {
                      setPhoneError('');
                    } else if (!/^\d+$/.test(numericOnly)) {
                      setPhoneError('Only numbers are allowed.');
                    } else if (numericOnly.length < 10 || numericOnly.length > 10) {
                      setPhoneError('Phone number must be exactly 10 digits.');
                    } else if (!/^0[0-9]{9}$/.test(numericOnly)) {
                      setPhoneError('Phone number must start with 0 (e.g. 07XXXXXXXX).');
                    } else {
                      setPhoneError('');
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <Pressable
                  style={[
                    styles.modalAddButton,
                    {
                      borderRadius: 12 * scale,
                      paddingVertical: 14 * scaleH,
                      marginBottom: 12 * scaleH,
                    },
                  ]}
                  onPress={handleAddCustomer}
                  disabled={creatingCustomer}
                >
                  <Text
                    style={[
                      styles.modalAddButtonText,
                      { fontSize: 16 * scale },
                    ]}
                  >
                    {creatingCustomer ? 'Adding...' : 'Add Customer'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalCancelButton,
                    {
                      borderRadius: 12 * scale,
                      paddingVertical: 14 * scaleH,
                    },
                  ]}
                  onPress={() => {
                    setNewCustomerName('');
                    setNewCustomerPhone('');
                    closeModal();
                  }}
                >
                  <Text
                    style={[
                      styles.modalCancelButtonText,
                      { fontSize: 16 * scale },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </Animated.View>
            </KeyboardAvoidingView>
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
  },

  topContent: {
    flex: 1,
  },

  bottomSection: {},

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#6B7280',
  },

  topCard: {
    backgroundColor: '#F05822',
  },

  topCardRow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  topCardTableText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },

  addIconButton: {
    position: 'absolute',
    right: 0,
    top: -2,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addIconText: {
    color: '#000000',
    fontWeight: '700',
    lineHeight: 24,
  },

  topTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  topBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  topMetaText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  subText: {
    color: '#6B7280',
  },

  closedInputContainer: {
    width: '100%',
    backgroundColor: '#F4F4F4',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  openDropdownCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  openSearchBar: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  searchInput: {
    flex: 1,
    color: '#111827',
  },

  searchInputField: {
    flex: 1,
    color: '#000',
  },

  dropdownItem: {},

  dropdownItemSelected: {
    backgroundColor: '#FFF7ED',
  },

  dropdownItemText: {
    color: '#111827',
  },

  dropdownItemTextSelected: {
    color: '#F05822',
    fontWeight: '600',
  },

  dropdownArrow: {
    color: '#F05822',
    marginLeft: 8,
  },

  bottomArrowWrap: {
    alignItems: 'flex-end',
  },

  emptyBox: {
    alignItems: 'center',
  },

  emptyText: {
    color: '#6B7280',
  },

  customerCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  selectedCustomerCard: {
    borderColor: '#F05822',
    backgroundColor: '#FFF7ED',
  },

  customerName: {
    fontWeight: '700',
    color: '#111827',
  },

  customerPhone: {
    color: '#6B7280',
  },

  membershipText: {
    color: '#F05822',
    fontWeight: '600',
  },

  continueButton: {
    backgroundColor: '#F05822',
    alignItems: 'center',
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },

  modalBackdrop: {
    flex: 1,
  },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },

  dragHandle: {
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
  },

  modalTitle: {
    fontWeight: '700',
    color: '#F05822',
  },

  modalLabel: {
    color: '#6B7280',
    fontWeight: '500',
  },

  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },

  modalAddButton: {
    backgroundColor: '#F05822',
    alignItems: 'center',
  },

  modalAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  modalCancelButton: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },

  modalCancelButtonText: {
    color: '#373737',
    fontWeight: '600',
  },

  searchIconWrap: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  validationError: {
    color: '#EF4444',
    fontWeight: '500',
  },
});