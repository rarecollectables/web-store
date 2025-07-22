import { View, Text, StyleSheet, Image as RNImage, ScrollView, Pressable, useWindowDimensions, FlatList, Platform, Animated } from 'react-native';
import CartAddedModal from '../components/CartAddedModal';
import { Image as ExpoImage } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { PRODUCTS, LOCAL_IMAGES as DATA_IMAGES } from '../(data)/products';
import { useStore } from '../../context/store';
import FeatureTiles from '../components/FeatureTiles';
import { Alert } from 'react-native';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme/index.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchProductById } from '../../lib/supabase/fetchProductById';
import { supabase } from '../../lib/supabase/client';
import { trackEvent } from '../../lib/trackEvent';
import LuxuryModal from '../components/LuxuryModal';
import CollapsibleSection from '../components/CollapsibleSection';

import ZoomableImage from '../components/ZoomableImage';
import RelatedProductsSection from '../components/RelatedProductsSection';
import ProductReviews from '../components/ProductReviews';

function MemoCarouselImage({ item, style, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Zoom image" accessibilityRole="imagebutton">
      <ExpoImage source={item} style={style} contentFit="cover" transition={300} />
    </Pressable>
  );
}

export default function ProductDetail() {
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const [carouselWidth, setCarouselWidth] = useState(width); // <-- new state
  const [featureModal, setFeatureModal] = useState({ open: false });
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wishAnimating, setWishAnimating] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const addCartAnim = useRef(new Animated.Value(1));
  const { addToCart, addToWishlist, cart } = useStore();
  // --- Ring size state ---
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeModal, setShowSizeModal] = useState(false); // New state for ring size modal
  const [pendingAddToCart, setPendingAddToCart] = useState(false); // To track if add to cart is waiting for size selection
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  let images = [];
  if (product) {
    if (DATA_IMAGES[product.id]) {
      images = DATA_IMAGES[product.id];
    } else if (product.additional_images && Array.isArray(product.additional_images) && product.additional_images.length > 0) {
      images = [
        ...(product.image_url ? [{ uri: product.image_url }] : (product.image ? [{ uri: product.image }] : [])),
        ...product.additional_images.filter(Boolean).map(url => ({ uri: url }))
      ];
    }
  }

  // --- Product Video ---
  const renderProductVideo = () => {
    if (!product || !product.video_url) return null;
    // For web, use <video>; for native, show a placeholder or use a library if available
    if (Platform.OS === 'web') {
      return (
        <View style={{ width: '100%', marginTop: 16, marginBottom: 24, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
          <video
            src={product.video_url}
            controls
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', maxWidth: 640, borderRadius: 8, margin: '0 auto', backgroundColor: '#000' }}
            poster={product.image_url || undefined}
          />
        </View>
      );
    } else {
      return (
        <View style={{ width: '100%', marginTop: 16, marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>
            Video preview available on web
          </Text>
        </View>
      );
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Calculate regular price based on product ID (some 20% off, some 40% off)
  const calculateRegularPrice = (salesPrice, productId) => {
    const numericPrice = typeof salesPrice === 'number' ? salesPrice : 
                        typeof salesPrice === 'string' ? parseFloat(salesPrice.replace(/[£\s]/g, '')) : 0;
    
    if (isNaN(numericPrice)) {
      return 'Price N/A';
    }
    
    // Use product ID to determine discount rate
    // Products with even IDs get 40% off, odd IDs get 20% off
    const discountMultiplier = productId % 2 === 0 ? 1.67 : 1.25; // ~40% vs 20% discount
    
    // Regular price calculation
    const regularPrice = Math.round((numericPrice * discountMultiplier) * 100) / 100;
    return `£${regularPrice.toFixed(2)}`;
  };
  
  // Get discount percentage based on product ID
  const getDiscountPercentage = (productId) => {
    return productId % 2 === 0 ? '40%' : '20%';
  };

  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const renderCarouselImage = useCallback(({ item }) => (
    <MemoCarouselImage
      item={item}
      style={[
        styles.image,
        width < 600
          ? { width: carouselWidth - 32, maxHeight: 230, resizeMode: 'contain', aspectRatio: undefined }
          : { width: carouselWidth - 32 }
      ]}
      onPress={() => {
        setZoomImage(item);
        setZoomVisible(true);
      }}
    />
  ), [carouselWidth, width, styles.image]);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        // Fetch product data
        const supaProduct = await fetchProductById(id);
        
        if (!isMounted) return;
        
        // Always fetch the actual review count directly from reviews table
        try {
          // First, try direct match
          let { data, error } = await supabase
            .from('reviews')
            .select('id', { count: 'exact' })
            .eq('product_id', id);
          
          // If no results, try text search as fallback (for UUID vs TEXT mismatch)
          if (!error && data.length === 0) {
            const { data: textSearchData, error: textSearchError } = await supabase
              .from('reviews')
              .select('id', { count: 'exact' })
              .ilike('product_id', `%${id}%`);
              
            if (!textSearchError) {
              data = textSearchData;
            }
          }
              
          if (!error && isMounted) {
            // Update the product with the actual review count
            supaProduct.review_count = data?.length || 0;
            console.log(`Product ${id} has ${supaProduct.review_count} reviews`);
            
            // Also update the database for future queries
            await supabase
              .from('products')
              .update({ review_count: supaProduct.review_count })
              .eq('id', id);
          }
        } catch (countErr) {
          console.error('Error fetching review count:', countErr);
        }
        
        setProduct(supaProduct);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError('Product not found.');
        setLoading(false);
      }
    }
    loadProduct();
    return () => { isMounted = false; };
  }, [id]);

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

  function handleAddToCart(currentQuantity) {
    // For rings, require a size selection
    if (product.category === 'Rings' && Array.isArray(product.size_options) && product.size_options.length > 0 && !selectedSize) {
      setShowSizeModal(true);
      setPendingAddToCart(true);
      return;
    }
    Animated.sequence([
    Animated.timing(addCartAnim.current, { toValue: 1.15, duration: 120, useNativeDriver: true }),
    Animated.spring(addCartAnim.current, { toValue: 1, friction: 3, useNativeDriver: true })
  ]).start();
  const imageUri = (Array.isArray(images) && images[0]?.uri) ? images[0].uri : (product?.image_url || product?.image || '');

  // currentQuantity is passed as argument
  const newQuantity = currentQuantity + 1;

  addToCart({
    ...product,
    selectedSize: product.category === 'Rings' ? selectedSize : undefined,
    price: typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price).replace(/[£\s]/g, '')) || 0,
    image: imageUri,
    quantity: newQuantity,
  });
  trackEvent({
    eventType: 'add_to_cart',
    productId: product?.id,
    quantity: newQuantity,
    metadata: { productName: product?.title || product?.name, price: product?.price, selectedSize: product.category === 'Rings' ? selectedSize : undefined }
  });
  setCartModalVisible(true);
}

  function handleWishlist() {
    setWishAnimating(true);
    setIsWishlisted((prev) => !prev);
    const eventType = isWishlisted ? 'remove_from_wishlist' : 'add_to_wishlist';
    if (product) {
      if (!isWishlisted) {
        addToWishlist(product);
      }
      trackEvent({
        eventType,
        productId: product.id,
        metadata: { productName: product.title || product.name, price: product.price }
      });
    }
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start(() => {
      setWishAnimating(false);
      if (!isWishlisted) {
        Alert.alert('Added to Wishlist', `${product.title} has been added to your wishlist.`);
      } else {
        Alert.alert('Removed from Wishlist', `${product.title} has been removed from your wishlist.`);
      }
    });
  }

  if (loading) {
    return (
      <View style={styles.modal}>
        <Text style={{ margin: 20, color: colors.text }}>Loading...</Text>
      </View>
    );
  }
  if (error || !product) {
    return (
      <LuxuryModal visible={true} showClose={false} animation="fade">
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Text style={{ color: colors.gold, fontSize: 24, fontWeight: 'bold', marginBottom: spacing.md, fontFamily, letterSpacing: 0.5, textAlign: 'center' }}>
            Welcome to Rare Collectables!
          </Text>
          <Text style={{ color: colors.platinum, fontSize: 16, marginBottom: spacing.lg, fontFamily, textAlign: 'center', maxWidth: 340 }}>
            We couldn't find that product, but you can search our shop for it or explore other luxury items.
          </Text>
          <Pressable
            style={{ backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: 12, paddingHorizontal: 36, marginTop: 8 }}
            onPress={() => router.replace('/shop')}
            accessibilityLabel="Go to Shop"
          >
            <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5, fontFamily }}>Go to Shop</Text>
          </Pressable>
        </View>
      </LuxuryModal>
    );
  }

  // Calculate currentQuantity for Add to Cart
  let currentQuantity = 0;
  if (cart && product) {
    const match = cart.find(item => item.id === product.id && (product.category !== 'Rings' || item.selectedSize === selectedSize));
    currentQuantity = match ? (match.quantity || 0) : 0;
  }

  const isDesktop = width >= 1024;
  const desktopContainer = isDesktop ? {
    flexDirection: 'row',
    maxWidth: 1160,
    marginHorizontal: 'auto',
    alignItems: 'flex-start',
    padding: 48,
    gap: 48,
    minHeight: '70vh',
  } : {};
  const desktopImageWrapper = isDesktop ? {
    flex: 1.15,
    maxWidth: 440,
    minWidth: 340,
    marginRight: 48,
    marginBottom: 0,
    boxShadow: '0 8px 32px rgba(0,0,0,.10)',
    backgroundColor: '#f8f8f8',
    alignSelf: 'flex-start',
  } : {};
  const desktopInfo = isDesktop ? {
    flex: 1.5,
    alignItems: 'flex-start',
    textAlign: 'left',
    justifyContent: 'center',
    gap: 18,
  } : {};
  const desktopTitle = isDesktop ? { fontSize: 26, textAlign: 'left', marginTop: 0 } : {};
  const desktopPrice = isDesktop ? { fontSize: 22, paddingHorizontal: 30, paddingVertical: 12 } : {};
  const desktopDescription = isDesktop ? { fontSize: 16, textAlign: 'left', lineHeight: 26, maxHeight: 72, overflow: 'hidden', textOverflow: 'ellipsis' } : {};
  const desktopActionContainer = isDesktop ? { justifyContent: 'flex-start', gap: 24 } : {};
  const desktopButton = isDesktop ? { fontSize: 18, paddingVertical: 14, paddingHorizontal: 32, minWidth: 140 } : {};

  return (
    <>
      {/* Ring Size Modal */}
      {showSizeModal && product.category === 'Rings' && Array.isArray(product.size_options) && (
        <LuxuryModal visible={showSizeModal} showClose={true} animation="fade" onRequestClose={() => setShowSizeModal(false)}>
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <Text style={{ color: colors.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 16, fontFamily, textAlign: 'center' }}>
              Select Ring Size
            </Text>
            <Text style={{ color: colors.platinum, fontSize: 16, marginBottom: 18, fontFamily, textAlign: 'center', maxWidth: 340 }}>
              Please choose a ring size to add this item to your cart.
            </Text>
            <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, minWidth: 36, alignItems: 'center', backgroundColor: '#fff', marginBottom: 18 }}>
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                style={{ fontSize: 15, border: 'none', background: 'transparent', outline: 'none' }}
              >
                <option value="">Select</option>
                {product.size_options.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </View>
            <Pressable
              style={{ backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: 12, paddingHorizontal: 36, marginTop: 8 }}
              onPress={() => {
                if (selectedSize) {
                  setShowSizeModal(false);
                  if (pendingAddToCart) {
                    setPendingAddToCart(false);
                    handleAddToCart(currentQuantity); // Retry add to cart now that size is selected
                  }
                }
              }}
              accessibilityLabel="Confirm ring size"
            >
              <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5, fontFamily }}>Add to Cart</Text>
            </Pressable>
            <Pressable
              style={{ marginTop: 12 }}
              onPress={() => {
                setShowSizeModal(false);
                setPendingAddToCart(false);
              }}
              accessibilityLabel="Cancel size selection"
            >
              <Text style={{ color: colors.gold, fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </LuxuryModal>
      )}
      <CartAddedModal
        visible={cartModalVisible}
        onGoToCart={() => {
          setCartModalVisible(false);
          router.push({ pathname: '/(tabs)/cart', params: { from: 'detail', productId: product?.id } });
        }}
        onContinue={() => setCartModalVisible(false)}
      />
      <View style={{ flex: 1, backgroundColor: colors.white }}>

      <Pressable
        style={[styles.closeButton, { left: 16, right: undefined }]}
        onPress={() => {
          if (router.canGoBack && router.canGoBack()) {
            router.back();
          } else {
            router.replace('/shop');
          }
        }}
        accessibilityLabel="Close product detail"
        accessibilityRole="button"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <FontAwesome name="close" size={26} color="#bfa14a" />
        </View>
      </Pressable>
      <ScrollView>
        <View style={{ ...styles.container, ...desktopContainer, marginBottom: 8 }}>
          {/* --- Product Media Section --- */}
          <View style={{ ...styles.imageWrapper, ...desktopImageWrapper }}>
            {/* Enhanced Carousel with Arrows and Dots */}
            {images.length > 1 ? (
              <View
                style={styles.enhancedCarouselWrapper}
                onLayout={e => {
                  const w = e.nativeEvent.layout.width;
                  if (w && w !== carouselWidth) setCarouselWidth(w);
                }}
              >
                {/* Left Arrow */}
                <Pressable
                  style={[styles.carouselArrow, styles.carouselArrowLeft]}
                  onPress={() => {
                    if (images.length > 1 && flatListRef.current) {
                      const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
                      flatListRef.current.scrollToIndex({ index: prevIndex, animated: true });
                      setCurrentIndex(prevIndex);
                    }
                  }}
                  accessibilityLabel="Previous image"
                  accessibilityRole="button"
                >
                  <FontAwesome name="chevron-left" size={28} color={currentIndex === 0 ? '#ccc' : colors.gold} />
                </Pressable>
                {/* Image Carousel */}
                <FlatList
                  ref={flatListRef}
                  data={images}
                  renderItem={({ item, index }) => (
                    <View style={{ marginHorizontal: 8 }}>
                      <MemoCarouselImage
                        item={item}
                        style={[
                          styles.image,
                          width < 600
                            ? { width: carouselWidth - 32, maxHeight: 230, resizeMode: 'contain', aspectRatio: undefined }
                            : { width: carouselWidth - 32 }
                        ]}
                        onPress={() => {
                          setZoomImage(item);
                          setZoomVisible(true);
                        }}
                      />
                    </View>
                  )}
                  keyExtractor={(_, idx) => String(idx)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  style={[styles.carousel, { width: carouselWidth }]}
                  getItemLayout={(data, index) => ({ length: carouselWidth, offset: carouselWidth * index, index })}
                  onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
                    if (flatListRef.current && highestMeasuredFrameIndex >= 0) {
                      flatListRef.current.scrollToIndex({
                        index: highestMeasuredFrameIndex,
                        animated: true,
                      });
                    }
                  }}
                  extraData={currentIndex}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                  snapToInterval={carouselWidth}
                  decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
                />
                {/* Right Arrow */}
                <Pressable
                  style={[styles.carouselArrow, styles.carouselArrowRight]}
                  onPress={() => {
                    if (images.length > 1 && flatListRef.current) {
                      const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
                      flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
                      setCurrentIndex(nextIndex);
                    }
                  }}
                  accessibilityLabel="Next image"
                  accessibilityRole="button"
                >
                  <FontAwesome name="chevron-right" size={28} color={currentIndex === images.length - 1 ? '#ccc' : colors.gold} />
                </Pressable>
                {/* Dots Indicator */}
                <View style={styles.carouselDotsWrapper}>
                  {images.map((_, idx) => (
                    <Pressable
                      key={idx}
                      style={[styles.carouselDot, currentIndex === idx && styles.carouselDotActive]}
                      onPress={() => {
                        if (flatListRef.current) {
                          flatListRef.current.scrollToIndex({ index: idx, animated: true });
                          setCurrentIndex(idx);
                        }
                      }}
                      accessibilityLabel={`Go to image ${idx + 1}`}
                      accessibilityRole="button"
                    />
                  ))}
                </View>
              </View>
            ) : (
              images[0] && <ExpoImage source={images[0]} style={styles.image} contentFit="cover" />
            )}
            {/* --- Product Video Section (always inside media column) --- */}
            {isDesktop ? (
              product && product.video_url ? (
                <View style={{ width: '100%', maxWidth: 400, marginTop: 18, marginBottom: 24, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', alignSelf: 'center' }}>
                  <video
                    src={product.video_url}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', maxWidth: 400, borderRadius: 8, margin: '0 auto', backgroundColor: '#000', display: 'block' }}
                    poster={product.image_url || undefined}
                  />
                </View>
              ) : null
            ) : renderProductVideo()}
          </View>


          {/* --- Main Info Section --- */}
          <View style={[
            { flex: 1.5 },
            width < 600
              ? { paddingHorizontal: 16, width: '100%', alignSelf: 'center', boxSizing: 'border-box' }
              : desktopInfo
          ]}>
            {/* --- Product Summary Section --- */}
            <View style={{ marginBottom: 18, width: '100%' }}>
              {/* Title & Brand */}
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: width < 600 ? 17 : 22,
                    fontWeight: 'bold',
                    marginBottom: 4,
                    textAlign: width >= 1024 ? 'left' : 'center',
                    marginLeft: width >= 1024 ? 0 : undefined,
                  },
                ]}
                accessibilityRole="header"
              >
                {product?.title || product?.name || 'Untitled Product'}
              </Text>
              {/* Brand Placeholder */}
              {/* <Text style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>Brand: {product?.brand || 'N/A'}</Text> */}
              {/* Star Ratings with Dynamic Review Count */}
              <Pressable 
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', width: '100%' }}
                onPress={() => {
                  // Find the reviews section and scroll to it
                  const reviewsSection = document.getElementById('customer-reviews-section');
                  if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                accessibilityLabel="View reviews"
                accessibilityRole="button"
              >
                {/* Stars based on product rating */}
                {[1,2,3,4,5].map(i => (
                  <FontAwesome key={i} name="star" size={16} color={i <= (product?.rating || 4) ? '#FFD700' : '#ccc'} style={{ marginRight: 2 }} />
                ))}
                <Text style={{ color: '#888', fontSize: 13, marginLeft: 6, textDecorationLine: 'underline' }}>
                  ({product?.review_count || 0} reviews)
                </Text>
              </Pressable>
              {/* Short Description */}
              <Text style={{ color: '#555', fontSize: 16, marginBottom: 8, width: '100%', flexShrink: 1 }} numberOfLines={2}>{product?.short_description || 'A rare and unique collectable item.'}</Text>
              {/* Price & Shipping Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12, flexWrap: 'wrap', width: '100%' }}>
                <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.regularPrice]}>Regular Price: {calculateRegularPrice(product?.price, product?.id)}</Text>
                  </View>
                  <Text style={[styles.salesPrice, { fontSize: 22, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.gold, color: colors.white, borderWidth: 1, borderColor: colors.softGoldBorder, ...desktopPrice }]}>{product?.price}</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#4caf50', fontWeight: '600', marginTop: 8 }}>Free shipping & Free returns</Text>
              </View>
            </View>

            {/* --- Purchase Actions Section --- */}
            {/* On mobile, render size selector above actions; on desktop, keep inline */}
            {width < 600 && product.category === 'Rings' && Array.isArray(product.size_options) && product.size_options.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, marginRight: 6 }}>Size</Text>
                <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, minWidth: 36, alignItems: 'center', backgroundColor: '#fff' }}>
                  <select
                    value={selectedSize}
                    onChange={e => setSelectedSize(e.target.value)}
                    style={{ fontSize: 15, border: 'none', background: 'transparent', outline: 'none' }}
                  >
                    <option value="">Select</option>
                    {product.size_options.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </View>
              </View>
            )}
            <View style={{
              width: '100%',
              flexDirection: width < 600 ? 'row' : 'row',
              alignItems: 'center',
              gap: width < 600 ? 8 : 18,
              marginTop: 0,
              marginBottom: 24,
              paddingBottom: 0,
              borderBottomWidth: 0,
              ...desktopActionContainer
            }}>
              {/* Ring Size Selector for Rings (desktop/tablet only) */}
              {width >= 600 && product.category === 'Rings' && Array.isArray(product.size_options) && product.size_options.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18, flexShrink: 1, marginBottom: 0 }}>
                  <Text style={{ fontSize: 15, marginRight: 6 }}>Size</Text>
                  <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, minWidth: 36, alignItems: 'center', backgroundColor: '#fff' }}>
                    <select
                      value={selectedSize}
                      onChange={e => setSelectedSize(e.target.value)}
                      style={{ fontSize: 15, border: 'none', background: 'transparent', outline: 'none' }}
                    >
                      <option value="">Select</option>
                      {product.size_options.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </View>
                </View>
              )}
              {/* Quantity Selector */}
              {/* Quantity Selector */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: width < 600 ? 8 : 18, flexShrink: 1, marginBottom: 0 }}>
                <Text style={{ fontSize: 15, marginRight: 6 }}>Qty</Text>
                <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, minWidth: 36, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15 }}>1</Text>
                </View>
              </View>
              
              {/* Add to Cart Button */}
              <Pressable
                style={{
                  ...styles.button,
                  ...desktopButton,
                  flex: 1,
                  marginRight: 0,
                  minWidth: width < 600 ? 0 : 140,
                  paddingHorizontal: width < 600 ? 0 : 24,
                  justifyContent: 'center',
                }}
                onPress={() => handleAddToCart(currentQuantity)}
                accessibilityLabel="Add to cart"
              >
                <Text style={styles.buttonText}>Add to Cart</Text>
              </Pressable>
              {/* Wishlist Button */}
              <Pressable
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  backgroundColor: '#fff',
                  borderWidth: 1.5,
                  borderColor: colors.gold,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: width < 600 ? 8 : 12,
                  shadowColor: '#000',
                  shadowOpacity: 0.07,
                  shadowRadius: 4,
                  elevation: 2,
                  position: 'relative',
                  zIndex: 2,
                }}
                onPress={handleWishlist}
                accessibilityLabel="Add to wishlist"
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <FontAwesome name={isWishlisted ? 'heart' : 'heart-o'} size={24} color={colors.gold} />
                </Animated.View>
              </Pressable>
            </View>

            </View>
          </View>
          {/* Feature Tiles */}
          <FeatureTiles onTilePress={(idx, feature) => setFeatureModal({ open: true, idx, feature })} />
          {featureModal?.open && (
            <Pressable
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setFeatureModal({ open: false })}
              accessibilityLabel="Close feature info modal"
              accessibilityRole="button"
            >
              <View style={{ backgroundColor: '#fff', borderRadius: 22, padding: 36, maxWidth: 390, width: '92%', alignItems: 'center', boxShadow: '0 6px 36px rgba(191,161,74,0.13), 0 2px 24px rgba(0,0,0,0.10)' }}>
                <View style={{ backgroundColor: '#f8f5ea', borderRadius: 48, padding: 18, marginBottom: 18 }}>
                  <FontAwesome name={featureModal?.feature?.icon} size={44} color={'#bfa14a'} />
                </View>
                <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 7, color: '#bfa14a', textAlign: 'center', fontFamily: 'serif' }}>{featureModal?.feature?.title}</Text>
                {(() => {
                  switch (featureModal?.feature?.title) {
                    case 'Premium Quality':
                      return <>
                        <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 }}>
                          <FontAwesome name="check-circle" size={16} color="#bfa14a" /> 100% genuine, handpicked collectables. Each piece is meticulously inspected for authenticity and craftsmanship, ensuring it will be treasured for generations.
                        </Text>
                        <Text style={{ fontSize: 15, color: '#7d5a18', textAlign: 'center', marginBottom: 4, fontWeight: '600' }}>
                          <FontAwesome name="star" size={14} color="#bfa14a" /> 5,000+ delighted collectors trust us.
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 }}>
                          Invest in lasting value and beauty—guaranteed.
                        </Text>
                        <Pressable onPress={() => {
                          setFeatureModal({ open: false });
                          setTimeout(() => {
                            router.push('/#bestsellers');
                          }, 300);
                        }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>See Best Sellers</Text>
                        </Pressable>
                      </>;
                    case 'Free UK Shipping':
                      return <>
                        <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 }}>
                          <FontAwesome name="truck" size={16} color="#bfa14a" /> Enjoy fast, tracked UK delivery on every order—always free, no minimum spend.
                        </Text>
                        <Text style={{ fontSize: 15, color: '#7d5a18', textAlign: 'center', marginBottom: 4, fontWeight: '600' }}>
                          <FontAwesome name="clock-o" size={14} color="#bfa14a" /> Most items are dispatched in 1-2 working days.
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 4 }}>
                          Next day delivery available on selected products.
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 }}>
                          Shop today and your collectable will be on its way in no time!
                        </Text>
                        <Pressable onPress={() => { setFeatureModal({ open: false }); /* TODO: scroll to products */ }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Shop Now</Text>
                        </Pressable>
                      </>;
                    case '60-Day Returns':
                      return <>
                        <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 }}>
                          <FontAwesome name="undo" size={16} color="#bfa14a" /> Changed your mind? No problem. Return any item within 60 days for a full refund—no questions asked.
                        </Text>
                        <Text style={{ fontSize: 15, color: '#7d5a18', textAlign: 'center', marginBottom: 4, fontWeight: '600' }}>
                          <FontAwesome name="thumbs-o-up" size={14} color="#bfa14a" /> Hassle-free, customer-first returns process.
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 }}>
                          Buy with complete confidence and peace of mind.
                        </Text>
                        <Pressable onPress={() => { setFeatureModal({ open: false }); /* TODO: scroll to returns info */ }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Learn More</Text>
                        </Pressable>
                      </>;
                    case 'Lifetime Warranty':
                      return <>
                        <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 }}>
                          <FontAwesome name="shield" size={16} color="#bfa14a" /> Every purchase is protected for life. If your collectable ever fails to meet our standards, we’ll repair or replace it—no charge.
                        </Text>
                        <Text style={{ fontSize: 15, color: '#7d5a18', textAlign: 'center', marginBottom: 4, fontWeight: '600' }}>
                          <FontAwesome name="certificate" size={14} color="#bfa14a" /> Certificate of Authenticity provided for select jewellery.
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 }}>
                          Your trust means everything—shop with total assurance.
                        </Text>
                        <Pressable onPress={() => { setFeatureModal({ open: false }); /* TODO: scroll to warranty info */ }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>See Our Guarantee</Text>
                        </Pressable>
                      </>;
                    default:
                      return <Text style={{ fontSize: 16, color: '#444', textAlign: 'center' }}>{featureModal?.feature?.description}</Text>;
                  }
                })()}
                <Text style={{ fontSize: 13, color: '#bfa14a', marginTop: 20, textAlign: 'center', fontWeight: '600' }}>
                  <FontAwesome name="lock" size={13} color="#bfa14a" /> Secure checkout & 100% satisfaction guarantee
                </Text>
                <Text style={{ fontSize: 12, color: '#aaa', marginTop: 7, textAlign: 'center' }}>Tap anywhere to close</Text>
              </View>
            </Pressable>
          )}
        {/* --- Detailed Product Info Section --- */}
        <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', backgroundColor: '#f8f8f8', borderRadius: 18, padding: 28, marginTop: 16, marginBottom: 32, gap: 16, boxShadow: '0 4px 24px rgba(0,0,0,.04)' }}>

          {/* Description */}
          <CollapsibleSection title="Description" initiallyCollapsed={false}>
            <Text style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>{product?.description}</Text>
          </CollapsibleSection>
          {/* Features */}
          <CollapsibleSection title="Product Features">
            {Array.isArray(product?.features) ? (
              <View style={{ marginTop: 2 }}>
                {product.features.map((f, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ color: '#bfa14a', fontWeight: 'bold', fontSize: 15, marginRight: 8 }}>•</Text>
                    <Text style={{ color: '#444', fontSize: 15, flex: 1 }}>{f}</Text>
                  </View>
                ))}
              </View>
            ) : product?.features ? (
              <Text style={{ color: '#444', fontSize: 15 }}>{product.features}</Text>
            ) : null}

            {/* --- Structured Features Table --- */}
            {(() => {
               const sizeLabel = product.category === 'Rings'
                 ? 'Ring Size'
                 : product.category === 'Bracelets'
                 ? 'Bracelet Size'
                 : 'Size';
               const rows = [
                 product.material && { label: 'Material', value: product.material },
                 product.size && { label: sizeLabel, value: product.size },
                 product.length && { label: 'Length', value: product.length },
                 product.stone && { label: 'Stone', value: product.stone },
               ].filter(Boolean);
              if (!rows.length) return null;
              return (
                <View style={{ marginTop: 16, marginBottom: 2, borderWidth: 1, borderColor: '#e5dec7', borderRadius: 10, overflow: 'hidden' }}>
                  {rows.map((row, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: 'row',
                        backgroundColor: idx % 2 === 0 ? '#faf8f3' : '#fff',
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderBottomWidth: idx !== rows.length - 1 ? 1 : 0,
                        borderBottomColor: '#eee5c2',
                      }}
                    >
                      <Text style={{ flex: 1.2, color: '#bfa14a', fontWeight: '600', fontSize: 15 }}>{row.label}</Text>
                      <Text style={{ flex: 2, color: '#444', fontSize: 15 }}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </CollapsibleSection>

          {/* What You'll Get */}
          <CollapsibleSection title="What You'll Get">
            <View style={{ marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ color: '#bfa14a', fontWeight: 'bold', fontSize: 15, marginRight: 8 }}>•</Text>
                <Text style={{ color: '#444', fontSize: 15, flex: 1 }}>Luxury gift box with premium packaging</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ color: '#bfa14a', fontWeight: 'bold', fontSize: 15, marginRight: 8 }}>•</Text>
                <Text style={{ color: '#444', fontSize: 15, flex: 1 }}>Branded microfiber cleaning cloth</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ color: '#bfa14a', fontWeight: 'bold', fontSize: 15, marginRight: 8 }}>•</Text>
                <Text style={{ color: '#444', fontSize: 15, flex: 1 }}>Detailed care tips for your item</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#bfa14a', fontWeight: 'bold', fontSize: 15, marginRight: 8 }}>•</Text>
                <Text style={{ color: '#444', fontSize: 15, flex: 1 }}>Personalized thank you card</Text>
              </View>
            </View>
          </CollapsibleSection>
          {/* Shipping */}
          <CollapsibleSection title="Shipping">
            <Text style={{ color: '#444', fontSize: 15 }}>
              {product?.shipping || 'Free shipping and returns on all orders. Orders are dispatched within 1-2 business days and include tracking.'}
            </Text>
          </CollapsibleSection>
        </View>

        {/* --- Customer Reviews Section (Placeholder) --- */}
        {/* <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', marginBottom: 32, backgroundColor: '#fff', borderRadius: 18, padding: 28, gap: 16, borderWidth: 1, borderColor: '#f1e7d0', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>

        {/* --- Related Products Section --- */}
        {product && product.category && (
  <RelatedProductsSection
    category={product.category}
    excludeId={product.id}
    onProductPress={item => router.replace(`/product/${item.id}`)}
  />
)}

{/* Customer Reviews Section */}
<View 
  id="customer-reviews-section"
  style={{ maxWidth: 900, width: '100%', alignSelf: 'center', backgroundColor: '#f8f8f8', borderRadius: 18, padding: 28, marginTop: 16, marginBottom: 32, boxShadow: '0 4px 24px rgba(0,0,0,.04)' }}
>
  <CollapsibleSection title="Customer Reviews" initiallyCollapsed={false}>
    {/* Use our dynamic ProductReviews component */}
    <ProductReviews productId={product?.id} />
  </CollapsibleSection>
</View>

    
    <View style={{ width: '100%', backgroundColor: '#faf8f3', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 24, paddingHorizontal: 0, alignItems: 'center', marginTop: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.push('/privacy-policy')} accessibilityRole="link" accessibilityLabel="Privacy Policy">
            <Text style={{ color: '#bfa14a', fontWeight: '600', fontSize: 15, marginHorizontal: 8, marginVertical: 2 }}>Privacy Policy</Text>
          </Pressable>
          <Text style={{ color: '#bbb', fontSize: 18, marginHorizontal: 2 }}>|</Text>
          <Pressable onPress={() => router.push('/terms-of-service')} accessibilityRole="link" accessibilityLabel="Terms of Service">
            <Text style={{ color: '#bfa14a', fontWeight: '600', fontSize: 15, marginHorizontal: 8, marginVertical: 2 }}>Terms of Service</Text>
          </Pressable>
          <Text style={{ color: '#bbb', fontSize: 18, marginHorizontal: 2 }}>|</Text>
          <Pressable onPress={() => router.push('/return-policy')} accessibilityRole="link" accessibilityLabel="Return Policy">
            <Text style={{ color: '#bfa14a', fontWeight: '600', fontSize: 15, marginHorizontal: 8, marginVertical: 2 }}>Return Policy</Text>
          </Pressable>
          <Text style={{ color: '#bbb', fontSize: 18, marginHorizontal: 2 }}>|</Text>
          <Pressable onPress={() => router.push('/contact')} accessibilityRole="link" accessibilityLabel="Contact">
            <Text style={{ color: '#bfa14a', fontWeight: '600', fontSize: 15, marginHorizontal: 8, marginVertical: 2 }}>Contact</Text>
          </Pressable>
        </View>
      </View>
      </ScrollView>
      {zoomImage && (
        <ZoomableImage
          source={zoomImage}
          visible={zoomVisible}
          onClose={() => setZoomVisible(false)}
        />
      )}
    </View>
  </>
  );
}

