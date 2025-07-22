import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import ProductCard from '../(components)/products/ProductCard';
import { productsService } from '../../lib/supabase/services';
import { colors, spacing, borderRadius, fontFamily, shadows } from '../../theme';

export default function MostPopularSection({ cardWidth, numColumns, mostPopularIds = [], onAddToCartSuccess }) {
  const { width } = useWindowDimensions();
  // Remove horizontalPadding, use fixed padding in FlatList contentContainerStyle


  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMostPopular() {
      setLoading(true);
      setError(null);
      try {
        // If you have specific logic for most popular, update here. Otherwise, fetch by IDs.
        let data = [];
        if (mostPopularIds.length > 0) {
          // Fetch all products and filter by IDs
          const allProducts = await productsService.getAllProducts();
          data = allProducts.filter(product => mostPopularIds.includes(product.id));
        } else {
          // Fallback: just fetch all products
          data = await productsService.getAllProducts();
        }
        if (mounted) setProducts(data);
      } catch (err) {
        if (mounted) setError('Failed to load most popular products.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMostPopular();
    return () => { mounted = false; };
  }, [mostPopularIds]);

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
    <View style={[
      styles.sectionContainer,
      { maxWidth: 1200, alignSelf: 'center', width: '100%' }
    ]}> 
      <Text style={styles.sectionTitle}>Most Popular</Text>
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
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.lg,
    textAlign: 'center',
    alignSelf: 'center',
  },
  listContent: {
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  mobileCardSpacing: {
    marginRight: spacing.md,
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.red,
    fontSize: 16,
    fontFamily,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: spacing.lg,
  },
});
