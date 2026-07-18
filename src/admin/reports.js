// ============================================
// Admin — Reports (Sales, Top Products, Aging, Shop History)
// ============================================

import { Store } from '../data/store.js';

function getFirmId() { return window.__currentFirm || 'firm_ka'; }
function formatCurrency(n) { return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function localDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function statusBadge(status) {
  const map = { pending:'#f59e0b', confirmed:'#3b82f6', delivered:'var(--success)', cancelled:'var(--danger)' };
  return `<span style="background:${map[status]||'#888'}22; color:${map[status]||'#888'}; border-radius:100px; padding:2px 10px; font-size:0.72rem; font-weight:600; text-transform:capitalize;">${status}</span>`;
}

let activeTab = 'sales';
let fromDate = (() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; })();
let toDate = new Date().toISOString().split('T')[0];
let filterStaffId = '';
let selectedShopId = '';
let expandedOrderId = '';

function renderTabsNav() {
  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: 'receipt_long' },
    { id: 'products', label: 'Top Products', icon: 'inventory_2' },
    { id: 'aging', label: 'Aging Report', icon: 'schedule' },
    { id: 'history', label: 'Shop History', icon: 'store' },
  ];
  return `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
    ${tabs.map(t => `
      <button class="reports-tab-btn ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}"
        style="display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:100px; border:1px solid var(--border);
          background:${activeTab === t.id ? 'var(--accent-gold)' : 'var(--bg-card)'};
          color:${activeTab === t.id ? '#000' : 'var(--text-secondary)'};
          font-weight:${activeTab === t.id ? '700' : '500'}; font-size:0.85rem; cursor:pointer;">
        <span class="material-icons-round" style="font-size:16px;">${t.icon}</span>${t.label}
      </button>`).join('')}
  </div>`;
}

