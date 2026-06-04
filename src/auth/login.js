// ============================================
// Login Page with Admin 2-Step Verification (2FA - Email)
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';

let currentStep = 1;
let generatedOtp = '';
let countdownInterval = null;
let timeLeft = 120;
let adminSessionData = null;

export function render() {
  return `
    <div class="login-page" style="overflow: hidden; position: relative;">
      <div class="login-container">
        <div class="login-card" style="overflow: hidden; position: relative; max-width: 400px; width: 100%;">
          
          <!-- Decorative top firm bar -->
          <div style="height: 4px; width: 100%; background: linear-gradient(135deg, var(--accent-gold), var(--accent-blue)); position: absolute; top: 0; left: 0;"></div>

          <div class="login-brand">
            <div class="login-brand-icons">
              <div class="login-brand-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0a0f1e;">KA</div>
              <div class="login-brand-icon" style="background: linear-gradient(135deg, #14b8a6, #06b6d4); color: #0a0f1e;">KM</div>
            </div>
            <h1>Kaka FMCG</h1>
            <p>Distribution Management System</p>
          </div>

          <!-- Multi-Step Sliding Wrapper -->
          <div class="login-steps-container" style="overflow: hidden; width: 100%;">
            <div class="login-steps-wrapper" id="login-steps-wrapper" style="display: flex; width: 300%; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
              
              <!-- STEP 1: Credentials Form -->
              <div class="login-step" style="width: 33.333%; flex-shrink: 0; padding: 0 4px;">
                <form id="login-form-step1" style="display:flex; flex-direction:column; gap:16px;">
                  <div style="text-align: center; margin-bottom: 4px;">
                    <span class="badge badge-info" style="font-size: 0.72rem; padding: 3px 8px; text-transform: uppercase;">Step 1: Credentials</span>
                  </div>
                  
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="login-username">Username</label>
                    <input type="text" id="login-username" class="form-input" placeholder="Enter username..." required />
                  </div>

                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="login-password">Password</label>
                    <input type="password" id="login-password" class="form-input" placeholder="Enter password..." required />
                  </div>

                  <div class="login-error" id="login-error-step1" style="min-height: 14px; font-size: 0.8rem; color: var(--danger); text-align: center;"></div>

                  <button type="submit" class="btn btn-primary w-full" style="margin-top: 4px;">
                    <span class="material-icons-round">login</span>
                    Proceed
                  </button>
                </form>
              </div>

              <!-- STEP 2: Email Verification -->
              <div class="login-step" style="width: 33.333%; flex-shrink: 0; padding: 0 4px;">
                <form id="login-form-step2" style="display:flex; flex-direction:column; gap:16px;">
                  <div style="text-align: center; margin-bottom: 4px;">
                    <span class="badge badge-warning" style="font-size: 0.72rem; padding: 3px 8px; text-transform: uppercase;">Step 2: 2-Step Verification</span>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">Verify Email Address</h3>
                    <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">For security, please enter the registered email address associated with the Admin account.</p>
                  </div>

                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="login-email">Registered Email Address</label>
                    <input type="email" id="login-email" class="form-input" placeholder="example@gmail.com" required style="color: var(--text-primary); font-weight: 500;" />
                  </div>

                  <div class="login-error" id="login-error-step2" style="min-height: 14px; font-size: 0.8rem; color: var(--danger); text-align: center;"></div>

                  <div style="display: flex; gap: 10px; margin-top: 4px;">
                    <button type="button" class="btn btn-secondary" id="back-to-step1" style="flex: 1;">
                      Back
                    </button>
                    <button type="submit" class="btn btn-primary" style="flex: 2;">
                      Send OTP Code
                    </button>
                  </div>
                </form>
              </div>

              <!-- STEP 3: OTP Code Entry -->
              <div class="login-step" style="width: 33.333%; flex-shrink: 0; padding: 0 4px;">
                <form id="login-form-step3" style="display:flex; flex-direction:column; gap:16px;">
                  <div style="text-align: center; margin-bottom: 4px;">
                    <span class="badge badge-success" style="font-size: 0.72rem; padding: 3px 8px; text-transform: uppercase;">Step 3: Enter OTP</span>
                  </div>

                  <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">Enter Verification Code</h3>
                    <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">A 6-digit OTP code has been sent to nitesh8555@gmail.com.</p>
                  </div>

                  <!-- 6 digit code boxes -->
                  <div style="display: flex; justify-content: space-between; gap: 8px; margin: 8px 0;" class="otp-inputs-group">
                    <input type="text" class="otp-digit-input" data-index="0" pattern="[0-9]" maxlength="1" required style="width: 45px; height: 50px; text-align: center; font-size: 1.4rem; font-weight: 700; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); transition: all 0.2s ease;" />
                    <input type="text" class="otp-digit-input" data-index="1" pattern="[0-9]" maxlength="1" required style="width: 45px; height: 50px; text-align: center; font-size: 1.4rem; font-weight: 700; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); transition: all 0.2s ease;" />
                    <input type="text" class="otp-digit-input" data-index="2" pattern="[0-9]" maxlength="1" required style="width: 45px; height: 50px; text-align: center; font-size: 1.4rem; font-weight: 700; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); transition: all 0.2s ease;" />
                    <input type="text" class="otp-digit-input" data-index="3" pattern="[0-9]" maxlength="1" required style="width: 45px; height: 50px; text-align: center; font-size: 1.4rem; font-weight: 700; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); transition: all 0.2s ease;" />
                    <input type="text" class="otp-digit-input" data-index="4" pattern="[0-9]" maxlength="1" required style="width: 45px; height: 50px; text-align: center; font-size: 1.4rem; font-weight: 700; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); transition: all 0.2s ease;" />
                    <input type="text" class="otp-digit-input" data-index="5" pattern="[0-9]" maxlength="1" required style="width: 45px; height: 50px; text-align: center; font-size: 1.4rem; font-weight: 700; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); transition: all 0.2s ease;" />
                  </div>

                  <div id="otp-timer-container" style="text-align: center; font-size: 0.8rem; color: var(--text-secondary);">
                    Code expires in: <span id="otp-timer-countdown" style="font-weight: 700; color: var(--accent-gold);">02:00</span>
                  </div>

                  <div class="login-error" id="login-error-step3" style="min-height: 14px; font-size: 0.8rem; color: var(--danger); text-align: center;"></div>

                  <div style="display: flex; gap: 10px; margin-top: 4px;">
                    <button type="button" class="btn btn-secondary" id="back-to-step2" style="flex: 1;">
                      Back
                    </button>
                    <button type="submit" class="btn btn-primary" id="verify-otp-btn" style="flex: 2;">
                      Verify & Log In
                    </button>
                  </div>

                  <div style="text-align: center; margin-top: 4px;">
                    <button type="button" class="btn-link" id="resend-otp-btn" style="font-size: 0.78rem; text-decoration: none; color: var(--accent-blue); background: none; border: none; cursor: pointer; display: none;">
                      Resend OTP Code
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>

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

function goToStep(step) {
  currentStep = step;
  const wrapper = document.getElementById('login-steps-wrapper');
  if (wrapper) {
    const shift = (step - 1) * -33.333;
    wrapper.style.transform = `translateX(${shift}%)`;
  }
}

function triggerEmailNotification(otp) {
  // Clear any existing banners
  const existing = document.getElementById('email-simulator-banner');
  if (existing) existing.remove();

  // Create sliding banner
  const banner = document.createElement('div');
  banner.id = 'email-simulator-banner';
  banner.style.cssText = `
    position: fixed;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 420px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    padding: 16px;
    z-index: 10000;
    transition: top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    gap: 12px;
    color: #ffffff;
    cursor: pointer;
  `;

  banner.innerHTML = `
    <div style="background: var(--info); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
      <span class="material-icons-round" style="font-size: 22px; color: white;">mail</span>
    </div>
    <div style="flex: 1; font-family: var(--font-body);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 700; font-size: 0.82rem; letter-spacing: 0.5px; color: var(--accent-gold);">KAKA-MAIL (Secure OTP)</span>
        <span style="font-size: 0.65rem; color: var(--text-dim);">now</span>
      </div>
      <p style="font-size: 0.78rem; line-height: 1.4; margin: 0; color: #f1f5f9;">
        Verification Code for Admin: <strong style="font-size: 0.92rem; color: #ffffff; background: rgba(255,255,255,0.15); padding: 1px 6px; border-radius: 4px; border: 1px dashed rgba(255,255,255,0.3); font-family: monospace;">${otp}</strong>. Valid for 2 mins.
      </p>
    </div>
  `;

  document.body.appendChild(banner);

  // Trigger slide down
  setTimeout(() => {
    banner.style.top = '20px';
  }, 100);

  // Dismiss on click
  banner.addEventListener('click', () => {
    banner.style.top = '-120px';
    setTimeout(() => banner.remove(), 500);
  });

  // Auto dismiss after 15 seconds
  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.style.top = '-120px';
      setTimeout(() => banner.remove(), 500);
    }
  }, 15000);
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  timeLeft = 120;
  
  const countdownEl = document.getElementById('otp-timer-countdown');
  const timerContainer = document.getElementById('otp-timer-container');
  const resendBtn = document.getElementById('resend-otp-btn');
  
  if (resendBtn) resendBtn.style.display = 'none';
  if (timerContainer) timerContainer.style.color = 'var(--text-secondary)';

  countdownInterval = setInterval(() => {
    timeLeft--;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (countdownEl) countdownEl.textContent = timeStr;
    
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      if (countdownEl) countdownEl.textContent = '00:00';
      if (timerContainer) {
        timerContainer.style.color = 'var(--danger)';
        timerContainer.innerHTML = 'Code expired! Please resend a new OTP.';
      }
      if (resendBtn) resendBtn.style.display = 'inline-block';
    }
  }, 1000);
}

// Function to send real OTP via FormSubmit API to nitesh8555@gmail.com
async function sendRealEmailOtp(email, otp) {
  const message = `Use verification code ${otp} to log into Kaka FMCG Admin. This OTP is valid for 2 minutes.`;
  
  console.log(`Sending real-time OTP via FormSubmit to ${email}...`);
  Toast.info('Sending secure verification code to your email...');
  
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Kaka FMCG - Admin Login OTP',
        message: message,
        _honey: '' // spam protection honeypot
      })
    });
    
    const data = await response.json();
    if (data.success === 'true') {
      Toast.success('Verification code sent successfully to your inbox!');
      
      // Notify them if they need to check spam or activate FormSubmit
      if (data.message && data.message.includes('activate')) {
        Toast.warning('Check your email to click the FormSubmit activation link!');
      }
    } else {
      console.warn('FormSubmit error:', data);
      Toast.warning('Email dispatch failed, fallback mock banner displayed.');
    }
  } catch (err) {
    console.error('Error dispatching email through FormSubmit:', err);
    Toast.warning('Email server offline, fallback mock banner displayed.');
  }
}

function generateNewOtp(emailAddress) {
  generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Show standard slide notification banner as a visual overlay
  triggerEmailNotification(generatedOtp);
  
  // Send the real-time OTP to the registered email address
  sendRealEmailOtp(emailAddress, generatedOtp);
  
  startCountdown();
  
  // Reset inputs
  document.querySelectorAll('.otp-digit-input').forEach(input => input.value = '');
  const firstInput = document.querySelector('.otp-digit-input[data-index="0"]');
  if (firstInput) firstInput.focus();
}

function attemptStep1(username, password) {
  const errorEl = document.getElementById('login-error-step1');
  if (!username || !password) {
    if (errorEl) errorEl.textContent = 'Enter username and password.';
    return;
  }

  const result = Store.authenticate(username, password);
  if (result) {
    if (result.role === 'admin' && result.requires2fa) {
      adminSessionData = result;
      // Transition to Step 2
      goToStep(2);
      setTimeout(() => {
        const emailInput = document.getElementById('login-email');
        if (emailInput) {
          emailInput.focus();
          emailInput.select();
        }
      }, 400);
    } else {
      // Direct login for staff
      Store.setSession(result);
      window.location.hash = '#/staff/shops';
      Toast.success(`Welcome, ${result.user.name}!`);
    }
  } else {
    if (errorEl) errorEl.textContent = 'Invalid username or password.';
    shakeCard();
  }
}

function attemptStep2(emailVal) {
  const errorEl = document.getElementById('login-error-step2');
  const normalizedEmail = (emailVal || '').trim().toLowerCase();
  
  if (normalizedEmail !== 'nitesh8555@gmail.com') {
    if (errorEl) errorEl.textContent = 'Email address not registered with this account.';
    shakeCard();
    return;
  }

  // Email verified! Generate real-time OTP, send it, and move to step 3
  generateNewOtp(normalizedEmail);
  goToStep(3);
}

function attemptStep3() {
  const errorEl = document.getElementById('login-error-step3');
  
  // Read inputs
  let code = '';
  document.querySelectorAll('.otp-digit-input').forEach(input => {
    code += input.value;
  });

  if (code.length < 6) {
    if (errorEl) errorEl.textContent = 'Please enter all 6 digits.';
    shakeOtpInputs();
    return;
  }

  if (timeLeft <= 0) {
    if (errorEl) errorEl.textContent = 'OTP has expired. Click resend below.';
    shakeOtpInputs();
    return;
  }

  if (code === generatedOtp) {
    // 2FA fully success! Clear OTP timer
    if (countdownInterval) clearInterval(countdownInterval);
    const existingBanner = document.getElementById('email-simulator-banner');
    if (existingBanner) existingBanner.remove();

    // Login successfully
    Store.setSession(adminSessionData);
    window.location.hash = '#/admin/dashboard';
    Toast.success('Admin authenticated successfully!');
  } else {
    if (errorEl) errorEl.textContent = 'Invalid verification code.';
    shakeOtpInputs();
  }
}

function shakeCard() {
  const card = document.querySelector('.login-card');
  if (card) {
    card.style.animation = 'none';
    card.offsetHeight; // trigger reflow
    card.style.animation = 'shake 0.4s ease';
  }
}

function shakeOtpInputs() {
  const group = document.querySelector('.otp-inputs-group');
  if (group) {
    group.style.animation = 'none';
    group.offsetHeight;
    group.style.animation = 'shake 0.4s ease';
  }
  document.querySelectorAll('.otp-digit-input').forEach(input => {
    input.style.borderColor = 'var(--danger)';
    setTimeout(() => {
      input.style.borderColor = 'var(--border)';
    }, 1200);
  });
}

export function init() {
  // Add animation styles dynamically
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
      .otp-digit-input:focus {
        border-color: var(--accent-gold) !important;
        box-shadow: 0 0 10px var(--accent-gold-glow) !important;
        outline: none;
      }
    `;
    document.head.appendChild(style);
  }

  // STEP 1 Listener
  const form1 = document.getElementById('login-form-step1');
  if (form1) {
    form1.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username')?.value?.trim();
      const p = document.getElementById('login-password')?.value?.trim();
      attemptStep1(u, p);
    });
  }

  // STEP 2 Back button & Submit
  const back1 = document.getElementById('back-to-step1');
  if (back1) {
    back1.addEventListener('click', () => {
      goToStep(1);
    });
  }

  const form2 = document.getElementById('login-form-step2');
  if (form2) {
    form2.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value?.trim();
      attemptStep2(email);
    });
  }

  // STEP 3 Back button, Digit navigation, Resend & Submit
  const back2 = document.getElementById('back-to-step2');
  if (back2) {
    back2.addEventListener('click', () => {
      if (countdownInterval) clearInterval(countdownInterval);
      const banner = document.getElementById('email-simulator-banner');
      if (banner) banner.remove();
      goToStep(2);
    });
  }

  // Focus-shifting inputs
  const otpInputs = document.querySelectorAll('.otp-digit-input');
  otpInputs.forEach((input, index) => {
    // Restrict input to digits only
    input.addEventListener('input', (e) => {
      let val = e.target.value;
      val = val.replace(/\D/g, ''); // keep digits only
      e.target.value = val;
      
      if (val.length === 1) {
        if (index < 5) {
          otpInputs[index + 1].focus();
          otpInputs[index + 1].select();
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (input.value === '') {
          if (index > 0) {
            otpInputs[index - 1].focus();
            otpInputs[index - 1].select();
          }
        } else {
          input.value = '';
        }
        e.preventDefault();
      }
    });

    input.addEventListener('focus', () => {
      input.select();
    });
  });

  // Resend OTP button listener
  const resendBtn = document.getElementById('resend-otp-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      const email = document.getElementById('login-email')?.value?.trim();
      generateNewOtp(email);
      const errorEl = document.getElementById('login-error-step3');
      if (errorEl) errorEl.textContent = '';
      Toast.success('New Verification OTP code sent!');
    });
  }

  // STEP 3 Submit listener
  const form3 = document.getElementById('login-form-step3');
  if (form3) {
    form3.addEventListener('submit', (e) => {
      e.preventDefault();
      attemptStep3();
    });
  }
}
