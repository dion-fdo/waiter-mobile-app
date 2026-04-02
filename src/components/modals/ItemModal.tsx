import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { MenuItem, MenuAddOn } from '../../types/menuItem';
import { useAppContext } from '../../context/AppContext';
import { SelectedAddOn } from '../../types/cart';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: MenuItem | null;
};

function buildSelectedAddOn(
  addOn: MenuAddOn,
  selected: boolean
): SelectedAddOn | null {
  if (!selected) return null;

  return {
    addOnId: addOn.addOnId,
    addOnName: addOn.addOnName,
    price: addOn.price,
    qty: 1,
  };
}

export default function ItemModal({ visible, onClose, item }: Props) {
  const { addToCart } = useAppContext();

  const defaultVariantName = item?.variants?.[0]?.variantName;
  const [selectedVariantName, setSelectedVariantName] = useState<string>(
    defaultVariantName ?? ''
  );
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    if (!item) return;

    setSelectedVariantName(item.variants?.[0]?.variantName ?? '');
    setQty(1);
    setNote('');
    setSelectedAddOnIds([]);
  }, [item, visible]);

  const selectedVariant = useMemo(() => {
    return item?.variants?.find(
      (variant) => variant.variantName === selectedVariantName
    );
  }, [item, selectedVariantName]);

  const selectedAddOns: SelectedAddOn[] = useMemo(() => {
    if (!item?.addOns?.length) return [];

    return item.addOns
      .map((addOn) =>
        buildSelectedAddOn(addOn, selectedAddOnIds.includes(addOn.addOnId))
      )
      .filter(Boolean) as SelectedAddOn[];
  }, [item, selectedAddOnIds]);

  const addOnsTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + addOn.price * addOn.qty,
    0
  );

  const basePrice = selectedVariant?.price ?? item?.price ?? 0;
  const displayPrice = basePrice + addOnsTotal;

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleAddToCart = () => {
    if (!item) return;

    addToCart({
      menuItem: {
        ...item,
        price: displayPrice,
      },
      qty,
      variantId: selectedVariant?.variantId,
      variantName: selectedVariant?.variantName,
      selectedAddOns,
      note: note.trim(),
    });

    onClose();
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.price}>LKR {displayPrice.toFixed(2)}</Text>

            {item.variants && item.variants.length > 0 ? (
              <>
                <Text style={styles.section}>Variant</Text>
                <View style={styles.rowWrap}>
                  {item.variants.map((variant) => {
                    const selected = selectedVariantName === variant.variantName;

                    return (
                      <Pressable
                        key={variant.variantId}
                        style={[styles.option, selected && styles.selectedOption]}
                        onPress={() => setSelectedVariantName(variant.variantName)}
                      >
                        <Text style={styles.optionText}>{variant.variantName}</Text>
                        <Text style={styles.optionSubText}>
                          LKR {variant.price.toFixed(2)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={styles.section}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable
                style={styles.qtyButton}
                onPress={() => setQty((prev) => Math.max(1, prev - 1))}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </Pressable>

              <Text style={styles.qtyText}>{qty}</Text>

              <Pressable
                style={styles.qtyButton}
                onPress={() => setQty((prev) => prev + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>

            {item.addOns && item.addOns.length > 0 ? (
              <>
                <Text style={styles.section}>Add-ons</Text>
                <View style={styles.addOnContainer}>
                  {item.addOns.map((addOn) => {
                    const selected = selectedAddOnIds.includes(addOn.addOnId);

                    return (
                      <Pressable
                        key={addOn.addOnId}
                        style={[styles.addOnChip, selected && styles.selectedAddOnChip]}
                        onPress={() => toggleAddOn(addOn.addOnId)}
                      >
                        <Text
                          style={[
                            styles.addOnChipText,
                            selected && styles.selectedAddOnChipText,
                          ]}
                        >
                          {addOn.addOnName} (+LKR {addOn.price.toFixed(2)})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={styles.section}>Item note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Enter note for this item"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <Pressable style={styles.addBtn} onPress={handleAddToCart}>
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  price: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  selectedOption: {
    backgroundColor: '#FDBA74',
    borderColor: '#F97316',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  optionSubText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyButton: {
    width: 42,
    height: 42,
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
  },
  addOnContainer: {
    gap: 8,
  },
  addOnChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  selectedAddOnChip: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  addOnChipText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedAddOnChipText: {
    color: '#C2410C',
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  addBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});