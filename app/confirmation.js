import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../context/store';
import { colors, fontFamily } from '../theme';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { cart } = useStore();

  const subtotal = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * (item.quantity || 1), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Thank You for Your Purchase!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully.</Text>
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDetails}>Qty: {item.quantity || 1}</Text>
                <Text style={styles.itemDetails}>₤{((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * (item.quantity || 1)).toFixed(2)}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.summaryText}>Subtotal: ₤{subtotal.toFixed(2)}</Text>
          <Text style={styles.summaryText}>Tax (10%): ₤{tax.toFixed(2)}</Text>
          <Text style={styles.summaryTextBold}>Total: ₤{total.toFixed(2)}</Text>
        </View>
        <Text style={styles.delivery}>Estimated delivery: 2-4 business days</Text>
        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(tabs)/shop')}
          accessibilityLabel="Continue Shopping"
        >
          <Text style={styles.buttonText}>Continue Shopping</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 28 },
  title: { fontSize: 28, fontWeight: '900', color: colors.gold, marginBottom: 10, fontFamily, textAlign: 'center' },
  subtitle: { fontSize: 18, color: colors.black, marginBottom: 24, fontFamily, textAlign: 'center' },
  orderSummary: { backgroundColor: colors.white, borderRadius: 18, padding: 18, marginBottom: 24, shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, color: colors.gold, fontWeight: '700', marginBottom: 12, fontFamily },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  image: { width: 56, height: 56, borderRadius: 10, marginRight: 14, backgroundColor: colors.border },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.black, fontFamily },
  itemDetails: { fontSize: 14, color: colors.platinum, fontFamily },
  summaryText: { fontSize: 15, color: colors.black, fontFamily, marginTop: 6 },
  summaryTextBold: { fontSize: 17, color: colors.gold, fontWeight: '900', fontFamily, marginTop: 8 },
  delivery: { color: colors.emerald, fontSize: 15, fontFamily, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: colors.gold, borderRadius: 24, paddingVertical: 16, alignItems: 'center', shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 18, fontFamily },
});
