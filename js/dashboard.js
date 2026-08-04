document.addEventListener("DOMContentLoaded", async () => {
  const parentNameElement = document.getElementById("parent-name");
  const loadingSpinner = document.getElementById("loading-spinner");
  const studentsGrid = document.getElementById("students-grid");
  const emptyState = document.getElementById("empty-state");
  const alertBox = document.getElementById("alert-box");
  const btnLogout = document.getElementById("btn-logout");

  // Fungsi Tampilkan Alert
  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "block";
  }

  // Handle Logout menggunakan fungsi global dari auth.js
  btnLogout.addEventListener("click", async () => {
    await logout();
  });

  try {
    // 1. Proteksi Halaman: Memastikan user yang masuk adalah Parent
    const profile = await requireRole(["parent"]);
    if (!profile) return; // Jika tidak sah, requireRole akan me-redirect otomatis

    parentNameElement.textContent = profile.full_name;

    // 3. Ambil Data Peserta (Students) terhubung
    const { data: students, error: studentsError } = await supabaseClient
      .from("students")
      .select("*")
      .eq("parent_id", profile.id);

    if (studentsError) throw studentsError;

    loadingSpinner.style.display = "none";

    if (!students || students.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    // 4. Muat detail evaluasi untuk setiap anak
    studentsGrid.style.display = "grid";
    studentsGrid.innerHTML = ""; // Bersihkan kontainer

    for (const student of students) {
      // Ambil seluruh evaluasi untuk anak ini
      const { data: evals, error: evalsError } = await supabaseClient
        .from("evaluations")
        .select(`
          id,
          evaluation_result,
          training_material,
          notes,
          training_sessions (
            training_date,
            meeting_number,
            profiles (
              full_name
            )
          )
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (evalsError) {
        console.error(`Gagal memuat evaluasi untuk ${student.student_name}:`, evalsError.message);
      }

      const totalEvals = evals ? evals.length : 0;
      const latestEval = totalEvals > 0 ? evals[0] : null;

      // Membuat card peserta
      const card = document.createElement("div");
      card.className = "card";

      // Badge status
      const statusBadge = student.is_active 
        ? `<span class="badge badge-active">Aktif</span>`
        : `<span class="badge badge-inactive">Tidak Aktif</span>`;

      // Foto
      const photoHtml = student.photo_url
        ? `<img class="student-avatar" src="${student.photo_url}" alt="${student.student_name}">`
        : `<div class="student-avatar">🏊‍♂️</div>`;

      // Konten Evaluasi Terbaru
      let latestEvalHtml = `
        <div class="latest-eval">
          <div class="latest-eval-title">Evaluasi Terbaru</div>
          <p style="color: #666; font-size: 0.9rem;">Belum ada hasil evaluasi yang diinput oleh pelatih.</p>
        </div>
      `;

      if (latestEval) {
        const evalDate = new Date(latestEval.training_sessions.training_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        
        let resultClass = "";
        switch (latestEval.evaluation_result) {
          case "Belum Bisa": resultClass = "eval-belum-bisa"; break;
          case "Mulai Berkembang": resultClass = "eval-mulai-berkembang"; break;
          case "Berkembang": resultClass = "eval-berkembang"; break;
          case "Sangat Baik": resultClass = "eval-sangat-baik"; break;
        }

        // Ambil cuplikan catatan jika terlalu panjang untuk dashboard
        const notesSnippet = latestEval.notes.length > 100 
          ? latestEval.notes.substring(0, 100) + "..." 
          : latestEval.notes;

        latestEvalHtml = `
          <div class="latest-eval">
            <div class="latest-eval-title">Pertemuan ke-${latestEval.training_sessions.meeting_number} - ${evalDate}</div>
            <p><strong>Materi:</strong> ${latestEval.training_material}</p>
            <p><strong>Hasil:</strong> <span class="badge badge-eval ${resultClass}">${latestEval.evaluation_result}</span></p>
            <p style="margin-top: 5px; color: #555; font-size: 0.9rem; font-style: italic;">"${notesSnippet}"</p>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="student-card-header">
          ${photoHtml}
          <div class="student-card-info">
            <h3>${student.student_name}</h3>
            ${statusBadge}
          </div>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Usia</span>
          <span class="stat-value">${student.age} Tahun</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Total Evaluasi Latihan</span>
          <span class="stat-value">${totalEvals} Sesi</span>
        </div>

        ${latestEvalHtml}

        <div style="margin-top: 20px;">
          <a href="raport.html?student_id=${student.id}" class="btn btn-primary" style="width: 100%;">
            Lihat Riwayat Perkembangan
          </a>
        </div>
      `;

      studentsGrid.appendChild(card);
    }

  } catch (err) {
    loadingSpinner.style.display = "none";
    showAlert("Terjadi kesalahan: " + err.message, "danger");
  }
});
