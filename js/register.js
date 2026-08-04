// ============================================================
// js/register.js
// Menangani pendaftaran akun baru Staff (Pelatih / Admin)
// ============================================================

// Fungsi tampilkan pesan di layar
function showAlert(message, type) {
  const box = document.getElementById("alert-box");
  box.textContent = message;
  box.className = "alert alert-" + type;
  box.style.display = "block";
}

// Fungsi sembunyikan pesan
function hideAlert() {
  document.getElementById("alert-box").style.display = "none";
}

// Jalankan setelah halaman selesai dimuat
document.addEventListener("DOMContentLoaded", async () => {

  // Jika pengguna sudah login, langsung arahkan ke halaman admin
  const session = await getCurrentSession();
  if (session) {
    window.location.href = "admin.html";
    return;
  }

  const form = document.getElementById("register-form");
  const btn  = document.getElementById("btn-register-submit");
  let sedangProses = false; // Mencegah klik ganda pada tombol Daftar

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Jika proses sedang berjalan, abaikan klik ini
    if (sedangProses) return;

    const nama    = document.getElementById("reg-name").value.trim();
    const email   = document.getElementById("reg-email").value.trim();
    const pass    = document.getElementById("reg-password").value;
    const passKon = document.getElementById("reg-confirm-password").value;
    const roleEl  = document.getElementById("reg-role");
    const role    = roleEl ? roleEl.value : "coach";

    hideAlert();

    // --- Validasi lokal ---
    if (!nama || !email || !pass || !passKon) {
      showAlert("Harap lengkapi semua isian.", "danger");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert("Format email tidak valid. Contoh: nama@email.com", "danger");
      return;
    }
    if (pass.length < 6) {
      showAlert("Password minimal 6 karakter.", "danger");
      return;
    }
    if (pass !== passKon) {
      showAlert("Password dan konfirmasi password tidak sama.", "danger");
      return;
    }

    // --- Semua validasi lolos: kirim ke Supabase ---
    sedangProses = true;
    btn.disabled = true;
    btn.textContent = "Mendaftarkan...";

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: nama,
            role: role
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          throw new Error("Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.");
        }
        if (error.message.toLowerCase().includes("rate limit") || 
            error.message.toLowerCase().includes("too many") ||
            error.status === 429) {
          throw new Error("⚠️ Terlalu banyak percobaan pendaftaran (Supabase Rate Limit). Matikan fitur 'Confirm Email' di Dashboard Supabase (Authentication -> Providers -> Email) atau tunggu 1 jam sebelum mencoba lagi.");
        }
        if (error.message.includes("Failed to fetch")) {
          throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
        }
        throw new Error("Pendaftaran gagal: " + error.message);
      }

      // Deteksi email duplikat saat "Confirm email" dinonaktifkan di Supabase
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error("Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.");
      }

      if (data.user) {
        if (data.session) {
          showAlert("✅ Pendaftaran akun staff berhasil! Mengarahkan ke portal...", "success");
          setTimeout(() => { window.location.href = "admin.html"; }, 1500);
        } else {
          showAlert("✅ Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi atau langsung masuk jika verifikasi email dinonaktifkan.", "success");
          form.reset();
          setTimeout(() => { window.location.href = "login.html"; }, 3000);
        }
      } else {
        throw new Error("Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.");
      }

    } catch (err) {
      showAlert(err.message, "danger");
      sedangProses = false;
      btn.disabled = false;
      btn.textContent = "Daftar Akun";
    }
  });
});
