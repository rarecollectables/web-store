import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../theme';

/**
 * Enhanced form field with real-time validation and visual feedback
 */
const FormField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  secureTextEntry = false,
  error,
  required = false,
  info,
  style,
  textContentType,
  validator,
  debounceMs = 500,
  icon,
  iconColor = colors.grey,
  onBlur,
  onFocus,
  id, // Add ID support for scroll-to-error functionality
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [validationState, setValidationState] = useState('idle'); // 'idle', 'validating', 'valid', 'invalid'
  
  // Animation values
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const errorShakeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Handle external error prop changes
  useEffect(() => {
    if (error) {
      setLocalError(error);
      setValidationState('invalid');
      shakeError();
    }
  }, [error]);
  
  // Validate on value change with debounce
  useEffect(() => {
    if (!isDirty || !validator) return;
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    if (value) {
      setValidationState('validating');
      
      const timeout = setTimeout(() => {
        try {
          const result = validator(value);
          if (result === true) {
            setValidationState('valid');
            setLocalError(null);
          } else {
            // Only show errors after user has finished typing and field is not focused
            // This makes validation less intrusive
            setValidationState('invalid');
            if (!isFocused) {
              setLocalError(result || 'Invalid input');
            } else {
              // Store the error but don't display it while user is typing
              setLocalError(null);
            }
          }
        } catch (err) {
          setValidationState('invalid');
          if (!isFocused) {
            setLocalError(err.message || 'Invalid input');
          } else {
            setLocalError(null);
          }
        }
      }, debounceMs);
      
      setDebounceTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
      };
    } else {
      // Only show required error when field is not focused
      setValidationState(required ? 'invalid' : 'idle');
      setLocalError(required && !isFocused ? `${label} is required` : null);
    }
  }, [value, validator, debounceMs, isDirty, required, isFocused, label]);
  
  // Animations
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);
  
  const shakeError = () => {
    errorShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Derived styles
  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.darkText, colors.gold],
  });
  
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      validationState === 'invalid' ? colors.error : colors.lightGrey,
      validationState === 'invalid' ? colors.error : colors.gold,
    ],
  });
  
  const borderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });
  
  // Event handlers
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    setIsDirty(true);
    
    // Show validation errors when user leaves the field
    if (validator && value) {
      try {
        const result = validator(value);
        if (result !== true) {
          setValidationState('invalid');
          setLocalError(result || 'Invalid input');
        }
      } catch (err) {
        setValidationState('invalid');
        setLocalError(err.message || 'Invalid input');
      }
    } else if (required && !value) {
      setValidationState('invalid');
      setLocalError(`${label} is required`);
    }
    
    if (onBlur) onBlur();
  };
  
  const handleChangeText = (text) => {
    if (!isDirty) setIsDirty(true);
    onChangeText(text);
  };
  
  // Render validation icon - less intrusive approach
  const renderValidationIcon = () => {
    // Only show validation icons when field is not focused or when validation is successful
    if (validationState === 'validating' && !isFocused) {
      return <FontAwesome name="circle-o-notch" size={16} color={colors.grey} style={styles.validationIcon} />;
    } else if (validationState === 'valid' && !isFocused) {
      // Only show success icon when not focused to be less intrusive
      return <FontAwesome name="check-circle" size={16} color={colors.success} style={styles.validationIcon} />;
    } else if (validationState === 'invalid' && isDirty && !isFocused) {
      // Only show error icon when not focused
      return <FontAwesome name="exclamation-circle" size={16} color={colors.error} style={styles.validationIcon} />;
    } else if (icon && (isFocused || validationState === 'idle')) {
      // Show field icon when focused or in idle state
      return <FontAwesome name={icon} size={16} color={isFocused ? colors.gold : iconColor} style={styles.validationIcon} />;
    }
    return null;
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Animated.Text style={[styles.label, { color: labelColor }]}>
          {label}
        </Animated.Text>
        {info && (
          <View style={styles.infoContainer}>
            <FontAwesome name="info-circle" size={14} color={colors.grey} />
            <Text style={styles.infoText}>{info}</Text>
          </View>
        )}
      </View>
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: borderColor,
            borderWidth: borderWidth,
            transform: [{ translateX: errorShakeAnim }],
          },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType}
          placeholderTextColor={colors.grey}
          id={id}
          testID={testID || id}
          accessible={true}
          accessibilityLabel={`${label}${required ? ', required' : ''}`}
        />
        {renderValidationIcon()}
      </Animated.View>
      
      {localError && (
        <Animated.Text
          style={[
            styles.errorText,
            { transform: [{ translateX: errorShakeAnim }] },
          ]}
          accessibilityLiveRegion="polite"
        >
          {localError}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  requiredAsterisk: {
    color: colors.error,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.grey,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.darkText,
    outlineStyle: 'none', // Fix blue focus square on web
  },
  validationIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default FormField;
