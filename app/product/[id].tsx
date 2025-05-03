import { useLocalSearchParams } from 'expo-router';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartProvider';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

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
        farmerId: shop?.farmerId
      });
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Added to Cart',
          body: `${product.name} was added to your cart`,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Error',
          body: 'Failed to add to cart',
        },
        trigger: null,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
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
    <View style={styles.container}>
      <Image 
        source={{ uri: product.image }} 
        style={styles.image}
        defaultSource={{ uri: 'https://via.placeholder.com/300' }}
      />

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
              <Image 
                source={{ uri: shop.image }} 
                style={styles.shopImage}
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
              />
            )}
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              {shop.rating && (
                <View style={styles.textWrapper}>
                  <Ionicons name="star" size={16} color="#FFD700" style={styles.iconMargin} />
                  <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.shopDetails}>
            <View style={styles.iconWithText}>
              <Ionicons name="key-outline" size={18} color="#555" style={styles.iconMargin} />
              <Text style={styles.shopDetail}>Farmer ID: {shop.farmerId}</Text>
            </View>

            <View style={styles.iconWithText}>
              <Ionicons name="storefront-outline" size={18} color="#555" style={styles.iconMargin} />
              <Text style={styles.shopDetail}>Shop: {shop.name}</Text>
            </View>
            
            <View style={styles.iconWithText}>
              <Ionicons name="location-outline" size={18} color="#555" style={styles.iconMargin} />
              <Text style={styles.shopDetail}>{shop.location}</Text>
            </View>
            
            {shop.productsCount && (
              <View style={styles.iconWithText}>
                <Ionicons name="basket-outline" size={18} color="#555" style={styles.iconMargin} />
                <Text style={styles.shopDetail}>{shop.productsCount} products available</Text>
              </View>
            )}
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
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addToCartText}>Add to Cart</Text>

            </>
          )}
        </View>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    marginTop: 8,
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
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    color: '#666',
  },
  shopDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconMargin: {
    marginRight: 8,
  },
  shopDetail: {
    fontSize: 14,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});