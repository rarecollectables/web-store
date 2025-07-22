const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get environment variables from command line arguments
const args = process.argv.slice(2);
const supabaseUrl = args[0];
const supabaseAnonKey = args[1];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is missing. Please run the script with:');
  console.error('node export-images-to-supabase.js <SUPABASE_URL> <SUPABASE_ANON_KEY>');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_IMAGES = require('../app/(data)/products').LOCAL_IMAGES;

async function exportImages() {
  try {
    // Create storage bucket if it doesn't exist
    const { data: bucket, error: bucketError } = await supabase.storage
      .admin
      .createBucket('product-images', {
        public: true
      });

    if (bucketError) {
      console.log('Bucket already exists or error occurred:', bucketError);
    }

    // Process each product's images
    for (const [productId, images] of Object.entries(LOCAL_IMAGES)) {
      console.log(`Processing images for product ${productId}...`);

      for (const image of images) {
        try {
          // Get the image path relative to the project root
          const imagePath = path.join(__dirname, '..', '..', image);
          const fileName = path.basename(image);
          const fileContent = await fs.readFile(imagePath);

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(`${productId}/${fileName}`, fileContent, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) {
            console.error(`Error uploading ${fileName}:`, error);
            continue;
          }

          console.log(`Successfully uploaded ${fileName}`);
        } catch (error) {
          console.error(`Error processing image:`, error);
          continue;
        }
      }
    }

    console.log('All images exported successfully!');
  } catch (error) {
    console.error('Error exporting images:', error);
    throw error;
  }
}

// Run the export
exportImages().catch(console.error);
