import { createBrowserClient } from '@supabase/ssr'

// Function export (megtartjuk)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ÚJ: Instance export (ez hiányzott!)
export const supabase = createClient()