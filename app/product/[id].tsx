import { useLocalSearchParams } from 'expo-router';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartProvider';
import { Ionicons } from '@expo/vector-icons';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  shopId: string;
  unit: string;
  description?: string;
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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const db = getFirestore(app);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch product details
        const productRef = doc(db, 'products', id as string);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          throw new Error('Product not found');
        }

        const productData = productSnap.data();
        const currentProduct = {
          id: productSnap.id,
          name: productData.name || 'No Name',
          price: productData.price || 0,
          image: productData.image || 'https://via.placeholder.com/300',
          shopId: productData.shopId || '',
          unit: productData.unit || '',
          description: productData.description
        };
        setProduct(currentProduct);

        // 2. Fetch shop details if product has shopId
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
              productsCount: shopData.productsCount || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit
      });
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <Image 
        source={{ uri: product.image }} 
        style={styles.image}
        defaultSource={{ uri: 'https://via.placeholder.com/300' }}
      />

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.name}>{product.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.unit}>/{product.unit}</Text>
        </View>

        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}
      </View>

      {/* Shop Details */}
      {shop && (
        <View style={styles.shopContainer}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          
          <View style={styles.shopHeader}>
            {shop.image && (
              <Image 
                source={{ uri: shop.image }} 
                style={styles.shopImage}
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
              />
            )}
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              {shop.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.shopDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="key-outline" size={18} color="#555" />
              <Text style={styles.shopDetail}>Farmer ID: {shop.farmerId}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="key-outline" size={18} color="#555" />
              <Text style={styles.shopDetail}>Shop name: {shop.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color="#555" />
              <Text style={styles.shopDetail}>{shop.location}</Text>
            </View>
            
            {shop.productsCount && (
              <View style={styles.detailRow}>
                <Ionicons name="basket-outline" size={18} color="#555" />
                <Text style={styles.shopDetail}>{shop.productsCount} products available</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Add to Cart Button */}
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={handleAddToCart}
        disabled={addingToCart}
      >
        {addingToCart ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text> {/* Wrap text in <Text> */}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 8,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
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
    marginBottom: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#666',
  },
  shopDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopDetail: {
    fontSize: 14,
    marginLeft: 8,
    color: '#555',
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});