(function servicesModule() {
  const LOG_PREFIX = '[services]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function initAdminServices() {
    const form = document.getElementById('services-form');
    if (!form) return;

    logInfo('Initializing admin services form...');
    const statusEl = document.getElementById('services-save-status');
    
    const inputs = {
      buying_title: document.getElementById('service-buying-title'),
      buying_photo: document.getElementById('service-buying-photo-input'),
      buying_message: document.getElementById('service-buying-message'),
      selling_title: document.getElementById('service-selling-title'),
      selling_photo: document.getElementById('service-selling-photo-input'),
      selling_message: document.getElementById('service-selling-message'),
      invest_title: document.getElementById('service-invest-title'),
      invest_photo: document.getElementById('service-invest-photo-input'),
      invest_message: document.getElementById('service-invest-message'),
    };

    const previews = {
      buying: document.getElementById('service-buying-photo-preview'),
      selling: document.getElementById('service-selling-photo-preview'),
      invest: document.getElementById('service-invest-photo-preview'),
    };

    // 1. Pre-fill the form and previews
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        logInfo('Prefilling admin form with data:', data);
        if (data.buying) {
          inputs.buying_title.value = data.buying.title || '';
          inputs.buying_message.value = data.buying.message || '';
          if (data.buying.photo) {
            previews.buying.src = data.buying.photo;
            previews.buying.style.display = 'block';
          }
        }
        if (data.selling) {
          inputs.selling_title.value = data.selling.title || '';
          inputs.selling_message.value = data.selling.message || '';
          if (data.selling.photo) {
            previews.selling.src = data.selling.photo;
            previews.selling.style.display = 'block';
          }
        }
        if (data.invest) {
          inputs.invest_title.value = data.invest.title || '';
          inputs.invest_message.value = data.invest.message || '';
          if (data.invest.photo) {
            previews.invest.src = data.invest.photo;
            previews.invest.style.display = 'block';
          }
        }
      })
      .catch(err => logError('Could not pre-fill services form', err));

    // 2. Handle live preview on file selection
    function handleFileSelect(event, previewEl) {
      const file = event.target.files[0];
      if (file) {
        previewEl.src = URL.createObjectURL(file);
        previewEl.style.display = 'block';
      }
    }
    inputs.buying_photo.addEventListener('change', (e) => handleFileSelect(e, previews.buying));
    inputs.selling_photo.addEventListener('change', (e) => handleFileSelect(e, previews.selling));
    inputs.invest_photo.addEventListener('change', (e) => handleFileSelect(e, previews.invest));

    // 3. Handle form submission
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      statusEl.textContent = 'Saving...';
      statusEl.style.color = 'inherit';

      const formData = new FormData();
      formData.append('buying_title', inputs.buying_title.value);
      formData.append('buying_message', inputs.buying_message.value);
      if (inputs.buying_photo.files[0]) {
        formData.append('service-buying-photo', inputs.buying_photo.files[0]);
      }

      formData.append('selling_title', inputs.selling_title.value);
      formData.append('selling_message', inputs.selling_message.value);
      if (inputs.selling_photo.files[0]) {
        formData.append('service-selling-photo', inputs.selling_photo.files[0]);
      }

      formData.append('invest_title', inputs.invest_title.value);
      formData.append('invest_message', inputs.invest_message.value);
      if (inputs.invest_photo.files[0]) {
        formData.append('service-invest-photo', inputs.invest_photo.files[0]);
      }
      
      fetch('/api/services', {
        method: 'POST',
        body: formData,
      })
      .then(res => {
        if (!res.ok) throw new Error('Server returned an error');
        return res.json();
      })
      .then(data => {
        if (data.success) {
          statusEl.textContent = '✅ Saved successfully!';
          statusEl.style.color = '#2e7d32';
          logInfo('Services saved. Firing live-update event.');
          try { window.localStorage.setItem('services-update-event', String(Date.now())); } catch (_) {}
        }
      })
      .catch(err => {
        statusEl.textContent = `❌ Save failed: ${err.message}`;
        statusEl.style.color = '#d32f2f';
        logError('Failed to save services', err);
      });
    });
  }

  function initHomepageServices() {
    const buying = {
      title: document.getElementById('service-buying-title'),
      message: document.getElementById('service-buying-message'),
      photo: document.getElementById('service-buying-photo'),
    };
    const selling = {
      title: document.getElementById('service-selling-title'),
      message: document.getElementById('service-selling-message'),
      photo: document.getElementById('service-selling-photo'),
    };
    const invest = {
      title: document.getElementById('service-invest-title'),
      message: document.getElementById('service-invest-message'),
      photo: document.getElementById('service-invest-photo'),
    };
    
    // Guard: only run on homepage where the photo elements exist
    if (!buying.photo || !selling.photo || !invest.photo) return;

    logInfo('Initializing homepage services section...');
    
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        logInfo('Applying services data to homepage:', data);
        if (data.buying) {
          if (buying.title) buying.title.textContent = data.buying.title || buying.title.textContent;
          if (buying.message) buying.message.textContent = data.buying.message || buying.message.textContent;
          if (data.buying.photo) buying.photo.src = data.buying.photo;
        }
        if (data.selling) {
          if (selling.title) selling.title.textContent = data.selling.title || selling.title.textContent;
          if (selling.message) selling.message.textContent = data.selling.message || selling.message.textContent;
          if (data.selling.photo) selling.photo.src = data.selling.photo;
        }
        if (data.invest) {
          if (invest.title) invest.title.textContent = data.invest.title || invest.title.textContent;
          if (invest.message) invest.message.innerHTML = data.invest.message || invest.message.innerHTML; // Preserve formatting
          if (data.invest.photo) invest.photo.src = data.invest.photo;
        }
      })
      .catch(err => logError('Could not fetch or apply services', err));
  }
  
  function listenForServiceUpdates() {
    window.addEventListener('storage', function (e) {
      if (e.key === 'services-update-event') {
        logInfo('Detected services update from another tab. Re-initializing.');
        initHomepageServices();
      }
    });
  }

  onReady(function () {
    initAdminServices();
    initHomepageServices();
    listenForServiceUpdates();
  });

})();
