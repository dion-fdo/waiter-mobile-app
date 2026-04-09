import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { CartItem } from '../../types/cart';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPlacedOrder'>;

export default function EditPlacedOrderScreen({ navigation }: Props) {
  const {
    placedOrder,
    editOrderItems,
    serviceCharge,
    editSubtotal,
    editTotal,
    updateEditOrderItemQty,
    removeEditOrderItem,
    confirmEditPlacedOrder,
    cancelEditPlacedOrder,
  } = useAppContext();

  const handleDelete = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEditOrderItem(id) },
    ]);
  };

  const handleConfirmEdit = () => {
    Alert.alert('Confirm Edit', 'Update this order now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          const success = await confirmEditPlacedOrder();

          if (success) {
            Alert.alert('Success', 'Order updated successfully');
            navigation.replace('OrderDetails', {
              orderId: placedOrder?.id ? Number(placedOrder.id) : undefined,
            });
          } else {
            Alert.alert('Update Failed', 'Could not update the order');
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    cancelEditPlacedOrder();
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemTopRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>LKR {item.price}</Text>

          {item.variantName ? (
            <Text style={styles.itemSubMeta}>Variant: {item.variantName}</Text>
          ) : null}

          {item.selectedAddOns && item.selectedAddOns.length > 0 ? (
            <Text style={styles.itemSubMeta}>
              Add-ons: {item.selectedAddOns.map((addOn) => addOn.addOnName).join(', ')}
            </Text>
          ) : null}

          {item.note ? (
            <Text style={styles.itemSubMeta}>Note: {item.note}</Text>
          ) : null}
        </View>

        <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.qtyRow}>
        <Pressable
          style={styles.qtyButton}
          onPress={() => updateEditOrderItemQty(item.id, 'dec')}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </Pressable>

        <Text style={styles.qtyText}>{item.qty}</Text>

        <Pressable
          style={styles.qtyButton}
          onPress={() => updateEditOrderItemQty(item.id, 'inc')}
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
          <View style={styles.topTableRow}>
            <Text style={styles.topTableText}>
              {placedOrder?.table ? `Table ${placedOrder.table.number}` : '--'}
            </Text>

            <Pressable
              style={styles.addIconButtonAbsolute}
              onPress={() => navigation.navigate('Category')}
            >
              <Text style={styles.addIconText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.topTitle}>Edit Order</Text>

          <View style={styles.topBottomRow}>
            <View>
              <Text style={styles.topMetaText}>
                Order ID : {placedOrder?.id ?? '--'}
              </Text>
              <Text style={styles.topMetaText}>
                Waiter : {placedOrder?.waiter?.name ?? 'Not selected'}
              </Text>
            </View>

            <Text style={styles.topMetaText}>
              Items {editOrderItems.length}
            </Text>
          </View>
        </View>

        <FlatList
          data={editOrderItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Items</Text>
              <Text style={styles.emptyText}>No items left in this order.</Text>
            </View>
          }
        />

        <View style={styles.bottomSection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>LKR {editSubtotal}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Charge</Text>
              <Text style={styles.summaryValue}>LKR {serviceCharge}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>LKR {editTotal}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={handleConfirmEdit}>
              <Text style={styles.buttonText}>Confirm Edit</Text>
            </Pressable>
          </View>
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
    paddingBottom: 5,
  },

  topCard: {
    backgroundColor: '#F05822',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  topTableRow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  topTableText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },

  addIconButtonAbsolute: {
    position: 'absolute',
    right: 0,
    top: -2,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffd2bb',
    justifyContent: 'center',
    alignItems: 'center',
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

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 10,
    marginBottom: 5,
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

  itemSubMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },

  deleteButtonText: {
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
    fontSize: 12,
    fontWeight: '700',
    color: '#F05822',
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

  bottomSection: {
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: 'rgb(255, 248, 245)',
    borderWidth: 1,
    borderColor: '#ffc1a9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
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
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '700',
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
    borderColor: '#000000',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#000000',
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

  addIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addIconText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
});