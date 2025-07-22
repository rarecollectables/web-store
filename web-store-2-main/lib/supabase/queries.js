import { supabase } from './client';

export async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(10); // Limit to 10 records for testing

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Example usage:
// getProducts().then(data => console.log(data));
