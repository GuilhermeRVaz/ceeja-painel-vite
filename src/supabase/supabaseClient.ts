import { createClient } from '@supabase/supabase-js';

// Pega a URL e a chave do nosso arquivo .env da forma correta para o Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);