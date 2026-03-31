import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ItemModal from '../../components/modals/ItemModal';
import { MenuItem } from '../../types/menuItem';
import { getFoodsByCategory, searchFoods } from '../../services/api/menuApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemList'>;

export default function ItemListScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const { categoryId, categoryName } = route.params;
  const { selectedTable, ensureValidToken } = useAppContext();

  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [searchText, setSearchText] = useState('');

  const loadItems = async (keyword?: string) => {
    try {
      const token = await ensureValidToken();

      if (keyword && keyword.trim().length > 0) {
        const data = await searchFoods(keyword.trim(), token || undefined);
        setItems(data);
        return;
      }

      const data = await getFoodsByCategory(categoryId, token || undefined);
      setItems(data);
    } catch (error: any) {
      Alert.alert(
        'Failed to load menu items',
        error?.message || 'Please try again'
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingItems(true);
        await loadItems();
      } finally {
        setLoadingItems(false);
      }
    };

    init();
  }, [categoryId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadItems(searchText);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const openModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItemCard = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>

        <Text style={styles.itemPrice}>
          LKR {item.variants?.[0]?.price ?? item.price}
        </Text>

        {item.variants && item.variants.length > 1 ? (
          <Text style={styles.itemVariantText}>
            {item.variants.map((variant) => variant.variantName).join(' / ')}
          </Text>
        ) : item.variants?.[0]?.variantName ? (
          <Text style={styles.itemVariantText}>
            {item.variants[0].variantName}
          </Text>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.addButton} onPress={() => openModal(item)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>

        <Pressable
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartButtonText}>Go Cart</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loadingItems) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>
          Loading menu items...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search menu items..."
        placeholderTextColor="#9CA3AF"
        value={searchText}
        onChangeText={setSearchText}
      />

      {selectedTable && (
        <Text style={styles.tableInfo}>Table {selectedTable.number}</Text>
      )}

      <FlatList
        key={numColumns}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItemCard}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No menu items found.</Text>
          </View>
        }
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
    marginBottom: 6,
    color: '#111827',
  },
  tableInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
    minHeight: 140,
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
  itemVariantText: {
    fontSize: 13,
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
});