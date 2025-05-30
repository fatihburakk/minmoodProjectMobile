import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://yviamqyfihdrghrpsqer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aWFtcXlmaWhkcmdocnBzcWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjM5NDMsImV4cCI6MjA2Mjc5OTk0M30._xtRRDTjc6ylhSwy1A1KNdiJVik7UEKw1UeBgPbjo8A';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  storage: AsyncStorage
}); 