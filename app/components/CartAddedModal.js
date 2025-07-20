import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions, useWindowDimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontFamily } from '../../theme/index.js';

const CONFETTI_COLORS = ['#bfa14a', '#fff4d6', '#f8e9c1', '#ffe9a7', '#e5dec7'];

function Confetti({ visible }) {
  // Animated confetti effect
  const pieces = Array.from({ length: 14 });
  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (visible) {
      anims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 1100 + Math.random() * 600,
          delay: i * 50 + Math.random() * 100,
          useNativeDriver: true,
        }).start();
      });
    } else {
      anims.forEach(anim => anim.setValue(0));
    }
  }, [visible]);
  return (
    <>
      {pieces.map((_, i) => {
        const left = 40 + Math.random() * 220 + (i % 2) * 40;
        const rotate = Math.random() * 360;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <Animated.View
            key={i}
            style={[
              styles.confetti,
              {
                left,
                backgroundColor: color,
                opacity: anims[i].interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0.85, 0] }),
                transform: [
                  { translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 270 + Math.random() * 60] }) },
                  { rotate: `${rotate}deg` },
                  { scale: anims[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 1.1, 0.9] }) },
                ],
              },
            ]}
          />
        );
      })}
    </>
  );
}


export default function CartAddedModal({ visible, onGoToCart, onContinue }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 500;

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.7);
      checkmarkAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <Pressable style={styles.overlay} onPress={onContinue}>
        <Confetti visible={visible} />
        <Pressable onPress={() => {}} style={{ flex: 1 }}>
          <Animated.View
            style={[
            styles.modalBox,
            isDesktop
              ? { width: 420, minWidth: 340, maxWidth: 460, paddingHorizontal: 38, paddingVertical: 38 }
              : { width: '92%', minWidth: 0, maxWidth: 400, paddingHorizontal: 18, paddingVertical: 28 },
            { transform: [{ scale: scaleAnim }] },
          ]}
          >
          <Animated.View
            style={{
              marginBottom: 18,
              transform: [{ scale: checkmarkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) }],
            }}
          >
            <FontAwesome name="check-circle" size={64} color={colors.gold} style={{ textShadowColor: '#fff8', textShadowRadius: 8 }} />
          </Animated.View>
          <Text style={styles.title}>Added to Cart!</Text>
          <Text style={styles.subtitle}>Your item was added to the cart and is waiting for you.</Text>
          <View
            style={[
              styles.buttonRow,
              isDesktop
                ? { flexDirection: 'row', gap: 18, width: '100%', marginTop: 24, justifyContent: 'space-between', alignItems: 'center', maxWidth: 380, alignSelf: 'center' }
                : { flexDirection: 'column-reverse', gap: 12, width: '100%', marginTop: 20, alignItems: 'center' },
            ]}
          >
            {/* Continue Shopping button (left) */}
            <Pressable
              style={[
                styles.button,
                styles.continueBtn,
                isDesktop 
                  ? { flex: 1, minWidth: 160, paddingHorizontal: 16, marginHorizontal: 0, marginBottom: 0 } 
                  : { width: '100%', marginHorizontal: 0, marginBottom: 0 },
              ]}
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue Shopping"
            >
              <Text 
                numberOfLines={1} 
                style={[styles.buttonText, { color: colors.gold }]}
              >
                Continue Shopping
              </Text>
            </Pressable>
            
            {/* Go to Cart button (right) */}
            <Pressable
              style={[
                styles.button,
                isDesktop 
                  ? { flex: 1, minWidth: 120, paddingHorizontal: 16, marginHorizontal: 0, marginBottom: 0 } 
                  : { width: '100%', marginHorizontal: 0, marginBottom: 0 },
              ]}
              onPress={onGoToCart}
              accessibilityRole="button"
              accessibilityLabel="Go to Cart"
            >
              <Text style={styles.buttonText}>Go to Cart</Text>
            </Pressable>
          </View>
        </Animated.View>
        </Pressable>
        {/* Animated Arrow to Cart Tab */}
        {visible && <AnimatedArrowToCart />}
      </Pressable>
    </Modal>
  );
}

function AnimatedArrowToCart() {
  // Arrow animates up and down, fixed to bottom right
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.arrowContainer,
        {
          transform: [
            { translateY: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
          ],
        },
      ]}
    >
      <FontAwesome name="arrow-up" size={38} color={colors.gold} style={{ textShadowColor: '#fff', textShadowRadius: 10, transform: [{ rotate: '25deg' }] }} />
      <Text style={styles.arrowLabel}>Cart</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 340,
    maxWidth: '90%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl || 26,
    paddingVertical: spacing.xl || 32,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    flexShrink: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 6,
    fontFamily: fontFamily.heading || undefined,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6d5b2a',
    marginBottom: 22,
    textAlign: 'center',
    fontFamily: fontFamily.sans || undefined,
    opacity: 0.92,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 14,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 26,
    marginHorizontal: 6,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 120,
    flexGrow: 1,
    flexBasis: '40%',
    marginTop: 0,
  },
  continueBtn: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gold,
    marginTop: 10,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 17,
    fontFamily: fontFamily.sans || undefined,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.7,
    zIndex: 10,
  },
  arrowContainer: {
    position: 'absolute',
    top: 38,
    right: 26,
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    flexDirection: 'row',
    gap: 6,
  },
  arrowLabel: {
    fontSize: 15,
    color: colors.gold,
    fontWeight: 'bold',
    marginLeft: 4,
    marginTop: 0,
    letterSpacing: 0.1,
  },
});
