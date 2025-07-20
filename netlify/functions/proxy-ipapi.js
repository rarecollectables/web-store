// Completely rewritten to avoid any potential naming conflicts or issues
// Import node-fetch with a unique name to avoid any conflicts
let httpClient;
try {
  httpClient = require('node-fetch');
} catch (e) {
  // Fallback implementation if node-fetch is not available
  httpClient = async (url) => {
    const https = require('https');
    return new Promise((resolve) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data)
          });
        });
      });
      req.on('error', () => {
        resolve({ ok: false, status: 500 });
      });
      req.end();
    });
  };
}

// In-memory cache with TTL
const locationCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Default response if anything fails
const defaultResponse = {
  error: true,
  message: 'Could not determine location',
  city: null,
  country_name: null,
  ip: null
};

// Helper function to safely get client IP
function getClientIp(event) {
  try {
    return event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           event.headers['client-ip'] ||
           event.headers['x-real-ip'] ||
           'unknown';
  } catch (e) {
    return 'unknown';
  }
}

exports.handler = async function(event) {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  try {
    // Get client IP address with fallback options
    const ip = getClientIp(event);
    const now = Date.now();
    
    // Check cache first
    if (locationCache[ip] && (now - locationCache[ip].timestamp < CACHE_DURATION)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(locationCache[ip].data)
      };
    }
    
    // Determine which URL to use based on IP
    let geoUrl;
    if (ip && ip !== 'unknown') {
      geoUrl = `https://get.geojs.io/v1/ip/geo/${ip}.json`;
    } else {
      geoUrl = 'https://get.geojs.io/v1/ip/geo.json';
    }
    
    // Make the request to geojs.io
    try {
      // Use a direct approach with https module for maximum compatibility
      const https = require('https');
      const url = new URL(geoUrl);
      
      const locationData = await new Promise((resolve) => {
        const req = https.get({
          hostname: url.hostname,
          path: url.pathname + url.search,
          timeout: 5000 // 5 second timeout
        }, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const geoData = JSON.parse(data);
                resolve({
                  ip: geoData.ip || ip,
                  city: geoData.city || null,
                  country_name: geoData.country || null,
                  country_code: geoData.country_code || null,
                  latitude: geoData.latitude || null,
                  longitude: geoData.longitude || null,
                  error: false
                });
              } else {
                console.error(`GeoJS API returned status ${res.statusCode}`);
                resolve({
                  ...defaultResponse,
                  message: `API returned status ${res.statusCode}`,
                  ip
                });
              }
            } catch (parseError) {
              console.error('Failed to parse GeoJS response:', parseError);
              resolve({
                ...defaultResponse,
                message: 'Failed to parse location data',
                ip
              });
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('Error making request to GeoJS:', error);
          resolve({
            ...defaultResponse,
            message: `Request error: ${error.message}`,
            ip
          });
        });
        
        req.on('timeout', () => {
          req.destroy();
          console.error('GeoJS request timed out');
          resolve({
            ...defaultResponse,
            message: 'Request timed out',
            ip
          });
        });
        
        req.end();
      });
      
      // Cache the result if it's not an error
      if (!locationData.error) {
        locationCache[ip] = {
          data: locationData,
          timestamp: now
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(locationData)
      };
    } catch (fetchError) {
      console.error('Error fetching location data:', fetchError);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...defaultResponse,
          message: 'Error fetching location data',
          ip
        })
      };
    }
  } catch (err) {
    console.error('General error in proxy-ipapi:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(defaultResponse)
    };
  }
};
