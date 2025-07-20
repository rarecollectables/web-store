import React, { useState, useEffect, useRef } from 'react';
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
    firstName: '', 
    lastName: '', 
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
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
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

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
    if (!coupon.trim()) return;
    
    setApplyingCoupon(true);
    setCouponStatus(null);
    
    try {
      // Simulate coupon validation - in a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Example coupon logic - replace with actual validation
      if (coupon.toLowerCase() === 'welcome10') {
        setCouponStatus({ 
          valid: true, 
          discount: { type: 'percentage', value: 10 },
          message: '10% discount applied!' 
        });
      } else if (coupon.toLowerCase() === 'freeship') {
        setCouponStatus({ 
          valid: true, 
          discount: { type: 'shipping', value: 'free' },
          message: 'Free shipping applied!' 
        });
      } else {
        setCouponStatus({ valid: false, error: 'Invalid coupon code' });
      }
    } catch (error) {
      setCouponStatus({ valid: false, error: 'Error validating coupon' });
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
    if (!address.firstName || address.firstName.length < 2) {
      newErrors.firstName = 'First name is required';
      missingFields.push('firstName');
    }
    
    if (!address.lastName || address.lastName.length < 2) {
      newErrors.lastName = 'Last name is required';
      missingFields.push('lastName');
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
    
    return (subtotal - discount + shipping).toFixed(2);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 80 }]}
      keyboardShouldPersistTaps="handled"
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
        <Elements stripe={stripe}>
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
                <View style={styles.expressPaymentRow}>
                  <Pressable style={styles.expressPaymentButton}>
                    <Text style={styles.paypalText}>PayPal</Text>
                  </Pressable>
                  <Pressable style={styles.expressPaymentButton}>
                    <Text style={styles.applePayText}>Apple Pay</Text>
                  </Pressable>
                  <Pressable style={styles.expressPaymentButton}>
                    <Text style={styles.googlePayText}>G Pay</Text>
                  </Pressable>
                </View>
                <View style={styles.orDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
              
              {/* Contact Information */}
              <CollapsibleSection title="Contact Information" initiallyCollapsed={false}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Contact</Text>
                  <TouchableOpacity accessible={true} accessibilityLabel="Log in to your account" accessibilityRole="button">
                    <Text style={styles.loginLink}>Log in</Text>
                  </TouchableOpacity>
                </View>
                
                <FormField
                  label="Email"
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
                <Text style={styles.sectionTitle}>Delivery</Text>
                
                <View style={styles.countrySelectContainer}>
                  <Text style={styles.countrySelectText}>{address.country}</Text>
                  <FontAwesome name="chevron-down" size={12} color={colors.grey} />
                </View>
                
                <View style={styles.formRow}>
                  <FormField
                    label="First Name"
                    placeholder="First name"
                    value={address.firstName}
                    onChangeText={(text) => handleInputChange('address', 'firstName', text)}
                    autoComplete="given-name"
                    textContentType="givenName"
                    error={errors.firstName}
                    required={true}
                    validator={validators.name}
                    icon="user"
                    id="field-firstName"
                  />
                  <FormField
                    label="Last name"
                    placeholder="Last name"
                    value={address.lastName}
                    onChangeText={(text) => handleInputChange('address', 'lastName', text)}
                    autoComplete="family-name"
                    textContentType="familyName"
                    error={errors.lastName}
                    required={true}
                    validator={validators.name}
                    style={styles.inputHalf}
                    id="field-lastName"
                  />
                </View>
                
                <AddressAutocomplete
                  value={address.postcode}
                  onSelect={handleAddressSelect}
                  error={errors.postcode}
                />
                
                <FormField
                  label="Address Line 1"
                  placeholder="Address Line 1"
                  value={address.address1}
                  onChangeText={(text) => handleInputChange('address', 'address1', text)}
                  error={errors.address1}
                  required={true}
                  id="field-address1"
                  autoComplete="street-address"
                  textContentType="streetAddressLine1"
                />
                
                <FormField
                  label="Address Line 2"
                  placeholder="Address Line 2 (optional)"
                  value={address.address2}
                  onChangeText={(text) => handleInputChange('address', 'address2', text)}
                  error={errors.address2}
                  required={false}
                  id="field-address2"
                  textContentType="streetAddressLine2"
                />
                
                <FormField
                  label="City"
                  placeholder="City"
                  value={address.city}
                  onChangeText={(text) => handleInputChange('address', 'city', text)}
                  error={errors.city}
                  required={true}
                  id="field-city"
                  autoComplete="address-level2"
                  textContentType="addressCity"
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
                />
                
                <FormField
                  label="Phone"
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
              <CollapsibleSection title="Payment" initiallyCollapsed={false}>
                <Text style={styles.sectionTitle}>Payment</Text>
                
                <View style={styles.paymentMethodsContainer}>
                  <Pressable 
                    style={[styles.paymentMethod, paymentMethod === 'credit_card' && styles.paymentMethodSelected]}
                    onPress={() => setPaymentMethod('credit_card')}
                  >
                    <FontAwesome name="credit-card" size={16} color={paymentMethod === 'credit_card' ? colors.gold : colors.grey} />
                    <Text style={styles.paymentMethodText}>Credit Card</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.paymentMethod, paymentMethod === 'paypal' && styles.paymentMethodSelected]}
                    onPress={() => setPaymentMethod('paypal')}
                  >
                    <FontAwesome name="paypal" size={16} color={paymentMethod === 'paypal' ? colors.gold : colors.grey} />
                    <Text style={styles.paymentMethodText}>PayPal</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.paymentMethod, paymentMethod === 'klarna' && styles.paymentMethodSelected]}
                    onPress={() => setPaymentMethod('klarna')}
                  >
                    <Text style={[styles.paymentMethodText, {fontWeight: paymentMethod === 'klarna' ? 'bold' : 'normal'}]}>Klarna</Text>
                  </Pressable>
                </View>
                
                {paymentMethod === 'credit_card' && (
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
                  />
                )}
                
                {paymentMethod === 'paypal' && (
                  <FadeIn>
                    <View style={styles.alternativePaymentContainer}>
                      <Text style={styles.alternativePaymentText}>You will be redirected to PayPal to complete your purchase.</Text>
                      <AnimatedButton 
                        style={styles.checkoutButton}
                        accessibilityLabel="Continue to PayPal"
                      >
                        Continue to PayPal
                      </AnimatedButton>
                    </View>
                  </FadeIn>
                )}
                
                {paymentMethod === 'klarna' && (
                  <FadeIn>
                    <View style={styles.alternativePaymentContainer}>
                      <Text style={styles.alternativePaymentText}>Pay in 3 interest-free installments with Klarna.</Text>
                      <AnimatedButton 
                        style={styles.checkoutButton}
                        accessibilityLabel="Continue to Klarna"
                      >
                        Continue to Klarna
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
                
                {/* Cart Items */}
                <View style={styles.cartItemsContainer}>
                  {cart.map((item, index) => (
                    <View key={item.id} style={[styles.cartItemRow, index < cart.length - 1 && styles.cartItemBorder]}>
                      <View style={styles.cartItemImageContainer}>
                        <Image 
                          source={{ uri: item.product?.image_url || 'https://via.placeholder.com/60' }}
                          style={styles.cartItemImage}
                          resizeMode="cover"
                        />
                        <View style={styles.cartItemQuantityBadge}>
                          <Text style={styles.cartItemQuantityText}>{item.quantity}</Text>
                        </View>
                      </View>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.product?.name}</Text>
                        <Text style={styles.cartItemVariant}>
                          {item.variant ? item.variant.name : ''}
                        </Text>
                      </View>
                      <Text style={styles.cartItemPrice}>£{((item.variant ? item.variant.price : item.product?.price) * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Discount Code */}
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
                
                {/* Order Calculations */}
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
                    <Text style={styles.summaryValueTotal}>£{calculateTotal()}</Text>
                  </View>
                </View>
              </View>
              
              {/* Payment Method */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Payment</Text>
                <Text style={styles.securePaymentNote}>
                  All transactions are secure and encrypted
                </Text>
                <View style={styles.securityContainer}>
                  <View style={styles.securityItem}>
                    <FontAwesome name="lock" size={16} color={colors.grey} />
                    <Text style={styles.securityText}>Secure checkout</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <FontAwesome name="shield" size={16} color={colors.grey} />
                    <Text style={styles.securityText}>Privacy protected</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <FontAwesome name="refresh" size={16} color={colors.grey} />
                    <Text style={styles.securityText}>30-day returns</Text>
                  </View>
                </View>
                
                <Pressable 
                  style={[styles.paymentMethod, paymentMethod === 'credit_card' && styles.paymentMethodSelected]}
                  onPress={() => setPaymentMethod('credit_card')}
                >
                  <View style={[styles.radioCircle, paymentMethod === 'credit_card' && styles.radioCircleSelected]}>
                    {paymentMethod === 'credit_card' && <View style={styles.radioCircleDot} />}
                  </View>
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodLabel}>Credit card</Text>
                  </View>
                  <View style={styles.cardIcons}>
                    <Text style={styles.cardIcon}>VISA</Text>
                    <Text style={styles.cardIcon}>MC</Text>
                    <Text style={styles.cardIcon}>AMEX</Text>
                  </View>
                </Pressable>
                
                {paymentMethod === 'credit_card' && (
                  <View style={styles.cardFormContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Card number"
                      keyboardType="number-pad"
                    />
                    <View style={styles.formRow}>
                      <TextInput
                        style={[styles.textInput, styles.inputHalf]}
                        placeholder="Expiration (MM/YY)"
                      />
                      <TextInput
                        style={[styles.textInput, styles.inputHalf]}
                        placeholder="Security code"
                        keyboardType="number-pad"
                      />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Name on card"
                    />
                    
                    <View style={styles.checkboxRow}>
                      <Switch
                        value={true}
                        trackColor={{ false: '#d0d0d0', true: colors.gold }}
                        thumbColor={colors.white}
                      />
                      <Text style={styles.checkboxLabel}>Save my information for faster checkout</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.payButton, 
                        paying && styles.payButtonDisabled
                      ]} 
                      onPress={handleCheckout}
                      disabled={paying}
                      accessible={true}
                      accessibilityLabel={paying ? "Processing payment" : "Pay now"}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: paying, busy: paying }}
                    >
                      <View style={styles.payButtonContent}>
                        {paying ? (
                          <>
                            <ActivityIndicator color="#fff" />
                            <Text style={[styles.payButtonText, styles.processingText]}>Processing...</Text>
                          </>
                        ) : (
                          <>
                            <FontAwesome name="lock" size={16} color="#fff" style={styles.securityIcon} />
                            <Text style={styles.payButtonText}>Pay now</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.securePaymentText}>
                      <FontAwesome name="shield" size={12} color={colors.securityGreen} /> Secure payment - Your data is protected
                    </Text>
                    
                    <Text style={styles.termsText}>
                      By placing your order, you agree to our Terms of Service and Privacy Policy
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </Elements>
      )}
      
      {/* Order Confirmation Modal */}
      <ConfirmationModal
        open={confirmationOpen}
        onClose={handleContinueShopping}
        onContinue={handleContinueShopping}
        autoCloseMs={5000}
      />
    </ScrollView>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({ cart, contact, address, errors, setErrors, paying, setPaying, validateForm, removeFromCart, onSuccess, coupon, discountAmount }) {
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

      // Create payment method
      setProcessingStep('processing_card');
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${address.firstName} ${address.lastName}`,
          email: contact.email,
          address: {
            line1: address.address1,
            line2: address.address2,
            city: address.city,
            postal_code: address.postcode,
            country: 'GB',
          },
        },
      });

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
          description: `Order from ${address.firstName} ${address.lastName}`,
          receipt_email: contact.email,
          metadata: {
            customer_name: `${address.firstName} ${address.lastName}`,
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
  cardFormContainer: {
    marginTop: 12,
    marginBottom: 16,
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
