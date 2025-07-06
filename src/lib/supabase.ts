import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zegjnclxxqdcqvkqgqgp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZ2puY2x4eHFkY3F2a3FncWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODE2MjksImV4cCI6MjA2NTY1NzYyOX0.zW6ykXVtdHrZvDlF9DUaON7GyMGII6-ziiPar91Pwdo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)