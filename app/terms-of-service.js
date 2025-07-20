import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { colors, fontFamily, spacing } from '../theme';

import { useRouter } from 'expo-router';
export default function TermsOfService() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Terms of Service Page">
      <Pressable
        onPress={() => {
          if (router.canGoBack && router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/shop');
          }
        }}
        style={styles.backButton}
        accessibilityLabel="Go Back"
      >
        <View style={styles.backButtonContent}>
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </View>
      </Pressable>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.text}>
        By using Rare Collectables, you agree to the following terms and conditions. Please read them carefully before making a purchase or using our website.
      </Text>
      <Text style={styles.heading}>1. Use of Website</Text>
      <Text style={styles.text}>
        You agree to use this website only for lawful purposes and in accordance with these Terms. You must not misuse the site or its content.
      </Text>
      <Text style={styles.heading}>2. Orders and Payment</Text>
      <Text style={styles.text}>
        All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Payment must be made in full before items are shipped.
      </Text>
      <Text style={styles.heading}>3. Intellectual Property</Text>
      <Text style={styles.text}>
        All content on this site, including images, text, and logos, is the property of Rare Collectables or its licensors and is protected by copyright laws.
      </Text>
      <Text style={styles.heading}>4. Limitation of Liability</Text>
      <Text style={styles.text}>
        Rare Collectables is not liable for any indirect, incidental, or consequential damages arising from the use of our site or products.
      </Text>
      <Text style={styles.heading}>5. User Accounts</Text>
      <Text style={styles.text}>
        If you create an account, you are responsible for maintaining its confidentiality and for all activities under your account.
      </Text>
      <Text style={styles.heading}>6. Changes to Terms</Text>
      <Text style={styles.text}>
        We may update these Terms at any time. Continued use of the site after changes constitutes acceptance of the new Terms.
      </Text>
      <Text style={styles.heading}>7. Governing Law</Text>
      <Text style={styles.text}>
        These Terms are governed by the laws of your jurisdiction.
      </Text>
      <Text style={styles.heading}>8. Contact Us</Text>
      <Text style={styles.text}>
        For questions about these Terms, please contact us via the Contact page.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    marginLeft: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(191, 160, 84, 0.08)',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    fontSize: 18,
    color: colors.gold,
    marginRight: 6,
    fontWeight: 'bold',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.gold,
    fontFamily: fontFamily.sans,
    fontWeight: '600',
  },
  container: {
    padding: spacing.lg,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.sans,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 20,
    fontFamily: fontFamily.sans,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 16,
    fontFamily: fontFamily.sans,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
});
