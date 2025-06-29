// Legacy compatibility - redirect to new modern client
import { createClient as createModernClient } from './supabase/client'

// Export for legacy compatibility
export const supabase = createModernClient()

// Re-export new clients for modern usage
export { createClient } from './supabase/client'