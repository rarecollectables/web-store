import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';
import PaymentMethodsRow from '../(components)/PaymentMethodsRow';
import { Image as ExpoImage } from 'expo-image';
import { useStore } from '../../context/store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PRODUCTS } from '../(data)/products';
import { trackEvent } from '../../lib/trackEvent';

function parsePrice(val) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  }
  return 0;
}

import CheckoutModal from '../components/CheckoutModal';
import ConfirmationModal from '../components/ConfirmationModal';

import { supabase } from '../../lib/supabase/client';

export default function CartScreen() {
  const params = useLocalSearchParams();
  const { cart, updateCartItem, removeFromCart, lastVisitedRoute, addToCart } = useStore();
  const router = useRouter();

  React.useEffect(() => {
    if (!cart || cart.length === 0) {
      const sessionId = params.session;
      if (sessionId) {
        (async () => {
          const { data: attempts, error } = await supabase
            .from('checkout_attempts')
            .select('*')
            .eq('guest_session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(5);

          if (error || !attempts || attempts.length === 0) {
            return;
          }

          let cartAttempt = null;
          let cartIds = [];
          for (const att of attempts) {
            try {
              cartIds = Array.isArray(att.cart)
                ? att.cart.map(item => item.id)
                : (att.cart ? Object.keys(att.cart) : []);
            } catch (e) {
              cartIds = [];
            }
            if (cartIds.length) {
              cartAttempt = att;
              break;
            }
          }
          if (!cartAttempt) {
            return;
          }

          const { data: products } = await supabase
            .from('products')
            .select('id, name, price, image_url')
            .in('id', cartIds);

          let cartItems = [];
          if (Array.isArray(cartAttempt.cart)) {
            cartItems = cartAttempt.cart.map(item => {
              const prod = products.find(p => p.id === item.id);
              return prod ? { ...prod, quantity: item.quantity || 1 } : null;
            }).filter(Boolean);
          } else if (cartAttempt.cart && typeof cartAttempt.cart === 'object') {
            cartItems = Object.entries(cartAttempt.cart).map(([id, qty]) => {
              const prod = products.find(p => p.id === id);
              return prod ? { ...prod, quantity: qty || 1 } : null;
            }).filter(Boolean);
          }

          // Use addToCart for each item to trigger all add-to-cart logic
          cartItems.forEach(item => {
            addToCart(item);
          });
        })();
      }
    }
  }, [params.session, addToCart, cart]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '' });
  const [address, setAddress] = useState({ line1: '', city: '', postcode: '' });

  // When checkout is successful, show confirmation modal
  const handleCheckoutSuccess = () => {
    setCheckoutOpen(false);
    setConfirmationOpen(true);
  };
  const handleContinueShopping = () => {
    setConfirmationOpen(false);
    router.replace('/(tabs)/shop');
  };

  const handleProceedToCheckout = () => {
    // Navigate to checkout page
    router.push('/checkout');
  };

  const subtotal = cart.reduce((sum, item) => {
    let price = parsePrice(item.price);
    if (!price) {
      const product = PRODUCTS.find(p => p.id === item.id);
      price = product ? parsePrice(product.price) : 0;
    }
    return sum + price * item.quantity;
  }, 0);
  // Shipping is selected at checkout, not shown here
  const total = subtotal;

  React.useEffect(() => {
    // Track cart view event (GA4-compliant)
    if (cart && cart.length > 0) {
      trackEvent({
        eventType: 'view_cart',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: parsePrice(item.price),
          quantity: item.quantity,
          image_url: item.image_url
        })),
        value: cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0),
        currency: 'GBP'
      });
    }
  }, [cart]);

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      <Pressable
        onPress={() => {
  if (router.canGoBack && router.canGoBack()) {
    router.back();
  } else if (lastVisitedRoute && typeof lastVisitedRoute === 'string' && lastVisitedRoute !== '/(tabs)/cart') {
    router.replace(lastVisitedRoute);
  } else {
    router.replace('/(tabs)/shop');
  }
}}
        style={({ pressed }) => [
          { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: pressed ? colors.platinum : 'transparent' }
        ]}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 20, color: colors.gold, marginRight: 6 }}>←</Text>
        <Text style={{ color: colors.gold, fontSize: 16, fontWeight: '600' }}>Back</Text>
      </Pressable>

      <Text style={styles.header}>Your Cart</Text>
      <FlatList
        data={cart}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ width: '100%' }}
        scrollEnabled={false}
        renderItem={({ item }) => {
          let price = parsePrice(item.price);
          if (!price) {
            const product = PRODUCTS.find(p => p.id === item.id);
            price = product ? parsePrice(product.price) : 0;
          }
          return (
            <Pressable
              style={styles.itemRow}
              onPress={() => router.push(`/product/${item.id}`)}
              accessibilityRole="link"
              accessibilityLabel={`View details for ${item.title}`}
            >
              <ExpoImage source={item.image_url || item.image || require('../../assets/images/rare-collectables-logo.png')} style={styles.image} contentFit="cover" />
              <View style={styles.itemDetails}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.salesPrice}>{`₤${price > 0 ? (price * item.quantity).toFixed(2) : 'N/A'}`}</Text>
                </View>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => {
                      updateCartItem(item.id, Math.max(1, item.quantity - 1));
                      trackEvent({ eventType: 'cart_quantity_decrease', productId: item.id, quantity: item.quantity - 1 });
                    }}
                    accessibilityLabel="Decrease quantity"
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => {
                      updateCartItem(item.id, item.quantity + 1);
                      trackEvent({ eventType: 'cart_quantity_increase', productId: item.id, quantity: item.quantity + 1 });
                    }}
                    accessibilityLabel="Increase quantity"
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => {
                    removeFromCart(item.id);
                    trackEvent({ eventType: 'remove_from_cart', productId: item.id });
                  }}
                  accessibilityLabel="Remove from cart"
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Your cart is empty.</Text>}
        contentContainerStyle={cart.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>{`₤${subtotal.toFixed(2)}`}</Text></View>
        {/* <View style={styles.summaryRow}><Text style={styles.label}>Shipping (UK)</Text><Text style={styles.value}>{`₤${shipping.toFixed(2)}`}</Text></View> */}
        <View style={styles.summaryRow}><Text style={styles.labelTotal}>Total</Text><Text style={styles.valueTotal}>{`₤${total.toFixed(2)}`}</Text></View>
        <Pressable
          style={styles.checkoutBtn}
          onPress={handleProceedToCheckout}
          disabled={cart.length === 0}
          accessibilityLabel="Proceed to checkout"
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    {/* Checkout Modal */}
    <CheckoutModal
      open={checkoutOpen}
      onClose={() => setCheckoutOpen(false)}
      cart={cart}
      contact={contact}
      address={address}
      setCart={() => {}}
      onSuccess={handleCheckoutSuccess}
    />
    {/* Confirmation Modal */}
    <ConfirmationModal
      open={confirmationOpen}
      onClose={handleContinueShopping}
      autoCloseMs={4000}
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
    <View style={styles.paymentFooter}>
      <Text style={styles.paymentFooterLabel}>We accept</Text>
      <PaymentMethodsRow iconSize={38} pop style={{ marginBottom: 4 }} />
    </View>
  </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FAF7F0', padding: 8, paddingBottom: 24 },
  header: { fontSize: 24, fontWeight: '900', color: '#BFA054', marginBottom: 12 },
    footer: {
      flexDirection: 'row', 
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.md,
      backgroundColor: colors.ivory,
      borderTopWidth: 1,
      borderColor: colors.softGoldBorder,
      marginTop: spacing.xl,
      width: '100%',
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
    itemRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#E5DCC3', width: '100%' },
    image: { width: 80, height: 100, borderRadius: 12, marginRight: 12, backgroundColor: '#FAF7F0' },
    itemDetails: { flex: 1, justifyContent: 'center', marginLeft: 10 },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    salesPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gold,
    },
    saleLabel: {
      fontSize: 12,
      color: 'white',
      backgroundColor: '#e53935',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontWeight: '500',
    },
    price: { fontSize: 15, color: '#BFA054', marginBottom: 2 },
    quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6 },
    qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#BFA054', alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
    qtyBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
    qtyText: { fontSize: 16, color: '#1A1A1A', fontWeight: '700', minWidth: 24, textAlign: 'center' },
    removeBtn: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FAF7F0', borderWidth: 1, borderColor: '#BFA054' },
    removeBtnText: { color: '#BFA054', fontWeight: '700', fontSize: 14 },
    emptyText: { textAlign: 'center', color: '#7C7C7C', fontSize: 18, marginTop: 60 },
    summary: { marginTop: 24, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 3, width: '100%' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#1A1A1A', fontSize: 16 },
    value: { color: '#1A1A1A', fontSize: 16 },
    labelTotal: { color: '#BFA054', fontWeight: '900', fontSize: 18 },
    valueTotal: { color: '#BFA054', fontWeight: '900', fontSize: 18 },
    checkoutBtn: { marginTop: 20, backgroundColor: '#BFA054', borderRadius: 24, paddingVertical: 16, alignItems: 'center', shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, opacity: 1, width: '100%' },
    checkoutBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
});
