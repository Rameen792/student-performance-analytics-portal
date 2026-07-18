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
    return extra.concat(base);
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
      classFilter: document.getElementById('dashClassFilter'),
      statusFilter: document.getElementById('dashStatusFilter'),
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
      role: (window.EA_role || 'Guest'),
      currentUser: window.EA_currentUser || null
    };

    let sortState = { key: 'roll', asc: true };
    let currentPage = 1;

    /* ---- 2a. Filtering ---- */
    function getFiltered() {
      const searchVal = (els.search && els.search.value || '').trim().toLowerCase();
      const classVal = els.classFilter ? els.classFilter.value : 'all';
      const statusVal = els.statusFilter ? els.statusFilter.value : 'all';
      const minScore = els.minScore && els.minScore.value !== '' ? parseFloat(els.minScore.value) : 0;
      const maxScore = els.maxScore && els.maxScore.value !== '' ? parseFloat(els.maxScore.value) : 100;

      let list = getAllStudents();

      // Students only ever see their own record
      if (els.role === 'Student' && els.currentUser) {
        list = list.filter(function (s) { return s.email.toLowerCase() === els.currentUser.email.toLowerCase(); });
      }

      return list.filter(function (s) {
        const text = (s.id + ' ' + s.name + ' ' + s.class + ' ' + s.email).toLowerCase();
        const matchSearch = searchVal === '' || text.includes(searchVal);
        const matchClass = classVal === 'all' || s.class === classVal;
        const matchStatus = statusVal === 'all' || s.status === statusVal;
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

    /* ---- 2d. Row rendering (only the current page hits the DOM) ---- */
    function rowHtml(s) {
      const badgeClass = getStatusBadgeClass(s.status);
      return '<tr data-id="' + s.id + '">' +
        '<td data-label="Roll No.">' + s.id + '</td>' +
        '<td data-label="Name">' + s.name + '</td>' +
        '<td data-label="Class">' + s.class + '</td>' +
        '<td data-label="Avg. Score">' + s.score + '%</td>' +
        '<td data-label="Status"><span class="badge ' + badgeClass + '">' + s.status + '</span></td>' +
        '<td data-label="Action"><a href="student-profile.html?id=' + s.id + '" class="btn-link">View Profile →</a></td>' +
        '</tr>';
    }

    function render() {
      const filtered = applySort(getFiltered());
      const pageSize = getPageSize();
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIdx = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIdx, startIdx + pageSize);

      if (els.tbody) {
        els.tbody.innerHTML = pageItems.length
          ? pageItems.map(rowHtml).join('')
          : '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No students match the current filters.</td></tr>';
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
      updateStatCards();
      updateCharts(filtered);
    }

    const debounce = window.EA_debounce || function (fn, delay) {
      let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, delay); };
    };

    function goToFirstPageAndRender() { currentPage = 1; render(); }

    [els.classFilter, els.statusFilter].forEach(function (el) {
      if (el) el.addEventListener('change', goToFirstPageAndRender);
    });
    [els.minScore, els.maxScore].forEach(function (el) {
      if (el) el.addEventListener('input', debounce(goToFirstPageAndRender, 250));
    });
    if (els.search) els.search.addEventListener('input', debounce(goToFirstPageAndRender, 250));
    if (els.pageSize) els.pageSize.addEventListener('change', goToFirstPageAndRender);

    if (els.clearBtn) {
      els.clearBtn.addEventListener('click', function () {
        if (els.search) els.search.value = '';
        if (els.classFilter) els.classFilter.value = 'all';
        if (els.statusFilter) els.statusFilter.value = 'all';
        if (els.minScore) els.minScore.value = '';
        if (els.maxScore) els.maxScore.value = '';
        document.querySelectorAll('.stat-card.clickable').forEach(function (c) { c.classList.remove('card-active'); });
        goToFirstPageAndRender();
      });
    }

    /* ---- 2e. Sortable headers ---- */
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

    /* ---- 2f. Stat cards (always reflect the FULL dataset, not just filtered) ---- */
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
        document.querySelectorAll('.stat-card.clickable').forEach(function (c) { c.classList.remove('card-active'); });
        card.classList.add('card-active');
        if (els.statusFilter) {
          els.statusFilter.value = card.getAttribute('data-filter');
          goToFirstPageAndRender();
        }
      });
    });

    /* ---- 2g. New student added elsewhere on the page ---- */
    document.addEventListener('studentAdded', function () {
      goToFirstPageAndRender();
    });

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