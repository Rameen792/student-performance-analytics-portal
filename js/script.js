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