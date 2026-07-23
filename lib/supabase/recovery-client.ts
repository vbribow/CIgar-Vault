import { createClient } from "@supabase/supabase-js";

export const recoveryAuthOptions = { flowType: "implicit" as const, detectSessionInUrl: true, persistSession: true };

export function createRecoveryClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: recoveryAuthOptions },
  );
}
