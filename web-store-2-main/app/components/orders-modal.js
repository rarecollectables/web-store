import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { saveOrderToDatabase, getCustomerOrders } from '../../lib/orders/orderService';

function getDeviceKey() {
  // For web, fallback to localStorage/device fingerprint; for native, use user agent or random
  if (typeof window !== 'undefined' && window.navigator) {
    return window.navigator.userAgent || 'web';
  }
  return 'unknown-device';
}

function getUserOrders(email) {
  // Orders are stored locally by email (if provided), else by device key
  if (typeof window !== 'undefined' && window.localStorage) {
    if (email) {
      const key = `ORDERS_EMAIL_${email.toLowerCase()}`;
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
    const key = `ORDERS_${getDeviceKey()}`;
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

export async function storeOrder(order, email) {
  // First save to database (if possible)
  try {
    // Save to Supabase database
    await saveOrderToDatabase(order);
  } catch (err) {
    console.error('Failed to save order to database:', err);
    // Continue with localStorage save even if database fails
  }

  // Save order to web localStorage history by email (if provided), else by device
  if (typeof window !== 'undefined' && window.localStorage) {
    if (email) {
      const key = `ORDERS_EMAIL_${email.toLowerCase()}`;
      const existing = getUserOrders(email);
      const updated = [order, ...existing];
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
    // Always also save by device for device-based lookup
    const deviceKey = `ORDERS_${getDeviceKey()}`;
    const existingDevice = getUserOrders();
    const updatedDevice = [order, ...existingDevice];
    window.localStorage.setItem(deviceKey, JSON.stringify(updatedDevice));
  }

  return order;
}

export default function OrdersModal({ visible, onClose, email }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchOrders() {
      if (!visible) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get orders from localStorage first for immediate display
        const localOrders = getUserOrders(email);
        setOrders(localOrders);
        
        // If we have an email, also fetch from database
        if (email) {
          const dbOrders = await getCustomerOrders(email);
          
          // Merge orders from database and localStorage, removing duplicates
          // We identify duplicates by payment intent ID or order number
          const mergedOrders = [...dbOrders];
          
          // Add local orders that aren't in the database yet
          localOrders.forEach(localOrder => {
            const isDuplicate = mergedOrders.some(dbOrder => 
              (localOrder.paymentIntentId && dbOrder.paymentIntentId === localOrder.paymentIntentId) ||
              (localOrder.id && dbOrder.id === localOrder.id)
            );
            
            if (!isDuplicate) {
              mergedOrders.push(localOrder);
            }
          });
          
          // Sort by date, newest first
          mergedOrders.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
          });
          
          setOrders(mergedOrders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load all orders. Some orders may be missing.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, [visible, email]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            <FontAwesome name="list-alt" size={22} color="#BFA054" style={{ marginRight: 8 }} />
            <Text style={styles.header}>My Orders</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close Orders">
              <FontAwesome name="close" size={22} color="#BFA054" />
            </Pressable>
          </View>
          
          {loading && orders.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#BFA054" />
              <Text style={styles.loadingText}>Loading your orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <Text style={styles.empty}>No orders found for this device.</Text>
          ) : (
            <>
              {error && <Text style={styles.errorText}>{error}</Text>}
              {loading && <ActivityIndicator size="small" color="#BFA054" style={styles.miniLoader} />}
              <FlatList
                data={orders}
                keyExtractor={(item, idx) => item.id || idx.toString()}
                renderItem={({ item }) => (
                <View style={styles.orderCard}>
                  <Text style={styles.orderId}>{item.id || 'Order #N/A'}</Text>
                  <Text style={styles.orderDate}>
                    {item.date 
                      ? new Date(item.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'Unknown Date'}
                  </Text>
                  <Text style={styles.orderStatus}>{item.status || 'Processing'}</Text>
                  <Text style={styles.orderTotal}>Total: ₤{item.total?.toFixed(2) ?? 'N/A'}</Text>
                  {item.items && Array.isArray(item.items) && (
                    <View style={styles.orderItems}>
                      {item.items.map((prod, i) => (
                        <Text key={i} style={styles.orderItemText}>• {prod.title || prod.name} x{prod.quantity}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              style={{ marginTop: 8 }}
            />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: 360, backgroundColor: '#FFF', borderRadius: 18, padding: 18, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6, maxHeight: '80%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  header: { flex: 1, fontSize: 22, fontWeight: '900', color: '#BFA054', textAlign: 'left' },
  closeBtn: { padding: 4, marginLeft: 8 },
  empty: { textAlign: 'center', color: '#7C7C7C', fontSize: 16, marginVertical: 32 },
  orderCard: { backgroundColor: '#FAF7F0', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5DCC3' },
  orderId: { fontWeight: '700', color: '#1A1A1A', fontSize: 16, marginBottom: 4 },
  orderDate: { color: '#7C7C7C', fontSize: 14, marginBottom: 4 },
  orderStatus: { color: '#4CAF50', fontWeight: '600', fontSize: 14, marginBottom: 4 },
  orderTotal: { color: '#BFA054', fontWeight: '700', fontSize: 15, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#E5DCC3', paddingTop: 8, marginTop: 4 },
  orderItems: { marginTop: 4 },
  orderItemText: { color: '#1A1A1A', fontSize: 14, marginBottom: 2, paddingLeft: 4 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#7C7C7C', fontSize: 16 },
  miniLoader: { marginVertical: 8 },
  errorText: { color: '#E53935', fontSize: 14, marginBottom: 8, textAlign: 'center' },
});