function renderSalesTab(orders) {
  const staff = Store.getStaff();
  const filtered = orders.filter(o => {
    if (o.status === 'cancelled') return false;
    const d = localDate(o.createdAt);
    if (d < fromDate || d > toDate) return false;
    if (filterStaffId && o.staffId !== filterStaffId) return false;
    return true;
  });

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const cashCollected = filtered.filter(o => o.paymentMode === 'cash').reduce((s, o) => s + (o.total || 0), 0);
  const upiCollected = filtered.filter(o => o.paymentMode === 'upi').reduce((s, o) => s + (o.total || 0), 0);
  const creditTotal = filtered.filter(o => o.paymentMode === 'credit').reduce((s, o) => s + (o.total || 0), 0);

  // Day-wise breakdown
  const dayMap = {};
  filtered.forEach(o => {
    const d = localDate(o.createdAt);
    if (!dayMap[d]) dayMap[d] = { orders: 0, revenue: 0, cash: 0, credit: 0 };
    dayMap[d].orders++;
    dayMap[d].revenue += o.total || 0;
    if (o.paymentMode === 'cash' || o.paymentMode === 'upi') dayMap[d].cash += o.total || 0;
    if (o.paymentMode === 'credit') dayMap[d].credit += o.total || 0;
  });
  const days = Object.keys(dayMap).sort();

  return `
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; align-items:flex-end;">
      <div class="form-group" style="margin:0;">
        <label class="form-label" style="font-size:0.78rem;">From</label>
        <input type="date" id="rpt-from" class="form-input" value="${fromDate}" style="padding:8px;" />
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label" style="font-size:0.78rem;">To</label>
        <input type="date" id="rpt-to" class="form-input" value="${toDate}" style="padding:8px;" />
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label" style="font-size:0.78rem;">Staff</label>
        <select id="rpt-staff" class="form-input" style="padding:8px;">
          <option value="">All Staff</option>
          ${staff.map(s => `<option value="${s.id}" ${s.id === filterStaffId ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <button id="rpt-print" class="btn btn-secondary" style="margin-bottom:0;" onclick="window.print()">
        <span class="material-icons-round" style="font-size:16px;">print</span> Print
      </button>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px; margin-bottom:20px;">
      ${[
        { label: 'Total Orders', value: filtered.length, icon: 'receipt_long', color: 'var(--text-primary)' },
        { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: 'currency_rupee', color: 'var(--accent-gold)' },
        { label: 'Cash / UPI', value: formatCurrency(cashCollected + upiCollected), icon: 'payments', color: 'var(--success)' },
        { label: 'Credit Given', value: formatCurrency(creditTotal), icon: 'account_balance_wallet', color: 'var(--danger)' },
      ].map(c => `
        <div class="card" style="padding:14px; display:flex; align-items:center; gap:12px;">
          <span class="material-icons-round" style="color:${c.color}; font-size:28px;">${c.icon}</span>
          <div>
            <div style="font-size:1rem; font-weight:800; color:${c.color};">${c.value}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${c.label}</div>
          </div>
        </div>`).join('')}
    </div>

    ${days.length === 0 ? `<div class="empty-state"><div class="empty-state-icon"><span class="material-icons-round">bar_chart</span></div><h3>No Data</h3><p>No orders in the selected range.</p></div>` : `
    <div class="card">
      <div style="font-weight:700; color:var(--text-primary); margin-bottom:12px;">Day-wise Breakdown</div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Date</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Orders</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Revenue</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Cash/UPI</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Credit</th>
          </tr></thead>
          <tbody>
            ${days.map(d => `<tr style="border-bottom:1px solid var(--border);">
              <td style="padding:10px; color:var(--text-primary);">${formatDate(d)}</td>
              <td style="padding:10px; text-align:right; color:var(--text-secondary);">${dayMap[d].orders}</td>
              <td style="padding:10px; text-align:right; color:var(--accent-gold); font-weight:600;">${formatCurrency(dayMap[d].revenue)}</td>
              <td style="padding:10px; text-align:right; color:var(--success);">${formatCurrency(dayMap[d].cash)}</td>
              <td style="padding:10px; text-align:right; color:var(--danger);">${formatCurrency(dayMap[d].credit)}</td>
            </tr>`).join('')}
            <tr style="background:var(--bg-base); font-weight:700;">
              <td style="padding:10px;">Total</td>
              <td style="padding:10px; text-align:right;">${filtered.length}</td>
              <td style="padding:10px; text-align:right; color:var(--accent-gold);">${formatCurrency(totalRevenue)}</td>
              <td style="padding:10px; text-align:right; color:var(--success);">${formatCurrency(cashCollected + upiCollected)}</td>
              <td style="padding:10px; text-align:right; color:var(--danger);">${formatCurrency(creditTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`}`;
}

function renderProductsTab(orders) {
  const productMap = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    (o.items || []).forEach(item => {
      if (!productMap[item.productId || item.name]) {
        productMap[item.productId || item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      productMap[item.productId || item.name].qty += item.qty || 0;
      productMap[item.productId || item.name].revenue += item.subtotal || 0;
    });
  });
  const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 30);

  return `
    <div class="card">
      <div style="font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
        <span class="material-icons-round" style="color:var(--accent-gold);">emoji_events</span>
        Top Selling Products (All Time)
      </div>
      ${products.length === 0 ? `<div class="empty-state"><h3>No Product Data</h3></div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left; padding:10px; color:var(--text-muted); width:48px;">#</th>
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Product</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Units Sold</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Revenue</th>
          </tr></thead>
          <tbody>
            ${products.map((p, i) => `<tr style="border-bottom:1px solid var(--border);">
              <td style="padding:10px;">
                <span style="font-size:1.1rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
              </td>
              <td style="padding:10px; font-weight:600; color:var(--text-primary);">${p.name}</td>
              <td style="padding:10px; text-align:right; color:var(--text-secondary);">${p.qty.toLocaleString('en-IN')}</td>
              <td style="padding:10px; text-align:right; color:var(--accent-gold); font-weight:600;">${formatCurrency(p.revenue)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;
}

function renderAgingTab() {
  const shops = Store.getShops();
  const rows = [];
  shops.forEach(shop => {
    const outstanding = Store.getShopOutstanding(shop.id);
    if (outstanding.totalOutstanding <= 0) return;
    const maxDays = outstanding.details.length > 0
      ? Math.max(...outstanding.details.map(d => d.daysOld || 0))
      : 0;
    let bucket, color;
    if (maxDays <= 7) { bucket = 'Current'; color = 'var(--success)'; }
    else if (maxDays <= 30) { bucket = 'Overdue'; color = '#f59e0b'; }
    else if (maxDays <= 60) { bucket = 'Late'; color = '#f97316'; }
    else { bucket = 'Critical'; color = 'var(--danger)'; }
    rows.push({ shop, outstanding: outstanding.totalOutstanding, maxDays, bucket, color });
  });
  rows.sort((a, b) => b.maxDays - a.maxDays);
  const total = rows.reduce((s, r) => s + r.outstanding, 0);

  const bucketCounts = {
    Current: rows.filter(r => r.bucket === 'Current').length,
    Overdue: rows.filter(r => r.bucket === 'Overdue').length,
    Late: rows.filter(r => r.bucket === 'Late').length,
    Critical: rows.filter(r => r.bucket === 'Critical').length,
  };

  return `
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:20px;">
      ${[
        { label: 'Current (0-7d)', count: bucketCounts.Current, color: 'var(--success)' },
        { label: 'Overdue (8-30d)', count: bucketCounts.Overdue, color: '#f59e0b' },
        { label: 'Late (31-60d)', count: bucketCounts.Late, color: '#f97316' },
        { label: 'Critical (60+d)', count: bucketCounts.Critical, color: 'var(--danger)' },
      ].map(b => `
        <div class="card" style="text-align:center; padding:12px;">
          <div style="font-size:1.6rem; font-weight:800; color:${b.color};">${b.count}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${b.label}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-weight:700; color:var(--text-primary);">Outstanding Aging Report</div>
        <button class="btn btn-secondary btn-sm" onclick="window.print()">
          <span class="material-icons-round" style="font-size:16px;">print</span> Print
        </button>
      </div>
      ${rows.length === 0 ? `<div class="empty-state"><h3>All Clear!</h3><p>No outstanding balances.</p></div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Shop</th>
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Phone</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Outstanding</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Oldest (Days)</th>
            <th style="text-align:center; padding:10px; color:var(--text-muted);">Status</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `<tr style="border-bottom:1px solid var(--border);">
              <td style="padding:10px; font-weight:600; color:var(--text-primary);">${r.shop.name}</td>
              <td style="padding:10px; color:var(--text-muted);">${r.shop.phone || '—'}</td>
              <td style="padding:10px; text-align:right; color:var(--danger); font-weight:600;">${formatCurrency(r.outstanding)}</td>
              <td style="padding:10px; text-align:right; color:var(--text-secondary);">${r.maxDays}</td>
              <td style="padding:10px; text-align:center;">
                <span style="background:${r.color}22; color:${r.color}; border-radius:100px; padding:3px 10px; font-size:0.75rem; font-weight:600;">${r.bucket}</span>
              </td>
            </tr>`).join('')}
            <tr style="background:var(--bg-base); font-weight:700; border-top:2px solid var(--border);">
              <td style="padding:10px;" colspan="2">Total Outstanding</td>
              <td style="padding:10px; text-align:right; color:var(--danger);">${formatCurrency(total)}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>`}
    </div>`;
}

function renderHistoryTab(orders) {
  const shops = Store.getShops();
  const shopOrders = selectedShopId ? orders.filter(o => o.shopId === selectedShopId) : [];

  return `
    <div class="card">
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Select Shop</label>
        <select id="history-shop-select" class="form-input">
          <option value="">— Choose a shop —</option>
          ${shops.map(s => `<option value="${s.id}" ${s.id === selectedShopId ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      ${selectedShopId && shopOrders.length === 0 ? `<div class="empty-state"><h3>No Orders</h3><p>This shop hasn't placed any orders yet.</p></div>` : ''}
      ${selectedShopId && shopOrders.length > 0 ? `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Order ID</th>
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Date</th>
            <th style="text-align:left; padding:10px; color:var(--text-muted);">Staff</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Items</th>
            <th style="text-align:right; padding:10px; color:var(--text-muted);">Total</th>
            <th style="text-align:center; padding:10px; color:var(--text-muted);">Status</th>
          </tr></thead>
          <tbody id="history-tbody">
            ${shopOrders.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(o => `
              <tr class="history-order-row" data-order-id="${o.id}" style="border-bottom:1px solid var(--border); cursor:pointer;">
                <td style="padding:10px; font-weight:600; color:var(--accent-gold); font-size:0.78rem;">#${o.id.slice(-6).toUpperCase()}</td>
                <td style="padding:10px; color:var(--text-secondary);">${formatDate(o.createdAt)}</td>
                <td style="padding:10px; color:var(--text-secondary);">${o.staffName || '—'}</td>
                <td style="padding:10px; text-align:right; color:var(--text-secondary);">${(o.items||[]).length}</td>
                <td style="padding:10px; text-align:right; font-weight:600; color:var(--text-primary);">${formatCurrency(o.total)}</td>
                <td style="padding:10px; text-align:center;">${statusBadge(o.status)}</td>
              </tr>
              ${expandedOrderId === o.id ? `
              <tr style="background:var(--bg-base); border-bottom:1px solid var(--border);">
                <td colspan="6" style="padding:12px 20px;">
                  <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">Items:</div>
                  ${(o.items||[]).map(item => `
                    <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.82rem;">
                      <span style="color:var(--text-primary);">${item.name} × ${item.qty}</span>
                      <span style="color:var(--accent-gold); font-weight:600;">${formatCurrency(item.subtotal)}</span>
                    </div>`).join('')}
                </td>
              </tr>` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>` : (!selectedShopId ? `<div class="empty-state"><div class="empty-state-icon"><span class="material-icons-round">store</span></div><h3>Select a Shop</h3><p>Choose a shop above to view its purchase history.</p></div>` : '')}
    </div>`;
}

export function render() {
  const orders = Store.getOrders({ firmId: getFirmId() });
  let tabContent = '';
  if (activeTab === 'sales') tabContent = renderSalesTab(orders);
  else if (activeTab === 'products') tabContent = renderProductsTab(orders);
  else if (activeTab === 'aging') tabContent = renderAgingTab();
  else if (activeTab === 'history') tabContent = renderHistoryTab(orders);

  return `
    ${renderTabsNav()}
    ${tabContent}`;
}

export function init() {
  document.querySelectorAll('.reports-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  });

  const rptFrom = document.getElementById('rpt-from');
  const rptTo = document.getElementById('rpt-to');
  const rptStaff = document.getElementById('rpt-staff');

  if (rptFrom) rptFrom.addEventListener('change', () => { fromDate = rptFrom.value; document.getElementById('page-body').innerHTML = render(); init(); });
  if (rptTo) rptTo.addEventListener('change', () => { toDate = rptTo.value; document.getElementById('page-body').innerHTML = render(); init(); });
  if (rptStaff) rptStaff.addEventListener('change', () => { filterStaffId = rptStaff.value; document.getElementById('page-body').innerHTML = render(); init(); });

  const shopSelect = document.getElementById('history-shop-select');
  if (shopSelect) {
    shopSelect.addEventListener('change', () => {
      selectedShopId = shopSelect.value;
      expandedOrderId = '';
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  }

  document.querySelectorAll('.history-order-row').forEach(row => {
    row.addEventListener('click', () => {
      const orderId = row.dataset.orderId;
      expandedOrderId = expandedOrderId === orderId ? '' : orderId;
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  });
}
