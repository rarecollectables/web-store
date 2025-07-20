import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontFamily } from '../../theme';

export default function CollapsibleSection({ title, children, initiallyCollapsed = true, style = {} }) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const animation = useRef(new Animated.Value(initiallyCollapsed ? 0 : 1)).current;

  const toggleCollapse = () => {
    setCollapsed(prev => {
      Animated.timing(animation, {
        toValue: prev ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
      return !prev;
    });
  };

  // Animate height (for web, use maxHeight; for native, use height)
  const animatedStyle = {
    overflow: 'hidden',
    maxHeight: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 500], // 500px max expanded height
    }),
    opacity: animation,
  };

  return (
    <View style={[styles.section, style]}>
      <Pressable style={styles.header} onPress={toggleCollapse} accessibilityRole="button" accessibilityLabel={`Toggle ${title} section`}>
        <Text style={styles.title}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] }) }] }}>
          <FontAwesome name="chevron-down" size={20} color={colors.gold} />
        </Animated.View>
      </Pressable>
      <Animated.View style={[animatedStyle, styles.contentWrapper]}>
        {collapsed ? null : <View style={styles.content}>{children}</View>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px 0 rgba(191,160,84,0.04)',
      },
      default: {
        shadowColor: '#BFA054',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#faf6e8',
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.gold,
    fontFamily: fontFamily.sans,
  },
  contentWrapper: {
    paddingHorizontal: 18,
    backgroundColor: '#fff',
  },
  content: {
    paddingVertical: 12,
  },
});
