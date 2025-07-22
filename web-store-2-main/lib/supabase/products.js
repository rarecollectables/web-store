// lib/supabase/products.js
// Utility for fetching product shipping labels from Supabase
import { supabase } from './client';

/**
 * Fetch shipping labels for a list of product IDs from the Supabase products table.
 * @param {string[]} productIds - Array of product IDs
 * @returns {Promise<Array<{id: string, shipping_label: string | null}>>}
 */
export async function fetchProductsShipping(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select('id, shipping_label')
    .in('id', productIds);
  if (error) throw error;
  return data;
}
