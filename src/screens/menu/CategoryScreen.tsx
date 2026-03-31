import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Category } from '../../types/category';

import { getCategories } from '../../services/api/categoryApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Category'>;

export default function CategoryScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const handlePress = (category: Category) => {
    navigation.navigate('ItemList', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const { ensureValidToken } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  const renderCategory = ({ item }: { item: Category }) => (
    <Pressable style={styles.card} onPress={() => handlePress(item)}>
      <Text style={styles.cardText}>{item.name}</Text>
    </Pressable>
  );

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

  if (loadingCategories) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>
          Loading categories...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu Categories</Text>

      <FlatList
        key={numColumns}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
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
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
  },
});