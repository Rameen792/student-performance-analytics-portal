/* ==========================================================================
   Student Performance Analytics Portal — Week 3
   Shared Student Dataset + Dynamic Rendering Engine
   Used by: dashboard.html, report.html, student-profile.html
   ========================================================================== */

const STUDENTS_DATA = [
  {
    id: 'STU-1001', name: 'Ayesha Khan', class: 'Grade 10',
    email: 'ayesha.khan@eduanalytics.edu', attendance: 96, joined: 'Aug 2023',
    subjects: { Mathematics: 95, Science: 90, English: 91, 'Computer Studies': 92 }
  },
  {
    id: 'STU-1002', name: 'Bilal Ahmed', class: 'Grade 9',
    email: 'bilal.ahmed@eduanalytics.edu', attendance: 88, joined: 'Jan 2024',
    subjects: { Mathematics: 70, Science: 75, English: 78, 'Computer Studies': 73 }
  },
  {
    id: 'STU-1003', name: 'Sara Malik', class: 'Grade 11',
    email: 'sara.malik@eduanalytics.edu', attendance: 79, joined: 'Sep 2022',
    subjects: { Mathematics: 55, Science: 60, English: 62, 'Computer Studies': 55 }
  },
  {
    id: 'STU-1004', name: 'Hamza Tariq', class: 'Grade 12',
    email: 'hamza.tariq@eduanalytics.edu', attendance: 94, joined: 'Aug 2021',
    subjects: { Mathematics: 90, Science: 85, English: 87, 'Computer Studies': 90 }
  },
  {
    id: 'STU-1005', name: 'Zainab Fatima', class: 'Grade 10',
    email: 'zainab.fatima@eduanalytics.edu', attendance: 85, joined: 'Mar 2023',
    subjects: { Mathematics: 65, Science: 70, English: 68, 'Computer Studies': 65 }
  }
];

/* ---- Helper Functions ---- */
function getOverallScore(student) {
  const vals = Object.values(student.subjects);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function getStatusFromScore(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Average';
  return 'At Risk';
}

function getStatusBadgeClass(status) {
  if (status === 'Excellent') return 'badge-success';
  if (status === 'Average') return 'badge-warning';
  return 'badge-danger';
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
/* ---- Shared: Edit & Delete overlay (used by dashboard, reports, profile) ---- */
const OVERRIDES_KEY = 'eduanalytics_student_overrides';
const DELETED_KEY = 'eduanalytics_deleted_students';

function getStudentOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveStudentOverrides(obj) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(obj));
}
function getDeletedStudentIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY)) || []; }
  catch (e) { return []; }
}
function saveDeletedStudentIds(arr) {
  localStorage.setItem(DELETED_KEY, JSON.stringify(arr));
}
function isStudentDeleted(id) {
  const clean = String(id).toLowerCase();
  return getDeletedStudentIds().some(function (d) { return String(d).toLowerCase() === clean; });
}
function applyStudentOverride(student) {
  const o = getStudentOverrides()[student.id];
  if (!o) return student;
  const merged = Object.assign({}, student, o);
  if (o.score != null && !o.subjects) {
    merged.subjects = { 'Overall Average': o.score };
  }
  return merged;
}
function deleteStudentEverywhere(id) {
  const ids = getDeletedStudentIds();
  if (!ids.some(function (d) { return String(d).toLowerCase() === String(id).toLowerCase(); })) {
    ids.push(id);
    saveDeletedStudentIds(ids);
  }
}
function updateStudentEverywhere(id, fields) {
  const overrides = getStudentOverrides();
  overrides[id] = Object.assign({}, overrides[id], fields);
  saveStudentOverrides(overrides);
}
function getGradeLetter(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

window.EA_isStudentDeleted = isStudentDeleted;
window.EA_applyStudentOverride = applyStudentOverride;
window.EA_deleteStudentEverywhere = deleteStudentEverywhere;
window.EA_updateStudentEverywhere = updateStudentEverywhere;
window.EA_getStudentOverrides = getStudentOverrides;

function getExtraStudentsRaw() {
  try { return JSON.parse(localStorage.getItem('eduanalytics_extra_students')) || []; }
  catch (e) { return []; }
}

function getCompletedExtraStudents() {
  // Includes BOTH students with a full subject-wise report AND students that
  // were just quick-added from the dashboard (score only, report not built
  // yet) — so every locally added student shows up in Reports right away.
  return getExtraStudentsRaw()
    .filter(function (s) { return !isStudentDeleted(s.id); })
    .map(function (s) {
      const hasFullReport = s.subjects && s.attendance != null;
      return applyStudentOverride({
        id: s.id, name: s.name, class: s.class,
        email: s.email || 'Not provided',
        attendance: hasFullReport ? s.attendance : null,
        joined: s.joined || 'Recently added',
        subjects: hasFullReport ? s.subjects : { 'Overall Average': s.score },
        reportComplete: hasFullReport
      });
    });
}

function getStudentById(id) {
  const clean = String(id).toLowerCase();
  if (isStudentDeleted(clean)) return null;

  const fromBase = STUDENTS_DATA.find(s => s.id.toLowerCase() === clean);
  if (fromBase) return applyStudentOverride(Object.assign({ reportComplete: true }, fromBase));

  const extra = getExtraStudentsRaw().find(s => s.id.toLowerCase() === clean);
  if (!extra) return null;

  if (extra.subjects && extra.attendance != null) {
    return applyStudentOverride({
      id: extra.id, name: extra.name, class: extra.class,
      email: extra.email || 'Not provided',
      attendance: extra.attendance, joined: extra.joined || 'Recently added',
      subjects: extra.subjects, reportComplete: true, isManuallyAdded: true
    });
  }

  return applyStudentOverride({
    id: extra.id, name: extra.name, class: extra.class,
    email: extra.email || 'Not provided',
    attendance: null, joined: 'Recently added',
    subjects: { 'Overall Average': extra.score },
    reportComplete: false, isManuallyAdded: true
  });
}

/* ---- 1. Dashboard: Render Student Table Dynamically ---- */
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  tbody.innerHTML = STUDENTS_DATA
    .filter(rawStudent => !isStudentDeleted(rawStudent.id))
    .map(rawStudent => {
    const student = applyStudentOverride(rawStudent);
    const score = getOverallScore(student);
    const status = getStatusFromScore(score);
    const badgeClass = getStatusBadgeClass(status);

    return `
      <tr data-class="${student.class}" data-status="${status}" data-score="${score}" data-email="${student.email.toLowerCase()}">
        <td data-label="Roll No.">${student.id}</td>
        <td data-label="Name">${student.name}</td>
        <td data-label="Class">${student.class}</td>
        <td data-label="Avg. Score">${score}%</td>
        <td data-label="Status"><span class="badge ${badgeClass}">${status}</span></td>
        <td data-label="Action"><a href="student-profile.html?id=${student.id}" class="btn-link">View Profile →</a></td>
      </tr>`;
  }).join('');
}

