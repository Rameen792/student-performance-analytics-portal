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
    const rollErrorText = rollGroup.querySelector('.error-text');
    const defaultRollError = rollErrorText ? rollErrorText.textContent : '';

    // Each validator toggles its own error state and returns true/false, so
    // the exact same function can run on blur (live feedback) AND on submit.
    function validateName() {
      const ok = nameInput.value.trim().length >= 3;
      ok ? clearError(nameGroup) : showError(nameGroup);
      return ok;
    }
    function validateRoll() {
      const val = rollInput.value.trim();
      if (val.length < 3) {
        if (rollErrorText) rollErrorText.textContent = defaultRollError;
        showError(rollGroup);
        return false;
      }
      if (window.EA_isDuplicateRoll && window.EA_isDuplicateRoll(val)) {
        if (rollErrorText) rollErrorText.textContent = 'This roll number is already in use — please use a unique one.';
        showError(rollGroup);
        return false;
      }
      clearError(rollGroup);
      return true;
    }
    function validateClass() {
      const ok = classInput.value !== '';
      ok ? clearError(classGroup) : showError(classGroup);
      return ok;
    }
    function validateScore() {
      const score = parseFloat(scoreInput.value);
      const ok = !isNaN(score) && score >= 0 && score <= 100;
      ok ? clearError(scoreGroup) : showError(scoreGroup);
      return ok;
    }
    function validateEmail() {
      const ok = isEmailValid(emailInput.value.trim());
      ok ? clearError(emailGroup) : showError(emailGroup);
      return ok;
    }

    // Live validation: flag/clear a field as soon as the user leaves it,
    // instead of only finding out about mistakes at submit time.
    nameInput.addEventListener('blur', validateName);
    rollInput.addEventListener('blur', validateRoll);
    classInput.addEventListener('change', validateClass);
    scoreInput.addEventListener('blur', validateScore);
    emailInput.addEventListener('blur', validateEmail);

    addStudentForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Run every validator (avoid short-circuiting with &&, so ALL fields
      // get their error state updated together, not just the first bad one).
      const results = [validateName(), validateRoll(), validateClass(), validateScore(), validateEmail()];
      const isValid = results.every(Boolean);
      if (!isValid) return;

      // ---- Week 5: hand the new student off to the shared data layer ----
      // js/dashboard-week5.js owns rendering (search/filter/sort/pagination),
      // so we just persist the record here and let it re-render the table.
      const newStudent = {
        id: rollInput.value.trim(),
        name: nameInput.value.trim(),
        class: classInput.value,
        score: parseFloat(scoreInput.value),
        email: emailInput.value.trim()
      };

      if (window.EA_addExtraStudent) window.EA_addExtraStudent(newStudent);
      if (window.EA_logActivity) window.EA_logActivity('➕', `${newStudent.name} (${newStudent.id}) was added to Student Records.`);

      // Notify the dashboard controller to refresh cards/table/charts
      document.dispatchEvent(new CustomEvent('studentAdded', { detail: newStudent }));

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
     1. USER STORAGE HELPERS (localStorage-based mini "database")
  --------------------------------------------------------- */
  const USERS_KEY = 'eduanalytics_users';

  function getStoredUsers() {
    const usersJSON = localStorage.getItem(USERS_KEY);
    let users = usersJSON ? JSON.parse(usersJSON) : [];

    // Seed a default demo account if none exist yet
    if (users.length === 0) {
      users = [{ name: 'Demo Teacher', email: 'demo@eduanalytics.com', role: 'Teacher', password: 'demo123' }];
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  }

  function saveUser(newUser) {
    const users = getStoredUsers();
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function findUserByEmail(email) {
    return getStoredUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------------------------------------------------------
     2. SIGNUP FORM: VALIDATION + REGISTER NEW USER
  --------------------------------------------------------- */
  const signupForm = document.getElementById('signupFormEl');

  if (signupForm) {
    const signupPasswordInput = document.getElementById('signupPassword');
    const toggleSignupBtn = document.getElementById('toggleSignupPassword');
    const strengthBar = document.getElementById('passwordStrength');

    if (toggleSignupBtn) {
      toggleSignupBtn.addEventListener('click', function () {
        const isHidden = signupPasswordInput.type === 'password';
        signupPasswordInput.type = isHidden ? 'text' : 'password';
        toggleSignupBtn.textContent = isHidden ? '🙈' : '👁️';
      });
    }

    // Live password strength indicator
    if (strengthBar) {
      signupPasswordInput.addEventListener('input', function () {
        const val = signupPasswordInput.value;
        strengthBar.classList.remove('weak', 'medium', 'strong');
        if (val.length === 0) return;

        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[^A-Za-z0-9]/.test(val);
        const score = [hasUpper, hasNumber, hasSpecial, val.length >= 8].filter(Boolean).length;

        if (val.length < 6) strengthBar.classList.add('weak');
        else if (score <= 2) strengthBar.classList.add('medium');
        else strengthBar.classList.add('strong');
      });
    }

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;

      const nameGroup = document.getElementById('grp-sname');
      const nameInput = document.getElementById('signupName');
      const emailGroup = document.getElementById('grp-semail');
      const emailInput = document.getElementById('signupEmail');
      const roleGroup = document.getElementById('grp-srole');
      const roleInput = document.getElementById('signupRole');
      const passGroup = document.getElementById('grp-spassword');
      const confirmGroup = document.getElementById('grp-sconfirm');
      const confirmInput = document.getElementById('signupConfirmPassword');
      const termsGroup = document.getElementById('grp-sterms');
      const termsCheckbox = document.getElementById('agreeTerms');
      const errorBanner = document.getElementById('signupErrorBanner');
      const successMsg = document.getElementById('signupSuccessMsg');

      errorBanner.style.display = 'none';

      if (nameInput.value.trim().length < 3) { nameGroup.classList.add('invalid'); isValid = false; }
      else nameGroup.classList.remove('invalid');

      if (!emailPattern.test(emailInput.value.trim())) { emailGroup.classList.add('invalid'); isValid = false; }
      else emailGroup.classList.remove('invalid');

      if (roleInput.value === '') { roleGroup.classList.add('invalid'); isValid = false; }
      else roleGroup.classList.remove('invalid');

      if (signupPasswordInput.value.length < 6) { passGroup.classList.add('invalid'); isValid = false; }
      else passGroup.classList.remove('invalid');

      if (confirmInput.value !== signupPasswordInput.value || confirmInput.value === '') {
        confirmGroup.classList.add('invalid'); isValid = false;
      } else confirmGroup.classList.remove('invalid');

      if (!termsCheckbox.checked) { termsGroup.classList.add('invalid'); isValid = false; }
      else termsGroup.classList.remove('invalid');

      if (!isValid) return;

      // Check if email already registered
      if (findUserByEmail(emailInput.value.trim())) {
        errorBanner.textContent = '❌ An account with this email already exists. Please login instead.';
        errorBanner.style.display = 'block';
        return;
      }

      // Save the new user
      saveUser({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        role: roleInput.value,
        password: signupPasswordInput.value
      });

      successMsg.style.display = 'block';
      signupForm.reset();
      strengthBar?.classList.remove('weak', 'medium', 'strong');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    });
  }

  /* ---------------------------------------------------------
     3. LOGIN FORM: VALIDATE AGAINST REGISTERED USERS
  --------------------------------------------------------- */
  const loginForm = document.getElementById('loginFormEl');

  if (loginForm) {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');

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

      if (!emailPattern.test(emailInput.value.trim())) {
        emailGroup.classList.add('invalid'); isValid = false;
      } else {
        emailGroup.classList.remove('invalid');
      }

      if (passwordInput.value.trim().length < 6) {
        passGroup.classList.add('invalid'); isValid = false;
      } else {
        passGroup.classList.remove('invalid');
      }

      if (!isValid) return;

      // Check credentials against ALL registered users (not just demo)
      const matchedUser = findUserByEmail(emailInput.value.trim());

      if (matchedUser && matchedUser.password === passwordInput.value) {
        successMsg.style.display = 'block';

        const rememberMe = document.getElementById('rememberMe').checked;
        const userData = JSON.stringify({ name: matchedUser.name, email: matchedUser.email, role: matchedUser.role });

        if (rememberMe) {
          localStorage.setItem('eduanalytics_current_user', userData);
        } else {
          sessionStorage.setItem('eduanalytics_current_user', userData);
        }

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        errorBanner.textContent = '❌ Invalid email or password. Try demo@eduanalytics.com / demo123, or sign up for a new account.';
        errorBanner.style.display = 'block';
      }
    });
  }

 /* ---------------------------------------------------------
     4. UPDATE NAVBAR LOGIN/LOGOUT STATE ON ALL PAGES
  --------------------------------------------------------- */
  const navAuthLink = document.getElementById('navAuthLink');
  const currentUserJSON = localStorage.getItem('eduanalytics_current_user') || sessionStorage.getItem('eduanalytics_current_user');
  const currentUser = currentUserJSON ? JSON.parse(currentUserJSON) : null;

  if (navAuthLink) {
    if (currentUser) {
      navAuthLink.textContent = 'Logout';
      navAuthLink.href = '#';
      navAuthLink.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('eduanalytics_current_user');
        sessionStorage.removeItem('eduanalytics_current_user');
        window.location.href = 'login.html';
      });
    } else {
      navAuthLink.textContent = 'Login';
      navAuthLink.href = 'login.html';
    }
  }

  // Personalize dashboard welcome message with actual registered name
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg && currentUser) {
    welcomeMsg.textContent = `Welcome back, ${currentUser.name} 👋`;
  }
  /* ---------------------------------------------------------
     3. DASHBOARD CARDS / FILTERS / SORT / PAGINATION
     Week 5: this logic now lives in js/dashboard-week5.js, which
     also handles pagination, Chart.js charts, CSV/PDF export and
     the recent-activity feed as one consistent render pipeline.
  --------------------------------------------------------- */

  /* ---------------------------------------------------------
     4. SCROLL-SPY: HIGHLIGHT ACTIVE NAV LINK WHILE SCROLLING
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