import { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	Image,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	TextInput,
	ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';
import {
	Ionicons,
	MaterialIcons,
	FontAwesome,
	MaterialCommunityIcons,
} from '@expo/vector-icons';

type Product = {
	id: string;
	name: string;
	price: number;
	image: string;
	shopId: string;
	unit: string;
	type: string;
};

type WeatherData = {
	temp: number;
	description: string;
	icon: string;
	city: string;
};

type Category = {
	name: string;
	icon: JSX.Element;
};

export default function HomeScreen() {
	const { user } = useAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [categories, setCategories] = useState<Category[]>([]);
	const db = getFirestore(app);

	const OPENWEATHER_API_KEY = 'd734f951c52155a9771143721b7eb908';

	// Map product types to icons
	const getCategoryIcon = (categoryName: string) => {
		switch (categoryName.toLowerCase()) {
			case 'vegetables':
				return <MaterialIcons name='eco' size={20} color='#4CAF50' />;
			case 'fruits':
				return <FontAwesome name='apple' size={20} color='#FF9800' />;
			case 'beverages':
				return <MaterialCommunityIcons name='cup' size={20} color='#2196F3' />;
			case 'grocery':
				return (
					<MaterialCommunityIcons name='shopping' size={20} color='#795548' />
				);
			case 'edible oil':
				return (
					<MaterialCommunityIcons
						name='bottle-tonic'
						size={20}
						color='#FFC107'
					/>
				);
			case 'house':
				return <MaterialIcons name='home' size={20} color='#9C27B0' />;
			default:
				return <Ionicons name='grid' size={20} color='#607D8B' />;
		}
	};

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, 'products'));
				const productsData: Product[] = [];
				const uniqueCategories = new Set<string>(['all']);

				querySnapshot.forEach((doc) => {
					const data = doc.data();
					const productType = data.type || 'general';
					productsData.push({
						id: doc.id,
						name: data.name || 'No Name',
						price: data.price || 0,
						image: data.image || 'https://via.placeholder.com/150',
						shopId: data.shopId || '',
						unit: data.unit || '',
						type: productType,
					});
					uniqueCategories.add(productType);
				});

				// Create category objects with icons
				const categoryList: Category[] = Array.from(uniqueCategories).map(
					(cat) => ({
						name: cat,
						icon: getCategoryIcon(cat),
					})
				);

				setProducts(productsData);
				setFilteredProducts(productsData);
				setCategories(categoryList);
			} catch (error) {
				console.error('Error fetching products:', error);
			} finally {
				setLoading(false);
			}
		};

		const fetchWeather = async () => {
			try {
				const city = 'Dhaka';
				const response = await fetch(
					`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
				);
				const data = await response.json();

				if (data.cod === 200) {
					setWeather({
						temp: Math.round(data.main.temp),
						description: data.weather[0].description,
						icon: mapWeatherIcon(data.weather[0].icon),
						city: data.name,
					});
				} else {
					console.error('Weather API error:', data.message);
				}
			} catch (error) {
				console.error('Error fetching weather:', error);
			} finally {
				setWeatherLoading(false);
			}
		};

		fetchProducts();
		fetchWeather();
	}, []);

	useEffect(() => {
		let filtered = [...products];

		// Apply category filter
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(
				(product) => product.type === selectedCategory
			);
		}

		// Apply search filter
		if (searchQuery.trim() !== '') {
			filtered = filtered.filter((product) =>
				product.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		setFilteredProducts(filtered);
	}, [searchQuery, products, selectedCategory]);

	const mapWeatherIcon = (iconCode: string) => {
		const iconMap: Record<string, string> = {
			'01d': 'sunny',
			'01n': 'moon',
			'02d': 'partly-sunny',
			'02n': 'cloudy-night',
			'03d': 'cloud',
			'03n': 'cloud',
			'04d': 'cloudy',
			'04n': 'cloudy',
			'09d': 'rainy',
			'09n': 'rainy',
			'10d': 'rainy',
			'10n': 'rainy',
			'11d': 'thunderstorm',
			'11n': 'thunderstorm',
			'13d': 'snow',
			'13n': 'snow',
			'50d': 'cloudy',
			'50n': 'cloudy',
		};
		return iconMap[iconCode] || 'partly-sunny';
	};

	const handleCategoryPress = (category: string) => {
		setSelectedCategory(category);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#4CAF50' />
			</View>
		);
	}

	// Limit the number of featured products to 6
	const featuredProducts = filteredProducts.slice(0, 6);

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			{/* Combined Search and Header Section */}
			<View style={styles.topSection}>
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Text style={styles.welcomeText}>
							Hello,{' '}
							<Text style={styles.userName}>{user?.name || 'Guest'}</Text>
						</Text>
						{weather && (
							<View style={styles.weatherBox}>
								<Ionicons
									name={`${weather.icon}-outline`}
									size={20}
									color='#4CAF50'
									style={{ marginRight: 4 }}
								/>
								<Text style={styles.weatherText}>
									{weather.temp}°C • {weather.description}
								</Text>
							</View>
						)}
					</View>
					<Link href='/profile' asChild>
						<TouchableOpacity>
							<Ionicons
								name='person-circle-outline'
								size={40}
								color='#4CAF50'
								style={{
									shadowColor: '#000',
									shadowOpacity: 0.2,
									shadowRadius: 5,
								}}
							/>
						</TouchableOpacity>
					</Link>
				</View>

				{/* Search Bar */}
				<View style={styles.searchSection}>
					<Ionicons
						name='search'
						size={20}
						color='#aaa'
						style={styles.searchIcon}
					/>
					<TextInput
						placeholder='Search products...'
						placeholderTextColor='#aaa'
						style={styles.searchInput}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
			</View>

			{/* Categories Horizontal Scroll */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Categories</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoriesScrollContent}
				>
					{categories.map((category) => (
						<TouchableOpacity
							key={category.name}
							style={[
								styles.categoryButton,
								selectedCategory === category.name &&
									styles.selectedCategoryButton,
							]}
							onPress={() => handleCategoryPress(category.name)}
						>
							<View style={styles.categoryIconContainer}>{category.icon}</View>
							<Text
								style={[
									styles.categoryText,
									selectedCategory === category.name &&
										styles.selectedCategoryText,
								]}
							>
								{category.name.charAt(0).toUpperCase() + category.name.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Featured Products Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Featured Products</Text>
					{featuredProducts.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Ionicons name='sad-outline' size={48} color='#ccc' />
						<Text style={styles.emptyText}>No products found</Text>
					</View>
				) : (
					<FlatList
						data={featuredProducts}
						numColumns={2}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<Link
								href={{ pathname: '/product/[id]', params: { id: item.id } }}
								asChild
							>
								<TouchableOpacity style={styles.productCard}>
									{item.type === 'new' && (
										<View style={styles.newBadge}>
											<Text style={styles.newBadgeText}>NEW</Text>
										</View>
									)}
									<Image
										source={{ uri: item.image }}
										style={styles.productImage}
										defaultSource={{ uri: 'https://via.placeholder.com/150' }}
									/>
									<View style={styles.productInfo}>
										<Text style={styles.productName} numberOfLines={1}>
											{item.name}
										</Text>
										<View style={styles.priceContainer}>
											<Text style={styles.productPrice}>
													৳{item.price.toFixed(2)}
											</Text>
											<Text style={styles.productUnit}>/{item.unit}</Text>
										</View>
									</View>
								</TouchableOpacity>
							</Link>
						)}
						contentContainerStyle={styles.productsContainer}
						scrollEnabled={false}
					/>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
		paddingHorizontal: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	topSection: {
		marginBottom: 16,
	},
	searchSection: {
		position: 'relative',
		marginBottom: 16,
	},
	searchInput: {
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingHorizontal: 40,
		paddingVertical: 12,
		fontSize: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	searchIcon: {
		position: 'absolute',
		left: 16,
		top: 14,
		zIndex: 1,
	},
	header: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
		padding: 12,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
		paddingLeft: 20,
		paddingRight: 20,
	},

	headerLeft: {
		flex: 1,
		justifyContent: 'center',
	},

	welcomeText: {
		fontSize: 18,
		color: '#333',
		marginBottom: 10,
	},

	userName: {
		fontWeight: 'bold',
		color: '#4CAF50',
	},

	weatherBox: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#E8F5E9',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 12,
		marginTop: 4,
		marginRight: 150,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},

	weatherText: {
		fontSize: 14,
		color: '#388E3C',
	},
	sectionContainer: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#333',
	},
	// Categories styles
	categoriesScrollContent: {
		paddingHorizontal: 4,
		paddingBottom: 8,
	},
	categoryButton: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
		backgroundColor: '#fff',
		marginRight: 12,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	selectedCategoryButton: {
		backgroundColor: '#4CAF50',
	},
	categoryIconContainer: {
		marginRight: 8,
	},
	categoryText: {
		fontSize: 14,
		color: '#666',
		fontWeight: '500',
	},
	selectedCategoryText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	productsContainer: {
		paddingBottom: 40,
	},
	productCard: {
		flex: 1,
		margin: 8,
		backgroundColor: '#fff',
		borderRadius: 12,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
		position: 'relative',
	},
	newBadge: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: '#4ECDC4',
		borderRadius: 4,
		paddingHorizontal: 6,
		paddingVertical: 2,
		zIndex: 1,
	},
	newBadgeText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: 'bold',
	},
	productImage: {
		width: '100%',
		height: 140,
		resizeMode: 'cover',
		backgroundColor: '#f5f5f5',
	},
	productInfo: {
		padding: 12,
	},
	productName: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
		color: '#333',
	},
	priceContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	productPrice: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#4CAF50',
	},
	productUnit: {
		fontSize: 12,
		color: '#666',
		marginLeft: 4,
		marginBottom: 1,
	},
	emptyContainer: {
		alignItems: 'center',
		padding: 32,
	},
	emptyText: {
		fontSize: 16,
		color: '#888',
		marginTop: 8,
	},
});
