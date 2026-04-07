import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
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
    Alert.alert(
      'Confirm Edit',
      'Update this order now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const success = await confirmEditPlacedOrder();

            if (success) {
              Alert.alert('Success', 'Order updated successfully');
              navigation.replace('OrderDetails');
            } else {
              Alert.alert('Update Failed', 'Could not update the order');
            }
          },
        },
      ]
    );
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
        <Pressable style={styles.qtyButton} onPress={() => updateEditOrderItemQty(item.id, 'dec')}>
          <Text style={styles.qtyButtonText}>-</Text>
        </Pressable>

        <Text style={styles.qtyText}>{item.qty}</Text>

        <Pressable style={styles.qtyButton} onPress={() => updateEditOrderItemQty(item.id, 'inc')}>
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>

        <Text style={styles.itemTotal}>LKR {item.qty * item.price}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Placed Order</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Order ID: {placedOrder?.id ?? '--'}</Text>
        <Text style={styles.infoText}>
          Table: {placedOrder?.table ? String(placedOrder.table.number).padStart(2, '0') : '--'}
        </Text>
        <Text style={styles.infoText}>
          Waiter: {placedOrder?.waiter?.name ?? 'Not selected'}
        </Text>
      </View>

      <FlatList
        data={editOrderItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No items left in this order.</Text>
          </View>
        }
      />

      <Pressable
        style={styles.addMoreButton}
        onPress={() => navigation.navigate('Category')}
      >
        <Text style={styles.addMoreButtonText}>+ Add More Items</Text>
      </Pressable>

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
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemSubMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F05A22',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: '#F05A22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addMoreButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F05A22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },

  addMoreButtonText: {
    color: '#F05A22',
    fontSize: 16,
    fontWeight: '700',
  },
});