import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../context/store';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../theme';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});
const addressSchema = z.object({
  line1: z.string().min(3, 'Address required'),
  city: z.string().min(2, 'City required'),
  zip: z.string().min(3, 'ZIP required'),
});
const paymentSchema = z.object({
  cardNumber: z.string().min(12, 'Card number required'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'MM/YY'),
  cvc: z.string().min(3, 'CVC required'),
});

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, removeFromCart } = useStore();
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState({ name: '', email: '' });
  const [address, setAddress] = useState({ line1: '', city: '', zip: '' });
  const [payment, setPayment] = useState({ cardNumber: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * (item.quantity || 1), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  function validateAndNext() {
    if (step === 0) {
      const result1 = contactSchema.safeParse(contact);
      const result2 = addressSchema.safeParse(address);
      if (!result1.success || !result2.success) {
        setErrors({
          ...(!result1.success && result1.error.flatten().fieldErrors),
          ...(!result2.success && result2.error.flatten().fieldErrors),
        });
        return;
      }
    }
    if (step === 1) {
      const result = paymentSchema.safeParse(payment);
      if (!result.success) {
        setErrors(result.error.flatten().fieldErrors);
        return;
      }
    }
    setErrors({});
    setStep(s => Math.min(s + 1, 2));
  }

  async function handleConfirm() {
    setLoading(true);
    setTimeout(() => {
      cart.forEach(item => removeFromCart(item.id));
      setLoading(false);
      router.replace('/confirmation');
    }, 1200);
  }

  const renderContactAndAddress = () => (
    <View style={styles.step}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={contact.name}
        onChangeText={t => setContact({ ...contact, name: t })}
        placeholder="Full Name"
        autoCapitalize="words"
      />
      {!!errors.name && <Text style={styles.error}>{errors.name}</Text>}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={contact.email}
        onChangeText={t => setContact({ ...contact, email: t })}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address.line1}
        onChangeText={t => setAddress({ ...address, line1: t })}
        placeholder="Street address"
      />
      {!!errors.line1 && <Text style={styles.error}>{errors.line1}</Text>}
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={address.city}
        onChangeText={t => setAddress({ ...address, city: t })}
        placeholder="City"
      />
      {!!errors.city && <Text style={styles.error}>{errors.city}</Text>}
      <Text style={styles.label}>ZIP Code</Text>
      <TextInput
        style={styles.input}
        value={address.zip}
        onChangeText={t => setAddress({ ...address, zip: t })}
        placeholder="ZIP / Postal Code"
        keyboardType="numeric"
      />
      {!!errors.zip && <Text style={styles.error}>{errors.zip}</Text>}
    </View>
  );

  const renderPayment = () => (
    <View style={styles.step}>
      <Text style={styles.label}>Card Number</Text>
      <TextInput
        style={styles.input}
        value={payment.cardNumber}
        onChangeText={t => setPayment({ ...payment, cardNumber: t })}
        placeholder="1234 5678 9012 3456"
        keyboardType="numeric"
      />
      {!!errors.cardNumber && <Text style={styles.error}>{errors.cardNumber}</Text>}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Expiry</Text>
          <TextInput
            style={styles.input}
            value={payment.expiry}
            onChangeText={t => setPayment({ ...payment, expiry: t })}
            placeholder="MM/YY"
          />
          {!!errors.expiry && <Text style={styles.error}>{errors.expiry}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>CVC</Text>
          <TextInput
            style={styles.input}
            value={payment.cvc}
            onChangeText={t => setPayment({ ...payment, cvc: t })}
            placeholder="CVC"
            keyboardType="numeric"
          />
          {!!errors.cvc && <Text style={styles.error}>{errors.cvc}</Text>}
        </View>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.step}>
      <Text style={styles.reviewTitle}>Review Your Order</Text>
      {cart.map(item => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Image source={{ uri: item.image }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewText}>{item.title}</Text>
            <Text style={styles.reviewText}>Qty: {item.quantity || 1}</Text>
            <Text style={styles.reviewText}>₤{((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * (item.quantity || 1)).toFixed(2)}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.reviewText}>Subtotal: ₤{subtotal.toFixed(2)}</Text>
      <Text style={styles.reviewText}>Tax (10%): ₤{tax.toFixed(2)}</Text>
      <Text style={styles.reviewText}>Total: ₤{total.toFixed(2)}</Text>
      <Text style={styles.reviewText}>Name: {contact.name}</Text>
      <Text style={styles.reviewText}>Email: {contact.email}</Text>
      <Text style={styles.reviewText}>
        Address: {address.line1}, {address.city}, {address.zip}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>      
      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && renderContactAndAddress()}
        {step === 1 && renderPayment()}
        {step === 2 && renderReview()}
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 && (
          <Pressable style={[styles.navButton, styles.backButton]} onPress={() => setStep(s => Math.max(s - 1, 0))}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.navButton, styles.nextButton, loading && { opacity: 0.6 }]}
          onPress={step < 2 ? validateAndNext : handleConfirm}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.nextText}>{step < 2 ? 'Next' : 'Confirm'}</Text>}
        </Pressable>
      </View>
      <Pressable
        style={[styles.close, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 20 },
  step: { marginBottom: 20 },
  label: { color: colors.gold, fontWeight: '700', fontFamily, fontSize: 16, marginBottom: 4 },
  input: { backgroundColor: colors.white, borderRadius: 14, padding: 12, marginBottom: 10, fontFamily, fontSize: 16, borderWidth: 1, borderColor: colors.softGoldBorder },
  error: { color: colors.ruby, fontSize: 13, marginBottom: 6, fontFamily },
  row: { flexDirection: 'row', gap: 8 },
  reviewTitle: { fontSize: 22, color: colors.gold, fontWeight: '900', fontFamily, marginBottom: 14 },
  reviewText: { fontSize: 15, color: colors.black, fontFamily, marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingTop: 0 },
  navButton: { flex: 1, backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginLeft: spacing.xs, marginRight: spacing.xs, ...shadows.card },
  nextButton: { backgroundColor: colors.gold },
  backButton: { backgroundColor: colors.platinum },
  nextText: { color: colors.white, fontWeight: '700', fontSize: 18, fontFamily },
  backText: { color: colors.white, fontWeight: '700', fontSize: 18, fontFamily },
  close: { position: 'absolute', right: spacing.md, zIndex: 10, backgroundColor: colors.ivory, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, ...shadows.card },
  closeText: { fontSize: 24, color: colors.platinum },
});
