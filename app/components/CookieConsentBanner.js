import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontFamily } from '../../theme';

const STORAGE_KEY = 'cookieConsent';

export default function CookieConsentBanner({ onAccept, onReject }) {
  const [visible, setVisible] = useState(false);
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    (async () => {
      const consent = await AsyncStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    })();
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    onAccept && onAccept();
  };
  const handleReject = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'rejected');
    setVisible(false);
    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    onReject && onReject();
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Pressable
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
      onPress={handleAccept}
      accessibilityLabel="Accept cookies by clicking anywhere"
    >
      <Animated.View style={[styles.banner, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }] }>
        <Text style={styles.text}>
          We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. By clicking Accept, you consent to our use of such technologies.{' '}
          <Text style={styles.link} accessibilityRole="link" accessibilityLabel="Privacy Policy" onPress={() => { /* Link to privacy policy */ }}>Learn more</Text>
        </Text>
        <View style={styles.buttons}>
          <Pressable style={[styles.button, styles.accept]} onPress={e => { e.stopPropagation(); handleAccept(); }} accessibilityLabel="Accept Cookies">
            <Text style={styles.buttonText}>Accept</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.reject]} onPress={e => { e.stopPropagation(); handleReject(); }} accessibilityLabel="Reject Cookies">
            <Text style={styles.buttonText}>Reject</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.onyxBlack,
    padding: spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  text: {
    color: colors.platinum,
    fontSize: 15,
    fontFamily: fontFamily.sans,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  link: {
    color: colors.gold,
    textDecorationLine: 'underline',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginHorizontal: 8,
  },
  accept: {
    backgroundColor: colors.gold,
  },
  reject: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
