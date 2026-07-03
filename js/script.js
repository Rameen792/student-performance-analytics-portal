/* ==========================================================================
   Student Performance Analytics Portal - Main JavaScript
   Handles: Mobile Nav Toggle, Form Validation, Table Filtering, Dynamic Rows
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     1. MOBILE NAVIGATION TOGGLE
  --------------------------------------------------------- */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked (mobile UX improvement)
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  /* ---------------------------------------------------------
     2. GENERIC VALIDATION HELPERS
  --------------------------------------------------------- */
  function isEmailValid(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  function showError(groupEl) {
    groupEl.classList.add('invalid');
  }

  function clearError(groupEl) {
    groupEl.classList.remove('invalid');
  }

  /* ---------------------------------------------------------
     3. DASHBOARD: ADD STUDENT FORM VALIDATION
  --------------------------------------------------------- */
  const addStudentForm = document.getElementById('addStudentFormEl');

  if (addStudentForm) {
    addStudentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;

      const nameGroup = document.getElementById('grp-name');
      const nameInput = document.getElementById('studentName');
      const rollGroup = document.getElementById('grp-roll');
      const rollInput = document.getElementById('rollNo');
      const classGroup = document.getElementById('grp-class');
      const classInput = document.getElementById('studentClass');
      const scoreGroup = document.getElementById('grp-score');
      const scoreInput = document.getElementById('studentScore');
      const emailGroup = document.getElementById('grp-email');
      const emailInput = document.getElementById('studentEmail');

      // Name validation
      if (nameInput.value.trim().length < 3) {
        showError(nameGroup); isValid = false;
      } else clearError(nameGroup);

      // Roll number validation
      if (rollInput.value.trim().length < 3) {
        showError(rollGroup); isValid = false;
      } else clearError(rollGroup);

      // Class validation
      if (classInput.value === '') {
        showError(classGroup); isValid = false;
      } else clearError(classGroup);

      // Score validation
      const score = parseFloat(scoreInput.value);
      if (isNaN(score) || score < 0 || score > 100) {
        showError(scoreGroup); isValid = false;
      } else clearError(scoreGroup);

      // Email validation
      if (!isEmailValid(emailInput.value.trim())) {
        showError(emailGroup); isValid = false;
      } else clearError(emailGroup);

      if (!isValid) return;

      // ---- Add new row to the Student Records table dynamically ----
      const tableBody = document.querySelector('#studentsTable tbody');
      const newRow = document.createElement('tr');

      let statusBadge = '<span class="badge badge-danger">At Risk</span>';
      if (score >= 80) statusBadge = '<span class="badge badge-success">Excellent</span>';
      else if (score >= 60) statusBadge = '<span class="badge badge-warning">Average</span>';

      newRow.innerHTML = `
        <td>${rollInput.value.trim()}</td>
        <td>${nameInput.value.trim()}</td>
        <td>${classInput.value}</td>
        <td>${score}%</td>
        <td>${statusBadge}</td>
      `;
      tableBody.prepend(newRow);

      // Show success message
      const successMsg = document.getElementById('dashSuccessMsg');
      successMsg.style.display = 'block';
      setTimeout(() => { successMsg.style.display = 'none'; }, 3000);

      // Reset form
      addStudentForm.reset();
    });
  }

  /* ---------------------------------------------------------
     4. CONTACT FORM VALIDATION
  --------------------------------------------------------- */
  const contactForm = document.getElementById('contactFormEl');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;

      const nameGroup = document.getElementById('grp-cname');
      const nameInput = document.getElementById('contactName');
      const emailGroup = document.getElementById('grp-cemail');
      const emailInput = document.getElementById('contactEmail');
      const subjectGroup = document.getElementById('grp-csubject');
      const subjectInput = document.getElementById('contactSubject');
      const messageGroup = document.getElementById('grp-cmessage');
      const messageInput = document.getElementById('contactMessage');

      if (nameInput.value.trim().length < 3) {
        showError(nameGroup); isValid = false;
      } else clearError(nameGroup);

      if (!isEmailValid(emailInput.value.trim())) {
        showError(emailGroup); isValid = false;
      } else clearError(emailGroup);

      if (subjectInput.value === '') {
        showError(subjectGroup); isValid = false;
      } else clearError(subjectGroup);

      if (messageInput.value.trim().length < 10) {
        showError(messageGroup); isValid = false;
      } else clearError(messageGroup);

      if (!isValid) return;

      const successMsg = document.getElementById('contactSuccessMsg');
      successMsg.style.display = 'block';
      setTimeout(() => { successMsg.style.display = 'none'; }, 3500);

      contactForm.reset();
    });
  }

  /* ---------------------------------------------------------
     5. REPORT PAGE: FILTER + SEARCH TABLE
  --------------------------------------------------------- */
  const applyFilterBtn = document.getElementById('applyFilterBtn');

  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', filterReportTable);

    // Also filter live while typing in search box
    document.getElementById('searchStudent').addEventListener('input', filterReportTable);
    document.getElementById('filterClass').addEventListener('change', filterReportTable);
    document.getElementById('filterSubject').addEventListener('change', filterReportTable);
  }

  function filterReportTable() {
    const classVal = document.getElementById('filterClass').value;
    const subjectVal = document.getElementById('filterSubject').value;
    const searchVal = document.getElementById('searchStudent').value.trim().toLowerCase();

    const rows = document.querySelectorAll('#reportTable tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const rowClass = row.getAttribute('data-class');
      const rowSubject = row.getAttribute('data-subject');
      const rowText = row.textContent.toLowerCase();

      const classMatch = classVal === 'all' || rowClass === classVal;
      const subjectMatch = subjectVal === 'all' || rowSubject === subjectVal;
      const searchMatch = searchVal === '' || rowText.includes(searchVal);

      if (classMatch && subjectMatch && searchMatch) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const noResultsMsg = document.getElementById('noResultsMsg');
    if (noResultsMsg) {
      noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  /* ---------------------------------------------------------
     6. ANIMATE STAT NUMBERS ON HOME PAGE (nice UX touch)
  --------------------------------------------------------- */
  function animateCount(el, target, suffix) {
    let current = 0;
    const increment = target / 60; // ~60 frames
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 20);
  }

  const statStudents = document.getElementById('statStudents');
  if (statStudents) {
    animateCount(statStudents, 1240, '');
    animateCount(document.getElementById('statAvg'), 78, '%');
    animateCount(document.getElementById('statPass'), 91, '%');
    animateCount(document.getElementById('statCourses'), 36, '');
  }

});
/* ==========================================================================
   WEEK 2 ADDITIONS: Login System, Dynamic Cards, Search/Filter/Sort,
   Scroll-Spy Navigation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     1. LOGIN FORM VALIDATION + FAKE AUTH SYSTEM
  --------------------------------------------------------- */
  const loginForm = document.getElementById('loginFormEl');

  if (loginForm) {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');

    // Show/hide password toggle
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', function () {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePasswordBtn.textContent = isHidden ? '🙈' : '👁️';
      });
    }

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;

      const emailGroup = document.getElementById('grp-lemail');
      const emailInput = document.getElementById('loginEmail');
      const passGroup = document.getElementById('grp-lpassword');
      const errorBanner = document.getElementById('loginErrorBanner');
      const successMsg = document.getElementById('loginSuccessMsg');

      errorBanner.style.display = 'none';

      // Email format check
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        emailGroup.classList.add('invalid'); isValid = false;
      } else {
        emailGroup.classList.remove('invalid');
      }

      // Password length check
      if (passwordInput.value.trim().length < 6) {
        passGroup.classList.add('invalid'); isValid = false;
      } else {
        passGroup.classList.remove('invalid');
      }

      if (!isValid) return;

      // ---- Demo Authentication (front-end only, no real backend) ----
      const DEMO_EMAIL = 'demo@eduanalytics.com';
      const DEMO_PASSWORD = 'demo123';

      if (emailInput.value.trim() === DEMO_EMAIL && passwordInput.value === DEMO_PASSWORD) {
        successMsg.style.display = 'block';

        // Remember login state if "Remember me" checked
        const rememberMe = document.getElementById('rememberMe').checked;
        if (rememberMe) {
          localStorage.setItem('eduanalytics_user', emailInput.value.trim());
        } else {
          sessionStorage.setItem('eduanalytics_user', emailInput.value.trim());
        }

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        errorBanner.style.display = 'block';
      }
    });
  }

  /* ---------------------------------------------------------
     2. UPDATE NAVBAR LOGIN/LOGOUT STATE ON ALL PAGES
  --------------------------------------------------------- */
  const navAuthLink = document.getElementById('navAuthLink');
  const loggedInUser = localStorage.getItem('eduanalytics_user') || sessionStorage.getItem('eduanalytics_user');

  if (navAuthLink) {
    if (loggedInUser) {
      navAuthLink.textContent = 'Logout';
      navAuthLink.href = '#';
      navAuthLink.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('eduanalytics_user');
        sessionStorage.removeItem('eduanalytics_user');
        window.location.href = 'login.html';
      });
    } else {
      navAuthLink.textContent = 'Login';
      navAuthLink.href = 'login.html';
    }
  }

  // Personalize dashboard welcome message
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg && loggedInUser) {
    const nameGuess = loggedInUser.split('@')[0];
    welcomeMsg.textContent = `Welcome back, ${nameGuess} 👋`;
  }

  /* ---------------------------------------------------------
     3. DYNAMIC DASHBOARD CARDS (auto-count + click to filter)
  --------------------------------------------------------- */
  const statCardsContainer = document.getElementById('statCardsContainer');

  function updateStatCards() {
    const rows = document.querySelectorAll('#studentsTable tbody tr');
    let total = 0, excellent = 0, average = 0, atRisk = 0;

    rows.forEach(row => {
      total++;
      const status = row.getAttribute('data-status');
      if (status === 'Excellent') excellent++;
      else if (status === 'Average') average++;
      else if (status === 'At Risk') atRisk++;
    });

    const cardTotal = document.getElementById('cardTotal');
    const cardExcellent = document.getElementById('cardExcellent');
    const cardAverage = document.getElementById('cardAverage');
    const cardAtRisk = document.getElementById('cardAtRisk');

    if (cardTotal) cardTotal.textContent = total;
    if (cardExcellent) cardExcellent.textContent = excellent;
    if (cardAverage) cardAverage.textContent = average;
    if (cardAtRisk) cardAtRisk.textContent = atRisk;
  }

  if (statCardsContainer) {
    updateStatCards();

    // Click a card to filter the table by that status
    document.querySelectorAll('.stat-card.clickable').forEach(card => {
      card.addEventListener('click', function () {
        document.querySelectorAll('.stat-card.clickable').forEach(c => c.classList.remove('card-active'));
        card.classList.add('card-active');

        const filterValue = card.getAttribute('data-filter');
        const statusFilterSelect = document.getElementById('dashStatusFilter');
        if (statusFilterSelect) {
          statusFilterSelect.value = filterValue === 'all' ? 'all' : filterValue;
          applyDashboardFilters();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     4. DASHBOARD TABLE: SEARCH + FILTER + RESULT COUNT
  --------------------------------------------------------- */
  const dashSearchInput = document.getElementById('dashSearchInput');
  const dashClassFilter = document.getElementById('dashClassFilter');
  const dashStatusFilter = document.getElementById('dashStatusFilter');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const dashResultInfo = document.getElementById('dashResultInfo');

  function applyDashboardFilters() {
    const searchVal = (dashSearchInput?.value || '').trim().toLowerCase();
    const classVal = dashClassFilter?.value || 'all';
    const statusVal = dashStatusFilter?.value || 'all';

    const rows = document.querySelectorAll('#studentsTable tbody tr');
    let visibleCount = 0;
    const total = rows.length;

    rows.forEach(row => {
      const rowClass = row.getAttribute('data-class');
      const rowStatus = row.getAttribute('data-status');
      const rowText = row.textContent.toLowerCase();

      const matchSearch = searchVal === '' || rowText.includes(searchVal);
      const matchClass = classVal === 'all' || rowClass === classVal;
      const matchStatus = statusVal === 'all' || rowStatus === statusVal;

      if (matchSearch && matchClass && matchStatus) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (dashResultInfo) {
      dashResultInfo.textContent = `Showing ${visibleCount} of ${total} students`;
    }
  }

  if (dashSearchInput) {
    dashSearchInput.addEventListener('input', applyDashboardFilters);
    dashClassFilter.addEventListener('change', applyDashboardFilters);
    dashStatusFilter.addEventListener('change', applyDashboardFilters);

    clearFiltersBtn.addEventListener('click', function () {
      dashSearchInput.value = '';
      dashClassFilter.value = 'all';
      dashStatusFilter.value = 'all';
      document.querySelectorAll('.stat-card.clickable').forEach(c => c.classList.remove('card-active'));
      applyDashboardFilters();
    });

    applyDashboardFilters(); // initial run
  }

  /* ---------------------------------------------------------
     5. SORTABLE TABLE COLUMNS (click header to sort)
  --------------------------------------------------------- */
  const sortableHeaders = document.querySelectorAll('#studentsTable th.sortable');

  sortableHeaders.forEach(header => {
    header.addEventListener('click', function () {
      const key = header.getAttribute('data-key');
      const tbody = document.querySelector('#studentsTable tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      const isAscending = !header.classList.contains('sort-asc');

      // Reset all header sort states
      sortableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');

      rows.sort((rowA, rowB) => {
        let valA, valB;

        if (key === 'score') {
          valA = parseFloat(rowA.getAttribute('data-score'));
          valB = parseFloat(rowB.getAttribute('data-score'));
        } else if (key === 'class') {
          valA = rowA.getAttribute('data-class');
          valB = rowB.getAttribute('data-class');
        } else {
          const cellIndex = key === 'roll' ? 0 : 1;
          valA = rowA.children[cellIndex].textContent.trim().toLowerCase();
          valB = rowB.children[cellIndex].textContent.trim().toLowerCase();
        }

        if (valA < valB) return isAscending ? -1 : 1;
        if (valA > valB) return isAscending ? 1 : -1;
        return 0;
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  });

  /* ---------------------------------------------------------
     6. SCROLL-SPY: HIGHLIGHT ACTIVE NAV LINK WHILE SCROLLING
  --------------------------------------------------------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (sections.length > 0) {
    window.addEventListener('scroll', function () {
      let currentSectionId = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
          currentSectionId = section.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentSectionId}` || link.getAttribute('href').includes(currentSectionId)) {
            link.classList.add('active');
          }
        });
      }
    });
  }

});