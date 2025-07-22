import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontFamily, spacing } from '../theme';
import { trackEvent } from '../lib/trackEvent';
import { contactFormService } from '../lib/supabase/services';

export default function Contact() {
  const router = useRouter();
  useEffect(() => {
    trackEvent({ eventType: 'view_contact_form' });
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async () => {
    await contactFormService.logSubmission({ name, email, message });
    await trackEvent({
      eventType: 'contact_form_submit',
      metadata: {
        name,
        email,
        message
      }
    });
    setShowConfirmation(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
  };

  return (
    <View style={{flex: 1}}>
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmCheckmarkWrapper}>
              <Text style={styles.confirmCheckmark}>✔</Text>
            </View>
            <Text style={styles.confirmTitle}>Thank you!</Text>
            <Text style={styles.confirmMessage}>Your message has been sent. We'll get back to you within 20 minutes.</Text>
            <Pressable style={styles.confirmCloseButton} onPress={() => setShowConfirmation(false)}>
              <Text style={styles.confirmCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Contact Page">
        <Pressable
          onPress={() => {
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/shop');
            }
          }}
          style={styles.backButton}
          accessibilityLabel="Go Back"
        >
          <View style={styles.backButtonContent}>
            <Text style={styles.backButtonIcon}>←</Text>
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </Pressable>
        <Text style={styles.title}>Contact Us</Text>
        <View style={styles.sloBox}>
          <Text style={styles.sloTitle}>We reply fast!</Text>
          <Text style={styles.sloText}>Our care team aims to respond to all enquiries within 20 minutes.</Text>
          <Text style={styles.sloEmail}>Or email us directly at <Text style={{fontWeight: 'bold', color: colors.gold}}>rarecollectablessales@gmail.com</Text></Text>
        </View>
        <Text style={styles.text}>Have a question or need help? Fill out the form below and we’ll get back to you soon.</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Name Input"
        />
        <TextInput
          style={styles.input}
          placeholder="Your Email"
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoCorrect={false}
          accessibilityLabel="Email Input"
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Your Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          accessibilityLabel="Message Input"
        />
        <Button title="Send" onPress={handleSubmit} color={colors.gold} accessibilityLabel="Send Message" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sloBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
  },
  sloTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 3,
  },
  sloText: {
    fontSize: 14,
    color: '#8d7c4d',
    marginBottom: 3,
    textAlign: 'center',
  },
  sloEmail: {
    fontSize: 14,
    color: '#4a3d1a',
    textAlign: 'center',
    marginTop: 2,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#bfa14a',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    minWidth: 260,
    maxWidth: 340,
  },
  confirmCheckmarkWrapper: {
    backgroundColor: '#faf6e8',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bfa14a',
  },
  confirmCheckmark: {
    fontSize: 36,
    color: '#bfa14a',
    fontWeight: 'bold',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#bfa14a',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmCloseButton: {
    backgroundColor: '#bfa14a',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 30,
    marginTop: 8,
  },
  confirmCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    marginLeft: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(191, 160, 84, 0.08)', // subtle gold background
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    fontSize: 18,
    color: colors.gold,
    marginRight: 6,
    fontWeight: 'bold',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.gold,
    fontFamily: fontFamily.sans,
    fontWeight: '600',
  },
  container: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.sans,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: fontFamily.sans,
    color: colors.dark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    fontSize: 16,
    fontFamily: fontFamily.sans,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: '#fafafa',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
});