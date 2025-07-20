import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Save an order to the Supabase database
 * @param {Object} order - The order object to save
 * @returns {Promise<Object>} - The saved order with database ID
 */
export const saveOrderToDatabase = async (order) => {
  try {
    // Generate a UUID for the database record
    const dbId = uuidv4();
    
    // Format the order for database storage
    const orderRecord = {
      id: dbId,
      order_number: order.id,
      customer_email: order.contact?.email || null,
      customer_name: order.contact?.name || null,
      customer_phone: order.contact?.phone || null,
      shipping_address: order.address ? JSON.stringify(order.address) : null,
      items: JSON.stringify(order.items || []),
      total_amount: order.total || 0,
      discount_amount: order.discount || 0,
      // Store coupon info in metadata instead of coupon_code field
      metadata: JSON.stringify({
        coupon: order.coupon || null,
        discount_details: order.discount ? { amount: order.discount } : null
      }),
      payment_intent_id: order.paymentIntentId || null,
      payment_method: order.paymentMethod || 'card',
      status: order.status || 'confirmed',
      created_at: order.date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the order into the database
    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (error) {
      console.error('Error saving order to database:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save order to database:', error);
    // Return the original order if database save fails
    // This allows the app to continue functioning with localStorage only
    return order;
  }
};

/**
 * Get orders for a specific customer from the database
 * @param {string} email - Customer email
 * @returns {Promise<Array>} - Array of orders
 */
export const getCustomerOrders = async (email) => {
  if (!email) return [];
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }

    // Transform database records to match the app's order format
    return data.map(record => ({
      id: record.order_number,
      date: record.created_at,
      total: record.total_amount,
      discount: record.discount_amount,
      coupon: record.metadata ? JSON.parse(record.metadata)?.coupon || null : null,
      status: record.status,
      paymentIntentId: record.payment_intent_id,
      paymentMethod: record.payment_method,
      contact: {
        email: record.customer_email,
        name: record.customer_name,
        phone: record.customer_phone
      },
      address: record.shipping_address ? JSON.parse(record.shipping_address) : null,
      items: record.items ? JSON.parse(record.items) : []
    }));
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return [];
  }
};
