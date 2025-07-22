// send-inbox-friendly-email.js
// Script to invoke the inbox-friendly-cart-email function locally

require('dotenv').config();
const { handler } = require('./netlify/functions/inbox-friendly-cart-email');

async function runEmailFunction() {
  // Create a mock event object similar to what Netlify would provide
  const mockEvent = {
    queryStringParameters: {
      to_email: 'rarecollectablessales@gmail.com', // Change this to your test email
      product_id: 'cad21823-fddf-4878-80c9-5b75bf059736' // Optional: specify a product ID
    }
  };

  try {
    console.log('Sending inbox-friendly abandoned cart email...');
    const result = await handler(mockEvent);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running function:', error);
  }
}

runEmailFunction();
