!function() {
  "use strict";
  const t = "eduanalytics_extra_students",
    e = "eduanalytics_activity_log";

  function n() {
    try {
      return JSON.parse(localStorage.getItem(t)) || []
    } catch (t) {
      return []
    }
  }

  function a() {
    const t = ("undefined" != typeof STUDENTS_DATA ? STUDENTS_DATA : []).map(function(t) {
      const e = getOverallScore(t);
      return {
        id: t.id,
        name: t.name,
        class: t.class,
        email: t.email || "",
        score: e,
        status: getStatusFromScore(e),
        attendance: t.attendance
      }
    });
    return n().map(function(t) {
      return {
        id: t.id,
        name: t.name,
        class: t.class,
        email: t.email || "",
        score: t.score,
        status: getStatusFromScore(t.score),
        attendance: t.attendance
      }
    }).concat(t).filter(function(t) {
      return !(window.EA_isStudentDeleted && window.EA_isStudentDeleted(t.id))
    }).map(function(t) {
      if (!window.EA_applyStudentOverride) return t;
      const e = window.EA_applyStudentOverride(t);
      return e.status = getStatusFromScore(e.score), e
    })
  }

  function o(t, n) {
    let a = [];
    try {
      a = JSON.parse(localStorage.getItem(e)) || []
    } catch (t) {
      a = []
    }
    a.unshift({
      icon: t,
      text: n,
      time: (new Date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }), localStorage.setItem(e, JSON.stringify(a.slice(0, 8))), s()
  }

  function s() {
    const t = document.getElementById("activityFeedList");
    if (!t) return;
    let n = [];
    try {
      n = JSON.parse(localStorage.getItem(e)) || []
    } catch (t) {
      n = []
    }
    t.innerHTML = n.length ? n.map(function(t) {
      return '<li class="activity-item"><span class="activity-icon">' + t.icon + '</span><span class="activity-text">' + t.text + "<br><small>" + t.time + "</small></span></li>"
    }).join("") : '<li class="activity-item activity-empty">No recent activity yet — actions you take will show up here.</li>'
  }
  document.addEventListener("DOMContentLoaded", function() {
    const t = document.getElementById("clearActivityBtn");
    t && t.addEventListener("click", function() {
      confirm("Clear all recent activity? This cannot be undone.") && (localStorage.removeItem(e), s())
    })
  }), window.EA_getAllStudents = a, window.EA_isDuplicateRoll = function(t) {
    const e = String(t || "").replace(/\s+/g, "").toLowerCase();
    return !!e && a().some(function(t) {
      return t.id.replace(/\s+/g, "").toLowerCase() === e
    })
}, window.EA_addExtraStudent = function(e) {
    const a = n();
    a.unshift(e),
      function(e) {
        localStorage.setItem(t, JSON.stringify(e))
      }(a), window.EA_undeleteStudent && window.EA_undeleteStudent(e.id)
  }, window.EA_logActivity = o, document.addEventListener("DOMContentLoaded", function() {
    const t = document.getElementById("studentsTable");
    if (!t) return;
    const e = {
      search: document.getElementById("dashSearchInput"),
      searchClear: document.getElementById("dashSearchClear"),
      classFilter: document.getElementById("dashClassFilter"),
      minScore: document.getElementById("dashMinScore"),
      maxScore: document.getElementById("dashMaxScore"),
      clearBtn: document.getElementById("clearFiltersBtn"),
      resultInfo: document.getElementById("dashResultInfo"),
      tbody: document.getElementById("studentsTableBody"),
      pageSize: document.getElementById("dashPageSize"),
      pagination: document.getElementById("dashPagination"),
      exportCsvBtn: document.getElementById("exportCsvBtn"),
      exportPdfBtn: document.getElementById("exportPdfBtn"),
      sortHeaders: document.querySelectorAll("#studentsTable th.sortable"),
      filterToggleBtn: document.getElementById("filterToggleBtn"),
      filterPanel: document.getElementById("filterPanel"),
      filterCountBadge: document.getElementById("filterCountBadge"),
      statusPills: document.getElementById("statusPills"),
      activeChips: document.getElementById("activeChips"),
      minAttendance: document.getElementById("dashMinAttendance"),
      maxAttendance: document.getElementById("dashMaxAttendance"),
      sortBy: document.getElementById("dashSortBy"),
      role: window.EA_role || "Guest",
      currentUser: window.EA_currentUser || null
    };
    let n = {
        key: "roll",
        asc: !0
      },
      r = 1,
      l = "all";

    function i(t, e) {
      const n = String(t).replace(/[&<>"']/g, function(t) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        } [t]
      });
      if (!e) return n;
      const a = n.toLowerCase().indexOf(e.toLowerCase());
      return -1 === a ? n : n.slice(0, a) + '<mark class="search-highlight">' + n.slice(a, a + e.length) + "</mark>" + n.slice(a + e.length)
    }

    function c() {
      const t = (e.search && e.search.value || "").trim().toLowerCase(),
        n = e.classFilter ? e.classFilter.value : "all",
        o = e.minScore && "" !== e.minScore.value ? parseFloat(e.minScore.value) : 0,
        s = e.maxScore && "" !== e.maxScore.value ? parseFloat(e.maxScore.value) : 100,
        minAtt = e.minAttendance && "" !== e.minAttendance.value ? parseFloat(e.minAttendance.value) : 0,
        maxAtt = e.maxAttendance && "" !== e.maxAttendance.value ? parseFloat(e.maxAttendance.value) : 100;
      let r = a();
      return "Student" === e.role && e.currentUser && (r = r.filter(function(t) {
        return t.email.toLowerCase() === e.currentUser.email.toLowerCase()
      })), r.filter(function(e) {
        const a = (e.id + " " + e.name + " " + e.class + " " + e.email).toLowerCase(),
          r = "" === t || a.includes(t),
          i = "all" === n || e.class === n,
          c = "all" === l || e.status === l,
          d = e.score >= o && e.score <= s,
          attOk = null == e.attendance || e.attendance >= minAtt && e.attendance <= maxAtt;
        return r && i && c && d && attOk
      })
    }

    function d(t) {
      const e = n.key,
        a = n.asc ? 1 : -1;
      return t.slice().sort(function(t, n) {
        let o = t["roll" === e ? "id" : e],
          s = n["roll" === e ? "id" : e];
        return "string" == typeof o && (o = o.toLowerCase(), s = s.toLowerCase()), o < s ? -1 * a : o > s ? 1 * a : 0
      })
    }

    function u() {
      const t = (e.search && e.search.value || "").trim(),
        n = d(c()),
        o = function() {
          if (!e.pageSize) return 10;
          const t = parseInt(e.pageSize.value, 10);
          return isNaN(t) ? 10 : t
        }(),
        s = Math.max(1, Math.ceil(n.length / o));
      r > s && (r = s), r < 1 && (r = 1);
      const u = (r - 1) * o,
        m = n.slice(u, u + o);
      if (e.tbody) {
        e.tbody.innerHTML = m.length ? m.map(function(n) {
          return function(t, n) {
            const a = getStatusBadgeClass(t.status),
              o = "Administrator" === e.role || "Teacher" === e.role ? '<button type="button" class="btn-icon-action btn-edit-row" data-id="' + t.id + '" title="Edit student">✏️ Edit</button><button type="button" class="btn-icon-action btn-delete-row" data-id="' + t.id + '" title="Delete student">🗑️ Delete</button>' : "";
            return '<tr data-id="' + t.id + '"><td data-label="Roll No.">' + i(t.id, n) + '</td><td data-label="Name">' + i(t.name, n) + '</td><td data-label="Class">' + i(t.class, n) + '</td><td data-label="Avg. Score">' + t.score + '%</td><td data-label="Status"><span class="badge ' + a + '">' + t.status + '</span></td><td data-label="Action" class="action-cell"><a href="student-profile.html?id=' + t.id + '" class="btn-link">View Profile →</a>' + o + "</td></tr>"
          }(n, t)
        }).join("") : '<tr class="no-results-row"><td colspan="6"><span class="nr-icon">🔍</span><span class="nr-title">No students match your filters</span>Try a different search term or widen your filters.<br><button type="button" class="nr-clear" id="nrClearBtn">Clear all filters</button></td></tr>';
        const n = document.getElementById("nrClearBtn");
        n && n.addEventListener("click", function() {
          e.clearBtn && e.clearBtn.click()
        })
      }
      if (e.resultInfo)
        if (0 === n.length) e.resultInfo.textContent = "No students found — try adjusting your search or filters.";
        else {
          const t = u + 1,
            a = Math.min(u + o, n.length);
          e.resultInfo.textContent = "Showing " + t + "–" + a + " of " + n.length + " students"
        }!
      function(t, n) {
        if (!e.pagination) return;
        const a = Math.max(1, Math.ceil(t / n));
        if (r > a && (r = a), a <= 1) return void(e.pagination.innerHTML = "");
        let o = "";
        o += '<button type="button" class="page-btn" data-page="prev" ' + (1 === r ? "disabled" : "") + ">‹ Prev</button>";
        let s = Math.max(1, r - Math.floor(2.5)),
          l = Math.min(a, s + 5 - 1);
        s = Math.max(1, l - 5 + 1), s > 1 && (o += '<button type="button" class="page-btn" data-page="1">1</button>' + (s > 2 ? '<span class="page-dots">…</span>' : ""));
        for (let t = s; t <= l; t++) o += '<button type="button" class="page-btn ' + (t === r ? "active" : "") + '" data-page="' + t + '">' + t + "</button>";
        l < a && (o += (l < a - 1 ? '<span class="page-dots">…</span>' : "") + '<button type="button" class="page-btn" data-page="' + a + '">' + a + "</button>"), o += '<button type="button" class="page-btn" data-page="next" ' + (r === a ? "disabled" : "") + ">Next ›</button>", e.pagination.innerHTML = o
      }(n.length, o),
      function() {
        if (!e.activeChips) return;
        const t = (e.search && e.search.value || "").trim(),
          n = e.classFilter ? e.classFilter.value : "all",
          a = e.minScore ? e.minScore.value : "",
          o = e.maxScore ? e.maxScore.value : "",
          s = [];
        t && s.push({
          type: "search",
          label: "Search: “" + t + "”"
        }), "all" !== n && s.push({
          type: "class",
          label: "Class: " + n
        }), "all" !== l && s.push({
          type: "status",
          label: "Status: " + l
        }), "" === a && "" === o || s.push({
          type: "score",
          label: "Score: " + (a || "0") + "–" + (o || "100") + "%"
        }), (function() {
          const minA = e.minAttendance ? e.minAttendance.value : "",
            maxA = e.maxAttendance ? e.maxAttendance.value : "";
          "" === minA && "" === maxA || s.push({
            type: "attendance",
            label: "Attendance: " + (minA || "0") + "–" + (maxA || "100") + "%"
          })
        })(), e.activeChips.innerHTML = s.map(function(t) {
          return '<span class="chip" data-type="' + t.type + '">' + t.label + '<button type="button" data-remove="' + t.type + '" aria-label="Remove filter">✕</button></span>'
        }).join("");
        const r = ("all" !== n ? 1 : 0) + ("" !== a || "" !== o ? 1 : 0);
        e.filterCountBadge && (e.filterCountBadge.hidden = 0 === r, e.filterCountBadge.textContent = r), e.searchClear && (e.searchClear.hidden = "" === t)
      }(),
      function() {
        let t = a();
        "Student" === e.role && e.currentUser && (t = t.filter(function(t) {
          return t.email.toLowerCase() === e.currentUser.email.toLowerCase()
        }));
        const n = {
          total: t.length,
          Excellent: 0,
          Average: 0,
          "At Risk": 0
        };
        t.forEach(function(t) {
          n[t.status] = (n[t.status] || 0) + 1
        });
        const o = document.getElementById("cardTotal"),
          s = document.getElementById("cardExcellent"),
          r = document.getElementById("cardAverage"),
          l = document.getElementById("cardAtRisk");
        o && (o.textContent = n.total);
        s && (s.textContent = n.Excellent);
        r && (r.textContent = n.Average);
        l && (l.textContent = n["At Risk"])
      }(),
      function(t) {
        if (!C && !B) return;
        const e = function(t) {
          const e = {
              Excellent: 0,
              Average: 0,
              "At Risk": 0
            },
            n = {};
          t.forEach(function(t) {
            e[t.status] = (e[t.status] || 0) + 1, n[t.class] || (n[t.class] = {
              sum: 0,
              count: 0
            }), n[t.class].sum += t.score, n[t.class].count += 1
          });
          const a = Object.keys(n).sort(),
            o = a.map(function(t) {
              return Math.round(n[t].sum / n[t].count)
            });
          return {
            statusCounts: e,
            classLabels: a,
            classAverages: o
          }
        }(t);
        C && (C.data.datasets[0].data = [e.statusCounts.Excellent, e.statusCounts.Average, e.statusCounts["At Risk"]], C.update());
        B && (B.data.labels = e.classLabels, B.data.datasets[0].data = e.classAverages, B.update())
      }(n)
    }
    e.pagination && e.pagination.addEventListener("click", function(e) {
      const n = e.target.closest(".page-btn");
      if (!n || n.disabled) return;
      const a = n.getAttribute("data-page");
      "prev" === a ? r-- : "next" === a ? r++ : r = parseInt(a, 10), u(), t.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }), e.activeChips && e.activeChips.addEventListener("click", function(t) {
      const n = t.target.closest("[data-remove]");
      if (!n) return;
      const a = n.getAttribute("data-remove");
      "search" === a && e.search && (e.search.value = ""), "class" === a && e.classFilter && (e.classFilter.value = "all"), "score" === a && (e.minScore && (e.minScore.value = ""), e.maxScore && (e.maxScore.value = "")), "attendance" === a && (e.minAttendance && (e.minAttendance.value = ""), e.maxAttendance && (e.maxAttendance.value = "")), "status" === a && g("all"), f()
    });
    const m = window.EA_debounce || function(t, e) {
      let n;
      return function() {
        clearTimeout(n);
        const a = arguments,
          o = this;
        n = setTimeout(function() {
          t.apply(o, a)
        }, e)
      }
    };

    function f() {
      r = 1, u()
    }

    function g(t) {
      l = t, e.statusPills && e.statusPills.querySelectorAll(".pill").forEach(function(e) {
        e.classList.toggle("active", e.getAttribute("data-status") === t)
      }), document.querySelectorAll(".stat-card.clickable").forEach(function(e) {
        e.classList.toggle("card-active", e.getAttribute("data-filter") === t)
      })
    }
    e.classFilter && e.classFilter.addEventListener("change", f), [e.minScore, e.maxScore, e.minAttendance, e.maxAttendance].forEach(function(t) {
      t && t.addEventListener("input", m(f, 250))
    }), e.sortBy && e.sortBy.addEventListener("change", function() {
      const v = e.sortBy.value.split("-"), k = v[0], dir = v[1];
      n.key = "id" === k ? "roll" : k, n.asc = "asc" === dir, f()
    }), e.search && e.search.addEventListener("input", m(f, 200)), e.pageSize && e.pageSize.addEventListener("change", f), e.searchClear && e.searchClear.addEventListener("click", function() {
      e.search.value = "", e.search.focus(), f()
    }), document.addEventListener("keydown", function(t) {
      if ("/" !== t.key || !e.search) return;
      const n = document.activeElement && document.activeElement.tagName || "";
      "INPUT" !== n && "TEXTAREA" !== n && "SELECT" !== n && (t.preventDefault(), e.search.focus())
      }), e.filterToggleBtn && e.filterPanel && e.filterToggleBtn.addEventListener("click", function() {
      const t = !e.filterPanel.hidden;
      e.filterPanel.hidden = t, e.filterToggleBtn.setAttribute("aria-expanded", String(!t))
    }), e.statusPills && e.statusPills.addEventListener("click", function(t) {
      const e = t.target.closest(".pill");
      e && (g(e.getAttribute("data-status")), f())
  }), e.clearBtn && e.clearBtn.addEventListener("click", function() {
      e.search && (e.search.value = ""), e.classFilter && (e.classFilter.value = "all"), e.minScore && (e.minScore.value = ""), e.maxScore && (e.maxScore.value = ""), e.minAttendance && (e.minAttendance.value = ""), e.maxAttendance && (e.maxAttendance.value = ""), e.sortBy && (e.sortBy.value = "id-asc"), g("all"), f()
    }), e.sortHeaders.forEach(function(t) {
      t.addEventListener("click", function() {
        const a = t.getAttribute("data-key");
        n.asc = n.key !== a || !n.asc, n.key = a, e.sortHeaders.forEach(function(t) {
          t.classList.remove("sort-asc", "sort-desc")
        }), t.classList.add(n.asc ? "sort-asc" : "sort-desc"), u()
      })
    }), document.querySelectorAll(".stat-card.clickable").forEach(function(t) {
      t.addEventListener("click", function() {
        g(t.getAttribute("data-filter")), f()
      })
    }), document.addEventListener("studentAdded", function() {
      f()
    });
    const p = document.getElementById("editStudentModal"),
      h = document.getElementById("editStudentFormEl"),
      v = document.getElementById("editStudentId"),
      y = document.getElementById("editStudentName"),
      E = document.getElementById("editStudentClass"),
      b = document.getElementById("editStudentScore"),
      S = document.getElementById("editStudentEmail"),
      w = document.getElementById("editModalTitle");

    function A() {
      p && (p.hidden = !0, document.body.classList.remove("modal-open"))
    }
    e.tbody && e.tbody.addEventListener("click", function(t) {
      const e = t.target.closest(".btn-edit-row"),
        n = t.target.closest(".btn-delete-row");
      if (e) {
        const t = e.getAttribute("data-id"),
          n = a().find(function(e) {
            return e.id === t
          });
        return void(n && function(t) {
          p && (v.value = t.id, w.textContent = "Edit " + t.name, y.value = t.name, E.value = t.class, b.value = t.score, S.value = t.email || "", p.hidden = !1, document.body.classList.add("modal-open"), y.focus())
        }(n))
      }
      if (n) {
        const t = n.getAttribute("data-id"),
          e = a().find(function(e) {
            return e.id === t
          }),
          o = e ? e.name + " (" + e.id + ")" : t;
        confirm("Delete " + o + "? This cannot be undone.") && (window.EA_deleteStudentEverywhere && window.EA_deleteStudentEverywhere(t), window.EA_logActivity && window.EA_logActivity("🗑️", o + " was removed from Student Records."), f())
      }
    }), h && h.addEventListener("submit", function(t) {
      t.preventDefault();
      const e = v.value,
        n = y.value.trim(),
        a = E.value,
        o = parseFloat(b.value),
        s = S.value.trim();
      n.length < 3 || !a || isNaN(o) || o < 0 || o > 100 || !s ? alert("Please fill in all fields with valid values before saving.") : (window.EA_updateStudentEverywhere && window.EA_updateStudentEverywhere(e, {
        name: n,
        class: a,
        score: o,
        email: s
      }), window.EA_logActivity && window.EA_logActivity("✏️", n + " (" + e + ") record was updated."), A(), f())
    }), document.querySelectorAll("[data-close-edit-modal]").forEach(function(t) {
      t.addEventListener("click", A)
    }), p && (p.addEventListener("click", function(t) {
      t.target === p && A()
    }), document.addEventListener("keydown", function(t) {
      "Escape" !== t.key || p.hidden || A()
    }));
    let C = null,
      B = null;

    function L() {
      if ("undefined" == typeof Chart) return;
      const t = document.getElementById("statusDoughnutChart"),
        e = document.getElementById("classBarChart");
      t && (C = new Chart(t, {
        type: "doughnut",
        data: {
          labels: ["Excellent", "Average", "At Risk"],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: !0,
          plugins: {
            legend: {
              position: "bottom"
            }
          },
          cutout: "65%"
        }
      })), e && (B = new Chart(e, {
        type: "bar",
        data: {
          labels: [],
          datasets: [{
            label: "Average Score (%)",
            data: [],
            backgroundColor: "#6366f1",
            borderRadius: 6
          }]
        },
        options: {
          responsive: !0,
          plugins: {
            legend: {
              display: !1
            }
          },
          scales: {
            y: {
              beginAtZero: !0,
              max: 100
            }
          }
        }
      }))
    }
    e.exportCsvBtn && e.exportCsvBtn.addEventListener("click", function() {
      const t = d(c());
      if (0 === t.length) return void alert("No students to export with the current filters.");
      const e = t.map(function(t) {
          return [t.id, t.name, t.class, t.score, t.status, t.email]
        }),
        n = [
          ["Roll No.", "Name", "Class", "Average Score (%)", "Status", "Guardian/Email"]
        ].concat(e).map(function(t) {
          return t.map(function(t) {
            const e = String(t).replace(/"/g, '""');
            return /[",\n]/.test(e) ? '"' + e + '"' : e
          }).join(",")
        }).join("\n"),
        a = new Blob([n], {
          type: "text/csv;charset=utf-8;"
        }),
        s = URL.createObjectURL(a),
        r = document.createElement("a");
      r.href = s, r.download = "student-records-" + (new Date).toISOString().slice(0, 10) + ".csv", document.body.appendChild(r), r.click(), document.body.removeChild(r), URL.revokeObjectURL(s), o("⬇️", "Exported " + t.length + " student record(s) to CSV.")
    }), e.exportPdfBtn && e.exportPdfBtn.addEventListener("click", function() {
      const t = d(c()),
        e = document.getElementById("printableReport");
      if (!e) return;
      if (0 === t.length) return void alert("No students to export with the current filters.");
      const n = t.map(function(t) {
        return "<tr><td>" + t.id + "</td><td>" + t.name + "</td><td>" + t.class + "</td><td>" + t.score + "%</td><td>" + t.status + "</td></tr>"
      }).join("");
      e.innerHTML = "<h2>Student Performance Report</h2><p>Generated " + (new Date).toLocaleString() + " &bull; " + t.length + " record(s)</p><table><thead><tr><th>Roll No.</th><th>Name</th><th>Class</th><th>Avg. Score</th><th>Status</th></tr></thead><tbody>" + n + "</tbody></table>", document.body.classList.add("printing-report"), window.print(), setTimeout(function() {
        document.body.classList.remove("printing-report")
      }, 300), o("🖨️", "Exported " + t.length + " student record(s) to PDF.")
    }), u(), s(), window.requestAnimationFrame ? window.requestAnimationFrame(function() {
      L(), u()
    }) : (L(), u())
  })
}();
    