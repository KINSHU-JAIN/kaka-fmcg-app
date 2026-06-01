// ============================================
// Toast Notification Component
// ============================================

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info'
};

let container = null;

function getContainer() {
  if (!container) {
    container = document.getElementById('toast-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-root';
      document.body.appendChild(container);
    }
    container.className = 'toast-container';
  }
  return container;
}

function show(message, type = 'info', duration = 3500) {
  const c = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="material-icons-round toast-icon">${ICONS[type] || 'info'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close material-icons-round" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 250)">close</button>
  `;
  c.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  return toast;
}

export const Toast = {
  show,
  success: (msg, duration) => show(msg, 'success', duration),
  error: (msg, duration) => show(msg, 'error', duration),
  warning: (msg, duration) => show(msg, 'warning', duration),
  info: (msg, duration) => show(msg, 'info', duration),
};
