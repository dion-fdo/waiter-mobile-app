import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  ImageBackground,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Category } from '../../types/category';
import { getCategories } from '../../services/api/categoryApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Category'>;

const DEFAULT_FOOD_IMAGE = require('../../../assets/default-food.png');
const APP_LOGO = require('../../../assets/logo-icon.png');

export default function CategoryScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const cardGap = 12;
  const horizontalPadding = 16;
  const totalGap = cardGap * (numColumns - 1);
  const availableWidth = width - horizontalPadding * 2 - totalGap;
  const cardWidth = availableWidth / numColumns;

  const {
    ensureValidToken,
    selectedWaiter,
    logout,
    cartItems,
    saveCurrentTableDraft,
  } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [logoutSheetVisible, setLogoutSheetVisible] = useState(false);

  const logoutSheetTranslateY = useRef(new Animated.Value(280)).current;

  const handlePress = (category: Category) => {
    navigation.navigate('ItemList', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const loadCategories = async () => {
    try {
      const token = await ensureValidToken();
      const data = await getCategories(token || undefined);
      setCategories(data);
    } catch (error: any) {
      Alert.alert(
        'Failed to load categories',
        error?.message || 'Please try again'
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingCategories(true);
        await loadCategories();
      } finally {
        setLoadingCategories(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (logoutSheetVisible) {
      logoutSheetTranslateY.setValue(280);
      Animated.timing(logoutSheetTranslateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [logoutSheetVisible, logoutSheetTranslateY]);

  const openLogoutSheet = () => {
    setLogoutSheetVisible(true);
  };

  const closeLogoutSheet = () => {
    Animated.timing(logoutSheetTranslateY, {
      toValue: 280,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setLogoutSheetVisible(false);
    });
  };

  const handleConfirmLogout = () => {
    closeLogoutSheet();
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const displayCategories: Category[] = useMemo(() => {
    const allCategory: Category = { id: 'all', name: 'All' };
    const combined = [allCategory, ...categories];

    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return combined;

    return combined.filter((item) =>
      item.name.toLowerCase().includes(keyword)
    );
  }, [categories, searchText]);

  const getCategoryImageUri = (item: Category) => {
    const categoryAny = item as any;

    return (
      categoryAny.image ||
      categoryAny.image_url ||
      categoryAny.imageUrl ||
      categoryAny.photo ||
      categoryAny.icon ||
      categoryAny.category_image ||
      categoryAny.categoryImage ||
      null
    );
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    const imageUri = getCategoryImageUri(item);
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
        onPress={() => handlePress(item)}
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

  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#F05822" />
          <Text style={styles.loadingText}>Loading categories...</Text>
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
              {selectedWaiter?.name || 'Waiter'}
            </Text>
          </View>

          <View style={styles.topBarActions}>
            <Pressable
              onPress={async () => {
                await saveCurrentTableDraft();
                navigation.navigate('TableDashboard');
              }}
            >
              <Text style={styles.topBarActionText}>Tables</Text>
            </Pressable>

            <Pressable onPress={openLogoutSheet}>
              <Text style={styles.topBarActionText}>Logout</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.header}>Select Category</Text>

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

        <FlatList
          key={numColumns}
          data={displayCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          numColumns={numColumns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.bottomCartWrap}>
          <Pressable
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.cartButtonText}>View Cart</Text>

            {cartItems.length > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <Modal
          visible={logoutSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={closeLogoutSheet}
        >
          <View style={styles.logoutSheetOverlay}>
            <Pressable
              style={styles.logoutSheetBackdrop}
              onPress={closeLogoutSheet}
            />

            <Animated.View
              style={[
                styles.logoutSheetCard,
                { transform: [{ translateY: logoutSheetTranslateY }] },
              ]}
            >
              <Text style={styles.logoutSheetTitle}>Are you sure?</Text>

              <Pressable
                style={styles.logoutYesButton}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.logoutYesButtonText}>Yes</Text>
              </Pressable>

              <Pressable
                style={styles.logoutCancelButton}
                onPress={closeLogoutSheet}
              >
                <Text style={styles.logoutCancelButtonText}>Cancel</Text>
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
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#111111',
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

  searchWrap: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    backgroundColor: 'rgba(255, 190, 155, 0.2)',
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

  logoutSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  logoutSheetBackdrop: {
    flex: 1,
  },

  logoutSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
  },

  logoutSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },

  logoutYesButton: {
    width: '100%',
    backgroundColor: '#F05822',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  logoutYesButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  logoutCancelButton: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  listContent: {
    paddingBottom: 92,
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
  },

  cartButton: {
    width: '100%',
    backgroundColor: '#F05822',
    minHeight: 64,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});