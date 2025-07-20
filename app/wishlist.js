import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../context/store';

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist, removeFromWishlist } = useStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Wishlist</Text>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: '#888', marginTop: 40 }}>Your wishlist is empty.</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{item.price}</Text>
            <Pressable onPress={() => {
              removeFromWishlist(item.id);
              Alert.alert('Removed', `${item.title} was removed from your wishlist.`);
            }}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
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
  close: { marginTop: 10, alignItems: 'center' },
  closeText: { color: '#888' }
});
