/* ==========================================================================
   WEEK 4: Role-Based Dashboard, Dark/Light Mode, Notification Panel
   Injects topbar controls into the existing navbar, applies role-based
   visibility, renders the sidebar menu per role, and runs the notification
   panel + admin user-management widget (dashboard.html only).
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     0. SMALL PERF HELPER — debounce
     Stops a function firing on every keystroke; only runs once
     the user pauses typing. Used for search inputs.
  --------------------------------------------------------- */
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  window.EA_debounce = debounce; // exposed so script.js can reuse it later if needed

  /* ---------------------------------------------------------
     1. CURRENT USER + ROLE HELPERS
  --------------------------------------------------------- */
  function getCurrentUser() {
    const raw = localStorage.getItem('eduanalytics_current_user') ||
                sessionStorage.getItem('eduanalytics_current_user');
    return raw ? JSON.parse(raw) : null;
  }

  const currentUser = getCurrentUser();
  const currentRole = currentUser ? currentUser.role : 'Guest';

  // Normalize odd/legacy roles (e.g. "Coordinator") into one of the 3 core roles
  function normalizeRole(role) {
    if (role === 'Administrator') return 'Administrator';
    if (role === 'Student') return 'Student';
    if (role === 'Teacher' || role === 'Coordinator') return 'Teacher';
    return 'Guest';
  }
  const ROLE = normalizeRole(currentRole);
  // Week 5: expose the resolved user/role so js/dashboard-week5.js can build
  // its own role-scoped student list without re-reading localStorage.
  window.EA_currentUser = currentUser;
  window.EA_role = ROLE;

  /* ---------------------------------------------------------
     2. DARK / LIGHT MODE
  --------------------------------------------------------- */
  const THEME_KEY = 'eduanalytics_theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('aria-pressed', theme === 'dark');
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
  }
  initTheme(); // runs immediately so page never "flashes" the wrong theme

  /* ---------------------------------------------------------
     3. SAMPLE NOTIFICATIONS (per role, demo data)
  --------------------------------------------------------- */
  const NOTIFICATIONS_BY_ROLE = {
    Administrator: [
      { id: 'n1', icon: '🆕', text: 'A new Teacher account just signed up.', time: '5m ago' },
      { id: 'n2', icon: '⚠️', text: '3 students are marked "At Risk" this week.', time: '1h ago' },
      { id: 'n3', icon: '🛠️', text: 'System backup completed successfully.', time: 'Yesterday' }
    ],
    Teacher: [
      { id: 'n1', icon: '📈', text: 'Sara Malik\'s average score improved by 8%.', time: '20m ago' },
      { id: 'n2', icon: '📝', text: 'You added a new student record.', time: '2h ago' },
      { id: 'n3', icon: '📅', text: 'Report cards are due this Friday.', time: 'Yesterday' }
    ],
    Student: [
      { id: 'n1', icon: '🏆', text: 'Great job! Your Science score went up this term.', time: '1h ago' },
      { id: 'n2', icon: '📊', text: 'Your latest performance report is ready.', time: 'Yesterday' },
      { id: 'n3', icon: '👋', text: 'Welcome to EduAnalytics! Complete your profile.', time: '2 days ago' }
    ],
    Guest: [
      { id: 'n1', icon: '👋', text: 'Log in to see your personalized notifications.', time: '' }
    ]
  };

