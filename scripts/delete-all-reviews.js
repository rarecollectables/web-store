// Script to delete all reviews from the database
const { createClient } = require('@supabase/supabase-js');

async function deleteAllReviews(supabaseUrl, supabaseKey, category = null) {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL and key are required');
    return;
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let deletedCount = 0;
    
    if (category) {
      console.log(`Deleting reviews for products in category: ${category}`);
      
      // First, get all products in the specified category
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category', category);
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
        return { success: false, error: productsError.message };
      }
      
      if (!products || products.length === 0) {
        console.log(`No products found in category: ${category}`);
        return { success: true, deletedCount: 0 };
      }
      
      console.log(`Found ${products.length} products in category: ${category}`);
      
      // Delete reviews for each product
      for (const product of products) {
        // Try direct match first
        const { data: deletedReviews, error: deleteError } = await supabase
          .from('reviews')
          .delete()
          .eq('product_id', product.id)
          .select();
        
        if (deleteError) {
          console.error(`Error deleting reviews for product ${product.id}:`, deleteError);
        } else if (deletedReviews) {
          console.log(`Deleted ${deletedReviews.length} reviews for product ${product.id}`);
          deletedCount += deletedReviews.length;
        }
        
        // Then try text search as fallback (for type mismatch between UUID and TEXT)
        const { data: deletedReviewsText, error: deleteErrorText } = await supabase
          .from('reviews')
          .delete()
          .filter('product_id::text', 'ilike', `%${product.id}%`)
          .select();
        
        if (deleteErrorText) {
          console.error(`Error deleting reviews (text search) for product ${product.id}:`, deleteErrorText);
        } else if (deletedReviewsText) {
          console.log(`Deleted ${deletedReviewsText.length} additional reviews for product ${product.id} (text search)`);
          deletedCount += deletedReviewsText.length;
        }
      }
    } else {
      console.log('Deleting ALL reviews from the database...');
      
      // Delete all reviews
      const { data: deletedReviews, error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // A non-existent ID to delete all
        .select();
      
      if (deleteError) {
        console.error('Error deleting all reviews:', deleteError);
        return { success: false, error: deleteError.message };
      }
      
      if (deletedReviews) {
        deletedCount = deletedReviews.length;
      }
    }
    
    console.log(`Total reviews deleted: ${deletedCount}`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// Export the function for use in other files
module.exports = { deleteAllReviews };

// If this script is run directly (not imported), execute with command line arguments
if (require.main === module) {
  // Get Supabase credentials from command line arguments
  const supabaseUrl = process.argv[2];
  const supabaseKey = process.argv[3];
  const category = process.argv[4]; // Optional category parameter
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Usage: node delete-all-reviews.js <SUPABASE_URL> <SUPABASE_KEY> [CATEGORY]');
    process.exit(1);
  }
  
  // Run the function
  deleteAllReviews(supabaseUrl, supabaseKey, category)
    .then((result) => {
      console.log('Script completed:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}
