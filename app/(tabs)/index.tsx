import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  shopId: string;
  unit: string;
};


// Add these type definitions
type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  city: string;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const db = getFirestore(app);

  // Replace with your actual OpenWeather API Key
  const OPENWEATHER_API_KEY = 'd734f951c52155a9771143721b7eb908';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({ 
            id: doc.id, 
            name: data.name || 'No Name',
            price: data.price || 0,
            image: data.image || 'https://via.placeholder.com/150',
            shopId: data.shopId || '',
            unit: data.unit || ''
          });
        });
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWeather = async () => {
      try {
        // Replace with your city name or get user's location
        const city = 'Dhaka'; // Default city
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const data = await response.json();
        
        if (data.cod === 200) {
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: mapWeatherIcon(data.weather[0].icon),
            city: data.name
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

  // Helper function to map OpenWeather icons to Ionicons
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Welcome, <Text style={styles.userName}>{user?.name}</Text>
          </Text>
          {weather && (
            <View style={styles.weatherContainer}>
              <Ionicons 
                name={weather.icon === 'partly-sunny' ? 'partly-sunny-outline' : 'sunny-outline'} 
                size={20} 
                color="#666" 
              />
              <Text style={styles.weatherText}>
                {weather.temp}°C • {weather.description}
              </Text>
            </View>
          )}
        </View>
        <Link href="/profile" asChild>
          <TouchableOpacity>
            <Ionicons name="person-circle-outline" size={32} color="#4CAF50" />
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.sectionTitle}>Fresh Products</Text>
      
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/product/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity style={styles.productCard}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.productImage} 
                  defaultSource={{ uri: 'https://via.placeholder.com/150' }}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>৳{item.price.toFixed(2)}</Text>
                    <Text style={styles.productUnit}>/{item.unit}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
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
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
    color: '#333',
  },
  productsContainer: {
    paddingBottom: 20,
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
});