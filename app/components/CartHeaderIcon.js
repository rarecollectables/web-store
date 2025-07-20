import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../context/store';

export default function CartHeaderIcon({ style }) {
  const { cart = [] } = useStore();
  const cartCount = Array.isArray(cart) ? cart.length : 0;
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/cart')}
      style={[styles.iconWrap, style]}
      accessibilityLabel="Open cart"
      testID="header-cart-icon"
    >
      <FontAwesome name="shopping-cart" size={24} color="#BFA054" />
      {cartCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#E5006D',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
