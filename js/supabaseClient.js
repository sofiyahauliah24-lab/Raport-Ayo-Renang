// ============================================================
// js/supabaseClient.js
// Konfigurasi koneksi ke Supabase
// ============================================================

const SUPABASE_URL = "https://gxxobbhyhafvvkuxlazv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eG9iYmh5aGFmdnZrdXhsYXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NjA1NjksImV4cCI6MjEwMDAzNjU2OX0.EVicHY5aUaQlQCL5Qg5cgKrzIBk5iWBVGtNBUnxOfPA";

// PENTING: Variabel harus bernama "supabaseClient", bukan "supabase"
// karena library CDN sudah memakai nama "supabase" sebagai variabel globalnya.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);