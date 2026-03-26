// Global state
let webhookCount = 0;

// HTML escaping helper to prevent XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeForms();
  checkConnectionStatus();
  initializeWebhookFeed();
  loadWebhookHistory();
  setupFrequencyChangeHandler();
  setDefaultCommencementDate();
  setupKeyboardShortcuts();
});

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search (if we add one later)
    // ESC to close modals (if we add them)

    // Number keys 1-8 to switch tabs (when not focused on input)
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      const tabMap = {
        '1': 'dashboard',
        '2': 'cards',
        '3': 'bills',
        '4': 'debit',
        '5': 'clients',
        '6': 'webhooks',
        '7': 'code',
        '8': 'reference'
      };

      if (tabMap[e.key]) {
        e.preventDefault();
        const tab = document.querySelector(`[data-tab="${tabMap[e.key]}"]`);
        if (tab) tab.click();
      }
    }
  });
}

// Tab Navigation
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById(tabId).classList.add('active');

      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// Connection Status
async function checkConnectionStatus() {
  const statusEl = document.getElementById('connectionStatus');
  const authStatusEl = document.getElementById('authStatus');

  try {
    const response = await fetch('/api/status');
    const data = await response.json();

    if (data.success) {
      statusEl.classList.add('connected');
      statusEl.querySelector('span').textContent = 'Connected';
      authStatusEl.textContent = 'Authenticated';
      authStatusEl.style.color = 'var(--success)';
    } else {
      statusEl.classList.add('error');
      statusEl.querySelector('span').textContent = 'Error';
      authStatusEl.textContent = 'Failed';
      authStatusEl.style.color = 'var(--danger)';
    }
  } catch (error) {
    statusEl.classList.add('error');
    statusEl.querySelector('span').textContent = 'Error';
    authStatusEl.textContent = 'Error';
    authStatusEl.style.color = 'var(--danger)';
  }
}

