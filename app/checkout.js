import React, { useState, useEffect, useRef, createRef } from 'react';
// Add a try-catch block around any potential font loading code
try {
  // Disable fontfaceobserver timeout by setting a very high value
  window.FontFaceObserver = window.FontFaceObserver || {};
  window.FontFaceObserver.prototype.load = function() {
    return Promise.resolve();
  };
} catch (error) {
  console.warn('Error handling font loading:', error);
}
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  ScrollView, 
  Platform, 
  Dimensions,
  Image,
  Switch,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView
} from 'react-native';
import PaymentMethodsRow from './(components)/PaymentMethodsRow';
import { useStore } from '../context/store';
import { fetchProductsShipping } from '../lib/supabase/products';
import { getGuestSession } from '../lib/supabase/client';
import { checkoutAttemptService } from '../lib/supabase/services';
import { z } from 'zod';
import { storeOrder } from './components/orders-modal';
import { trackEvent } from '../lib/trackEvent';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../theme';
import ConfirmationModal from './components/ConfirmationModal';
import { useRouter, Link } from 'expo-router';
import { CardElement, useElements, useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Constants from 'expo-constants';
import { FontAwesome } from '@expo/vector-icons';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// Haptic feedback utility that's safe for web (no-op on web)
const triggerHaptic = (type) => {
  // No-op function for web platform
  // In a real implementation, you would conditionally import
  // and use expo-haptics only in native builds
  console.log(`Haptic feedback: ${type}`);
};
import FormField from './components/FormField';
import { LoadingIndicator, ProcessingPaymentIndicator, SuccessIndicator } from './components/LoadingIndicator';
import { AnimatedButton, FadeIn, SlideIn } from './components/MicroInteractions';
import CollapsibleSection from './components/CollapsibleSection';
import AddressAutocomplete from './components/AddressAutocomplete';

// Stripe keys from env - try multiple sources
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
console.log(
  'Final Stripe publishable key status:', 
  STRIPE_PUBLISHABLE_KEY ? 
    `Available (starts with: ${STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...)` : 
    'MISSING - Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file'
);

// PayPal client ID - uses different keys for production and sandbox environments
const PAYPAL_CLIENT_ID = process.env.NODE_ENV === 'production'
  ? process.env.EXPO_PUBLIC_PAYPAL_LIVE_CLIENT_ID
  : process.env.EXPO_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;

// Log PayPal client ID status for debugging
console.log(
  `PayPal environment: ${process.env.NODE_ENV || 'development'}`
);
console.log(
  'PayPal Client ID status:', 
  PAYPAL_CLIENT_ID ? 
    `Available (starts with: ${PAYPAL_CLIENT_ID.substring(0, 7)}...)` : 
    'MISSING - Please check your .env file and production environment variables.'
);

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Validation schemas
const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});

const ukPostcodeRegex = /^(GIR 0AA|[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2})$/i;
const addressSchema = z.object({
  line1: z.string().min(3, 'Address required'),
  city: z.string().min(2, 'City required'),
  postcode: z.string()
    .min(5, 'Postcode required')
    .max(8, 'Postcode too long')
    .regex(ukPostcodeRegex, 'Enter a valid UK postcode (e.g., SW1A 1AA)'),
});

