import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase yapılandırması
const supabaseUrl = 'https://yviamqyfihdrghrpsqer.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aWFtcXlmaWhkcmdocnBzcWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjM5NDMsImV4cCI6MjA2Mjc5OTk0M30._xtRRDTjc6ylhSwy1A1KNdiJVik7UEKw1UeBgPbjo8A';

// Supabase client'ı oluştur (v1 API)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Client'ı test et
console.log('Supabase client oluşturuldu:', {
  hasAuth: !!supabase.auth,
  hasFrom: typeof supabase.from === 'function',
  methods: Object.keys(supabase),
  auth: supabase.auth ? Object.keys(supabase.auth) : []
});

// Client'ı dışa aktar
export default supabase;
