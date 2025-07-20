import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { colors } from '../../theme';

/**
 * Enhanced loading indicator with animation and descriptive text
 */
export const LoadingIndicator = ({ 
  size = 'large', 
  color = colors.gold, 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

/**
 * Animated success indicator with checkmark animation
 */
export const SuccessIndicator = ({ text = 'Success!', onComplete = () => {} }) => {
  const [animation] = React.useState(new Animated.Value(0));
  
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
    ]).start(() => {
      onComplete();
    });
  }, []);
  
  const checkmarkScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.successCircle}>
        <Animated.View 
          style={[
            styles.checkmark, 
            { transform: [{ scale: checkmarkScale }] }
          ]}
        />
      </View>
      <Text style={styles.successText}>{text}</Text>
    </View>
  );
};

/**
 * Processing payment indicator with animated dots
 */
export const ProcessingPaymentIndicator = () => {
  const [dots, setDots] = React.useState('');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.gold} />
      <View style={styles.processingTextContainer}>
        <Text style={styles.processingText}>Processing payment</Text>
        <Text style={styles.dots}>{dots}</Text>
      </View>
      <Text style={styles.secureText}>Your connection is secure</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkText,
    textAlign: 'center',
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: {
    width: 30,
    height: 15,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkText,
    marginTop: 8,
  },
  processingTextContainer: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.darkText,
  },
  dots: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.darkText,
    width: 24,
    textAlign: 'left',
  },
  secureText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.grey,
  }
});

export default {
  LoadingIndicator,
  SuccessIndicator,
  ProcessingPaymentIndicator
};
