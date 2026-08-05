document.addEventListener("DOMContentLoaded", function() {
  const e = document.getElementById("hamburger"),
    t = document.getElementById("navMenu");

  function n(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }

  function o(e) {
    e.classList.add("invalid")
  }

  function s(e) {
    e.classList.remove("invalid")
  }
  e && t && (e.setAttribute("aria-expanded", "false"), e.addEventListener("click", function() {
    const n = t.classList.toggle("active");
    e.classList.toggle("active", n), e.setAttribute("aria-expanded", String(n))
  }), document.querySelectorAll(".nav-link").forEach(n => {
    n.addEventListener("click", () => {
      e.classList.remove("active"), t.classList.remove("active"), e.setAttribute("aria-expanded", "false")
    })
  }), document.addEventListener("keydown", n => {
    "Escape" === n.key && t.classList.contains("active") && (e.classList.remove("active"), t.classList.remove("active"), e.setAttribute("aria-expanded", "false"), e.focus())
  }));
  const a = document.getElementById("addStudentFormEl");
  if (a) {
    const v = document.getElementById("grp-name"),
      f = document.getElementById("studentName"),
      p = document.getElementById("grp-roll"),
      h = document.getElementById("rollNo"),
      I = document.getElementById("grp-class"),
      B = document.getElementById("studentClass"),
      L = document.getElementById("grp-score"),
      w = document.getElementById("studentScore"),
      b = document.getElementById("grp-email"),
      S = document.getElementById("studentEmail"),
      x = p.querySelector(".error-text"),
      C = x ? x.textContent : "";

    function r() {
      const e = f.value.trim().length >= 3;
      return e ? s(v) : o(v), e
    }

    function l() {
      const e = h.value.trim();
      return e.length < 3 ? (x && (x.textContent = C), o(p), !1) : window.EA_isDuplicateRoll && window.EA_isDuplicateRoll(e) ? (x && (x.textContent = "This roll number is already in use — please use a unique one."), o(p), !1) : (s(p), !0)
    }

    function c() {
      const e = "" !== B.value;
      return e ? s(I) : o(I), e
    }

    function d() {
      const e = parseFloat(w.value),
        t = !isNaN(e) && e >= 0 && e <= 100;
      return t ? s(L) : o(L), t
    }

    function i() {
      const e = n(S.value.trim());
      return e ? s(b) : o(b), e
    }
    f.addEventListener("blur", r), h.addEventListener("blur", l), B.addEventListener("change", c), w.addEventListener("blur", d), S.addEventListener("blur", i), a.addEventListener("submit", function(e) {
      e.preventDefault();
      if (![r(), l(), c(), d(), i()].every(Boolean)) return;
      const t = {
        id: h.value.trim(),
        name: f.value.trim(),
        class: B.value,
        score: parseFloat(w.value),
        email: S.value.trim()
      };
      window.EA_addExtraStudent && window.EA_addExtraStudent(t), window.EA_logActivity && window.EA_logActivity("➕", `${t.name} (${t.id}) was added to Student Records.`), document.dispatchEvent(new CustomEvent("studentAdded", {
        detail: t
      }));
      const n = document.getElementById("dashSuccessMsg");
      n.textContent = "✅ Student added! Redirecting to complete their report...", n.style.display = "block", a.reset(), setTimeout(() => {
        window.location.href = "report-builder.html?id=" + encodeURIComponent(t.id)
      }, 1e3)
    })
  }
  const u = document.getElementById("contactFormEl");
  u && u.addEventListener("submit", function(e) {
    e.preventDefault();
    let t = !0;
    const a = document.getElementById("grp-cname"),
      r = document.getElementById("contactName"),
      l = document.getElementById("grp-cemail"),
      c = document.getElementById("contactEmail"),
      d = document.getElementById("grp-csubject"),
      i = document.getElementById("contactSubject"),
      m = document.getElementById("grp-cmessage"),
      g = document.getElementById("contactMessage");
    if (r.value.trim().length < 3 ? (o(a), t = !1) : s(a), n(c.value.trim()) ? s(l) : (o(l), t = !1), "" === i.value ? (o(d), t = !1) : s(d), g.value.trim().length < 10 ? (o(m), t = !1) : s(m), !t) return;
  const contactBtn = u.querySelector('button[type="submit"]');
    contactBtn.classList.add('is-loading');
    contactBtn.innerHTML = '<span class="spinner"></span> Sending...';
    const y = document.getElementById("contactSuccessMsg");
    y.style.display = "block", setTimeout(() => {
      y.style.display = "none";
      contactBtn.classList.remove('is-loading');
      contactBtn.textContent = 'Send Message';
    }, 3500), u.reset()
  });
  const m = document.getElementById("applyFilterBtn");

  function g() {
    const e = document.getElementById("filterClass").value,
      t = document.getElementById("filterSubject").value,
      n = document.getElementById("searchStudent").value.trim().toLowerCase(),
      o = document.querySelectorAll("#reportTable tbody tr");
    let s = 0;
    o.forEach(o => {
      const a = o.getAttribute("data-class"),
        r = o.getAttribute("data-subject"),
        l = o.textContent.toLowerCase(),
        c = "all" === e || a === e,
        d = "all" === t || r === t,
        i = "" === n || l.includes(n);
      c && d && i ? (o.style.display = "", s++) : o.style.display = "none"
    });
    const a = document.getElementById("noResultsMsg");
    a && (a.style.display = 0 === s ? "block" : "none")
  }

  function y(e, t, n) {
    let o = 0;
    const s = t / 60,
      a = setInterval(() => {
        o += s, o >= t && (o = t, clearInterval(a)), e.textContent = Math.floor(o).toLocaleString() + n
      }, 20)
  }
  m && (m.addEventListener("click", g), document.getElementById("searchStudent").addEventListener("input", g), document.getElementById("filterClass").addEventListener("change", g), document.getElementById("filterSubject").addEventListener("change", g));
  const E = document.getElementById("statStudents");
  E && (y(E, 1240, ""), y(document.getElementById("statAvg"), 78, "%"), y(document.getElementById("statPass"), 91, "%"), y(document.getElementById("statCourses"), 36, ""))
}), document.addEventListener("DOMContentLoaded", function() {
  const e = "eduanalytics_users";

  function t() {
    const t = localStorage.getItem(e);
    let n = t ? JSON.parse(t) : [];
    return 0 === n.length && (n = [{
      name: "Demo Teacher",
      email: "demo@eduanalytics.com",
      role: "Teacher",
      password: "demo123"
    }], localStorage.setItem(e, JSON.stringify(n))), n
  }

  function n(e) {
    return t().find(t => t.email.toLowerCase() === e.toLowerCase())
  }
  const o = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function s(e, t) {
    e.classList.add("invalid"), e.classList.remove("valid");
    const n = e.querySelector(".error-text");
    n && t && (n.textContent = t)
  }

  function a(e) {
    e.classList.remove("invalid"), e.classList.add("valid")
  }

  function r(e) {
    e.classList.remove("invalid", "valid")
  }

  function l(e) {
    const t = e.trim();
    if ("" === t) return "We need your email address to continue.";
    if (!t.includes("@")) return "That's missing the @ symbol — e.g. name@example.com.";
    const [n, s] = t.split("@");
    return n ? s ? s.includes(".") ? o.test(t) ? "" : "That email address doesn't look valid — please double-check it." : 'The domain needs an extension, like ".com" or ".edu".' : "Add a domain after the @, like gmail.com." : "Add something before the @ symbol."
  }
  const c = document.getElementById("signupFormEl");
  if (c) {
    const b = document.getElementById("grp-sname"),
      S = document.getElementById("signupName"),
      x = document.getElementById("grp-semail"),
      C = document.getElementById("signupEmail"),
      k = document.getElementById("grp-srole"),
      A = document.getElementById("signupRole"),
      T = document.getElementById("grp-spassword"),
      _ = document.getElementById("signupPassword"),
      N = document.getElementById("toggleSignupPassword"),
      P = document.getElementById("passwordStrength"),
      q = document.getElementById("strengthLabel"),
      M = document.getElementById("pwChecklist"),
      D = document.getElementById("grp-sconfirm"),
      F = document.getElementById("signupConfirmPassword"),
      O = document.getElementById("matchIndicator"),
      j = document.getElementById("grp-sterms"),
      R = document.getElementById("agreeTerms"),
      $ = document.getElementById("signupErrorBanner"),
      J = document.getElementById("signupSuccessMsg");

    function d(e) {
      const t = _.value,
        n = function(e) {
          const t = function(e) {
            return {
              len: e.length >= 8,
              upper: /[A-Z]/.test(e),
              number: /[0-9]/.test(e),
              special: /[^A-Za-z0-9]/.test(e)
            }
          }(e);
          return M && Object.keys(t).forEach(function(e) {
            const n = M.querySelector('[data-rule="' + e + '"]');
            n && n.classList.toggle("met", t[e])
          }), t
        }(t),
        o = Object.values(n).filter(Boolean).length;
      if (P && P.classList.remove("weak", "medium", "strong"), q && (q.className = "strength-label"), 0 === t.length) return q && (q.textContent = ""), e ? s(T, "Password is required.") : r(T), !1;
      let l = "Weak",
        c = "weak";
      4 === o ? (l = "Strong", c = "strong") : o >= 2 && (l = "Fair", c = "medium"), P && P.classList.add(c), q && (q.textContent = "Password strength: " + l, q.classList.add(c));
      const d = n.len && n.upper && n.number && n.special;
      return d ? a(T) : e ? s(T, "Still missing " + (4 - o) + " requirement(s) above.") : r(T), d
    }

    function i(e) {
      if ("" === F.value) return O && (O.textContent = "", O.className = "match-indicator"), e ? s(D, "Please re-enter your password.") : r(D), !1;
      const t = F.value === _.value;
      return O && (O.textContent = t ? "✓ Passwords match" : "✕ Passwords don't match yet", O.className = "match-indicator " + (t ? "match" : "mismatch")), t ? a(D) : s(D, "This doesn't match the password above."), t
    }

    function u(e) {
      const t = S.value.trim().length;
      return 0 === t ? (e ? s(b, "Full name is required.") : r(b), !1) : t < 3 ? (e ? s(b, "That looks too short — enter your full name (min 3 characters).") : r(b), !1) : (a(b), !0)
    }

    function m(e) {
      const t = l(C.value);
      return t ? (e ? s(x, t) : r(x), !1) : (a(x), !0)
    }

    function g(e) {
      const t = "" !== A.value;
      return t ? a(k) : e ? s(k, "Please select the role that best describes you.") : r(k), t
    }

    function y(e) {
      const t = R.checked;
      return t ? r(j) : e && s(j, "You must accept the Terms & Privacy Policy to create an account."), t
    }
    N && N.addEventListener("click", function() {
      const e = "password" === _.type;
      _.type = e ? "text" : "password", N.textContent = e ? "🙈" : "👁️"
    }), S.addEventListener("input", function() {
      u(!1)
    }), S.addEventListener("blur", function() {
      u(!0)
    }), C.addEventListener("input", function() {
      m(!1)
    }), C.addEventListener("blur", function() {
      m(!0)
    }), A.addEventListener("change", function() {
      g(!0)
    }), _.addEventListener("input", function() {
      d(!1), F.value && i(!1)
    }), _.addEventListener("blur", function() {
      d(!0)
    }), F.addEventListener("input", function() {
      i(!1)
    }), F.addEventListener("blur", function() {
      i(!0)
    }), R.addEventListener("change", function() {
      y(!0)
    }), c.addEventListener("submit", function(o) {
      o.preventDefault(), $.style.display = "none";
      if ([u(!0), m(!0), g(!0), d(!0), i(!0), y(!0)].every(Boolean)) {
        if (n(C.value.trim())) return $.textContent = "❌ An account with this email already exists. Please login instead.", void($.style.display = "block");
        const signupBtn = c.querySelector('button[type="submit"]');
signupBtn.classList.add('is-loading');
signupBtn.innerHTML = '<span class="spinner"></span> Creating account...';
        !function(n) {
          const o = t();
          o.push(n), localStorage.setItem(e, JSON.stringify(o))
        }({
          name: S.value.trim(),
          email: C.value.trim(),
          role: A.value,
          password: _.value
        }), J.style.display = "block", c.reset(), P && P.classList.remove("weak", "medium", "strong"), q && (q.textContent = ""), M && M.querySelectorAll("li").forEach(function(e) {
          e.classList.remove("met")
        }), O && (O.textContent = "", O.className = "match-indicator"), document.querySelectorAll("#signupFormEl .form-group").forEach(r), setTimeout(() => {
          window.location.href = "login.html"
        }, 1500)
      }
    })
  }
  const E = document.getElementById("loginFormEl");
  if (E) {
    const W = document.getElementById("togglePassword"),
      Y = document.getElementById("grp-lemail"),
      Z = document.getElementById("loginEmail"),
      z = document.getElementById("grp-lpassword"),
      U = document.getElementById("loginPassword"),
      G = document.getElementById("loginErrorBanner"),
      H = document.getElementById("loginSuccessMsg");

    function v(e) {
      const t = l(Z.value);
      return t ? (e ? s(Y, t) : r(Y), !1) : (a(Y), !0)
    }

    function f(e) {
      const t = U.value.trim().length;
      return 0 === t ? (e ? s(z, "Please enter your password.") : r(z), !1) : t < 6 ? (e ? s(z, "Too short — password needs at least 6 characters (you have " + t + ").") : r(z), !1) : (a(z), !0)
    }
    W && W.addEventListener("click", function() {
      const e = "password" === U.type;
      U.type = e ? "text" : "password", W.textContent = e ? "🙈" : "👁️"
    }), Z.addEventListener("input", function() {
      v(!1)
    }), Z.addEventListener("blur", function() {
      v(!0)
    }), U.addEventListener("input", function() {
      f(!1)
    }), U.addEventListener("blur", function() {
      f(!0)
    }), E.addEventListener("submit", function(e) {
      e.preventDefault(), G.style.display = "none";
      if (![v(!0), f(!0)].every(Boolean)) return;
      const t = n(Z.value.trim());
      if (!t) return G.textContent = "❌ No account found with this email. Try again, or sign up for a new account.", G.style.display = "block", void s(Y, "We don't have an account with this email yet.");
      if (t.password !== U.value) return G.textContent = "❌ That password is incorrect for " + t.email + ". Try again or reset it.", G.style.display = "block", void s(z, "Incorrect password for this account.");
      const loginBtn = E.querySelector('button[type="submit"]');
      loginBtn.classList.add('is-loading');
      loginBtn.innerHTML = '<span class="spinner"></span> Logging in...';
      H.style.display = "block";
      const o = document.getElementById("rememberMe").checked,
        a = JSON.stringify({
          name: t.name,
          email: t.email,
          role: t.role
        });
      o ? localStorage.setItem("eduanalytics_current_user", a) : sessionStorage.setItem("eduanalytics_current_user", a), setTimeout(() => {
        window.location.href = "index.html"
      }, 1200)
    })
  }
  const p = document.getElementById("navAuthLink"),
    h = localStorage.getItem("eduanalytics_current_user") || sessionStorage.getItem("eduanalytics_current_user"),
    I = h ? JSON.parse(h) : null;
  p && (I ? (p.textContent = "Logout", p.href = "#", p.addEventListener("click", function(e) {
    e.preventDefault(), localStorage.removeItem("eduanalytics_current_user"), sessionStorage.removeItem("eduanalytics_current_user"), window.location.href = "login.html"
  })) : (p.textContent = "Login", p.href = "login.html"));
  const B = document.getElementById("welcomeMsg");
  B && I && (B.textContent = `Welcome back, ${I.name} 👋`);
  const L = document.querySelectorAll("section[id]"),
    w = document.querySelectorAll(".nav-link");
  L.length > 0 && window.addEventListener("scroll", function() {
    let e = "";
    L.forEach(t => {
      const n = t.offsetTop - 120;
      window.scrollY >= n && (e = t.getAttribute("id"))
    }), e && w.forEach(t => {
      t.classList.remove("active"), (t.getAttribute("href") === `#${e}` || t.getAttribute("href").includes(e)) && t.classList.add("active")
    })
  })
});