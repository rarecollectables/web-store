import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, View, Platform, Dimensions, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';

export default function Logo() {
  // Use useWindowDimensions hook for responsive design
  const { width: windowWidth } = useWindowDimensions();
  const [logoSize, setLogoSize] = useState({ width: 240, height: 80 });
  const pathname = usePathname();
  
  // Check if current page is shop or cart
  const isShopOrCart = pathname === '/(tabs)/shop' || pathname === '/(tabs)/cart';
  
  // Update logo size when window width changes
  useEffect(() => {
    function updateLogoSize() {
      if (windowWidth < 480) { // Small mobile
        setLogoSize({ width: 200, height: 100 });
      } else if (windowWidth < 768) { // Tablet/large mobile
        setLogoSize({ width: 350, height: 100 });
      } else if (windowWidth < 1024) { // Small desktop
        setLogoSize({ width: 300, height: 100 });
      } else { // Large desktop
        setLogoSize({ width: 300, height: 100 });
      }
    }
    
    updateLogoSize();
  }, [windowWidth]);
  
  return (
    <Link href="/" asChild>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/rare-collectables-logo.png')}
          style={[styles.logo, { width: logoSize.width, height: logoSize.height }]}
          resizeMode="contain"
        />
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 45 : 10, // Position below the banner on web
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  logo: {
    // Base styles applied to both mobile and desktop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }
});
