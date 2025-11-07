(function aboutMeModule() {
    const LOG_PREFIX = '[aboutMe]';
    function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
    function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function initAdminAboutMe() {
        const form = document.getElementById('about-me-form');
        if (!form) return;

        logInfo('Initializing admin about-me form...');
        const titleInput = document.getElementById('about-me-title');
        const descriptionInput = document.getElementById('about-me-description');
        const photoInput = document.getElementById('about-me-photo');
        const photoPreview = document.getElementById('about-me-photo-preview');
        const statusEl = document.getElementById('about-me-save-status');

        fetch('/api/about-me')
            .then(res => {
                if (!res.ok) throw new Error(`Server returned status ${res.status}`);
                return res.json();
            })
            .then(data => {
                logInfo('Prefilling admin form with data from server:', data);
                if (data) {
                    titleInput.value = data.title || '';
                    descriptionInput.value = data.description || '';
                    if (data.imageUrl) {
                        photoPreview.src = data.imageUrl;
                        photoPreview.style.display = 'block';
                    }
                }
            })
            .catch(err => logError('Could not pre-fill about-me form', err));

        photoInput.addEventListener('change', () => {
            const file = photoInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.src = e.target.result;
                    photoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            statusEl.textContent = 'Saving...';
            statusEl.style.color = 'inherit';

            const formData = new FormData();
            formData.append('title', titleInput.value);
            formData.append('description', descriptionInput.value);
            if (photoInput.files[0]) {
                formData.append('photo', photoInput.files[0]);
            }

            fetch('/api/about-me', {
                method: 'POST',
                body: formData,
            })
            .then(res => {
                if (!res.ok) throw new Error(`Server returned status ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    statusEl.textContent = '✅ Saved successfully!';
                    statusEl.style.color = '#2e7d32';
                    if (data.settings && data.settings.imageUrl) {
                        photoPreview.src = data.settings.imageUrl;
                    }
                }
            })
            .catch(err => {
                statusEl.textContent = `❌ Save failed: ${err.message}`;
                statusEl.style.color = '#d32f2f';
                logError('Failed to save about-me settings', err);
            });
        });
    }

    function initPublicAboutMePage() {
        const titleEl = document.querySelector('.about-title');
        const descriptionEl = document.querySelector('.about-bio');
        const imageEl = document.querySelector('.about-profile-image');

        if (!titleEl) return; 

        logInfo('Initializing public about-me page...');

        fetch('/api/about-me')
            .then(res => {
                if (!res.ok) throw new Error(`Server returned status ${res.status}`);
                return res.json();
            })
            .then(data => {
                logInfo('Applying about-me data to page:', data);
                if (data) {
                    if (data.title) titleEl.textContent = data.title;
                    if (data.description) descriptionEl.textContent = data.description;
                    if (data.imageUrl) imageEl.src = data.imageUrl;
                }
            })
            .catch(err => logError('Could not fetch or apply about-me settings', err));
    }

    onReady(function() {
        initAdminAboutMe();
        initPublicAboutMePage();
    });

})();
