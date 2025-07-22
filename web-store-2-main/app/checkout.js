import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView, Platform, Dimensions } from 'react-native';
import PaymentMethodsRow from './(components)/PaymentMethodsRow';
import { useStore } from '../context/store';
// import { PRODUCTS } from './(data)/products';
import { fetchProductsShipping } from '../lib/supabase/products';
import { getGuestSession } from '../lib/supabase/client';
import { checkoutAttemptService } from '../lib/supabase/services';
import { z } from 'zod';
import { storeOrder } from './components/orders-modal';
import { trackEvent } from '../lib/trackEvent';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../theme';
import ConfirmationModal from './components/ConfirmationModal';
import { useRouter } from 'expo-router';
import { CardElement, useElements, useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Constants from 'expo-constants';

// Stripe keys from env - try multiple sources
// Use dynamic key resolution based on environment
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  (Constants?.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY) || 
  (Constants?.manifest?.extra?.STRIPE_PUBLISHABLE_KEY) || 
  // Fallback to test key for local development only
  (process.env.NODE_ENV === 'development' ? 'pk_test_51NXgqJFuJhKOEDQxYKlOmh9qoNIY9RvnMNnWbiIuRNQ1VqA0wPLxsL8jFWwRmKvNj1YwGpL8s1OlZnwbUZAtj2Vv00zysCLzSJ' : null);

// If no key is found, log an error
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('No Stripe publishable key found. Payment functionality will not work.');
}

const NETLIFY_STRIPE_FUNCTION_URL = 'https://rarecollectables.co.uk/.netlify/functions/create-checkout-session';

// Log Stripe key status for debugging (without revealing the full key)
console.log('Checking Stripe key sources:');
console.log('- process.env:', process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Available' : 'Missing');
console.log('- Constants.expoConfig:', Constants?.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY ? 'Available' : 'Missing');
console.log('- Constants.manifest:', Constants?.manifest?.extra?.STRIPE_PUBLISHABLE_KEY ? 'Available' : 'Missing');
console.log(
  'Final Stripe publishable key status:', 
  STRIPE_PUBLISHABLE_KEY ? 
    `Available (starts with: ${STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...)` : 
    'MISSING - Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file'
);

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});
const ukPostcodeRegex = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i;
const addressSchema = z.object({
  line1: z.string().min(3, 'Address required'),
  city: z.string().min(2, 'City required'),
  postcode: z.string()
    .min(5, 'Postcode required')
    .max(8, 'Postcode too long')
    .regex(ukPostcodeRegex, 'Enter a valid UK postcode (e.g., SW1A 1AA)'),
});



