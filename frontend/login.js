(function () {
  'use strict';

  var isRegister = false;
  var loading = false;
  var touched = { name: false, email: false, password: false };

  var $ = function (id) { return document.getElementById(id); };
  var form = $('auth-form');
  var title = $('title');
  var subtitle = $('subtitle');
  var nameField = $('name-field');
  var nameInput = $('name');
  var emailInput = $('email');
  var passwordInput = $('password');
  var nameError = $('name-error');
  var emailError = $('email-error');
  var passwordError = $('password-error');
  var passwordHint = $('password-hint');
  var message = $('message');
  var submitBtn = $('submit');
  var submitLabel = $('submit-label');
  var toggleBtn = $('toggle');
  var toggleText = $('toggle-text');
  var togglePwdBtn = $('toggle-password');

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
    return;
  }

  function showMessage(text, type) {
    message.textContent = text || '';
    message.className = 'message' + (text && type ? ' ' + type : '');
  }

  function setFieldError(input, el, text) {
    el.textContent = text || '';
    if (text) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function validateName(show) {
    var ok = !isRegister || nameInput.value.trim().length > 0;
    setFieldError(nameInput, nameError, show && !ok ? 'Ingresa tu nombre.' : '');
    return ok;
  }

  function validateEmail(show) {
    var v = emailInput.value.trim();
    var text = '';
    if (!v) { text = 'Ingresa tu email.'; }
    else if (!EMAIL_RE.test(v)) { text = 'Ingresa un email valido (ej. tu@correo.com).'; }
    setFieldError(emailInput, emailError, show ? text : '');
    return !text;
  }

  function validatePassword(show) {
    var v = passwordInput.value;
    var text = '';
    if (!v) { text = 'Ingresa tu contrasena.'; }
    else if (isRegister && v.length < 6) { text = 'La contrasena debe tener al menos 6 caracteres.'; }
    setFieldError(passwordInput, passwordError, show ? text : '');

    if (isRegister) {
      var left = 6 - v.length;
      var good = left <= 0;
      passwordHint.textContent = good ? 'Contrasena valida.' : 'Minimo 6 caracteres' + (v ? ' (faltan ' + left + ').' : '.');
      passwordHint.className = 'hint' + (good ? ' ok' : '');
    }
    return !text;
  }

  function setLoading(state) {
    loading = state;
    submitBtn.disabled = state;
    submitBtn.classList.toggle('loading', state);
    submitBtn.setAttribute('aria-busy', state ? 'true' : 'false');
    if (state) {
      submitLabel.textContent = isRegister ? 'Creando cuenta...' : 'Ingresando...';
    } else {
      submitLabel.textContent = isRegister ? 'Registrarme' : 'Entrar';
    }
  }

  function render() {
    title.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesion';
    subtitle.textContent = isRegister ? 'Registrate para empezar' : 'Ingresa tus datos para continuar';
    document.title = title.textContent;
    toggleText.textContent = isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?';
    toggleBtn.textContent = isRegister ? 'Inicia sesion' : 'Registrate';
    nameField.classList.toggle('open', isRegister);
    nameField.setAttribute('aria-hidden', isRegister ? 'false' : 'true');
    nameInput.disabled = !isRegister;
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    passwordHint.className = 'hint';
    passwordHint.textContent = 'Minimo 6 caracteres.';
    submitLabel.textContent = isRegister ? 'Registrarme' : 'Entrar';
    showMessage('');
    setFieldError(nameInput, nameError, '');
    setFieldError(emailInput, emailError, '');
    setFieldError(passwordInput, passwordError, '');
    touched = { name: false, email: false, password: false };
  }

  toggleBtn.addEventListener('click', function () {
    if (loading) { return; }
    isRegister = !isRegister;
    render();
    // Foco tras iniciar la transicion
    (isRegister ? nameInput : emailInput).focus({ preventScroll: true });
  });

  togglePwdBtn.addEventListener('click', function () {
    var show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePwdBtn.setAttribute('aria-pressed', show ? 'true' : 'false');
    togglePwdBtn.setAttribute('aria-label', show ? 'Ocultar contrasena' : 'Mostrar contrasena');
    passwordInput.focus();
  });

  nameInput.addEventListener('blur', function () { touched.name = true; validateName(true); });
  emailInput.addEventListener('blur', function () { touched.email = true; validateEmail(true); });
  passwordInput.addEventListener('blur', function () { touched.password = true; validatePassword(true); });

  nameInput.addEventListener('input', function () { validateName(touched.name); });
  emailInput.addEventListener('input', function () { validateEmail(touched.email); });
  passwordInput.addEventListener('input', function () { validatePassword(touched.password); });

  async function request(path, body) {
    var res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    var data = {};
    try { data = await res.json(); } catch (e) { /* cuerpo vacio */ }
    if (!res.ok) {
      throw new Error(data.error || 'Error inesperado (' + res.status + ')');
    }
    return data;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (loading) { return; }

    touched = { name: true, email: true, password: true };
    var okName = validateName(true);
    var okEmail = validateEmail(true);
    var okPwd = validatePassword(true);

    if (!okName || !okEmail || !okPwd) {
      showMessage('Revisa los campos marcados.', 'error');
      var first = !okName ? nameInput : (!okEmail ? emailInput : passwordInput);
      first.focus();
      return;
    }

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var name = nameInput.value.trim();

    showMessage('');
    setLoading(true);
    try {
      if (isRegister) {
        await request('/api/auth/register', { name: name, email: email, password: password });
        showMessage('Cuenta creada. Iniciando sesion...', 'success');
      }
      var data = await request('/api/auth/login', { email: email, password: password });
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    } catch (err) {
      var msg = err instanceof TypeError ? 'No se pudo conectar con el servidor.' : err.message;
      showMessage(msg, 'error');
      setLoading(false);
      passwordInput.focus();
    }
  });

  render();
  emailInput.focus();
})();
