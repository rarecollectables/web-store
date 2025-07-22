// Test script for generating earrings reviews locally
require('dotenv').config();
const { handler } = require('./generateEarringsReviews');

async function testGenerateReviews() {
  console.log('Testing generateEarringsReviews function...');
  
  // Create a mock event object similar to what Netlify would provide
  const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({})
  };
  
  try {
    // Call the handler function
    const result = await handler(mockEvent);
    
    // Log the result
    console.log('Status code:', result.statusCode);
    console.log('Response:', JSON.parse(result.body));
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
testGenerateReviews();
