import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import WaiterSelectionScreen from '../screens/auth/WaiterSelectionScreen';
import WaiterPinScreen from '../screens/auth/WaiterPinScreen';
import TableDashboardScreen from '../screens/tables/TableDashboardScreen';
import CategoryScreen from '../screens/menu/CategoryScreen';
import ItemListScreen from '../screens/menu/ItemListScreen';
import CartScreen from '../screens/cart/CartScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import OrderStatusScreen from '../screens/orders/OrderStatusScreen';
import EditPlacedOrderScreen from '../screens/orders/EditPlacedOrderScreen';
import CashierApprovalScreen from '../screens/orders/CashierApprovalScreen';

export type RootStackParamList = {
  Welcome: undefined;
  WaiterSelection: undefined;
  WaiterPin: { waiterName: string };
  TableDashboard: undefined;
  Category: undefined;
  ItemList: { categoryId: string; categoryName: string };
  Cart: undefined;
  OrderDetails: undefined;
  OrderStatus: undefined;
  EditPlacedOrder: undefined;
  CashierApproval: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        <Stack.Screen name="WaiterSelection" component={WaiterSelectionScreen} />
        <Stack.Screen name="WaiterPin" component={WaiterPinScreen} />

        <Stack.Screen name="TableDashboard" component={TableDashboardScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="ItemList" component={ItemListScreen} />

        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
        <Stack.Screen name="EditPlacedOrder" component={EditPlacedOrderScreen} />
        <Stack.Screen name="CashierApproval" component={CashierApprovalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}