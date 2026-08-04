# 🏊‍♂️ AYO RENANG — Sistem Catatan Perkembangan & Evaluasi Les Berenang

[![Domain](https://img.shields.io/badge/Website-ayorenang.my.id-00D2C4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ayorenang.my.id)
[![Repository](https://img.shields.io/badge/GitHub-Repository-0B3C5D?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sofiyahauliah24-lab/Raport-Ayo-Renang)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

Selamat datang di platform **AYO RENANG**! Aplikasi web modern yang dirancang khusus untuk membantu pengelola kursus renang, pelatih, dan orang tua murid dalam memantau perkembangan teknik berenang, keberanian di air, serta catatan hasil latihan anak secara transparan, aman, dan tanpa hambatan.

---

## ✨ Keunggulan & Fitur Utama

### 👨‍👩‍👧‍👦 1. Akses Raport Instan untuk Orang Tua (Tanpa Login)
- **Tanpa Pendaftaran Rumit**: Orang Tua tidak perlu lagi mendaftarkan akun atau mengingat kombinasi email & password.
- **Pencarian Cepat**: Cukup ketik nama depan atau nama lengkap anak di halaman utama.
- **Keamanan PIN Terproteksi**: Raport dilindungi **PIN Akses 4-Digit** yang diberikan oleh Pelatih/Admin. Tampil menggunakan *Custom In-Page Modal UI* yang responsif dan aman di semua perangkat.

### 🏊‍♂️ 2. Panel Evaluasi Latihan Khusus Pelatih (Coach)
- **Catatan Sesi Rutin**: Memasukkan tanggal latihan, nomor pertemuan, materi (contoh: *Meluncur, Mengapung, Gaya Dada*), serta indikator perkembangan (*Belum Bisa*, *Mulai Berkembang*, *Berkembang*, *Sangat Baik*).
- **Catatan Detail Tumbuh Kembang**: Area teks khusus untuk menuliskan rekomendasi latihan, tingkat keberanian anak, dan peningkatan teknik berenang.

### 🛡️ 3. Manajemen Penuh oleh Administrator (Admin)
- **Registrasi Peserta & Foto**: Menambahkan data murid baru, usia, nama wali, serta foto peserta (upload langsung ke Supabase Storage atau fallback otomatis).
- **Pembuatan PIN Akses Wali**: Menentukan PIN khusus atau menggunakan fitur *auto-generate* 4 digit angka acak.
- **Pendaftaran Akun Staff Baru**: Mendaftarkan akun Pelatih & Admin baru langsung dari dalam sistem.

### ⚡ 4. Arsitektur Modern & Clean URLs
- Tautan bersih tanpa ekstensi `.html` (`/login`, `/admin`, `/register`, `/raport`).
- Terintegrasi penuh pada Custom Domain resmi: **`https://ayorenang.my.id`**.

---

## 🌐 Daftar Tautan Resmi & Clean Routing

| Nama Halaman | Fungsi & Pengguna | Tautan Resmi |
| :--- | :--- | :--- |
| **🏠 Halaman Utama & Pencarian** | **Orang Tua / Wali** — Mencari nama anak & membuka Raport | [`https://ayorenang.my.id/`](https://ayorenang.my.id/) |
| **🔑 Portal Masuk Staff** | **Pelatih & Admin** — Masuk ke sistem pengelola | [`https://ayorenang.my.id/login`](https://ayorenang.my.id/login) |
| **📝 Registrasi Staff Baru** | **Admin** — Pendaftaran akun Pelatih & Admin baru | [`https://ayorenang.my.id/register`](https://ayorenang.my.id/register) |
| **🖥️ Panel Pengelola Staff** | **Pelatih & Admin** — Dashboard evaluasi & kelola murid | [`https://ayorenang.my.id/admin`](https://ayorenang.my.id/admin) |
| **📋 Halaman Raport Murid** | **Publik / Wali** — Lembar riwayat evaluasi berenang | [`https://ayorenang.my.id/raport`](https://ayorenang.my.id/raport) |

---

## 🛠️ Panduan Instalasi & Pengaturan Supabase

### 1. Inisialisasi Database
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) ➔ **SQL Editor**.
2. Salin seluruh isi file [`setup.sql`](setup.sql).
3. Klik **Run** untuk membuat tabel (`profiles`, `students`, `training_sessions`, `evaluations`), fungsi trigger, kebijakan RLS, serta bucket penyimpanan foto `student-photos`.

### 2. Penanganan Rate Limit Supabase (Error 429)
Jika pendaftaran akun staff mengalami pembatasan kuota email:
1. Buka Supabase Dashboard ➔ **Authentication** ➔ **Providers** ➔ **Email**.
2. **Hapus centang (Uncheck)** pada opsi **Confirm email**.
3. Klik **Save**. Akun staff baru dapat didaftarkan secara langsung tanpa hambatan.

---

## ⚙️ Pengaturan DNS Custom Domain (`ayorenang.my.id`)

Repositori ini telah dilengkapi file `CNAME`. Konfigurasi record DNS pada panel domain registrar adalah sebagai berikut:

- **4 Record A** (Host: `@` | Target IP):
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- **1 Record CNAME** (Host: `www` | Target): `sofiyahauliah24-lab.github.io`

---

## 📁 Struktur Repositori

```
Raport-Ayo-Renang/
├── CNAME                    # Konfigurasi Domain Utama (ayorenang.my.id)
├── BLUEPRINT.md             # Dokumentasi Arsitektur & Laporan Perbaikan
├── Dokumentasi_AYO_RENANG.pdf # Dokumen Panduan Resmi Format PDF
├── setup.sql                # Skrip DDL Database, RLS, & Trigger Supabase
├── index.html               # Halaman utama & pencarian publik
├── css/
│   └── style.css            # Custom Styling & Glassmorphic Modal UI
├── js/
│   ├── supabaseClient.js    # Kunci inisialisasi client Supabase
│   ├── auth.js              # Manajemen autentikasi & sesi
│   ├── login.js             # Logika portal masuk staff
│   ├── register.js          # Logika pendaftaran akun staff
│   ├── admin.js             # Dashboard pengelola & form evaluasi
│   └── raport.js            # Render riwayat evaluasi & verifikasi PIN
├── login/
│   └── index.html           # Clean URL /login
├── register/
│   └── index.html           # Clean URL /register
├── admin/
│   └── index.html           # Clean URL /admin
└── raport/
    └── index.html           # Clean URL /raport
```

---

## 📄 Dokumentasi Tambahan

- **Panduan Teknis Lengkap**: [`BLUEPRINT.md`](BLUEPRINT.md)
- **Unduh Dokumentasi Resmi (PDF)**: [`Dokumentasi_AYO_RENANG.pdf`](Dokumentasi_AYO_RENANG.pdf)

---

&copy; 2026 **AYO RENANG**. Dedicated for youth swimming progress and water safety education.