export function StripePaymentForm({ cart, contact, address, errors, setErrors, paying, setPaying, validateForm, removeFromCart, onSuccess, coupon, discountAmount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  
  // Ensure the CardElement is properly initialized
  useEffect(() => {
    console.log('StripePaymentForm mounted, elements available:', !!elements);
  }, [elements]);

  const handleStripeCheckout = async () => {
    if (!validateForm()) return;
    if (!stripe || !elements) {
      setErrors({ ...errors, payment: ['Stripe not initialized yet. Please try again.'] });
      return;
    }
    
    // Validate required fields directly
    if (!contact.name || !contact.email || !address.line1 || !address.city || !address.postcode) {
      setErrors({ ...errors, payment: ['Please complete all required contact and shipping information.'] });
      return;
    }
    
    try {
      setPaying(true);
      // Calculate discounted total
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discountedSubtotal = Math.max(0, subtotal - (discountAmount || 0));
      const total = Math.max(0, discountedSubtotal); // No tax applied
      
      // Log the calculation for debugging
      console.log('Payment calculation:', { 
        subtotal, 
        discountAmount: discountAmount || 0, 
        discountedSubtotal, 
        total 
      });
      
      // Track checkout initiation
      trackEvent({
        eventType: 'begin_checkout',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url
        })),
        value: total,
        currency: 'GBP',
        metadata: { coupon }
      });
      
      // Create or get client secret if needed
      let currentClientSecret = clientSecret;
      if (!currentClientSecret) {
        const response = await fetch(NETLIFY_STRIPE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cart, 
            contact, 
            address, 
            coupon: coupon || null, // Send the coupon directly if it exists
            discountAmount: discountAmount || 0, // Pass the discount amount to the server
          }),
        });
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Failed to create payment intent: ${response.status} ${errText}`);
        }
        
        const data = await response.json();
        currentClientSecret = data.clientSecret;
        
        // Log payment details from server for verification
        if (data.paymentDetails) {
          console.log('Server payment details:', {
            subtotal: data.paymentDetails.subtotal / 100, // Convert cents to dollars/pounds
            discount: data.paymentDetails.discount / 100,
            total: data.paymentDetails.total / 100,
            couponApplied: data.paymentDetails.couponApplied
          });
          
          // Verify the total matches our calculation
          if (Math.abs((data.paymentDetails.total / 100) - total) > 0.01) {
            console.warn('Total mismatch between client and server:', {
              clientTotal: total,
              serverTotal: data.paymentDetails.total / 100
            });
          }
        }
      }
      
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Use confirmCardPayment for the CardElement
      const result = await stripe.confirmCardPayment(currentClientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: contact.name,
            email: contact.email,
            address: { 
              line1: address.line1, 
              city: address.city, 
              postal_code: address.postcode,
              country: 'GB'
            },
          },
        },
        shipping: {
          name: contact.name,
          address: {
            line1: address.line1,
            city: address.city,
            postal_code: address.postcode,
            country: 'GB'
          }
        }
      });
      
      if (result.error) {
        console.error('Stripe payment error:', result.error);
        throw new Error(`Payment failed: ${result.error.message}`);
      }
      
      // Check for successful payment or payment that requires additional action
      if (result.paymentIntent) {
        console.log('Payment intent status:', result.paymentIntent.status);
        
        // Consider both 'succeeded' and 'processing' as successful states
        // 'processing' means the payment is being processed but not yet confirmed
        if (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing') {
          try {
            // Payment successful
            // Generate a customer-friendly order number (current date + random numbers)
            const orderDate = new Date();
            const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
            
            // Create the order object
            const orderData = {
              id: orderNumber,
              date: orderDate.toISOString(),
              items: cart,
              contact,
              address,
              total,
              discount: discountAmount || 0,
              coupon: coupon || null,
              paymentIntentId: result.paymentIntent.id,
              status: 'confirmed'
            };
            
            // Store the order in both localStorage and database
            await storeOrder(orderData, contact.email);
            
            // Send confirmation email directly after successful payment
            try {
              const emailResponse = await fetch('/.netlify/functions/sendConfirmationEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: contact.email,
                  order: {
                    order_number: orderNumber,
                    amount: total * 100, // Convert to cents for consistency with backend
                    quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
                    created_at: orderDate.toISOString(),
                    shipping_address: address,
                    product_image: cart[0]?.image_url || null
                  }
                })
              });
              
              if (!emailResponse.ok) {
                console.error('Failed to send confirmation email:', await emailResponse.text());
              } else {
                console.log('Confirmation email sent successfully');
              }
            } catch (emailError) {
              console.error('Error sending confirmation email:', emailError);
              // Continue with checkout process even if email fails
            }
            
            // Track successful purchase
            trackEvent({
              eventType: 'purchase',
              items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image_url: item.image_url
              })),
              value: total,
              currency: 'GBP',
              transaction_id: result.paymentIntent.id,
              metadata: { coupon, orderNumber }
            });
            
            // Clear cart and show confirmation
            cart.forEach(item => removeFromCart(item.id));
            if (onSuccess) onSuccess(contact.email);
          } catch (orderError) {
            console.error('Error storing order:', orderError);
            // Continue with success flow even if order storage fails
            // The payment was successful, we just couldn't store it properly
            if (onSuccess) onSuccess(contact.email);
          }
        } else {
          // This handles cases where the payment intent exists but is in a state other than succeeded/processing
          console.warn(`Payment in unexpected state: ${result.paymentIntent.status}`);
          throw new Error(`Payment not successful: ${result.paymentIntent.status}`);
        }
      } else {
        // This handles cases where there's no payment intent in the result
        console.error('No payment intent returned from Stripe');
        throw new Error('Payment failed: No payment intent returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStripeError(error.message);
      // Track payment failure
      trackEvent({ 
        eventType: 'checkout_payment_failed', 
        error: error.message, 
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0), 
        items: cart.length, 
        coupon 
      });
      setErrors({ ...errors, payment: [error.message || 'An error occurred during checkout. Please try again.'] });
    } finally {
      setPaying(false);
    }
  };


  // Log component rendering for debugging
  console.log('Rendering StripePaymentForm', { hasStripe: !!stripe, hasElements: !!elements });
  
  return (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Payment Information</Text>
      {errors.payment && errors.payment.map((msg, idx) => (
        <Text key={idx} style={styles.errorText}>{msg}</Text>
      ))}
      <View style={styles.cardElementLuxuryContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.secureIcon}>🔒</Text>
          <Text style={styles.secureLabel}>Secure Card Payment</Text>
        </View>
        <Text style={styles.inputLabel}>Card Details</Text>
        <View style={[styles.stripeCardLuxuryWrapper, { minHeight: 50 }]}>
          {elements ? (
            <CardElement 
              onChange={(e) => {
                console.log('Card element change:', e.complete ? 'complete' : 'incomplete');
                setCardComplete(e.complete);
              }}
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#30313d',
                    fontFamily: 'Helvetica, sans-serif',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#df1b41',
                  },
                },
                hidePostalCode: true,
              }} 
            />
          ) : (
            <Text style={{ color: colors.grey, textAlign: 'center', paddingTop: 10 }}>Loading payment form...</Text>
          )}
        </View>
        <Text style={styles.cardHelperText}>All transactions are encrypted and processed securely.</Text>
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            paying && styles.checkoutButtonDisabled,
            pressed && !paying && { opacity: 0.93 },
          ]}
          onPress={handleStripeCheckout}
          disabled={paying}
          accessibilityRole="button"
          accessibilityLabel="Pay with Card"
        >
          {paying ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 2 }} />
          ) : (
            <Text style={styles.checkoutButtonText}>Pay with Card</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  // Coupon state (must be defined before use)
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { valid: bool, discount: {type, value}, error }
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const { cart, removeFromCart } = useStore();
  const [contact, setContact] = useState({ name: '', email: '' });
  const [address, setAddress] = useState({ line1: '', city: '', postcode: '' });
  // Debounce timer for logging checkout attempts
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [errors, setErrors] = useState({});
  const [stripeLoading, setStripeLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [stripeError, setStripeError] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  
  // Check if we're on desktop (width > 768px)
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Update isDesktop state when window size changes
  useEffect(() => {
    const updateLayout = () => {
      setIsDesktop(Dimensions.get('window').width > 768);
    };
    
    // Set initial value
    updateLayout();
    
    // Add event listener for window resize
    if (typeof window !== 'undefined') {
      Dimensions.addEventListener('change', updateLayout);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // Clean up
        Dimensions.removeEventListener?.('change', updateLayout);
      }
    };
  }, []);

  // Called after successful payment
  const handleCheckoutSuccess = (email) => {
    setConfirmationOpen(true);
    setTimeout(() => {
      router.push({
        pathname: '/checkout-success',
        params: { email: email }
      });
    }, 1500);
  };

  // Called when user closes modal or continues shopping
  const handleContinueShopping = () => {
    setConfirmationOpen(false);
    router.replace('/(tabs)/shop'); // Redirect to shop tab after order success
  };

  useEffect(() => {
    // Track when user views the checkout page
    trackEvent({ eventType: 'checkout_view' });
    // Track when user proceeds to checkout (from cart)
    trackEvent({ eventType: 'proceed_to_checkout', items: cart.length, metadata: { cart } });
    const initializeStripe = async () => {
      try {
        setStripeLoading(true);
        setStripeError(null);
        if (!STRIPE_PUBLISHABLE_KEY) {
          setStripeError('Stripe publishable key is missing. Please check your environment configuration.');
          return;
        }
        const stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (stripeInstance) setStripe(stripeInstance);
        else setStripeError('Failed to initialize Stripe. Please check your publishable key and network connection.');
      } catch (error) {
        setStripeError('Failed to initialize Stripe: ' + (error.message || error));
      } finally {
        setStripeLoading(false);
      }
    };
    initializeStripe();
  }, []);

  // Create payment intent when contact and address are filled - only run once when component mounts
  useEffect(() => {
    console.log('Payment intent creation conditions:', {
      hasCart: cart.length > 0,
      hasEmail: Boolean(contact.email),
      hasAddress: Boolean(address.line1),
      hasStripe: Boolean(stripe),
      hasNoClientSecret: !clientSecret
    });
    
    // Create a new payment intent only when we have Stripe loaded, cart items, and user contact info
    if (stripe && cart.length > 0 && contact.email && address.line1) {
      const createPaymentIntent = async () => {
        try {
          setStripeLoading(true);
          console.log('Creating new payment intent');
          
          // Only use actual user data, no fallbacks
          const paymentData = {
            cart,
            contact,
            address,
            coupon: couponStatus?.valid ? coupon : null,
            discountAmount: discountAmount || 0
          };
          
          const response = await fetch(NETLIFY_STRIPE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
          }
          
          const data = await response.json();
          
          if (data.clientSecret) {
            console.log('Client secret received successfully');
            setClientSecret(data.clientSecret);
            setStripeLoading(false);
            
            // For analytics - track payment form view
            trackEvent({ eventType: 'view_payment_form' });
          } else {
            throw new Error('No client secret in server response');
          }
        } catch (err) {
          console.error('Error creating payment intent:', err);
          setStripeError('Could not initialize payment: ' + (err.message || err));
          setStripeLoading(false);
        }
      };
      
      // Only create a new client secret if we don't have one yet
      if (!clientSecret) {
        createPaymentIntent();
      }
    }
  }, [stripe, cart, clientSecret]);

  // This section was commented out as we're now handling payment intent creation in the useEffect above

  const handleInputChange = (type, field, value) => {
    // Compute the next state for contact and address
    let nextContact = contact;
    let nextAddress = address;
    
    if (type === 'contact') {
      nextContact = { ...contact, [field]: value };
      setContact(nextContact);
    } else if (type === 'address') {
      nextAddress = { ...address, [field]: value };
      setAddress(nextAddress);
    }
    // Debounced log to Supabase with the latest state
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(async () => {
      try {
        const guest_session_id = await getGuestSession();
        const payload = {
          guest_session_id,
          email: type === 'contact' && field === 'email' ? value : nextContact.email,
          contact: nextContact,
          address: nextAddress,
          cart,
          status: 'started',
          metadata: {}
        };
        console.log('[CHECKOUT_ATTEMPT_PAYLOAD]', payload);
        await checkoutAttemptService.upsertAttempt(payload);
      } catch (e) {
        console.error('Checkout attempt logging failed:', e);
      }
    }, 600));
  };

  // Coupon validation handler
  const handleApplyCoupon = async () => {
    if (!coupon) return;
    setApplyingCoupon(true);
    setCouponStatus(null);
    try {
      const response = await fetch('/.netlify/functions/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setCouponStatus({ valid: true, discount: data.discount, promo: data.promo });
      } else {
        setCouponStatus({ valid: false, error: data.error || 'Invalid or expired coupon code.' });
      }
    } catch (err) {
      setCouponStatus({ valid: false, error: err.message || 'Failed to validate coupon.' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const validateForm = () => {
    const contactErrors = {};
    const addressErrors = {};
    const paymentErrors = [];
    
    try { contactSchema.parse(contact); } catch (error) {
      if (error.errors) error.errors.forEach(err => { contactErrors[err.path[0]] = err.message; });
    }
    try { addressSchema.parse(address); } catch (error) {
      if (error.errors) error.errors.forEach(err => { addressErrors[err.path[0]] = err.message; });
    }
    
    // We no longer require clientSecret to be set before proceeding
    // This allows the payment form to be shown and used immediately
    // The clientSecret will be created during payment processing if needed
    
    setErrors({ 
      contact: Object.values(contactErrors), 
      address: Object.values(addressErrors),
      payment: paymentErrors
    });
    
    return Object.keys(contactErrors).length === 0 && 
           Object.keys(addressErrors).length === 0 && 
           paymentErrors.length === 0;
  };

  // Shipping selection: 'free' or 'next_day'
  const [shippingOption, setShippingOption] = useState('free');
  // Dynamic shipping eligibility from Supabase
  const [shippingLoading, setShippingLoading] = useState(false);
  const [allNextDayEligible, setAllNextDayEligible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchShipping = async () => {
      if (cart.length === 0) {
        setAllNextDayEligible(false);
        return;
      }
      setShippingLoading(true);
      try {
        const shippingData = await fetchProductsShipping(cart.map(item => item.id));
        if (!cancelled) {
          const eligible = shippingData.length > 0 && shippingData.every(product => product.shipping_label === 'next_day');
          setAllNextDayEligible(eligible);
        }
      } catch (e) {
        if (!cancelled) setAllNextDayEligible(false);
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    };
    fetchShipping();
    return () => { cancelled = true; };
  }, [cart]);

  const SHIPPING_OPTIONS = [
    { key: 'free', label: 'Free Shipping (2-4 business days)', cost: 0 },
    ...(allNextDayEligible ? [{ key: 'next_day', label: 'Next Day Delivery (£3.99)', cost: 3.99 }] : [])
  ];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountAmount = 0;
  if (couponStatus?.valid && couponStatus.discount) {
    if (couponStatus.discount.type === 'percent') {
      discountAmount = subtotal * (couponStatus.discount.value / 100);
    } else if (couponStatus.discount.type === 'amount') {
      discountAmount = couponStatus.discount.value;
    }
  }
  // Calculate shipping cost
  const shippingCost = SHIPPING_OPTIONS.find(opt => opt.key === shippingOption)?.cost || 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  if (stripeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading secure payment form...</Text>
      </View>
    );
  }
  if (stripeError) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          style={{ alignSelf: 'flex-start', marginBottom: 8, paddingHorizontal: 0, paddingVertical: 2 }}
          onPress={() => router.push('/cart')}
          accessibilityLabel="Back to cart"
          accessibilityRole="link"
        >
          <Text style={{ color: colors.gold, fontSize: 15, textDecorationLine: 'underline', fontWeight: '400' }}>← Back to Cart</Text>
        </Pressable>
        <Text style={styles.header}>Checkout</Text>
        <Text style={styles.errorTitle}>{stripeError}</Text>
        <Text style={styles.errorText}>Please contact support or try again later.</Text>
      </ScrollView>
    );
  }

  // Desktop detection was moved to the top of the component

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.white }} 
      contentContainerStyle={[styles.container, { flexGrow: 1, minHeight: '100vh', paddingHorizontal: isDesktop ? 32 : 16 }]} 
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.pageTitle, isDesktop && { alignItems: 'center' }]}>
        <Text style={styles.header}>Checkout</Text>
        <Text style={styles.subHeader}>Please fill in your details to complete your order</Text>
      </View>
      
      {/* Trust badges and incentives */}
      <View style={styles.trustBadgesContainer}>
        <View style={styles.trustBadge}>
          <Text style={styles.trustBadgeIcon}>🎁</Text>
          <Text style={styles.trustBadgeText}>Free Premium Packaging</Text>
        </View>
        <View style={styles.trustBadge}>
          <Text style={styles.trustBadgeIcon}>🔒</Text>
          <Text style={styles.trustBadgeText}>Secure Checkout</Text>
        </View>
        <View style={styles.trustBadge}>
          <Text style={styles.trustBadgeIcon}>⚡</Text>
          <Text style={styles.trustBadgeText}>Fast Dispatch</Text>
        </View>
      </View>
      
      <View style={[styles.desktopContainer, isDesktop && styles.desktopRow]}>
        {/* Main Form Column */}
        <View style={[styles.checkoutBox, isDesktop && styles.formColumn]}>

        {/* Contact & Address */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionSubtitle}>Required for order confirmation</Text>
          {errors.contact && errors.contact.map((msg, idx) => (
            <Text key={idx} style={styles.errorText}>{msg}</Text>
          ))}
          <TextInput
            style={[styles.input, errors.contact?.includes('Enter a valid email') && styles.inputError]}
            placeholder="Email"
            value={contact.email}
            onChangeText={v => handleInputChange('contact', 'email', v)}
            keyboardType="email-address"
            autoComplete="email"
            placeholderTextColor={colors.platinum}
          />
          <TextInput
            style={[styles.input, errors.contact?.includes('Name is required') && styles.inputError]}
            placeholder="Full Name"
            value={contact.name}
            onChangeText={v => handleInputChange('contact', 'name', v)}
            autoComplete="name"
            placeholderTextColor={colors.platinum}
          />
        </View>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.sectionSubtitle}>Where should we send your order?</Text>
          {errors.address && errors.address.map((msg, idx) => (
            <Text key={idx} style={styles.errorText}>{msg}</Text>
          ))}
          <TextInput
            style={[styles.input, errors.address?.includes('Address required') && styles.inputError]}
            placeholder="Address Line 1"
            value={address.line1}
            onChangeText={v => handleInputChange('address', 'line1', v)}
            autoComplete="address-line1"
            placeholderTextColor={colors.platinum}
          />
          <TextInput
            style={[styles.input, errors.address?.includes('City required') && styles.inputError]}
            placeholder="City"
            value={address.city}
            onChangeText={v => handleInputChange('address', 'city', v)}
            autoComplete="address-level2"
            placeholderTextColor={colors.platinum}
          />
          <TextInput
            style={[styles.input, errors.address?.includes('Postcode required') && styles.inputError]}
            placeholder="Postcode"
            value={address.postcode}
            onChangeText={v => handleInputChange('address', 'postcode', v)}
            autoComplete="postal-code"
            placeholderTextColor={colors.platinum}
          />
        </View>
        {/* Coupon Code Input */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Discount Code</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 12 }]}
              placeholder="Enter coupon code"
              value={coupon}
              onChangeText={setCoupon}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor={colors.platinum}
            />
            <Pressable
              style={({ pressed }) => [styles.checkoutButton, applyingCoupon && styles.checkoutButtonDisabled, pressed && !applyingCoupon && { opacity: 0.93 }]}
              onPress={handleApplyCoupon}
              disabled={applyingCoupon}
              accessibilityRole="button"
              accessibilityLabel="Apply Coupon"
            >
              {applyingCoupon ? (
                <ActivityIndicator color={colors.gold} style={{ marginVertical: 2 }} />
              ) : (
                <Text style={styles.checkoutButtonText}>Apply</Text>
              )}
            </Pressable>
          </View>
          {couponStatus && (
            couponStatus.valid ? (
              <Text style={[styles.successText, { marginBottom: 4 }]}>Coupon applied: {coupon.toUpperCase()} {couponStatus.discount.type === 'percent' ? `(${couponStatus.discount.value}% off)` : `(-₤${couponStatus.discount.value.toFixed(2)})`}</Text>
            ) : (
              <Text style={[styles.errorText, { marginBottom: 4 }]}>{couponStatus.error}</Text>
            )
          )}
        </View>
        {/* Shipping Options */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Shipping Options</Text>
          {shippingLoading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 8 }} />
          ) : (
            SHIPPING_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                onPress={() => setShippingOption(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: shippingOption === opt.key }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: shippingOption === opt.key ? colors.gold : colors.platinum,
                  alignItems: 'center', justifyContent: 'center', marginRight: 10
                }}>
                  {shippingOption === opt.key && (
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold }} />
                  )}
                </View>
                <Text style={{ color: colors.text, fontSize: 16 }}>{opt.label}</Text>
              </Pressable>
            ))
          )}
        </View>
        </View>
        
        {/* Order Summary Column */}
        <View style={[isDesktop ? styles.summaryColumn : styles.checkoutBox]}>
          <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Order Summary</Text>
          
          {/* Cart Items Summary */}
          <View style={styles.cartItemsContainer}>
            {cart.map((item, index) => (
              <View key={item.id} style={[styles.cartItemRow, index < cart.length - 1 && styles.cartItemBorder]}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartItemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.cartItemPrice}>₤{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.summaryDivider} />
          
          {/* Price Summary */}
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{`₤${subtotal.toFixed(2)}`}</Text></View>
          {couponStatus?.valid && discountAmount > 0 && (
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Discount</Text><Text style={[styles.summaryValue, { color: colors.gold }]}>-₤{discountAmount.toFixed(2)}</Text></View>
          )}
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Shipping</Text><Text style={styles.summaryValue}>{shippingCost === 0 ? 'Free' : `₤${shippingCost.toFixed(2)}`}</Text></View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}><Text style={styles.summaryLabelTotal}>Total</Text><Text style={styles.summaryValueTotal}>{`₤${total.toFixed(2)}`}</Text></View>
          
          {/* Order incentives */}
          <View style={styles.orderIncentives}>
            <Text style={styles.incentiveText}>Free standard delivery on all orders</Text>
          </View>
        </View>
      </View>
      
      {/* Additional offers */}
      <View style={[styles.additionalOffersContainer, isDesktop && styles.additionalOffersDesktop]}>
        <View style={styles.offerBox}>
          <Text style={styles.offerIcon}>🔄</Text>
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>60-Day Returns</Text>
            <Text style={styles.offerDescription}>Not completely satisfied? Return within 60 days for a full refund.</Text>
          </View>
        </View>
        <View style={styles.offerBox}>
          <Text style={styles.offerIcon}>🛡️</Text>
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>Authenticity Guarantee</Text>
            <Text style={styles.offerDescription}>Every item is verified for authenticity before dispatch.</Text>
          </View>
        </View>
      </View>
      
      {/* Stripe Payment - Full width */}
      <View style={[styles.checkoutBox, { marginTop: 24, width: '100%', borderTopWidth: 2, borderTopColor: '#f5f2ea' }]}>
        {stripeLoading && (
          <View style={{padding: 20, alignItems: 'center'}}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={{marginTop: 10, color: colors.text}}>Loading payment form...</Text>
          </View>
        )}
        
        {stripeError && (
          <View style={{padding: 20}}>
            <Text style={{color: 'red', marginBottom: 10}}>Payment Error:</Text>
            <Text style={{color: colors.text}}>{stripeError}</Text>
          </View>
        )}
        
        {/* Always show the Stripe Elements form when stripe is loaded */}
        {stripe ? (
          <Elements stripe={stripe} options={{
            locale: 'en-GB',
            appearance: { 
              theme: 'stripe',
              variables: {
                colorPrimary: '#c9a95c',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'Helvetica, sans-serif',
                spacingUnit: '4px',
                borderRadius: '4px'
              }
            },
            loader: 'always'
          }}>
            <StripePaymentForm
              cart={cart}
              contact={contact}
              address={address}
              errors={errors}
              setErrors={setErrors}
              paying={paying}
              setPaying={setPaying}
              validateForm={validateForm}
              removeFromCart={removeFromCart}
              onSuccess={handleCheckoutSuccess}
              coupon={coupon}
              discountAmount={discountAmount}
            />
          </Elements>
        ) : (
          <View style={{padding: 20}}>
            <Text style={{color: colors.text, fontWeight: 'bold', marginBottom: 10}}>Loading Payment Form...</Text>
            <Text style={{color: colors.text, marginBottom: 10}}>Please wait while we initialize the payment system.</Text>
            <ActivityIndicator size="small" color={colors.gold} />
          </View>
        )}
      </View>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmationOpen}
        onClose={handleContinueShopping}
        onContinue={handleContinueShopping}
        autoCloseMs={15000}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.white,
  },
  pageTitle: {
    width: '100%',
    marginBottom: 28,
    textAlign: 'center',
  },
  desktopContainer: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  desktopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
  },
  formColumn: {
    flex: 3,
    minWidth: 300,
    maxWidth: '100%',
  },
  summaryColumn: {
    flex: 1,
    minWidth: 300,
    maxWidth: '100%',
    alignSelf: 'flex-start',
    position: 'sticky',
    top: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ece6d7',
    backgroundColor: '#fafaf8',
    borderRadius: 10,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  checkoutBox: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: fontFamily.serif,
    color: colors.onyxBlack,
  },
  subHeader: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: colors.grey,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  inputError: {
    borderColor: colors.ruby,
  },
  cardElementLuxuryContainer: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    boxShadow: '0 2px 16px rgba(191,160,84,0.08)',
    padding: 22,
    marginTop: 16,
    marginBottom: 18,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  stripeCardLuxuryWrapper: {
    backgroundColor: colors.white,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  secureIcon: {
    fontSize: 18,
    color: colors.gold,
    marginRight: 6,
  },
  secureLabel: {
    fontSize: 16,
    color: colors.gold,
    fontFamily,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardHelperText: {
    fontSize: 13,
    color: colors.platinum,
    marginBottom: 8,
    marginTop: 2,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: colors.ruby,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 10,
  },
  trustBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9f7f2',
    borderRadius: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  trustBadgeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  trustBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onyxBlack,
  },
  orderIncentives: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0ece2',
  },
  incentiveText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
  incentiveHighlight: {
    color: colors.gold,
    fontWeight: 'bold',
  },
  incentiveSuccess: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
  },
  additionalOffersContainer: {
    marginVertical: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
  },
  additionalOffersDesktop: {
    flexDirection: 'row',
  },
  offerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f7f2',
    borderRadius: 8,
    padding: 16,
    flex: 1,
  },
  offerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.onyxBlack,
  },
  offerDescription: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 18,
  },
  orderSummarySection: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.grey,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onyxBlack,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ece6d7',
    marginVertical: 12,
  },
  cartItemsContainer: {
    marginBottom: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  cartItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece2',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  cartItemQuantity: {
    fontSize: 13,
    color: colors.grey,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 18,
    marginBottom: 10,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontFamily: fontFamily.serif,
    textShadowColor: '#e6c98b',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#e5d9c3',
    opacity: 0.6,
  },
  // Stripe card element styles
  cardElementLuxuryContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fafaf8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ece6d7',
  },
  stripeCardLuxuryWrapper: {
    height: 50,
    paddingHorizontal: 12,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    marginBottom: 10,
  },
  secureIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  secureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.onyxBlack,
  },
  cardHelperText: {
    fontSize: 13,
    color: colors.grey,
    marginTop: 4,
    marginBottom: 10,
  },
  paymentSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    color: colors.ruby,
    marginBottom: 10,
    fontSize: 14,
  },
  successText: {
    color: '#2e7d32',
    marginBottom: 10,
    fontSize: 14,
  },
});


