!function() {
  "use strict";

  function e(e, t) {
    let n = null;
    return function(...o) {
      clearTimeout(n), n = setTimeout(() => e.apply(this, o), t)
    }
  }
  window.EA_debounce = e;
  const t = function() {
    const e = localStorage.getItem("eduanalytics_current_user") || sessionStorage.getItem("eduanalytics_current_user");
    return e ? JSON.parse(e) : null
  }();

  function n(e) {
    return "Administrator" === e ? "Administrator" : "Student" === e ? "Student" : "Teacher" === e || "Coordinator" === e ? "Teacher" : "Guest"
  }
  const o = n(t ? t.role : "Guest");
  window.EA_currentUser = t, window.EA_role = o;
  const a = "eduanalytics_theme";
  !function() {
    const e = localStorage.getItem(a) || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", e)
  }();
  const r = {
      Administrator: [{
        id: "n1",
        icon: "🆕",
        text: "A new Teacher account just signed up.",
        time: "5m ago"
      }, {
        id: "n2",
        icon: "⚠️",
        text: '3 students are marked "At Risk" this week.',
        time: "1h ago"
      }, {
        id: "n3",
        icon: "🛠️",
        text: "System backup completed successfully.",
        time: "Yesterday"
      }],
      Teacher: [{
        id: "n1",
        icon: "📈",
        text: "Sara Malik's average score improved by 8%.",
        time: "20m ago"
      }, {
        id: "n2",
        icon: "📝",
        text: "You added a new student record.",
        time: "2h ago"
      }, {
        id: "n3",
        icon: "📅",
        text: "Report cards are due this Friday.",
        time: "Yesterday"
      }],
      Student: [{
        id: "n1",
        icon: "🏆",
        text: "Great job! Your Science score went up this term.",
        time: "1h ago"
      }, {
        id: "n2",
        icon: "📊",
        text: "Your latest performance report is ready.",
        time: "Yesterday"
      }, {
        id: "n3",
        icon: "👋",
        text: "Welcome to EduAnalytics! Complete your profile.",
        time: "2 days ago"
      }],
      Guest: [{
        id: "n1",
        icon: "👋",
        text: "Log in to see your personalized notifications.",
        time: ""
      }]
    },
    s = "eduanalytics_notifications_read_" + (t && t.email ? t.email.toLowerCase() : "guest");

  function i() {
    const e = document.querySelector(".nav-container");
    if (!e || document.getElementById("eaTopbarActions")) return;
    const n = document.getElementById("hamburger"),
      i = r[o] || [],
      l = function() {
        const e = sessionStorage.getItem(s);
        return e ? JSON.parse(e) : []
      }(),
      d = i.filter(e => !l.includes(e.id)).length,
      c = document.createElement("div");
    c.className = "topbar-actions", c.id = "eaTopbarActions", c.innerHTML = `
      <button type="button" class="theme-toggle-btn icon-btn" aria-pressed="false" aria-label="Switch to dark mode">🌙</button>
      <div class="notif-wrapper">
        <button type="button" class="icon-btn notif-bell-btn" id="notifBellBtn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications">
          🔔
          ${d>0?`<span class="notif-badge" id="notifBadge">${d}</span>`:""}
        </button>
        <div class="notification-panel" id="notificationPanel" role="menu" aria-hidden="true">
          <div class="notif-panel-header">
            <strong>Notifications</strong>
            <button type="button" class="notif-mark-read" id="notifMarkReadBtn">Mark all read</button>
          </div>
          <ul class="notif-list" id="notifList"></ul>
        </div>
      </div>
      ${t?`<span class="role-badge role-badge-${o.toLowerCase()}">${o}</span>`:""}
    `, n ? e.insertBefore(c, n) : e.appendChild(c);
    const u = c.querySelector("#notifList");
    0 === i.length ? u.innerHTML = '<li class="notif-empty">You\'re all caught up 🎉</li>' : u.innerHTML = i.map(e => `
        <li class="notif-item ${l.includes(e.id)?"":"unread"}">
          <span class="notif-icon">${e.icon}</span>
          <span class="notif-text">${e.text}${e.time?`<br><small>${e.time}</small>`:""}</span>
        </li>
      `).join("");
    const m = c.querySelector("#notifBellBtn"),
      p = c.querySelector("#notificationPanel");
    m.addEventListener("click", function(e) {
      e.stopPropagation();
      const t = p.classList.toggle("open");
      m.setAttribute("aria-expanded", t), p.setAttribute("aria-hidden", !t)
    }), document.addEventListener("click", function(e) {
      c.contains(e.target) || (p.classList.remove("open"), m.setAttribute("aria-expanded", "false"), p.setAttribute("aria-hidden", "true"))
    }), c.querySelector("#notifMarkReadBtn").addEventListener("click", function() {
      var e;
      e = i.map(e => e.id), sessionStorage.setItem(s, JSON.stringify(e)), c.querySelectorAll(".notif-item").forEach(e => e.classList.remove("unread"));
      const t = c.querySelector("#notifBadge");
      t && t.remove()
    });
    const h = c.querySelector(".theme-toggle-btn"),
      g = document.documentElement.getAttribute("data-theme") || "light";
    h.innerHTML = "dark" === g ? "☀️" : "🌙", h.setAttribute("aria-pressed", "dark" === g), h.addEventListener("click", function() {
      const e = "dark" === document.documentElement.getAttribute("data-theme") ? "light" : "dark";
      var t;
      t = e, document.documentElement.setAttribute("data-theme", t), localStorage.setItem(a, t), document.querySelectorAll(".theme-toggle-btn").forEach(e => {
        e.setAttribute("aria-pressed", "dark" === t), e.innerHTML = "dark" === t ? "☀️" : "🌙", e.setAttribute("aria-label", "dark" === t ? "Switch to light mode" : "Switch to dark mode")
      })
    })
  }
  const l = {
    Administrator: [{
      href: "dashboard.html",
      icon: "📊",
      label: "Overview"
    }, {
      href: "#userManagement",
      icon: "👥",
      label: "Manage Users"
    }, {
      href: "#addStudentForm",
      icon: "➕",
      label: "Add Student"
    }, {
      href: "#studentTable",
      icon: "🎓",
      label: "Student Records"
    }, {
      href: "report.html",
      icon: "📄",
      label: "Performance Reports"
    }, {
      href: "report-builder.html",
      icon: "🧾",
      label: "Report Builder"
    }, {
      href: "profile-settings.html",
      icon: "⚙️",
      label: "My Profile"
    }],
    Teacher: [{
      href: "dashboard.html",
      icon: "📊",
      label: "Overview"
    }, {
      href: "#addStudentForm",
      icon: "➕",
      label: "Add Student"
    }, {
      href: "#studentTable",
      icon: "🎓",
      label: "Student Records"
    }, {
      href: "report.html",
      icon: "📄",
      label: "Performance Reports"
    }, {
      href: "report-builder.html",
      icon: "🧾",
      label: "Report Builder"
    }, {
      href: "profile-settings.html",
      icon: "⚙️",
      label: "My Profile"
    }],
    Student: [{
      href: "dashboard.html",
      icon: "📊",
      label: "My Overview"
    }, {
      href: "#studentTable",
      icon: "🎓",
      label: "My Record"
    }, {
      href: "report.html",
      icon: "📄",
      label: "My Report"
    }, {
      href: "profile-settings.html",
      icon: "⚙️",
      label: "My Profile"
    }],
    Guest: [{
      href: "login.html",
      icon: "🔑",
      label: "Login to continue"
    }]
  };
  document.addEventListener("DOMContentLoaded", function() {
    document.body.setAttribute("data-role-view", o), i(), document.querySelectorAll("[data-role]").forEach(e => {
        const t = e.getAttribute("data-role").split(",").map(e => e.trim());
        e.style.display = t.includes(o) ? "" : "none"
      }),
      function() {
        const e = document.querySelector(".sidebar-menu");
        if (!e) return;
        const t = l[o] || l.Guest;
        e.innerHTML = t.map((e, t) => `
      <li><a href="${e.href}" class="${0===t?"active":""}">${e.icon} ${e.label}</a></li>
    `).join("")
      }(),
      function() {
        const e = document.getElementById("roleHeroMount");
        if (!e) return;
        const n = t ? t.name || t.email : "Guest",
          a = (new Date).getHours(),
          r = a < 12 ? "Good morning" : a < 18 ? "Good afternoon" : "Good evening",
          s = ("undefined" != typeof STUDENTS_DATA ? STUDENTS_DATA : []).map(e => {
            const t = getOverallScore(e);
            return Object.assign({
              score: t,
              status: getStatusFromScore(t)
            }, e)
          });
        let i = [];
        try {
          i = JSON.parse(localStorage.getItem("eduanalytics_users") || "[]")
        } catch (e) {}
        let l = "";
        if ("Administrator" === o) {
          const e = s.filter(e => "At Risk" === e.status).length;
          l = `<div class="role-hero-top">
      <div><h1>${r}, ${n} 🛡️</h1><p>Full system view — manage every user, teacher and student record.</p></div>
      <span class="role-chip">👑 Administrator</span></div>
      <div class="role-hero-stats">
        <div class="role-hero-stat"><strong>${i.length}</strong><span>Total Users</span></div>
        <div class="role-hero-stat"><strong>${s.length}</strong><span>Student Records</span></div>
        <div class="role-hero-stat"><strong>${e}</strong><span>Flagged At Risk</span></div>
      </div>`
        } else if ("Teacher" === o) {
          const e = s.filter(e => "Excellent" === e.status).length;
          l = `<div class="role-hero-top">
      <div><h1>${r}, ${n} 📚</h1><p>Your class at a glance — track progress, spot who needs help.</p></div>
      <span class="role-chip">🧑‍🏫 Teacher</span></div>
      <div class="role-hero-stats">
        <div class="role-hero-stat"><strong>${s.length}</strong><span>Students Tracked</span></div>
        <div class="role-hero-stat"><strong>${e}</strong><span>Top Performers</span></div>
      </div>`
        } else if ("Student" === o) {
          const e = s.find(e => (e.email || "").toLowerCase() === (t ? t.email.toLowerCase() : ""));
          l = `<div class="role-hero-top">
      <div><h1>${r}, ${n} 🎓</h1><p>${e?"Your personal performance snapshot for this term.":"Ask your teacher to link your record."}</p></div>
      <span class="role-chip">🎓 Student</span></div>
      ${e?`<div class="role-hero-stats">
        <div class="role-hero-stat"><strong>${e.score}%</strong><span>Avg. Score</span></div>
        <div class="role-hero-stat"><strong>${e.class||"—"}</strong><span>Class</span></div>
        <div class="role-hero-stat"><strong>${e.status}</strong><span>Status</span></div>
      </div>`:""}`
      } else l = '<div class="role-hero-top"><div><h1>Welcome 👋</h1><p>Log in to see your dashboard.</p></div>\n      <span class="role-chip">Guest</span></div>';
        e.className = "role-hero", e.innerHTML = l
      }(),
      function() {
        const o = document.getElementById("userManagementBody");
        if (!o) return;

        function a() {
          const e = localStorage.getItem("eduanalytics_users");
          return e ? JSON.parse(e) : []
        }

        function r(e) {
          const r = a(),
            s = (e || "").toLowerCase(),
            i = r.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
          0 !== i.length ? o.innerHTML = i.map(e => `
        <tr>
          <td data-label="Name">${e.name}</td>
          <td data-label="Email">${e.email}</td>
          <td data-label="Role"><span class="role-badge role-badge-${n(e.role).toLowerCase()}">${e.role}</span></td>
          <td data-label="Action">
            ${t&&e.email===t.email?'<span style="color:var(--text-muted); font-size:0.8rem;">(You)</span>':`<button type="button" class="btn-link user-remove-btn" data-email="${e.email}">Remove</button>`}
          </td>
        </tr>
      `).join("") : o.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No users found.</td></tr>'
        }
        r("");
        const s = document.getElementById("userManagementSearch");
        s && s.addEventListener("input", e(function() {
          r(s.value)
        }, 250)), o.addEventListener("click", function(e) {
          const t = e.target.closest(".user-remove-btn");
          if (!t) return;
          const n = t.getAttribute("data-email"),
            o = a().filter(e => e.email !== n);
          localStorage.setItem("eduanalytics_users", JSON.stringify(o)), r(s ? s.value : "")
        })
      }()
  })
}();