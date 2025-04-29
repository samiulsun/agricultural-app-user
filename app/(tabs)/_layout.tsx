import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useCart } from '../../context/CartProvider';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Notification permission not granted');
  }
}

export default function TabLayout() {
  const { user } = useAuth();
  const { cartItems } = useCart();

  useEffect(() => {
    // Call this early in your app lifecycle
    registerForPushNotifications();
    
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <>
      <Tabs 
        screenOptions={{ 
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            height: 60,
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#0f0f0f',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            headerTitle: 'All Products',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="fastfood" size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            headerTitle: 'Your Cart',
            tabBarIcon: ({ color, size }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons name="cart-outline" size={size} color={color} />
                {cartItems.length > 0 && (
                  <View style={{
                    position: 'absolute',
                    right: -8,
                    top: -5,
                    backgroundColor: '#FF3B30',
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {cartItems.length}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            headerTitle: 'Your Orders',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'Your Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      
      <Toast />
    </>
  );
}