import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Modal, Dimensions, Alert, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';
import { chatService } from '../../lib/chat/chatService';

import { supabase } from '../../lib/supabase/client';
import { FontAwesome } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: Platform.OS === 'web' ? 32 : '10%',
    left: Platform.OS === 'web' ? 32 : spacing.xl,
    // Remove left and centering margins for mobile

    marginLeft: undefined,
    marginRight: undefined,
    marginHorizontal: undefined,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80vh',
    minHeight: 480,
    zIndex: 1000,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: 'hidden',
    boxShadow: Platform.OS === 'web' ? '0 8px 32px 0 rgba(191,160,84,0.18)' : undefined,
    backdropFilter: Platform.OS === 'web' ? 'blur(18px)' : undefined,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: Platform.OS === 'web' ? 'blur(14px)' : undefined,
    boxShadow: Platform.OS === 'web' ? '0 2px 24px 0 rgba(191,160,84,0.07)' : undefined,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gold,
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.onyxBlack,
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
    fontWeight: '700',
    lineHeight: 28,
  },
  errorContainer: {
    padding: spacing.lg,
    backgroundColor: colors.ruby,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderColor: colors.ruby,
    borderWidth: 1,
  },
  errorText: {
    color: colors.white,
    textAlign: 'center',
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: 'transparent',
  },
  messageContainer: {
    marginBottom: 16,
    borderRadius: 22,
    maxWidth: '84%',
    overflow: 'visible',
    padding: 0,
    shadowColor: '#BFA054',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.gold,
    borderColor: colors.softGoldBorder,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 22,
    marginBottom: 10,
    maxWidth: '84%',
    shadowColor: '#BFA054',
    shadowOpacity: 0.10,
    shadowRadius: 7,
    elevation: 2,
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 22,
    maxWidth: '84%',
    borderRadius: 22,
    marginBottom: 10,
    shadowColor: '#BFA054',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
  },
  messageText: {
    color: colors.onyxBlack,
    fontSize: 16.5,
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.ivory,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: colors.gold,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    marginHorizontal: 14,
    marginBottom: 18,
    boxShadow: Platform.OS === 'web' ? '0 2px 12px 0 rgba(191,160,84,0.08)' : undefined,
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 17,
    borderColor: colors.softGoldBorder,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    fontSize: 16,
    fontFamily,
    backgroundColor: colors.white,
    color: colors.onyxBlack,
  },
  sendButton: {
    backgroundColor: colors.gold,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BFA054',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: 2,
    marginRight: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background 0.2s' } : {}),
    position: 'relative',
    right: 0,
  },
  sendButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily,
    letterSpacing: 0.5,
  },
  messagesList: {
    paddingBottom: spacing.lg,
    backgroundColor: colors.ivory,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 18,
    marginTop: spacing.sm,
    ...shadows.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  typingText: {
    marginLeft: spacing.sm,
    color: colors.gold,
    fontFamily,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 12,
    color: colors.platinum,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#e5d8b6',
  },
  productInfo: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  productCard: {
    padding: spacing.sm,
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: 12,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  productStock: {
    fontSize: 12,
    color: colors.platinum,
  },
});

import { useRouter } from 'expo-router';

