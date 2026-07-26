/* ==========================================================================
   Week 3: Forgot Password, Reset Password, Ripple Effect, Scroll Reveal
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function() {
  const e = "eduanalytics_reset_code",
    t = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    o = document.getElementById("forgotFormEl");
  o && o.addEventListener("submit", function(n) {
    n.preventDefault();
    const s = document.getElementById("grp-femail"),
      a = document.getElementById("forgotEmail"),
      l = document.getElementById("forgotErrorBanner"),
      i = document.getElementById("otpDisplayBox");
    if (l.style.display = "none", !t.test(a.value.trim())) return void s.classList.add("invalid");
    s.classList.remove("invalid");
    const r = localStorage.getItem("eduanalytics_users"),
      d = r ? JSON.parse(r) : [],
      c = a.value.trim().toLowerCase();
    if (!(d.some(e => e.email.toLowerCase() === c) || "demo@eduanalytics.com" === c))
      return l.textContent = "❌ No account found with this email address.", void(l.style.display = "block");
    const m = Math.floor(1e5 + 9e5 * Math.random()).toString(),
      u = Date.now() + 6e5;
    localStorage.setItem(e, JSON.stringify({ email: c, code: m, expiry: u }));
    document.getElementById("otpCodeText").textContent = m;
    i.style.display = "block";
    o.querySelector('button[type="submit"]').textContent = "Code Sent ✓";
    setTimeout(() => {
      window.location.href = `reset-password.html?email=${encodeURIComponent(c)}`;
    }, 2500);
  });

  const n = document.getElementById("resetFormEl");
  if (n) {
    const t = new URLSearchParams(window.location.search).get("email") || "",
      o = document.getElementById("resetEmailDisplay");
    o && (o.textContent = t || "your account");
    n.addEventListener("submit", function(o) {
      o.preventDefault();
      const s = document.getElementById("grp-rcode"),
        a = document.getElementById("resetCode"),
        l = document.getElementById("grp-rpassword"),
        i = document.getElementById("resetPassword"),
        r = document.getElementById("grp-rconfirm"),
        d = document.getElementById("resetConfirmPassword"),
        c = document.getElementById("resetErrorBanner"),
        m = document.getElementById("resetSuccessMsg");
      c.style.display = "none";
      let u = true;
      const g = localStorage.getItem(e),
        y = g ? JSON.parse(g) : null;
      if (!y || y.email !== t || Date.now() > y.expiry || a.value.trim() !== y.code) {
        s.classList.add("invalid");
        u = false;
      } else {
        s.classList.remove("invalid");
      }
      if (i.value.length < 6) {
        l.classList.add("invalid");
        u = false;
      } else {
        l.classList.remove("invalid");
      }
      if (d.value !== i.value || d.value === "") {
        r.classList.add("invalid");
        u = false;
      } else {
        r.classList.remove("invalid");
      }
      if (!u) return c.textContent = "❌ Please fix the highlighted fields — check your reset code and try again.", void(c.style.display = "block");
      const p = localStorage.getItem("eduanalytics_users");
      let h = p ? JSON.parse(p) : [];
      const v = h.findIndex(e => e.email.toLowerCase() === t.toLowerCase());
      v > -1 ? h[v].password = i.value : h.push({ name: "Demo Teacher", email: t, role: "Teacher", password: i.value });
      localStorage.setItem("eduanalytics_users", JSON.stringify(h));
      localStorage.removeItem(e);
      m.style.display = "block";
      n.reset();
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    });
  }

  document.querySelectorAll(".btn").forEach(e => {
    e.addEventListener("click", function(e) {
      const t = document.createElement("span"),
        o = Math.max(this.clientWidth, this.clientHeight);
      t.style.width = t.style.height = o + "px";
      t.style.left = e.clientX - this.getBoundingClientRect().left - o / 2 + "px";
      t.style.top = e.clientY - this.getBoundingClientRect().top - o / 2 + "px";
      t.classList.add("ripple-circle");
      this.appendChild(t);
      setTimeout(() => t.remove(), 600);
    });
  });

  const s = document.querySelectorAll(".stat-card, .feature-card, .table-wrapper, .form-container");
  s.forEach(e => e.classList.add("reveal"));
  const a = new IntersectionObserver(e => {
    e.forEach(e => {
      e.isIntersecting && (e.target.classList.add("in-view"), a.unobserve(e.target));
    });
  }, { threshold: 0.1 });
  s.forEach(e => a.observe(e));
});