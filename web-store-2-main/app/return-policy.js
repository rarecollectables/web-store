import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontFamily, spacing } from '../theme';

export default function ReturnPolicyScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Return Policy Page">
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
      <Text style={styles.title}>Return Policy</Text>
      <Text style={styles.text}>
        At Rare Collectables, we want you to be completely satisfied with your purchase. If for any reason you are not happy with your jewelry, we offer a clear and straightforward return policy to ensure your peace of mind. Please review the details below for information on how to return your item(s).
      </Text>
      <Text style={styles.heading}>1. Eligibility for Returns</Text>
      <Text style={styles.text}>
        We accept returns on items within 60 days of the delivery date. To be eligible for a return, your item must meet the following criteria:
      </Text>
      <Text style={styles.bullet}>{'•'} The jewelry must be unused, in the same condition as when you received it, and in its original packaging.</Text>
      <Text style={styles.bullet}>{'•'} Items must be free from any damage, including scratches, dents, or alterations.</Text>
      <Text style={styles.bullet}>{'•'} Custom or personalized pieces (e.g., engraved items) and final sale items are not eligible for return.</Text>
      <Text style={styles.heading}>2. How to Initiate a Return</Text>
      <Text style={styles.text}>To begin the return process, please follow these steps:</Text>
      <Text style={styles.bullet}>{'•'} Fill Out the Contact Form: Visit our Contact Us page and fill out the return request form. Provide your order number and a brief explanation of the reason for the return.</Text>
      <Text style={styles.bullet}>{'•'} Return Authorization: Once your return request is reviewed and approved, we will send you a Return Authorization (RA) number and further instructions on how to return your item.</Text>
      <Text style={styles.bullet}>{'•'} Prepare Your Package: Carefully pack the jewelry in its original packaging, including any certificates, receipts, or accessories, along with the RA number.</Text>
      <Text style={styles.bullet}>{'•'} Ship the Item: Send your return to the address provided by our customer service team. We recommend using a trackable shipping service to ensure the return reaches us safely.</Text>
      <Text style={styles.heading}>3. Return Shipping Costs</Text>
      <Text style={styles.text}>Domestic Returns: If your return is due to a defective or incorrect item, we will cover the return shipping cost. For all other returns, the customer is responsible for return shipping.</Text>
      <Text style={styles.text}>International Returns: Customers are responsible for both the return shipping cost and any applicable customs fees or taxes.</Text>
      <Text style={styles.heading}>4. Refund Process</Text>
      <Text style={styles.text}>Once we receive your returned item and verify its condition, we will process your refund to the original payment method. Please note:</Text>
      <Text style={styles.bullet}>{'•'} Refund Timing: Refunds may take up to 7-10 business days to reflect in your account, depending on your bank or payment provider.</Text>
      <Text style={styles.bullet}>{'•'} Restocking Fee: A restocking fee of 10% may apply to returns that are not due to a defect or error on our part.</Text>
      <Text style={styles.heading}>5. Exchanges</Text>
      <Text style={styles.text}>We currently do not offer direct exchanges. If you wish to exchange an item, please return the original item for a refund and place a new order for the item you would like.</Text>
      <Text style={styles.heading}>6. Damaged or Incorrect Items</Text>
      <Text style={styles.text}>If you received a damaged or incorrect item, please contact us within 7 days of delivery by filling out the contact form. We will provide you with a prepaid return label and either issue a full refund or send you a replacement item at no additional cost.</Text>
      <Text style={styles.heading}>7. Sale and Discounted Items</Text>
      <Text style={styles.text}>Items purchased on sale or with a discount are eligible for returns within the same 30-day window. However, if the item was marked as “final sale” or “non-returnable,” it cannot be returned.</Text>
      <Text style={styles.heading}>8. Contact Us</Text>
      <Text style={styles.text}>If you have any questions regarding our return policy or need assistance with a return, please fill out our contact form on the website, and our customer service team will get back to you as soon as possible.</Text>
      <Text style={styles.text}>
        Thank you for shopping with Rare Collectables. We appreciate your business and are committed to providing you with exceptional jewelry and customer service.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(191, 160, 84, 0.08)',
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
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  backButtonText: {
    color: colors.gold,
    fontSize: 16,
    fontFamily: fontFamily,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.md,
    fontFamily: fontFamily.serif,
    textAlign: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.serif,
  },
  text: {
    fontSize: 16,
    color: colors.onyxBlack,
    marginBottom: spacing.md,
    fontFamily: fontFamily,
    lineHeight: 24,
  },
  bullet: {
    fontSize: 16,
    color: colors.onyxBlack,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fontFamily,
    lineHeight: 24,
  },
});
