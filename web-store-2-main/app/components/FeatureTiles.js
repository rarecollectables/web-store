import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';

const FEATURES = [
  {
    icon: 'diamond',
    title: 'Premium Quality',
    description: 'Handpicked, unique collectables crafted to last.'
  },
  {
    icon: 'truck',
    title: 'Free UK Shipping',
    description: 'Enjoy fast, free delivery on all orders.'
  },
  {
    icon: 'undo',
    title: '60-Day Returns',
    description: 'Shop with confidence—easy returns within 60 days.'
  },
  {
    icon: 'shield',
    title: 'Lifetime Warranty',
    description: 'Guaranteed quality and authenticity for life.'
  }
];

function useStaggeredFadeIn(count, duration = 480, delayStep = 120) {
  const anims = useRef([...Array(count)].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(delayStep,
      anims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true
        })
      )
    ).start();
  }, [anims, duration, delayStep]);
  return anims;
}

// Custom hook to detect if a component is on screen (viewport)
function useOnScreen(ref, callback, rootMargin = 0) {
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    let hasBeenVisible = false;
    function handleScrollOrResize() {
      if (!node) return;
      const rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
      if (rect && rect.top < window.innerHeight - rootMargin && rect.bottom > 0 + rootMargin) {
        if (!hasBeenVisible) {
          hasBeenVisible = true;
          callback && callback();
        }
      }
    }
    window.addEventListener('scroll', handleScrollOrResize);
    window.addEventListener('resize', handleScrollOrResize);
    handleScrollOrResize();
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [ref, callback, rootMargin]);
}

import { Pressable } from 'react-native';
export default function FeatureTiles({ style, onViewed, onTilePress }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const containerRef = useRef(null);
  const anims = useStaggeredFadeIn(FEATURES.length);

  // Always call useOnScreen at the top level
  useOnScreen(containerRef, onViewed, 60);

  if (isMobile) {
    // Mobile: horizontal scrollable compact cards
    return (
      <View ref={containerRef} style={[styles.mobileContainer, style]} accessibilityLabel="Shop Features">
        {/* Swipe hint */}
        <View style={{ position: 'relative' }}>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={220}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
          {FEATURES.map((feature, idx) => (
            <Pressable key={feature.title} onPress={() => onTilePress && onTilePress(idx, feature)} accessibilityRole="button" accessibilityLabel={feature.title}>
              <Animated.View
                style={[
                  styles.tileMobileCard,
                  {
                    opacity: anims[idx],
                    transform: [{ translateY: anims[idx].interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }]
                  }
                ]}
              >
                <View style={styles.iconCircleMobile}>
                  <FontAwesome name={feature.icon} size={32} color={colors.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.titleMobile}>{feature.title}</Text>
                  <Text style={styles.descriptionMobile}>{feature.description}</Text>
                </View>
              </Animated.View>
            </Pressable>
          ))}
        </Animated.ScrollView>
          {/* Right fade/chevron overlay */}
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
        </View>
      </View>
    );
  }

  // Desktop/tablet: current grid
  return (
    <View ref={containerRef} style={[styles.container, style]} accessibilityLabel="Shop Features">
      {FEATURES.map((feature, idx) => (
        <Pressable key={feature.title} onPress={() => onTilePress && onTilePress(idx, feature)} accessibilityRole="button" accessibilityLabel={feature.title}>
          <Animated.View
            style={[
              styles.tile,
              {
                opacity: anims[idx],
                transform: [{ translateY: anims[idx].interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }]
              }
            ]}
          >
            <View style={styles.iconCircle}>
              <FontAwesome name={feature.icon} size={28} color={colors.gold} />
            </View>
            <Text style={styles.title}>{feature.title}</Text>
            <Text style={styles.description}>{feature.description}</Text>
          </Animated.View>
        </Pressable>
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  // Desktop/tablet container
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    width: '100%',
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
  },
  // Mobile horizontal scroll container
  mobileContainer: {
    width: '100%',
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  // Desktop grid tile
  tile: {
    flexBasis: '22%',
    minWidth: 140,
    maxWidth: 200,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    shadowColor: colors.gold,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Mobile horizontal card
  tileMobileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginRight: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minWidth: 200,
    maxWidth: 240,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    shadowColor: colors.gold,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Mobile icon
  iconCircleMobile: {
    backgroundColor: colors.ivory,
    borderRadius: 32,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
  },
  // Mobile text
  titleMobile: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.gold,
    fontFamily: fontFamily.sans,
    marginBottom: 2,
  },
  descriptionMobile: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fontFamily.sans,
    opacity: 0.88,
  },
  iconCircle: {
    backgroundColor: colors.ivory,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gold,
    fontFamily: fontFamily.sans,
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: fontFamily.sans,
    textAlign: 'center',
    opacity: 0.88,
  },
});
