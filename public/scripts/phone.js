(function phoneSettingsModule() {
  const LOG_PREFIX = '[phoneSettings]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }
  function logDebug(msg, meta) { try { console.log(`%c${LOG_PREFIX} [DEBUG] ${msg}`, 'color: #0d47a1;', meta || '') } catch (_) { } }

  function onReady(fn) { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn) } else { fn() } }

  function initAdminPhoneSettings() {
    logDebug('Attempting to initialize admin phone settings form...');
    const form = document.getElementById('phone-settings-form');
    if (!form) {
      logDebug('Admin phone settings form not found. Aborting initialization.');
      return;
    }
    logDebug('Admin phone settings form found. Proceeding with initialization.');
    const statusEl = document.getElementById('phone-save-status');
    const phoneInput = document.getElementById('phone-number-input');

    fetch('/api/phone/settings')
      .then(res => res.json())
      .then(data => {
        logDebug('Loaded phone settings', data);
        phoneInput.value = data.phoneNumber || '';
      })
      .catch(err => logError('Failed to load phone settings', err));

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      logInfo('Phone settings form submitted.');
      statusEl.textContent = 'Saving...';
      statusEl.style.color = 'inherit';

      const phoneNumber = phoneInput.value;

      fetch('/api/phone/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
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
            logInfo('Server confirmed phone settings saved successfully.');
            statusEl.textContent = '✅ Saved successfully!';
            statusEl.style.color = '#2e7d32';
          } else {
            throw new Error(data.error || 'The server indicated a failure but did not provide an error message.');
          }
        })
        .catch(err => {
          logError('Failed to save phone settings.', err.message);
          statusEl.textContent = `❌ Save failed: ${err.message}`;
          statusEl.style.color = '#d32f2f';
        });
    });
    logInfo('Admin phone settings form submit listener attached.');
  }

  function initHomepagePhoneLink() {
    logDebug('Attempting to initialize homepage phone link...');
    const letsTalkLink = document.getElementById('lets-talk-link');
    if (!letsTalkLink) {
      logDebug('Homepage "Let\'s Talk" link not found. Aborting initialization.');
      return;
    }
    
    fetch('/api/phone/settings')
      .then(res => res.json())
      .then(settings => {
        logInfo('Applying phone settings to homepage', settings);
        if (settings.phoneNumber) {
          letsTalkLink.href = `tel:${settings.phoneNumber}`;
        }
      })
      .catch(err => logError('Failed to fetch or apply phone settings on homepage.', err.message));
  }

  onReady(function () {
    logInfo('DOM is ready. Initializing all phone components.');
    initAdminPhoneSettings();
    initHomepagePhoneLink();
  });

})();
