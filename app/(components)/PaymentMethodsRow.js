
import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

// Use FontAwesome icons which are known to work well with React Native

// Define payment methods with FontAwesome icons
const paymentMethods = [
  // Primary payment methods in specified order
  { 
    name: 'Visa', 
    icon: props => <FontAwesome name="cc-visa" {...props} color="#1A1F71" />
  },
  { 
    name: 'American Express', 
    icon: props => <FontAwesome name="cc-amex" {...props} color="#2E77BC" />
  },
  { 
    name: 'Google Pay', 
    icon: props => <FontAwesome5 name="google-pay" {...props} color="#5F6368" />
  },
  { 
    name: 'Apple Pay', 
    icon: props => <FontAwesome5 name="apple-pay" {...props} color="#000000" />
  },
  { 
    name: 'Mastercard', 
    icon: props => <FontAwesome name="cc-mastercard" {...props} color="#EB001B" />
  },
  
  // Other payment methods
  { 
    name: 'PayPal', 
    icon: props => <FontAwesome name="cc-paypal" {...props} color="#003087" />
  },
  { 
    name: 'Klarna', 
    icon: props => <FontAwesome5 name="credit-card" {...props} color="#FFB3C7" />
  },
  { 
    name: 'Diners Club', 
    icon: props => <FontAwesome name="cc-diners-club" {...props} color="#0079BE" />
  },
  { 
    name: 'Discover', 
    icon: props => <FontAwesome name="cc-discover" {...props} color="#FF6000" />
  },
  { 
    name: 'JCB', 
    icon: props => <FontAwesome name="cc-jcb" {...props} color="#0B4EA2" />
  },
];

export default function PaymentMethodsRow({ style = {}, iconSize = 38, pop = false }) {
  // Calculate dimensions based on iconSize
  const cardWidth = iconSize * 1.6;
  const cardHeight = iconSize * 1.0;
  
  // Determine if we're on web platform
  const isWeb = Platform.OS === 'web';
  
  return (
    <View style={[styles.row, style]}>
      {paymentMethods.map(({ name, icon: Icon }) => (
        <View
          key={name}
          style={[
            styles.iconCard,
            {
              width: cardWidth,
              height: cardHeight,
              borderColor: pop ? '#e0e0e0' : '#f0f0f0',
              shadowOpacity: pop ? 0.15 : 0.08,
            },
          ]}
        >
          <View style={{ width: iconSize, height: iconSize, justifyContent: 'center', alignItems: 'center' }}>
            <Icon size={iconSize * 0.8} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  iconCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    marginVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

