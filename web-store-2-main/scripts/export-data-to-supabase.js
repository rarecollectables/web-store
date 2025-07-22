const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables from command line arguments
const args = process.argv.slice(2);
const supabaseUrl = args[0];
const supabaseAnonKey = args[1];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is missing. Please run the script with:');
  console.error('node export-data-to-supabase.js <SUPABASE_URL> <SUPABASE_ANON_KEY>');
  process.exit(1);
}

// Add logging for debugging
console.log('Using Supabase URL:', supabaseUrl);
console.log('Connecting to Supabase...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  storage: {
    fileUrl: (bucket, path) => `https://${new URL(supabaseUrl).hostname}/storage/v1/object/public/${bucket}/${path}`
  }
});

// Test connection
console.log('Testing Supabase connection...');
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Failed to connect to Supabase:', error);
    process.exit(1);
  }
  console.log('Successfully connected to Supabase');
  console.log('Testing storage bucket...');
  
  // Test storage bucket access
  supabase.storage
    .from('products')
    .list('')
    .then(({ data, error }) => {
      if (error) {
        console.error('Failed to access storage bucket:', error);
      } else {
        console.log('Successfully accessed storage bucket');
      }
    });
});

const { PRODUCTS, LOCAL_IMAGES } = require('./products-data');

async function exportProducts() {
  try {
    console.log('Starting product export...');

    for (const product of PRODUCTS) {
      // Transform the product data to match Supabase schema
      const supabaseProduct = {
        id: product.id,
        name: product.title,
        price: product.price,
        category: product.category,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        stock: 10,
        sku: product.id.replace('-', '_'),
        rating: 4.5,
        review_count: 0,
        featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        additional_images: []
      };

      // Set image URLs based on existing files in Supabase
      supabaseProduct.image_url = `https://${new URL(supabaseUrl).hostname}/storage/v1/object/public/products/${product.category}/${product.image}`;

      // Add additional image URLs
      if (LOCAL_IMAGES[product.id]) {
        for (const additionalImage of LOCAL_IMAGES[product.id]) {
          const filename = path.basename(additionalImage);
          supabaseProduct.additional_images.push(
            `https://${new URL(supabaseUrl).hostname}/storage/v1/object/public/products/${product.category}/${filename}`
          );
        }
      }

      // Insert the product into the database
      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select();

      if (insertError) {
        console.error(`Error inserting product ${product.title}:`, insertError);
        continue;
      }

      console.log(`Successfully exported product: ${product.title}`);
    }
    console.log('All products exported successfully!');
  } catch (error) {
    console.error('Error exporting products:', error);
    process.exit(1);
  }
}

// Run the export
exportProducts().catch(console.error);