const styles = StyleSheet.create({
  enhancedCarouselWrapper: {
    position: 'relative',
    width: '100%',
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginTop: -22,
  },
  carouselArrowLeft: {
    left: 10,
  },
  carouselArrowRight: {
    right: 10,
  },
  carouselDotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  carouselDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0d6b8',
    marginHorizontal: 4,
    opacity: 0.5,
    borderWidth: 1,
    borderColor: '#bfa14a',
  },
  carouselDotActive: {
    backgroundColor: '#bfa14a',
    opacity: 1,
    width: 16,
    borderRadius: 8,
  },

  footer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', alignItems: 'center',
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
  imageWrapper: {
    marginTop: 24,
    marginBottom: 22,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
    maxHeight: 320,
    backgroundColor: '#f8f8f8',
    alignSelf: 'center',
    borderRadius: 18,
  },
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
    fontSize: 22,
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
  regularPrice: {
    fontSize: 18,
    color: colors.gray,
    fontWeight: '400',
    textDecorationLine: 'line-through',
    letterSpacing: 0.5,
    fontFamily,
  },
  salesPrice: {
    fontSize: 24,
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#eee5c2',
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
      backgroundColor: '#f8f8f8',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    image: {
      width: '100%',
      aspectRatio: 1,
      resizeMode: 'contain',
      maxHeight: 320,
      backgroundColor: '#f8f8f8',
      alignSelf: 'center',
      borderRadius: 18,
    },
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
      fontSize: 22,
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