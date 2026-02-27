import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface CalculationRecord {
  id: string; // Using string for UUID or numeric ID
  created_at?: string;
  r3: number;
  r4: number | null;
  cobertura_cliente: number | null;
  deslocamento: number | null;
  excedente_r3: number;
  excedente_cliente: number;
  cost_details: any | null;
}
