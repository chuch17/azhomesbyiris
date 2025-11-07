(function socialMediaModule() {
  const LOG_PREFIX = '[socialMedia]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }
  function logDebug(msg, meta) { try { console.log(`%c${LOG_PREFIX} [DEBUG] ${msg}`, 'color: #0d47a1;', meta || '') } catch (_) { } }

  function onReady(fn) { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn) } else { fn() } }

  function initAdminSocialMedia() {
    logDebug('Attempting to initialize admin social media form...');
    const form = document.getElementById('social-media-form');
    const statusEl = document.getElementById('social-media-save-status');
    const facebookInput = document.getElementById('social-media-facebook');
    const instagramInput = document.getElementById('social-media-instagram');
    const tiktokInput = document.getElementById('social-media-tiktok');

    if (!form || !statusEl || !facebookInput || !instagramInput || !tiktokInput) {
      logDebug('One or more admin social media form elements were not found. Aborting initialization.');
      return;
    }
    logDebug('All admin social media form elements found. Proceeding with initialization.');

    fetch('/api/social-media/settings')
      .then(res => res.json())
      .then(data => {
        logDebug('Loaded social media settings', data);
        facebookInput.value = data.facebook || '';
        instagramInput.value = data.instagram || '';
        tiktokInput.value = data.tiktok || '';
      })
      .catch(err => logError('Failed to load social media settings', err));

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      logInfo('Social media settings form submitted.');
      statusEl.textContent = 'Saving...';
      statusEl.style.color = 'inherit';

      const settings = {
        facebook: facebookInput.value,
        instagram: instagramInput.value,
        tiktok: tiktokInput.value,
      };

      fetch('/api/social-media/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
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
            logInfo('Server confirmed social media settings saved successfully.');
            statusEl.textContent = '✅ Saved successfully!';
            statusEl.style.color = '#2e7d32';
          } else {
            throw new Error(data.error || 'The server indicated a failure but did not provide an error message.');
          }
        })
        .catch(err => {
          logError('Failed to save social media settings.', err.message);
          statusEl.textContent = `❌ Save failed: ${err.message}`;
          statusEl.style.color = '#d32f2f';
        });
    });
    logInfo('Admin social media form submit listener attached.');
  }

  function initHomepageSocialMedia() {
    logDebug('Attempting to initialize homepage social media links...');
    const navFacebook = document.getElementById('nav-facebook-link');
    const navInstagram = document.getElementById('nav-instagram-link');
    const navTiktok = document.getElementById('nav-tiktok-link');
    const footerFacebook = document.getElementById('footer-facebook-link');
    const footerInstagram = document.getElementById('footer-instagram-link');
    const footerTiktok = document.getElementById('footer-tiktok-link');
  
    fetch('/api/social-media/settings')
      .then(res => res.json())
      .then(settings => {
        logInfo('Applying social media settings to homepage', settings);
        if (settings.facebook) {
          if (navFacebook) navFacebook.href = settings.facebook;
          if (footerFacebook) footerFacebook.href = settings.facebook;
        }
        if (settings.instagram) {
          if (navInstagram) navInstagram.href = settings.instagram;
          if (footerInstagram) footerInstagram.href = settings.instagram;
        }
        if (settings.tiktok) {
          if (navTiktok) navTiktok.href = settings.tiktok;
          if (footerTiktok) footerTiktok.href = settings.tiktok;
        }
      })
      .catch(err => logError('Failed to fetch or apply social media settings on homepage.', err.message));
  }

  onReady(function () {
    logInfo('DOM is ready. Initializing all social media components.');
    initAdminSocialMedia();
    initHomepageSocialMedia();
  });

})();
