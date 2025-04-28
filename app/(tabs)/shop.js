import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, Animated } from 'react-native';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { PRODUCTS, LOCAL_IMAGES } from '../(data)/products';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';
import { useStore } from '../../context/store';
import { Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const CARD_ASPECT_RATIO = 1.25;
const CARD_MIN_WIDTH = 220;
const CARD_MAX_WIDTH = 320;
const GRID_GAP = 24;
const GRID_PADDING = 24;

function ProductCard({ item, cardWidth, router }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [pressed, setPressed] = useState(false);
  const { addToCart } = useStore();
  const images = LOCAL_IMAGES[item.id] || [item.image];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  let SPS;
  if (Platform.OS !== 'web') {
    try { SPS = require('react-native-skeleton-placeholder').default; } catch {}
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  function handleAddToCart() {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
    const imageUri = (Array.isArray(images) && images[0]?.uri) ? images[0].uri : (item.image || '');
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    addToCart({
      ...item,
      price,
      image: imageUri,
      quantity: 1,
    });
    Alert.alert('Added to Cart', `${item.title} has been added to your cart.`);
  }

  return (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth, opacity: pressed ? 0.96 : 1 },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}`}
    >
      <View style={styles.imageWrapper}>
        <ExpoImage
          source={images[currentIndex]}
          style={styles.image}
          contentFit="cover"
          transition={300}
          onLoad={() => setImgLoaded(true)}
        />
        {!imgLoaded && SPS && (
          <SPS>
            <SPS.Item width={cardWidth} height={cardWidth * 1.25} borderRadius={borderRadius.md} />
          </SPS>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            style={styles.addToCartBtn}
            onPress={(e) => {
              e.stopPropagation && e.stopPropagation();
              handleAddToCart();
            }}
            accessibilityLabel={`Add ${item.title} to cart`}
            accessibilityRole="button"
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const MemoProductCard = memo(ProductCard);

function ShopScreen() {
  const { width } = useWindowDimensions();
  const { category } = useGlobalSearchParams();
  const filteredProducts = category
    ? PRODUCTS.filter(p => p.category.toLowerCase() === category.toLowerCase())
    : PRODUCTS;
  const numColumns = Math.max(
    1,
    Math.floor((width - GRID_PADDING * 2 + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP))
  );
  const cardWidth = Math.min(
    CARD_MAX_WIDTH,
    (width - GRID_PADDING * 2 - (numColumns - 1) * GRID_GAP) / numColumns
  );
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }) => (
      <MemoProductCard
        item={item}
        cardWidth={cardWidth}
        router={router}
      />
    ),
    [cardWidth, router]
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: GRID_GAP } : undefined}
        contentContainerStyle={{
          paddingHorizontal: GRID_PADDING,
          paddingBottom: GRID_PADDING,
          gap: GRID_GAP,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        removeClippedSubviews={true}
        windowSize={5}
      />
    </View>
  );
}

export default ShopScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.md,
    marginBottom: GRID_GAP,
    ...shadows.card,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: CARD_ASPECT_RATIO,
    backgroundColor: colors.softGoldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    backgroundColor: colors.softGoldBorder,
  },
  cardContent: {
    padding: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onyxBlack,
    marginBottom: 6,
    fontFamily,
  },
  price: {
    fontSize: 16,
    color: colors.gold,
    marginBottom: 12,
    fontFamily,
  },
  addToCartBtn: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addToCartText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    fontFamily,
  },
});
