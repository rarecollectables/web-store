import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { productsService } from '../../lib/supabase/services';
import { colors } from '../../theme';

export default function RelatedProductsSection({ category, excludeId, onProductPress }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    productsService.getRelatedProducts(category, excludeId, 12)
      .then(data => {
        if (isMounted) {
          setRelated(data || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError('Could not load related products.');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [category, excludeId]);

  if (loading) {
    return (
      <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', marginTop: 8, marginBottom: 40, backgroundColor: '#fff', borderRadius: 18, padding: 28, borderWidth: 1, borderColor: '#f1e7d0', boxShadow: '0 2px 12px rgba(0,0,0,.03)', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={{ marginTop: 12, color: colors.gold, fontWeight: 'bold' }}>Loading related products...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', marginTop: 8, marginBottom: 40, backgroundColor: '#fff', borderRadius: 18, padding: 28, borderWidth: 1, borderColor: '#f1e7d0', boxShadow: '0 2px 12px rgba(0,0,0,.03)', alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome name="exclamation-triangle" size={28} color={colors.gold} />
        <Text style={{ marginTop: 12, color: colors.gold, fontWeight: 'bold' }}>{error}</Text>
      </View>
    );
  }
  if (!related.length) {
    return null;
  }
  return (
    <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', marginTop: 8, marginBottom: 40, backgroundColor: '#fff', borderRadius: 18, padding: 28, borderWidth: 1, borderColor: '#f1e7d0', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.gold, marginLeft: 10, marginBottom: 10 }}>
        Similar Collectables You'd Love 💎🫶
      </Text>
      {/* Mobile swipe hint */}
      {typeof window !== 'undefined' && window.innerWidth < 600 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 10 }}>
          <Text style={{ color: '#bfa14a', fontSize: 14, marginRight: 6 }}>Swipe to see more</Text>
          <FontAwesome name="chevron-right" size={16} color="#bfa14a" />
        </View>
      )}
      <View style={{ position: 'relative' }}>
        <FlatList
          data={related}
          horizontal
          showsHorizontalScrollIndicator={true}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
          <Pressable
            onPress={() => onProductPress(item)}
            style={{
              width: 160,
              marginRight: 18,
              backgroundColor: '#fff',
              borderRadius: 10,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#eee',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            {item.image_url || item.image ? (
              <ExpoImage
                source={item.image_url || item.image}
                style={{ width: '100%', height: 110, backgroundColor: '#f8f8f8' }}
                contentFit="cover"
              />
            ) : (
              <View style={{ width: '100%', height: 110, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesome name="image" size={32} color={colors.gold} />
              </View>
            )}
            <View style={{ padding: 10 }}>
              <Text style={{ fontWeight: '600', fontSize: 15, color: '#222', marginBottom: 4 }} numberOfLines={1}>
                {item.title || item.name}
              </Text>
              <Text style={{ color: colors.gold, fontWeight: 'bold', fontSize: 15 }}>
                {item.price}
              </Text>
            </View>
          </Pressable>
        )}
        />
        {/* Right fade/chevron overlay on mobile */}
        {typeof window !== 'undefined' && window.innerWidth < 600 && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 44,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'flex-end',
              zIndex: 10,
            }}
          >
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 44,
                height: '100%',
                background: 'linear-gradient(to left, rgba(255,255,255,0.96) 65%, rgba(255,255,255,0))',
              }}
            />
            <FontAwesome name="chevron-right" size={28} color="#bfa14a" style={{ marginRight: 6, opacity: 0.75 }} />
          </View>
        )}
      </View>
    </View>
  );
}
