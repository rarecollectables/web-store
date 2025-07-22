// test-inbox-friendly-order-email.js
// Script to test the inbox-friendly order email function

require('dotenv').config();
const { handler } = require('./netlify/functions/inbox-friendly-order-email');

async function testOrderUpdateEmail() {
  // Create a mock event object for order update email
  const mockUpdateEvent = {
    queryStringParameters: {
      to_email: 'rarecollectablessales@gmail.com', // Change this to your test email
      type: 'update',
      order_number: 'ORDER-' + Math.floor(Math.random() * 10000),
      customer_name: 'John Smith',
      tracking_code: 'TRACK-' + Math.floor(Math.random() * 10000)
    }
  };

  try {
    console.log('Sending inbox-friendly order update email...');
    const result = await handler(mockUpdateEvent);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running function:', error);
  }
}

async function testOrderArrivingTodayEmail() {
  // Create a mock event object for order arriving today email
  const mockArrivingEvent = {
    queryStringParameters: {
      to_email: 'rarecollectablessales@gmail.com', // Change this to your test email
      type: 'arriving-today',
      order_number: 'ORDER-' + Math.floor(Math.random() * 10000),
      customer_name: 'John Smith'
    }
  };

  try {
    console.log('Sending inbox-friendly order arriving today email...');
    const result = await handler(mockArrivingEvent);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running function:', error);
  }
}

async function testOrderDeliveredEmail() {
  // Create a mock event object for order delivered email
  const mockDeliveredEvent = {
    queryStringParameters: {
      to_email: 'rarecollectablessales@gmail.com', // Change this to your test email
      type: 'delivered',
      order_number: 'ORDER-' + Math.floor(Math.random() * 10000),
      customer_name: 'John Smith'
    }
  };

  try {
    console.log('Sending inbox-friendly order delivered email...');
    const result = await handler(mockDeliveredEvent);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running function:', error);
  }
}

// Run the tests
async function runTests() {
  await testOrderUpdateEmail();
  // Wait a bit before sending the next email
  setTimeout(async () => {
    await testOrderArrivingTodayEmail();
    // Wait a bit before sending the next email
    setTimeout(testOrderDeliveredEmail, 3000);
  }, 3000);
}

runTests();
