import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type KitchenNotification = {
  id: string;
  orderId: number;
  tableName: string;
  message: string;
  updatedAt: number;
};

const KITCHEN_NOTIFICATIONS_KEY = 'kitchen_check_notifications';

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<KitchenNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    const saved = await AsyncStorage.getItem(KITCHEN_NOTIFICATIONS_KEY);
    const parsed: KitchenNotification[] = saved ? JSON.parse(saved) : [];
    setNotifications(parsed.sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();

      const interval = setInterval(() => {
        loadNotifications();
      }, 1000);

      return () => clearInterval(interval);
    }, [loadNotifications])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Notifications</Text>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No notifications yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.notificationCard}
              onPress={() =>
                navigation.navigate('OrderStatus', {
                  orderId: item.orderId,
                  tableName: item.tableName,
                })
              }
            >
              <Text style={styles.notificationText}>{item.message}</Text>
              <Text style={styles.notificationTime}>
                {new Date(item.updatedAt).toLocaleString()}
              </Text>
            </Pressable>
          )}
        />

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F05822',
    textAlign: 'center',
    marginVertical: 18,
  },

  listContent: {
    paddingBottom: 90,
  },

  emptyBox: {
    marginTop: 40,
    padding: 22,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  notificationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },

  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },

  backButtonText: {
    fontSize: 15,
    color: '#6B7280',
  },
});