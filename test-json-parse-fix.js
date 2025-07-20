// Test script to verify the JSON parsing error fix
require('dotenv').config();
const { handler } = require('./netlify/functions/sendAdminEmail');

async function testJsonParseFix() {
  const testEmail = 'rarecollectablessales@gmail.com'; // Change to your test email
  
  // Create a test event that mimics what the admin interface sends
  const testEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: testEmail,
      template: 'inbox-friendly-arriving',
      data: {
        customerName: 'Customer Name',
        id: 'ORDER-12345'
      }
    })
  };
  
  try {
    console.log('Testing admin email interface with inbox-friendly email...');
    const response = await handler(testEvent);
    
    console.log('\nResponse status:', response.statusCode);
    console.log('Raw response body:', response.body);
    
    // Test if the response body is valid JSON
    try {
      const parsedBody = JSON.parse(response.body);
      console.log('\nParsed response:');
      console.log(parsedBody);
      
      if (parsedBody.success) {
        console.log('\n✅ SUCCESS: The response is valid JSON and indicates success!');
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

testJsonParseFix();
