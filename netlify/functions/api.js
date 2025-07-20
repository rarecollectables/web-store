const { createRequire } = require('module');
const require = createRequire(import.meta.url);

exports.handler = async (event) => {
  try {
    // Get environment variables
    const { API_URL } = process.env;
    
    // Log the request for debugging
    console.log('Received request:', event);
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        const response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            message: 'API is working',
            environment: process.env.NODE_ENV,
            apiEndpoint: API_URL
          })
        };
        return response;
        
      case 'POST':
        // Parse the request body
        const body = JSON.parse(event.body || '{}');
        
        // Example of handling POST data
        const postResponse = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            received: body,
            timestamp: new Date().toISOString()
          })
        };
        return postResponse;
        
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            message: 'Method not allowed'
          })
        };
    }
  } catch (error) {
    console.error('Error in API function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
