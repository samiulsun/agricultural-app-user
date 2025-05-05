import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	collection,
	query,
	where,
	getDocs,
	getFirestore,
} from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
	const { user, logout } = useAuth();
	const navigation = useNavigation();
	const [orderCount, setOrderCount] = useState(0);
	const db = getFirestore(app);

	useEffect(() => {
		const fetchOrderCount = async () => {
			if (user?.id) {
				const ordersRef = collection(db, 'orders');
				const q = query(ordersRef, where('userId', '==', user.id));
				const querySnapshot = await getDocs(q);
				setOrderCount(querySnapshot.size);
			}
		};

		fetchOrderCount();
	}, [user?.id]);

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Image
					source={{ uri: user?.profileImage || 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D' }}
					style={styles.profileImage}
				/>
				<TouchableOpacity
					style={styles.editIcon}
					onPress={() => navigation.navigate('EditProfile' as never)}
				>
					<Ionicons name='pencil-outline' size={20} color='#4CAF50' />
				</TouchableOpacity>
				<Text style={styles.name}>{user?.name || 'User'}</Text>
				<Text style={styles.email}>{user?.email}</Text>
			</View>

			<View style={styles.statsContainer}>
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>{orderCount}</Text>
					<Text style={styles.statLabel}>Orders</Text>
				</View>
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>0</Text>
					<Text style={styles.statLabel}>Reviews</Text>
				</View>
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>0</Text>
					<Text style={styles.statLabel}>Points</Text>
				</View>
			</View>

			<View style={styles.optionsContainer}>
				{/* Orders Link */}
				<Link href='/orders' asChild>
					<TouchableOpacity style={styles.optionItem}>
						<View style={styles.optionIcon}>
							<Ionicons name='receipt-outline' size={24} color='#4CAF50' />
						</View>
						<Text style={styles.optionText}>My Orders</Text>
						<Ionicons name='chevron-forward' size={20} color='#ccc' />
					</TouchableOpacity>
				</Link>

				{/* Other options with regular onPress */}
				<TouchableOpacity
					style={styles.optionItem}
					onPress={() => navigation.navigate('Address' as never)}
				>
					<View style={styles.optionIcon}>
						<Ionicons name='location-outline' size={24} color='#4CAF50' />
					</View>
					<Text style={styles.optionText}>Shipping Address</Text>
					<Ionicons name='chevron-forward' size={20} color='#ccc' />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.optionItem}
					onPress={() => navigation.navigate('Payments' as never)}
				>
					<View style={styles.optionIcon}>
						<FontAwesome name='credit-card' size={22} color='#4CAF50' />
					</View>
					<Text style={styles.optionText}>Payment Methods</Text>
					<Ionicons name='chevron-forward' size={20} color='#ccc' />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.optionItem}
					onPress={() => navigation.navigate('Settings' as never)}
				>
					<View style={styles.optionIcon}>
						<Ionicons name='settings-outline' size={24} color='#4CAF50' />
					</View>
					<Text style={styles.optionText}>Settings</Text>
					<Ionicons name='chevron-forward' size={20} color='#ccc' />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.optionItem}
					onPress={() => navigation.navigate('Help' as never)}
				>
					<View style={styles.optionIcon}>
						<MaterialIcons name='help-outline' size={24} color='#4CAF50' />
					</View>
					<Text style={styles.optionText}>Help Center</Text>
					<Ionicons name='chevron-forward' size={20} color='#ccc' />
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.logoutButton} onPress={logout}>
				<Ionicons name='log-out-outline' size={24} color='#ff3b30' />
				<Text style={styles.logoutText}>Logout</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

// Keep the same StyleSheet as before
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	header: {
		alignItems: 'center',
		paddingVertical: 30,
		backgroundColor: '#fff',
		marginBottom: 10,
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 10,
	},
	editIcon: {
		position: 'absolute',
		top: 10,
		right: 10,
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	name: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	email: {
		fontSize: 16,
		color: '#666',
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		backgroundColor: '#fff',
		paddingVertical: 20,
		marginBottom: 10,
	},
	statItem: {
		alignItems: 'center',
	},
	statNumber: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#4CAF50',
	},
	statLabel: {
		fontSize: 14,
		color: '#666',
	},
	optionsContainer: {
		backgroundColor: '#fff',
		marginBottom: 20,
	},
	optionItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 18,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	optionIcon: {
		width: 30,
		marginRight: 15,
	},
	optionText: {
		flex: 1,
		fontSize: 16,
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#fff',
	},
	logoutText: {
		marginLeft: 15,
		fontSize: 16,
		color: '#ff3b30',
	},
});