// Form Handlers
function initializeForms() {
  // Create Bill
  document.getElementById('createBillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creating...';

      const response = await fetch('/api/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById('billReference').textContent = result.data.reference;
        document.getElementById('billUrl').textContent = result.data.paymentUrl;
        document.getElementById('billUrl').href = result.data.paymentUrl;
        document.getElementById('billExpires').textContent = new Date(result.data.expiresAt).toLocaleString();
        document.getElementById('billResult').style.display = 'block';
        showToast('Payment bill created successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = false;
      btn.textContent = 'Create Payment Bill';
    }
  });

  // Get Bill Status
  document.getElementById('getBillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reference = formData.get('reference');

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Loading...';

      const response = await fetch(`/api/bill/${encodeURIComponent(reference)}`);
      const result = await response.json();

      if (result.success) {
        const statusHtml = `
          <div class="result-card">
            <div class="result-item">
              <strong>Reference:</strong>
              <span>${escapeHtml(result.data.reference)}</span>
            </div>
            <div class="result-item">
              <strong>Status:</strong>
              <span class="badge badge-${escapeHtml(result.data.status) === 'completed' ? 'success' : escapeHtml(result.data.status) === 'pending' ? 'pending' : 'failed'}">
                ${escapeHtml(result.data.status)}
              </span>
            </div>
            <div class="result-item">
              <strong>Amount:</strong>
              <span>R${result.data.amount.toFixed(2)}</span>
            </div>
            ${result.data.paidAt ? `
              <div class="result-item">
                <strong>Paid At:</strong>
                <span>${escapeHtml(new Date(result.data.paidAt).toLocaleString())}</span>
              </div>
            ` : ''}
          </div>
        `;
        document.getElementById('billStatusResult').innerHTML = statusHtml;
        document.getElementById('billStatusResult').style.display = 'block';
        showToast('Bill status retrieved', 'success');
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Update Bill
  document.getElementById('updateBillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Updating...';

      const response = await fetch('/api/bill/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Bill updated successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Expire Bill
  document.getElementById('expireBillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Expiring...';

      const response = await fetch('/api/bill/expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Bill expired successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Bill Audit Trail
  document.getElementById('auditBillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reference = formData.get('reference');
    const userRef = formData.get('userRef') || reference;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Loading...';

      const response = await fetch(`/api/bill/${encodeURIComponent(reference)}/audits?userRef=${encodeURIComponent(userRef)}`);
      const result = await response.json();

      if (result.success) {
        if (result.data.length === 0) {
          document.getElementById('auditResult').innerHTML = '<p>No audit entries found</p>';
        } else {
          const auditHtml = result.data.map(audit => `
            <div class="result-item">
              <strong>${escapeHtml(audit.timestamp)}</strong>
              <span>${escapeHtml(audit.description)} (by ${escapeHtml(audit.user)})</span>
            </div>
          `).join('');
          document.getElementById('auditResult').innerHTML = `<div class="result-card">${auditHtml}</div>`;
        }
        document.getElementById('auditResult').style.display = 'block';
        showToast('Audit trail retrieved', 'success');
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Re-auth Bill
  document.getElementById('reauthBillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/bill/reauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const reauthHtml = `
          <h3>Re-auth Bill Created</h3>
          <div class="result-card">
            <div class="result-item">
              <strong>New Reference:</strong>
              <span>${escapeHtml(result.data.reference)}</span>
            </div>
            <div class="result-item">
              <strong>Payment URL:</strong>
              <a href="${escapeHtml(result.data.paymentUrl)}" target="_blank" class="payment-link">${escapeHtml(result.data.paymentUrl)}</a>
            </div>
          </div>
        `;
        document.getElementById('reauthResult').innerHTML = reauthHtml;
        document.getElementById('reauthResult').style.display = 'block';
        showToast('Re-auth bill created successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  });

  // Create Client
  document.getElementById('createClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Creating...';

      const response = await fetch('/api/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const clientHtml = `
          <div class="result-card">
            <div class="result-item">
              <strong>Client ID:</strong>
              <span>${escapeHtml(result.data.clientId)}</span>
            </div>
          </div>
        `;
        document.getElementById('clientResult').innerHTML = clientHtml;
        document.getElementById('clientResult').style.display = 'block';
        showToast('Client created successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Create Mandate
  document.getElementById('createMandateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creating...';

      const response = await fetch('/api/mandate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const mandateHtml = `
          <h3>Mandate Created</h3>
          <div class="result-card">
            <div class="result-item">
              <strong>Mandate URL:</strong>
              <a href="${escapeHtml(result.data.url)}" target="_blank" class="payment-link">${escapeHtml(result.data.url)}</a>
            </div>
            <div class="result-item">
              <strong>Message:</strong>
              <span>${escapeHtml(result.data.message)}</span>
            </div>
          </div>
        `;
        document.getElementById('mandateResult').innerHTML = mandateHtml;
        document.getElementById('mandateResult').style.display = 'block';
        showToast('Mandate created successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = false;
      btn.textContent = 'Create Mandate';
    }
  });

  // Update Collection Status
  document.getElementById('updateCollectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Updating...';

      const response = await fetch('/api/collection/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Collection status updated!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Create Payout
  document.getElementById('createPayoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Processing...';

      const response = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const payoutHtml = `
          <div class="result-card">
            <div class="result-item">
              <strong>Distribution ID:</strong>
              <span>${escapeHtml(result.data.distributionId)}</span>
            </div>
            <div class="result-item">
              <strong>Status:</strong>
              <span class="badge badge-success">Success</span>
            </div>
          </div>
        `;
        document.getElementById('payoutResult').innerHTML = payoutHtml;
        document.getElementById('payoutResult').style.display = 'block';
        showToast('Payout processed successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  // Create Refund
  document.getElementById('createRefundForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Processing...';

      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const refundHtml = `
          <div class="result-card">
            <div class="result-item">
              <strong>Refund ID:</strong>
              <span>${escapeHtml(result.data.refundId)}</span>
            </div>
            <div class="result-item">
              <strong>Status:</strong>
              <span class="badge badge-${escapeHtml(result.data.status) === 'completed' ? 'success' : 'pending'}">${escapeHtml(result.data.status)}</span>
            </div>
            ${result.data.amount ? `
              <div class="result-item">
                <strong>Amount:</strong>
                <span>R${result.data.amount.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
        `;
        document.getElementById('refundResult').innerHTML = refundHtml;
        document.getElementById('refundResult').style.display = 'block';
        showToast('Refund processed!', 'success');
        e.target.reset();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// Webhook Feed (SSE)
function initializeWebhookFeed() {
  const eventSource = new EventSource('/events');
  const statusIndicator = document.getElementById('sseStatus');

  eventSource.onopen = () => {
    if (statusIndicator) {
      statusIndicator.textContent = 'Connected';
      statusIndicator.className = 'badge badge-success';
    }
  };

  eventSource.onmessage = (event) => {
    const webhook = JSON.parse(event.data);
    webhookCount++;
    const countEl = document.getElementById('webhookCount');
    countEl.textContent = webhookCount;

    // Animate counter
    countEl.style.animation = 'none';
    setTimeout(() => {
      countEl.style.animation = 'counterPulse 0.5s ease-out';
    }, 10);

    // Add to live feed
    addWebhookToFeed(webhook);

    // Show toast notification
    showToast(`Webhook received: ${webhook.event.type}`, 'info');
  };

  eventSource.onerror = () => {
    console.error('SSE connection error');
    if (statusIndicator) {
      statusIndicator.textContent = 'Disconnected';
      statusIndicator.className = 'badge badge-failed';
    }
  };
}

function addWebhookToFeed(webhook) {
  const feedEl = document.getElementById('webhookFeed');

  // Remove empty message
  const emptyMsg = feedEl.querySelector('.webhook-empty');
  if (emptyMsg) emptyMsg.remove();

  // Create webhook item
  const item = document.createElement('div');
  item.className = 'webhook-item';
  const eventType = escapeHtml(webhook.event.type);
  item.innerHTML = `
    <div class="webhook-header">
      <span class="badge badge-${eventType === 'successful' ? 'success' : eventType === 'pending' ? 'pending' : eventType === 'failed' ? 'failed' : 'cancelled'}">
        ${eventType}
      </span>
      <span class="webhook-time">${escapeHtml(new Date(webhook.timestamp).toLocaleTimeString())}</span>
    </div>
    <div class="webhook-body">
      <strong>Reference:</strong> ${escapeHtml(webhook.event.reference)}<br>
      <strong>Amount:</strong> R${webhook.event.amount.toFixed(2)}<br>
      <strong>Method:</strong> ${escapeHtml(webhook.event.paymentMethod)}
    </div>
  `;

  feedEl.insertBefore(item, feedEl.firstChild);

  // Keep only last 10 items
  const items = feedEl.querySelectorAll('.webhook-item');
  if (items.length > 10) {
    items[items.length - 1].remove();
  }
}

// Load Webhook History
async function loadWebhookHistory() {
  try {
    const response = await fetch('/api/webhooks');
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      const historyEl = document.getElementById('webhookHistory');
      historyEl.innerHTML = '';

      result.data.forEach(webhook => {
        const item = document.createElement('div');
        item.className = 'webhook-item';
        const eventType = escapeHtml(webhook.event.type);
        item.innerHTML = `
          <div class="webhook-header">
            <span class="badge badge-${eventType === 'successful' ? 'success' : eventType === 'pending' ? 'pending' : eventType === 'failed' ? 'failed' : 'cancelled'}">
              ${eventType}
            </span>
            <span class="webhook-time">${escapeHtml(new Date(webhook.timestamp).toLocaleString())}</span>
          </div>
          <div class="webhook-body">
            <strong>Reference:</strong> ${escapeHtml(webhook.event.reference)}<br>
            <strong>Amount:</strong> R${webhook.event.amount.toFixed(2)}<br>
            <strong>Method:</strong> ${escapeHtml(webhook.event.paymentMethod)}
          </div>
        `;
        historyEl.appendChild(item);
      });

      webhookCount = result.data.length;
      document.getElementById('webhookCount').textContent = webhookCount;
    }
  } catch (error) {
    console.error('Failed to load webhook history:', error);
  }
}

// Frequency Change Handler
function setupFrequencyChangeHandler() {
  const frequencySelect = document.getElementById('billFrequency');
  const recurringFields = document.getElementById('recurringFields');
  const recurringDayGroup = document.getElementById('recurringDayGroup');
  const recurringMonthGroup = document.getElementById('recurringMonthGroup');
  const dayOfWeekGroup = document.getElementById('dayOfWeekGroup');

  frequencySelect.addEventListener('change', (e) => {
    const frequency = e.target.value;

    if (frequency === 'once-off') {
      recurringFields.style.display = 'none';
    } else {
      recurringFields.style.display = 'block';

      // Show/hide fields based on frequency
      if (frequency === 'weekly') {
        recurringDayGroup.style.display = 'none';
        recurringMonthGroup.style.display = 'none';
        dayOfWeekGroup.style.display = 'block';
      } else if (frequency === 'yearly') {
        recurringDayGroup.style.display = 'block';
        recurringMonthGroup.style.display = 'block';
        dayOfWeekGroup.style.display = 'none';
      } else {
        recurringDayGroup.style.display = 'block';
        recurringMonthGroup.style.display = 'none';
        dayOfWeekGroup.style.display = 'none';
      }
    }
  });
}

// Set Default Commencement Date (tomorrow)
function setDefaultCommencementDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  document.getElementById('commencementDate').value = dateStr;
}

// Copy to Clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', 'error');
  });
}

function copyBillUrl() {
  const url = document.getElementById('billUrl').textContent;
  copyToClipboard(url);
}

function copyCode(btn) {
  const code = btn.previousElementSibling.textContent.trim();
  copyToClipboard(code);

  // Visual feedback
  const originalText = btn.textContent;
  btn.textContent = 'Copied!';
  btn.style.background = 'var(--success)';
  btn.style.color = 'white';

  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.color = '';
  }, 2000);
}

// Make copyToClipboard globally available
window.copyToClipboard = copyToClipboard;

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
