/* ==========================================================================
   WEEK 5: Advanced Dashboard Features & Data Management
   - Unified data layer (STUDENTS_DATA + locally-added students)
   - Search / Filter / Sort / Pagination controller for the Student Records table
   - Export to CSV (real) and Export to PDF (print-friendly view)
   - Interactive Chart.js charts (status distribution + class averages)
   - Recent Activity widget
   - Performance helpers (debounced search, single re-render pass)
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     0. DATA LAYER
     STUDENTS_DATA (js/students-data.js) holds the original Week-3
     dataset with per-subject marks. Students added via the
     "Add New Student" form only have a flat average score, so we
     store those separately and merge both into one normalized list.
  --------------------------------------------------------- */
  const EXTRA_KEY = 'eduanalytics_extra_students';
  const ACTIVITY_KEY = 'eduanalytics_activity_log';

  function getExtraStudents() {
    try { return JSON.parse(localStorage.getItem(EXTRA_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveExtraStudents(list) {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(list));
  }

  function addExtraStudent(student) {
    const list = getExtraStudents();
    list.unshift(student);
    saveExtraStudents(list);
  }

  // Returns one normalized array: { id, name, class, email, score, status }
  function getAllStudents() {
    const base = (typeof STUDENTS_DATA !== 'undefined' ? STUDENTS_DATA : []).map(function (s) {
      const score = getOverallScore(s);
      return { id: s.id, name: s.name, class: s.class, email: s.email || '', score: score, status: getStatusFromScore(score) };
    });
   const extra = getExtraStudents().map(function (s) {
      return { id: s.id, name: s.name, class: s.class, email: s.email || '', score: s.score, status: getStatusFromScore(s.score) };
    });
    return extra.concat(base)
      .filter(function (s) { return !(window.EA_isStudentDeleted && window.EA_isStudentDeleted(s.id)); })
      .map(function (s) {
        if (!window.EA_applyStudentOverride) return s;
        const merged = window.EA_applyStudentOverride(s);
        merged.status = getStatusFromScore(merged.score);
        return merged;
      });
  }

  function isDuplicateRoll(roll) {
    const clean = String(roll || '').trim().toLowerCase();
    if (!clean) return false;
    return getAllStudents().some(function (s) { return s.id.toLowerCase() === clean; });
  }

  /* ---------------------------------------------------------
     1. RECENT ACTIVITY WIDGET
  --------------------------------------------------------- */
  function logActivity(icon, text) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || []; } catch (e) { list = []; }
    list.unshift({
      icon: icon,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 8)));
    renderActivityFeed();
  }

  function renderActivityFeed() {
    const el = document.getElementById('activityFeedList');
    if (!el) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || []; } catch (e) { list = []; }

    el.innerHTML = list.length
      ? list.map(function (a) {
          return '<li class="activity-item">' +
            '<span class="activity-icon">' + a.icon + '</span>' +
            '<span class="activity-text">' + a.text + '<br><small>' + a.time + '</small></span>' +
            '</li>';
        }).join('')
      : '<li class="activity-item activity-empty">No recent activity yet — actions you take will show up here.</li>';
  }
  function clearActivityLog() {
    localStorage.removeItem(ACTIVITY_KEY);
    renderActivityFeed();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const clearBtn = document.getElementById('clearActivityBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('Clear all recent activity? This cannot be undone.')) {
          clearActivityLog();
        }
      });
    }
  });

  // Expose helpers so js/script.js (loaded earlier, but executed after
  // this file has finished registering its top-level code) can use them.
  window.EA_getAllStudents = getAllStudents;
  window.EA_isDuplicateRoll = isDuplicateRoll;
  window.EA_addExtraStudent = addExtraStudent;
  window.EA_logActivity = logActivity;

  /* ---------------------------------------------------------
     2. DASHBOARD-ONLY CONTROLLER
     Everything below only runs on dashboard.html (guarded by the
     presence of #studentsTable), and only after the DOM is ready.
  --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    const table = document.getElementById('studentsTable');
    if (!table) return;

    const els = {
      search: document.getElementById('dashSearchInput'),
      searchClear: document.getElementById('dashSearchClear'),
      classFilter: document.getElementById('dashClassFilter'),
      minScore: document.getElementById('dashMinScore'),
      maxScore: document.getElementById('dashMaxScore'),
      clearBtn: document.getElementById('clearFiltersBtn'),
      resultInfo: document.getElementById('dashResultInfo'),
      tbody: document.getElementById('studentsTableBody'),
      pageSize: document.getElementById('dashPageSize'),
      pagination: document.getElementById('dashPagination'),
      exportCsvBtn: document.getElementById('exportCsvBtn'),
      exportPdfBtn: document.getElementById('exportPdfBtn'),
      sortHeaders: document.querySelectorAll('#studentsTable th.sortable'),
      filterToggleBtn: document.getElementById('filterToggleBtn'),
      filterPanel: document.getElementById('filterPanel'),
      filterCountBadge: document.getElementById('filterCountBadge'),
      statusPills: document.getElementById('statusPills'),
      activeChips: document.getElementById('activeChips'),
      role: (window.EA_role || 'Guest'),
      currentUser: window.EA_currentUser || null
    };

    let sortState = { key: 'roll', asc: true };
    let currentPage = 1;
    let activeStatus = 'all'; // replaces the old <select id="dashStatusFilter">

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function highlight(text, term) {
      const safe = escapeHtml(text);
      if (!term) return safe;
      const idx = safe.toLowerCase().indexOf(term.toLowerCase());
      if (idx === -1) return safe;
      return safe.slice(0, idx) + '<mark class="search-highlight">' + safe.slice(idx, idx + term.length) + '</mark>' + safe.slice(idx + term.length);
    }

    /* ---- 2a. Filtering ---- */
    function getFiltered() {
      const searchVal = (els.search && els.search.value || '').trim().toLowerCase();
      const classVal = els.classFilter ? els.classFilter.value : 'all';
      const minScore = els.minScore && els.minScore.value !== '' ? parseFloat(els.minScore.value) : 0;
      const maxScore = els.maxScore && els.maxScore.value !== '' ? parseFloat(els.maxScore.value) : 100;

      let list = getAllStudents();

      if (els.role === 'Student' && els.currentUser) {
        list = list.filter(function (s) { return s.email.toLowerCase() === els.currentUser.email.toLowerCase(); });
      }

      return list.filter(function (s) {
        const text = (s.id + ' ' + s.name + ' ' + s.class + ' ' + s.email).toLowerCase();
        const matchSearch = searchVal === '' || text.includes(searchVal);
        const matchClass = classVal === 'all' || s.class === classVal;
        const matchStatus = activeStatus === 'all' || s.status === activeStatus;
        const matchScore = s.score >= minScore && s.score <= maxScore;
        return matchSearch && matchClass && matchStatus && matchScore;
      });
    }

    /* ---- 2b. Sorting ---- */
    function applySort(list) {
      const key = sortState.key;
      const dir = sortState.asc ? 1 : -1;
      return list.slice().sort(function (a, b) {
        let valA = a[key === 'roll' ? 'id' : key];
        let valB = b[key === 'roll' ? 'id' : key];
        if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    /* ---- 2c. Pagination ---- */
    function getPageSize() {
      if (!els.pageSize) return 10;
      const val = parseInt(els.pageSize.value, 10);
      return isNaN(val) ? 10 : val;
    }

    function renderPagination(totalItems, pageSize) {
      if (!els.pagination) return;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      if (totalPages <= 1) { els.pagination.innerHTML = ''; return; }

      let buttons = '';
      buttons += '<button type="button" class="page-btn" data-page="prev" ' + (currentPage === 1 ? 'disabled' : '') + '>‹ Prev</button>';
      const maxButtons = 5;
      let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let end = Math.min(totalPages, start + maxButtons - 1);
      start = Math.max(1, end - maxButtons + 1);
      if (start > 1) buttons += '<button type="button" class="page-btn" data-page="1">1</button>' + (start > 2 ? '<span class="page-dots">…</span>' : '');
      for (let p = start; p <= end; p++) {
        buttons += '<button type="button" class="page-btn ' + (p === currentPage ? 'active' : '') + '" data-page="' + p + '">' + p + '</button>';
      }
      if (end < totalPages) buttons += (end < totalPages - 1 ? '<span class="page-dots">…</span>' : '') + '<button type="button" class="page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
      buttons += '<button type="button" class="page-btn" data-page="next" ' + (currentPage === totalPages ? 'disabled' : '') + '>Next ›</button>';
      els.pagination.innerHTML = buttons;
    }

    if (els.pagination) {
      els.pagination.addEventListener('click', function (e) {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;
        const val = btn.getAttribute('data-page');
        if (val === 'prev') currentPage--;
        else if (val === 'next') currentPage++;
        else currentPage = parseInt(val, 10);
        render();
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    /* ---- 2d. Row rendering (highlights the live search term) ---- */
    function rowHtml(s, term) {
      const badgeClass = getStatusBadgeClass(s.status);
      const canManage = els.role === 'Administrator' || els.role === 'Teacher';
      const actionButtons = canManage
        ? '<button type="button" class="btn-icon-action btn-edit-row" data-id="' + s.id + '" title="Edit student">✏️ Edit</button>' +
          '<button type="button" class="btn-icon-action btn-delete-row" data-id="' + s.id + '" title="Delete student">🗑️ Delete</button>'
        : '';
      return '<tr data-id="' + s.id + '">' +
        '<td data-label="Roll No.">' + highlight(s.id, term) + '</td>' +
        '<td data-label="Name">' + highlight(s.name, term) + '</td>' +
        '<td data-label="Class">' + highlight(s.class, term) + '</td>' +
        '<td data-label="Avg. Score">' + s.score + '%</td>' +
        '<td data-label="Status"><span class="badge ' + badgeClass + '">' + s.status + '</span></td>' +
        '<td data-label="Action" class="action-cell">' +
          '<a href="student-profile.html?id=' + s.id + '" class="btn-link">View Profile →</a>' +
          actionButtons +
        '</td>' +
        '</tr>';
    }

    /* ---- 2e. Active filter chips + badge ---- */
    function renderChips() {
      if (!els.activeChips) return;
      const searchVal = (els.search && els.search.value || '').trim();
      const classVal = els.classFilter ? els.classFilter.value : 'all';
      const minVal = els.minScore ? els.minScore.value : '';
      const maxVal = els.maxScore ? els.maxScore.value : '';

      const chips = [];
      if (searchVal) chips.push({ type: 'search', label: 'Search: “' + searchVal + '”' });
      if (classVal !== 'all') chips.push({ type: 'class', label: 'Class: ' + classVal });
      if (activeStatus !== 'all') chips.push({ type: 'status', label: 'Status: ' + activeStatus });
      if (minVal !== '' || maxVal !== '') chips.push({ type: 'score', label: 'Score: ' + (minVal || '0') + '–' + (maxVal || '100') + '%' });

      els.activeChips.innerHTML = chips.map(function (c) {
        return '<span class="chip" data-type="' + c.type + '">' + c.label + '<button type="button" data-remove="' + c.type + '" aria-label="Remove filter">✕</button></span>';
      }).join('');

      const advancedCount = (classVal !== 'all' ? 1 : 0) + ((minVal !== '' || maxVal !== '') ? 1 : 0);
      if (els.filterCountBadge) {
        els.filterCountBadge.hidden = advancedCount === 0;
        els.filterCountBadge.textContent = advancedCount;
      }
      if (els.searchClear) els.searchClear.hidden = searchVal === '';
    }

    if (els.activeChips) {
      els.activeChips.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-remove]');
        if (!btn) return;
        const type = btn.getAttribute('data-remove');
        if (type === 'search' && els.search) els.search.value = '';
        if (type === 'class' && els.classFilter) els.classFilter.value = 'all';
        if (type === 'score') { if (els.minScore) els.minScore.value = ''; if (els.maxScore) els.maxScore.value = ''; }
        if (type === 'status') setStatus('all');
        goToFirstPageAndRender();
      });
    }

    /* ---- 2f. Master render ---- */
    function render() {
      const term = (els.search && els.search.value || '').trim();
      const filtered = applySort(getFiltered());
      const pageSize = getPageSize();
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIdx = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIdx, startIdx + pageSize);

      if (els.tbody) {
        els.tbody.innerHTML = pageItems.length
          ? pageItems.map(function (s) { return rowHtml(s, term); }).join('')
          : '<tr class="no-results-row"><td colspan="6">' +
              '<span class="nr-icon">🔍</span>' +
              '<span class="nr-title">No students match your filters</span>' +
              'Try a different search term or widen your filters.' +
              '<br><button type="button" class="nr-clear" id="nrClearBtn">Clear all filters</button>' +
            '</td></tr>';
        const nrBtn = document.getElementById('nrClearBtn');
        if (nrBtn) nrBtn.addEventListener('click', function () { els.clearBtn && els.clearBtn.click(); });
      }

      if (els.resultInfo) {
        if (filtered.length === 0) {
          els.resultInfo.textContent = 'No students found — try adjusting your search or filters.';
        } else {
          const shownFrom = startIdx + 1;
          const shownTo = Math.min(startIdx + pageSize, filtered.length);
          els.resultInfo.textContent = 'Showing ' + shownFrom + '–' + shownTo + ' of ' + filtered.length + ' students';
        }
      }

      renderPagination(filtered.length, pageSize);
      renderChips();
      updateStatCards();
      updateCharts(filtered);
    }

    const debounce = window.EA_debounce || function (fn, delay) {
      let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, delay); };
    };

    function goToFirstPageAndRender() { currentPage = 1; render(); }

    /* ---- 2g. Wiring: search, clear, panel toggle, pills, filters ---- */
    if (els.classFilter) els.classFilter.addEventListener('change', goToFirstPageAndRender);
    [els.minScore, els.maxScore].forEach(function (el) {
      if (el) el.addEventListener('input', debounce(goToFirstPageAndRender, 250));
    });
    if (els.search) els.search.addEventListener('input', debounce(goToFirstPageAndRender, 200));
    if (els.pageSize) els.pageSize.addEventListener('change', goToFirstPageAndRender);

    if (els.searchClear) {
      els.searchClear.addEventListener('click', function () {
        els.search.value = '';
        els.search.focus();
        goToFirstPageAndRender();
      });
    }

    // "/" jumps straight into the search box, like Gmail/GitHub
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || !els.search) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      els.search.focus();
    });

    if (els.filterToggleBtn && els.filterPanel) {
      els.filterToggleBtn.addEventListener('click', function () {
        const isOpen = !els.filterPanel.hidden;
        els.filterPanel.hidden = isOpen;
        els.filterToggleBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    function setStatus(status) {
      activeStatus = status;
      if (els.statusPills) {
        els.statusPills.querySelectorAll('.pill').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-status') === status);
        });
      }
      document.querySelectorAll('.stat-card.clickable').forEach(function (c) {
        c.classList.toggle('card-active', c.getAttribute('data-filter') === status);
      });
    }

    if (els.statusPills) {
      els.statusPills.addEventListener('click', function (e) {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        setStatus(pill.getAttribute('data-status'));
        goToFirstPageAndRender();
      });
    }

    if (els.clearBtn) {
      els.clearBtn.addEventListener('click', function () {
        if (els.search) els.search.value = '';
        if (els.classFilter) els.classFilter.value = 'all';
        if (els.minScore) els.minScore.value = '';
        if (els.maxScore) els.maxScore.value = '';
        setStatus('all');
        goToFirstPageAndRender();
      });
    }

    /* ---- Sortable headers ---- */
    els.sortHeaders.forEach(function (header) {
      header.addEventListener('click', function () {
        const key = header.getAttribute('data-key');
        sortState.asc = (sortState.key === key) ? !sortState.asc : true;
        sortState.key = key;
        els.sortHeaders.forEach(function (h) { h.classList.remove('sort-asc', 'sort-desc'); });
        header.classList.add(sortState.asc ? 'sort-asc' : 'sort-desc');
        render();
      });
    });

    /* ---- Stat cards (always reflect the FULL dataset) ---- */
    function updateStatCards() {
      let all = getAllStudents();
      if (els.role === 'Student' && els.currentUser) {
        all = all.filter(function (s) { return s.email.toLowerCase() === els.currentUser.email.toLowerCase(); });
      }
      const counts = { total: all.length, Excellent: 0, Average: 0, 'At Risk': 0 };
      all.forEach(function (s) { counts[s.status] = (counts[s.status] || 0) + 1; });

      const cardTotal = document.getElementById('cardTotal');
      const cardExcellent = document.getElementById('cardExcellent');
      const cardAverage = document.getElementById('cardAverage');
      const cardAtRisk = document.getElementById('cardAtRisk');
      if (cardTotal) cardTotal.textContent = counts.total;
      if (cardExcellent) cardExcellent.textContent = counts.Excellent;
      if (cardAverage) cardAverage.textContent = counts.Average;
      if (cardAtRisk) cardAtRisk.textContent = counts['At Risk'];
    }

    document.querySelectorAll('.stat-card.clickable').forEach(function (card) {
      card.addEventListener('click', function () {
        setStatus(card.getAttribute('data-filter'));
        goToFirstPageAndRender();
      });
    });

    document.addEventListener('studentAdded', function () { goToFirstPageAndRender(); });

    /* ---- 2g-2. Edit & Delete actions on the Student Records table ---- */
    const editModal = document.getElementById('editStudentModal');
    const editForm = document.getElementById('editStudentFormEl');
    const editIdInput = document.getElementById('editStudentId');
    const editNameInput = document.getElementById('editStudentName');
    const editClassInput = document.getElementById('editStudentClass');
    const editScoreInput = document.getElementById('editStudentScore');
    const editEmailInput = document.getElementById('editStudentEmail');
    const editModalTitle = document.getElementById('editModalTitle');

    function openEditModal(student) {
      if (!editModal) return;
      editIdInput.value = student.id;
      editModalTitle.textContent = 'Edit ' + student.name;
      editNameInput.value = student.name;
      editClassInput.value = student.class;
      editScoreInput.value = student.score;
      editEmailInput.value = student.email || '';
      editModal.hidden = false;
      document.body.classList.add('modal-open');
      editNameInput.focus();
    }

    function closeEditModal() {
      if (!editModal) return;
      editModal.hidden = true;
      document.body.classList.remove('modal-open');
    }

    if (els.tbody) {
      els.tbody.addEventListener('click', function (e) {
        const editBtn = e.target.closest('.btn-edit-row');
        const deleteBtn = e.target.closest('.btn-delete-row');

        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          const student = getAllStudents().find(function (s) { return s.id === id; });
          if (student) openEditModal(student);
          return;
        }

        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          const student = getAllStudents().find(function (s) { return s.id === id; });
          const label = student ? student.name + ' (' + student.id + ')' : id;
          if (confirm('Delete ' + label + '? This cannot be undone.')) {
            if (window.EA_deleteStudentEverywhere) window.EA_deleteStudentEverywhere(id);
            if (window.EA_logActivity) window.EA_logActivity('🗑️', label + ' was removed from Student Records.');
            goToFirstPageAndRender();
          }
        }
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = editIdInput.value;
        const name = editNameInput.value.trim();
        const cls = editClassInput.value;
        const score = parseFloat(editScoreInput.value);
        const email = editEmailInput.value.trim();

        if (name.length < 3 || !cls || isNaN(score) || score < 0 || score > 100 || !email) {
          alert('Please fill in all fields with valid values before saving.');
          return;
        }

        if (window.EA_updateStudentEverywhere) {
          window.EA_updateStudentEverywhere(id, { name: name, class: cls, score: score, email: email });
        }
        if (window.EA_logActivity) window.EA_logActivity('✏️', name + ' (' + id + ') record was updated.');

        closeEditModal();
        goToFirstPageAndRender();
      });
    }

    document.querySelectorAll('[data-close-edit-modal]').forEach(function (btn) {
      btn.addEventListener('click', closeEditModal);
    });
    if (editModal) {
      editModal.addEventListener('click', function (e) {
        if (e.target === editModal) closeEditModal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !editModal.hidden) closeEditModal();
      });
    }
    /* ---- 2h. CHARTS (Chart.js) ---- */
    let statusChart = null;
    let classChart = null;

    function buildChartData(list) {
      const statusCounts = { Excellent: 0, Average: 0, 'At Risk': 0 };
      const classMap = {};
      list.forEach(function (s) {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
        if (!classMap[s.class]) classMap[s.class] = { sum: 0, count: 0 };
        classMap[s.class].sum += s.score;
        classMap[s.class].count += 1;
      });
      const classLabels = Object.keys(classMap).sort();
      const classAverages = classLabels.map(function (c) { return Math.round(classMap[c].sum / classMap[c].count); });
      return { statusCounts: statusCounts, classLabels: classLabels, classAverages: classAverages };
    }

    function initCharts() {
      if (typeof Chart === 'undefined') return;
      const statusCanvas = document.getElementById('statusDoughnutChart');
      const classCanvas = document.getElementById('classBarChart');
      if (statusCanvas) {
        statusChart = new Chart(statusCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Excellent', 'Average', 'At Risk'],
            datasets: [{ data: [0, 0, 0], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0 }]
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
        });
      }
      if (classCanvas) {
        classChart = new Chart(classCanvas, {
          type: 'bar',
          data: { labels: [], datasets: [{ label: 'Average Score (%)', data: [], backgroundColor: '#6366f1', borderRadius: 6 }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
          }
        });
      }
    }

    function updateCharts(filteredList) {
      if (!statusChart && !classChart) return;
      const data = buildChartData(filteredList);
      if (statusChart) {
        statusChart.data.datasets[0].data = [data.statusCounts.Excellent, data.statusCounts.Average, data.statusCounts['At Risk']];
        statusChart.update();
      }
      if (classChart) {
        classChart.data.labels = data.classLabels;
        classChart.data.datasets[0].data = data.classAverages;
        classChart.update();
      }
    }

    /* ---- 2i. EXPORT: CSV (real download) ---- */
    function exportCsv() {
      const list = applySort(getFiltered());
      if (list.length === 0) { alert('No students to export with the current filters.'); return; }

      const header = ['Roll No.', 'Name', 'Class', 'Average Score (%)', 'Status', 'Guardian/Email'];
      const rows = list.map(function (s) { return [s.id, s.name, s.class, s.score, s.status, s.email]; });
      const csv = [header].concat(rows).map(function (row) {
        return row.map(function (cell) {
          const val = String(cell).replace(/"/g, '""');
          return /[",\n]/.test(val) ? '"' + val + '"' : val;
        }).join(',');
      }).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-records-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logActivity('⬇️', 'Exported ' + list.length + ' student record(s) to CSV.');
    }

    /* ---- 2j. EXPORT: PDF (print-friendly view via the browser's Save-as-PDF) ---- */
    function exportPdf() {
      const list = applySort(getFiltered());
      const printable = document.getElementById('printableReport');
      if (!printable) return;
      if (list.length === 0) { alert('No students to export with the current filters.'); return; }

      const rowsHtml = list.map(function (s) {
        return '<tr><td>' + s.id + '</td><td>' + s.name + '</td><td>' + s.class + '</td><td>' + s.score + '%</td><td>' + s.status + '</td></tr>';
      }).join('');

      printable.innerHTML =
        '<h2>Student Performance Report</h2>' +
        '<p>Generated ' + new Date().toLocaleString() + ' &bull; ' + list.length + ' record(s)</p>' +
        '<table><thead><tr><th>Roll No.</th><th>Name</th><th>Class</th><th>Avg. Score</th><th>Status</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>';

      document.body.classList.add('printing-report');
      window.print();
      setTimeout(function () { document.body.classList.remove('printing-report'); }, 300);

      logActivity('🖨️', 'Exported ' + list.length + ' student record(s) to PDF.');
    }

    if (els.exportCsvBtn) els.exportCsvBtn.addEventListener('click', exportCsv);
    if (els.exportPdfBtn) els.exportPdfBtn.addEventListener('click', exportPdf);

    /* ---- 2k. INIT ---- */
    initCharts();
    render();
    renderActivityFeed();
  });
})();