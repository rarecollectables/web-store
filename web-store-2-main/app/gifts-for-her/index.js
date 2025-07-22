import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';
import ProductsList from '../(components)/products/ProductsList';
import { trackEvent } from '../../lib/trackEvent';

export default function GiftsForHerPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Track page view
    trackEvent({ 
      eventType: 'page_view', 
      pageName: 'gifts_for_her',
      pageType: 'category_landing'
    });
    
    // Log search event for SEO tracking
    trackEvent({ 
      eventType: 'search', 
      searchQuery: 'gift for her',
      searchSource: 'category_landing',
      deviceType: 'all'
    });
    
    // Send search log to the API
    fetch('/api/logSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'gift for her',
        source: 'category_landing'
      }),
    }).catch(err => console.error('Error logging search:', err));
    
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Perfect Gifts for Her</Text>
        <Text style={styles.heroSubtitle}>
          Discover exquisite jewelry pieces that will make her feel special on any occasion
        </Text>
      </View>

      {/* Gift Occasions Section */}
      <View style={styles.occasionsSection}>
        <Text style={styles.sectionTitle}>Shop by Occasion</Text>
        <View style={styles.occasionsGrid}>
          <Pressable 
            style={styles.occasionCard}
            onPress={() => router.push('/(tabs)/shop?category=GiftsForHer&subcategory=Birthday')}
          >
            <View style={styles.occasionIconContainer}>
              <FontAwesome name="birthday-cake" size={48} color={colors.gold} />
            </View>
            <Text style={styles.occasionTitle}>Birthday</Text>
          </Pressable>
          
          <Pressable 
            style={styles.occasionCard}
            onPress={() => router.push('/(tabs)/shop?category=GiftsForHer&subcategory=Anniversary')}
          >
            <View style={styles.occasionIconContainer}>
              <FontAwesome name="heart" size={48} color={colors.gold} />
            </View>
            <Text style={styles.occasionTitle}>Anniversary</Text>
          </Pressable>
          
          <Pressable 
            style={styles.occasionCard}
            onPress={() => router.push('/(tabs)/shop?category=GiftsForHer&subcategory=Romantic')}
          >
            <View style={styles.occasionIconContainer}>
              <FontAwesome name="diamond" size={48} color={colors.gold} />
            </View>
            <Text style={styles.occasionTitle}>Romantic</Text>
          </Pressable>
          
          <Pressable 
            style={styles.occasionCard}
            onPress={() => router.push('/(tabs)/shop?category=GiftsForHer&subcategory=SpecialOccasion')}
          >
            <View style={styles.occasionIconContainer}>
              <FontAwesome name="gift" size={48} color={colors.gold} />
            </View>
            <Text style={styles.occasionTitle}>Special Occasion</Text>
          </Pressable>
        </View>
      </View>

      {/* SEO Rich Text Section */}
      <View style={styles.seoSection}>
        <Text style={styles.seoTitle}>Finding the Perfect Gift for Her</Text>
        <Text style={styles.seoText}>
          Choosing the perfect gift for her doesn't have to be challenging. Our curated collection of jewelry gifts for women includes stunning pieces for every occasion and style preference. Whether you're looking for a birthday gift, anniversary present, or a romantic gesture, our selection of necklaces, bracelets, earrings, and rings makes gift-giving effortless.
        </Text>
        <Text style={styles.seoText}>
          Each piece in our gift collection is carefully selected to delight and impress. From elegant sterling silver designs to luxurious gold pieces adorned with gemstones, you'll find the ideal gift to make her feel special and cherished.
        </Text>
      </View>

      {/* Featured Gift Products */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Featured Gifts for Her</Text>
        <ProductsList 
          initialCategory="Gifts for Her" 
          initialSubcategory=""
        />
      </View>

      {/* Gift Guide Section */}
      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>Gift Buying Guide</Text>
        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>How to Choose the Perfect Jewelry Gift</Text>
          <Text style={styles.guideText}>
            1. Consider her style: Does she prefer classic, minimalist, or statement pieces?
          </Text>
          <Text style={styles.guideText}>
            2. Think about the occasion: Different events call for different types of jewelry.
          </Text>
          <Text style={styles.guideText}>
            3. Metal preference: Notice if she wears more gold, silver, or rose gold jewelry.
          </Text>
          <Text style={styles.guideText}>
            4. Personal meaning: Consider pieces that have symbolic significance or represent your relationship.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  heroBanner: {
    padding: spacing.xl,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily,
    fontWeight: 'bold',
    fontSize: 32,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontFamily,
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontFamily,
    fontWeight: '600',
    fontSize: 24,
    color: colors.onyxBlack,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  occasionsSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  occasionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
  },
  occasionCard: {
    width: '45%',
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  occasionIconContainer: {
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ivory,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  occasionTitle: {
    fontFamily,
    fontWeight: '500',
    fontSize: 16,
    color: colors.onyxBlack,
    textAlign: 'center',
    padding: spacing.md,
  },
  seoSection: {
    padding: spacing.lg,
    backgroundColor: colors.ivory,
    marginVertical: spacing.lg,
  },
  seoTitle: {
    fontFamily,
    fontWeight: '600',
    fontSize: 20,
    color: colors.onyxBlack,
    marginBottom: spacing.md,
  },
  seoText: {
    fontFamily,
    fontSize: 14,
    color: colors.platinum,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  productsSection: {
    marginVertical: spacing.xl,
  },
  guideSection: {
    padding: spacing.lg,
    backgroundColor: colors.ivory,
    marginVertical: spacing.lg,
  },
  guideContent: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  guideTitle: {
    fontFamily,
    fontWeight: '500',
    fontSize: 18,
    color: colors.onyxBlack,
    marginBottom: spacing.md,
  },
  guideText: {
    fontFamily,
    fontSize: 14,
    color: colors.platinum,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