const ChatScreen = ({ isChatVisible, setIsChatVisible, initialMessage, ...props }) => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [productInfo, setProductInfo] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const messageAnimations = useRef(new Map()).current;

  // Animation for chat visibility
  useEffect(() => {
    if (isChatVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isChatVisible]);

  // Animate new messages
  useEffect(() => {
    messages.forEach((msg, index) => {
      if (!messageAnimations.has(index)) {
        const anim = new Animated.Value(0);
        messageAnimations.set(index, anim);
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Initialize chat session and get session ID
  // Handle initialMessage from AnnaWelcomePopup
  // Only send initialMessage ONCE per mount
  const initialMessageSent = useRef(false);
  useEffect(() => {
    if (
      initialMessage &&
      initialMessage.trim() &&
      !initialMessageSent.current &&
      isChatVisible &&
      sessionId // <-- only send if sessionId is ready
    ) {
      initialMessageSent.current = true;
      handleSend(initialMessage);
      setMessage('');
      if (typeof props.onInitialMessageHandled === 'function') props.onInitialMessageHandled();
    }
    // eslint-disable-next-line
  }, [initialMessage, isChatVisible, sessionId]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const session = await chatService.getGuestSession(null);
        let sid = null;
        if (!session) {
          throw new Error('Failed to get session');
        }
        // Handle both string and object returns
        if (typeof session === 'string') {
          sid = session;
        } else if (typeof session === 'object' && session.session_id) {
          sid = session.session_id;
        } else {
          throw new Error('Unrecognized session format');
        }
        setSessionId(sid);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat session');
      }
    };
    initializeChat();
  }, []);

  // Only load messages from Supabase if local messages are empty
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      loadMessages();
    }
  }, [sessionId]);

  // Load messages from chat history
  const loadMessages = async () => {
    try {
      console.log('loadMessages sessionId', sessionId);
      const { data, error: loadError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (loadError) {
        console.error('Error loading messages:', loadError);
        setError('Failed to load chat history');
        return;
      }

      if (data) {
        console.log('loadMessages data', data);
        const formattedMessages = [];
        for (const msg of data) {
          // User message
          formattedMessages.push({
            text: msg.message,
            sender: 'user',
            timestamp: msg.created_at,
          });
          // Assistant reply
          if (msg.response) {
            formattedMessages.push({
              text: msg.response,
              sender: 'assistant',
              timestamp: msg.created_at,
              productInfo: null,
            });
          }
        }
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load chat history');
    }
  };

  // Handle sending messages with improved error handling and animations
  const handleSend = async (msgOverride) => {
    const msgToSend = typeof msgOverride === 'string' ? msgOverride : message;
    if (!msgToSend.trim()) return;
    if (!sessionId) {
      setError('Chat session is not ready. Please try again.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage = {
        text: msgToSend,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');

      // Show typing indicator
      setIsTyping(true);

      // Store user message in database immediately
      console.log('handleSend sessionId', sessionId);
      // Generate product info and assistant reply
      const productInfo = await chatService.getRelevantProductInfo(msgToSend);
      const response = await chatService.generateResponse(msgToSend, messages, productInfo);

      // Insert a single row with both message and response
      const { error: insertError } = await supabase.from('chat_history').insert({
        session_id: sessionId,
        message: msgToSend,
        response: response,
        created_at: new Date().toISOString(),
      });
      if (insertError) {
        setError('Failed to save your message. Please try again.');
        console.error('Chat insert error:', insertError);
        return;
      }

      // Reload all messages from Supabase to ensure both prompt and reply are shown
      await loadMessages();

      // Track analytics
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        console.warn('Skipping analytics: Invalid sessionId', sessionId);
      } else {
        await trackChatAnalytics(msgToSend, response, productInfo, sessionId);
      }
    } catch (error) {
      handleErrorMessage(error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Render message with animations and product info
  const renderMessage = (message, index, router) => {
    const isUser = message.sender === 'user';
    const messageAnim = messageAnimations.get(index) || new Animated.Value(1);

    let timestamp = '';
    if (message.timestamp) {
      const dateObj = new Date(message.timestamp);
      if (!isNaN(dateObj.getTime())) {
        timestamp = dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    return (
      <Animated.View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          {
            opacity: messageAnim,
            transform: [
              {
                translateY: messageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.messageText}>{message.text}</Text>
        {/* Only render product cards for assistant productInfo */}
        {!isUser && message.productInfo?.length > 0 && (
          <View style={styles.productInfo}>
            {message.productInfo.map((product, idx) => (
              <Pressable
                key={idx}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productPrice}>${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</Text>
                <Text style={styles.productStock}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </Animated.View>
    );
  };

  // ...
  const handleErrorMessage = (error) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('product not found')) {
      setError('I couldn\'t find that product. Would you like me to suggest some alternatives?');
    } else if (errorMessage.includes('stock') || errorMessage.includes('inventory')) {
      setError('I apologize, but that product is currently out of stock. Would you like to know about similar items?');
    } else if (errorMessage.includes('price')) {
      setError('I apologize, but I couldn\'t retrieve the price information. Would you like to see similar products?');
    } else if (errorMessage.includes('no response received')) {
      setError('I apologize, but I didn\'t understand your question. Could you please rephrase it?');
    } else {
      setError(''); // Do not show a generic error box for unhandled errors
    }
  };

  // Track chat analytics
  const trackChatAnalytics = async (query, response, productInfo, sessionId) => {
    try {
      await supabase.from('chat_analytics').insert({
        id: uuidv4(),
        session_id: sessionId,
        query,
        response,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking chat analytics:', error);
    }
  };

// ...
  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      handleSend();
    }
  };

  // Compute dynamic position and width for true centering on mobile/tablet
  const dynamicContainerStyle = Platform.OS === 'web'
    ? {}
    : (() => {
        const screenWidth = Dimensions.get('window').width;
        const maxWidth = Math.min(props.boxWidth || 420, screenWidth - 32);
        return {
          left: Math.max((screenWidth - maxWidth) / 2, 16),
          maxWidth,
        };
      })();

  return (
    <Animated.View
      style={[
        styles.container,
        dynamicContainerStyle,
        props.style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          display: isChatVisible ? 'flex' : 'none',
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Support</Text>
        <Pressable
          style={styles.closeButton}
          onPress={() => setIsChatVisible(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.messagesContainer}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesList}
        >
          {messages.map((msg, index) => renderMessage(msg, index, router))}
          {isTyping && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={styles.typingText}>Assistant is typing...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor={colors.platinum}
          multiline
          maxLength={500}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Enter' && !e.shiftKey) {
              e.preventDefault && e.preventDefault();
              handleSend();
            }
          }}
          onSubmitEditing={handleSubmit}
          blurOnSubmit={false}
          returnKeyType="send"
          enablesReturnKeyAutomatically={true}
        />
        <Pressable
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || isLoading}
        >
          <FontAwesome
            name="send"
            size={20}
            color={message.trim() ? colors.white : colors.platinum}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default ChatScreen;
