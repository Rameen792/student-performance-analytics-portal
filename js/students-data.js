const STUDENTS_DATA = [{
  id: "STU-1001",
  name: "Ayesha Khan",
  class: "Grade 10",
  email: "ayesha.khan@eduanalytics.edu",
  attendance: 96,
  joined: "Aug 2023",
  subjects: {
    Mathematics: 95,
    Science: 90,
    English: 91,
    "Computer Studies": 92
  }
}, {
  id: "STU-1002",
  name: "Bilal Ahmed",
  class: "Grade 9",
  email: "bilal.ahmed@eduanalytics.edu",
  attendance: 88,
  joined: "Jan 2024",
  subjects: {
    Mathematics: 70,
    Science: 75,
    English: 78,
    "Computer Studies": 73
  }
}, {
  id: "STU-1003",
  name: "Sara Malik",
  class: "Grade 11",
  email: "sara.malik@eduanalytics.edu",
  attendance: 79,
  joined: "Sep 2022",
  subjects: {
    Mathematics: 55,
    Science: 60,
    English: 62,
    "Computer Studies": 55
  }
}, {
  id: "STU-1004",
  name: "Hamza Tariq",
  class: "Grade 12",
  email: "hamza.tariq@eduanalytics.edu",
  attendance: 94,
  joined: "Aug 2021",
  subjects: {
    Mathematics: 90,
    Science: 85,
    English: 87,
    "Computer Studies": 90
  }
}, {
  id: "STU-1005",
  name: "Zainab Fatima",
  class: "Grade 10",
  email: "zainab.fatima@eduanalytics.edu",
  attendance: 85,
  joined: "Mar 2023",
  subjects: {
    Mathematics: 65,
    Science: 70,
    English: 68,
    "Computer Studies": 65
  }
}];

function getOverallScore(e) {
  const t = Object.values(e.subjects);
  return Math.round(t.reduce((e, t) => e + t, 0) / t.length)
}

function getStatusFromScore(e) {
  return e >= 80 ? "Excellent" : e >= 60 ? "Average" : "At Risk"
}

function getStatusBadgeClass(e) {
  return "Excellent" === e ? "badge-success" : "Average" === e ? "badge-warning" : "badge-danger"
}

function getInitials(e) {
  return e.split(" ").map(e => e[0]).join("").substring(0, 2).toUpperCase()
}
const OVERRIDES_KEY = "eduanalytics_student_overrides",
  DELETED_KEY = "eduanalytics_deleted_students";

function getStudentOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}
  } catch (e) {
    return {}
  }
}

function saveStudentOverrides(e) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(e))
}

function getDeletedStudentIds() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY)) || []
  } catch (e) {
    return []
  }
}

function saveDeletedStudentIds(e) {
  localStorage.setItem(DELETED_KEY, JSON.stringify(e))
}

function isStudentDeleted(e) {
  const t = String(e).toLowerCase();
  return getDeletedStudentIds().some(function(e) {
    return String(e).toLowerCase() === t
  })
}

function applyStudentOverride(e) {
  const t = getStudentOverrides()[e.id];
  if (!t) return e;
  const n = Object.assign({}, e, t);
  return null == t.score || t.subjects || (n.subjects = {
    "Overall Average": t.score
  }), n
}

function deleteStudentEverywhere(e) {
  const t = getDeletedStudentIds();
  t.some(function(t) {
    return String(t).toLowerCase() === String(e).toLowerCase()
  }) || (t.push(e), saveDeletedStudentIds(t))
}

function updateStudentEverywhere(e, t) {
  const n = getStudentOverrides();
  n[e] = Object.assign({}, n[e], t), saveStudentOverrides(n)
}

function getGradeLetter(e) {
  return e >= 90 ? "A+" : e >= 80 ? "A" : e >= 70 ? "B+" : e >= 60 ? "B" : e >= 50 ? "C" : "D"
}

function undeleteStudent(e) {
  saveDeletedStudentIds(getDeletedStudentIds().filter(function(t) {
    return String(t).toLowerCase() !== String(e).toLowerCase()
  }))
}

function getExtraStudentsRaw() {
  try {
    return JSON.parse(localStorage.getItem("eduanalytics_extra_students")) || []
  } catch (e) {
    return []
  }
}

function getCompletedExtraStudents() {
  return getExtraStudentsRaw().filter(function(e) {
    return !isStudentDeleted(e.id)
  }).map(function(e) {
    const t = e.subjects && null != e.attendance;
    return applyStudentOverride({
      id: e.id,
      name: e.name,
      class: e.class,
      email: e.email || "Not provided",
      attendance: t ? e.attendance : null,
      joined: e.joined || "Recently added",
      subjects: t ? e.subjects : {
        "Overall Average": e.score
      },
      reportComplete: t
    })
  })
}

