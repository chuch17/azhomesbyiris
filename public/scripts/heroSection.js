(function heroSectionModule(){
  const LOG_PREFIX = '[heroSection]';
  function logInfo(msg, meta){ try{ console.log(`${LOG_PREFIX} ${msg}`, meta||'') }catch(_){} }
  function logError(msg, err){ try{ console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) }catch(_){} }
  function logDebug(msg, meta){ try{ console.log(`%c${LOG_PREFIX} [DEBUG] ${msg}`, 'color: #0d47a1;', meta||'') }catch(_){} }

  function onReady(fn){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', fn) } else { fn() } }

  function initAdminHero() {
    logDebug('Attempting to initialize admin hero form...');
    const form = document.getElementById('hero-settings-form');
    const videoInput = document.getElementById('hero-video-input');
    const logoInput = document.getElementById('hero-logo-input');
    const statusEl = document.getElementById('hero-save-status');

    if (!form || !videoInput || !logoInput || !statusEl) {
      logDebug('One or more admin hero form elements were not found. Aborting initialization.');
      return;
    }
    logDebug('All admin hero form elements found. Proceeding with initialization.');

    form.addEventListener('submit', function(event) {
      event.preventDefault();
      logInfo('Hero settings form submitted.');
      statusEl.textContent = 'Uploading...';
      statusEl.style.color = 'inherit';

      const videoFile = videoInput.files[0];
      const logoFile = logoInput.files[0];

      logDebug('Files selected', { 
        video: videoFile ? `${videoFile.name} (${videoFile.size} bytes)` : 'none',
        logo: logoFile ? `${logoFile.name} (${logoFile.size} bytes)` : 'none',
      });

      if (!videoFile && !logoFile) {
        statusEl.textContent = 'No new files were selected to upload.';
        return;
      }
      
      const formData = new FormData();
      if (videoFile) formData.append('video', videoFile);
      if (logoFile) formData.append('logo', logoFile);
      
      logDebug('FormData object created. Sending to /api/hero/settings.', formData);

      fetch('/api/hero/settings', {
        method: 'POST',
        body: formData,
      })
      .then(res => {
        logDebug('Received response from server', { status: res.status, statusText: res.statusText });
        if (!res.ok) {
          return res.json().then(errData => {
            const message = (errData && errData.error) || `Server responded with status ${res.status}`;
            throw new Error(message);
          });
        }
        return res.json();
      })
      .then(data => {
        logDebug('Parsed successful server response', data);
        if (data.success) {
          logInfo('Server confirmed hero settings saved successfully.', data.settings);
          statusEl.textContent = '✅ Saved successfully!';
          statusEl.style.color = '#2e7d32';
          form.reset();
          logDebug('Triggering homepage update via localStorage...');
          window.localStorage.setItem('hero-update-event', Date.now());
          logDebug('Homepage update event fired.');
        } else {
          throw new Error(data.error || 'The server indicated a failure but did not provide an error message.');
        }
      })
      .catch(err => {
        logError('Failed to save hero settings.', err.message);
        statusEl.textContent = `❌ Save failed: ${err.message}`;
        statusEl.style.color = '#d32f2f';
      });
    });
    logInfo('Admin hero form submit listener attached.');
  }

  function initHomepageHero(){
    logDebug('Attempting to initialize homepage hero section...');
    const heroVideo = document.getElementById('hero-video'); // Correct ID for homepage
    const titleContainer = document.querySelector('.hero-title-container');

    if (!heroVideo && !titleContainer) {
      logDebug('Homepage hero elements (video or title container) not found. Aborting initialization.');
      return;
    }
    logDebug('Homepage hero elements found. Proceeding with initialization.');
    
    fetch('/api/hero/settings')
      .then(function(r){
        logDebug('Homepage received response from /api/hero/settings.');
        return r.json();
      })
      .then(function(data){
        logInfo('Applying hero settings to homepage', data);
        
        if (data && data.videoUrl && heroVideo){
          const src = `${data.videoUrl}?cacheBust=${Date.now()}`;
          logDebug('Applying new video src', { src });
          heroVideo.src = src;
          heroVideo.load();
          const videoEl = document.getElementById('hero-video');
          if (videoEl) {
            // Ensure attributes are set for autoplay policies
            videoEl.muted = true;
            videoEl.playsInline = true;

            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                logError('Video autoplay was prevented by the browser.', error);
                // Autoplay was blocked. We can't force it, but we've handled the error.
              });
            }
          }
        } else {
          logDebug('No videoUrl in settings or video element missing.');
        }

        if (data && data.logoUrl && titleContainer){
          logDebug('Applying new logo src', { logoUrl: data.logoUrl });
          const img = document.createElement('img');
          img.src = `${data.logoUrl}?cacheBust=${Date.now()}`;
          img.alt = 'Company Logo';
          img.style.maxHeight = '350px';
          img.style.objectFit = 'contain';
          titleContainer.innerHTML = ''; // Clear previous content (e.g., the H1)
          titleContainer.appendChild(img);
        } else {
          logDebug('No logoUrl in settings or title container missing.');
        }
      })
      .catch(function(e){
        logError('Failed to fetch or apply hero settings on homepage.', e.message);
      });
  }

  function listenForHeroUpdates() {
    window.addEventListener('storage', function(e) {
      if (e.key === 'hero-update-event') {
        logInfo('Detected hero update event from another tab. Re-initializing hero section for live update.');
        initHomepageHero();
      }
    });
    logDebug('Attached localStorage listener for live updates.');
  }

  onReady(function() {
    logInfo('DOM is ready. Initializing all hero components.');
    initAdminHero();
    initHomepageHero();
    listenForHeroUpdates();
  });

})();


