import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderStatus'>;

type StatusStep = {
  id: string;
  label: string;
  completed: boolean;
};

const steps: StatusStep[] = [
  { id: '1', label: 'Order Placed', completed: true },
  { id: '2', label: 'Preparing', completed: true },
  { id: '3', label: 'Ready', completed: false },
  { id: '4', label: 'Served', completed: false },
];

export default function OrderStatusScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Status</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Order ID: ORD-1001</Text>
        <Text style={styles.infoText}>Table: 05</Text>
        <Text style={styles.infoText}>Waiter: Waiter 01</Text>
      </View>

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.dot,
                    step.completed ? styles.completedDot : styles.pendingDot,
                  ]}
                />
                {!isLast && (
                  <View
                    style={[
                      styles.line,
                      step.completed ? styles.completedLine : styles.pendingLine,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    step.completed ? styles.completedText : styles.pendingText,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('OrderDetails')}
        >
          <Text style={styles.buttonText}>View Order</Text>
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
    marginBottom: 24,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 6,
  },
  timeline: {
    flex: 1,
    paddingTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
  },
  completedDot: {
    backgroundColor: '#F97316',
  },
  pendingDot: {
    backgroundColor: '#E5E7EB',
  },
  line: {
    width: 3,
    flex: 1,
    marginTop: 4,
    borderRadius: 2,
  },
  completedLine: {
    backgroundColor: '#F97316',
  },
  pendingLine: {
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 8,
  },
  stepLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  completedText: {
    color: '#111827',
  },
  pendingText: {
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 12,
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
});