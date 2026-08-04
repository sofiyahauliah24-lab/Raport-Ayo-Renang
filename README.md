# 🏊‍♂️ Raport Ayo Renang

Sistem Catatan Perkembangan & Evaluasi Peserta Les Berenang berbasis web dengan integrasi Supabase (Auth, Database, & RLS).

## 🚀 Fitur Utama
1. **Autentikasi Multi-Role**:
   - **Orang Tua / Wali**: Melihat kartu perkembangan dan riwayat evaluasi (raport) anak secara real-time.
   - **Pelatih (Coach)** & **Administrator**: Mengelola data peserta les, menambahkan catatan latihan, serta hasil evaluasi.
2. **Keamanan Data (Row Level Security / RLS)**:
   - Orang Tua hanya dapat melihat data anak mereka sendiri yang terdaftar.
   - Pelatih & Admin memiliki akses untuk menginput dan memperbarui evaluasi.
3. **Riwayat Evaluasi (Raport Online)**:
   - Menyimpan materi latihan, tanggal, tingkat perkembangan (*Belum Bisa*, *Mulai Berkembang*, *Berkembang*, *Sangat Baik*), serta catatan detail dari pelatih.

---

## 🛠️ Solusi Masalah "Terlalu Banyak Percobaan / Rate Limit (429)"

Jika Anda mengalami pesan error:
> **"Terlalu banyak percobaan. Server sedang membatasi permintaan..."**

Hal ini disebabkan oleh fitur verifikasi email bawaan Supabase yang membatasi pengiriman email konfirmasi (3-30 email/jam pada akun gratis).

### Cara Mengatasinya di Dashboard Supabase:
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih proyek Anda.
3. Buka menu **Authentication** ➔ **Providers** ➔ **Email**.
4. **Matikan (Uncheck)** opsi **"Confirm email"**.
5. Klik **Save**.
6. Setelah opsi ini dimatikan, pendaftaran akun baru tidak lagi dibatasi oleh kuota email Supabase.

---

## 📄 Cara Inisialisasi Database Supabase

1. Buka Supabase Dashboard ➔ **SQL Editor**.
2. Salin seluruh isi file [`setup.sql`](file:///C:/Users/jefry/.gemini/antigravity/scratch/Raport-Ayo-Renang/setup.sql).
3. Klik **Run** untuk mengeksekusi skrip.

---

## 💻 Struktur File
- `index.html` - Halaman Landing Page.
- `login.html` & `register.html` - Form Masuk & Pendaftaran (mendukung role Orang Tua, Pelatih, & Admin).
- `dashboard.html` - Dashboard Orang Tua.
- `admin.html` - Panel Pengelolaan Pelatih / Admin.
- `raport.html` - Halaman Riwayat Evaluasi Perkembangan Peserta.
- `setup.sql` - Skrip DDL untuk tabel, RLS policy, dan trigger profil Supabase.
- `js/` - Logika JavaScript & Supabase client (`supabaseClient.js`, `auth.js`, `login.js`, `register.js`, `admin.js`, `dashboard.js`, `raport.js`).
- `css/` - Custom styling Vanilla CSS (`style.css`).
