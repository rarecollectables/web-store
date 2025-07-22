import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fontFamily, borderRadius, spacing } from '../../theme';

export default function SpringPromoModal({ visible, onClose }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.modal}>
        {/* Force the title to always be on one line, no wrap, no truncation */}
        <Text
          style={[
            styles.title,
            { flexShrink: 1, paddingHorizontal: 8, fontSize: 20, minWidth: 340, maxWidth: 400, textAlign: 'center', whiteSpace: 'nowrap' }
          ]}
          numberOfLines={1}
        >
          ☀️ Welcome to Rare Collectables!
        </Text>
        <Text style={styles.body}>
          As a thank you for visiting
        </Text>
        <Text style={styles.body}>
          Enjoy a special <Text style={styles.bold}>20% off</Text> your first order!
        </Text>
        <Text style={styles.codeLabel}>Use coupon code:</Text>
        <View style={styles.codeBox}>
          <Text selectable style={styles.code}>SUMMER20</Text>
        </View>
        <Text style={styles.bodySmall}>Enter it at checkout. Hurry—this offer is for new visitors only!</Text>
        <Pressable style={styles.button} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close promo banner">
          <Text style={styles.buttonText}>Start Shopping</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minWidth: 280,
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    color: colors.gold,
    fontFamily: fontFamily.serif,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: colors.onyxBlack,
    marginBottom: 10,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
    color: colors.gold,
  },
  codeLabel: {
    fontSize: 15,
    color: colors.platinum,
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 6,
    marginTop: 2,
  },
  code: {
    fontSize: 18,
    color: colors.gold,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
  },
  bodySmall: {
    fontSize: 13,
    color: colors.platinum,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
