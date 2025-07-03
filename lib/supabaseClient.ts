import { createClient } from '@supabase/supabase-js'

// HARDCODED for testing
const supabaseUrl = 'https://gqfkhjekswpmgjksnbms.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 