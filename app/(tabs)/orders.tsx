import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { collection, query, where, getDocs, getFirestore, orderBy, doc, getDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  farmerId: string;
  shopId: string;
  shopName?: string;
};

type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
  deliveryAddress: string;
  userId: string;
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  const fetchShopInfo = async (shopId: string | undefined) => {
    if (!shopId) {
      return {
        name: 'Unknown Shop',
        farmerId: 'unknown'
      };
    }

    try {
      const shopRef = doc(db, 'shops', shopId);
      const shopSnap = await getDoc(shopRef);
      if (shopSnap.exists()) {
        return {
          name: shopSnap.data().name || 'Unknown Shop',
          farmerId: shopSnap.data().farmerId || 'unknown'
        };
      }
      return {
        name: 'Unknown Shop',
        farmerId: 'unknown'
      };
    } catch (error) {
      console.error('Error fetching shop info:', error);
      return {
        name: 'Unknown Shop',
        farmerId: 'unknown'
      };
    }
  };

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      let q;
      let querySnapshot;
      let usedFallback = false;
      
      try {
        q = query(
          collection(db, 'orders'),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        if (error instanceof Error && 'code' in error && (error as any).code === 'failed-precondition') {
          console.warn('Using fallback query - index may not be ready');
          q = query(
            collection(db, 'orders'),
            where('userId', '==', user.id)
          );
          querySnapshot = await getDocs(q);
          usedFallback = true;
        } else {
          throw error;
        }
      }

      const ordersData: Order[] = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        
        // Process items with shop info
        const itemsWithShopInfo = await Promise.all(
          data.items.map(async (item: any) => {
            const shopInfo = await fetchShopInfo(item.shopId);
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              unit: item.unit,
              image: item.image || 'https://via.placeholder.com/100',
              farmerId: shopInfo.farmerId,
              shopId: item.shopId || 'unknown',
              shopName: shopInfo.name
            };
          })
        );

        ordersData.push({
          id: doc.id,
          items: itemsWithShopInfo,
          total: data.total,
          status: data.status || 'pending',
          createdAt,
          deliveryAddress: data.deliveryAddress || 'To be specified',
          userId: data.userId
        });
      }

      if (usedFallback) {
        ordersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      setOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again later.');
      if (error instanceof Error && 'code' in error && (error as any).code === 'failed-precondition') {
        setError('Please create the required index in Firebase Console');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#FFC107';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="warning-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        {error.includes('index') && (
          <Text style={styles.helpText}>
            Click the link in your console to create the index
          </Text>
        )}
        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#2e86de" />
          <Text style={styles.refreshText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>You have no past orders</Text>
        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#2e86de" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Orders</Text>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.orderDate}>
              {format(item.createdAt, 'MMM dd, yyyy - hh:mm a')}
            </Text>

            <FlatList
              data={item.items}
              keyExtractor={(product) => `${product.id}-${Math.random().toString(36).substr(2, 9)}`}
              renderItem={({ item: product }) => (
                <View style={styles.itemContainer}>
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/100' }}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {product.quantity}x {product.name}
                    </Text>
                    <Text style={styles.itemUnit}>{product.unit}</Text>
                    
                    {/* Display Shop and Farmer Info */}
                    <View style={styles.shopInfoContainer}>
                      <View style={styles.shopInfoRow}>
                        <Ionicons name="storefront-outline" size={14} color="#666" />
                        <Text style={styles.shopInfoText}>{product.shopName}</Text>
                      </View>
                      <View style={styles.shopInfoRow}>
                        <Ionicons name="person-outline" size={14} color="#666" />
                        <Text style={styles.shopInfoText}>Farmer ID: {product.farmerId}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>
                    ৳{(product.price * product.quantity).toFixed(2)}
                  </Text>
                </View>
              )}
            />

            <View style={styles.orderFooter}>
              <Text style={styles.totalText}>Total: ৳{item.total.toFixed(2)}</Text>
              <TouchableOpacity 
                style={styles.addressButton}
                onPress={() => {
                  Alert.alert(
                    'Delivery Address',
                    item.deliveryAddress === 'To be specified' 
                      ? 'No address provided' 
                      : item.deliveryAddress
                  );
                }}
              >
                <Ionicons name="location-outline" size={16} color="#2e86de" />
                <Text style={styles.addressText}>
                  {item.deliveryAddress === 'To be specified' ? 
                   'Add Address' : 'View Address'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f1f8ff',
    borderRadius: 8,
  },
  refreshText: {
    color: '#2e86de',
    marginLeft: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 12,
    color: '#666',
  },
  shopInfoContainer: {
    marginTop: 4,
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  shopInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  addressText: {
    fontSize: 14,
    color: '#2e86de',
    marginLeft: 4,
  },
});