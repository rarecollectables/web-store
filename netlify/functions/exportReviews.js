const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to escape XML special characters
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Format date to ISO format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString();
};

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/xml',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Fetch all products with reviews
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku')
      .gt('review_count', 0);

    if (productsError) throw productsError;

    // Start building XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<feed xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.3/product_reviews.xsd">\n';
    xml += '  <version>2.3</version>\n';
    xml += '  <publisher>\n';
    xml += '    <name>Rare Collectables</name>\n';
    xml += '    <favicon>https://rarecollectables.co.uk/favicon.ico</favicon>\n';
    xml += '  </publisher>\n';

    // Process each product
    for (const product of products) {
      // Fetch reviews for this product
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_name,
          reviewer_email,
          users (name, email)
        `)
        .eq('product_id', product.id);

      if (reviewsError) throw reviewsError;

      if (reviews.length > 0) {
        xml += '  <product>\n';
        xml += `    <product_ids>\n`;
        xml += `      <sku>${escapeXml(product.sku || product.id)}</sku>\n`;
        xml += `    </product_ids>\n`;
        xml += `    <product_name>${escapeXml(product.name)}</product_name>\n`;
        
        // Add product reviews
        for (const review of reviews) {
          const reviewerName = review.reviewer_name || review.users?.name || 'Anonymous';
          const reviewerEmail = review.reviewer_email || review.users?.email || '';
          
          xml += '    <review>\n';
          xml += `      <review_id>${escapeXml(review.id)}</review_id>\n`;
          xml += `      <reviewer>\n`;
          xml += `        <name>${escapeXml(reviewerName)}</name>\n`;
          if (reviewerEmail) {
            xml += `        <reviewer_id>${escapeXml(reviewerEmail)}</reviewer_id>\n`;
          }
          xml += `      </reviewer>\n`;
          xml += `      <review_timestamp>${formatDate(review.created_at)}</review_timestamp>\n`;
          xml += `      <title>${escapeXml(product.name)} Review</title>\n`;
          xml += `      <content>${escapeXml(review.comment)}</content>\n`;
          xml += `      <ratings>\n`;
          xml += `        <overall min="1" max="5">${review.rating}</overall>\n`;
          xml += `      </ratings>\n`;
          xml += '    </review>\n';
        }
        
        xml += '  </product>\n';
      }
    }

    xml += '</feed>';

    return {
      statusCode: 200,
      headers,
      body: xml,
    };
  } catch (error) {
    console.error('Error generating reviews feed:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Failed to generate reviews feed' }),
    };
  }
};
