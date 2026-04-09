import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { CartItem } from '../../types/cart';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const {
    cartItems,
    subtotal,
    serviceCharge,
    total,
    updateCartItemQty,
    removeCartItem,
    selectedTable,
    placeOrder,
  } = useAppContext();

  const [confirmSheetVisible, setConfirmSheetVisible] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const confirmSheetTranslateY = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (confirmSheetVisible) {
      confirmSheetTranslateY.setValue(320);
      Animated.timing(confirmSheetTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [confirmSheetVisible, confirmSheetTranslateY]);

  const openConfirmSheet = () => {
    if (cartItems.length === 0) {
      return;
    }
    setConfirmSheetVisible(true);
  };

  const closeConfirmSheet = () => {
    Animated.timing(confirmSheetTranslateY, {
      toValue: 320,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setConfirmSheetVisible(false);
    });
  };

  const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);
      closeConfirmSheet();

      const success = await placeOrder();

      if (success) {
        navigation.navigate('OrderDetails', {
          orderId: undefined,
        });
      } else {
        Alert.alert('Order placement failed');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemTopRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>

          <Text style={styles.itemMeta}>
            LKR {item.price}
          </Text>

          {item.variantName ? (
            <Text style={styles.itemSubText}>
              Variant: {item.variantName}
            </Text>
          ) : null}

          {item.selectedAddOns && item.selectedAddOns.length > 0 ? (
            <Text style={styles.itemSubText}>
              Add-ons: {item.selectedAddOns
                .map((addOn) => addOn.addOnName)
                .join(', ')}
            </Text>
          ) : null}

          {item.note ? (
            <Text style={styles.itemSubText}>
              Note: {item.note}
            </Text>
          ) : null}
        </View>

        <Pressable
          style={styles.removeButton}
          onPress={() => removeCartItem(item.id)}
        >
          <Text style={styles.removeButtonText}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.qtyRow}>
        <Pressable
          style={styles.qtyButton}
          onPress={() => updateCartItemQty(item.id, 'dec')}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </Pressable>

        <Text style={styles.qtyText}>{item.qty}</Text>

        <Pressable
          style={styles.qtyButton}
          onPress={() => updateCartItemQty(item.id, 'inc')}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>

        <Text style={styles.itemTotal}>LKR {item.qty * item.price}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <Text style={styles.topTableText}>
            {selectedTable ? `Table ${selectedTable.number}` : '--'}
          </Text>

          <Text style={styles.topTitle}>Cart</Text>

          <View style={styles.topBottomRow}>
            <View>
              <Text style={styles.topMetaText}>
                Items : {cartItems.length}
              </Text>
            </View>

            <Text style={styles.topMetaText}>
              Ready to Place
            </Text>
          </View>
        </View>

        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyText}>
                Add items from the menu to continue.
              </Text>
            </View>
          }
        />

        <View style={styles.bottomSection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>LKR {subtotal}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Charge</Text>
              <Text style={styles.summaryValue}>LKR {serviceCharge}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>LKR {total}</Text>
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
              onPress={openConfirmSheet}
              disabled={placingOrder}
            >
              <Text style={styles.buttonText}>
                {placingOrder ? 'Placing...' : 'Place Order'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Modal
          visible={confirmSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={closeConfirmSheet}
        >
          <View style={styles.confirmSheetOverlay}>
            <Pressable
              style={styles.confirmSheetBackdrop}
              onPress={closeConfirmSheet}
            />

            <Animated.View
              style={[
                styles.confirmSheetCard,
                { transform: [{ translateY: confirmSheetTranslateY }] },
              ]}
            >
              <Text style={styles.confirmSheetTitle}>Are you sure?</Text>

              <Text style={styles.confirmSheetSubText}>
                Place this order for Table {selectedTable?.number ?? '-'}?
              </Text>

              <Pressable
                style={styles.confirmYesButton}
                onPress={handlePlaceOrder}
                disabled={placingOrder}
              >
                <Text style={styles.confirmYesButtonText}>
                  {placingOrder ? 'Placing...' : 'Confirm Order'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmCancelButton}
                onPress={closeConfirmSheet}
                disabled={placingOrder}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </Pressable>
            </Animated.View>
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
    paddingBottom: 16,
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
    fontSize: 16,
    fontWeight: '400',
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

  listContent: {
    paddingBottom: 16,
  },

  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  itemMeta: {
    fontSize: 14,
    color: '#6B7280',
  },

  itemSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  removeButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },

  removeButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fbfaf9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },

  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },

  itemTotal: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '700',
    color: '#F05822',
  },

  bottomSection: {
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: 'rgb(255, 248, 245)',
    borderWidth: 1,
    borderColor: '#ffc1a9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  summaryLabel: {
    fontSize: 15,
    color: '#565c67',
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  totalRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#a5a5a7',
    marginBottom: 0,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F05822',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#7c7c7c',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#4b4b4b',
    fontSize: 15,
    fontWeight: '700',
  },

  button: {
    flex: 1,
    backgroundColor: '#F05822',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  confirmSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },

  confirmSheetBackdrop: {
    flex: 1,
  },

  confirmSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
  },

  confirmSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },

  confirmSheetSubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
  },

  confirmYesButton: {
    width: '100%',
    backgroundColor: '#F05822',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  confirmYesButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  confirmCancelButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmCancelButtonText: {
    color: '#4d4d4d',
    fontSize: 15,
    fontWeight: '700',
  },
});