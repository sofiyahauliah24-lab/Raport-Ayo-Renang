document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("student_id");

  const btnBack = document.getElementById("btn-back");
  const btnLogout = document.getElementById("btn-logout");
  const alertBox = document.getElementById("alert-box");
  const headerSpinner = document.getElementById("student-header-spinner");
  const profileContent = document.getElementById("student-profile-content");
  const timelineSpinner = document.getElementById("timeline-spinner");
  const evaluationsTimeline = document.getElementById("evaluations-timeline");
  const emptyState = document.getElementById("empty-timeline-state");

  // Elements to update
  const displayName = document.getElementById("display-student-name");
  const displayAge = document.getElementById("display-student-age");
  const displayParent = document.getElementById("display-student-parent");
  const displayStatus = document.getElementById("display-student-status");
  const photoContainer = document.getElementById("student-photo-container");

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "block";
  }

  // Handle Logout menggunakan fungsi global dari auth.js
  btnLogout.addEventListener("click", async () => {
    await logout();
  });

  if (!studentId) {
    showAlert("ID Peserta tidak diberikan!", "danger");
    headerSpinner.style.display = "none";
    timelineSpinner.style.display = "none";
    return;
  }

  try {
    // 1. Proteksi Halaman: Memastikan user yang masuk sudah login (role apa saja diizinkan melihat raport jika punya akses RLS)
    const userProfile = await requireRole(["parent", "admin", "coach"]);
    if (!userProfile) return; // Jika tidak sah, requireRole me-redirect otomatis

    // Atur tombol kembali dinamis
    if (userProfile.role === "parent") {
      btnBack.href = "dashboard.html";
    } else {
      btnBack.href = "admin.html";
    }

    // 3. Ambil Detail Peserta (Students)
    const { data: student, error: studentError } = await supabaseClient
      .from("students")
      .select(`
        *,
        parent:profiles(full_name)
      `)
      .eq("id", studentId)
      .single();

    if (studentError) {
      // Jika terjadi error (misalnya tidak punya akses karena RLS)
      headerSpinner.style.display = "none";
      timelineSpinner.style.display = "none";
      showAlert("Peserta tidak ditemukan atau Anda tidak memiliki akses untuk melihat riwayat ini.", "danger");
      return;
    }

    // Tampilkan data peserta di header
    displayName.textContent = student.student_name;
    displayAge.textContent = `Usia: ${student.age} Tahun`;
    displayParent.textContent = `Wali: ${student.parent ? student.parent.full_name : 'Tidak terhubung'}`;
    
    displayStatus.className = student.is_active ? "badge badge-active" : "badge badge-inactive";
    displayStatus.textContent = student.is_active ? "Aktif" : "Tidak Aktif";

    if (student.photo_url) {
      photoContainer.innerHTML = `<img class="student-avatar" src="${student.photo_url}" alt="${student.student_name}">`;
    } else {
      photoContainer.innerHTML = `<div class="student-avatar">🏊‍♂️</div>`;
    }

    headerSpinner.style.display = "none";
    profileContent.style.display = "block";

    // 4. Ambil Data Evaluasi & Sesi
    const { data: evals, error: evalsError } = await supabaseClient
      .from("evaluations")
      .select(`
        id,
        training_material,
        evaluation_result,
        notes,
        training_sessions (
          training_date,
          meeting_number,
          profiles (
            full_name
          )
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (evalsError) throw evalsError;

    timelineSpinner.style.display = "none";

    if (!evals || evals.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    // Render Timeline
    evaluationsTimeline.innerHTML = "";
    evals.forEach((item) => {
      const sessionData = item.training_sessions;
      const trainingDate = new Date(sessionData.training_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const coachName = sessionData.profiles ? sessionData.profiles.full_name : "Pelatih";

      let resultClass = "";
      switch (item.evaluation_result) {
        case "Belum Bisa": resultClass = "eval-belum-bisa"; break;
        case "Mulai Berkembang": resultClass = "eval-mulai-berkembang"; break;
        case "Berkembang": resultClass = "eval-berkembang"; break;
        case "Sangat Baik": resultClass = "eval-sangat-baik"; break;
      }

      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";

      timelineItem.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <h3 style="color: var(--primary-color); font-weight: 700; font-size: 1.25rem;">
              Pertemuan Ke-${sessionData.meeting_number}
            </h3>
            <span class="badge badge-eval ${resultClass}">${item.evaluation_result}</span>
          </div>

          <div class="timeline-meta" style="margin-bottom: 15px;">
            <p>📅 Tanggal: <span>${trainingDate}</span></p>
            <p>👤 Pelatih: <span>${coachName}</span></p>
          </div>

          <div class="eval-detail-box" style="margin-bottom: 15px;">
            <div class="eval-detail-label">Materi Latihan</div>
            <div class="eval-detail-val">${item.training_material}</div>
          </div>

          <div class="eval-detail-label">Catatan Pelatih (Perkembangan Detail)</div>
          <div class="notes-box">${item.notes}</div>
        </div>
      `;

      evaluationsTimeline.appendChild(timelineItem);
    });

  } catch (err) {
    headerSpinner.style.display = "none";
    timelineSpinner.style.display = "none";
    showAlert("Terjadi kesalahan memuat riwayat: " + err.message, "danger");
  }
});
