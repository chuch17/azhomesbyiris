(function portalModule() {
  const LOG_PREFIX = '[portal]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }
  function logDebug(msg, meta) { try { console.log(`%c${LOG_PREFIX} [DEBUG] ${msg}`, 'color: #0d47a1;', meta || '') } catch (_) { } }

  function onReady(fn) { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn) } else { fn() } }

  function initPortalLogin() {
    logDebug('Attempting to initialize portal login form...');
    const form = document.getElementById('portalLoginForm');
    if (!form) {
      logDebug('Portal login form not found. Aborting initialization.');
      return;
    }
    logDebug('Portal login form found. Proceeding with initialization.');
    const statusEl = document.getElementById('portal-login-status');
    const emailInput = document.getElementById('portalEmail');
    const passwordInput = document.getElementById('portalPassword');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      logInfo('Portal login form submitted.');
      statusEl.textContent = 'Logging in...';
      statusEl.style.color = 'inherit';

      const email = emailInput.value;
      const password = passwordInput.value;

      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              const message = (errData && errData.error) || `Server responded with status ${res.status}`;
              throw new Error(message);
            });
          }
          return res.json();
        })
        .then(data => {
          if (data.success) {
            logInfo('Login successful. Redirecting to admin page.');
            window.location.href = '/admin.html';
          } else {
            throw new Error(data.error || 'The server indicated a failure but did not provide an error message.');
          }
        })
        .catch(err => {
          logError('Failed to log in.', err.message);
          statusEl.textContent = `❌ Login failed: ${err.message}`;
          statusEl.style.color = '#d32f2f';
        });
    });
    logInfo('Portal login form submit listener attached.');
  }

  onReady(function () {
    logInfo('DOM is ready. Initializing all portal components.');
    initPortalLogin();
  });

})();
