(function contactFormModule() {
  function logInfo(message, meta) {
    try {
      if (meta) {
        // eslint-disable-next-line no-console
        console.log(`[contactForm] ${message}`, meta);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[contactForm] ${message}`);
      }
    } catch (_) {}
  }

  function logError(message, error, meta) {
    try {
      // eslint-disable-next-line no-console
      console.error(`[contactForm] ${message}`, error && (error.stack || error.message || String(error)), meta || {});
    } catch (_) {}
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) {
      logInfo('contactForm not found; skipping.');
      return;
    }

    // Neutralize any default HTML submission behavior
    try {
      form.setAttribute('novalidate', 'novalidate');
      form.removeAttribute('action');
    } catch (_) {}

    var submitButton = form.querySelector('.form-submit');

    function getSelectedInterests() {
      var ids = ['interestBuy', 'interestSell', 'interestInvest'];
      var values = [];
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.checked) values.push(el.value || el.getAttribute('value') || '');
      });
      return values.filter(Boolean);
    }

    function ensureStatusEl() {
      var statusEl = document.getElementById('contactStatus');
      if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'contactStatus';
        statusEl.style.marginTop = '12px';
        statusEl.style.fontSize = '0.95rem';
        form.appendChild(statusEl);
      }
      return statusEl;
    }

    function setLoading(isLoading) {
      if (!submitButton) return;
      if (isLoading) {
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
      } else {
        submitButton.textContent = submitButton.dataset.originalText || 'Send Message';
        submitButton.disabled = false;
      }
    }

    // Capture-phase listener to prevent default and stop other handlers
    form.addEventListener('submit', function (e) {
      // Prevent any default or previously-bound submit behavior
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();

      var statusEl = ensureStatusEl();
      statusEl.textContent = '';
      statusEl.style.color = '';

      var name = (document.getElementById('name') && document.getElementById('name').value) || '';
      var email = (document.getElementById('email') && document.getElementById('email').value) || '';
      var phone = (document.getElementById('phone') && document.getElementById('phone').value) || '';
      var message = (document.getElementById('message') && document.getElementById('message').value) || '';
      var interests = getSelectedInterests();

      if (!name || !email || !message) {
        statusEl.style.color = 'red';
        statusEl.textContent = '❌ Please fill in Name, Email and Message.';
        logInfo('Validation failed', { name: !!name, email: !!email, message: !!message });
        return;
      }

      setLoading(true);
      logInfo('Submitting contact form...', { name: name, email: email, phone: !!phone, interests: interests });

      fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, phone: phone, message: message, interests: interests })
      })
        .then(function (res) { return Promise.all([res.ok, res.json().catch(function(){ return {}; })]); })
        .then(function (pair) {
          var ok = pair[0];
          var data = pair[1] || {};
          if (!ok || !data.success) {
            var reason = (data && (data.error || data.message)) || 'Failed to send';
            throw new Error(reason);
          }
          statusEl.style.color = 'green';
          statusEl.textContent = '✅ Message sent successfully';
          form.reset();
          logInfo('Contact form sent successfully', { messageId: data.messageId || null });
        })
        .catch(function (err) {
          statusEl.style.color = 'red';
          statusEl.textContent = '❌ Failed to send message: ' + (err && err.message ? err.message : 'Unknown error');
          logError('Submission failed', err);
        })
        .finally(function () {
          setLoading(false);
        });
    }, true);

    logInfo('contactForm initialized.');
  });
})();


