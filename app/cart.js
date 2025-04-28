import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../context/store';

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart } = useStore();
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price.replace(/[^\d.]/g, '')), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Cart</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: '#888', marginTop: 40 }}>Your cart is empty.</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{item.price}</Text>
            <Pressable onPress={() => {
              removeFromCart(item.id);
              Alert.alert('Removed', `${item.title} was removed from your cart.`);
            }}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
      <Text style={styles.total}>Total: £{total.toFixed(2)}</Text>
      <Pressable style={styles.checkoutButton} onPress={() => {/* navigate to checkout */}}>
        <Text style={styles.checkoutText}>Checkout</Text>
      </Pressable>
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, flex: 1 },
  price: { fontSize: 16, marginHorizontal: 10 },
  remove: { color: '#E5006D', fontWeight: 'bold' },
  total: { fontSize: 18, fontWeight: 'bold', marginVertical: 20 },
  checkoutButton: { backgroundColor: '#E5006D', padding: 12, borderRadius: 8 },
  checkoutText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  close: { marginTop: 10, alignItems: 'center' },
  closeText: { color: '#888' }
});
