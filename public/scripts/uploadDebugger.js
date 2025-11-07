(function uploadDebuggerModule() {
  function getFileDetails(file) {
    if (!file) return 'No file';
    const sizeMb = ((file.size || 0) / (1024 * 1024)).toFixed(2);
    return `${file.name} (${sizeMb}MB, ${file.type || 'unknown type'})`;
  }

  function log(message, meta) {
    console.log(`[uploadDebugger] ${message}`, meta || '');
  }

  function logError(message, meta) {
    console.error(`[uploadDebugger] ERROR: ${message}`, meta || '');
  }

  function wrapFetch(file, endpoint, formDataKey) {
    return new Promise((resolve, reject) => {
      log('Upload starting...', { file: getFileDetails(file), endpoint });

      const formData = new FormData();
      formData.append(formDataKey, file);

      fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
      .then(res => {
        log('Server responded', { status: res.status, statusText: res.statusText });
        if (!res.ok) {
          res.text().then(text => {
            logError('Server returned an error.', {
              file: getFileDetails(file),
              endpoint,
              status: res.status,
              responseBody: text,
            });
            try {
              const jsonData = JSON.parse(text);
              reject(new Error(jsonData.error || `Upload failed with status ${res.status}`));
            } catch (e) {
              reject(new Error(`Upload failed. Server sent non-JSON response: ${text.substring(0, 100)}...`));
            }
          }).catch(() => {
            logError('Server returned an error, and failed to parse response body.', {
              file: getFileDetails(file),
              endpoint,
              status: res.status,
            });
            reject(new Error(`Upload failed with status ${res.status}.`));
          });
        } else {
          res.json().then(data => {
            if (!data.success) {
              logError('Server indicated failure despite 2xx status.', {
                file: getFileDetails(file),
                endpoint,
                response: data,
              });
              reject(new Error(data.error || 'Backend processing failed.'));
            } else {
              log('Upload successful!', { file: getFileDetails(file), endpoint, response: data });
              resolve(data);
            }
          }).catch(err => {
            logError('Failed to parse successful JSON response.', {
              file: getFileDetails(file),
              endpoint,
              error: err,
            });
            reject(new Error('Response parsing failed.'));
          });
        }
      })
      .catch(err => {
        logError('Network or fetch error.', {
          file: getFileDetails(file),
          endpoint,
          error: err.message,
        });
        reject(new Error(`Network error: ${err.message}`));
      });
    });
  }

  window.uploadDebugger = {
    handle: wrapFetch,
  };

  log('Initialized. Ready to handle uploads.');
})();
