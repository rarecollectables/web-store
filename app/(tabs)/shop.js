import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';
import { useStore } from '../../context/store';
import ProductsList from '../(components)/products/ProductsList';
import SpringPromoModal from '../components/SpringPromoModal';
import CartAddedModal from '../components/CartAddedModal';
import { trackEvent } from '../../lib/trackEvent';
import { useRouter, useGlobalSearchParams } from 'expo-router';

export default function ShopScreen() {
  const router = useRouter();
  const { search: searchParam } = useGlobalSearchParams();
  const { addToCart } = useStore();
  const [showPromo, setShowPromo] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    trackEvent({ eventType: 'shop_page_view' });
    // Show promo only if not already shown
    if (typeof window !== 'undefined' && window.localStorage) {
      const hasSeenPromo = localStorage.getItem('hasSeenSpringPromo');
      if (!hasSeenPromo) {
        setShowPromo(true);
        localStorage.setItem('hasSeenSpringPromo', 'true');
      }
    }
    
    // Initialize search query from URL params if present
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Handler to show modal after add to cart
  const handleShowCartModal = (product) => {
    console.log('ShopScreen: handleShowCartModal called', product);
    setLastAddedProduct(product);
    setCartModalVisible(true);
  };

  // Handler for "Go to Cart"
  const handleGoToCart = () => {
    setCartModalVisible(false);
    setTimeout(() => {
      router.push('/(tabs)/cart');
    }, 200);
  };

  // Handler for "Continue Shopping"
  const handleContinueShopping = () => {
    setCartModalVisible(false);
  };

  // Handle search submission
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Log search event with consistent format and source information
      trackEvent({ 
        eventType: 'search', 
        searchQuery: searchQuery.trim(),
        searchSource: 'shop_page',
        deviceType: Platform.OS === 'web' && window.innerWidth >= 768 ? 'desktop' : 'mobile'
      });
      
      router.push({
        pathname: '/(tabs)/shop',
        params: { search: searchQuery.trim() }
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {/* Shop Page Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          accessibilityLabel="Search products"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable 
          style={styles.searchButton} 
          onPress={handleSearch}
          accessibilityRole="button"
          accessibilityLabel="Submit search"
        >
          <FontAwesome name="search" size={18} color={colors.white} />
        </Pressable>
      </View>
      
      <ProductsList onAddToCartSuccess={handleShowCartModal} />
      <SpringPromoModal visible={showPromo} onClose={() => setShowPromo(false)} />
      <CartAddedModal
        visible={cartModalVisible}
        onGoToCart={handleGoToCart}
        onContinue={handleContinueShopping}
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
  screen: {
    backgroundColor: colors.ivory,
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textDark,
    fontFamily: fontFamily.sans,
  },
  searchButton: {
    backgroundColor: colors.gold,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
  screen: {
    backgroundColor: colors.background,
    padding: spacing.l,
  },
});
