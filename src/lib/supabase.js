// Eén gedeelde Supabase-client, of null als de app zonder backend gebouwd
// is (geen VITE_SUPABASE_* in de omgeving). Dan werkt alles lokaal zoals
// vroeger: meegebakken plantendata en de tuin in localStorage.
//
// De publishable key is publiek (hij zit in de gebouwde JS) en werkt met de
// rol `anon`/`authenticated`; wat die mogen, bepalen volledig de RLS-regels
// in supabase/migrations/.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && publishableKey ? createClient(url, publishableKey) : null;