/* ---- 2. Reports Page: Render Performance Cards Dynamically ---- */
function renderPerformanceCards(filterFn) {
  const grid = document.getElementById('performanceCardsGrid');
  if (!grid) return;

 const allStudents = STUDENTS_DATA
    .filter(function (s) { return !isStudentDeleted(s.id); })
    .map(applyStudentOverride)
    .concat(getCompletedExtraStudents());
  const list = typeof filterFn === 'function' ? allStudents.filter(filterFn) : allStudents;

  if (list.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:var(--text-muted); grid-column:1/-1; padding:30px 0;">No students match the current filters.</p>`;
    return;
  }

  grid.innerHTML = list.map(student => {
    const score = getOverallScore(student);
    const status = getStatusFromScore(score);
    const badgeClass = getStatusBadgeClass(status);

    const subjectBars = Object.entries(student.subjects).map(([subject, val]) => `
      <div class="subject-bar-row">
        <span class="subject-label">${subject}</span>
        <div class="mini-bar"><div class="mini-bar-fill" style="width:${val}%;"></div></div>
        <span class="subject-value">${val}%</span>
      </div>`).join('');

    return `
      <div class="performance-card reveal in-view">
        <div class="performance-card-header">
          <div class="avatar-circle">${getInitials(student.name)}</div>
          <div>
            <h3>${student.name}</h3>
            <p>${student.class} &bull; ${student.id}</p>
          </div>
        </div>

        <div class="progress-ring" style="--pct:${score};">
          <div class="progress-ring-inner">
            <strong>${score}%</strong>
            <span class="badge ${badgeClass}">${status}</span>
          </div>
        </div>

        <div class="subject-bars">${subjectBars}</div>

        <a href="student-profile.html?id=${student.id}" class="btn btn-outline btn-sm" style="width:100%; text-align:center; margin-top:14px; display:block;">View Full Profile</a>
      </div>`;
  }).join('');
}

