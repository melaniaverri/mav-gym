import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devono essere definiti in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface IscrizioneInsert {
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  piano: 'flex' | 'plus' | 'elite';
  prezzo_mensile: number;
}
