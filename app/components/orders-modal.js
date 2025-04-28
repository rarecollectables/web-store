import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

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

export function storeOrder(order, email) {
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
}

export default function OrdersModal({ visible, onClose, email }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    if (visible) {
      setOrders(getUserOrders(email));
    }
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
          {orders.length === 0 ? (
            <Text style={styles.empty}>No orders found for this device.</Text>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item, idx) => item.id || idx.toString()}
              renderItem={({ item }) => (
                <View style={styles.orderCard}>
                  <Text style={styles.orderId}>Order #{item.id || 'N/A'}</Text>
                  <Text style={styles.orderDate}>{item.date || 'Unknown Date'}</Text>
                  <Text style={styles.orderTotal}>Total: ₤{item.total?.toFixed(2) ?? 'N/A'}</Text>
                  {item.items && Array.isArray(item.items) && (
                    <View style={styles.orderItems}>
                      {item.items.map((prod, i) => (
                        <Text key={i} style={styles.orderItemText}>• {prod.title} x{prod.quantity}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: 360, backgroundColor: '#FFF', borderRadius: 18, padding: 18, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  header: { flex: 1, fontSize: 22, fontWeight: '900', color: '#BFA054', textAlign: 'left' },
  closeBtn: { padding: 4, marginLeft: 8 },
  empty: { textAlign: 'center', color: '#7C7C7C', fontSize: 16, marginVertical: 32 },
  orderCard: { backgroundColor: '#FAF7F0', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5DCC3' },
  orderId: { fontWeight: '700', color: '#1A1A1A', fontSize: 15 },
  orderDate: { color: '#7C7C7C', fontSize: 13, marginBottom: 2 },
  orderTotal: { color: '#BFA054', fontWeight: '700', fontSize: 15, marginBottom: 2 },
  orderItems: { marginTop: 2 },
  orderItemText: { color: '#1A1A1A', fontSize: 13 },
});
