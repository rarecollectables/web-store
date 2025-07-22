// Script to delete all reviews for earring products
const { createClient } = require('@supabase/supabase-js');

async function deleteEarringReviews(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL and key are required');
    return;
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Fetching earrings products...');
    
    // Fetch all products in the earrings category
    const { data: earringsProducts, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category', 'Earrings');

    if (productsError) {
      console.error('Error fetching earrings products:', productsError);
      return;
    }

    if (!earringsProducts || earringsProducts.length === 0) {
      console.log('No earrings products found');
      return;
    }

    console.log(`Found ${earringsProducts.length} earrings products`);
    
    // Get all product IDs
    const productIds = earringsProducts.map(product => product.id);
    
    // Delete all reviews for these products
    console.log('Deleting reviews for earring products...');
    
    // Note: We need to handle the type mismatch between products.id (TEXT) and reviews.product_id (UUID)
    // We'll delete reviews one product at a time using text comparison
    let totalDeleted = 0;
    
    for (const productId of productIds) {
      // First try direct match
      const { data: deletedReviews, error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('product_id', productId)
        .select();
      
      if (deleteError) {
        console.error(`Error deleting reviews for product ${productId}:`, deleteError);
      } else if (deletedReviews) {
        console.log(`Deleted ${deletedReviews.length} reviews for product ${productId}`);
        totalDeleted += deletedReviews.length;
      }
      
      // Then try text search as fallback
      const { data: deletedReviewsText, error: deleteErrorText } = await supabase
        .from('reviews')
        .delete()
        .filter('product_id::text', 'ilike', `%${productId}%`)
        .select();
      
      if (deleteErrorText) {
        console.error(`Error deleting reviews (text search) for product ${productId}:`, deleteErrorText);
      } else if (deletedReviewsText) {
        console.log(`Deleted ${deletedReviewsText.length} additional reviews for product ${productId} (text search)`);
        totalDeleted += deletedReviewsText.length;
      }
    }
    
    console.log(`Total reviews deleted: ${totalDeleted}`);
    return { success: true, deletedCount: totalDeleted };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// Export the function for use in other files
module.exports = { deleteEarringReviews };

// If this script is run directly (not imported), execute with command line arguments
if (require.main === module) {
  // Get Supabase credentials from command line arguments
  const supabaseUrl = process.argv[2];
  const supabaseKey = process.argv[3];
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Usage: node delete-earring-reviews.js <SUPABASE_URL> <SUPABASE_KEY>');
    process.exit(1);
  }
  
  // Run the function
  deleteEarringReviews(supabaseUrl, supabaseKey)
    .then((result) => {
      console.log('Script completed:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}