function getStudentById(e) {
  const t = String(e).toLowerCase();
  if (isStudentDeleted(t)) return null;
  const n = STUDENTS_DATA.find(e => e.id.toLowerCase() === t);
  if (n) return applyStudentOverride(Object.assign({
    reportComplete: !0
  }, n));
  const a = getExtraStudentsRaw().find(e => e.id.toLowerCase() === t);
  return a ? a.subjects && null != a.attendance ? applyStudentOverride({
    id: a.id,
    name: a.name,
    class: a.class,
    email: a.email || "Not provided",
    attendance: a.attendance,
    joined: a.joined || "Recently added",
    subjects: a.subjects,
    reportComplete: !0,
    isManuallyAdded: !0
  }) : applyStudentOverride({
    id: a.id,
    name: a.name,
    class: a.class,
    email: a.email || "Not provided",
    attendance: null,
    joined: "Recently added",
    subjects: {
      "Overall Average": a.score
    },
    reportComplete: !1,
    isManuallyAdded: !0
  }) : null
}

function renderStudentsTable() {
  const e = document.getElementById("studentsTableBody");
  e && (e.innerHTML = STUDENTS_DATA.filter(e => !isStudentDeleted(e.id)).map(e => {
    const t = applyStudentOverride(e),
      n = getOverallScore(t),
      a = getStatusFromScore(n),
      s = getStatusBadgeClass(a);
    return `
      <tr data-class="${t.class}" data-status="${a}" data-score="${n}" data-email="${t.email.toLowerCase()}">
        <td data-label="Roll No.">${t.id}</td>
        <td data-label="Name">${t.name}</td>
        <td data-label="Class">${t.class}</td>
        <td data-label="Avg. Score">${n}%</td>
        <td data-label="Status"><span class="badge ${s}">${a}</span></td>
        <td data-label="Action"><a href="student-profile.html?id=${t.id}" class="btn-link">View Profile →</a></td>
      </tr>`
  }).join(""))
}

function renderPerformanceCards(e) {
  const t = document.getElementById("performanceCardsGrid");
  if (!t) return;
  const n = STUDENTS_DATA.filter(function(e) {
      return !isStudentDeleted(e.id)
    }).map(applyStudentOverride).concat(getCompletedExtraStudents()),
    a = "function" == typeof e ? n.filter(e) : n;
  0 !== a.length ? t.innerHTML = a.map(e => {
    const t = getOverallScore(e),
      n = getStatusFromScore(t),
      a = getStatusBadgeClass(n),
      s = Object.entries(e.subjects).map(([e, t]) => `
      <div class="subject-bar-row">
        <span class="subject-label">${e}</span>
        <div class="mini-bar"><div class="mini-bar-fill" style="width:${t}%;"></div></div>
        <span class="subject-value">${t}%</span>
      </div>`).join("");
    return `
      <div class="performance-card reveal in-view">
        <div class="performance-card-header">
          <div class="avatar-circle">${getInitials(e.name)}</div>
          <div>
            <h3>${e.name}</h3>
            <p>${e.class} &bull; ${e.id}</p>
          </div>
        </div>

        <div class="progress-ring" style="--pct:${t};">
          <div class="progress-ring-inner">
            <strong>${t}%</strong>
            <span class="badge ${a}">${n}</span>
          </div>
        </div>

        <div class="subject-bars">${s}</div>

        <a href="student-profile.html?id=${e.id}" class="btn btn-outline btn-sm" style="width:100%; text-align:center; margin-top:14px; display:block;">View Full Profile</a>
      </div>`
  }).join("") : t.innerHTML = '<p style="text-align:center; color:var(--text-muted); grid-column:1/-1; padding:30px 0;">No students match the current filters.</p>'
}

