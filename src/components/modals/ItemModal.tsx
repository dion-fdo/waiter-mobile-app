import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { MenuItem } from '../../types/menuItem';
import { useAppContext } from '../../context/AppContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: MenuItem | null;
};

const AVAILABLE_ADD_ONS = ['Extra Cheese', 'Extra Sauce', 'No Onion'];

export default function ItemModal({ visible, onClose, item }: Props) {
  const { addToCart } = useAppContext();
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSize(item?.sizeOptions?.[0]);
      setQty(1);
      setSelectedAddOns([]);
    }
  }, [visible, item]);

  const toggleAddOn = (addOn: string) => {
    if (!item?.allowMultipleAddOns) {
      setSelectedAddOns((prev) => (prev.includes(addOn) ? [] : [addOn]));
      return;
    }

    setSelectedAddOns((prev) =>
      prev.includes(addOn)
        ? prev.filter((value) => value !== addOn)
        : [...prev, addOn]
    );
  };

  const handleAddToCart = () => {
    if (!item) return;

    addToCart({
      menuItem: item,
      qty,
      size,
      addOns: selectedAddOns,
    });

    onClose();
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.price}>LKR {item.price}</Text>

          {item.sizeOptions && item.sizeOptions.length > 0 ? (
            <>
              <Text style={styles.section}>Size</Text>
              <View style={styles.row}>
                {item.sizeOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.option,
                      size === option && styles.selectedOption,
                    ]}
                    onPress={() => setSize(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                ))}
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

            <Pressable style={styles.qtyButton} onPress={() => setQty((prev) => prev + 1)}>
              <Text style={styles.qtyButtonText}>+</Text>
            </Pressable>
          </View>

          {item.addOnOptions && item.addOnOptions.length > 0 ? (
            <>
              <Text style={styles.section}>Add Ons</Text>
              <View style={styles.addOnBox}>
                {item.addOnOptions.map((addOn) => {
                  const selected = selectedAddOns.includes(addOn);

                  return (
                    <Pressable
                      key={addOn}
                      style={[
                        styles.addOnItem,
                        selected && styles.selectedAddOnItem,
                      ]}
                      onPress={() => toggleAddOn(addOn)}
                    >
                      <Text
                        style={[
                          styles.addOnText,
                          selected && styles.selectedAddOnText,
                        ]}
                      >
                        {addOn}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Pressable style={styles.addBtn} onPress={handleAddToCart}>
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  addOnBox: {
    gap: 8,
  },
  addOnText: {
    fontSize: 14,
    color: '#111827',
  },

  addOnItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },

  selectedAddOnItem: {
    backgroundColor: '#FDBA74',
    borderColor: '#F97316',
  },

  selectedAddOnText: {
    fontWeight: '700',
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