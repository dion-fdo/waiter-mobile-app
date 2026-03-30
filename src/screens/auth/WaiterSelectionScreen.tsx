import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { waiters } from '../../data/mock/waiters';
import { Waiter } from '../../types/waiter';

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterSelection'>;

export default function WaiterSelectionScreen({ navigation }: Props) {
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);

  const handleContinue = () => {
    if (!selectedWaiter) {
      Alert.alert('Please select a waiter');
      return;
    }

    navigation.navigate('WaiterPin', { waiterName: selectedWaiter.name });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiter Login</Text>
      <Text style={styles.subtitle}>Select a waiter to continue</Text>

      <View style={styles.list}>
        {waiters.map((waiter) => {
          const isSelected = selectedWaiter?.id === waiter.id;

          return (
            <Pressable
              key={waiter.id}
              style={[styles.item, isSelected && styles.selectedItem]}
              onPress={() => setSelectedWaiter(waiter)}
            >
              <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                {waiter.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  list: {
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#FDBA74',
    borderColor: '#F97316',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  selectedItemText: {
    color: '#111827',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});