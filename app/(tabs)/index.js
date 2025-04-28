import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ImageBackground, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme/index.js';

// Category definitions for homepage
const CATEGORIES = [
  { id: 'necklaces', title: 'Necklaces' },
  { id: 'earrings', title: 'Earrings' },
  { id: 'bracelets', title: 'Bracelets' },
  { id: 'rings', title: 'Rings' }
];

// Local category image assets mapping
const CATEGORY_IMAGES = {
  necklaces: [
    require('../../assets/images/products/1-2-Necklace.avif'),
    require('../../assets/images/products/1-5-Necklace.avif'),
    require('../../assets/images/products/3-1-Necklace.avif'),
    require('../../assets/images/products/3-5-Necklace.avif')
  ],
  bracelets: [
    require('../../assets/images/products/6-1.avif'),
    require('../../assets/images/products/6-4.avif'),
    require('../../assets/images/products/3-4.avif'),
    require('../../assets/images/products/3-1.avif')
  ],
  rings: [
    require('../../assets/images/products/7-1.avif'),
    require('../../assets/images/products/7-5.avif'),
    require('../../assets/images/products/4-1-ring.avif'),
    require('../../assets/images/products/4-2-ring.avif')
  ],
  earrings: [
    require('../../assets/images/products/8-1.avif'),
    require('../../assets/images/products/8-5.avif'),
    require('../../assets/images/products/1-1-earrings.avif'),
    require('../../assets/images/products/1-5-earrings.avif')
  ]
};

// Animated Category Card
function CategoryCard({ id, title, cardSize, marginRight, onPress }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = CATEGORY_IMAGES[id] || [];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [images.length]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${title} category`}
      style={({ pressed }) => [
        styles.categoryCard,
        { width: cardSize, height: cardSize, marginRight, opacity: pressed ? 0.85 : 1 },
        { borderColor: colors.softGoldBorder, backgroundColor: colors.white },
        { shadowColor: colors.gold, shadowOpacity: 0.18 },
      ]}
    >
      <ImageBackground
        source={images[currentIndex]}
        style={styles.categoryImage}
        imageStyle={{ borderRadius: borderRadius.md }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        <View style={styles.categoryOverlay} />
        <Text style={styles.categoryTitle}>{title}</Text>
      </ImageBackground>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');

  // Responsive columns for category grid
  const columns = width > 900 ? 4 : width > 600 ? 3 : 2;
  const paddingHorizontal = spacing.md;
  const cardSpacing = spacing.md;
  const totalSpacing = paddingHorizontal * 2 + cardSpacing * (columns - 1);
  const cardSize = (width - totalSpacing) / columns;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? colors.onyxBlack : colors.ivory }]}>  
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        accessibilityRole="scrollbar"
      >
        {/* Hero Section */}
        <ImageBackground
          source={require('../../assets/images/Rare Collectables hero.png')}
          style={[styles.heroContainer, { width }]}
          imageStyle={{ opacity: 0.8 }}
        >
          <View style={styles.overlay} />
          <Text style={styles.heroText}>Rare Collectables</Text>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push('/shop')}
            accessibilityRole="button"
            accessibilityLabel="Shop Now"
          >
            <Text style={styles.ctaText}>Shop Now</Text>
          </Pressable>
        </ImageBackground>
        {/* Category cards */}
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat, index) => {
            const marginRight = (index + 1) % columns === 0 ? 0 : cardSpacing;
            return (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                title={cat.title}
                cardSize={cardSize}
                marginRight={marginRight}
                onPress={() => router.push({ pathname: '/shop', params: { category: cat.id } })}
              />
            );
          })}
        </View>
        {/* Newsletter & Social CTA */}
        <View style={styles.newsletterSection}>
          <Text style={styles.newsletterTitle}>Join our newsletter</Text>
          <View style={styles.newsletterForm}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="Your email address"
              placeholderTextColor={colors.platinumGrey}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="Email address"
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [styles.newsletterButton, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => {
                if (email.includes('@')) {
                  Alert.alert('Subscribed', `Thanks for subscribing, ${email}!`);
                  setEmail('');
                } else {
                  Alert.alert('Invalid email', 'Please enter a valid email address.');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Subscribe to newsletter"
            >
              <Text style={styles.newsletterButtonText}>Subscribe</Text>
            </Pressable>
          </View>
          <View style={styles.socialRow}>
            <Pressable onPress={() => Linking.openURL('https://facebook.com/rarecollectables')} accessibilityRole="link" accessibilityLabel="Facebook">
              <FontAwesome name="facebook" size={32} color="#4267B2" />
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://instagram.com/rarecollectables')} style={styles.socialIcon} accessibilityRole="link" accessibilityLabel="Instagram">
              <FontAwesome name="instagram" size={32} color="#C13584" />
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://twitter.com/rarecollect')} style={styles.socialIcon} accessibilityRole="link" accessibilityLabel="Twitter">
              <FontAwesome name="twitter" size={32} color="#1DA1F2" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {/* Floating chat button */}
      <View style={[styles.fab, { bottom: insets.bottom + 20 }]}> 
        <Pressable
          onPress={() => router.push('/chat')}
          style={styles.chatButton}
          accessibilityRole="button"
          accessibilityLabel="Chat with support"
        >
          <Text style={styles.chatIcon}>💬</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.ivory,
  },
  heroContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.onyxBlack,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,26,26,0.30)',
  },
  heroText: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.gold,
    marginBottom: spacing.md,
    fontFamily: fontFamily.serif,
    textShadowColor: 'rgba(26,26,26,0.22)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1.2,
  },
  cta: {
    backgroundColor: colors.gold,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  ctaText: {
    color: colors.onyxBlack,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  categoryCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.softGoldBorder,
    backgroundColor: colors.white,
    ...shadows.card,
    elevation: 3,
  },
  categoryImage: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(191, 160, 84, 0.07)',
  },
  categoryTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.onyxBlack,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    fontFamily: fontFamily.sans,
    textAlign: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  newsletterSection: {
    width: '100%',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    padding: spacing.md + 2,
    alignItems: 'center',
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm + 4,
    color: colors.gold,
    fontFamily: fontFamily.serif,
  },
  newsletterForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: colors.ivory,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.onyxBlack,
  },
  newsletterButton: {
    backgroundColor: colors.emerald,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  newsletterButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
  },
  socialRow: {
    flexDirection: 'row',
    marginTop: spacing.md + 2,
  },
  socialIcon: {
    marginLeft: spacing.md + 2,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
  },
  chatButton: {
    backgroundColor: colors.amethyst,
    padding: spacing.lg,
    borderRadius: 32,
  },
  chatIcon: {
    fontSize: 28,
    color: colors.white,
  },
});
