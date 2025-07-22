import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontFamily, spacing } from '../theme';

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Privacy Policy Page">
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
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>
        At Rare Collectables, your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases.
      </Text>
      <Text style={styles.heading}>1. Information We Collect</Text>
      <Text style={styles.text}>
        We may collect personal information such as your name, email address, shipping address, payment information, and order details when you make a purchase or contact us. We also collect non-personal information via cookies and analytics tools to improve our services.
      </Text>
      <Text style={styles.heading}>2. How We Use Your Information</Text>
      <Text style={styles.text}>
        We use your information to process orders, communicate with you, provide customer support, improve our website, and comply with legal obligations. We do not sell or rent your personal data to third parties.
      </Text>
      <Text style={styles.heading}>3. Data Security</Text>
      <Text style={styles.text}>
        We implement security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.
      </Text>
      <Text style={styles.heading}>4. Cookies and Analytics</Text>
      <Text style={styles.text}>
        We use cookies and analytics tools to enhance your experience and analyze site usage. You can manage cookie preferences in your browser settings.
      </Text>
      <Text style={styles.heading}>5. Your Rights</Text>
      <Text style={styles.text}>
        You may request access to, correction of, or deletion of your personal information by contacting us. For EU/UK users, you have additional rights under GDPR.
      </Text>
      <Text style={styles.heading}>6. Changes to This Policy</Text>
      <Text style={styles.text}>
        We may update this policy from time to time. Changes will be posted on this page with an updated effective date.
      </Text>
      <Text style={styles.heading}>7. Contact Us</Text>
      <Text style={styles.text}>
        If you have questions about this Privacy Policy, please contact us via the Contact page.
      </Text>
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
  footer: {
    flexDirection: 'row',
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
