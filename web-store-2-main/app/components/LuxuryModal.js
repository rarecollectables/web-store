import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Animated, Dimensions } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../theme';

export default function LuxuryModal({ visible, onClose, children, showClose = true, autoCloseMs, animation = 'fade' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }).start();
      if (autoCloseMs) {
        const timer = setTimeout(() => { onClose && onClose(); }, autoCloseMs);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible, autoCloseMs, onClose]);

  if (!visible) return null;
  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      // Use pointerEvents to allow clicks to pass through to overlay
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable
        style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        onPress={(e) => {
          // Only close if user clicks the overlay itself, not modal content
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        accessibilityLabel="Close modal overlay"
        accessibilityRole="button"
      >
        <View style={styles.centered} pointerEvents="box-none">
          <Animated.View style={[styles.modal, animation === 'slide' && styles.slideIn]} pointerEvents="box-none">
            {showClose && (
              <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close Modal">
                <View style={styles.closeIcon}><View style={styles.closeLine1} /><View style={styles.closeLine2} /></View>
              </Pressable>
            )}
            {children}
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width > 600 ? 400 : width - 32;

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflow: 'auto',
    minWidth: 280,
    ...shadows.card,
    alignSelf: 'center',
  },
  slideIn: {
    transform: [{ translateY: 32 }],
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeIcon: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  closeLine1: {
    position: 'absolute',
    width: 24,
    height: 2,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    top: 11,
    left: 0,
  },
  closeLine2: {
    position: 'absolute',
    width: 24,
    height: 2,
    backgroundColor: colors.gold,
    transform: [{ rotate: '-45deg' }],
    top: 11,
    left: 0,
  },
});
