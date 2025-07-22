import { supabase } from './client';

export async function getArchivedMessages(userId) {
  try {
    const { data, error } = await supabase
      .from('chat_archive')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 messages for performance

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching archived messages:', error);
    throw error;
  }
}

export async function getCurrentChatHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}
