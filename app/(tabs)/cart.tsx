import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useCart } from '../../context/CartProvider';
import { collection, addDoc, getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

export default function CartScreen() {
  const { cartItems, total, removeFromCart, updateQuantity, clearCart, loading } = useCart();
  const { user } = useAuth();
  const [placingOrder, setPlacingOrder] = useState(false);
  const db = getFirestore(app);

  const showNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      await showNotification('Order Failed', 'Your cart is empty');
      return;
    }

    if (!user) {
      await showNotification('Order Failed', 'Please login to place an order');
      return;
    }

    setPlacingOrder(true);
    try {
      // Create order document with shop information
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.id,
        userEmail: user.email,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          image: item.image || '',
          shopId: item.shopId,
          shopName: item.shopName,
          farmerId: item.farmerId
        })),
        total: total,
        status: 'pending',
        createdAt: new Date(),
        deliveryAddress: 'To be specified',
        contactNumber: 'To be specified'
      });

      // Clear the user's cart after successful order
      const cartRef = doc(db, 'carts', user.id);
      await setDoc(cartRef, { items: [] });
      
      await showNotification('Order Successful', `Order #${orderRef.id} placed successfully!`);
      clearCart();
    } catch (error) {
      console.error('Error placing order:', error);
      await showNotification('Order Failed', 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
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
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>৳{item.price.toFixed(2)}/{item.unit}</Text>
                  {item.shopName && (
                    <>
                      <Text style={styles.shopName}>Shop: {item.shopName}</Text>
                      <Text style={styles.shopName}>Farmer ID: {item.farmerId}</Text>
                    </>
                  )}
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Ionicons name="remove-circle-outline" size={24} color={item.quantity <= 1 ? '#ccc' : '#2e86de'} />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Ionicons name="add-circle-outline" size={24} color="#2e86de" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />

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
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
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
  },
  shopName: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
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
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
});