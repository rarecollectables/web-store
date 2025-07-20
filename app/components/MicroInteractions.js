import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { colors } from '../../theme';

/**
 * Animated button with press feedback
 */
export const AnimatedButton = ({ 
  onPress, 
  style, 
  textStyle, 
  children, 
  disabled = false,
  accessibilityLabel,
  accessibilityHint
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View 
        style={[
          styles.button, 
          style, 
          disabled && styles.disabled,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.text, textStyle, disabled && styles.disabledText]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
};

/**
 * Ripple effect component for touch feedback
 */
export const Ripple = ({ 
  onPress, 
  style, 
  children, 
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  disabled = false
}) => {
  const [ripples, setRipples] = React.useState([]);
  
  const handlePress = (event) => {
    if (disabled) return;
    
    // Get the position of the press
    const { locationX, locationY } = event.nativeEvent;
    
    // Create a new ripple
    const newRipple = {
      id: Date.now(),
      locationX,
      locationY,
      animation: new Animated.Value(0),
    };
    
    // Add the ripple to the state
    setRipples([...ripples, newRipple]);
    
    // Animate the ripple
    Animated.timing(newRipple.animation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Remove the ripple after animation completes
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    });
    
    // Call the onPress handler
    if (onPress) onPress(event);
  };
  
  return (
    <Pressable 
      onPress={handlePress} 
      style={[styles.rippleContainer, style]}
      disabled={disabled}
    >
      {ripples.map(ripple => {
        // Calculate the ripple size based on container dimensions
        const rippleSize = Math.max(style?.width || 100, style?.height || 100) * 2;
        
        // Interpolate the animation value to scale and opacity
        const rippleScale = ripple.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.1, 1],
        });
        
        const rippleOpacity = ripple.animation.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.25, 0.15, 0],
        });
        
        return (
          <Animated.View
            key={ripple.id}
            style={[
              styles.ripple,
              {
                backgroundColor: rippleColor,
                width: rippleSize,
                height: rippleSize,
                borderRadius: rippleSize / 2,
                left: ripple.locationX - rippleSize / 2,
                top: ripple.locationY - rippleSize / 2,
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              },
            ]}
          />
        );
      })}
      {children}
    </Pressable>
  );
};

/**
 * Fade-in component for smooth appearance
 */
export const FadeIn = ({ 
  children, 
  style, 
  duration = 300, 
  delay = 0,
  initialOpacity = 0
}) => {
  const opacity = useRef(new Animated.Value(initialOpacity)).current;
  
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Slide-in component for smooth appearance
 */
export const SlideIn = ({ 
  children, 
  style, 
  duration = 300, 
  delay = 0,
  direction = 'up', // 'up', 'down', 'left', 'right'
  distance = 20
}) => {
  const translateAnim = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const getTransform = () => {
    switch (direction) {
      case 'up':
        return [{ translateY: translateAnim }];
      case 'down':
        return [{ translateY: translateAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'left':
        return [{ translateX: translateAnim }];
      case 'right':
        return [{ translateX: translateAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      default:
        return [{ translateY: translateAnim }];
    }
  };
  
  return (
    <Animated.View style={[style, { opacity, transform: getTransform() }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    backgroundColor: colors.lightGrey,
  },
  disabledText: {
    color: colors.grey,
  },
  rippleContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
  },
});

export default {
  AnimatedButton,
  Ripple,
  FadeIn,
  SlideIn
};
