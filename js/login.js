// js/login.js

function showAlert(message, type) {
  const alertBox = document.getElementById("alert-box");
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.style.display = "block";
}

document.addEventListener("DOMContentLoaded", async () => {
  // Cek apakah user sudah masuk saat membuka halaman
  const session = await getCurrentSession();
  if (session) {
    const profile = await getCurrentProfile();
    if (profile) {
      if (profile.role === "parent") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "admin.html";
      }
      return;
    }
  }

  const loginForm = document.getElementById("login-form");
  let isSubmitting = false; // Variabel pengaman dari klik ganda

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btnSubmit = document.getElementById("btn-login-submit");

    // Reset alert
    document.getElementById("alert-box").style.display = "none";

    // 1. Validasi Input
    if (!email || !password) {
      showAlert("Harap lengkapi semua data.", "danger");
      return;
    }

    isSubmitting = true;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Sedang Masuk...";

    try {
      // 2. Hubungi Supabase Auth untuk Login
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Terjemahkan error umum Supabase ke pesan bersahabat untuk pemula
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email atau password salah.");
        } else if (error.message.includes("Email not confirmed") || error.message.includes("Email not verified")) {
          throw new Error("Silakan verifikasi email terlebih dahulu.");
        } else if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("exceeded")) {
          throw new Error("Terlalu banyak percobaan masuk. Silakan tunggu beberapa menit lalu coba lagi.");
        } else if (error.message.includes("Failed to fetch")) {
          throw new Error("Terjadi masalah koneksi. Silakan coba lagi.");
        }
        throw error;
      }

      // 3. Ambil data profil pengguna
      let profile = null;
      try {
        profile = await getCurrentProfile();
      } catch (profileErr) {
        throw profileErr;
      }

      if (!profile) {
        throw new Error("Akun berhasil masuk, tetapi profil Anda belum terdaftar di database. Silakan jalankan skrip setup.sql di Supabase SQL Editor.");
      }

      showAlert("Login berhasil! Mengarahkan...", "success");

      // 4. Arahkan sesuai role
      setTimeout(() => {
        if (profile.role === "parent") {
          window.location.href = "dashboard.html";
        } else if (profile.role === "admin" || profile.role === "coach") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "index.html";
        }
      }, 1000);

    } catch (err) {
      showAlert(err.message, "danger");
      isSubmitting = false;
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Masuk";
    }
  });
});
