import { View, Text, StyleSheet, Image as RNImage, ScrollView, Pressable, useWindowDimensions, FlatList, Platform, Animated } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { PRODUCTS, LOCAL_IMAGES as DATA_IMAGES } from '../(data)/products';
import { useStore } from '../../context/store';
import { Alert } from 'react-native';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme/index.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wishAnimating, setWishAnimating] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const { addToCart, addToWishlist } = useStore();
  const addCartAnim = useRef(new Animated.Value(1));

  const product = PRODUCTS.find(p => p.id === id);
  if (!product) {
    return (
      <View style={styles.modal}>
        <Pressable style={styles.close} onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={{ margin: 20, color: colors.text }}>Product not found.</Text>
      </View>
    );
  }

  const images = DATA_IMAGES[product.id] || [{ uri: product.image }];

  // For manual swipe tracking
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 60 };

  // Auto-advance logic
  useEffect(() => {
    if (!images || images.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIdx = (prev + 1) % images.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: nextIdx, animated: true });
        }
        return nextIdx;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  function handleAddToCart() {
    Animated.sequence([
      Animated.timing(addCartAnim.current, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(addCartAnim.current, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
    // Always add with quantity 1, numeric price, and a valid image URI
    const imageUri = (Array.isArray(images) && images[0]?.uri) ? images[0].uri : (product.image || '');
    addToCart({
      ...product,
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
      image: imageUri,
      quantity: 1,
    });
    Alert.alert('Added to Cart', `${product.title} has been added to your cart.`);
  }

  function handleWishlist() {
    setWishAnimating(true);
    setIsWishlisted((prev) => !prev);
    if (!isWishlisted) addToWishlist(product);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start(() => setWishAnimating(false));
    if (!isWishlisted) {
      Alert.alert('Added to Wishlist', `${product.title} has been added to your wishlist.`);
    }
  }

  const MemoCarouselImage = memo(function CarouselImage({ item, style }) {
    return <ExpoImage source={item} style={style} contentFit="cover" transition={300} />;
  });

  return (
    <View style={styles.modal}>
      <Pressable style={styles.close} onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={useCallback(({ item }) => (
          <MemoCarouselImage item={item} style={styles.image} />
        ), [styles.image])}
        style={styles.carousel}
        initialScrollIndex={0}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        snapToAlignment="center"
        decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
      />
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 120 + insets.bottom }]}>
        <Text style={styles.title}>{product.title}</Text>
        <View style={styles.pricePillWrapper}>
          <Text style={styles.price}>{product.price}</Text>
        </View>
        <Text style={styles.description}>{product.description || 'Featuring exceptional craftsmanship and timeless design, this piece is a perfect addition to your collection.'}</Text>
        <Text style={styles.details}>{product.details}</Text>
        <View style={styles.divider} />
      </ScrollView>
      <View style={[styles.actionContainerFixed, { paddingBottom: insets.bottom + 12 }]}> 
        <Animated.View style={{ transform: [{ scale: addCartAnim.current }] }}>
          <Pressable
            style={styles.button}
            onPress={handleAddToCart}
            accessibilityLabel="Add to Cart"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Add to Cart</Text>
          </Pressable>
        </Animated.View>
        <Pressable
          style={styles.heartButton}
          onPress={handleWishlist}
          accessibilityLabel={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <FontAwesome
              name={isWishlisted ? 'heart' : 'heart-o'}
              size={30}
              color={isWishlisted ? colors.ruby : colors.softGoldBorder}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.softGoldBorder,
    ...shadows.card,
    paddingBottom: spacing.lg,
  },
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.white,
  },
  carousel: {
    width: '100%',
    height: 320,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 320,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.softGoldBorder,
    alignSelf: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.onyxBlack,
    fontFamily,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
    lineHeight: 32,
  },
  pricePillWrapper: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    marginTop: 0,
  },
  price: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gold,
    overflow: 'hidden',
    fontFamily,
    letterSpacing: 0.2,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    ...shadows.card,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.platinum,
    fontFamily,
    lineHeight: 24,
    opacity: 0.92,
  },
  details: {
    fontSize: 15,
    color: colors.muted,
    marginVertical: spacing.sm,
    textAlign: 'center',
    fontFamily,
    lineHeight: 20,
    opacity: 0.8,
  },
  divider: {
    width: '70%',
    height: 1,
    backgroundColor: colors.softGoldBorder,
    alignSelf: 'center',
    marginVertical: spacing.md,
    opacity: 0.5,
    borderRadius: 1,
  },
  actionContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  actionContainerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.softGoldBorder,
    ...shadows.card,
    zIndex: 20,
  },
  button: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 8,
    marginLeft: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 140,
  },
  buttonText: {
    color: colors.onyxBlack,
    fontSize: 18,
    fontWeight: '700',
    fontFamily,
    letterSpacing: 0.2,
  },
  close: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
    marginRight: spacing.md,
    marginBottom: spacing.sm,
    zIndex: 10,
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  closeText: { fontSize: 24, color: colors.platinum },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.softGoldBorder,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.gold,
  },
  heartButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.softGoldBorder,
    marginLeft: spacing.md,
    shadowColor: colors.ruby,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
});
