// ============================================
// Admin Panel — Retailer Ledger (Khata Book)
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { printReceipt, getWhatsAppReceiptUrl } from '../components/invoice.js';

let activeShopId = null;

function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getShopRouteName(shopId) {
  const routes = Store.getRoutes();
  const route = routes.find(r => (r.shopIds || []).includes(shopId));
  return route ? route.name : 'No Route';
}

function renderLedgerTable(shopId) {
  const ledger = Store.getLedger(shopId);
  if (ledger.length === 0) {
    return `
      <tr>
        <td colspan="5" style="text-align:center; padding:30px; color:var(--text-dim);">
          No ledger transactions found for this shop.
        </td>
      </tr>
    `;
  }

  // Reverse sort for showing recent first in transaction logs
  const displayLedger = [...ledger].reverse();

  return displayLedger.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td class="table-cell-main">${e.description}</td>
      <td style="color:var(--danger); text-align:right;">${e.type === 'debit' ? formatCurrency(e.amount) : '—'}</td>
      <td style="color:var(--success); text-align:right;">${e.type === 'credit' ? formatCurrency(e.amount) : '—'}</td>
      <td style="font-weight:700; text-align:right; color:var(--accent-gold);">${formatCurrency(e.runningBalance)}</td>
    </tr>
  `).join('');
}

export function render() {
  const shops = Store.getShops();
  
  // Overall Ledger Statistics
  let totalCredit = 0;
  let debtorCount = 0;
  
  shops.forEach(s => {
    const balance = Store.getShopOutstanding(s.id).totalOutstanding;
    if (balance > 0) {
      totalCredit += balance;
      debtorCount++;
    }
  });

  if (activeShopId) {
    const shop = Store.getShopById(activeShopId);
    const balance = Store.getShopOutstanding(activeShopId).totalOutstanding;
    
    return `
      <div style="margin-bottom:16px;">
        <button class="btn btn-secondary btn-sm" id="ledger-back-btn" style="display:inline-flex; align-items:center; gap:6px;">
          <span class="material-icons-round" style="font-size:16px;">arrow_back</span>
          Back to Retailer Ledger Summary
        </button>
      </div>

      <!-- Shop Detailed Ledger -->
      <div class="card" style="margin-bottom:24px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px; border-bottom:1px solid var(--border-light); padding-bottom:12px;">
          <div>
            <h2 style="margin:0; font-size:1.4rem;">${shop.name}</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin:4px 0 0 0;">
              Owner: ${shop.ownerName} &nbsp;|&nbsp; Route: ${getShopRouteName(shop.id)}
            </p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase;">Outstanding balance</div>
            <div style="font-weight:800; font-size:1.7rem; color:${balance > 0 ? 'var(--danger)' : 'var(--success)'};">${formatCurrency(balance)}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
          <button class="btn btn-primary" id="collect-ledger-payment-btn" ${balance <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <span class="material-icons-round">payments</span>
            Collect Payment (Khata Settlement)
          </button>
        </div>

        <div class="table-container">
          <div class="table-header">
            <h3 class="table-title">Account Transaction Statement</h3>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th style="width:120px;">Date</th>
                  <th>Description</th>
                  <th style="text-align:right; width:130px;">Debit (+)</th>
                  <th style="text-align:right; width:130px;">Credit (-)</th>
                  <th style="text-align:right; width:150px;">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                ${renderLedgerTable(activeShopId)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // Summary list view
  return `
    <!-- Stats Row -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card" style="padding:16px; display:flex; flex-direction:column; gap:8px; border-left:4px solid var(--danger);">
        <div style="font-size:0.8rem; color:var(--text-dim); text-transform:uppercase;">Total Credit Outstanding</div>
        <div style="font-size:1.8rem; font-weight:800; color:var(--danger);">${formatCurrency(totalCredit)}</div>
      </div>
      <div class="card" style="padding:16px; display:flex; flex-direction:column; gap:8px; border-left:4px solid var(--accent-gold);">
        <div style="font-size:0.8rem; color:var(--text-dim); text-transform:uppercase;">Active Debtors</div>
        <div style="font-size:1.8rem; font-weight:800; color:var(--accent-gold);">${debtorCount} Shop${debtorCount !== 1 ? 's' : ''}</div>
      </div>
    </div>

    <!-- Shops Ledger Summary Table -->
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">Shops Outstanding Ledger Summary</h3>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Proprietor</th>
              <th>Route</th>
              <th style="text-align:right;">Current Balance</th>
              <th style="width:120px; text-align:center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${shops.map(s => {
              const outstanding = Store.getShopOutstanding(s.id);
              const bal = outstanding.totalOutstanding;
              const hasCredit = bal > 0;
              return `
                <tr>
                  <td class="table-cell-main">${s.name}</td>
                  <td>${s.ownerName}</td>
                  <td>${getShopRouteName(s.id)}</td>
                  <td style="text-align:right; font-weight:700; color:${hasCredit ? 'var(--danger)' : 'var(--success)'};">
                    ${formatCurrency(bal)}
                  </td>
                  <td style="text-align:center;">
                    <button class="btn btn-secondary btn-sm view-ledger-btn" data-shop-id="${s.id}">
                      <span class="material-icons-round" style="font-size:14px; margin-right:4px;">menu_book</span>
                      Statement
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showReceiptModal(entry) {
  const shop = Store.getShopById(entry.shopId);
  const firmId = window.__currentFirm || 'firm_ka';
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
        <span style="color:var(--text-muted);">Collector:</span>
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

function openCollectPaymentModal() {
  const shop = Store.getShopById(activeShopId);
  const balance = Store.getShopOutstanding(activeShopId).totalOutstanding;
  if (!shop || balance <= 0) return;

  const content = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--bg-base); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <div style="font-size:0.8rem; color:var(--text-muted);">Current Outstanding Credit</div>
        <div style="font-weight:800; font-size:1.4rem; color:var(--danger); margin-top:2px;">${formatCurrency(balance)}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Payment Mode</label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="ledger-pay-tabs">
          <button class="btn btn-secondary ledger-pay-tab active" data-mode="cash">
            <span class="material-icons-round" style="font-size:18px; color:var(--success)">payments</span>
            Cash Settle
          </button>
          <button class="btn btn-secondary ledger-pay-tab" data-mode="upi">
            <span class="material-icons-round" style="font-size:18px; color:var(--accent-blue)">qr_code_2</span>
            UPI / QR
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Collection Amount (₹)</label>
        <input type="number" class="form-input" id="ledger-amount" value="${balance}" min="1" max="${balance}" required />
        <span class="form-hint">Enter the collected settlement amount. Maximum ${formatCurrency(balance)}</span>
      </div>
    </div>
  `;

  Modal.show({
    title: `Collect Payment — ${shop.name}`,
    content,
    confirmText: 'Record Collection',
    onConfirm: () => {
      const amountInput = document.getElementById('ledger-amount');
      const amount = parseFloat(amountInput.value);
      
      if (isNaN(amount) || amount <= 0 || amount > balance) {
        Toast.error('Please enter a valid collection amount.');
        return;
      }

      const activeTab = document.querySelector('#ledger-pay-tabs .ledger-pay-tab.active');
      const mode = activeTab ? activeTab.dataset.mode : 'cash';

      const entry = Store.addLedgerPayment(activeShopId, amount, mode, null);
      Toast.success(`Payment of ${formatCurrency(amount)} recorded successfully!`);
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

  // Handle modal pay mode tabs click
  setTimeout(() => {
    const tabs = document.querySelectorAll('#ledger-pay-tabs .ledger-pay-tab');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
      });
    });
  }, 100);
}

function reRender() {
  const pageBody = document.getElementById('page-body');
  if (pageBody) {
    pageBody.innerHTML = render();
    init();
  }
}

export function init() {
  // Back button in statement
  const backBtn = document.getElementById('ledger-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      activeShopId = null;
      reRender();
    });
  }

  // Settle Outstanding Button
  const collectPaymentBtn = document.getElementById('collect-ledger-payment-btn');
  if (collectPaymentBtn) {
    collectPaymentBtn.addEventListener('click', openCollectPaymentModal);
  }

  // Statement list clicks
  document.querySelectorAll('.view-ledger-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeShopId = btn.dataset.shopId;
      reRender();
    });
  });
}