const READ_KEY = 'eduanalytics_notifications_read_' + (currentUser && currentUser.email ? currentUser.email.toLowerCase() : 'guest');
  function getReadIds() {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  function markAllRead(ids) {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  }

  /* ---------------------------------------------------------
     4. INJECT TOPBAR CONTROLS (theme toggle + bell + avatar)
     Runs on every page that includes this script + has .navbar
  --------------------------------------------------------- */
  function injectTopbarControls() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer || document.getElementById('eaTopbarActions')) return;

    const hamburger = document.getElementById('hamburger');
    const notifications = NOTIFICATIONS_BY_ROLE[ROLE] || [];
    const readIds = getReadIds();
    const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

    const wrap = document.createElement('div');
    wrap.className = 'topbar-actions';
    wrap.id = 'eaTopbarActions';
    wrap.innerHTML = `
      <button type="button" class="theme-toggle-btn icon-btn" aria-pressed="false" aria-label="Switch to dark mode">🌙</button>
      <div class="notif-wrapper">
        <button type="button" class="icon-btn notif-bell-btn" id="notifBellBtn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications">
          🔔
          ${unreadCount > 0 ? `<span class="notif-badge" id="notifBadge">${unreadCount}</span>` : ''}
        </button>
        <div class="notification-panel" id="notificationPanel" role="menu" aria-hidden="true">
          <div class="notif-panel-header">
            <strong>Notifications</strong>
            <button type="button" class="notif-mark-read" id="notifMarkReadBtn">Mark all read</button>
          </div>
          <ul class="notif-list" id="notifList"></ul>
        </div>
      </div>
      ${currentUser ? `<span class="role-badge role-badge-${ROLE.toLowerCase()}">${ROLE}</span>` : ''}
    `;

    if (hamburger) {
      navContainer.insertBefore(wrap, hamburger);
    } else {
      navContainer.appendChild(wrap);
    }

    // Render notification list
    const list = wrap.querySelector('#notifList');
    if (notifications.length === 0) {
      list.innerHTML = `<li class="notif-empty">You're all caught up 🎉</li>`;
    } else {
      list.innerHTML = notifications.map(n => `
        <li class="notif-item ${readIds.includes(n.id) ? '' : 'unread'}">
          <span class="notif-icon">${n.icon}</span>
          <span class="notif-text">${n.text}${n.time ? `<br><small>${n.time}</small>` : ''}</span>
        </li>
      `).join('');
    }

    // Bell toggle
    const bellBtn = wrap.querySelector('#notifBellBtn');
    const panel = wrap.querySelector('#notificationPanel');
    bellBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = panel.classList.toggle('open');
      bellBtn.setAttribute('aria-expanded', isOpen);
      panel.setAttribute('aria-hidden', !isOpen);
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) {
        panel.classList.remove('open');
        bellBtn.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
      }
    });

    // Mark all read
    wrap.querySelector('#notifMarkReadBtn').addEventListener('click', function () {
      markAllRead(notifications.map(n => n.id));
      wrap.querySelectorAll('.notif-item').forEach(li => li.classList.remove('unread'));
      const badge = wrap.querySelector('#notifBadge');
      if (badge) badge.remove();
    });

    // Theme toggle
    const themeBtn = wrap.querySelector('.theme-toggle-btn');
    const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
    themeBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.setAttribute('aria-pressed', savedTheme === 'dark');
    themeBtn.addEventListener('click', function () {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  /* ---------------------------------------------------------
     5. ROLE-BASED VISIBILITY
     Any element with data-role="Administrator,Teacher" is shown
     ONLY to those roles; hidden for everyone else.
  --------------------------------------------------------- */
  function applyRoleVisibility() {
    document.querySelectorAll('[data-role]').forEach(el => {
      const allowed = el.getAttribute('data-role').split(',').map(r => r.trim());
      el.style.display = allowed.includes(ROLE) ? '' : 'none';
    });
  }

  /* ---------------------------------------------------------
     6. ROLE-AWARE SIDEBAR MENU
  --------------------------------------------------------- */
  const SIDEBAR_MENUS = {
    Administrator: [
      { href: 'dashboard.html', icon: '📊', label: 'Overview' },
      { href: '#userManagement', icon: '👥', label: 'Manage Users' },
      { href: '#addStudentForm', icon: '➕', label: 'Add Student' },
      { href: '#studentTable', icon: '🎓', label: 'Student Records' },
      { href: 'report.html', icon: '📄', label: 'Performance Reports' },
      { href: 'profile-settings.html', icon: '⚙️', label: 'My Profile' }
    ],
    Teacher: [
      { href: 'dashboard.html', icon: '📊', label: 'Overview' },
      { href: '#addStudentForm', icon: '➕', label: 'Add Student' },
      { href: '#studentTable', icon: '🎓', label: 'Student Records' },
      { href: 'report.html', icon: '📄', label: 'Performance Reports' },
      { href: 'profile-settings.html', icon: '⚙️', label: 'My Profile' }
    ],
    Student: [
      { href: 'dashboard.html', icon: '📊', label: 'My Overview' },
      { href: '#studentTable', icon: '🎓', label: 'My Record' },
      { href: 'report.html', icon: '📄', label: 'My Report' },
      { href: 'profile-settings.html', icon: '⚙️', label: 'My Profile' }
    ],
    Guest: [
      { href: 'login.html', icon: '🔑', label: 'Login to continue' }
    ]
  };

  function renderSidebarMenu() {
    const menuEl = document.querySelector('.sidebar-menu');
    if (!menuEl) return;
    const items = SIDEBAR_MENUS[ROLE] || SIDEBAR_MENUS.Guest;
    menuEl.innerHTML = items.map((item, i) => `
      <li><a href="${item.href}" class="${i === 0 ? 'active' : ''}">${item.icon} ${item.label}</a></li>
    `).join('');
  }

  /* ---------------------------------------------------------
     7. ADMIN: USER MANAGEMENT WIDGET (dashboard.html only)
  --------------------------------------------------------- */
  function renderRoleHero() {
  const mount = document.getElementById('roleHeroMount');
  if (!mount) return;
  const name = currentUser ? (currentUser.name || currentUser.email) : 'Guest';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const students = (typeof STUDENTS_DATA !== 'undefined') ? STUDENTS_DATA : [];
  const withStatus = students.map(s => {
    const score = getOverallScore(s);
    return Object.assign({ score, status: getStatusFromScore(score) }, s);
  });
  let usersRaw = [];
  try { usersRaw = JSON.parse(localStorage.getItem('eduanalytics_users') || '[]'); } catch (e) {}

  let html = '';
  if (ROLE === 'Administrator') {
    const atRisk = withStatus.filter(s => s.status === 'At Risk').length;
    html = `<div class="role-hero-top">
      <div><h1>${greeting}, ${name} 🛡️</h1><p>Full system view — manage every user, teacher and student record.</p></div>
      <span class="role-chip">👑 Administrator</span></div>
      <div class="role-hero-stats">
        <div class="role-hero-stat"><strong>${usersRaw.length}</strong><span>Total Users</span></div>
        <div class="role-hero-stat"><strong>${withStatus.length}</strong><span>Student Records</span></div>
        <div class="role-hero-stat"><strong>${atRisk}</strong><span>Flagged At Risk</span></div>
      </div>`;
  } else if (ROLE === 'Teacher') {
    const excellent = withStatus.filter(s => s.status === 'Excellent').length;
    html = `<div class="role-hero-top">
      <div><h1>${greeting}, ${name} 📚</h1><p>Your class at a glance — track progress, spot who needs help.</p></div>
      <span class="role-chip">🧑‍🏫 Teacher</span></div>
      <div class="role-hero-stats">
        <div class="role-hero-stat"><strong>${withStatus.length}</strong><span>Students Tracked</span></div>
        <div class="role-hero-stat"><strong>${excellent}</strong><span>Top Performers</span></div>
      </div>`;
  } else if (ROLE === 'Student') {
    const me = withStatus.find(s => (s.email||'').toLowerCase() === (currentUser ? currentUser.email.toLowerCase() : ''));
    html = `<div class="role-hero-top">
      <div><h1>${greeting}, ${name} 🎓</h1><p>${me ? "Your personal performance snapshot for this term." : "Ask your teacher to link your record."}</p></div>
      <span class="role-chip">🎓 Student</span></div>
      ${me ? `<div class="role-hero-stats">
        <div class="role-hero-stat"><strong>${me.score}%</strong><span>Avg. Score</span></div>
        <div class="role-hero-stat"><strong>${me.class||'—'}</strong><span>Class</span></div>
        <div class="role-hero-stat"><strong>${me.status}</strong><span>Status</span></div>
      </div>` : ''}`;
  } else {
    html = `<div class="role-hero-top"><div><h1>Welcome 👋</h1><p>Log in to see your dashboard.</p></div>
      <span class="role-chip">Guest</span></div>`;
  }
  mount.className = 'role-hero';
  mount.innerHTML = html;
}
  function renderUserManagement() {
    const container = document.getElementById('userManagementBody');
    if (!container) return;

    function getUsers() {
      const raw = localStorage.getItem('eduanalytics_users');
      return raw ? JSON.parse(raw) : [];
    }

    function draw(filterText) {
      const users = getUsers();
      const term = (filterText || '').toLowerCase();
      const filtered = users.filter(u =>
        u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No users found.</td></tr>`;
        return;
      }

      container.innerHTML = filtered.map(u => `
        <tr>
          <td data-label="Name">${u.name}</td>
          <td data-label="Email">${u.email}</td>
          <td data-label="Role"><span class="role-badge role-badge-${normalizeRole(u.role).toLowerCase()}">${u.role}</span></td>
          <td data-label="Action">
            ${currentUser && u.email === currentUser.email
              ? '<span style="color:var(--text-muted); font-size:0.8rem;">(You)</span>'
              : `<button type="button" class="btn-link user-remove-btn" data-email="${u.email}">Remove</button>`}
          </td>
        </tr>
      `).join('');
    }

    draw('');

    const searchInput = document.getElementById('userManagementSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(function () {
        draw(searchInput.value);
      }, 250));
    }

    container.addEventListener('click', function (e) {
      const btn = e.target.closest('.user-remove-btn');
      if (!btn) return;
      const email = btn.getAttribute('data-email');
      const users = getUsers().filter(u => u.email !== email);
      localStorage.setItem('eduanalytics_users', JSON.stringify(users));
      draw(searchInput ? searchInput.value : '');
    });
  }

  /* ---------------------------------------------------------
     8. INIT   (Student-scoped table filtering is now handled inside
     js/dashboard-week5.js's own filter pipeline, so the same
     re-render pass that powers search/sort/pagination also
     respects role scoping — no separate DOM patch needed.)
  --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  document.body.setAttribute('data-role-view', ROLE);
  injectTopbarControls();
  applyRoleVisibility();
  renderSidebarMenu();
  renderRoleHero();
  renderUserManagement();
});
})();