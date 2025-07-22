const config = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
};

console.log('[SUPABASE CONFIG]', {
  url: config.url,
  anonKey: config.anonKey ? config.anonKey.substring(0, 8) + '...' : undefined
});

if (!config.url || !config.anonKey) {
  throw new Error('Supabase configuration is missing required environment variables');
}

export default config;
