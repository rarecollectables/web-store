// test-admin-email.js
// Script to test the inbox-friendly email function directly

require('dotenv').config();
const { handler } = require('./netlify/functions/sendAdminEmail');

async function testAdminEmail() {
  // Create a mock event object similar to what the admin page would send
  const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: 'test@example.com', // Change this to your test email
      template: 'inbox-friendly-update',
      subject: 'Test Email',
      data: {
        customerName: 'Test Customer',
        id: 'ORDER-123',
        trackingCode: 'TRACK-456'
      }
    })
  };

  try {
    console.log('Sending test admin email...');
    const result = await handler(mockEvent);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running function:', error);
  }
}

testAdminEmail();
