// test-inbox-friendly-order-emails.js
// Script to test both inbox-friendly order email functions

require('dotenv').config();
const sendInboxFriendlyOrderUpdateEmail = require('./netlify/functions/inbox-friendly-order-update-email');
const sendInboxFriendlyOrderDeliveredEmail = require('./netlify/functions/inbox-friendly-order-delivered-email');

async function testOrderEmails() {
  // Create a mock order object
  const mockOrder = {
    id: 'ORDER-' + Math.floor(Math.random() * 10000),
    customerName: 'Test Customer',
    shipping_address: {
      name: 'Test Customer',
      line1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA'
    },
    items: [
      {
        name: 'Vintage Gold Earrings',
        quantity: 1,
        price: '29.99'
      }
    ],
    total: '29.99'
  };

  const testEmail = 'rarecollectablessales@gmail.com'; // Change to your test email
  const trackingCode = 'TRACK-' + Math.floor(Math.random() * 10000);
  const trackingUrl = 'https://tracking.example.com/' + trackingCode;

  try {
    // Test the order update email
    console.log('Sending inbox-friendly order update email...');
    await sendInboxFriendlyOrderUpdateEmail({
      to: testEmail,
      order: mockOrder,
      trackingCode,
      trackingUrl
    });
    console.log('Order update email sent successfully!');

    // Wait a bit before sending the next email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test the order delivered email
    console.log('Sending inbox-friendly order delivered email...');
    await sendInboxFriendlyOrderDeliveredEmail({
      to: testEmail,
      order: mockOrder
    });
    console.log('Order delivered email sent successfully!');

  } catch (error) {
    console.error('Error sending emails:', error);
  }
}

testOrderEmails();
