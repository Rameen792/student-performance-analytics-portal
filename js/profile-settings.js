/* ==========================================================================
   WEEK 4: Profile Management Page Logic
   ========================================================================== */

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

  /* ---- Populate summary card + form fields ---- */
  function refreshDisplay(user) {
    document.getElementById('profileAvatarInitial').textContent = user.name.trim().charAt(0).toUpperCase() || '?';
    document.getElementById('profileCardName').textContent = user.name;
    document.getElementById('profileCardEmail').textContent = user.email;

    const roleBadge = document.getElementById('profileCardRoleBadge');
    roleBadge.textContent = user.role;
    roleBadge.className = 'role-badge role-badge-' + (user.role || 'student').toLowerCase();

    document.getElementById('profileName').value = user.name;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileRole').value = user.role;
  }
  refreshDisplay(currentUser);

  /* ---------------------------------------------------------
     1. UPDATE NAME
  --------------------------------------------------------- */
  const profileForm = document.getElementById('profileFormEl');
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const nameGroup = document.getElementById('grp-pname');
    const nameInput = document.getElementById('profileName');
    const successMsg = document.getElementById('profileSuccessMsg');

    if (nameInput.value.trim().length < 3) {
      nameGroup.classList.add('invalid');
      return;
    }
    nameGroup.classList.remove('invalid');

    // Update the users "database"
    const users = getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx].name = nameInput.value.trim();
      saveUsers(users);
    }

    // Update the active session
    currentUser.name = nameInput.value.trim();
    const updatedJSON = JSON.stringify(currentUser);
    if (isInLocalStorage()) {
      localStorage.setItem(CURRENT_USER_KEY, updatedJSON);
    } else {
      sessionStorage.setItem(CURRENT_USER_KEY, updatedJSON);
    }

    refreshDisplay(currentUser);
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 2500);
  });

  /* ---------------------------------------------------------
     2. CHANGE PASSWORD
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     3. PREFERENCES: Dark mode switch + email notifications
  --------------------------------------------------------- */
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