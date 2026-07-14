document.addEventListener('DOMContentLoaded', function () {

  const USERS_KEY = 'eduanalytics_users';
  const CURRENT_USER_KEY = 'eduanalytics_current_user';

  function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  function getCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  function isInLocalStorage() {
    return !!localStorage.getItem(CURRENT_USER_KEY);
  }
  function persistSession(user) {
    const json = JSON.stringify(user);
    if (isInLocalStorage()) localStorage.setItem(CURRENT_USER_KEY, json);
    else sessionStorage.setItem(CURRENT_USER_KEY, json);
  }

  const guestNotice = document.getElementById('profileGuestNotice');
  const content = document.getElementById('profileContent');
  let currentUser = getCurrentUser();

  if (!currentUser) {
    guestNotice.style.display = 'block';
    content.style.display = 'none';
    return;
  }

  guestNotice.style.display = 'none';
  content.style.display = 'block';

  currentUser.profile = currentUser.profile || {};
  let skills = Array.isArray(currentUser.profile.skills) ? currentUser.profile.skills.slice() : [];

  const skillTagList = document.getElementById('skillTagList');
  const skillInput = document.getElementById('profileSkillInput');

  function renderTags() {
    skillTagList.innerHTML = skills.map((s, i) =>
      `<span class="tag-chip">${s}<button type="button" class="tag-remove" data-idx="${i}" aria-label="Remove ${s}">&times;</button></span>`
    ).join('');
  }
  skillTagList.addEventListener('click', function (e) {
    const btn = e.target.closest('.tag-remove');
    if (!btn) return;
    skills.splice(Number(btn.dataset.idx), 1);
    renderTags();
  });
  skillInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.value.trim().replace(/,$/, '');
      if (val && !skills.includes(val)) {
        skills.push(val);
        renderTags();
      }
      skillInput.value = '';
    }
  });

  const avatarPicker = document.getElementById('avatarPicker');
  const avatarInitialEl = document.getElementById('profileAvatarInitial');

  function setAvatar(emoji) {
    currentUser.profile.avatar = emoji;
    if (emoji) {
      avatarInitialEl.textContent = emoji;
      avatarInitialEl.classList.add('avatar-emoji');
    } else {
      avatarInitialEl.textContent = (currentUser.name || '?').trim().charAt(0).toUpperCase() || '?';
      avatarInitialEl.classList.remove('avatar-emoji');
    }
    avatarPicker.querySelectorAll('.avatar-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.avatar === emoji);
    });
  }
  avatarPicker.addEventListener('click', function (e) {
    const btn = e.target.closest('.avatar-option');
    if (!btn) return;
    const emoji = btn.dataset.avatar;
    const isSame = currentUser.profile.avatar === emoji;
    setAvatar(isSame ? '' : emoji);
  });

  const bioInput = document.getElementById('profileBio');
  const bioCounter = document.getElementById('bioCounter');
  bioInput.addEventListener('input', function () {
    bioCounter.textContent = `${bioInput.value.length} / 240`;
  });

  function refreshDisplay(user) {
    const p = user.profile || {};
    document.getElementById('profileCardName').textContent = user.name;
    document.getElementById('profileCardEmail').textContent = user.email;

    const roleBadge = document.getElementById('profileCardRoleBadge');
    roleBadge.textContent = user.role;
    roleBadge.className = 'role-badge role-badge-' + (user.role || 'student').toLowerCase();

    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileRole').value = user.role || '';
    document.getElementById('profilePhone').value = p.phone || '';
    document.getElementById('profileDob').value = p.dob || '';
    document.getElementById('profileDept').value = p.department || '';
    document.getElementById('profileAddress').value = p.address || '';
    document.getElementById('profileBio').value = p.bio || '';
    bioCounter.textContent = `${(p.bio || '').length} / 240`;
    document.getElementById('emergencyName').value = p.emergencyName || '';
    document.getElementById('emergencyPhone').value = p.emergencyPhone || '';
    document.getElementById('profileLinkedin').value = p.linkedin || '';
    document.getElementById('profileGithub').value = p.github || '';

    skills = Array.isArray(p.skills) ? p.skills.slice() : [];
    renderTags();
    setAvatar(p.avatar || '');

    const fields = [user.name, p.phone, p.dob, p.department, p.address, p.bio, skills.length, p.linkedin || p.github];
    const filled = fields.filter(Boolean).length;
    const pct = Math.round((filled / fields.length) * 100);
    document.getElementById('profileCardStats').innerHTML =
      `<div class="profile-completeness"><div class="profile-completeness-bar" style="width:${pct}%"></div></div>
       <p style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">${pct}% profile complete</p>`;
  }
  refreshDisplay(currentUser);

  const profileForm = document.getElementById('profileFormEl');
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const nameGroup = document.getElementById('grp-pname');
    const nameInput = document.getElementById('profileName');
    const phoneGroup = document.getElementById('grp-pphone');
    const phoneInput = document.getElementById('profilePhone');
    const successMsg = document.getElementById('profileSuccessMsg');

    let isValid = true;
    if (nameInput.value.trim().length < 3) {
      nameGroup.classList.add('invalid'); isValid = false;
    } else {
      nameGroup.classList.remove('invalid');
    }
    if (phoneInput.value.trim() && !/^[0-9+\-\s()]{7,}$/.test(phoneInput.value.trim())) {
      phoneGroup.classList.add('invalid'); isValid = false;
    } else {
      phoneGroup.classList.remove('invalid');
    }
    if (!isValid) return;

    currentUser.name = nameInput.value.trim();
    currentUser.profile = {
      avatar: currentUser.profile.avatar || '',
      phone: phoneInput.value.trim(),
      dob: document.getElementById('profileDob').value,
      department: document.getElementById('profileDept').value.trim(),
      address: document.getElementById('profileAddress').value.trim(),
      bio: document.getElementById('profileBio').value.trim(),
      skills: skills,
      emergencyName: document.getElementById('emergencyName').value.trim(),
      emergencyPhone: document.getElementById('emergencyPhone').value.trim(),
      linkedin: document.getElementById('profileLinkedin').value.trim(),
      github: document.getElementById('profileGithub').value.trim()
    };

    const users = getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx].name = currentUser.name;
      users[idx].profile = currentUser.profile;
      saveUsers(users);
    }

    persistSession(currentUser);
    refreshDisplay(currentUser);
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 2500);
  });

  const passwordForm = document.getElementById('passwordFormEl');
  passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let isValid = true;

    const currentGroup = document.getElementById('grp-currentpass');
    const currentInput = document.getElementById('currentPassword');
    const newGroup = document.getElementById('grp-newpass');
    const newInput = document.getElementById('newPassword');
    const confirmGroup = document.getElementById('grp-confirmpass');
    const confirmInput = document.getElementById('confirmNewPassword');
    const errorBanner = document.getElementById('passwordErrorBanner');
    const successMsg = document.getElementById('passwordSuccessMsg');

    errorBanner.style.display = 'none';

    const users = getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());

    if (idx === -1 || users[idx].password !== currentInput.value) {
      currentGroup.classList.add('invalid');
      isValid = false;
    } else {
      currentGroup.classList.remove('invalid');
    }

    if (newInput.value.length < 6) {
      newGroup.classList.add('invalid'); isValid = false;
    } else {
      newGroup.classList.remove('invalid');
    }

    if (confirmInput.value !== newInput.value || confirmInput.value === '') {
      confirmGroup.classList.add('invalid'); isValid = false;
    } else {
      confirmGroup.classList.remove('invalid');
    }

    if (!isValid) {
      if (idx !== -1 && users[idx].password !== currentInput.value) {
        errorBanner.textContent = '❌ Your current password is incorrect.';
        errorBanner.style.display = 'block';
      }
      return;
    }

    users[idx].password = newInput.value;
    saveUsers(users);

    passwordForm.reset();
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 2500);
  });

  const darkModeSwitch = document.getElementById('darkModeSwitch');
  darkModeSwitch.checked = document.documentElement.getAttribute('data-theme') === 'dark';
  darkModeSwitch.addEventListener('change', function () {
    const next = darkModeSwitch.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('eduanalytics_theme', next);
  });

  const EMAIL_NOTIF_KEY = 'eduanalytics_email_notifs';
  const emailNotifSwitch = document.getElementById('emailNotifSwitch');
  emailNotifSwitch.checked = localStorage.getItem(EMAIL_NOTIF_KEY) !== 'off';
  emailNotifSwitch.addEventListener('change', function () {
    localStorage.setItem(EMAIL_NOTIF_KEY, emailNotifSwitch.checked ? 'on' : 'off');
  });

});