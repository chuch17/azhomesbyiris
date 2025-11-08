(function videoGalleryModule() {
  const LOG_PREFIX = '[videoGallery]';
  function logInfo(msg, meta) { try { console.log(`${LOG_PREFIX} ${msg}`, meta || '') } catch (_) { } }
  function logError(msg, err) { try { console.error(`${LOG_PREFIX} ERROR: ${msg}`, err) } catch (_) { } }

  function startVideoTimer(container, duration, videoId) {
    if (!container) return; // Guard against missing container

    const existingTimerId = container.dataset?.videoTimerId;
    if (existingTimerId) {
      clearTimeout(existingTimerId);
    }

    if (!duration || isNaN(duration) || duration <= 0) {
      logInfo(`[videoTimer] No valid duration for video_${videoId}. Timer not started.`);
      return;
    }
    logInfo(`[videoTimer] Timer started for video_${videoId}: ${duration}s`);

    const timerId = setTimeout(() => {
      const containerEl = document.getElementById(`video-${videoId}-container`);
      if (containerEl) {
        logInfo(`[videoTimer] Timer ended for video_${videoId} - overlay reset.`);
      }
    }, duration * 1000);

    if (container.dataset) {
      container.dataset.videoTimerId = timerId;
    }
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // --- ADMIN PAGE LOGIC ---
  function initAdminVideoGallery() {
    const form = document.getElementById('video-gallery-form');
    if (!form) return;

    logInfo('Initializing admin video gallery form...');
    const statusEl = document.getElementById('video-gallery-save-status');
    
    const elements = {
      v1: {
        title: document.getElementById('video-1-title-input'),
        url: document.getElementById('video-1-url-input'),
        preview: document.getElementById('video-1-preview'),
        duration: document.getElementById('video-1-duration-input'),
      },
      v2: {
        title: document.getElementById('video-2-title-input'),
        url: document.getElementById('video-2-url-input'),
        preview: document.getElementById('video-2-preview'),
        duration: document.getElementById('video-2-duration-input'),
      },
      v3: {
        title: document.getElementById('video-3-title-input'),
        url: document.getElementById('video-3-url-input'),
        preview: document.getElementById('video-3-preview'),
        duration: document.getElementById('video-3-duration-input'),
      },
      v4: {
        title: document.getElementById('video-4-title-input'),
        url: document.getElementById('video-4-url-input'),
        preview: document.getElementById('video-4-preview'),
        duration: document.getElementById('video-4-duration-input'),
      },
    };

    function updatePreview(urlInput, previewEl) {
      const url = urlInput.value;
      if (!url) {
        previewEl.textContent = 'No URL provided.';
        return;
      }
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        previewEl.textContent = 'Preview: YouTube Video';
      } else if (url.includes('tiktok.com')) {
        previewEl.textContent = 'Preview: TikTok Video';
      } else if (url.includes('instagram.com')) {
        previewEl.textContent = 'Preview: Instagram Video';
      } else {
        previewEl.textContent = `Preview: ${url}`;
      }
    }

    // 1. Pre-fill the form with current settings
    fetch('/api/video-gallery')
      .then(res => res.json())
      .then(data => {
        logInfo('Prefilling admin form with data from server:', data);
        
        // Prefill from server data first
        if (data.v1) {
          elements.v1.title.value = data.v1.title || '';
          elements.v1.url.value = data.v1.url || '';
          elements.v1.duration.value = data.v1.duration || '';
          updatePreview(elements.v1.url, elements.v1.preview);
        }
        if (data.v2) {
          elements.v2.title.value = data.v2.title || '';
          elements.v2.url.value = data.v2.url || '';
          elements.v2.duration.value = data.v2.duration || '';
          updatePreview(elements.v2.url, elements.v2.preview);
        }
        if (data.v3) {
          elements.v3.title.value = data.v3.title || '';
          elements.v3.url.value = data.v3.url || '';
          elements.v3.duration.value = data.v3.duration || '';
          updatePreview(elements.v3.url, elements.v3.preview);
        }
        if (data.v4) {
          elements.v4.title.value = data.v4.title || '';
          elements.v4.url.value = data.v4.url || '';
          elements.v4.duration.value = data.v4.duration || '';
          updatePreview(elements.v4.url, elements.v4.preview);
        }
        
        // Then, override with localStorage values if they exist
        ['1', '2', '3', '4'].forEach(id => {
          const key = `videoDuration_${id}`;
          const savedDuration = localStorage.getItem(key);
          const inputEl = elements[`v${id}`]?.duration;
          if (savedDuration && inputEl) {
            inputEl.value = savedDuration;
            logInfo(`[videoGallery] Duration set for Video ${id} from localStorage: ${savedDuration}s`);
          }
        });

        logInfo('[videoGallery] duration input added');
      })
      .catch(err => logError('Could not pre-fill video gallery form', err));

    // Add listeners to save duration to localStorage on input change
    ['1', '2', '3', '4'].forEach(id => {
      const inputEl = elements[`v${id}`]?.duration;
      if (inputEl) {
        inputEl.addEventListener('input', () => {
          const key = `videoDuration_${id}`;
          localStorage.setItem(key, inputEl.value);
          logInfo(`[videoGallery] Duration saved for Video ${id} to localStorage: ${inputEl.value}s`);
        });
      }
    });

    // 2. Add listeners for live text preview updates
    elements.v1.url.addEventListener('input', () => updatePreview(elements.v1.url, elements.v1.preview));
    elements.v2.url.addEventListener('input', () => updatePreview(elements.v2.url, elements.v2.preview));
    elements.v3.url.addEventListener('input', () => updatePreview(elements.v3.url, elements.v3.preview));
    elements.v4.url.addEventListener('input', () => updatePreview(elements.v4.url, elements.v4.preview));

    // 3. Handle form submission
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      statusEl.textContent = 'Saving...';
      statusEl.style.color = 'inherit';

      const dataToSave = {
        'video-1-title': elements.v1.title.value,
        'video-1-url': elements.v1.url.value,
        'video-1-duration': elements.v1.duration.value,
        'video-2-title': elements.v2.title.value,
        'video-2-url': elements.v2.url.value,
        'video-2-duration': elements.v2.duration.value,
        'video-3-title': elements.v3.title.value,
        'video-3-url': elements.v3.url.value,
        'video-3-duration': elements.v3.duration.value,
        'video-4-title': elements.v4.title.value,
        'video-4-url': elements.v4.url.value,
        'video-4-duration': elements.v4.duration.value,
      };

      fetch('/api/video-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })
      .then(res => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          statusEl.textContent = '✅ Saved successfully!';
          statusEl.style.color = '#2e7d32';
          logInfo('Video gallery saved. Firing live-update event.');
          window.localStorage.setItem('video-gallery-update-event', Date.now());
        }
      })
      .catch(err => {
        statusEl.textContent = `❌ Save failed: ${err.message}`;
        statusEl.style.color = '#d32f2f';
        logError('Failed to save video gallery', err);
      });
    });
  }

  // --- HOME PAGE LOGIC ---
  function initHomepageVideoGallery() {
    const v1 = {
      container: document.getElementById('video-1-container'),
      title: document.getElementById('video-1-title'),
    };
    if (!v1.container) return; // Not the homepage

    logInfo('Initializing homepage video gallery...');
    const v2 = { container: document.getElementById('video-2-container'), title: document.getElementById('video-2-title') };
    const v3 = { container: document.getElementById('video-3-container'), title: document.getElementById('video-3-title') };
    const v4 = { container: document.getElementById('video-4-container'), title: document.getElementById('video-4-title') };

    const loadedScripts = {};
    function loadScript(src, id, onReady) {
      if (loadedScripts[id]) {
        if (typeof onReady === 'function') onReady();
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.id = id;
        script.onload = () => {
          loadedScripts[id] = true;
          if (typeof onReady === 'function') onReady();
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    function createVideoEmbed(url, uniqueId) {
      // This function on the homepage now ONLY creates the wrapper iframe
      if (!url) return { html: '', platform: 'none' };
      
      const embedUrl = `/video_embed.html?url=${encodeURIComponent(url)}&id=${uniqueId}`;
      return {
        html: `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen"></iframe>`,
        platform: 'internal-iframe'
      };
    }

    function renderVideos(data) {
      // overlayRegistry.clear(); // Removed as per new logic
      // durationRegistry.clear(); // Removed as per new logic
      // containerRegistry.clear(); // Removed as per new logic

      const videos = [
        { el: v1, data: data.v1, id: 1 },
        { el: v2, data: data.v2, id: 2 },
        { el: v3, data: data.v3, id: 3 },
        { el: v4, data: data.v4, id: 4 }
      ];

      const youtubePlayersToCreate = [];

      videos.forEach(v => {
        if (v.data && v.data.url) {
          v.el.title.textContent = v.data.title;
          const embed = createVideoEmbed(v.data.url, v.id);
          
          v.el.container.innerHTML = embed.html;

          // Inject the hole overlay and the non-interactive play symbol
          const overlay = document.createElement('div');
          overlay.className = 'video-hole-overlay';
          overlay.innerHTML = `
            <div class="overlay-play-symbol">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M7,5.5L7,18.5C7,19.9,8.4,20.8,9.7,20L20.2,13.5C21.4,12.7,21.4,11.2,20.2,10.4L9.7,3.9C8.4,3.1,7,4,7,5.5Z"/>
              </svg>
            </div>
          `;
          v.el.container.appendChild(overlay);
          
          logInfo('[overlay] vignette applied');
          logInfo('[overlay] glow intensified');
          
          const configDuration = parseInt(v.data.duration, 10);
          const storedDuration = localStorage.getItem(`videoDuration_${v.id}`);
          const effectiveDuration = Number.isNaN(configDuration) || configDuration <= 0
            ? parseInt(storedDuration, 10)
            : configDuration;

          // NEW LOGIC: Direct click/touch listener for universal compatibility
          const iframe = v.el.container.querySelector('iframe');

          const playVideo = () => {
            overlay.classList.add('hidden');
            
            if (iframe) {
              // Re-setting the src is a reliable way to trigger autoplay after a user gesture
              iframe.src = iframe.src;
            }

            startVideoTimer(v.el.container, effectiveDuration, v.id);

            localStorage.setItem('video-play-start-event', JSON.stringify({
              videoId: v.id,
              duration: effectiveDuration,
              timestamp: Date.now()
            }));

            // Clean up to prevent multiple triggers
            overlay.removeEventListener('click', playVideo);
            overlay.removeEventListener('touchstart', playVideo);
          };

          overlay.addEventListener('click', playVideo);
          overlay.addEventListener('touchstart', playVideo);

        } else {
          // No URL, so ensure the placeholder is shown
          v.el.container.innerHTML = `
            <div class="video-placeholder">
              <p>Video ${v.id}</p>
              <span>Awaiting content from Admin Panel</span>
            </div>`;
        }
      });

      if (youtubePlayersToCreate.length > 0) {
        // This is no longer needed on the homepage as the logic is in video_embed.html
        // setupYouTubePlayers(youtubePlayersToCreate);
      }

      // Removed ensureOverlayPoller();
    }

    // This listener is no longer needed with the new direct-click approach
    /*
    window.addEventListener('message', function(event) {
      // Basic security: check if the message is what we expect
      if (event.data && event.data.type === 'video-gallery-interaction') {
        const videoId = event.data.videoId;
        logInfo(`[overlay] Interaction detected from video ${videoId}. Hiding overlay.`);
        
        const container = document.getElementById(`video-${videoId}-container`);
        if (container) {
          const overlay = container.querySelector('.video-hole-overlay');
          if (overlay) {
            overlay.classList.add('hidden');
          }
          
          // We need to fetch the duration again or store it on the element
          // For simplicity, let's fetch it from localStorage as the admin page does
          const duration = localStorage.getItem(`videoDuration_${videoId}`);
          startVideoTimer(container, parseInt(duration, 10), videoId);
          
          // Fire the event to notify the admin page
          localStorage.setItem('video-play-start-event', JSON.stringify({
            videoId: videoId,
            duration: parseInt(duration, 10),
            timestamp: Date.now()
          }));
        }
      }
    });
    */

    // This function is no longer needed on the homepage
    /*
    function resetVideo(container) {
      if (!container) return;
      
      const overlay = container.querySelector('.video-hole-overlay');
      const iframe = container.querySelector('iframe');
      const video = container.querySelector('video');

      if (overlay) {
        overlay.classList.remove('hidden');
      }

      if (iframe) {
        iframe.src = iframe.src;
      }

      if (video) {
        video.load();
      }
    }
    */

    // This function is no longer needed on the homepage
    /*
    function setupDirectVideoReplay(container) {
      const video = container.querySelector('video');
      if (!video) return;

      const replayOverlay = document.createElement('div');
      replayOverlay.className = 'replay-overlay';
      replayOverlay.innerHTML = `
        <button class="replay-button" aria-label="Replay video">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>`;
      container.appendChild(replayOverlay);

      video.addEventListener('ended', () => {
        replayOverlay.classList.add('visible');
      });

      replayOverlay.addEventListener('click', () => {
        video.play();
        replayOverlay.classList.remove('visible');
      });
    }
    */

    // This function is no longer needed on the homepage
    /*
    function setupYouTubePlayers(playersInfo) {
      const onYouTubeApiReady = () => {
        playersInfo.forEach(info => {
          const player = new YT.Player(info.elementId, {
            height: '100%',
            width: '100%',
            videoId: info.videoId,
            playerVars: { 'playsinline': 1 },
            events: {
              'onStateChange': (event) => {
                const replayOverlay = info.container.querySelector('.replay-overlay');
                if (event.data === YT.PlayerState.PLAYING) {
                  // Instead of hiding the overlay directly, fire event to admin page
                  localStorage.setItem('video-play-start-event', JSON.stringify({
                    videoId: info.id,
                    duration: info.duration,
                    timestamp: Date.now()
                  }));
                  startVideoTimer(info.container, info.duration, info.id);
                }
                if (event.data === YT.PlayerState.ENDED) {
                  replayOverlay?.classList.add('visible');
                }
              }
            }
          });

          // The old replay overlay logic can be simplified or removed if not needed,
          // but we will keep it for now to handle replaying after the video ends.
          const replayOverlay = document.createElement('div');
          replayOverlay.className = 'replay-overlay';
          replayOverlay.innerHTML = `
            <button class="replay-button" aria-label="Replay video">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>`;
          info.container.appendChild(replayOverlay);

          replayOverlay.addEventListener('click', () => {
            player.playVideo();
            replayOverlay.classList.remove('visible');
          });
        });
      };

      if (window.YT && window.YT.Player) {
        onYouTubeApiReady();
      } else {
        window.onYouTubeIframeAPIReady = onYouTubeApiReady;
        loadScript('https://www.youtube.com/iframe_api', 'youtube-api');
      }
    }
    */

    fetch('/api/video-gallery')
      .then(res => res.json())
      .then(data => {
        logInfo('Applying video gallery data to homepage:', data);
        renderVideos(data);
      })
      .catch(err => logError('Could not fetch or apply video gallery', err));
  }

  // --- LIVE UPDATE LISTENER ---
  function listenForVideoGalleryUpdates() {
    window.addEventListener('storage', function (e) {
      if (e.key === 'video-gallery-update-event') {
        logInfo('Detected video gallery update from another tab. Re-initializing.');
        initHomepageVideoGallery();
      }
    });
  }

  // --- INITIALIZATION ---
  onReady(function () {
    initAdminVideoGallery();
    initHomepageVideoGallery();
    listenForVideoGalleryUpdates();
  });

})();
