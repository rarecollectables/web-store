// Test script to verify the updated admin email interface with dedicated fields
require('dotenv').config();
const { handler } = require('./netlify/functions/sendAdminEmail');

async function testAdminUiFix() {
  const testEmail = 'rarecollectablessales@gmail.com'; // Change to your test email
  
  // This simulates what the updated admin UI will send
  // Notice we're not sending JSON string but a proper object
  const testEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: testEmail,
      template: 'inbox-friendly-arriving',
      subject: '',
      // This is what the UI will generate from the form fields
      data: {
        customerName: 'John Smith',
        id: 'ORDER-12345',
        trackingCode: ''
      }
    })
  };
  
  try {
    console.log('Testing updated admin UI with inbox-friendly email...');
    console.log('Sending data:', JSON.parse(testEvent.body));
    
    const response = await handler(testEvent);
    
    console.log('\nResponse status:', response.statusCode);
    console.log('Response body:', response.body);
    
    // Parse the response to verify it's valid JSON
    try {
      const parsedBody = JSON.parse(response.body);
      console.log('\nParsed response:');
      console.log(parsedBody);
      
      if (parsedBody.success) {
        console.log('\n✅ SUCCESS: The updated admin interface should work correctly!');
      } else {
        console.log('\n❌ ERROR: The response indicates failure.');
      }
    } catch (err) {
      console.error('\n❌ ERROR: Failed to parse response as JSON:', err.message);
    }
  } catch (error) {
    console.error('\n❌ ERROR running function:', error);
  }
}

testAdminUiFix();
