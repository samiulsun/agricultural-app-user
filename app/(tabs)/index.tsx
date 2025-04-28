import { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  shopId: string;
  unit: string;
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

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

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome {user?.name}!</Text>
        <Button title="Logout" onPress={logout} />
      </View>

      <Text style={styles.sectionTitle}>Featured Products</Text>
      
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No products available</Text>
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
                <Text style={styles.productName}>{item.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.productUnit}>/{item.unit}</Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}
          contentContainerStyle={styles.productsContainer}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productsContainer: {
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
    marginBottom: 8,
    borderRadius: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});