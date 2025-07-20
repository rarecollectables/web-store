import React, { useState } from 'react';
import { View } from 'react-native';
import LuxuryModal from './LuxuryModal';
import StripePaymentForm from '../checkout';

export default function CheckoutModal({ open, onClose, cart, contact, address, onSuccess }) {
  // Pass all necessary props to StripePaymentForm
  return (
    <LuxuryModal visible={open} onClose={onClose} animation="slide" showClose>
      <View style={{ width: '100%' }}>
        <StripePaymentForm
          cart={cart}
          contact={contact}
          address={address}
          onSuccess={onSuccess}
        />
      </View>
    </LuxuryModal>
  );
}
