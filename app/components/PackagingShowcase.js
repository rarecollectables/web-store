import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';

export default function PackagingShowcase() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  
  // Responsive layout based on screen width
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  // Adjust layout based on screen size
  const containerDirection = isMobile ? 'column' : 'row';
  const textContainerWidth = isMobile ? '100%' : isTablet ? '45%' : '40%';
  const imageContainerWidth = isMobile ? '100%' : isTablet ? '55%' : '60%';
  
  return (
    <View style={[styles.container, { flexDirection: containerDirection }]}>
      <View style={[styles.textContainer, { width: textContainerWidth }]}>
        <Text style={styles.subtitle}>LUXURY EXPERIENCE</Text>
        <Text style={styles.title}>Elegant Packaging For Every Piece</Text>
        <Text style={styles.description}>
          Each piece of jewelry comes in our signature gift box with detailed care instructions and a personal thank you note. Perfect for gifting or treating yourself to something special.
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Premium Gift Box</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Care Instructions</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Thank You Card</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Elegant Presentation</Text>
          </View>
        </View>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.9 : 1 }
          ]}
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.buttonText}>Shop Our Collection</Text>
        </Pressable>
      </View>
      
      <View style={[styles.imageContainer, { width: imageContainerWidth }]}>
        <Image
          source={{ uri: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//packaging-2.webp' }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel="Rare Collectables luxury jewelry packaging"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    marginVertical: spacing.xl * 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  textContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    letterSpacing: 1.5,
    color: colors.gold,
    marginBottom: spacing.s,
    fontWeight: '600',
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    color: colors.onyxBlack,
    marginBottom: spacing.l,
    fontWeight: '700',
    lineHeight: 36,
  },
  description: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.darkGray,
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  featureIcon: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: spacing.m,
  },
  featureText: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.onyxBlack,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  imageContainer: {
    height: 'auto',
    minHeight: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
