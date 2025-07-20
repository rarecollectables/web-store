// send-email.js
// Simple script to invoke the manual-abandoned-cart-email function locally

require('dotenv').config();
const { handler } = require('./netlify/functions/manual-abandoned-cart-email');

async function runEmailFunction() {
  // Create a mock event object similar to what Netlify would provide
  const mockEvent = {
    queryStringParameters: {
      to_email: 'karoukawther@gmail.com',
      product_id: 'cad21823-fddf-4878-80c9-5b75bf059736'
    }
  };

  try {
    console.log('Sending abandoned cart email...');
    const result = await handler(mockEvent);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running function:', error);
  }
}

runEmailFunction();
