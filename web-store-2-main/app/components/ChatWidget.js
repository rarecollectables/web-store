import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Animated, Platform } from 'react-native';
import { ChatScreen } from '../chat';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { FontAwesome } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChatWidget = () => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Position styles for the widget
  const widgetPosition = {
    right: spacing.lg,
    bottom: spacing.lg,
  };

  // Handle widget click with animation
  const handleWidgetClick = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotate icon when opening/closing
    Animated.timing(rotateAnim, {
      toValue: isChatVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsChatVisible(!isChatVisible);
    if (hasUnreadMessages) {
      setHasUnreadMessages(false);
      setNotificationCount(0);
    }
  };

  // Listen for new messages
  useEffect(() => {
    const checkNewMessages = async () => {
      // Add your message checking logic here
      // For example, check Supabase for new messages
      // If new messages exist, update hasUnreadMessages and notificationCount
    };

    const interval = setInterval(checkNewMessages, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });


  return (
    <>
      {/* Chat Icon Button - should only ever render when chat is closed */}
      {isChatVisible ? null : (
        <Animated.View
          style={[
            styles.widgetContainer,
            {
              transform: [{ scale: scaleAnim }],
              ...(Platform.OS === 'web'
                ? { right: spacing.lg, bottom: spacing.lg, left: 'auto', alignSelf: 'flex-end' }
                : { left: Math.max((screenWidth - 60) / 2, 0), right: 'auto', bottom: spacing.lg, alignSelf: 'center' }),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.widgetButton}
            onPress={handleWidgetClick}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <FontAwesome name="commenting-o" size={32} color={colors.gold} />
              {hasUnreadMessages && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{notificationCount}</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Chat Screen */}
      {isChatVisible && (
        <ChatScreen 
          isChatVisible={isChatVisible} 
          setIsChatVisible={setIsChatVisible}
          boxWidth={420}
          style={{
            position: Platform.OS === 'web' ? 'fixed' : 'absolute',
            bottom: Platform.OS === 'web' ? 32 : '10%',
            right: Platform.OS === 'web' ? 32 : undefined,
            left: Platform.OS === 'web' ? undefined : Math.max((screenWidth - 420) / 2, 0),
            width: '100%',
            maxWidth: 420,
            maxHeight: '80vh',
            minHeight: 480,
            zIndex: 1000,
          }}
        />
      )}


    </>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  widgetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
    borderWidth: 2,
    borderColor: colors.white,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  notificationText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});

export default ChatWidget;
