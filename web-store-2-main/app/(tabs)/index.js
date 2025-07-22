import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ImageBackground, ScrollView, TextInput, Alert, Linking, Animated } from 'react-native';
import { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { trackEvent } from '../../lib/trackEvent';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme/index.js';
import ChatScreen from '../chat/index.js';
import PaymentMethodsRow from '../(components)/PaymentMethodsRow';
import AnnaWelcomePopup from '../components/AnnaWelcomePopup';
import SpringPromoModal from '../components/SpringPromoModal';
import BestSellersSection from '../components/BestSellersSection';
import MostPopularSection from '../components/MostPopularSection';
import CartAddedModal from '../components/CartAddedModal';
import ReviewsCarousel from '../components/ReviewsCarousel';
import FeatureTiles from '../components/FeatureTiles';
import LuxuryModal from '../components/LuxuryModal';
import PackagingShowcase from '../components/PackagingShowcase';

// Category definitions for homepage
const CATEGORIES = [
  { id: 'necklaces', title: 'Necklaces' },
  { id: 'earrings', title: 'Earrings' },
  { id: 'bracelets', title: 'Bracelets' },
  { id: 'rings', title: 'Rings' },
  { id: 'jewellery_set', title: 'Jewellery Set' }
];

// Local category image assets mapping
const CATEGORY_IMAGES = {
  necklaces: [
    require('../../assets/images/products/1-2-Necklace.avif'),
    require('../../assets/images/products/1-5-Necklace.avif'),
    require('../../assets/images/products/3-1-Necklace.avif'),
    require('../../assets/images/products/3-5-Necklace.avif')
  ],
  bracelets: [
    require('../../assets/images/products/6-1.avif'),
    require('../../assets/images/products/6-4.avif'),
    require('../../assets/images/products/3-4.avif'),
    require('../../assets/images/products/3-1.avif')
  ],
  rings: [
    require('../../assets/images/products/7-1.avif'),
    require('../../assets/images/products/7-5.avif'),
    require('../../assets/images/products/4-1-ring.avif'),
    require('../../assets/images/products/4-2-ring.avif')
  ],
  earrings: [
    require('../../assets/images/products/8-1.avif'),
    require('../../assets/images/products/8-5.avif'),
    require('../../assets/images/products/1-1-earrings.avif'),
    require('../../assets/images/products/1-5-earrings.avif')
  ],
  jewellery_set: [
    // Representative images for "Jewellery Set" (using a mix of necklace, ring, and earrings)
    require('../../assets/images/products/1-two-piece-jewellery-set-4.avif'),
    require('../../assets/images/products/2-four-piece-jewellery-set-5.avif'),
    require('../../assets/images/products/2-four-piece-jewellery-set-6.avif'),
    require('../../assets/images/products/2-three-piece-jewellery-set-2.avif'),
    require('../../assets/images/products/2-three-piece-jewellery-set-3.avif')
  ]
};

// Animated Category Card
function CategoryCard({ id, title, cardSize, marginRight, onPress, images, cardStyles }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [images.length]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${title} category`}
      style={({ pressed }) => [
        cardStyles.categoryCard,
        { width: cardSize, height: cardSize, marginRight, opacity: pressed ? 0.85 : 1 },
        { borderColor: colors.softGoldBorder, backgroundColor: colors.white },
        { shadowColor: colors.gold, shadowOpacity: 0.18 },
      ]}
    >
      <ImageBackground
        source={images[currentIndex]}
        style={cardStyles.categoryImage}
        imageStyle={{ borderRadius: borderRadius.md }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        <View style={cardStyles.categoryOverlay} />
        <Text style={cardStyles.categoryTitle}>{title}</Text>
      </ImageBackground>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  // Modal state for feature tiles
  const [featureModal, setFeatureModal] = useState({ open: false });
  
  // Use the existing width variable for responsive styling
  const getResponsiveStyles = (currentWidth) => ({
    // Mobile-specific styles
    mobileTextBackground: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '70%',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    heroContainer: {
      ...baseStyles.heroContainer,
      height: currentWidth < 400 ? 400 : 480,
    },
    overlay: {
      ...baseStyles.overlay,
      backgroundColor: currentWidth < 600 ? 'rgba(26,26,26,0.55)' : 'rgba(26,26,26,0.45)',
    },
    ...baseStyles,
    heroTagline: {
      ...baseStyles.heroTagline,
      fontSize: currentWidth < 400 ? 16 : 22,
      letterSpacing: currentWidth < 400 ? 0.5 : 1,
    },
    heroText: {
      ...baseStyles.heroText,
      fontSize: currentWidth < 400 ? 28 : currentWidth < 600 ? 34 : 42,
      letterSpacing: currentWidth < 400 ? 0.8 : 1.2,
      lineHeight: currentWidth < 400 ? 34 : currentWidth < 600 ? 40 : 50,
    },
    heroSubtext: {
      ...baseStyles.heroSubtext,
      fontSize: currentWidth < 400 ? 14 : 18,
    },
    cta: {
      ...baseStyles.cta,
      paddingVertical: currentWidth < 400 ? spacing.sm : spacing.md,
      paddingHorizontal: currentWidth < 400 ? spacing.md : spacing.lg,
    },
    ctaText: {
      ...baseStyles.ctaText,
      fontSize: currentWidth < 400 ? 16 : 20,
    },
    offerBadge: {
      ...baseStyles.offerBadge,
      top: currentWidth < 400 ? spacing.sm : spacing.lg,
      right: currentWidth < 400 ? spacing.sm : spacing.lg,
      padding: currentWidth < 400 ? spacing.sm : spacing.md,
      width: currentWidth < 400 ? 80 : 100,
      height: currentWidth < 400 ? 80 : 100,
    },
    offerText: {
      ...baseStyles.offerText,
      fontSize: currentWidth < 400 ? 12 : 14,
    },
    offerHighlight: {
      ...baseStyles.offerHighlight,
      fontSize: currentWidth < 400 ? 20 : 24,
    },
  });

  // Handler to show modal when add to cart succeeds from a product card
  const handleShowCartModal = (product) => {
    setLastAddedProduct(product);
    setCartModalVisible(true);
  };

  // Handler for "Go to Cart" button in modal
  const handleGoToCart = () => {
    setCartModalVisible(false);
    setTimeout(() => {
      router.push('/(tabs)/cart');
    }, 200);
  };

  // Handler for "Continue Shopping" button in modal
  const handleContinueShopping = () => {
    setCartModalVisible(false);
  };

  const bestSellersRef = React.useRef(null);

  const [discountBubbleScale] = useState(new Animated.Value(0.7));
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [pendingPopupMessage, setPendingPopupMessage] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [showDiscountBubble, setShowDiscountBubble] = useState(false);

  useEffect(() => {
    // Always show the promo bubble on every load
    const seen = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('springPromoSeen');
    if (!seen) {
      setShowPromo(true);
      setShowDiscountBubble(true);
    } else {
      setShowDiscountBubble(true);
    }

    // Scroll to #bestsellers if hash is present
    if (typeof window !== 'undefined') {
      const scrollToBestSellers = () => {
        if (window.location.hash === '#bestsellers' && bestSellersRef.current) {
          if (bestSellersRef.current.measure) {
            // Native: React Native Web
            bestSellersRef.current.measure((x, y, width, height, pageX, pageY) => {
              window.scrollTo({ top: pageY - 40, behavior: 'smooth' });
            });
          } else if (bestSellersRef.current.scrollIntoView) {
            // DOM: Web
            bestSellersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };
      scrollToBestSellers();
      window.addEventListener('hashchange', scrollToBestSellers);
      return () => window.removeEventListener('hashchange', scrollToBestSellers);
    }
  }, []);

  // Bounce animation for discount bubble
  useEffect(() => {
    if (showDiscountBubble) {
      Animated.sequence([
        Animated.timing(discountBubbleScale, {
          toValue: 1.08,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(discountBubbleScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDiscountBubble]);

  const handleClosePromo = () => {
    setShowPromo(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('springPromoSeen', '1');
      // Show the bubble after closing the promo modal, unless the user already dismissed it
      if (!window.localStorage.getItem('springPromoBubbleDismissed')) {
        setShowDiscountBubble(true);
      }
    }
  };

  const handleCloseBubble = () => {
    setShowDiscountBubble(false);
    // No longer persist dismissal; bubble will always return on reload
  };



  // Responsive columns for category grid
  const sectionMaxWidth = 1200;
  const flatListPadding = 16 * 2; // 16px left + right, matches BestSellersSection
  const gap = 24; // spacing.lg, matches styles.columnWrapper
  const columns = width > 900 ? 4 : width > 600 ? 3 : 2;
  const totalGap = gap * (columns - 1);
  const cardSize = ((width > sectionMaxWidth ? sectionMaxWidth : width) - flatListPadding - totalGap) / columns;

  // Get responsive styles using the current width
  const styles = getResponsiveStyles(width);

  return (
    <View style={styles.container}>
      {/* AnnaWelcomePopup appears after delay, opens chat with message if sent */}
      <AnnaWelcomePopup
        onOpenChat={(msg) => {
          setPendingPopupMessage(msg);
          setIsChatVisible(true);
        }}
      />

      <SpringPromoModal visible={showPromo} onClose={handleClosePromo} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'stretch',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
          backgroundColor: 'transparent'
        }}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.content}>
            <ImageBackground
                source={{ uri: width < 600 ? 
                  'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//homepage-hero-banner-mobile.webp' : 
                  'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils/homepage-herobanner3.webp' 
                }}
                style={[styles.heroContainer, { width: width }]}
                imageStyle={{ opacity: 1.0 }}
            >
              {/* Enhanced overlay for better text visibility */}
              <View style={styles.overlay} />
              {width < 600 && (
                <View 
                  style={[styles.mobileTextBackground, { 
                    height: width < 400 ? '80%' : '70%',
                    opacity: width < 400 ? 0.9 : 0.8
                  }]} 
                />
              )}
              <View style={styles.heroContent}>
                <Animated.View
                  entering={FadeInDown.duration(800).springify()}
                  style={styles.heroTextContainer}
                >
                  <Text style={styles.heroTagline}>Express Your Love</Text>
                  <Text style={styles.heroText}>Perfect Gifts For The Special Women In Your Life</Text>
                  <Text style={styles.heroSubtext}>Personalized, affordable luxury for birthdays, Mother's Day, weddings & more</Text>
                </Animated.View>
                
                <Animated.View
                  entering={FadeInUp.duration(800).delay(400).springify()}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.cta,
                      { transform: [{ scale: pressed ? 0.98 : 1 }] }
                    ]}
                    onPress={() => router.push('/shop')}
                    accessibilityRole="button"
                    accessibilityLabel="Find Perfect Gift"
                  >
                    <Text style={styles.ctaText}>Find Perfect Gift</Text>
                    <FontAwesome name="heart" size={16} color={colors.white} style={styles.ctaIcon} />
                  </Pressable>
                </Animated.View>
              </View>
              
              {/* Limited time offer badge */}
              <View style={styles.offerBadge}>
                <Text style={styles.offerText}>Limited Time</Text>
                <Text style={styles.offerHighlight}>20% OFF</Text>
              </View>
            </ImageBackground>

            {/* Feature Tiles Section */}
            <FeatureTiles
  style={{ marginTop: 0, marginBottom: 10, width: '100%' }}
  onTilePress={(idx, feature) => setFeatureModal({ open: true, idx, feature })}
/>

            {/* Best Sellers Section */}
            <View style={[styles.categoriesContainer, { width: '100%' }]}>
              {CATEGORIES.map((cat, index) => {
                const marginRight = (index + 1) % columns === 0 ? 0 : gap;
                const images = CATEGORY_IMAGES[cat.id] || [];
                return (
                  <CategoryCard
                    key={cat.id}
                    id={cat.id}
                    title={cat.title}
                    cardSize={cardSize}
                    marginRight={marginRight}
                    images={images}
                    cardStyles={styles}
                    onPress={() => {
                      trackEvent({
                        eventType: 'category_click',
                        metadata: { categoryId: cat.id, categoryTitle: cat.title, source: 'home' }
                      });
                      router.push(`/shop?category=${encodeURIComponent(cat.id)}`);
                    }}
                  />
                );
              })}
            </View>

            {/* Packaging Showcase Section */}
            <PackagingShowcase />

             {/* Best Sellers Section */}
             <View ref={bestSellersRef} collapsable={false}>
               <BestSellersSection
                 cardWidth={cardSize}
                 numColumns={columns}
                 bestSellerIds={['4-rings', '2-bracelets', '7c430a41-726e-4753-8214-36ffc77303cb', 'ec75311c-c851-45b8-b1a5-22a364e12449']}
                 onAddToCartSuccess={handleShowCartModal}
               />
             </View>

            {/* Most Popular Section */}
            <MostPopularSection
              cardWidth={cardSize}
              numColumns={columns}
              mostPopularIds={['1-necklace', '3-earrings', '5-brooch', '8d2e6c5b-1234-4cde-9876-abcdef123456', '1-earrings', '3-bracelets', '4-bracelets']}
              onAddToCartSuccess={handleShowCartModal}
            />

            {/* Reviews Carousel */}
            <ReviewsCarousel />

             <View style={styles.newsletterSectionRedesign}>
              <FontAwesome name="envelope-o" size={32} color={colors.gold} style={{ marginBottom: 8 }} />
              <Text style={styles.newsletterTitleRedesign}>Join our newsletter</Text>
              <Text style={styles.newsletterSubtitle}>Exclusive offers, new arrivals & more. Only the good stuff!</Text>
              <View style={styles.newsletterFormRedesign}>
                <TextInput
                  style={styles.newsletterInputRedesign}
                  placeholder="Your email address"
                  placeholderTextColor={colors.platinumGrey}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  accessibilityLabel="Email address"
                  returnKeyType="done"
                />
                <Pressable
                  style={({ pressed }) => [styles.newsletterButtonRedesign, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={async () => {
                    await trackEvent({ eventType: 'newsletter_send_click', metadata: { email } });
                    await trackEvent({ eventType: 'newsletter_subscribe_click', metadata: { email } });
                    if (email.includes('@')) {
                      Alert.alert('Subscribed', `Thanks for subscribing, ${email}!`);
                      setEmail('');
                    } else {
                      Alert.alert('Invalid email', 'Please enter a valid email address.');
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Subscribe to newsletter"
                >
                  <Text style={styles.newsletterButtonTextRedesign}>Subscribe</Text>
                </Pressable>
              </View>
              <View style={styles.socialRowRedesign}>
                <Pressable onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61573565127513')} accessibilityRole="link" accessibilityLabel="Facebook">
                  <FontAwesome name="facebook" size={28} color="#4267B2" />
                </Pressable>
                <Pressable onPress={() => Linking.openURL('https://instagram.com/rarecollectablesshop')} style={styles.socialIconRedesign} accessibilityRole="link" accessibilityLabel="Instagram">
                  <FontAwesome name="instagram" size={28} color="#C13584" />
                </Pressable>
              </View>
            </View>
          </View>
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
        <View style={styles.paymentFooter}>
          <Text style={styles.paymentFooterLabel}>We accept</Text>
          <PaymentMethodsRow iconSize={38} pop style={{ marginBottom: 4 }} />
        </View>
      </ScrollView>

      {/* Persistent Promo Bubble: Shows after modal closes, brings modal back when clicked */}
      {showDiscountBubble && (
         <View style={styles.discountBubbleContainer}>
           <Animated.View
             style={[
               styles.discountBubble,
               { transform: [{ scale: discountBubbleScale }] }
             ]}
           >
             <Pressable
               style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
               onPress={() => setShowPromo(true)}
               accessibilityRole="button"
               accessibilityLabel="Show discount details"
             >
               <Text style={{ fontSize: 24, marginRight: 8 }} role="img" aria-label="Gift">🎁</Text>
               <Text style={styles.discountBubbleText}>
                 <Text style={{ fontWeight: 'bold', color: colors.gold }}>Welcome!</Text> 20% off for you
               </Text>
             </Pressable>
             <Pressable
               style={styles.discountBubbleClose}
               onPress={handleCloseBubble}
               accessibilityRole="button"
               accessibilityLabel="Dismiss discount bubble"
             >
               <FontAwesome name="close" size={16} color={colors.onyxBlack} />
             </Pressable>
           </Animated.View>
         </View>
      )}
      {!isChatVisible && (
        <Pressable
          style={styles.chatButton}
          onPress={() => setIsChatVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Toggle chat"
        >
          <FontAwesome name="comment" size={24} color={colors.onyxBlack} />
        </Pressable>
      )}
      {isChatVisible && (
        <ChatScreen
          isChatVisible={isChatVisible}
          setIsChatVisible={setIsChatVisible}
          initialMessage={pendingPopupMessage}
        />
      )}
      {/* Add to Cart Modal integration */}
      <CartAddedModal
        visible={cartModalVisible}
        onGoToCart={handleGoToCart}
        onContinue={handleContinueShopping}
      />
      {/* Feature Tile Modal (LuxuryModal) */}
      <LuxuryModal
        visible={featureModal.open}
        onClose={() => setFeatureModal({ open: false })}
        showClose={true}
        animation="fade"
      >
        {featureModal?.feature && (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24, maxWidth: 390, width: '100%' }}>
            <View style={{ backgroundColor: '#f8f5ea', borderRadius: 48, padding: 18, marginBottom: 18 }}>
              <FontAwesome name={featureModal.feature.icon} size={44} color={'#bfa14a'} />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 7, color: '#bfa14a', textAlign: 'center', fontFamily: 'serif' }}>{featureModal.feature.title}</Text>
            {/* Modal Content: Match logic from product details page */}
            {(() => {
              switch (featureModal.feature.title) {
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
                        if (typeof window !== 'undefined') {
                          window.location.hash = '#bestsellers';
                        }
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
                    <Pressable onPress={() => { setFeatureModal({ open: false }); }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
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
                    <Pressable onPress={() => { setFeatureModal({ open: false }); }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
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
                    <Pressable onPress={() => { setFeatureModal({ open: false }); }} style={{ backgroundColor: '#bfa14a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 6 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>See Our Guarantee</Text>
                    </Pressable>
                  </>;
                default:
                  return <Text style={{ fontSize: 16, color: '#444', textAlign: 'center' }}>{featureModal.feature.description}</Text>;
              }
            })()}
            <Text style={{ fontSize: 13, color: '#bfa14a', marginTop: 20, textAlign: 'center', fontWeight: '600' }}>
              <FontAwesome name="lock" size={13} color="#bfa14a" /> Secure checkout & 100% satisfaction guarantee
            </Text>
            <Text style={{ fontSize: 12, color: '#aaa', marginTop: 7, textAlign: 'center' }}>Tap the close button or outside the modal to close</Text>
          </View>
        )}
      </LuxuryModal>
    </View>
  );
}

// Create styles outside component, but make responsive styles inside component
const baseStyles = StyleSheet.create({
  discountBubbleContainer: {
    position: 'absolute',
    bottom: spacing.xl + 10,
    left: spacing.xl + 10,
    zIndex: 1100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(90deg, #FFE8B2 0%, #FFD580 100%)', // fallback for web, can use gradient lib for native
    borderRadius: 999,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.gold,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: colors.softGoldBorder,
    zIndex: 1100,
    minWidth: 200,
    maxWidth: 320,
    marginBottom: 8,
    gap: 10,
    // Bounce animation will be added inline in the component
  },
  discountBubbleText: {
    color: colors.onyxBlack,
    fontFamily: fontFamily.sans,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
    marginRight: 0,
    flexShrink: 1,
  },
  discountBubbleClose: {
    marginLeft: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.10)',
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    shadowColor: colors.onyxBlack,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  paymentFooter: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.softGoldBorder,
  },
  paymentFooterLabel: {
    fontSize: 13,
    color: colors.platinum,
    marginBottom: 6,
    fontFamily: fontFamily.sans || fontFamily,
  },
  newsletterSectionRedesign: {
    backgroundColor: colors.ivory,
    borderColor: colors.softGoldBorder,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.xl,
    shadowColor: colors.gold,
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    maxWidth: 480,
    alignSelf: 'center',
    width: '95%',
  },
  newsletterTitleRedesign: {
    fontSize: 22,
    fontFamily: fontFamily.serif,
    color: colors.onyxBlack,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  newsletterSubtitle: {
    fontSize: 15,
    color: colors.platinumGrey,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
  },
  newsletterFormRedesign: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  newsletterInputRedesign: {
    flex: 1,
    height: 48,
    backgroundColor: colors.white,
    borderColor: colors.gold,
    borderWidth: 1.2,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fontFamily.sans,
    marginRight: 8,
  },
  newsletterButtonRedesign: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  newsletterButtonTextRedesign: {
    color: colors.white,
    fontFamily: fontFamily.sans,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  socialRowRedesign: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 18,
  },
  socialIconRedesign: {
    marginLeft: 18,
  },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  chatButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.gold,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    ...shadows.card,
    elevation: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chatIcon: {
    fontSize: 24,
    color: colors.white,
    fontFamily,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    padding: 0,
  },
  heroContainer: {
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.onyxBlack,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,26,26,0.45)',
  },
  heroContent: {
    width: '100%',
    maxWidth: 1000,
    padding: spacing.xl,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  heroTextContainer: {
    maxWidth: 600,
    marginBottom: spacing.xl,
  },
  heroTagline: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fontFamily.sans,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.gold,
    marginBottom: spacing.md,
    fontFamily: fontFamily.serif,
    textShadowColor: 'rgba(26,26,26,0.22)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1.2,
    lineHeight: 50,
  },
  heroSubtext: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.white,
    fontFamily: fontFamily.sans,
    opacity: 0.9,
  },
  cta: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    elevation: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  ctaText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    marginRight: spacing.sm,
  },
  ctaIcon: {
    marginLeft: spacing.xs,
  },
  offerBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '5deg' }],
    ...shadows.card,
  },
  offerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: fontFamily.sans,
  },
  offerHighlight: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: fontFamily.serif,
    marginTop: spacing.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    backgroundColor: colors.white,
    ...shadows.card,
    elevation: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    opacity: 1,
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    fontFamily: fontFamily.serif,
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  newsletterContainer: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm + 4,
  },
  newsletterForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: colors.ivory,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.onyxBlack,
  },
  newsletterButton: {
    backgroundColor: colors.emerald,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  newsletterButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  socialIcon: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.card,
  },
});
