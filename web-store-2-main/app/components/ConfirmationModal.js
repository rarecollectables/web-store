import React from 'react';
import LuxuryModal from './LuxuryModal';
import { View, Text, Pressable } from 'react-native';

export default function ConfirmationModal({ open, onClose, autoCloseMs = 4000, onContinue }) {
  // Auto-close after a few seconds, or require user to click Continue
  return (
    <LuxuryModal visible={open} onClose={onClose} autoCloseMs={autoCloseMs} animation="fade" showClose={false}>
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
        <Text style={{ color: '#BFA054', fontSize: 26, fontWeight: 'bold', marginBottom: 8, fontFamily: 'serif', letterSpacing: 0.5 }}>
          Thank you for your order
        </Text>
        <Text style={{ fontSize: 17, color: '#1A1A1A', marginBottom: 18, textAlign: 'center', fontFamily: 'serif' }}>
          Your order has been received and is being prepared by our luxury team. You will receive a confirmation email with your order details.
        </Text>
        <Text style={{ fontSize: 15, color: '#7C7C7C', marginBottom: 16, textAlign: 'center', fontFamily: 'serif' }}>
          For any questions or bespoke requests, our concierge is at your service.
        </Text>
        <Pressable
          style={{ backgroundColor: '#BFA054', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 36, marginTop: 8 }}
          onPress={onContinue}
          accessibilityLabel="Continue Shopping"
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 }}>Continue Shopping</Text>
        </Pressable>
      </View>
    </LuxuryModal>
  );
}
