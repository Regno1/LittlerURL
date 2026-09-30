document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('shorten-form');
  const urlInput = document.getElementById('url-input');
  const clearBtn = document.getElementById('clear-btn');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const errorBanner = document.getElementById('error-banner');
  const resultSection = document.getElementById('result-section');
  const shortUrlOutput = document.getElementById('short-url-output');
  const copyBtn = document.getElementById('copy-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const visitBtn = document.getElementById('visit-btn');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Input clear button toggle
  urlInput.addEventListener('input', () => {
    clearBtn.style.display = urlInput.value ? 'flex' : 'none';
    hideError();
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    urlInput.focus();
  });

  // Load history from localStorage
  renderHistory();

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    let rawUrl = urlInput.value.trim();
    if (!rawUrl) return;

    // Normalize URL: auto prepend https:// if missing
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
    }

    // Basic URL validation
    try {
      new URL(rawUrl);
    } catch {
      showError('Please enter a valid URL.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: rawUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL.');
      }

      const fullShortUrl = `${window.location.origin}/${data.id}`;

      // Show result
      shortUrlOutput.value = fullShortUrl;
      visitBtn.href = fullShortUrl;
      resultSection.style.display = 'flex';
      copyBtnText.textContent = 'Copy';

      // Save to localStorage history
      saveToHistory({
        id: data.id,
        shortUrl: fullShortUrl,
        originalUrl: rawUrl,
        timestamp: Date.now()
      });

      renderHistory();

      // Scroll smoothly to result
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Copy button
  copyBtn.addEventListener('click', async () => {
    if (!shortUrlOutput.value) return;
    try {
      await navigator.clipboard.writeText(shortUrlOutput.value);
      copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
      }, 2000);
    } catch {
      shortUrlOutput.select();
      document.execCommand('copy');
      copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
      }, 2000);
    }
  });

  // History management
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('littler_history') || '[]');
    } catch {
      return [];
    }
  }

  function saveToHistory(item) {
    let history = getHistory();
    // Avoid duplicate at top
    history = history.filter(h => h.id !== item.id);
    history.unshift(item);
    if (history.length > 5) history = history.slice(0, 5); // keep last 5
    localStorage.setItem('littler_history', JSON.stringify(history));
  }

  function renderHistory() {
    const history = getHistory();
    if (!history.length) {
      historySection.style.display = 'none';
      return;
    }

    historySection.style.display = 'flex';
    historyList.innerHTML = history.map(item => `
      <div class="history-item">
        <div class="history-urls">
          <a href="${escapeHtml(item.shortUrl)}" target="_blank" rel="noopener noreferrer" class="history-short">
            ${escapeHtml(item.shortUrl)}
          </a>
          <span class="history-original" title="${escapeHtml(item.originalUrl)}">
            ${escapeHtml(item.originalUrl)}
          </span>
        </div>
        <button class="btn btn-secondary history-copy-btn" data-url="${escapeHtml(item.shortUrl)}">
          Copy
        </button>
      </div>
    `).join('');

    // Attach copy events to history items
    historyList.querySelectorAll('.history-copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        await navigator.clipboard.writeText(url);
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1500);
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('littler_history');
    renderHistory();
  });

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
  }

  function hideError() {
    errorBanner.style.display = 'none';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoader.style.display = loading ? 'inline-block' : 'none';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }
});
