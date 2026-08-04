document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const adminNameElement = document.getElementById("admin-name");
  const adminRoleLabel = document.getElementById("admin-role-label");
  const btnLogout = document.getElementById("btn-logout");
  const alertBox = document.getElementById("alert-box");

  // Sidebar
  const btnToggleAddStudent = document.getElementById("btn-toggle-add-student");
  const searchInput = document.getElementById("search-student-input");
  const studentsLoading = document.getElementById("students-loading");
  const studentListContainer = document.getElementById("student-list-container");

  // Views
  const mainDefaultState = document.getElementById("main-default-state");
  const studentFormContainer = document.getElementById("student-form-container");
  const studentDetailContainer = document.getElementById("student-detail-container");

  // Form Student
  const studentRegisterForm = document.getElementById("student-register-form");
  const studentParentSelect = document.getElementById("student-parent-select");
  const btnCancelStudent = document.getElementById("btn-cancel-student");

  // Student Detail
  const detailStudentAvatar = document.getElementById("detail-student-avatar");
  const detailStudentName = document.getElementById("detail-student-name");
  const detailStudentMeta = document.getElementById("detail-student-meta");
  const btnViewRaportFull = document.getElementById("btn-view-raport-full");
  const btnDeleteStudent = document.getElementById("btn-delete-student");

  // Form Evaluasi
  const evaluationSubmitForm = document.getElementById("evaluation-submit-form");
  const evalEditId = document.getElementById("eval-edit-id");
  const evalDate = document.getElementById("eval-date");
  const evalMeetingNum = document.getElementById("eval-meeting-num");
  const evalCoachDisplay = document.getElementById("eval-coach-display");
  const evalMaterial = document.getElementById("eval-material");
  const evalResult = document.getElementById("eval-result");
  const evalNotes = document.getElementById("eval-notes");
  const btnSaveEvaluation = document.getElementById("btn-save-evaluation");
  const btnResetEvalForm = document.getElementById("btn-reset-eval-form");
  const evaluationsSmallList = document.getElementById("evaluations-small-list");

  // Global State
  let activeStudentId = null;
  let students = [];
  let currentUserId = null;
  let currentUserName = "";
  let alertTimeout = null;

  // Set default date input to today
  function setDefaultDate() {
    const today = new Date().toISOString().split("T")[0];
    evalDate.value = today;
  }

  // Tampilkan Alert
  function showAlert(message, type) {
    // Hapus timer sebelumnya agar tidak menimpa alert baru
    if (alertTimeout) {
      clearTimeout(alertTimeout);
    }

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "block";
    
    // Auto scroll to top on alert
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Auto hide after 5s
    alertTimeout = setTimeout(() => {
      alertBox.style.display = "none";
      alertTimeout = null;
    }, 5000);
  }

  // Handle Logout menggunakan fungsi global dari auth.js
  btnLogout.addEventListener("click", async () => {
    await logout();
  });

  // Verify auth session & profile role
  try {
    const profile = await requireRole(["admin", "coach"]);
    if (!profile) return; // Jika tidak sah, requireRole me-redirect otomatis

    currentUserId = profile.id;
    currentUserName = profile.full_name;
    adminNameElement.textContent = currentUserName;
    adminRoleLabel.textContent = profile.role === "admin" ? "Administrator" : "Pelatih (Coach)";
    evalCoachDisplay.value = currentUserName;

    // Load initial data
    await loadParents();
    await loadStudents();

  } catch (err) {
    showAlert("Gagal memuat sesi: " + err.message, "danger");
  }

  // 1. Ambil list Parent untuk Dropdown Formulir Student
  async function loadParents() {
    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .eq("role", "parent")
        .order("full_name");

      if (error) throw error;

      studentParentSelect.innerHTML = `<option value="">-- Hubungkan ke Wali/Orang Tua --</option>`;
      data.forEach(parent => {
        const option = document.createElement("option");
        option.value = parent.id;
        option.textContent = parent.full_name;
        studentParentSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Gagal mengambil data orang tua:", err.message);
    }
  }

  // 2. Ambil list Students
  async function loadStudents() {
    studentsLoading.style.display = "block";
    studentListContainer.style.display = "none";
    try {
      const { data, error } = await supabaseClient
        .from("students")
        .select(`
          *,
          parent:profiles(id, full_name)
        `)
        .order("student_name");

      if (error) throw error;

      students = data || [];
      renderStudentsList(students);
      return true;

    } catch (err) {
      showAlert("Gagal mengambil data murid: " + err.message, "danger");
      students = []; // Kosongkan data basi agar tidak dipakai
      renderStudentsList(students);
      return false;
    } finally {
      studentsLoading.style.display = "none";
      studentListContainer.style.display = "flex";
    }
  }

  // 3. Merender list student di sidebar
  function renderStudentsList(filteredStudents) {
    studentListContainer.innerHTML = "";
    if (filteredStudents.length === 0) {
      studentListContainer.innerHTML = `<div style="text-align:center; color:#888; padding: 15px;">Murid tidak ditemukan</div>`;
      return;
    }

    filteredStudents.forEach(student => {
      const item = document.createElement("div");
      item.className = "student-list-item";
      if (student.id === activeStudentId) {
        item.classList.add("active");
      }

      const statusDot = student.is_active 
        ? `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--success-color);"></span>`
        : `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--danger-color);"></span>`;

      item.innerHTML = `
        <div>
          <div class="student-list-name">${student.student_name}</div>
          <div class="student-list-age">Usia: ${student.age} th | Wali: ${student.parent ? student.parent.full_name : '-'}</div>
        </div>
        ${statusDot}
      `;

      item.addEventListener("click", () => selectStudent(student.id));
      studentListContainer.appendChild(item);
    });
  }

  // Filter Search Student
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = students.filter(student => 
      student.student_name.toLowerCase().includes(query)
    );
    renderStudentsList(filtered);
  });

  // Switch to Form Register Student
  btnToggleAddStudent.addEventListener("click", () => {
    studentFormContainer.style.display = "block";
    mainDefaultState.style.display = "none";
    studentDetailContainer.style.display = "none";
    studentRegisterForm.reset();
    
    // Clear active selection visual
    document.querySelectorAll(".student-list-item").forEach(item => item.classList.remove("active"));
  });

  btnCancelStudent.addEventListener("click", () => {
    studentFormContainer.style.display = "none";
    if (activeStudentId) {
      studentDetailContainer.style.display = "block";
      // Highlight the selected item again
      loadStudents();
    } else {
      mainDefaultState.style.display = "block";
    }
  });

  // Helper membaca file sebagai Data URL
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Register Student Submit
  studentRegisterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("student-name").value.trim();
    const age = parseInt(document.getElementById("student-age").value);
    const parentId = studentParentSelect.value.trim();
    const photoFileInput = document.getElementById("student-photo-file");
    const photoUrlInput = document.getElementById("student-photo").value.trim();
    const isActive = document.getElementById("student-status").value === "true";

    const btnSave = document.getElementById("btn-save-student");
    btnSave.disabled = true;
    btnSave.textContent = "Menyimpan...";

    try {
      let photoUrl = photoUrlInput || null;

      // Jika ada file foto yang diunggah
      if (photoFileInput && photoFileInput.files && photoFileInput.files.length > 0) {
        const file = photoFileInput.files[0];
        btnSave.textContent = "Mengunggah Foto...";

        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from("student-photos")
            .upload(fileName, file, { cacheControl: "3600", upsert: true });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabaseClient
              .storage
              .from("student-photos")
              .getPublicUrl(fileName);

            if (urlData && urlData.publicUrl) {
              photoUrl = urlData.publicUrl;
            }
          } else {
            console.warn("Storage fallback to Data URL:", uploadError?.message);
            photoUrl = await readFileAsDataURL(file);
          }
        } catch (storageErr) {
          console.warn("Gagal upload storage, fallback Data URL:", storageErr.message);
          photoUrl = await readFileAsDataURL(file);
        }
      }

      btnSave.textContent = "Menyimpan Data...";

      const { data, error } = await supabaseClient
        .from("students")
        .insert({
          student_name: name,
          age: age,
          parent_id: parentId || null, // Nilai kosong diubah ke null agar tidak error UUID
          photo_url: photoUrl,
          is_active: isActive
        })
        .select()
        .single();

      if (error) throw error;

      showAlert("Data murid berhasil ditambahkan!", "success");
      studentRegisterForm.reset();
      studentFormContainer.style.display = "none";
      btnSave.disabled = false;
      btnSave.textContent = "Simpan Data Murid";
      
      // Auto-select murid baru
      activeStudentId = data.id;
      await loadStudents();
      selectStudent(data.id);

    } catch (err) {
      showAlert("Gagal menambah murid: " + err.message, "danger");
      btnSave.disabled = false;
      btnSave.textContent = "Simpan Data Murid";
    }
  });

  // 4. Pilih Murid & Tampilkan Detail
  async function selectStudent(studentId) {
    activeStudentId = studentId;

    // Highlight item di sidebar tanpa fetch ulang server
    renderStudentsList(students);

    // Hide views yang tidak relevan
    mainDefaultState.style.display = "none";
    studentFormContainer.style.display = "none";
    studentDetailContainer.style.display = "block";

    // Cari data student
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Tampilkan info detail
    detailStudentName.textContent = student.student_name;
    detailStudentMeta.textContent = `Usia: ${student.age} Tahun | Wali/Orang Tua: ${student.parent ? student.parent.full_name : 'Tidak terhubung'}`;
    
    if (student.photo_url) {
      detailStudentAvatar.innerHTML = `<img class="student-avatar" src="${student.photo_url}" style="margin-bottom:0;" alt="${student.student_name}">`;
    } else {
      detailStudentAvatar.innerHTML = `<div class="student-avatar" style="margin-bottom:0;">🏊‍♂️</div>`;
    }

    btnViewRaportFull.href = `raport.html?student_id=${studentId}`;

    // Reset Form Evaluasi ke State Baru
    resetEvaluationForm();

    // Ambil riwayat evaluasi untuk murid ini
    await loadEvaluationsForStudent(studentId);
  }

  // 5. Ambil dan Render Evaluasi Singkat Murid Aktif
  async function loadEvaluationsForStudent(studentId) {
    evaluationsSmallList.innerHTML = `<div class="spinner"></div>`;
    try {
      const { data, error } = await supabaseClient
        .from("evaluations")
        .select(`
          id,
          training_material,
          evaluation_result,
          notes,
          training_sessions (
            id,
            training_date,
            meeting_number,
            profiles (
              full_name
            )
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      evaluationsSmallList.innerHTML = "";
      if (data.length === 0) {
        evaluationsSmallList.innerHTML = `<p style="color:#777; font-style:italic; text-align:center; padding:15px;">Belum ada sesi evaluasi latihan.</p>`;
        evalMeetingNum.value = 1; // Default pertemuan pertama
        return;
      }

      // Auto-set next meeting number secara aman
      const maxMeeting = data.reduce((max, d) => {
        const num = d.training_sessions ? d.training_sessions.meeting_number : 0;
        return num > max ? num : max;
      }, 0);
      evalMeetingNum.value = maxMeeting + 1;

      data.forEach(item => {
        const session = item.training_sessions;
        const evalDateFormatted = new Date(session.training_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });

        const coachName = session.profiles ? session.profiles.full_name : "Pelatih";

        let resultClass = "";
        switch (item.evaluation_result) {
          case "Belum Bisa": resultClass = "eval-belum-bisa"; break;
          case "Mulai Berkembang": resultClass = "eval-mulai-berkembang"; break;
          case "Berkembang": resultClass = "eval-berkembang"; break;
          case "Sangat Baik": resultClass = "eval-sangat-baik"; break;
        }

        const notesSnippet = item.notes.length > 120 
          ? item.notes.substring(0, 120) + "..." 
          : item.notes;

        const card = document.createElement("div");
        card.className = "card";
        card.style.padding = "20px";
        card.style.marginBottom = "15px";

        card.innerHTML = `
          <div class="timeline-header" style="border:none; padding:0; margin-bottom:10px;">
            <strong style="color:var(--primary-color);">Pertemuan Ke-${session.meeting_number} - ${evalDateFormatted}</strong>
            <span class="badge badge-eval ${resultClass}">${item.evaluation_result}</span>
          </div>
          <div style="font-size:0.9rem; color:#666; margin-bottom:8px;">
            Pelatih: <strong>${coachName}</strong> | Materi: <strong>${item.training_material}</strong>
          </div>
          <p style="font-size:0.93rem; color:#444; font-style:italic; line-height:1.5; background:rgba(0,0,0,0.01); padding:10px; border-radius:5px; border-left: 3px solid var(--accent-color);">"${notesSnippet}"</p>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
            <button class="btn btn-secondary btn-small" onclick="editEvaluation('${item.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-small" onclick="deleteEvaluation('${item.id}')">🗑️ Hapus</button>
          </div>
        `;
        evaluationsSmallList.appendChild(card);
      });

    } catch (err) {
      evaluationsSmallList.innerHTML = `<p style="color:var(--danger-color);">Gagal memuat evaluasi: ${err.message}</p>`;
    }
  }

  // 6. Delete Student
  btnDeleteStudent.addEventListener("click", async () => {
    if (!activeStudentId) return;
    const student = students.find(s => s.id === activeStudentId);
    if (!student) return;

    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data murid "${student.student_name}"? Semua data sesi latihan dan riwayat evaluasi anak ini akan ikut terhapus permanen!`);
    if (!konfirmasi) return;

    try {
      const { error } = await supabaseClient
        .from("students")
        .delete()
        .eq("id", activeStudentId);

      if (error) throw error;

      showAlert("Data murid berhasil dihapus secara permanen.", "success");
      activeStudentId = null;
      studentDetailContainer.style.display = "none";
      mainDefaultState.style.display = "block";
      await loadStudents();

    } catch (err) {
      showAlert("Gagal menghapus murid: " + err.message, "danger");
    }
  });

  // 7. Save Evaluation (Insert atau Update)
  evaluationSubmitForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!activeStudentId) {
      showAlert("Tidak ada murid terpilih!", "danger");
      return;
    }

    const editId = evalEditId.value; // Jika ada isinya, berarti edit mode
    const dateVal = evalDate.value;
    const meetingVal = parseInt(evalMeetingNum.value);
    const materialVal = evalMaterial.value.trim();
    const resultVal = evalResult.value;
    const notesVal = evalNotes.value.trim();

    btnSaveEvaluation.disabled = true;
    btnSaveEvaluation.textContent = "Menyimpan...";

    try {
      if (editId) {
        // --- EDIT MODE ---
        // Dapatkan data evaluasi lama untuk mengambil session_id-nya
        const { data: oldEval, error: getOldError } = await supabaseClient
          .from("evaluations")
          .select("session_id")
          .eq("id", editId)
          .single();

        if (getOldError) throw getOldError;

        // 1. Update training session
        const { error: sessionUpdateError } = await supabaseClient
          .from("training_sessions")
          .update({
            training_date: dateVal,
            meeting_number: meetingVal
          })
          .eq("id", oldEval.session_id);

        if (sessionUpdateError) throw sessionUpdateError;

        // 2. Update evaluation
        const { error: evalUpdateError } = await supabaseClient
          .from("evaluations")
          .update({
            training_material: materialVal,
            evaluation_result: resultVal,
            notes: notesVal
          })
          .eq("id", editId);

        if (evalUpdateError) throw evalUpdateError;

        showAlert("Catatan evaluasi berhasil diperbarui!", "success");

      } else {
        // --- INSERT MODE ---
        // 1. Insert Sesi Latihan Baru
        const { data: newSession, error: sessionError } = await supabaseClient
          .from("training_sessions")
          .insert({
            student_id: activeStudentId,
            coach_id: currentUserId,
            training_date: dateVal,
            meeting_number: meetingVal
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // 2. Insert Hasil Evaluasi Baru
        const { error: evalError } = await supabaseClient
          .from("evaluations")
          .insert({
            session_id: newSession.id,
            student_id: activeStudentId,
            training_material: materialVal,
            evaluation_result: resultVal,
            notes: notesVal
          });

        if (evalError) throw evalError;

        showAlert("Evaluasi sesi latihan berhasil disimpan!", "success");
      }

      resetEvaluationForm();
      await loadEvaluationsForStudent(activeStudentId);

    } catch (err) {
      showAlert("Gagal menyimpan evaluasi: " + err.message, "danger");
    } finally {
      btnSaveEvaluation.disabled = false;
      btnSaveEvaluation.textContent = "Simpan Hasil Evaluasi";
    }
  });

  // Reset Form Evaluasi
  function resetEvaluationForm() {
    evalEditId.value = "";
    setDefaultDate();
    evalMaterial.value = "";
    evalResult.value = "Belum Bisa";
    evalNotes.value = "";
    
    btnSaveEvaluation.textContent = "Simpan Hasil Evaluasi";
    btnResetEvalForm.style.display = "none";
  }

  btnResetEvalForm.addEventListener("click", () => {
    resetEvaluationForm();
    // Kembalikan ke meeting number berikutnya
    loadEvaluationsForStudent(activeStudentId);
  });

  // --- FUNGSI GLOBAL DI WINDOW UNTUK EVENT BUTTON KARTU ---
  
  // 8. Edit Evaluation
  window.editEvaluation = async (evaluationId) => {
    try {
      const { data: item, error } = await supabaseClient
        .from("evaluations")
        .select(`
          id,
          training_material,
          evaluation_result,
          notes,
          training_sessions (
            training_date,
            meeting_number
          )
        `)
        .eq("id", evaluationId)
        .single();

      if (error) throw error;

      // Isi form evaluasi dengan data item
      evalEditId.value = item.id;
      evalDate.value = item.training_sessions.training_date;
      evalMeetingNum.value = item.training_sessions.meeting_number;
      evalMaterial.value = item.training_material;
      evalResult.value = item.evaluation_result;
      evalNotes.value = item.notes;

      // Ganti tombol UI
      btnSaveEvaluation.textContent = "Perbarui Hasil Evaluasi";
      btnResetEvalForm.style.display = "inline-flex";

      // Scroll form ke view
      document.getElementById("evaluation-form-container").scrollIntoView({ behavior: "smooth" });

    } catch (err) {
      showAlert("Gagal mengambil data evaluasi: " + err.message, "danger");
    }
  };

  // 9. Delete Evaluation
  window.deleteEvaluation = async (evaluationId) => {
    const konfirmasi = confirm("Apakah Anda yakin ingin menghapus data sesi evaluasi latihan ini secara permanen?");
    if (!konfirmasi) return;

    try {
      // Tarik session_id
      const { data: evalItem, error: getError } = await supabaseClient
        .from("evaluations")
        .select("session_id")
        .eq("id", evaluationId)
        .single();

      if (getError) throw getError;

      // Hapus training session (akan menghapus cascade evaluasi juga di DB)
      const { error: delError } = await supabaseClient
        .from("training_sessions")
        .delete()
        .eq("id", evalItem.session_id);

      if (delError) throw delError;

      showAlert("Data sesi evaluasi berhasil dihapus.", "success");
      await loadEvaluationsForStudent(activeStudentId);

    } catch (err) {
      showAlert("Gagal menghapus evaluasi: " + err.message, "danger");
    }
  };

});
