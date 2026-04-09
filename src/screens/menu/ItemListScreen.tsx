import React, { useEffect, useMemo, useState } from 'react';
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
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ItemModal from '../../components/modals/ItemModal';
import { MenuItem } from '../../types/menuItem';
import { getFoodsByCategory, searchFoods } from '../../services/api/menuApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemList'>;

const DEFAULT_FOOD_IMAGE = require('../../../assets/default-food.png');
const APP_LOGO = require('../../../assets/logo-icon.png');

export default function ItemListScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const { categoryId, categoryName } = route.params;
  const {
    selectedTable,
    ensureValidToken,
    isEditingPlacedOrder,
    selectedWaiter,
    cartItems,
  } = useAppContext();

  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 2;
  const cardGap = 12;
  const horizontalPadding = 16;
  const totalGap = cardGap * (numColumns - 1);
  const availableWidth = width - horizontalPadding * 2 - totalGap;
  const cardWidth = availableWidth / numColumns;

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const loadItems = async (keyword?: string) => {
    try {
      const token = await ensureValidToken();

      if (keyword && keyword.trim().length > 0) {
        const data = await searchFoods(keyword.trim(), token || undefined);
        setItems(data);
        return;
      }

      if (categoryId === 'all') {
        const data = await searchFoods('', token || undefined);
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

  const getItemImageUri = (item: MenuItem) => {
    const anyItem = item as any;

    return (
      anyItem.image ||
      anyItem.image_url ||
      anyItem.imageUrl ||
      anyItem.photo ||
      anyItem.food_image ||
      anyItem.foodImage ||
      null
    );
  };

  const renderItemCard = ({ item, index }: { item: MenuItem; index: number }) => {
    const imageUri = getItemImageUri(item);
    const hasImageError = imageErrors[item.id];
    const imageSource =
      imageUri && !hasImageError
        ? { uri: imageUri }
        : DEFAULT_FOOD_IMAGE;

    const isLastInRow = (index + 1) % numColumns === 0;

    return (
      <Pressable
        style={[
          styles.card,
          {
            width: cardWidth,
            marginRight: isLastInRow ? 0 : cardGap,
          },
        ]}
        onPress={() => openModal(item)}
      >
        <ImageBackground
          source={imageSource}
          defaultSource={DEFAULT_FOOD_IMAGE}
          style={styles.cardImage}
          imageStyle={styles.cardImageInner}
          onError={() =>
            setImageErrors((prev) => ({ ...prev, [item.id]: true }))
          }
          resizeMode="cover"
        >
          <View style={styles.cardOverlay} />
          <View style={styles.cardLabelWrap}>
            <Text style={styles.cardText} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    );
  };

  if (loadingItems) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#F05822" />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.logoBox}>
            <Image
              source={APP_LOGO}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.topBarCenter}>
            <Text style={styles.waiterText}>
              {selectedWaiter?.name || 'Waiter 01'}
            </Text>
          </View>

          <View style={styles.topBarActions}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.topBarActionText}>Categories</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.header}>{categoryName}</Text>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search here..."
            placeholderTextColor="#8A8A8A"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Image
            source={require('../../../assets/icons/search.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
        </View>

        {selectedTable ? (
          <Text style={styles.tableInfo}>Table {selectedTable.number}</Text>
        ) : null}

        <FlatList
          key={numColumns}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItemCard}
          numColumns={numColumns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No menu items found.</Text>
            </View>
          }
        />

        <View style={styles.bottomCartWrap}>
          <Pressable
            style={styles.cartButton}
            onPress={() =>
              navigation.navigate(
                isEditingPlacedOrder ? 'EditPlacedOrder' : 'Cart'
              )
            }
          >
            <Text style={styles.cartButtonText}>
              {isEditingPlacedOrder ? 'Back to Edit Order' : 'View Cart'}
            </Text>

            {cartItems.length > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ItemModal
          visible={modalVisible}
          item={selectedItem}
          onClose={() => setModalVisible(false)}
        />
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
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 15,
  },

  topBar: {
    backgroundColor: '#F05822',
    borderRadius: 10,
    minHeight: 68,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  logoBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  logoImage: {
    width: 45,
    height: 45,
  },

  topBarCenter: {
    flex: 1,
    paddingLeft: 10,
  },

  waiterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'InstrumentSerif-Regular',
    fontStyle: 'italic',
    flexShrink: 1,
  },

  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  topBarActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F05822',
    marginBottom: 12,
  },

  tableInfo: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },

  searchWrap: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },

  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#F05822',
  },

  listContent: {
    paddingBottom: 92,
  },

  card: {
    marginBottom: 12,
  },

  cardImage: {
    height: 84,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 14,
  },

  cardImageInner: {
    borderRadius: 14,
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 190, 155, 0.18)',
  },

  cardLabelWrap: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  cardText: {
    color: '#FFFFFF',
    fontSize: 14,
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

  bottomCartWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },

  cartButton: {
    width: '80%',
    backgroundColor: '#F05822',
    minHeight: 74,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  cartBadge: {
    position: 'absolute',
    right: 14,
    top: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  cartBadgeText: {
    color: '#F05822',
    fontSize: 12,
    fontWeight: '700',
  },
});