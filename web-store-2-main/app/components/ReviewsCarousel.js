import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontFamily } from '../../theme';



const REVIEWS = [
  {
    id: '1',
    name: 'Amelia R.',
    review: 'Absolutely stunning necklace! The packaging was beautiful and delivery was fast. Highly recommend!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Sophie L.',
    review: 'Bought a bracelet for my mum—she loved it! Superb quality and elegant design.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Emily W.',
    review: 'Customer service was very helpful. The earrings are gorgeous and hypoallergenic!',
    rating: 4,
  },
  {
    id: '4',
    name: 'Chloe T.',
    review: 'I get compliments every time I wear my new ring. Will definitely shop again.',
    rating: 5,
  },
  {
    id: '5',
    name: 'Olivia G.',
    review: 'Quick shipping, lovely presentation, and the necklace sparkles beautifully.',
    rating: 4,
  },
];

function StarRating({ rating }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
      {[...Array(5)].map((_, i) => (
        <FontAwesome
          key={i}
          name={i < rating ? 'star' : 'star-o'}
          size={16}
          color={colors.gold}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

export default function ReviewsCarousel({ reviews = REVIEWS }) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Listen to scrollX to update the dot indicator
  React.useEffect(() => {
    const cardWidth = Math.min(width * 0.9, 400) + spacing.sm * 2;
    const listener = scrollX.addListener(({ value }) => {
      const index = Math.round(value / cardWidth);
      setCurrentIndex(index);
    });
    return () => scrollX.removeListener(listener);
  }, [width, scrollX]);

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={reviews}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        decelerationRate={0.95}
        contentContainerStyle={{ alignItems: 'center', width: width }}
        style={{ width: width }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: Math.min(width * 0.9, 400) }]}> 
            <Text style={styles.reviewText}>{item.review}</Text>
            <StarRating rating={item.rating} />
            <Text style={styles.reviewer}>— {item.name}</Text>
          </View>
        )}
      />
      <View style={styles.dotsRow}>
        {reviews.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === currentIndex ? colors.gold : colors.softGoldBorder },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    minHeight: 120,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  reviewText: {
    fontSize: 16,
    color: colors.onyxBlack,
    fontFamily: fontFamily.serif,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  reviewer: {
    marginTop: 6,
    fontSize: 15,
    color: colors.gold,
    fontFamily: fontFamily.sans,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginHorizontal: 4,
  },
});