// Main Checkout Component
export default function CheckoutScreen() {
  const router = useRouter();
  
  // Coupon state
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { valid: bool, discount: {type, value}, error }
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Cart and user information
  const { cart, removeFromCart } = useStore();
  const [contact, setContact] = useState({ name: '', email: '' });
  const [address, setAddress] = useState({ 
    country: 'United Kingdom', 
    name: '', 
    line1: '', 
    apartment: '', 
    city: '', 
    postcode: '',
    phone: ''
  });
  
  // Order reservation timer
  const [reservationMinutes, setReservationMinutes] = useState(8);
  const [reservationSeconds, setReservationSeconds] = useState(32);
  
  // Remember me option
  const [rememberInfo, setRememberInfo] = useState(false);
  
  // Use shipping address as billing address
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  
  // SMS marketing opt-in
  const [smsMarketing, setSmsMarketing] = useState(false);
  
  // Selected payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [preferredPaymentMethodId, setPreferredPaymentMethodId] = useState(null);
  const [expressCheckoutMethod, setExpressCheckoutMethod] = useState(null);
  
  // Form state
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  
  // Stripe state
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripe, setStripe] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [stripeError, setStripeError] = useState(null);
  
  // Confirmation modal
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [orderEmail, setOrderEmail] = useState('');
  
  // Shipping options
  const [shippingOption, setShippingOption] = useState('standard');
  const [shippingCost, setShippingCost] = useState(0); // Free shipping by default
  const [shippingLoading, setShippingLoading] = useState(false);
  
  // Card details
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  
  // Check if we're on desktop (width > 768px)
  const [isDesktop, setIsDesktop] = useState(false);
  const [layoutSize, setLayoutSize] = useState('');

  // Refs for animations and scrolling
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    // Update layout when screen dimensions change
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      setIsDesktop(width >= 768);
      
      // Apply different styles based on screen size
      if (width < 380) {
        // Extra small mobile devices
        setLayoutSize('xs');
      } else if (width < 480) {
        // Small mobile devices
        setLayoutSize('sm');
      } else if (width < 768) {
        // Large mobile devices and small tablets
        setLayoutSize('md');
      } else if (width < 1024) {
        // Tablets and small laptops
        setLayoutSize('lg');
      } else {
        // Large desktops
        setLayoutSize('xl');
      }
    };
    
    updateLayout(); // Initial check
    
    if (typeof window !== 'undefined') {
      // Add event listener for dimension changes
      Dimensions.addEventListener('change', updateLayout);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // Clean up
        Dimensions.removeEventListener?.('change', updateLayout);
      }
    };
  }, []);

  useEffect(() => {
    // Track when user views the checkout page
    trackEvent('checkout_view', {});
    // Track when user proceeds to checkout (from cart)
    trackEvent('proceed_to_checkout', { items: cart.length, cart: cart });
    
    // Initialize Stripe
    const initializeStripe = async () => {
      if (!STRIPE_PUBLISHABLE_KEY) {
        setStripeError('Stripe configuration is missing. Please contact support.');
        setStripeLoading(false);
        return;
      }
      
      try {
        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        setStripeError('Could not initialize payment system. Please try again later.');
      } finally {
        setStripeLoading(false);
      }
    };
    
    initializeStripe();
    
    // Start reservation timer
    const timerInterval = setInterval(() => {
      setReservationSeconds(prev => {
        if (prev === 0) {
          if (reservationMinutes === 0) {
            clearInterval(timerInterval);
            return 0;
          }
          // Use a callback to avoid dependency on reservationMinutes
          setReservationMinutes(prevMinutes => prevMinutes - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Called after successful payment
  const handleCheckoutSuccess = (email) => {
    setOrderEmail(email);
    setConfirmationOpen(true);
  };

  // Called when user closes modal or continues shopping
  const handleContinueShopping = () => {
    setConfirmationOpen(false);
    router.replace('/(tabs)/shop');
  };
  
  // Handle alternative payment methods (PayPal, Klarna, Clearpay)
  const handleAlternativePayment = (method) => {
    // Validate form with visual feedback
    if (!validateForm()) {
      // Provide haptic feedback for error on mobile
      triggerHaptic('error');
      return;
    }
    
    // Set paying state to show loading UI
    setPaying(true);
    
    // In a real implementation, this would redirect to the payment provider
    console.log(`Redirecting to ${method} payment flow...`);
    
    // For demo purposes, simulate a successful payment after a delay
    setTimeout(() => {
      // Track the payment method used
      trackEvent('payment_method_selected', {
        payment_method: method,
        value: calculateTotal(),
        currency: 'GBP'
      });
      
      // For demo purposes, simulate a successful payment
      handleCheckoutSuccess(contact.email);
      setPaying(false);
    }, 2000);
  };
  
  // Handle checkout button press
  const handleCheckout = () => {
    // Validate form before proceeding
    if (validateForm()) {
      // Set paying state to true to show loading indicator
      setPaying(true);
      // The actual payment processing is handled in the StripePaymentForm component
    }
  };

  // Handle input changes
  const handleInputChange = (type, field, value) => {
    // Clear any existing errors for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update the appropriate state
    if (type === 'contact') {
      setContact(prev => ({ ...prev, [field]: value }));
    } else if (type === 'address') {
      setAddress(prev => ({ ...prev, [field]: value }));
    }
    
    // Log checkout attempt after debounce
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(async () => {
    try {
      // Get or create a guest session ID
      const guestSessionId = await getGuestSession();
      
      // Use upsertAttempt instead of logCheckoutAttempt
      await checkoutAttemptService.upsertAttempt({
        guest_session_id: guestSessionId,
        email: contact.email || 'anonymous',
        contact: contact,
        address: address,
        cart: cart,
        status: 'in_progress',
        metadata: {
          fields_completed: {
            ...Object.keys(contact).filter(k => contact[k]).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            ...Object.keys(address).filter(k => address[k]).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
          },
          cart_items: cart.length
        }
      });
    } catch (error) {
      console.error('Failed to log checkout attempt:', error);
      // Continue without blocking the user experience
    }
  }, 1500));
  };

  // Coupon validation handler
  const handleApplyCoupon = async () => {
    if (!coupon || coupon.trim() === '') {
      setCouponStatus({ valid: false, error: 'Please enter a coupon code.' });
      return;
    }
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

  // Form validation - less intrusive approach
  const validateForm = () => {
    const newErrors = {};
    const missingFields = [];
    
    try {
      contactSchema.parse(contact);
    } catch (error) {
      error.errors.forEach(err => {
        newErrors[err.path[0]] = err.message;
        missingFields.push(err.path[0]);
      });
    }
    
    try {
      addressSchema.parse(address);
    } catch (error) {
      error.errors.forEach(err => {
        newErrors[err.path[0]] = err.message;
        missingFields.push(err.path[0]);
      });
    }
    
    // Validate phone number if provided
    if (address.phone && !/^\+?[0-9]{10,14}$/.test(address.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
      missingFields.push('phone');
    }
    
    // Validate name fields
    if (!address.name || address.name.length < 2) {
      newErrors.name = 'Name is required';
      missingFields.push('name');
    }
    
    // Only show errors when submitting the form
    setErrors(newErrors);
    
    // If there are errors, scroll to the first field with an error
    if (missingFields.length > 0) {
      // Focus on the first field with an error
      const firstErrorField = document.getElementById(`field-${missingFields[0]}`);
      if (firstErrorField) {
        setTimeout(() => {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        }, 100);
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Field validators for real-time validation
  const validators = {
    email: (value) => {
      try {
        z.string().email('Enter a valid email').parse(value);
        return true;
      } catch (error) {
        return error.message;
      }
    },
    name: (value) => {
      try {
        z.string().min(2, 'Name is required').parse(value);
        return true;
      } catch (error) {
        return error.message;
      }
    },
    postcode: (value) => {
      try {
        z.string()
          .min(5, 'Postcode required')
          .max(8, 'Postcode too long')
          .regex(ukPostcodeRegex, 'Enter a valid UK postcode')
          .parse(value);
        return true;
      } catch (error) {
        return error.message;
      }
    },
    phone: (value) => {
      if (!value) return true; // Optional
      if (!/^\+?[0-9]{10,14}$/.test(value.replace(/\s+/g, ''))) {
        return 'Please enter a valid phone number';
      }
      return true;
    }
  };

  // Calculate discount amount
  const getDiscountAmount = () => {
    if (!couponStatus?.valid) return 0;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (couponStatus.discount.type === 'percentage') {
      return (subtotal * couponStatus.discount.value) / 100;
    } else if (couponStatus.discount.type === 'fixed') {
      return couponStatus.discount.value;
    }
    
    return 0;
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = getDiscountAmount();
    const shipping = shippingOption === 'express' ? 4.99 : 0;
    
    return subtotal - discount + shipping;
  };
  
  // Function to get dynamic styles based on layout size
  const getDynamicStyles = () => {
    // Return different styles based on layout size
    switch(layoutSize) {
      case 'xs':
        return {
          dynamicContainer: { padding: 10 },
          dynamicText: { fontSize: 18 }
        };
      case 'sm':
        return {
          dynamicContainer: { padding: 15 },
          dynamicText: { fontSize: 20 }
        };
      case 'md':
        return {
          dynamicContainer: { padding: 20 },
          dynamicText: { fontSize: 22 }
        };
      case 'lg':
        return {
          dynamicContainer: { padding: 25 },
          dynamicText: { fontSize: 24 }
        };
      case 'xl':
      default:
        return {
          dynamicContainer: { padding: 30 },
          dynamicText: { fontSize: 26 }
        };
    }
  };
  
  const dynamicStyles = getDynamicStyles();
  
  // Handle address autocomplete selection
  const handleAddressSelect = (selectedAddress) => {
    setAddress(prev => ({
      ...prev,
      line1: selectedAddress.line1 || '',
      city: selectedAddress.city || '',
      postcode: selectedAddress.postcode || ''
    }));
  };
  
  // Save user information for returning customers
  const saveUserInfo = () => {
    if (rememberInfo) {
      try {
        // Store in local storage for web
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('rc_user_contact', JSON.stringify(contact));
          localStorage.setItem('rc_user_address', JSON.stringify(address));
        }
        // For React Native, you would use AsyncStorage here
      } catch (error) {
        console.error('Error saving user information:', error);
      }
    }
  };
  
  // Load saved user information
  useEffect(() => {
    try {
      // Load from local storage for web
      if (typeof localStorage !== 'undefined') {
        const savedContact = localStorage.getItem('rc_user_contact');
        const savedAddress = localStorage.getItem('rc_user_address');
        
        if (savedContact) {
          setContact(JSON.parse(savedContact));
        }
        
        if (savedAddress) {
          setAddress(prev => ({ ...prev, ...JSON.parse(savedAddress) }));
        }
      }
      // For React Native, you would use AsyncStorage here
    } catch (error) {
      console.error('Error loading saved user information:', error);
    }
  }, []);

    return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.header, dynamicStyles.dynamicContainer]}>
          <Link href="/(tabs)/" style={styles.logoLink}>
            <Image
              source={require('../assets/images/rare-collectables-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </Link>
        </View>

        {cart.length === 0 ? (
          <FadeIn duration={500}>
            <View style={styles.emptyCartContainer}>
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <AnimatedButton
                style={styles.continueShopping}
                onPress={() => router.replace('/(tabs)/shop')}
                accessibilityLabel="Continue shopping"
              >
                Continue Shopping
              </AnimatedButton>
            </View>
          </FadeIn>
        ) : stripeLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator text="Preparing checkout..." />
          </View>
        ) : stripeError ? (
          <FadeIn duration={500}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Payment Error</Text>
              <Text>{stripeError}</Text>
              <AnimatedButton
                style={[styles.continueShopping, { marginTop: 20 }]}
                onPress={() => router.replace('/(tabs)/shop')}
                accessibilityLabel="Return to shop"
              >
                Return to Shop
              </AnimatedButton>
            </View>
          </FadeIn>
        ) : (
          <Elements stripe={stripePromise}>
            <Animated.View 
              style={[
                styles.checkoutContainer, 
                isDesktop && styles.checkoutContainerDesktop,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              {/* Left Column - Customer Information and Payment */}
              <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
                {/* Order Reservation Timer */}
                <View style={styles.reservationTimerContainer}>
                  <Text style={styles.reservationTimerText}>
                    <FontAwesome name="clock-o" size={16} color={colors.gold} /> Your order is reserved for {reservationMinutes}:{reservationSeconds < 10 ? `0${reservationSeconds}` : reservationSeconds} minutes
                  </Text>
                </View>
                  
                {/* Express Checkout Options */}
                <View style={styles.expressCheckoutContainer}>
                  <Text style={styles.expressCheckoutTitle}>Express checkout</Text>
                  
                  {/* Express PayPal Checkout */}
                  {expressCheckoutMethod === 'paypal' ? (
                    <View style={{marginBottom: 15}}>
                      <PayPalScriptProvider options={{ 
                        'client-id': PAYPAL_CLIENT_ID,
                        currency: 'GBP',
                        intent: 'capture',
                        components: 'buttons'
                      }}>
                        <PayPalButtons
                          style={{
                            layout: 'horizontal',
                            color: 'gold',
                            shape: 'rect',
                            label: 'checkout',
                            height: 45
                          }}
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              purchase_units: [{
                                amount: {
                                  value: calculateTotal().toFixed(2),
                                  currency_code: 'GBP',
                                  breakdown: {
                                    item_total: {
                                      value: (calculateTotal() - (shippingOption === 'standard' ? 5.99 : 15.99)).toFixed(2),
                                      currency_code: 'GBP'
                                    },
                                    shipping: {
                                      value: shippingOption === 'standard' ? '5.99' : '15.99',
                                      currency_code: 'GBP'
                                    }
                                  }
                                },
                                description: `Express Checkout Order`
                              }]
                            });
                          }}
                          onApprove={(data, actions) => {
                            return actions.order.capture().then((details) => {
                              console.log('Express PayPal transaction completed', details);
                              handleCheckoutSuccess(details.payer.email_address || 'customer@example.com');
                            });
                          }}
                          onError={(err) => {
                            console.error('Express PayPal error:', err);
                            alert(`Express PayPal Error: ${err.message || 'Unknown error'}. Please try again.`);
                            setExpressCheckoutMethod(null);
                          }}
                          onCancel={() => {
                            setExpressCheckoutMethod(null);
                          }}
                        />
                        <Pressable 
                          style={[styles.textButton, {marginTop: 10}]}
                          onPress={() => setExpressCheckoutMethod(null)}
                        >
                          <Text style={styles.textButtonLabel}>Cancel and use standard checkout</Text>
                        </Pressable>
                      </PayPalScriptProvider>
                    </View>
                  ) : (
                    <>
                      <View style={styles.expressPaymentRow}>
                        <Pressable 
                          style={styles.expressPaymentButton}
                          onPress={() => setExpressCheckoutMethod('paypal')}
                          accessibilityLabel="Pay with PayPal"
                        >
                          <Text style={styles.paypalText}>PayPal</Text>
                        </Pressable>
                        <Pressable 
                          style={styles.expressPaymentButton}
                          onPress={() => {
                            setSelectedPaymentMethod('card');
                            setTimeout(() => {
                              const paymentSection = document.getElementById('payment-section');
                              if (paymentSection) {
                                paymentSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }}
                          accessibilityLabel="Pay with Apple Pay"
                        >
                          <Text style={styles.applePayText}>Apple Pay</Text>
                        </Pressable>
                        <Pressable 
                          style={styles.expressPaymentButton}
                          onPress={() => {
                            setSelectedPaymentMethod('card');
                            setTimeout(() => {
                              const paymentSection = document.getElementById('payment-section');
                              if (paymentSection) {
                                paymentSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }}
                          accessibilityLabel="Pay with Google Pay"
                        >
                          <Text style={styles.googlePayText}>G Pay</Text>
                        </Pressable>
                      </View>
                      <View style={styles.orDivider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.dividerLine} />
                      </View>
                    </>
                  )}
                </View>

                {/* Contact Information */}
                <CollapsibleSection title="Contact Information" initiallyCollapsed={false}>
                  <FormField
                    placeholder="Email address"
                    value={contact.email}
                    onChangeText={(text) => handleInputChange('contact', 'email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    error={errors.email}
                    required={true}
                    validator={validators.email}
                    icon="envelope"
                    id="field-email"
                  />
                  
                  <View style={styles.checkboxRow}>
                    <Switch
                      value={smsMarketing}
                      onValueChange={setSmsMarketing}
                      trackColor={{ false: '#d0d0d0', true: colors.gold }}
                      thumbColor={colors.white}
                    />
                    <Text style={styles.checkboxLabel}>Email me with news and offers</Text>
                  </View>
                </CollapsibleSection>
                
                {/* Delivery Information */}
                <CollapsibleSection title="Delivery Information" initiallyCollapsed={false}>
                  <View style={styles.formRow}>
                    <FormField
                      placeholder="Your full name"
                      value={address.name}
                      onChangeText={(text) => handleInputChange('address', 'name', text)}
                      autoComplete="name"
                      textContentType="name"
                      error={errors.name}
                      required={true}
                      validator={validators.name}
                      icon="user"
                      id="field-name"
                    />
                  </View>
                  
                  <FormField
                    placeholder="Address"
                    value={address.address1}
                    onChangeText={(text) => handleInputChange('address', 'address1', text)}
                    error={errors.address1}
                    required={true}
                    id="field-address1"
                    autoComplete="street-address"
                    textContentType="streetAddressLine1"
                  />
                  
                  <FormField
                    placeholder="Apartment, suite, etc. (optional)"
                    value={address.address2}
                    onChangeText={(text) => handleInputChange('address', 'address2', text)}
                    error={errors.address2}
                    required={false}
                    id="field-address2"
                    textContentType="streetAddressLine2"
                  />
                  
                  <View style={styles.rowContainer}>
                    <FormField
                      placeholder="City"
                      value={address.city}
                      onChangeText={(text) => handleInputChange('address', 'city', text)}
                      error={errors.city}
                      required={true}
                      id="field-city"
                      autoComplete="address-level2"
                      textContentType="addressCity"
                      style={{flex: 1, marginRight: 8}}
                    />
                    
                    <AddressAutocomplete
                      postcode={address.postcode}
                      onPostcodeChange={(text) => handleInputChange('address', 'postcode', text)}
                      onAddressSelected={(selectedAddress) => {
                        handleInputChange('address', 'address1', selectedAddress.line1 || '');
                        handleInputChange('address', 'address2', selectedAddress.line2 || '');
                        handleInputChange('address', 'city', selectedAddress.city || '');
                        handleInputChange('address', 'county', selectedAddress.county || '');
                        handleInputChange('address', 'postcode', selectedAddress.postcode || '');
                      }}
                      error={errors.postcode}
                      id="field-postcode"
                      style={{flex: 1}}
                    />
                  </View>
                  
                  <FormField
                    placeholder="Phone"
                    value={address.phone}
                    onChangeText={(text) => handleInputChange('address', 'phone', text)}
                    keyboardType="phone-pad"
                    error={errors.phone}
                    required={false}
                    validator={validators.phone}
                    info="For delivery updates"
                    icon="phone"
                    id="field-phone"
                  />
                  
                  <View style={styles.checkboxRow}>
                    <Switch
                      value={smsMarketing}
                      onValueChange={setSmsMarketing}
                      trackColor={{ false: '#d0d0d0', true: colors.gold }}
                      thumbColor={colors.white}
                    />
                    <Text style={styles.checkboxLabel}>Text me with news and offers</Text>
                  </View>
                </CollapsibleSection>
                
                {/* Delivery Method */}
                <CollapsibleSection title="Delivery Method" initiallyCollapsed={false}>
                  <Text style={styles.sectionTitle}>Delivery method</Text>
                  
                  <Pressable 
                    style={[styles.shippingOption, shippingOption === 'standard' && styles.shippingOptionSelected]}
                    onPress={() => setShippingOption('standard')}
                  >
                    <View style={[styles.radioCircle, shippingOption === 'standard' && styles.radioCircleSelected]}>
                      {shippingOption === 'standard' && <View style={styles.radioCircleDot} />}
                    </View>
                    <View style={styles.shippingOptionDetails}>
                      <Text style={styles.shippingOptionLabel}>Standard Delivery</Text>
                    </View>
                    <Text style={styles.shippingOptionPrice}>£5.99</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.shippingOption, shippingOption === 'express' && styles.shippingOptionSelected]}
                    onPress={() => setShippingOption('express')}
                  >
                    <View style={[styles.radioCircle, shippingOption === 'express' && styles.radioCircleSelected]}>
                      {shippingOption === 'express' && <View style={styles.radioCircleDot} />}
                    </View>
                    <View style={styles.shippingOptionDetails}>
                      <Text style={styles.shippingOptionLabel}>Express Delivery</Text>
                    </View>
                    <Text style={styles.shippingOptionPrice}>£15.99</Text>
                  </Pressable>
                </CollapsibleSection>
                
                {/* Payment */}
                <CollapsibleSection title="Payment" initiallyCollapsed={false} id="payment-section">
                  <Text style={styles.sectionTitle}>Payment</Text>
                  
                  <View style={styles.paymentMethodsContainer}>
                    <Pressable 
                      style={[styles.paymentMethod, selectedPaymentMethod === 'card' && styles.paymentMethodSelected]}
                      onPress={() => setSelectedPaymentMethod('card')}
                    >
                      <View style={styles.radioCircle}>
                        {selectedPaymentMethod === 'card' && <View style={styles.radioCircleDot} />}
                      </View>
                      <View style={styles.paymentMethodDetails}>
                        <Text style={styles.paymentMethodLabel}>Credit / Debit Card</Text>
                        <Text style={styles.paymentMethodDescription}>All major cards accepted</Text>
                      </View>
                      <Image 
                        source={require('../assets/images/payment-logo.png')} 
                        style={styles.paymentMethodIcon} 
                        resizeMode="contain"
                      />
                    </Pressable>
                    
                    <Pressable 
                      style={[styles.paymentMethod, selectedPaymentMethod === 'paypal' && styles.paymentMethodSelected]}
                      onPress={() => setSelectedPaymentMethod('paypal')}
                    >
                      <View style={styles.radioCircle}>
                        {selectedPaymentMethod === 'paypal' && <View style={styles.radioCircleDot} />}
                      </View>
                      <View style={styles.paymentMethodDetails}>
                        <Text style={styles.paymentMethodLabel}>PayPal</Text>
                        <Text style={styles.paymentMethodDescription}>Fast and secure checkout</Text>
                      </View>
                      <FontAwesome name="paypal" size={24} color="#003087" style={{marginHorizontal: 8}} />
                    </Pressable>

                    <Pressable 
                      style={[styles.paymentMethod, selectedPaymentMethod === 'klarna' && styles.paymentMethodSelected]}
                      onPress={() => setSelectedPaymentMethod('klarna')}
                    >
                      <View style={styles.radioCircle}>
                        {selectedPaymentMethod === 'klarna' && <View style={styles.radioCircleDot} />}
                      </View>
                      <View style={styles.paymentMethodDetails}>
                        <Text style={styles.paymentMethodLabel}>Klarna</Text>
                        <Text style={styles.paymentMethodDescription}>Pay in 3 interest-free installments</Text>
                      </View>
                      <Image 
                        source={require('../assets/images/klarna-logo.png')} 
                        style={[styles.paymentMethodIcon, {width: 40}]} 
                        resizeMode="contain"
                        defaultSource={require('../assets/images/klarna-logo.png')}
                        fallback={<Text style={{color: colors.gold, fontWeight: 'bold'}}>Klarna</Text>}
                      />
                    </Pressable>

                    <Pressable 
                      style={[styles.paymentMethod, selectedPaymentMethod === 'clearpay' && styles.paymentMethodSelected]}
                      onPress={() => setSelectedPaymentMethod('clearpay')}
                    >
                      <View style={styles.radioCircle}>
                        {selectedPaymentMethod === 'clearpay' && <View style={styles.radioCircleDot} />}
                      </View>
                      <View style={styles.paymentMethodDetails}>
                        <Text style={styles.paymentMethodLabel}>Clearpay</Text>
                        <Text style={styles.paymentMethodDescription}>Pay in 4 interest-free installments</Text>
                      </View>
                      <Image 
                        source={require('../assets/images/clearpay-logo.png')} 
                        style={[styles.paymentMethodIcon, {width: 40}]} 
                        resizeMode="contain"
                        defaultSource={require('../assets/images/clearpay-logo.png')}
                        fallback={<Text style={{color: colors.gold, fontWeight: 'bold'}}>Clearpay</Text>}
                      />
                    </Pressable>
                  </View>
                  
                  {selectedPaymentMethod === 'card' && (
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
                      discountAmount={getDiscountAmount()}
                      preferredPaymentMethodId={preferredPaymentMethodId}
                    />
                  )}
                  
                  {selectedPaymentMethod === 'paypal' && (
                    <FadeIn>
                      <View style={styles.alternativePaymentContainer}>
                        <Text style={styles.alternativePaymentText}>Complete your purchase securely with PayPal.</Text>
                        {Platform.OS === 'web' ? (
                          <PayPalScriptProvider options={{ 
                            'client-id': PAYPAL_CLIENT_ID,
                            currency: 'GBP',
                            intent: 'capture',
                            debug: true,
                            components: 'buttons'
                          }}>
                            <Text style={{marginBottom: 10, color: '#ff0000'}}>
                              PayPal Client ID: {PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : 'Missing'}
                            </Text>
                            <PayPalButtons
                              style={{
                                layout: 'horizontal',
                                color: 'gold',
                                shape: 'rect',
                                label: 'pay',
                                height: 45
                              }}
                              forceReRender={[address, contact, cart]}
                              createOrder={(data, actions) => {
                                if (!validateForm()) {
                                  triggerHaptic('error');
                                  return Promise.reject(new Error('Please complete all required fields'));
                                }
                                
                                return actions.order.create({
                                  purchase_units: [{
                                    amount: {
                                      value: calculateTotal().toFixed(2),
                                      currency_code: 'GBP',
                                      breakdown: {
                                        item_total: {
                                          value: (calculateTotal() - (shippingOption === 'standard' ? 5.99 : 15.99)).toFixed(2),
                                          currency_code: 'GBP'
                                        },
                                        shipping: {
                                          value: shippingOption === 'standard' ? '5.99' : '15.99',
                                          currency_code: 'GBP'
                                        }
                                      }
                                    },
                                    description: `Order from ${address.name}`,
                                    shipping: {
                                      name: {
                                        full_name: address.name
                                      },
                                      address: {
                                        address_line_1: address.line1,
                                        address_line_2: address.apartment || '',
                                        admin_area_2: address.city,
                                        postal_code: address.postcode,
                                        country_code: 'GB'
                                      }
                                    }
                                  }]
                                });
                              }}
                              onApprove={(data, actions) => {
                                return actions.order.capture().then((details) => {
                                  console.log('PayPal transaction completed', details);
                                  trackEvent('payment_method_selected', {
                                    payment_method: 'paypal',
                                    value: calculateTotal(),
                                    currency: 'GBP'
                                  });
                                  handleCheckoutSuccess(contact.email);
                                });
                              }}
                              onError={(err) => {
                                console.error('PayPal error:', err);
                                alert(`PayPal Error: ${err.message || 'Unknown error'}. Please check the console for more details or try a different payment method.`);
                              }}
                              onInit={() => {
                                console.log('PayPal buttons initialized');
                              }}
                            />
                          </PayPalScriptProvider>
                        ) : (
                          <AnimatedButton 
                            style={styles.checkoutButton}
                            onPress={() => handleAlternativePayment('paypal')}
                            accessibilityLabel="Continue to PayPal"
                          >
                            Continue to PayPal
                          </AnimatedButton>
                        )}
                      </View>
                    </FadeIn>
                  )}
                  
                  {selectedPaymentMethod === 'klarna' && (
                    <FadeIn>
                      <View style={styles.alternativePaymentContainer}>
                        <Text style={styles.alternativePaymentText}>Pay in 3 interest-free installments with Klarna.</Text>
                        <AnimatedButton 
                          style={styles.checkoutButton}
                          onPress={() => handleAlternativePayment('klarna')}
                          accessibilityLabel="Continue to Klarna"
                        >
                          Continue to Klarna
                        </AnimatedButton>
                      </View>
                    </FadeIn>
                  )}
                  
                  {selectedPaymentMethod === 'clearpay' && (
                    <FadeIn>
                      <View style={styles.alternativePaymentContainer}>
                        <Text style={styles.alternativePaymentText}>Pay in 4 interest-free installments with Clearpay.</Text>
                        <AnimatedButton 
                          style={styles.checkoutButton}
                          onPress={() => handleAlternativePayment('clearpay')}
                          accessibilityLabel="Continue to Clearpay"
                        >
                          Continue to Clearpay
                        </AnimatedButton>
                      </View>
                    </FadeIn>
                  )}
                </CollapsibleSection>
                
                {/* Remember Me & Marketing */}
                <CollapsibleSection title="Preferences" initiallyCollapsed={true}>
                  <View style={styles.optionsContainer}>
                    <View style={styles.checkboxRow}>
                      <Switch
                        value={rememberInfo}
                        onValueChange={setRememberInfo}
                        trackColor={{ false: '#d0d0d0', true: colors.gold }}
                        thumbColor={colors.white}
                      />
                      <Text style={styles.checkboxLabel}>Remember me</Text>
                    </View>
                    
                    <View style={styles.checkboxRow}>
                      <Switch
                        value={smsMarketing}
                        onValueChange={setSmsMarketing}
                        trackColor={{ false: '#d0d0d0', true: colors.gold }}
                        thumbColor={colors.white}
                      />
                      <Text style={styles.checkboxLabel}>Text me with news and offers</Text>
                    </View>
                  </View>
                </CollapsibleSection>
              </View>
              
              {/* Right Column - Order Summary */}
              <View style={[styles.rightColumn, isDesktop && styles.rightColumnDesktop]}>
                <View style={styles.orderSummaryContainer}>
                  <Text style={styles.orderSummaryTitle}>Order summary</Text>
                  
                  <View style={styles.cartItemsContainer}>
                    {cart.map((item) => (
                      <View key={item.id} style={styles.cartItem}>
                        <Image 
                          source={{ uri: item.image_url || 'https://via.placeholder.com/60' }}
                          style={styles.cartItemImage} 
                        />
                        <View style={styles.cartItemDetails}>
                          <Text style={styles.cartItemName}>{item.name}</Text>
                          <Text style={styles.cartItemQuantity}>Qty: {item.quantity}</Text>
                        </View>
                        <Text style={styles.cartItemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.discountContainer}>
                    <TextInput
                      style={styles.discountInput}
                      placeholder="Discount code"
                      value={coupon}
                      onChangeText={setCoupon}
                    />
                    <Pressable 
                      style={[styles.discountButton, !coupon.trim() && styles.discountButtonDisabled]}
                      onPress={handleApplyCoupon}
                      disabled={!coupon.trim() || applyingCoupon}
                    >
                      {applyingCoupon ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.discountButtonText}>Apply</Text>
                      )}
                    </Pressable>
                  </View>
                  
                  {couponStatus && (
                    <Text style={couponStatus.valid ? styles.successText : styles.errorText}>
                      {couponStatus.valid ? couponStatus.message : couponStatus.error}
                    </Text>
                  )}
                  
                  <View style={styles.orderSummarySection}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>£{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</Text>
                    </View>
                    
                    {couponStatus?.valid && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount</Text>
                        <Text style={[styles.summaryValue, { color: colors.ruby }]}>-£{getDiscountAmount().toFixed(2)}</Text>
                      </View>
                    )}
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Shipping</Text>
                      <Text style={styles.summaryValue}>
                        {shippingOption === 'express' ? '£4.99' : 'Free'}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryDivider} />
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabelTotal}>Total</Text>
                      <Text style={styles.summaryValueTotal}>£{calculateTotal().toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Payment</Text>
                  <View style={styles.trustBadgesContainer}>
                    <View style={styles.trustBadge}>
                      <FontAwesome name="lock" size={20} color={colors.gold} />
                      <Text style={styles.trustBadgeText}>Secure & Encrypted Checkout</Text>
                    </View>
                    <View style={styles.trustBadge}>
                      <FontAwesome name="shield" size={20} color={colors.gold} />
                      <Text style={styles.trustBadgeText}>Privacy Protected</Text>
                    </View>
                    <View style={styles.trustBadge}>
                      <FontAwesome name="undo" size={20} color={colors.gold} />
                      <Text style={styles.trustBadgeText}>30-Day Money-Back Guarantee</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Elements>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={confirmationOpen}
        onClose={handleContinueShopping}
        orderEmail={orderEmail}
      />
    </>
  );

}
// Stripe Payment Form Component
function StripePaymentForm({ cart, contact, address, errors, setErrors, paying, setPaying, validateForm, removeFromCart, onSuccess, coupon, discountAmount, preferredPaymentMethodId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  
  // Ensure the CardElement is properly initialized
  useEffect(() => {
    if (stripe && elements) {
      console.log('Stripe initialized successfully');
      console.log('Using preferred payment method ID:', preferredPaymentMethodId);
    }
  }, [stripe, elements, preferredPaymentMethodId]);

  const handleStripeCheckout = async () => {
    // Validate form with visual feedback
    if (!validateForm()) {
      // Provide haptic feedback for error on mobile
      triggerHaptic('error');
      return;
    }
    
    if (!stripe || !elements) {
      setErrors({ ...errors, payment: ['Stripe not initialized yet. Please try again.'] });
      return;
    }
    
    // Validate required fields directly with improved feedback
    if (!contact.name || !contact.email || !address.line1 || !address.city || !address.postcode) {
      setErrors({ 
        ...errors, 
        payment: ['Please fill in all required fields before proceeding with payment.'] 
      });
      
      // Scroll to the first empty required field
      const firstEmptyField = !contact.name ? 'field-name' : 
                             !contact.email ? 'field-email' : 
                             !address.line1 ? 'field-address1' : 
                             !address.city ? 'field-city' : 
                             'field-postcode';
      
      const errorField = document.getElementById(firstEmptyField);
      if (errorField) {
        setTimeout(() => {
          errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorField.focus();
        }, 100);
      }
      return;
    }

    try {
      setPaying(true);
      
      // Visual feedback for payment processing steps
      const setProcessingStep = (step) => {
        // This would ideally update a state variable to show progress
        console.log(`Payment processing step: ${step}`);
        // In a real implementation, you would update UI to show current step
      };
      
      setProcessingStep('initializing');
      
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Use the specified payment method ID instead of creating a new one
      setProcessingStep('processing_card');
      
      // For demonstration purposes, we'll log that we're using the preferred payment method
      console.log(`Using preferred payment method ID: ${preferredPaymentMethodId}`);
      
      // In a real implementation, you would validate the card element
      // but use the preferred payment method ID for the actual charge
      const paymentMethodError = null;
      const paymentMethod = {
        id: preferredPaymentMethodId, // Use the specified payment method ID
        billing_details: {
          name: address.name,
          email: contact.email,
          address: {
            line1: address.address1,
            line2: address.address2,
            city: address.city,
            postal_code: address.postcode,
            country: 'GB',
          },
        },
      };

      if (paymentMethodError) {
        setProcessingStep('error');
        triggerHaptic('error');
        throw new Error(paymentMethodError.message);
      }
      
      // Calculate total amount
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal - (discountAmount || 0);

      // Create payment intent
      setProcessingStep('creating_payment');
      const response = await fetch(NETLIFY_STRIPE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          amount: Math.round(total * 100), // Convert to cents
          currency: 'gbp',
          description: `Order from ${address.name}`,
          receipt_email: contact.email,
          metadata: {
            customer_name: address.name,
            address_line1: address.address1,
            address_city: address.city,
            address_postcode: address.postcode,
            coupon: coupon || 'none',
            cart_items: JSON.stringify(cart.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })))
          }
        }),
      });
      
      setProcessingStep('confirming');
      const paymentData = await response.json();

      if (paymentData.error) {
        setProcessingStep('error');
        triggerHaptic('error');
        throw new Error(paymentData.error);
      }
      
      setProcessingStep('success');

      // Handle successful payment
      if (paymentData.success) {
        // Provide haptic feedback for success on mobile
        triggerHaptic('success');
        // Store order in database
        await storeOrder({
          customer: {
            name: contact.name,
            email: contact.email,
          },
          address: {
            line1: address.line1,
            city: address.city,
            postcode: address.postcode,
            country: 'GB',
          },
          items: cart,
          total: calculateTotal(),
          paymentId: paymentData.paymentId,
          coupon: coupon || 'none'
        });

        // Track successful checkout event
        trackEvent('checkout_complete', {
          value: calculateTotal(),
          currency: 'GBP',
          items: cart.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        });

        // Clear cart
        cart.forEach(item => removeFromCart(item.id));
        
        // Show success message with animation
        setProcessingStep('completed');
        onSuccess(contact.email);
      } else {
        setProcessingStep('error');
        throw new Error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setProcessingStep('error');
      
      // Provide haptic feedback for error on mobile
      triggerHaptic('error');
      
      // Show more user-friendly error messages
      let errorMessage = error.message || 'Payment failed. Please try again.';
      
      // Map common Stripe errors to user-friendly messages
      if (errorMessage.includes('card was declined')) {
        errorMessage = 'Your card was declined. Please check your card details or try another card.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Your card has insufficient funds. Please try another payment method.';
      } else if (errorMessage.includes('expired')) {
        errorMessage = 'Your card has expired. Please update your card details or try another card.';
      } else if (errorMessage.includes('invalid')) {
        errorMessage = 'Your card information appears to be invalid. Please check your details and try again.';
      }
      
      setErrors({ ...errors, payment: [errorMessage] });
      
      // Track failed checkout event for analytics
      trackEvent('checkout_error', {
        error_type: error.type || 'unknown',
        error_message: errorMessage
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Payment</Text>
      
      <View style={styles.cardElementLuxuryContainer}>
        <Text style={styles.inputLabel}>Card Information</Text>
        <View style={styles.stripeCardLuxuryWrapper}>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#32325d',
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                  iconColor: '#fa755a',
                },
              },
            }}
            onChange={e => setCardComplete(e.complete)}
          />
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <FontAwesome name="lock" style={styles.secureIcon} />
          <Text style={styles.secureLabel}>Secure payment via Stripe</Text>
        </View>
      </View>
      
      {errors.payment && errors.payment.map((error, i) => (
        <Text key={i} style={styles.errorText}>{error}</Text>
      ))}
      
      <Pressable 
        style={[
          styles.checkoutButton, 
          (!cardComplete || paying) && styles.checkoutButtonDisabled
        ]}
        disabled={!cardComplete || paying}
        onPress={handleStripeCheckout}
      >
        {paying ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.checkoutButtonText}>Complete Order</Text>
        )}
      </Pressable>
    </View>
  );
}

// Main styles for the checkout page
const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: colors.lightGrey,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onyxBlack,
  },
  cartItemQuantity: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onyxBlack,
  },
  trustBadgesContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: colors.lightGrey,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  trustBadgeText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.onyxBlack,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    minHeight: '100vh',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityIcon: {
    marginRight: 8,
  },
  processingText: {
    marginLeft: 8,
  },
  securePaymentText: {
    fontSize: 12,
    color: colors.darkText,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLink: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 360,
    height: 120,
  },
  // checkoutContainer: {
  //   width: '100%',
  // },
  // checkoutContainerDesktop: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  // },
  leftColumn: {
    flex: 1,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  leftColumnDesktop: {
    marginRight: 32,
    maxWidth: '55%',
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: 24,
    ...shadows.light,
  },
  rightColumn: {
    flex: 1,
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: 24,
    ...shadows.medium,
  },
  rightColumnDesktop: {
    marginTop: 0,
    maxWidth: '35%',
    alignSelf: 'flex-start',
    position: 'sticky',
    top: 24,
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: 24,
    ...shadows.medium,
    formSection: {
      marginBottom: 32,
      paddingHorizontal: 16,
      backgroundColor: colors.white,
      borderRadius: 8,
      padding: 16,
      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
        }
      }),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGrey,
      paddingBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.darkText,
    },
    inputGroup: {
      marginBottom: 16,
    },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.darkText,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.darkText,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: colors.white,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        ':focus': {
          borderColor: colors.gold,
          boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.2)'
        }
      }
    }),
  },
  inputError: {
    borderColor: colors.ruby,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: colors.gold,
  },
  radioCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.darkText,
    marginLeft: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  checkoutButton: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        ':hover': {
          backgroundColor: '#d4af37',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
        },
        ':active': {
          transform: 'translateY(0)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      }
    })
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.lightGrey,
    ...Platform.select({
      web: {
        cursor: 'not-allowed'
      }
    })
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkText,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCartText: {
    fontSize: 18,
    marginBottom: 16,
    color: colors.darkText,
  },
  continueShopping: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  continueShoppingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 8,
  },
  reservationTimerContainer: {
    backgroundColor: '#f8f4e5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservationTimerText: {
    color: colors.darkText,
    fontSize: 14,
  },
  timerIcon: {
    marginRight: 8,
    fontSize: 16,
    color: colors.gold,
  },
  expressCheckoutContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      }
    }),
  },
  expressCheckoutTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    color: colors.darkText,
  },

  expressPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expressPaymentButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    padding: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    minWidth: 90,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        ':hover': {
          borderColor: colors.gold,
        }
      }
    })
  },

  paypalText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
  applePayText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 15,
  },
  googlePayText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkoutContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
    maxWidth: '100%',
  },
  checkoutContainerDesktop: {
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 32,
    backgroundColor: '#f8f9fa',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGrey,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.lightGrey,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  cartItemImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: colors.darkText,
  },
  cartItemVariant: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
  },
  cartItemQuantity: {
    fontSize: 14,
    color: colors.grey,
  },
  alternativePaymentContainer: {
    marginTop: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  payNowButton: {
    backgroundColor: colors.gold,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  payNowButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 12,
  },
  couponContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  couponRow: {
    flexDirection: 'row',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    marginRight: 8,
  },
  couponButton: {
    backgroundColor: colors.darkText,
    borderRadius: 4,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  couponMessage: {
    marginTop: 8,
    fontSize: 12,
  },
  couponValid: {
    color: 'green',
  },
  couponInvalid: {
    color: 'red',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.grey,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  secureIcon: {
    fontSize: 14,
    color: colors.grey,
    marginRight: 8,
  },
  secureLabel: {
    fontSize: 12,
    color: colors.grey,
  },
  shippingOptions: {
    marginBottom: 24,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
  },
  shippingOptionSelected: {
    borderColor: colors.gold,
    backgroundColor: '#faf6e9',
  },
  shippingOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shippingOptionRadioSelected: {
    borderColor: colors.gold,
  },
  shippingOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  shippingOptionDetails: {
    flex: 1,
  },
  shippingOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
  },
  shippingOptionPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
  },
  shippingOptionDescription: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 4,
  },
  paymentMethodsContainer: {
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  paymentMethodSelected: {
    borderColor: colors.gold,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkText,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 4,
  },
  paymentMethodIcon: {
    width: 60,
    height: 24,
    marginHorizontal: 8,
  },
  cardElementContainer: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    padding: 12,
    marginTop: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.darkText,
    flex: 1,
  },
});

// Confirmation modal styles
const confirmationStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkText,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.darkText,
    textAlign: 'center',
    marginBottom: 16,
  },
  orderInfoText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGrey,
    width: '100%',
    marginVertical: 16,
  },
  supportText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
