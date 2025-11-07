(function securitySettingsModule() {
  const LOG_PREFIX = '[securitySettings]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }
  function logDebug(msg, meta) { try { console.log(`%c${LOG_PREFIX} [DEBUG] ${msg}`, 'color: #0d47a1;', meta || '') } catch (_) { } }

  function onReady(fn) { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn) } else { fn() } }

  function initAdminSecuritySettings() {
    logDebug('Attempting to initialize admin security settings form...');
    const form = document.getElementById('security-settings-form');
    if (!form) {
      logDebug('Admin security settings form not found. Aborting initialization.');
      return;
    }
    logDebug('Admin security settings form found. Proceeding with initialization.');
    const statusEl = document.getElementById('security-save-status');
    const emailInput = document.getElementById('security-email-input');
    const passwordInput = document.getElementById('security-password-input');
    const confirmPasswordInput = document.getElementById('security-confirm-password-input');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      logInfo('Security settings form submitted.');
      
      if (passwordInput.value !== confirmPasswordInput.value) {
        statusEl.textContent = '❌ Passwords do not match.';
        statusEl.style.color = '#d32f2f';
        return;
      }

      statusEl.textContent = 'Saving...';
      statusEl.style.color = 'inherit';

      const email = emailInput.value;
      const password = passwordInput.value;

      fetch('/api/auth/update-credentials', {
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
            logInfo('Server confirmed security settings saved successfully.');
            statusEl.textContent = '✅ Credentials updated successfully!';
            statusEl.style.color = '#2e7d32';
            form.reset();
          } else {
            throw new Error(data.error || 'The server indicated a failure but did not provide an error message.');
          }
        })
        .catch(err => {
          logError('Failed to save security settings.', err.message);
          statusEl.textContent = `❌ Save failed: ${err.message}`;
          statusEl.style.color = '#d32f2f';
        });
    });
    logInfo('Admin security settings form submit listener attached.');
  }

  onReady(function () {
    logInfo('DOM is ready. Initializing all security components.');
    initAdminSecuritySettings();
  });

})();
