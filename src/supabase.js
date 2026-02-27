import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zuxsbtdrthioyenwotuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eHNidGRydGhpb3llbndvdHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTc3NzksImV4cCI6MjA4Nzc3Mzc3OX0.5uuNXPvLyNF4I7bzWKbkcqxoICZ-LwwDh_hK6GvNZJA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
