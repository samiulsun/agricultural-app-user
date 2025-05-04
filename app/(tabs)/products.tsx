import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Product type
type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  unit: string;
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<{ id: string; name: string; price: number; image: string; unit: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if cached data exists
        const cachedProducts = await AsyncStorage.getItem('products');
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
        }

        // Fetch fresh data from Firestore
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            name: data.name || 'No Name',
            price: data.price || 0,
            image: data.image || 'https://via.placeholder.com/150',
            unit: data.unit || '',
          });
        });

        // Update state and cache the data
        setProducts(productsData);
        await AsyncStorage.setItem('products', JSON.stringify(productsData));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Explore Our Products</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/product/[id]', params: { id: item.id } }} asChild>
            <TouchableOpacity style={styles.productCard}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>৳{item.price.toFixed(2)}</Text>
                <Text style={styles.productUnit}>/{item.unit}</Text>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.productsContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  productsContainer: {
    padding: 16,
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
