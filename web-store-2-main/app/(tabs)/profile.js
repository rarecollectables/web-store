import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert, Modal, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trackEvent } from '../../lib/trackEvent';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';
import OrdersModal from '../components/orders-modal';
import AboutModal from '../components/about-modal';

const SECTIONS = [
  {
    title: 'My Orders',
    icon: 'list-alt',
    description: 'View your order history on this device.',
    action: (openOrdersModal) => openOrdersModal(),
  },
  {
    title: 'My Wishlist',
    icon: 'heart',
    description: 'See your saved collectables.',
    action: (router) => router.push('/(tabs)/wishlist'),
  },
  {
    title: 'Notifications & Preferences',
    icon: 'bell',
    description: 'Manage your notification and app preferences.',
    action: () => Alert.alert('Coming Soon', 'Notification and preference settings will be available in a future update.'),
  },
  {
    title: 'Exclusive Offers',
    icon: 'diamond',
    description: 'Discover exclusive deals and new arrivals.',
    action: () => Alert.alert('Exclusive Offers', 'Check back soon for exclusive deals and new arrivals.'),
  },
  {
    title: 'Support & Contact',
    icon: 'envelope',
    description: 'Get help or contact our concierge.',
    action: () => Linking.openURL('mailto:carecentre@rarecollectables.co.uk'),
  },
  {
    title: 'About Rare Collectables',
    icon: 'info-circle',
    description: 'Learn about our story and values.',
    action: (openAboutModal) => openAboutModal(),
  },
  {
    title: 'App Settings',
    icon: 'cog',
    description: 'Manage app settings and preferences.',
    action: () => Alert.alert('App Settings', 'App settings will be available in a future update.'),
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [ordersVisible, setOrdersVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [orderEmail, setOrderEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  function openOrdersModal() {
    setShowEmailPrompt(true);
  }

  function closeOrdersModal() {
    setOrdersVisible(false);
    setOrderEmail('');
    setShowEmailPrompt(false);
  }

  function handleEmailSubmit() {
    setOrderEmail(emailInput.trim());
    setOrdersVisible(true);
    setShowEmailPrompt(false);
  }

  function openAboutModal() {
    setAboutVisible(true);
  }

  function closeAboutModal() {
    setAboutVisible(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => {
          try {
            if (lastVisitedRoute) {
              router.push(lastVisitedRoute);
            } else if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)/shop');
            }
          } catch {
            router.push('/(tabs)/shop');
          }
        }}
        style={({ pressed }) => [
          { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginLeft: 10, marginBottom: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: pressed ? colors.platinum : 'transparent' }
        ]}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 20, color: colors.gold, marginRight: 6 }}>←</Text>
        <Text style={{ color: colors.gold, fontSize: 16, fontWeight: '600' }}>Back</Text>
      </Pressable>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.header}>My Profile</Text>
        {/* Create Account Link */}
        <Pressable
          style={({ pressed }) => [{ marginVertical: 12, alignSelf: 'flex-start', opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Create Account"
          onPress={async () => {
            try {
              // Track the click event
              if (typeof trackEvent === 'function') {
                await trackEvent({ eventType: 'create_account_click', metadata: { location: 'profile_page' } });
              }
              // Navigate to contact form page
              router.push('/contact');
            } catch (err) {
              router.push('/signup');
            }
          }}
        >
          <Text style={{ color: colors.gold, fontSize: 16, textDecorationLine: 'underline', fontWeight: '600' }}>
            Create Account
          </Text>
        </Pressable>
        {SECTIONS.map((section) => (
          <Pressable
            key={section.title}
            style={styles.section}
            onPress={() => {
              if (section.title === 'My Orders') {
                section.action(openOrdersModal);
              } else if (section.title === 'About Rare Collectables') {
                section.action(openAboutModal);
              } else {
                section.action(router);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={section.title}
          >
            <View style={styles.iconWrap}>
              <FontAwesome name={section.icon} size={24} color="#BFA054" />
            </View>
            <View style={styles.sectionText}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDesc}>{section.description}</Text>
            </View>
          </Pressable>
        ))}
        <View style={styles.brandFooter}>
          <Text style={styles.brandText}>Rare Collectables • Est. 2024</Text>
        </View>
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
      {/* Email prompt modal */}
      <Modal visible={showEmailPrompt} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 320, backgroundColor: '#FFF', borderRadius: 16, padding: 18 }}>
            <Text style={{ fontWeight: '700', color: '#BFA054', fontSize: 17, marginBottom: 12, textAlign: 'center' }}>Enter your email to view your order history</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5DCC3', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 15 }}
              placeholder="Email Address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailInput}
              onChangeText={setEmailInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Pressable onPress={closeOrdersModal} style={{ marginRight: 12 }}>
                <Text style={{ color: '#7C7C7C', fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleEmailSubmit} style={{ backgroundColor: '#BFA054', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>View Orders</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Orders modal with email */}
      <Modal visible={ordersVisible} transparent={true} onRequestClose={closeOrdersModal}>
        <OrdersModal visible={ordersVisible} onClose={closeOrdersModal} email={orderEmail} />
      </Modal>
      <Modal visible={aboutVisible} transparent={true} onRequestClose={closeAboutModal}>
        <AboutModal visible={aboutVisible} onClose={closeAboutModal} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row', flexWrap: 'wrap',
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: '900', color: '#BFA054', marginBottom: 18, textAlign: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 18, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E5DCC3' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF7F0', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: '#E5DCC3' },
  sectionText: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 2, fontFamily: fontFamily },
  sectionDesc: { fontSize: 14, color: '#7C7C7C', marginBottom: 0, fontFamily: fontFamily },
  brandFooter: { marginTop: 32, alignItems: 'center' },
  brandText: { color: '#BFA054', fontWeight: '700', fontSize: 14, fontFamily: fontFamily },
});
