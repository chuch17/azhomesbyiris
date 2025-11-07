(function testimonialModule() {
  const LOG_PREFIX = '[testimonials]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // --- ADMIN PAGE LOGIC ---
  function initAdminTestimonials() {
    const form = document.getElementById('testimonials-form');
    if (!form) return; // This isn't the admin page

    logInfo('Initializing admin testimonials form...');
    const statusEl = document.getElementById('testimonials-save-status');
    const inputs = {
      show: document.getElementById('testimonial-show'),
      t1_name: document.getElementById('testimonial-1-name'),
      t1_company: document.getElementById('testimonial-1-company'),
      t1_message: document.getElementById('testimonial-1-message'),
      t2_name: document.getElementById('testimonial-2-name'),
      t2_company: document.getElementById('testimonial-2-company'),
      t2_message: document.getElementById('testimonial-2-message'),
      t3_name: document.getElementById('testimonial-3-name'),
      t3_company: document.getElementById('testimonial-3-company'),
      t3_message: document.getElementById('testimonial-3-message'),
    };

    // 1. Pre-fill the form with current settings
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => {
        logInfo('Prefilling admin form with data:', data);
        inputs.show.checked = data.show || false;
        if (data.t1) {
          inputs.t1_name.value = data.t1.name || '';
          inputs.t1_company.value = data.t1.company || '';
          inputs.t1_message.value = data.t1.message || '';
        }
        if (data.t2) {
          inputs.t2_name.value = data.t2.name || '';
          inputs.t2_company.value = data.t2.company || '';
          inputs.t2_message.value = data.t2.message || '';
        }
        if (data.t3) {
          inputs.t3_name.value = data.t3.name || '';
          inputs.t3_company.value = data.t3.company || '';
          inputs.t3_message.value = data.t3.message || '';
        }
      })
      .catch(err => logError('Could not pre-fill testimonial form', err));

    // 2. Handle form submission
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      statusEl.textContent = 'Saving...';
      statusEl.style.color = 'inherit';

      const dataToSave = {
        show: inputs.show.checked,
        t1: { name: inputs.t1_name.value, company: inputs.t1_company.value, message: inputs.t1_message.value },
        t2: { name: inputs.t2_name.value, company: inputs.t2_company.value, message: inputs.t2_message.value },
        t3: { name: inputs.t3_name.value, company: inputs.t3_company.value, message: inputs.t3_message.value },
      };

      fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })
      .then(res => {
        if (!res.ok) throw new Error('Server returned an error');
        return res.json();
      })
      .then(data => {
        if (data.success) {
          statusEl.textContent = '✅ Saved successfully!';
          statusEl.style.color = '#2e7d32';
          logInfo('Testimonials saved. Firing live-update event.');
          window.localStorage.setItem('testimonials-update-event', Date.now());
        }
      })
      .catch(err => {
        statusEl.textContent = `❌ Save failed: ${err.message}`;
        statusEl.style.color = '#d32f2f';
        logError('Failed to save testimonials', err);
      });
    });
  }

  // --- HOME PAGE LOGIC ---
  function initHomepageTestimonials() {
    const section = document.getElementById('testimonials-section');
    if (!section) return; // This isn't the homepage or section is missing

    logInfo('Initializing homepage testimonials section...');
    const elements = {
      t1_name: document.getElementById('testimonial-1-name'),
      t1_company: document.getElementById('testimonial-1-company'),
      t1_message: document.getElementById('testimonial-1-message'),
      t2_name: document.getElementById('testimonial-2-name'),
      t2_company: document.getElementById('testimonial-2-company'),
      t2_message: document.getElementById('testimonial-2-message'),
      t3_name: document.getElementById('testimonial-3-name'),
      t3_company: document.getElementById('testimonial-3-company'),
      t3_message: document.getElementById('testimonial-3-message'),
    };

    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => {
        logInfo('Applying testimonial data to homepage:', data);
        section.style.display = data.show ? '' : 'none';

        if (data.t1) {
          if (elements.t1_name) elements.t1_name.textContent = data.t1.name || 'Submit Name in Admin';
          if (elements.t1_company) elements.t1_company.textContent = data.t1.company || 'Submit Company in Admin';
          if (elements.t1_message) elements.t1_message.textContent = data.t1.message || 'Ready to place';
        }
        if (data.t2) {
          if (elements.t2_name) elements.t2_name.textContent = data.t2.name || 'Submit Name in Admin';
          if (elements.t2_company) elements.t2_company.textContent = data.t2.company || 'Submit Company in Admin';
          if (elements.t2_message) elements.t2_message.textContent = data.t2.message || 'Ready to place';
        }
        if (data.t3) {
          if (elements.t3_name) elements.t3_name.textContent = data.t3.name || 'Submit Name in Admin';
          if (elements.t3_company) elements.t3_company.textContent = data.t3.company || 'Submit Company in Admin';
          if (elements.t3_message) elements.t3_message.textContent = data.t3.message || 'Ready to place';
        }
      })
      .catch(err => logError('Could not fetch or apply testimonials', err));
  }

  // --- LIVE UPDATE LISTENER ---
  function listenForTestimonialUpdates() {
    window.addEventListener('storage', function (e) {
      if (e.key === 'testimonials-update-event') {
        logInfo('Detected testimonials update from another tab. Re-initializing.');
        initHomepageTestimonials();
      }
    });
  }

  // --- INITIALIZATION ---
  onReady(function () {
    initAdminTestimonials();
    initHomepageTestimonials();
    listenForTestimonialUpdates();
  });

})();
