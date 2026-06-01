// ============================================
// Modal Component
// ============================================

let overlay = null;

function getOverlay() {
  if (!overlay) {
    overlay = document.getElementById('modal-root');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-root';
      document.body.appendChild(overlay);
    }
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide();
    });
  }
  return overlay;
}

function show({ title, content, onConfirm, onCancel, confirmText = 'Save', cancelText = 'Cancel', size = '', hideFooter = false }) {
  const o = getOverlay();
  const sizeClass = size === 'lg' ? 'modal-lg' : '';
  o.innerHTML = `
    <div class="modal ${sizeClass}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modal-close-btn">
          <span class="material-icons-round">close</span>
        </button>
      </div>
      <div class="modal-body">${content}</div>
      ${!hideFooter ? `
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">${cancelText}</button>
        ${onConfirm ? `<button class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>` : ''}
      </div>` : ''}
    </div>
  `;

  // Force reflow for animation
  o.offsetHeight;
  o.classList.add('active');

  // Bind events
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    hide();
    if (onCancel) onCancel();
  });

  const cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hide();
      if (onCancel) onCancel();
    });
  }

  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (confirmBtn && onConfirm) {
    confirmBtn.addEventListener('click', () => onConfirm());
  }

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      hide();
      if (onCancel) onCancel();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  return o;
}

function hide() {
  const o = getOverlay();
  o.classList.remove('active');
  setTimeout(() => {
    o.innerHTML = '';
  }, 300);
}

function confirm(message) {
  return new Promise((resolve) => {
    show({
      title: 'Confirm',
      content: `<p style="color: var(--text-secondary); font-size: 0.95rem;">${message}</p>`,
      confirmText: 'Yes, Continue',
      cancelText: 'Cancel',
      onConfirm: () => { hide(); resolve(true); },
      onCancel: () => { resolve(false); }
    });
  });
}

function getBody() {
  return document.querySelector('.modal-body');
}

export const Modal = { show, hide, confirm, getBody };
