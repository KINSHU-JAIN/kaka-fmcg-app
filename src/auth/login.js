// ============================================
// Login Page
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';

export function render() {
  return `
    <div class="login-page">
      <div class="login-container">
        <div class="login-card">
          <div class="login-brand">
            <div class="login-brand-icons">
              <div class="login-brand-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0a0f1e;">KA</div>
              <div class="login-brand-icon" style="background: linear-gradient(135deg, #14b8a6, #06b6d4); color: #0a0f1e;">KM</div>
            </div>
            <h1>Kaka FMCG</h1>
            <p>Distribution Management System</p>
          </div>

          <form id="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="login-username">Username</label>
              <input type="text" id="login-username" class="form-input" placeholder="Enter username..." required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" placeholder="Enter password..." required />
            </div>

            <div class="login-error" id="login-error" style="min-height: 14px; margin-top: 0; font-size: 0.8rem; color: var(--danger); text-align: center;"></div>

            <button type="submit" class="btn btn-primary w-full" id="login-submit-btn" style="margin-top: 4px;">
              <span class="material-icons-round">login</span>
              Log In
            </button>
          </form>

          <div style="margin-top: 24px; text-align: center; padding-top: 16px; border-top: 1px solid var(--border);">
            <p style="color: var(--text-dim); font-size: 0.68rem; margin-top: 4px;">
              Kaka Building, Mochi Bazar, Kherwara – 313803
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attemptLogin(username, password) {
  if (!username || !password) {
    showError('Please enter both username and password.');
    return;
  }

  const result = Store.authenticate(username, password);
  if (result) {
    Store.setSession(result);
    // Navigate to appropriate panel
    if (result.role === 'admin') {
      window.location.hash = '#/admin/dashboard';
    } else {
      window.location.hash = '#/staff/shops';
    }
    Toast.success(`Welcome, ${result.user.name}!`);
  } else {
    showError('Invalid username or password.');
    
    // Shake card animation on failure
    const card = document.querySelector('.login-card');
    if (card) {
      card.style.animation = 'none';
      card.offsetHeight; // trigger reflow
      card.style.animation = 'shake 0.4s ease';
    }
  }
}

function showError(msg) {
  const el = document.getElementById('login-error');
  if (el) el.textContent = msg;
  setTimeout(() => { if (el) el.textContent = ''; }, 3000);
}

export function init() {
  // Add shake keyframes if not present
  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Handle Form Submission
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const userEl = document.getElementById('login-username');
      const passEl = document.getElementById('login-password');
      attemptLogin(userEl?.value?.trim(), passEl?.value?.trim());
    });
  }
}
