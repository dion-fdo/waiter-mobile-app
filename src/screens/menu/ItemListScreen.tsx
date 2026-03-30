import { useState } from 'react';
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
import ItemModal from '../../components/modals/ItemModal';
import { menuItems } from '../../data/mock/menuItems';
import { MenuItem } from '../../types/menuItem';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemList'>;

export default function ItemListScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const { categoryId, categoryName } = route.params;
  const filteredItems = menuItems.filter(
    (item) => item.categoryId === categoryId
  );
  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItemCard = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>LKR {item.price}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.addButton} onPress={() => openModal(item)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>

        <Pressable style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartButtonText}>Go Cart</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName}</Text>

      <FlatList
        key={numColumns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItemCard}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      />

      <ItemModal
        visible={modalVisible}
        item={selectedItem}
        onClose={() => setModalVisible(false)}
      />
    </View>
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
    marginBottom: 16,
    color: '#111827',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
  },
  buttonRow: {
    gap: 10,
  },
  addButton: {
    backgroundColor: '#F97316',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cartButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});