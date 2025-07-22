import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import ProductCard from '../(components)/products/ProductCard';
import { productsService } from '../../lib/supabase/services';
import { colors, spacing, borderRadius, fontFamily, shadows } from '../../theme';

export default function BestSellersSection({ cardWidth, numColumns, bestSellerIds = [], onAddToCartSuccess }) {
  const { width } = useWindowDimensions();
  // Responsive horizontal padding: more on desktop/tablet, less on mobile
  const horizontalPadding = width >= 1440 ? 120 : width >= 1200 ? 80 : width >= 1024 ? 64 : width >= 768 ? 40 : 16; // px

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchBestSellers() {
      setLoading(true);
      setError(null);
      try {
        const all = await productsService.getAllProducts();
        let bestSellers = all;
        // If manual IDs provided, filter and order by those IDs
        if (Array.isArray(bestSellerIds) && bestSellerIds.length > 0) {
          bestSellers = bestSellerIds
            .map(id => all.find(p => p.id === id))
            .filter(Boolean);
        } else if (all.length && all[0].sales_count !== undefined) {
          bestSellers = [...all].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 4);
        } else {
          bestSellers = all.slice(0, 4);
        }
        if (mounted) setProducts(bestSellers);
        // Log best sellers loaded event
        try {
          await fetch('/.netlify/functions/logSearch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: 'best_sellers_loaded',
              user_id: null
            })
          });
        } catch (logErr) {
          // Logging should not block UI
          console.warn('Failed to log best sellers event', logErr);
        }
      } catch (err) {
        if (mounted) setError('Failed to load best sellers');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchBestSellers();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!products.length) return null;
  return (
    <View style={styles.sectionContainer}> 
      <Text style={styles.sectionTitle}>Best Sellers</Text>
      <View style={{ width: '100%', maxWidth: '100%' }}>
        <FlatList
          style={{ width: '100%' }}
          data={products}
          horizontal={numColumns === 1}
          numColumns={numColumns}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <View style={numColumns === 1 ? styles.mobileCardSpacing : undefined}>
              <ProductCard item={item} cardWidth={cardWidth} disableImageCycling={true} onAddToCartSuccess={onAddToCartSuccess} />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingLeft: 16, paddingRight: 16 }]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          removeClippedSubviews={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
    // Responsive horizontal padding is now applied inline
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.md,
    fontFamily: fontFamily.serif,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  mobileCardSpacing: {
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg, // Increase horizontal gap
    paddingVertical: spacing.md,
  },
  columnWrapper: {
    gap: spacing.lg, // Increase vertical gap between columns
    justifyContent: 'flex-start',
  },
});
