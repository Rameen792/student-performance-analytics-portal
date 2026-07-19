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

  function setFieldError(groupEl, message) {
    groupEl.classList.add('invalid');
    groupEl.classList.remove('valid');
    const errText = groupEl.querySelector('.error-text');
    if (errText && message) errText.textContent = message;
  }
  function setFieldValid(groupEl) {
    groupEl.classList.remove('invalid');
    groupEl.classList.add('valid');
  }
  function clearFieldState(groupEl) {
    groupEl.classList.remove('invalid', 'valid');
  }

  // Pinpoints the REAL objection instead of a generic "invalid email" message
  function emailObjection(value) {
    const v = value.trim();
    if (v === '') return 'We need your email address to continue.';
    if (!v.includes('@')) return "That's missing the @ symbol — e.g. name@example.com.";
    const [local, domain] = v.split('@');
    if (!local) return 'Add something before the @ symbol.';
    if (!domain) return 'Add a domain after the @, like gmail.com.';
    if (!domain.includes('.')) return 'The domain needs an extension, like ".com" or ".edu".';
    if (!emailPattern.test(v)) return "That email address doesn't look valid — please double-check it.";
    return '';
  }

  /* ---------------------------------------------------------
     2. SIGNUP FORM: VALIDATION + REGISTER NEW USER
  --------------------------------------------------------- */
  const signupForm = document.getElementById('signupFormEl');

  if (signupForm) {
    const nameGroup = document.getElementById('grp-sname');
    const nameInput = document.getElementById('signupName');
    const emailGroup = document.getElementById('grp-semail');
    const emailInput = document.getElementById('signupEmail');
    const roleGroup = document.getElementById('grp-srole');
    const roleInput = document.getElementById('signupRole');
    const passGroup = document.getElementById('grp-spassword');
    const signupPasswordInput = document.getElementById('signupPassword');
    const toggleSignupBtn = document.getElementById('toggleSignupPassword');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthLabel = document.getElementById('strengthLabel');
    const checklist = document.getElementById('pwChecklist');
    const confirmGroup = document.getElementById('grp-sconfirm');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const matchIndicator = document.getElementById('matchIndicator');
    const termsGroup = document.getElementById('grp-sterms');
    const termsCheckbox = document.getElementById('agreeTerms');
    const errorBanner = document.getElementById('signupErrorBanner');
    const successMsg = document.getElementById('signupSuccessMsg');

    if (toggleSignupBtn) {
      toggleSignupBtn.addEventListener('click', function () {
        const isHidden = signupPasswordInput.type === 'password';
        signupPasswordInput.type = isHidden ? 'text' : 'password';
        toggleSignupBtn.textContent = isHidden ? '🙈' : '👁️';
      });
    }

    function passwordRules(val) {
      return { len: val.length >= 8, upper: /[A-Z]/.test(val), number: /[0-9]/.test(val), special: /[^A-Za-z0-9]/.test(val) };
    }

    function updateChecklist(val) {
      const rules = passwordRules(val);
      if (checklist) {
        Object.keys(rules).forEach(function (key) {
          const li = checklist.querySelector('[data-rule="' + key + '"]');
          if (li) li.classList.toggle('met', rules[key]);
        });
      }
      return rules;
    }

    function validatePassword(showError) {
      const val = signupPasswordInput.value;
      const rules = updateChecklist(val);
      const metCount = Object.values(rules).filter(Boolean).length;

      strengthBar && strengthBar.classList.remove('weak', 'medium', 'strong');
      if (strengthLabel) strengthLabel.className = 'strength-label';

      if (val.length === 0) {
        if (strengthLabel) strengthLabel.textContent = '';
        if (showError) setFieldError(passGroup, 'Password is required.');
        else clearFieldState(passGroup);
        return false;
      }

      let label = 'Weak', cls = 'weak';
      if (metCount === 4) { label = 'Strong'; cls = 'strong'; }
      else if (metCount >= 2) { label = 'Fair'; cls = 'medium'; }
      strengthBar && strengthBar.classList.add(cls);
      if (strengthLabel) { strengthLabel.textContent = 'Password strength: ' + label; strengthLabel.classList.add(cls); }

      const ok = rules.len && rules.upper && rules.number && rules.special;
      if (ok) setFieldValid(passGroup);
      else if (showError) setFieldError(passGroup, 'Still missing ' + (4 - metCount) + ' requirement(s) above.');
      else clearFieldState(passGroup);
      return ok;
    }

    function validateConfirm(showError) {
      if (confirmInput.value === '') {
        if (matchIndicator) { matchIndicator.textContent = ''; matchIndicator.className = 'match-indicator'; }
        if (showError) setFieldError(confirmGroup, 'Please re-enter your password.');
        else clearFieldState(confirmGroup);
        return false;
      }
      const ok = confirmInput.value === signupPasswordInput.value;
      if (matchIndicator) {
        matchIndicator.textContent = ok ? '✓ Passwords match' : '✕ Passwords don\'t match yet';
        matchIndicator.className = 'match-indicator ' + (ok ? 'match' : 'mismatch');
      }
      if (ok) setFieldValid(confirmGroup);
      else setFieldError(confirmGroup, "This doesn't match the password above.");
      return ok;
    }

    function validateName(showError) {
      const len = nameInput.value.trim().length;
      if (len === 0) { if (showError) setFieldError(nameGroup, 'Full name is required.'); else clearFieldState(nameGroup); return false; }
      if (len < 3) { if (showError) setFieldError(nameGroup, 'That looks too short — enter your full name (min 3 characters).'); else clearFieldState(nameGroup); return false; }
      setFieldValid(nameGroup);
      return true;
    }

    function validateSignupEmail(showError) {
      const msg = emailObjection(emailInput.value);
      if (msg) { if (showError) setFieldError(emailGroup, msg); else clearFieldState(emailGroup); return false; }
      setFieldValid(emailGroup);
      return true;
    }

    function validateRole(showError) {
      const ok = roleInput.value !== '';
      if (ok) setFieldValid(roleGroup);
      else if (showError) setFieldError(roleGroup, 'Please select the role that best describes you.');
      else clearFieldState(roleGroup);
      return ok;
    }

    function validateTerms(showError) {
      const ok = termsCheckbox.checked;
      if (ok) clearFieldState(termsGroup);
      else if (showError) setFieldError(termsGroup, 'You must accept the Terms & Privacy Policy to create an account.');
      return ok;
    }

    // Live feedback as the user types — not just on submit
    nameInput.addEventListener('input', function () { validateName(false); });
    nameInput.addEventListener('blur', function () { validateName(true); });
    emailInput.addEventListener('input', function () { validateSignupEmail(false); });
    emailInput.addEventListener('blur', function () { validateSignupEmail(true); });
    roleInput.addEventListener('change', function () { validateRole(true); });
    signupPasswordInput.addEventListener('input', function () { validatePassword(false); if (confirmInput.value) validateConfirm(false); });
    signupPasswordInput.addEventListener('blur', function () { validatePassword(true); });
    confirmInput.addEventListener('input', function () { validateConfirm(false); });
    confirmInput.addEventListener('blur', function () { validateConfirm(true); });
    termsCheckbox.addEventListener('change', function () { validateTerms(true); });

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBanner.style.display = 'none';

      const results = [
        validateName(true),
        validateSignupEmail(true),
        validateRole(true),
        validatePassword(true),
        validateConfirm(true),
        validateTerms(true)
      ];
      if (!results.every(Boolean)) return;

      if (findUserByEmail(emailInput.value.trim())) {
        errorBanner.textContent = '❌ An account with this email already exists. Please login instead.';
        errorBanner.style.display = 'block';
        return;
      }

      saveUser({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        role: roleInput.value,
        password: signupPasswordInput.value
      });

      successMsg.style.display = 'block';
      signupForm.reset();
      strengthBar && strengthBar.classList.remove('weak', 'medium', 'strong');
      if (strengthLabel) strengthLabel.textContent = '';
      if (checklist) checklist.querySelectorAll('li').forEach(function (li) { li.classList.remove('met'); });
      if (matchIndicator) { matchIndicator.textContent = ''; matchIndicator.className = 'match-indicator'; }
      document.querySelectorAll('#signupFormEl .form-group').forEach(clearFieldState);

      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }

  /* ---------------------------------------------------------
     3. LOGIN FORM: VALIDATE AGAINST REGISTERED USERS
  --------------------------------------------------------- */
  const loginForm = document.getElementById('loginFormEl');

  if (loginForm) {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const emailGroup = document.getElementById('grp-lemail');
    const emailInput = document.getElementById('loginEmail');
    const passGroup = document.getElementById('grp-lpassword');
    const passwordInput = document.getElementById('loginPassword');
    const errorBanner = document.getElementById('loginErrorBanner');
    const successMsg = document.getElementById('loginSuccessMsg');

    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', function () {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePasswordBtn.textContent = isHidden ? '🙈' : '👁️';
      });
    }

    function validateLoginEmail(showError) {
      const msg = emailObjection(emailInput.value);
      if (msg) { if (showError) setFieldError(emailGroup, msg); else clearFieldState(emailGroup); return false; }
      setFieldValid(emailGroup);
      return true;
    }

    function validateLoginPassword(showError) {
      const len = passwordInput.value.trim().length;
      if (len === 0) { if (showError) setFieldError(passGroup, 'Please enter your password.'); else clearFieldState(passGroup); return false; }
      if (len < 6) { if (showError) setFieldError(passGroup, 'Too short — password needs at least 6 characters (you have ' + len + ').'); else clearFieldState(passGroup); return false; }
      setFieldValid(passGroup);
      return true;
    }

    emailInput.addEventListener('input', function () { validateLoginEmail(false); });
    emailInput.addEventListener('blur', function () { validateLoginEmail(true); });
    passwordInput.addEventListener('input', function () { validateLoginPassword(false); });
    passwordInput.addEventListener('blur', function () { validateLoginPassword(true); });

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBanner.style.display = 'none';

      const results = [validateLoginEmail(true), validateLoginPassword(true)];
      if (!results.every(Boolean)) return;

      // Distinguish the REAL objection: no such account vs. wrong password
      const matchedUser = findUserByEmail(emailInput.value.trim());

      if (!matchedUser) {
        errorBanner.textContent = '❌ No account found with this email. Try again, or sign up for a new account.';
        errorBanner.style.display = 'block';
        setFieldError(emailGroup, "We don't have an account with this email yet.");
        return;
      }

      if (matchedUser.password !== passwordInput.value) {
        errorBanner.textContent = '❌ That password is incorrect for ' + matchedUser.email + '. Try again or reset it.';
        errorBanner.style.display = 'block';
        setFieldError(passGroup, 'Incorrect password for this account.');
        return;
      }

      successMsg.style.display = 'block';
      const rememberMe = document.getElementById('rememberMe').checked;
      const userData = JSON.stringify({ name: matchedUser.name, email: matchedUser.email, role: matchedUser.role });

      if (rememberMe) localStorage.setItem('eduanalytics_current_user', userData);
      else sessionStorage.setItem('eduanalytics_current_user', userData);

      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
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