function renderStudentProfile() {
  const e = document.getElementById("profileContainer");
  if (!e) return;
  const t = new URLSearchParams(window.location.search).get("id"),
    n = t ? getStudentById(t) : null;
  if (!n) return void(e.innerHTML = `
      <div class="profile-not-found">
        <div class="auth-icon" style="margin:0 auto 16px;">🔍</div>
        <h2>Student Not Found</h2>
        <p>We couldn't find a profile for "<strong>${t||"unknown"}</strong>". This demo includes full profiles for STU-1001 to STU-1005.</p>
        <a href="dashboard.html" class="btn btn-primary" style="margin-top:20px; display:inline-block;">← Back to Dashboard</a>
      </div>`);
  if (!1 === n.reportComplete) return void(e.innerHTML = `
      <div class="profile-not-found">
        <div class="auth-icon" style="margin:0 auto 16px;">📝</div>
        <h2>${n.name}'s Report Isn't Ready Yet</h2>
        <p>Basic info was saved, but the full subject-wise report hasn't been filled in.</p>
        <a href="report-builder.html?id=${n.id}" class="btn btn-primary" style="margin-top:20px; display:inline-block;">Complete Report →</a>
        <a href="dashboard.html" class="btn btn-outline" style="margin-top:20px; margin-left:10px; display:inline-block;">← Back to Dashboard</a>
      </div>`);
  const a = getOverallScore(n),
    s = getStatusFromScore(a),
    d = getStatusBadgeClass(s),
    r = Object.entries(n.subjects).map(([e, t]) => `
    <div class="subject-bar-row">
      <span class="subject-label">${e}</span>
      <div class="mini-bar"><div class="mini-bar-fill" data-target="${t}"></div></div>
      <span class="subject-value">${t}%</span>
    </div>`).join("");
  e.innerHTML = `
    <div class="profile-header">
      <div class="avatar-circle avatar-lg">${getInitials(n.name)}</div>
      <div class="profile-header-info">
        <h1>${n.name}</h1>
        <p>${n.class} &bull; Roll No: ${n.id}</p>
        <p>${n.email}</p>
        <span class="badge ${d}">${s} Performer</span>
        ${n.isManuallyAdded?'<p style="color:var(--text-muted); font-size:0.85rem; margin-top:6px;">📝 Manually added — full subject-wise breakdown not available yet, only overall average.</p>':""}
      </div>
    </div>

    <div class="stats-grid profile-stats-grid">
      <div class="stat-card"><div class="stat-icon">📊</div><h3>${a}%</h3><p>Overall Average</p></div>
      <div class="stat-card"><div class="stat-icon">📅</div><h3>${null!=n.attendance?n.attendance+"%":"—"}</h3><p>Attendance</p></div>
      <div class="stat-card"><div class="stat-icon">📚</div><h3>${Object.keys(n.subjects).length}</h3><p>Enrolled Subjects</p></div>
      <div class="stat-card"><div class="stat-icon">🗓️</div><h3>${n.joined}</h3><p>Joined</p></div>
    </div>

    <h2 style="margin:36px 0 16px;">Subject-Wise Performance</h2>
    <div class="form-container subject-bars" style="max-width:100%;">
      ${r}
    </div>

    <a href="dashboard.html" class="btn btn-outline" style="margin-top:30px; display:inline-block;">← Back to Dashboard</a>`, requestAnimationFrame(() => {
    document.querySelectorAll(".mini-bar-fill[data-target]").forEach(e => {
      setTimeout(() => {
        e.style.width = e.getAttribute("data-target") + "%"
      }, 150)
    })
  })
}

function syncReportTableView() {
  const e = document.querySelector("#reportTable tbody");
  if (!e) return;
  e.querySelectorAll("tr[data-id]").forEach(function(e) {
    const t = e.getAttribute("data-id");
    if (isStudentDeleted(t)) return void e.remove();
    const n = getStudentOverrides()[t];
    n && (n.name && (e.children[1].textContent = n.name), n.class && (e.children[2].textContent = n.class, e.setAttribute("data-class", n.class)))
  });
  const t = getCompletedExtraStudents().map(function(e) {
    const t = getOverallScore(e),
      n = getStatusFromScore(t),
      a = getStatusBadgeClass(n),
      s = e.reportComplete ? Object.keys(e.subjects)[0] : "Overall Average",
      d = "Excellent" === n ? "" : "Average" === n ? "background:var(--accent-color);" : "background:var(--danger-color);";
    return '<tr data-id="' + e.id + '" data-class="' + e.class + '" data-subject="' + s + '"><td>' + e.id + "</td><td>" + e.name + "</td><td>" + e.class + "</td><td>" + s + "</td><td>" + t + '%</td><td><span class="badge ' + a + '">' + getGradeLetter(t) + '</span></td><td><div class="progress-bar"><div class="progress-fill" style="width:' + t + "%; " + d + '"></div></div></td></tr>'
  }).join("");
  e.insertAdjacentHTML("beforeend", t)
}
window.EA_isStudentDeleted = isStudentDeleted, window.EA_applyStudentOverride = applyStudentOverride, window.EA_deleteStudentEverywhere = deleteStudentEverywhere, window.EA_undeleteStudent = undeleteStudent, window.EA_updateStudentEverywhere = updateStudentEverywhere, window.EA_getStudentOverrides = getStudentOverrides, renderStudentsTable(), renderPerformanceCards(), renderStudentProfile(), syncReportTableView();