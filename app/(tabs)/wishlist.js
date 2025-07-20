import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors, fontFamily, spacing } from '../../theme';
import { useStore } from '../../context/store';
import { LOCAL_IMAGES, PRODUCTS } from '../(data)/products';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

function AnimatedAddToCartButton({ onPress, title }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  function handlePress() {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
    onPress();
  }
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.addToCartBtn}
        onPress={handlePress}
        accessibilityRole="button"
      >
        <Text style={styles.addToCartText}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function WishlistScreen() {
  const { wishlist, removeFromWishlist, addToCart, updateWishlistItem } = useStore();
  const router = useRouter();

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Your Wishlist is empty.</Text>
      </View>
    );
  }

  function getProductDetails(id) {
    return PRODUCTS.find(p => p.id === id);
  }

  function renderRightActions(item, progress, dragX) {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.swipeRemove, { transform: [{ scale }] }]}> 
        <Pressable
          onPress={() => {
            removeFromWishlist(item.id);
            if (item && item.id) {
              trackEvent({
                eventType: 'remove_from_wishlist',
                productId: item.id,
                metadata: { productName: item.title, price: item.price }
              });
            }
          }}
          style={styles.removeBtn}
          accessibilityLabel={`Remove ${item.title} from wishlist`}
          accessibilityRole="button"
        >
          <Text style={styles.removeBtnText}>Remove</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FlatList
      data={wishlist}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const product = getProductDetails(item.id) || item;
        const images = LOCAL_IMAGES[product.id] || [product.image];
        const quantity = item.quantity || 1;
        const quantityAnim = new Animated.Value(1);
        const animateQuantity = () => {
          Animated.sequence([
            Animated.timing(quantityAnim, { toValue: 1.2, duration: 120, useNativeDriver: true }),
            Animated.spring(quantityAnim, { toValue: 1, friction: 3, useNativeDriver: true })
          ]).start();
        };
        function handleAddToCart() {
          addToCart({ ...product, quantity });
        }
        return (
          <Swipeable
            renderRightActions={(progress, dragX) => renderRightActions(product, progress, dragX)}
            overshootRight={false}
          >
            <Pressable
              style={styles.itemRow}
              onPress={() => router.push(`/product/${product.id}`)}
              accessibilityLabel={`View details for ${product.title}`}
              accessibilityRole="button"
            >
              <ExpoImage
                source={images[0]}
                style={styles.image}
                contentFit="cover"
              />
              <View style={styles.itemDetails}>
                <Text style={styles.title}>{product.title}</Text>
                <Text style={styles.price}>{product.price}</Text>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (quantity > 1) {
                        updateWishlistItem(item.id, quantity - 1);
                        animateQuantity();
                      }
                    }}
                    accessibilityLabel={`Decrease quantity of ${product.title}`}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </Pressable>
                  <Animated.Text style={[styles.qtyText, { transform: [{ scale: quantityAnim }] }]}>x{quantity}</Animated.Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => {
                      updateWishlistItem(item.id, quantity + 1);
                      animateQuantity();
                    }}
                    accessibilityLabel={`Increase quantity of ${product.title}`}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
                <AnimatedAddToCartButton
                  onPress={handleAddToCart}
                  title="Add to Cart"
                />
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeFromWishlist(item.id)}
                  accessibilityLabel={`Remove ${product.title} from wishlist`}
                  accessibilityRole="button"
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              </View>
            </Pressable>
          </Swipeable>
        );
      }}
    />  
      {/* Footer with compliance links */}
      <View style={styles.footer}>
        <Pressable onPress={() => router.push('/privacy-policy')} accessibilityRole="link" accessibilityLabel="Privacy Policy">
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.footerSeparator}>|</Text>
        <Pressable onPress={() => router.push('/terms-of-service')} accessibilityRole="link" accessibilityLabel="Terms of Service">
          <Text style={styles.footerLink}>Terms of Service</Text>
        </Pressable>
        <Text style={styles.footerSeparator}>|</Text>
        <Pressable onPress={() => router.push('/return-policy')} accessibilityRole="link" accessibilityLabel="Return Policy">
          <Text style={styles.footerLink}>Return Policy</Text>
        </Pressable>
        <Text style={styles.footerSeparator}>|</Text>
        <Pressable onPress={() => router.push('/contact')} accessibilityRole="link" accessibilityLabel="Contact">
          <Text style={styles.footerLink}>Contact</Text>
        </Pressable>
      </View>
    </ScrollView>  
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F0', padding: 16 },
  footer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.ivory,
    borderTopWidth: 1,
    borderColor: colors.softGoldBorder,
    marginTop: spacing.lg,
  },
  footerLink: {
    color: colors.gold,
    fontSize: 15,
    fontFamily: fontFamily.sans,
    marginHorizontal: spacing.sm,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    color: colors.onyxBlack,
    fontSize: 16,
    marginHorizontal: 2,
  },
  listContent: { paddingVertical: 32, paddingHorizontal: 12, alignItems: 'center' },
  itemRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 12, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#E5DCC3', width: 360 },
  image: { width: 72, height: 90, borderRadius: 12, backgroundColor: '#FAF7F0', marginRight: 16 },
  itemDetails: { flex: 1, justifyContent: 'center', marginLeft: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  price: { fontSize: 15, color: '#BFA054', marginBottom: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#BFA054', alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  qtyBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  qtyText: { fontSize: 16, color: '#1A1A1A', fontWeight: '700', minWidth: 24, textAlign: 'center' },
  removeBtn: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FAF7F0', borderWidth: 1, borderColor: '#BFA054' },
  removeBtnText: { color: '#BFA054', fontWeight: '700', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#7C7C7C', fontSize: 18, marginTop: 60 },
  addToCartBtn: {
    marginTop: 8,
    backgroundColor: '#2ECC8F',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: fontFamily.sans,
  },
});
