/* ==========================================================================
   Week 3: Forgot Password, Reset Password, Ripple Effect, Scroll Reveal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  const RESET_KEY = 'eduanalytics_reset_code';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---- FORGOT PASSWORD FORM ---- */
  const forgotForm = document.getElementById('forgotFormEl');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailGroup = document.getElementById('grp-femail');
      const emailInput = document.getElementById('forgotEmail');
      const errorBanner = document.getElementById('forgotErrorBanner');
      const codeBox = document.getElementById('otpDisplayBox');

      errorBanner.style.display = 'none';

      if (!emailPattern.test(emailInput.value.trim())) {
        emailGroup.classList.add('invalid');
        return;
      }
      emailGroup.classList.remove('invalid');

      const usersJSON = localStorage.getItem('eduanalytics_users');
      const users = usersJSON ? JSON.parse(usersJSON) : [];
      const email = emailInput.value.trim().toLowerCase();
      const userExists = users.some(u => u.email.toLowerCase() === email) || email === 'demo@eduanalytics.com';

      if (!userExists) {
        errorBanner.textContent = '❌ No account found with this email address.';
        errorBanner.style.display = 'block';
        return;
      }

      // Generate a 6-digit demo code, valid for 10 minutes (simulated email)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000;
      localStorage.setItem(RESET_KEY, JSON.stringify({ email, code, expiry }));

      document.getElementById('otpCodeText').textContent = code;
      codeBox.style.display = 'block';
      forgotForm.querySelector('button[type="submit"]').textContent = 'Code Sent ✓';

      setTimeout(() => {
        window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
      }, 2500);
    });
  }

  /* ---- RESET PASSWORD FORM ---- */
  const resetForm = document.getElementById('resetFormEl');
  if (resetForm) {
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get('email') || '';
    const emailDisplay = document.getElementById('resetEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = emailFromUrl || 'your account';

    resetForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const codeGroup = document.getElementById('grp-rcode');
      const codeInput = document.getElementById('resetCode');
      const passGroup = document.getElementById('grp-rpassword');
      const passInput = document.getElementById('resetPassword');
      const confirmGroup = document.getElementById('grp-rconfirm');
      const confirmInput = document.getElementById('resetConfirmPassword');
      const errorBanner = document.getElementById('resetErrorBanner');
      const successMsg = document.getElementById('resetSuccessMsg');

      errorBanner.style.display = 'none';
      let isValid = true;

      const storedJSON = localStorage.getItem(RESET_KEY);
      const stored = storedJSON ? JSON.parse(storedJSON) : null;

      if (!stored || stored.email !== emailFromUrl || Date.now() > stored.expiry || codeInput.value.trim() !== stored.code) {
        codeGroup.classList.add('invalid'); isValid = false;
      } else {
        codeGroup.classList.remove('invalid');
      }

      if (passInput.value.length < 6) { passGroup.classList.add('invalid'); isValid = false; }
      else passGroup.classList.remove('invalid');

      if (confirmInput.value !== passInput.value || confirmInput.value === '') {
        confirmGroup.classList.add('invalid'); isValid = false;
      } else confirmGroup.classList.remove('invalid');

      if (!isValid) {
        errorBanner.textContent = '❌ Please fix the highlighted fields — check your reset code and try again.';
        errorBanner.style.display = 'block';
        return;
      }

      // Update the matching user's password (or add a demo override)
      const usersJSON = localStorage.getItem('eduanalytics_users');
      let users = usersJSON ? JSON.parse(usersJSON) : [];
      const idx = users.findIndex(u => u.email.toLowerCase() === emailFromUrl.toLowerCase());

      if (idx > -1) users[idx].password = passInput.value;
      else users.push({ name: 'Demo Teacher', email: emailFromUrl, role: 'Teacher', password: passInput.value });

      localStorage.setItem('eduanalytics_users', JSON.stringify(users));
      localStorage.removeItem(RESET_KEY);

      successMsg.style.display = 'block';
      resetForm.reset();
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }

  /* ---- BUTTON RIPPLE EFFECT (all .btn elements, every page) ---- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      const diameter = Math.max(this.clientWidth, this.clientHeight);
      circle.style.width = circle.style.height = diameter + 'px';
      circle.style.left = (e.clientX - this.getBoundingClientRect().left - diameter / 2) + 'px';
      circle.style.top = (e.clientY - this.getBoundingClientRect().top - diameter / 2) + 'px';
      circle.classList.add('ripple-circle');
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  /* ---- SCROLL REVEAL ANIMATIONS (fade + rise into view) ---- */
  const revealTargets = document.querySelectorAll('.stat-card, .feature-card, .table-wrapper, .form-container');
  revealTargets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealTargets.forEach(el => observer.observe(el));

});