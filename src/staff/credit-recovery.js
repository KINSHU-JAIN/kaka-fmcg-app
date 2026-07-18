// ============================================
// Staff Panel — Credit Recovery Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { printReceipt, getWhatsAppReceiptUrl } from '../components/invoice.js';

// ---------- State ----------
let selectedRouteId = null;
let expandedShopId = null; // Keeps track of which shop's detailed bills are expanded

// ---------- Scoping & Helpers ----------
function getFirmId() {
  return window.__currentFirm || 'firm_ka';
}

function getStaffId() {
  const session = Store.getSession();
  return session ? session.user.id : null;
}

function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Get routes assigned to the logged-in staff member (Returns all routes)
function getAssignedRoutes() {
  const staffId = getStaffId();
  if (!staffId) return [];
  return Store.getRoutes(getFirmId());
}

// ---------- Sub-renders ----------

function renderRouteSelector(routes) {
  if (routes.length <= 1) return ''; // No select component needed if only 1 route
  
  return `
    <div class="form-group mb-lg" style="max-width: 400px; margin-bottom: 20px;">
      <label class="form-label" style="font-weight:600; color:var(--text-secondary);">Select Recovery Route</label>
      <select class="form-select" id="recovery-route-select" style="font-weight:500;">
        ${routes.map(r => `
          <option value="${r.id}" ${r.id === selectedRouteId ? 'selected' : ''}>
            ${r.name} (${(r.shopIds || []).length} shops)
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function renderDetailedBills(shopId) {
  const outstanding = Store.getShopOutstanding(shopId);
  if (outstanding.details.length === 0) {
    return `
      <div style="padding:12px; color:var(--text-muted); font-size:0.8rem; text-align:center;">
        No unpaid credit bills found.
      </div>
    `;
  }
  
  return `
    <div class="stagger" style="background:var(--bg-secondary); border-radius:var(--radius-md); padding:12px; border:1px solid var(--border); margin-top:10px;">
      <div style="font-weight:700; font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">
        Unpaid Credit Bills (${outstanding.unpaidOrdersCount})
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; font-size:0.8rem; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid var(--border); text-align:left; color:var(--text-muted); font-weight:600;">
              <th style="padding:6px 4px;">Bill Ref</th>
              <th style="padding:6px 4px;">Date</th>
              <th style="padding:6px 4px; text-align:center;">Age</th>
              <th style="padding:6px 4px; text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${outstanding.details.map(d => {
              const order = Store.getOrderById(d.orderId);
              const isOverdue = d.daysOld > 7;
              return `
                <tr style="border-bottom:1px dashed var(--border-light); vertical-align:middle;">
                  <td style="padding:8px 4px; font-weight:700; color:var(--text-primary);">#${d.orderId.slice(-6).toUpperCase()}</td>
                  <td style="padding:8px 4px; color:var(--text-secondary);">${formatDate(order?.createdAt)}</td>
                  <td style="padding:8px 4px; text-align:center; color:${isOverdue ? 'var(--danger)' : 'var(--text-secondary)'}; font-weight:${isOverdue ? '700' : '400'};">
                    ${d.daysOld} days
                    ${d.penalty > 0 ? `<span style="font-size:0.65rem; display:block; color:var(--danger); font-weight:700;">+₹${d.penalty} penalty</span>` : ''}
                  </td>
                  <td style="padding:8px 4px; text-align:right; font-weight:700; color:var(--text-primary);">${formatCurrency(d.outstanding)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTodayRecoveryLogs() {
  const session = Store.getSession();
  if (!session) return '';

  const collectorName = session.user.name;
  const today = new Date().toDateString();
  const collections = [];

  Store.getShops().forEach(s => {
    const ledger = Store.getLedger(s.id);
    ledger.forEach(entry => {
      if (entry.type === 'credit' && entry.description.includes(collectorName)) {
        const entryDate = new Date(entry.date).toDateString();
        if (entryDate === today) {
          collections.push({
            ...entry,
            shopName: s.name
          });
        }
      }
    });
  });

  // Sort collections: newest first
  collections.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (collections.length === 0) return '';

  const totalCollectedToday = collections.reduce((sum, c) => sum + c.amount, 0);

  return `
    <div class="card" style="margin-top:24px; padding:20px; border-top: 4px solid var(--success);">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding-bottom:12px; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:var(--text-primary);">Today's Settle Logs</h3>
          <p style="color:var(--text-muted); font-size:0.8rem; margin:2px 0 0 0;">Audit log of payments recovered by you today</p>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block;">Total Collected</span>
          <strong style="color:var(--success); font-size:1.35rem; font-weight:800;">${formatCurrency(totalCollectedToday)}</strong>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--border); text-align:left; color:var(--text-muted); font-weight:600;">
              <th style="padding:10px 12px; width:100px;">Time</th>
              <th style="padding:10px 12px; width:180px;">Shop Name</th>
              <th style="padding:10px 12px;">Recovery Description</th>
              <th style="padding:10px 12px; text-align:right; width:120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${collections.map(c => {
              const timeStr = new Date(c.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              return `
                <tr style="border-bottom:1px solid var(--border-light);">
                  <td style="padding:12px; color:var(--text-muted);">${timeStr}</td>
                  <td style="padding:12px; font-weight:600; color:var(--text-primary);">${c.shopName}</td>
                  <td style="padding:12px; color:var(--text-secondary); font-size:0.8rem; line-height:1.4;">${c.description}</td>
                  <td style="padding:12px; text-align:right; font-weight:700; color:var(--success);">${formatCurrency(c.amount)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---------- Main Render ----------

export function render() {
  const routes = getAssignedRoutes();
  
  if (routes.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round" style="color:var(--text-dim); font-size:48px;">payments</span>
        </div>
        <h3>No Assigned Recovery Routes</h3>
        <p>You have not been assigned to any routes by the Admin. Please contact management to receive route assignments for collections.</p>
      </div>
    `;
  }

  // Set default route
  if (!selectedRouteId || !routes.some(r => r.id === selectedRouteId)) {
    selectedRouteId = routes[0].id;
  }

  const activeRoute = routes.find(r => r.id === selectedRouteId);
  const routeShopIds = activeRoute ? (activeRoute.shopIds || []) : [];
  
  // Calculate credit details for route shops
  let totalCreditOutstanding = 0;
  let creditShopsCount = 0;
  
  const shopsWithCredit = routeShopIds.map(id => {
    const shop = Store.getShopById(id);
    if (!shop) return null;
    
    const outstanding = Store.getShopOutstanding(id);
    if (outstanding.totalOutstanding > 0) {
      totalCreditOutstanding += outstanding.totalOutstanding;
      creditShopsCount++;
      return { shop, outstanding };
    }
    return null;
  }).filter(Boolean);

  return `
    <div class="stagger">
      <!-- Route Selector -->
      ${renderRouteSelector(routes)}

      <!-- Credit Stats Row -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:20px;">
        <div class="card" style="padding:16px; display:flex; flex-direction:column; gap:6px; border-left:4px solid var(--danger);">
          <div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Total Recoverable Credit</div>
          <div style="font-size:1.6rem; font-weight:800; color:var(--danger);">${formatCurrency(totalCreditOutstanding)}</div>
        </div>
        <div class="card" style="padding:16px; display:flex; flex-direction:column; gap:6px; border-left:4px solid var(--accent-gold);">
          <div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Debtor Retailers</div>
          <div style="font-size:1.6rem; font-weight:800; color:var(--accent-gold);">${creditShopsCount} Shop${creditShopsCount !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Retailers Credit List -->
      <div class="card" style="padding:20px;">
        <div style="border-bottom:1px solid var(--border-light); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="margin:0; font-size:1.1rem; font-weight:700; color:var(--text-primary);">Outstanding Bills — ${activeRoute?.name || 'Route'}</h3>
          <p style="color:var(--text-muted); font-size:0.8rem; margin:2px 0 0 0;">Retailers on this route with active credit balances</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;" id="recovery-shops-list">
          ${shopsWithCredit.length > 0 ? 
            shopsWithCredit.map(({ shop, outstanding }) => {
              const isExpanded = expandedShopId === shop.id;
              return `
                <div class="card" style="padding:14px; border:1px solid var(--border-light); background:var(--bg-card); display:flex; flex-direction:column; transition:transform 0.2s ease;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                    <div style="flex:1; min-width:200px;">
                      <h4 style="margin:0 0 4px 0; font-size:1rem; font-weight:600; color:var(--text-primary);">${shop.name}</h4>
                      <p style="color:var(--text-muted); font-size:0.8rem; margin:0 0 4px 0; display:flex; align-items:center; gap:4px;">
                        <span class="material-icons-round" style="font-size:14px;">person</span>
                        Owner: ${shop.ownerName} &nbsp;|&nbsp; 
                        <a href="tel:${shop.phone}" style="color:var(--accent-gold); text-decoration:none; display:inline-flex; align-items:center; gap:2px;">
                          <span class="material-icons-round" style="font-size:12px;">call</span> ${shop.phone}
                        </a>
                      </p>
                      <p style="color:var(--text-dim); font-size:0.78rem; margin:0; display:flex; align-items:center; gap:4px;">
                        <span class="material-icons-round" style="font-size:14px;">location_on</span>
                        ${shop.address}
                      </p>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                      <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Outstanding Balance</div>
                      <div style="font-size:1.35rem; font-weight:800; color:var(--danger); margin-top:2px;">${formatCurrency(outstanding.totalOutstanding)}</div>
                      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${outstanding.unpaidOrdersCount} credit bill${outstanding.unpaidOrdersCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <!-- Actions footer row -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px dashed var(--border-light); gap:12px; flex-wrap:wrap;">
                    <button class="btn btn-secondary btn-sm toggle-bills-btn" data-shop-id="${shop.id}" style="display:inline-flex; align-items:center; gap:4px; font-weight:500;">
                      <span class="material-icons-round" style="font-size:16px;">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                      ${isExpanded ? 'Hide Details' : 'View Credit Bills'}
                    </button>
                    
                    <button class="btn btn-primary btn-sm collect-recovery-btn" data-shop-id="${shop.id}" style="display:inline-flex; align-items:center; gap:4px; background:var(--accent-gold); border-color:var(--accent-gold);">
                      <span class="material-icons-round" style="font-size:16px;">payments</span>
                      Collect Recovery
                    </button>
                  </div>

                  <!-- Expanded Bills Section -->
                  ${isExpanded ? renderDetailedBills(shop.id) : ''}
                </div>
              `;
            }).join('')
            : `
              <div class="empty-state" style="padding:32px 16px;">
                <div class="empty-state-icon" style="background:var(--success-light); color:var(--success); border-radius:50%; width:48px; height:48px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                  <span class="material-icons-round" style="font-size:24px;">check_circle</span>
                </div>
                <h4 style="margin:0 0 4px 0; font-size:1rem; font-weight:600; color:var(--text-primary);">Route Clean & Settled!</h4>
                <p style="color:var(--text-muted); font-size:0.8rem; margin:0; max-width:320px; margin: 0 auto;">No retailers on this route have unpaid credit balances.</p>
              </div>
            `
          }
        </div>
      </div>

      <!-- Recovery Logs List -->
      ${renderTodayRecoveryLogs()}
    </div>
  `;
}

// ---------- Settle Payments Modal Function ----------

function showReceiptModal(entry) {
  const shop = Store.getShopById(entry.shopId);
  const firmId = getFirmId();
  const firm = Store.getFirmById(firmId);
  let paymentMode = 'CASH';
  if (entry.description.toLowerCase().includes('upi')) paymentMode = 'UPI';

  let collector = 'Admin';
  const repMatch = entry.description.match(/by\s+(.+)$/i);
  if (repMatch) collector = repMatch[1];

  const content = `
    <div style="text-align:center; padding:10px 0;">
      <span class="material-icons-round" style="font-size:48px; color:var(--success); margin-bottom:8px;">check_circle</span>
      <h3 style="margin:0 0 4px 0; font-size:1.2rem; font-weight:700;">Payment Recorded!</h3>
      <p style="color:var(--text-muted); font-size:0.85rem; margin:0 0 20px 0;">Receipt #REC-${entry.id.slice(-6).toUpperCase()}</p>
    </div>

    <div class="card" style="background:var(--bg-secondary); border-color:var(--border); padding:16px; margin-bottom:20px; font-size:0.9rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:var(--text-muted);">Shop Name:</span>
        <strong style="color:var(--text-primary);">${shop?.name || 'Unknown'}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:var(--text-muted);">Paid Amount:</span>
        <strong style="color:var(--success); font-size:1.05rem;">${formatCurrency(entry.amount)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:var(--text-muted);">Payment Mode:</span>
        <strong style="color:var(--text-primary);">${paymentMode}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:var(--text-muted);">Collector Rep:</span>
        <strong style="color:var(--text-primary);">${collector}</strong>
      </div>
      <hr style="border-top:1px dashed var(--border); margin:12px 0;" />
      <div style="display:flex; justify-content:space-between;">
        <span style="color:var(--text-muted);">Remaining Balance:</span>
        <strong style="color:var(--danger);">${formatCurrency(entry.runningBalance)}</strong>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button class="btn btn-secondary" id="print-receipt-btn" style="display:flex; align-items:center; gap:6px;">
        <span class="material-icons-round" style="font-size:18px;">print</span> Print Receipt
      </button>
      <a href="${getWhatsAppReceiptUrl(entry)}" target="_blank" class="btn btn-primary" id="share-receipt-whatsapp-btn" style="display:flex; align-items:center; gap:6px; background-color:#25d366; border-color:#25d366; color:white; text-decoration:none;">
        <span class="material-icons-round" style="font-size:18px;">share</span> Share WhatsApp
      </a>
    </div>
  `;

  Modal.show({
    title: 'Payment Receipt',
    content,
    hideFooter: true,
    onCancel: () => {
      reRender();
    }
  });

  // Bind buttons
  setTimeout(() => {
    const printBtn = document.getElementById('print-receipt-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        printReceipt(entry);
      });
    }
  }, 50);
}

function openCollectModal(shopId) {
  const shop = Store.getShopById(shopId);
  const outstandingObj = Store.getShopOutstanding(shopId);
  const balance = outstandingObj.totalOutstanding;
  
  if (!shop || balance <= 0) return;

  const content = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--bg-base); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <div style="font-size:0.8rem; color:var(--text-muted);">Current Outstanding Credit</div>
        <div style="font-weight:800; font-size:1.40rem; color:var(--danger); margin-top:2px;">${formatCurrency(balance)}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Settlement Mode</label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="recovery-pay-tabs">
          <button class="btn btn-secondary recovery-pay-tab active" data-mode="cash" style="padding:10px 4px; display:flex; flex-direction:column; gap:6px; font-size:0.8rem; align-items:center; justify-content:center;">
            <span class="material-icons-round" style="font-size:20px; color:var(--success)">payments</span>
            Cash Settle
          </button>
          <button class="btn btn-secondary recovery-pay-tab" data-mode="upi" style="padding:10px 4px; display:flex; flex-direction:column; gap:6px; font-size:0.8rem; align-items:center; justify-content:center;">
            <span class="material-icons-round" style="font-size:20px; color:var(--accent-blue)">qr_code_2</span>
            UPI QR Code
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Settled Amount (₹)</label>
        <input type="number" class="form-input" id="recovery-amount" value="${balance}" min="1" max="${balance}" required style="font-weight:700; color:var(--text-primary); font-size:1.1rem;" />
        <span class="form-hint">Enter the collected recovery amount. Maximum ${formatCurrency(balance)}</span>
      </div>

      <!-- Dynamic QR Panel -->
      <div id="recovery-qr-container" style="display:none; flex-direction:column; align-items:center; gap:10px; background:var(--bg-secondary); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-light);">
        <div style="font-weight:600; font-size:0.82rem; color:var(--text-primary);" id="recovery-qr-title">Scan QR code to pay: ${formatCurrency(balance)}</div>
        <div style="background:white; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border); box-shadow:var(--shadow-sm);">
          <img src="" id="recovery-qr-image" style="width:130px; height:130px; display:block;" alt="UPI QR" />
        </div>
        <div style="font-size:0.7rem; color:var(--text-muted); text-align:center;">Works with Google Pay, PhonePe, Paytm or any BHIM UPI app</div>
      </div>
    </div>
  `;

  Modal.show({
    title: `Collect Recovery — ${shop.name}`,
    content,
    confirmText: 'Record Settle',
    onConfirm: () => {
      const amountInput = document.getElementById('recovery-amount');
      const amount = parseFloat(amountInput.value);

      if (isNaN(amount) || amount <= 0 || amount > balance) {
        Toast.error('Please enter a valid recovery amount.');
        return;
      }

      const activeTab = document.querySelector('#recovery-pay-tabs .recovery-pay-tab.active');
      const mode = activeTab ? activeTab.dataset.mode : 'cash';
      const staffId = getStaffId();

      const entry = Store.addLedgerPayment(shopId, amount, mode, staffId);
      Toast.success(`Recovery payment of ${formatCurrency(amount)} recorded successfully!`);
      Modal.hide();
      
      // Automatically send payment receipt to shop owner's registered WhatsApp
      try {
        const waUrl = getWhatsAppReceiptUrl(entry);
        window.open(waUrl, '_blank');
      } catch (err) {
        console.error('Failed to auto-open WhatsApp:', err);
      }

      showReceiptModal(entry);
    }
  });

  // Bind Switch Tabs and Dynamic QR Generation
  setTimeout(() => {
    const tabs = document.querySelectorAll('#recovery-pay-tabs .recovery-pay-tab');
    const qrContainer = document.getElementById('recovery-qr-container');
    const amountInput = document.getElementById('recovery-amount');
    const qrTitle = document.getElementById('recovery-qr-title');
    const qrImg = document.getElementById('recovery-qr-image');

    function updateQr() {
      const val = parseFloat(amountInput.value);
      if (isNaN(val) || val <= 0 || val > balance) {
        qrContainer.style.display = 'none';
        return;
      }
      
      if (qrTitle) qrTitle.textContent = `Scan QR code to pay: ${formatCurrency(val)}`;
      
      const currentFirm = Store.getFirmById(getFirmId());
      const upiId = currentFirm?.id === 'firm_km' ? 'kakamarketing@upi' : 'kakaagencies@upi';
      const upiName = encodeURIComponent(currentFirm?.name || 'Kaka');
      const upiUri = `upi://pay?pa=${upiId}&pn=${upiName}&am=${val}&cu=INR&tn=Kaka%20Credit%20Recovery`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
      
      if (qrImg) qrImg.src = qrUrl;
    }

    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
        const mode = t.dataset.mode;

        if (mode === 'upi') {
          qrContainer.style.display = 'flex';
          updateQr();
        } else {
          qrContainer.style.display = 'none';
        }
      });
    });

    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const mode = document.querySelector('#recovery-pay-tabs .recovery-pay-tab.active')?.dataset.mode;
        if (mode === 'upi') {
          updateQr();
        }
      });
    }
  }, 100);
}

function reRender() {
  const pageBody = document.getElementById('page-body');
  if (pageBody) {
    pageBody.innerHTML = render();
    init();
  }
}

// ---------- Init Event Listeners ----------

export function init() {
  // Select route change
  const selectRoute = document.getElementById('recovery-route-select');
  if (selectRoute) {
    selectRoute.addEventListener('change', (e) => {
      selectedRouteId = e.target.value;
      expandedShopId = null; // Reset expanded details
      reRender();
    });
  }

  // Toggle bill details expand/collapse
  document.querySelectorAll('.toggle-bills-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const shopId = btn.dataset.shopId;
      if (expandedShopId === shopId) {
        expandedShopId = null;
      } else {
        expandedShopId = shopId;
      }
      reRender();
    });
  });

  // Collect recovery modal trigger
  document.querySelectorAll('.collect-recovery-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const shopId = btn.dataset.shopId;
      openCollectModal(shopId);
    });
  });
}
