// ============================================================
// js/auth.js
// Fungsi-fungsi autentikasi bersama untuk semua halaman
// ============================================================

// Ambil sesi login yang sedang aktif
async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
  } catch (err) {
    console.error("Gagal mendapatkan sesi:", err.message);
    return null;
  }
}

// Ambil data pengguna yang sedang login
async function getCurrentUser() {
  const session = await getCurrentSession();
  return session ? session.user : null;
}

// Ambil profil pengguna dari tabel profiles (dengan fallback jika trigger belum berjalan)
async function getCurrentProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || (error.message && error.message.includes("Could not find the table"))) {
        throw new Error("Tabel 'profiles' belum dibuat di database Supabase! Silakan jalankan skrip setup.sql di SQL Editor Supabase.");
      }
      console.warn("Peringatan query profiles:", error.message);
    }

    if (data) return data;

    // Fallback jika profil belum terbuat di database
    const name = user.user_metadata?.full_name || "Pengguna";
    const role = user.user_metadata?.role || "parent";

    const { data: newProfile, error: insertError } = await supabaseClient
      .from("profiles")
      .upsert({ id: user.id, full_name: name, role: role })
      .select()
      .maybeSingle();

    if (insertError) {
      if (insertError.code === "PGRST205" || (insertError.message && insertError.message.includes("Could not find the table"))) {
        throw new Error("Tabel 'profiles' belum dibuat di database Supabase! Silakan jalankan skrip setup.sql di SQL Editor Supabase.");
      }
      console.warn("Peringatan insert profile:", insertError.message);
    }

    if (newProfile) return newProfile;

    return { id: user.id, full_name: name, role: role };
  } catch (err) {
    console.error("Gagal mendapatkan profil:", err.message);
    throw err;
  }
}

// Proteksi halaman: pastikan pengguna sudah login
async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

// Proteksi halaman: pastikan pengguna memiliki role yang diizinkan
async function requireRole(allowedRoles) {
  const session = await requireAuth();
  if (!session) return null;

  const profile = await getCurrentProfile();
  if (!profile) {
    await logout();
    return null;
  }

  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === "parent") {
      window.location.href = "dashboard.html";
    } else if (profile.role === "admin" || profile.role === "coach") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "login.html";
    }
    return null;
  }

  return profile;
}

// Logout / Keluar dari aplikasi
async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.error("Gagal logout:", err.message);
  } finally {
    window.location.href = "login.html";
  }
}

// Deteksi otomatis jika pengguna sign out
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    const path = window.location.pathname;
    const isPublicPage = path.endsWith("login.html") ||
                         path.endsWith("register.html") ||
                         path.endsWith("index.html") ||
                         path === "/" ||
                         path === "";
    if (!isPublicPage) {
      window.location.href = "login.html";
    }
  }
});
