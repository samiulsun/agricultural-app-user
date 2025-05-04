
import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { View, Text, StatusBar } from 'react-native'; // ✅ added StatusBar
import { useCart } from '../../context/CartProvider';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import SplashScreen from '@/components/SplashScreen';

async function registerForPushNotifications() {
	const { status } = await Notifications.requestPermissionsAsync();
	if (status !== 'granted') {
		console.warn('Notification permission not granted');
	}
}

export default function TabLayout() {
	const [isAppReady, setIsAppReady] = useState(false);
	const { user } = useAuth();
	const { cartItems } = useCart();

	useEffect(() => {
		registerForPushNotifications();

		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: true,
			}),
		});
	}, []);

	if (!isAppReady) {
		return (
			<SplashScreen
				onFinish={(isCancelled) => !isCancelled && setIsAppReady(true)}
			/>
		);
	}

	if (!user) {
		return <Redirect href='/auth/login' />;
	}

	return (
		<>
			{/* ✅ Ensure Status Bar is visible */}
			<StatusBar hidden={false} barStyle='dark-content' />

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
					headerShown: false,
				}}
			>
				<Tabs.Screen
					name='index'
					options={{
						title: 'Home',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='home-outline' size={size} color={color} />
						),
					}}
				/>

				<Tabs.Screen
					name='products'
					options={{
						title: 'Products',
						tabBarIcon: ({ color, size }) => (
							<MaterialIcons name='fastfood' size={size} color={color} />
						),
					}}
				/>

				<Tabs.Screen
					name='cart'
					options={{
						title: 'Cart',
						tabBarIcon: ({ color, size }) => (
							<View style={{ position: 'relative' }}>
								<Ionicons name='cart-outline' size={size} color={color} />
								{cartItems.length > 0 && (
									<View
										style={{
											position: 'absolute',
											right: -8,
											top: -5,
											backgroundColor: '#FF3B30',
											borderRadius: 10,
											width: 18,
											height: 18,
											justifyContent: 'center',
											alignItems: 'center',
										}}
									>
										<Text
											style={{
												color: 'white',
												fontSize: 10,
												fontWeight: 'bold',
											}}
										>
											{cartItems.length}
										</Text>
									</View>
								)}
							</View>
						),
					}}
				/>

				<Tabs.Screen
					name='orders'
					options={{
						title: 'Orders',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='receipt-outline' size={size} color={color} />
						),
					}}
				/>

				<Tabs.Screen
					name='profile'
					options={{
						title: 'Profile',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='person-outline' size={size} color={color} />
						),
					}}
				/>
			</Tabs>

			<Toast />
		</>
	);
}
