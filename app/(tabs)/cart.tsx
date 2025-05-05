import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	TextInput,
	Alert,
	Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useCart } from '../../context/CartProvider';
import {
	collection,
	addDoc,
	getFirestore,
	doc,
	setDoc,
	getDoc,
} from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
	const {
		cartItems,
		total,
		removeFromCart,
		updateQuantity,
		clearCart,
		loading,
	} = useCart();
	const { user } = useAuth();
	const [placingOrder, setPlacingOrder] = useState(false);
	const [deliveryAddress, setDeliveryAddress] = useState('');
	const [paymentMethod, setPaymentMethod] = useState('');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const db = getFirestore(app);
	const navigation = useNavigation();

	const toggleModal = () => {
		setIsModalVisible(!isModalVisible);
	};

	useEffect(() => {
		if (!user) return;

		// Fetch user delivery address and payment method from database
		const fetchUserDetails = async () => {
			try {
				const userDoc = await getDoc(doc(db, 'users', user.id));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					setDeliveryAddress(userData.deliveryAddress || '');
					setPaymentMethod(userData.paymentMethod || '');
				}
			} catch (error) {
				console.error('Error fetching user details:', error);
			}
		};

		fetchUserDetails();
	}, [user]);

	const handleSetDetails = async () => {
		if (!user) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'User is not logged in.',
			});
			return;
		}

		if (!deliveryAddress || !paymentMethod) {
			Alert.alert(
				'Missing Information',
				'Please provide both delivery address and payment method.'
			);
			return;
		}

		try {
			await setDoc(
				doc(db, 'users', user.id),
				{
					deliveryAddress,
					paymentMethod,
				},
				{ merge: true }
			);

			Toast.show({
				type: 'success',
				text1: 'Details Saved',
				text2: 'Your delivery address and payment method have been updated.',
			});
		} catch (error) {
			console.error('Error saving user details:', error);
			Toast.show({
				type: 'error',
				text1: 'Save Failed',
				text2: 'Failed to save your details.',
			});
		}
	};

	const handlePlaceOrder = async () => {
		if (!user) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'User is not logged in.',
			});
			return;
		}

		if (cartItems.length === 0) {
			Toast.show({
				type: 'error',
				text1: 'Order Failed',
				text2: 'Your cart is empty',
			});
			return;
		}

		setPlacingOrder(true);
		try {
			// Create order document with shop information
			const orderRef = await addDoc(collection(db, 'orders'), {
				userId: user.id,
				userEmail: user.email,
				items: cartItems.map((item) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					unit: item.unit,
					image: item.image || '',
					shopId: item.shopId,
					shopName: item.shopName,
					farmerId: item.farmerId,
				})),
				total: total,
				status: 'pending',
				createdAt: new Date(),
				deliveryAddress: deliveryAddress || 'To be specified',
				contactNumber: 'To be specified',
			});

			// Clear the user's cart after successful order
			const cartRef = doc(db, 'carts', user.id);
			await setDoc(cartRef, { items: [] });

			Toast.show({
				type: 'success',
				text1: 'Order Successful',
				text2: 'Order #${orderRef.id} placed successfully!',
			});
			clearCart();

			// Navigate to orders page
			navigation.navigate('orders' as never);
		} catch (error) {
			console.error('Error placing order:', error);
			Toast.show({
				type: 'error',
				text1: 'Order Failed',
				text2: 'Failed to place order',
			});
		} finally {
			setPlacingOrder(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#4CAF50' />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{cartItems.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons name='cart-outline' size={50} color='#ccc' />
					<Text style={styles.emptyText}>Your cart is empty</Text>
				</View>
			) : (
				<>
					<FlatList
						data={cartItems}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<View style={styles.item}>
								<View style={styles.itemInfo}>
									<Text style={styles.itemName}>{item.name}</Text>
									<Text style={styles.itemPrice}>
										৳{item.price.toFixed(2)}/{item.unit}
									</Text>
									{item.shopName && (
										<>
											<Text style={styles.shopName}>Shop: {item.shopName}</Text>
											
										</>
									)}
								</View>
								<View style={styles.itemActions}>
									<View style={styles.quantityContainer}>
										<TouchableOpacity
											onPress={() => updateQuantity(item.id, item.quantity - 1)}
											disabled={item.quantity <= 1}
										>
											<Ionicons
												name='remove-circle-outline'
												size={36}
												color={item.quantity <= 1 ? '#ccc' : '#2e86de'}
											/>
										</TouchableOpacity>
										<Text style={styles.quantity}>{item.quantity}</Text>
										<TouchableOpacity
											onPress={() => updateQuantity(item.id, item.quantity + 1)}
										>
											<Ionicons
												name='add-circle-outline'
												size={36}
												color='#2e86de'
											/>
										</TouchableOpacity>
									</View>
									<TouchableOpacity
										style={styles.removeButton}
										onPress={() => removeFromCart(item.id)}
									>
										<Ionicons name='trash-outline' size={24} color='#fff' />
									</TouchableOpacity>
								</View>
							</View>
						)}
						contentContainerStyle={styles.listContent}
					/>

					<TouchableOpacity style={styles.toggleButton} onPress={toggleModal}>
						<Text style={styles.toggleButtonText}>Set Delivery Details</Text>
					</TouchableOpacity>

					<Modal
						visible={isModalVisible}
						animationType='slide'
						transparent={true}
						onRequestClose={toggleModal}
					>
						<View style={styles.modalContainer}>
							<View style={styles.modalContent}>
								<Text style={styles.label}>Delivery Address:</Text>
								<TextInput
									style={styles.input}
									value={deliveryAddress}
									onChangeText={setDeliveryAddress}
									placeholder='Enter your delivery address'
								/>

								<Text style={styles.label}>Payment Method:</Text>
								<Picker
									selectedValue={paymentMethod}
									onValueChange={(itemValue) => setPaymentMethod(itemValue)}
									style={styles.picker}
								>
									<Picker.Item
										label='Cash on Delivery'
										value='cash_on_delivery'
									/>
									<Picker.Item label='Online Payment' value='online_payment' />
								</Picker>

								<TouchableOpacity
									style={styles.saveButton}
									onPress={handleSetDetails}
								>
									<Text style={styles.saveButtonText}>Save Details</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.closeButton}
									onPress={toggleModal}
								>
									<Text style={styles.closeButtonText}>Close</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>

					<View style={styles.summaryContainer}>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Total:</Text>
							<Text style={styles.totalAmount}>৳{total.toFixed(2)}</Text>
						</View>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={[styles.button, styles.clearButton]}
								onPress={clearCart}
							>
								<Text style={styles.clearButtonText}>Clear Cart</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.orderButton]}
								onPress={handlePlaceOrder}
								disabled={placingOrder}
							>
								{placingOrder ? (
									<ActivityIndicator color='#fff' />
								) : (
									<>
										<Ionicons
											name='checkmark-circle-outline'
											size={20}
											color='#fff'
										/>
										<Text style={styles.buttonText}>Place Order</Text>
									</>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#f8f9fa',
		marginBottom: 90,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 18,
		color: '#666',
		marginTop: 16,
	},
	listContent: {
		paddingBottom: 16,
	},
	item: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	itemPrice: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
		fontWeight: 'bold',
	},
	shopName: {
		fontSize: 14,
		color: '#888',
		fontStyle: 'italic',
		fontWeight: '500',
	},
	itemActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	quantityContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 10,
	},
	quantity: {
		marginHorizontal: 12,
		fontSize: 18,
		fontWeight: '600',
	},
	removeButton: {
		backgroundColor: '#ff3b30',
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 15,
	},
	summaryContainer: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: '500',
	},
	totalAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2e86de',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
	},
	clearButton: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#ff3b30',
		marginRight: 8,
	},
	clearButtonText: {
		color: '#ff3b30',
		fontWeight: 'bold',
		marginLeft: 8,
	},
	orderButton: {
		backgroundColor: '#4CAF50',
		marginLeft: 8,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		marginLeft: 8,
	},
	detailsContainer: {
		marginVertical: 16,
		padding: 16,
		backgroundColor: '#fff',
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
		fontSize: 16,
	},
	saveButton: {
		backgroundColor: '#4CAF50',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	saveButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	toggleButton: {
		backgroundColor: '#4CAF50',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginVertical: 16,
	},
	toggleButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContent: {
		width: '90%',
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	picker: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		marginBottom: 16,
	},
	closeButton: {
		backgroundColor: '#ff3b30',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 16,
	},
	closeButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
});
