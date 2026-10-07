import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas. " +
      "Crie o arquivo .env (local) ou configure em Settings > Environment Variables (Vercel)."
  );
}

// Cliente único do projeto. Importe sempre daqui: import { supabase } from "@/lib/supabase"
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
