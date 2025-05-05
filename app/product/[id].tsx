import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	View,
	Text,
	Image,
	StyleSheet,
	ActivityIndicator,
	TouchableOpacity,
	FlatList,
	ScrollView,
} from 'react-native';
import {
	doc,
	getDoc,
	getFirestore,
	collection,
	query,
	where,
	getDocs,
} from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartProvider';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

type Product = {
	id: string;
	name: string;
	price: number;
	image: string;
	shopId: string;
	unit: string;
	description?: string;
	type?: string;
};

type Shop = {
	id: string;
	name: string;
	farmerId: string;
	location: string;
	image?: string;
	rating?: number;
	productsCount?: number;
};

function ProductDetailScreen() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [product, setProduct] = useState<Product | null>(null);
	const [shop, setShop] = useState<Shop | null>(null);
	const [loading, setLoading] = useState(true);
	const [addingToCart, setAddingToCart] = useState(false);
	const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
	const { addToCart } = useCart();
	const db = getFirestore(app);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const productRef = doc(db, 'products', id as string);
				const productSnap = await getDoc(productRef);

				if (!productSnap.exists()) {
					await Notifications.scheduleNotificationAsync({
						content: {
							title: 'Product Not Found',
							body: 'The requested product could not be found',
						},
						trigger: null,
					});
					return;
				}

				const productData = productSnap.data();
				const currentProduct: Product = {
					id: productSnap.id,
					name: productData.name || 'No Name',
					price: productData.price || 0,
					image: productData.image || 'https://via.placeholder.com/300',
					shopId: productData.shopId || '',
					unit: productData.unit || '',
					description: productData.description,
					type: productData.type,
				};
				setProduct(currentProduct);

				if (currentProduct.shopId) {
					const shopRef = doc(db, 'shops', currentProduct.shopId);
					const shopSnap = await getDoc(shopRef);

					if (shopSnap.exists()) {
						const shopData = shopSnap.data();
						setShop({
							id: shopSnap.id,
							name: shopData.name || 'No Shop Name',
							farmerId: shopData.farmerId || '',
							location: shopData.location || 'Location not specified',
							image: shopData.image,
							rating: shopData.rating || 0,
							productsCount: shopData.productsCount || 0,
						});
					}
				}
			} catch (error) {
				console.error('Error:', error);
				await Notifications.scheduleNotificationAsync({
					content: {
						title: 'Error',
						body: 'Failed to load product details',
					},
					trigger: null,
				});
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [id]);

	useEffect(() => {
		const fetchSimilarProducts = async () => {
			if (!product) return;

			try {
				const similarProductsRef = collection(db, 'products');
				const similarProductsQuery = query(
					similarProductsRef,
					where('shopId', '==', product.shopId)
				);
				const querySnapshot = await getDocs(similarProductsQuery);

				const fetchedProducts: Product[] = querySnapshot.docs
					.filter((docSnap) => docSnap.id !== product.id)
					.map((docSnap) => {
						const data = docSnap.data();
						return {
							id: docSnap.id,
							name: data.name,
							price: data.price,
							image: data.image || 'https://via.placeholder.com/150',
							shopId: data.shopId,
							unit: data.unit,
						};
					});

				setSimilarProducts(fetchedProducts);
			} catch (error) {
				console.error('Error fetching similar products:', error);
			}
		};

		fetchSimilarProducts();
	}, [product]);

	const handleAddToCart = async () => {
		if (!product) return;
		setAddingToCart(true);
		try {
			await addToCart({
				id: product.id,
				name: product.name,
				price: product.price,
				image: product.image,
				unit: product.unit,
				shopId: product.shopId,
				shopName: shop?.name,
				farmerId: shop?.farmerId,
			});
			router.push('/(tabs)/cart');
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Failed to add to cart',
			});
		} finally {
			setAddingToCart(false);
		}
	};

	const renderSimilarProduct = ({ item }: { item: Product }) => (
		<TouchableOpacity
			style={styles.carouselItem}
			onPress={() => router.push(`/product/${item.id}`)}
		>
			<Image source={{ uri: item.image }} style={styles.carouselImage} />
			<Text style={styles.carouselName}>{item.name}</Text>
			<Text style={styles.carouselPrice}>৳{item.price.toFixed(2)}</Text>
		</TouchableOpacity>
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#4CAF50' />
				<Text style={styles.loadingText}>Loading product...</Text>
			</View>
		);
	}

	if (!product) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>Product not found</Text>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Image source={{ uri: product.image }} style={styles.image} />

			<View style={styles.productInfo}>
				<Text style={styles.name}>{product.name}</Text>
				<View style={styles.priceContainer}>
					<Text style={styles.price}>৳{product.price.toFixed(2)}</Text>
					<Text style={styles.unit}>/{product.unit}</Text>
				</View>
				{product.description && (
					<Text style={styles.description}>{product.description}</Text>
				)}
			</View>

			{shop && (
				<View style={styles.shopContainer}>
					<Text style={styles.sectionTitle}>Shop Details</Text>
					<View style={styles.shopHeader}>
						{shop.image && (
							<Image source={{ uri: shop.image }} style={styles.shopImage} />
						)}
						<View style={styles.shopInfo}>
							<Text style={styles.shopName}>{shop.name}</Text>
							{shop.rating && (
								<View style={styles.textWrapper}>
									<Ionicons name='star' size={16} color='#FFD700' />
									<Text style={styles.ratingText}>
										{shop.rating.toFixed(1)}
									</Text>
								</View>
							)}
						</View>
					</View>
					<View style={styles.shopDetails}>
						<Text style={styles.shopDetail}>Farmer ID: {shop.farmerId}</Text>
						<Text style={styles.shopDetail}>Shop: {shop.name}</Text>
						<Text style={styles.shopDetail}>Location: {shop.location}</Text>
						<Text style={styles.shopDetail}>
							{shop.productsCount ?? 0} products available
						</Text>
					</View>
				</View>
			)}

			<TouchableOpacity
				style={styles.addToCartButton}
				onPress={handleAddToCart}
				disabled={addingToCart}
			>
				<View style={styles.buttonContent}>
					{addingToCart ? (
						<ActivityIndicator color='#fff' />
					) : (
						<View style={styles.iconWithText}>
							<Ionicons name='cart-outline' size={20} color='#fff' />
							<Text style={styles.addToCartText}>Add to Cart</Text>
						</View>
					)}
				</View>
			</TouchableOpacity>

			{similarProducts.length > 0 && (
				<View style={styles.similarProductsContainer}>
					<Text style={styles.sectionTitle}>Similar Products</Text>
					<FlatList
						data={similarProducts}
						renderItem={renderSimilarProduct}
						keyExtractor={(item) => item.id}
						horizontal
						showsHorizontalScrollIndicator={false}
					/>
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: '#fff',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: '#666',
		marginTop: 10,
	},
	errorText: {
		fontSize: 18,
		color: '#ff3b30',
		textAlign: 'center',
		marginTop: 20,
	},
	image: {
		width: '100%',
		height: 300,
		resizeMode: 'cover',
		borderRadius: 12,
		marginBottom: 16,
	},
	productInfo: {
		marginBottom: 24,
	},
	name: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#333',
	},
	priceContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		marginTop: 4,
	},
	price: {
		fontSize: 22,
		fontWeight: '700',
		color: '#2e86de',
	},
	unit: {
		fontSize: 16,
		color: '#666',
		marginLeft: 4,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: '#555',
		marginTop: 12,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 12,
		color: '#4CAF50',
	},
	shopContainer: {
		backgroundColor: '#f8f9fa',
		borderRadius: 12,
		padding: 16,
		marginBottom: 24,
	},
	shopHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	shopImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginRight: 12,
	},
	shopInfo: {
		flex: 1,
	},
	shopName: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	textWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	ratingText: {
		marginLeft: 6,
		color: '#666',
	},
	shopDetails: {
		marginTop: 8,
	},
	shopDetail: {
		fontSize: 14,
		color: '#555',
		marginBottom: 4,
	},
	addToCartButton: {
		backgroundColor: '#4CAF50',
		padding: 14,
		borderRadius: 10,
		alignItems: 'center',
		marginBottom: 24,
	},
	buttonContent: {
		alignItems: 'center',
	},
	iconWithText: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	addToCartText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
		marginLeft: 8,
	},
	similarProductsContainer: {
		marginBottom: 40,
	},
	carouselItem: {
		width: 160,
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 12,
		marginRight: 12,
		alignItems: 'center',
		elevation: 2,
	},
	carouselImage: {
		width: 120,
		height: 120,
		borderRadius: 8,
		marginBottom: 8,
	},
	carouselName: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
		textAlign: 'center',
	},
	carouselPrice: {
		fontSize: 14,
		color: '#2e86de',
	},
});

export default ProductDetailScreen;