/* ---- 3. Student Profile Page: Render Dynamically from URL ?id= ---- */
function renderStudentProfile() {
  const container = document.getElementById('profileContainer');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const student = id ? getStudentById(id) : null;

  if (!student) {
    container.innerHTML = `
      <div class="profile-not-found">
        <div class="auth-icon" style="margin:0 auto 16px;">🔍</div>
        <h2>Student Not Found</h2>
        <p>We couldn't find a profile for "<strong>${id || 'unknown'}</strong>". This demo includes full profiles for STU-1001 to STU-1005.</p>
        <a href="dashboard.html" class="btn btn-primary" style="margin-top:20px; display:inline-block;">← Back to Dashboard</a>
      </div>`;
    return;
  }
  if (student.reportComplete === false) {
    container.innerHTML = `
      <div class="profile-not-found">
        <div class="auth-icon" style="margin:0 auto 16px;">📝</div>
        <h2>${student.name}'s Report Isn't Ready Yet</h2>
        <p>Basic info was saved, but the full subject-wise report hasn't been filled in.</p>
        <a href="report-builder.html?id=${student.id}" class="btn btn-primary" style="margin-top:20px; display:inline-block;">Complete Report →</a>
        <a href="dashboard.html" class="btn btn-outline" style="margin-top:20px; margin-left:10px; display:inline-block;">← Back to Dashboard</a>
      </div>`;
    return;
  }

  const score = getOverallScore(student);
  const status = getStatusFromScore(score);
  const badgeClass = getStatusBadgeClass(status);

  const subjectBars = Object.entries(student.subjects).map(([subject, val]) => `
    <div class="subject-bar-row">
      <span class="subject-label">${subject}</span>
      <div class="mini-bar"><div class="mini-bar-fill" data-target="${val}"></div></div>
      <span class="subject-value">${val}%</span>
    </div>`).join('');

  container.innerHTML = `
    <div class="profile-header">
      <div class="avatar-circle avatar-lg">${getInitials(student.name)}</div>
      <div class="profile-header-info">
        <h1>${student.name}</h1>
        <p>${student.class} &bull; Roll No: ${student.id}</p>
        <p>${student.email}</p>
        <span class="badge ${badgeClass}">${status} Performer</span>
        ${student.isManuallyAdded ? '<p style="color:var(--text-muted); font-size:0.85rem; margin-top:6px;">📝 Manually added — full subject-wise breakdown not available yet, only overall average.</p>' : ''}
      </div>
    </div>

    <div class="stats-grid profile-stats-grid">
      <div class="stat-card"><div class="stat-icon">📊</div><h3>${score}%</h3><p>Overall Average</p></div>
      <div class="stat-card"><div class="stat-icon">📅</div><h3>${student.attendance != null ? student.attendance + '%' : '—'}</h3><p>Attendance</p></div>
      <div class="stat-card"><div class="stat-icon">📚</div><h3>${Object.keys(student.subjects).length}</h3><p>Enrolled Subjects</p></div>
      <div class="stat-card"><div class="stat-icon">🗓️</div><h3>${student.joined}</h3><p>Joined</p></div>
    </div>

    <h2 style="margin:36px 0 16px;">Subject-Wise Performance</h2>
    <div class="form-container subject-bars" style="max-width:100%;">
      ${subjectBars}
    </div>

    <a href="dashboard.html" class="btn btn-outline" style="margin-top:30px; display:inline-block;">← Back to Dashboard</a>`;

  // Animate the subject bars filling in after render
  requestAnimationFrame(() => {
    document.querySelectorAll('.mini-bar-fill[data-target]').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.getAttribute('data-target') + '%'; }, 150);
    });
  });
}

/* ---- 4. Reports Page: Keep the static Table View in sync with Add/Edit/Delete ---- */
function syncReportTableView() {
  const tbody = document.querySelector('#reportTable tbody');
  if (!tbody) return;

  tbody.querySelectorAll('tr[data-id]').forEach(function (row) {
    const id = row.getAttribute('data-id');
    if (isStudentDeleted(id)) { row.remove(); return; }
    const o = getStudentOverrides()[id];
    if (o) {
      if (o.name) row.children[1].textContent = o.name;
      if (o.class) { row.children[2].textContent = o.class; row.setAttribute('data-class', o.class); }
    }
  });

  const extraRowsHtml = getCompletedExtraStudents().map(function (student) {
    const score = getOverallScore(student);
    const status = getStatusFromScore(score);
    const badgeClass = getStatusBadgeClass(status);
    const subjectLabel = student.reportComplete ? Object.keys(student.subjects)[0] : 'Overall Average';
    const barColor = status === 'Excellent' ? '' : (status === 'Average' ? 'background:var(--accent-color);' : 'background:var(--danger-color);');
    return '<tr data-id="' + student.id + '" data-class="' + student.class + '" data-subject="' + subjectLabel + '">' +
      '<td>' + student.id + '</td><td>' + student.name + '</td><td>' + student.class + '</td>' +
      '<td>' + subjectLabel + '</td><td>' + score + '%</td>' +
      '<td><span class="badge ' + badgeClass + '">' + getGradeLetter(score) + '</span></td>' +
      '<td><div class="progress-bar"><div class="progress-fill" style="width:' + score + '%; ' + barColor + '"></div></div></td>' +
      '</tr>';
  }).join('');

  tbody.insertAdjacentHTML('beforeend', extraRowsHtml);
}

/* Auto-run: each function safely no-ops if its target container isn't on the current page */
renderStudentsTable();
renderPerformanceCards();
renderStudentProfile();
syncReportTableView();