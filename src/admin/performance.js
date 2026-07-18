// ============================================
// Admin — Salesman Performance Dashboard
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

function getFirmId() { return window.__currentFirm || 'firm_ka'; }
function formatCurrency(n) { return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function getCurrentMonth() { return new Date().toISOString().slice(0, 7); }

function getLocalTargets() {
  try { return JSON.parse(localStorage.getItem('kaka_targets') || '{}'); } catch { return {}; }
}
function setLocalTarget(staffId, month, amount) {
  const t = getLocalTargets();
  t[staffId + '_' + month] = amount;
  localStorage.setItem('kaka_targets', JSON.stringify(t));
}
function getTarget(staffId, month) {
  try {
    const t = Store.getTargetByStaff(staffId, month);
    if (t) return t.targetAmount || 0;
  } catch {}
  const local = getLocalTargets();
  return local[staffId + '_' + month] || 0;
}
function saveTarget(staffId, month, amount) {
  try { Store.setTarget(staffId, getFirmId(), month, amount); } catch {}
  setLocalTarget(staffId, month, amount);
}

function getStaffStats(staffMember, month, allOrders) {
  const monthOrders = allOrders.filter(o => {
    const d = new Date(o.createdAt);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return o.staffId === staffMember.id && m === month;
  });
  const placed = monthOrders.length;
  const delivered = monthOrders.filter(o => o.status === 'delivered').length;
  const revenue = monthOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const uniqueShops = new Set(monthOrders.map(o => o.shopId)).size;
  const target = getTarget(staffMember.id, month);
  const achievement = target > 0 ? Math.round((revenue / target) * 100) : 0;
  return { placed, delivered, revenue, uniqueShops, target, achievement };
}

function achievementColor(pct) {
  if (pct >= 80) return 'var(--success)';
  if (pct >= 50) return '#f59e0b';
  return 'var(--danger)';
}

function achievementLabel(pct) {
  if (pct >= 100) return '🏆 Target Met!';
  if (pct >= 80) return '🟢 On Track';
  if (pct >= 50) return '🟡 Needs Push';
  return '🔴 Below Target';
}

let selectedMonth = getCurrentMonth();

export function render() {
  const staffList = Store.getStaff();
  const allOrders = Store.getOrders({ firmId: getFirmId() });

  const stats = staffList.map(s => ({ staff: s, ...getStaffStats(s, selectedMonth, allOrders) }));
  const sorted = [...stats].sort((a, b) => b.achievement - a.achievement);

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return `
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1 class="page-title">Salesman Performance</h1>
          <p class="page-subtitle">Monthly targets & achievement tracking</p>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <input type="month" id="perf-month" value="${selectedMonth}" class="form-input"
            style="padding:8px 12px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-input); color:var(--text-primary); font-size:0.9rem;" />
        </div>
      </div>
    </div>

    <div class="page-body">
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; margin-bottom:32px;">
        ${stats.length === 0 ? `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon"><span class="material-icons-round">people</span></div>
          <h3>No Staff Found</h3><p>Add staff members to track performance.</p>
        </div>` : stats.map((s, i) => `
          <div class="card" style="display:flex; flex-direction:column; gap:14px; position:relative; overflow:hidden;">
            <div style="position:absolute; top:0; left:0; right:0; height:4px; background:${achievementColor(s.achievement)};"></div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
              <div style="width:48px;height:48px;border-radius:50%;background:var(--accent-gold);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;color:#000;flex-shrink:0;">
                ${s.staff.name.charAt(0).toUpperCase()}
              </div>
              <div style="flex:1;">
                <div style="font-weight:700; font-size:1rem; color:var(--text-primary);">${s.staff.name}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${s.staff.phone || 'No phone'}</div>
              </div>
              <span style="font-size:1.1rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:var(--text-primary);">${s.placed}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Orders Placed</div>
              </div>
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:var(--success);">${s.delivered}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Delivered</div>
              </div>
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:10px; text-align:center;">
                <div style="font-size:1rem; font-weight:800; color:var(--accent-gold);">${formatCurrency(s.revenue)}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Revenue</div>
              </div>
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:var(--text-primary);">${s.uniqueShops}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Shops Visited</div>
              </div>
            </div>

            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div style="font-size:0.8rem; color:var(--text-muted);">Target: <strong style="color:var(--text-primary);">${formatCurrency(s.target)}</strong></div>
                <button class="btn btn-secondary btn-sm edit-target-btn" data-staff-id="${s.staff.id}" data-staff-name="${s.staff.name}" data-target="${s.target}"
                  style="padding:2px 8px; font-size:0.72rem;">
                  <span class="material-icons-round" style="font-size:13px;">edit</span> Set Target
                </button>
              </div>
              <div style="background:var(--bg-base); border-radius:100px; height:10px; overflow:hidden;">
                <div style="height:100%; width:${Math.min(s.achievement, 100)}%; background:${achievementColor(s.achievement)}; border-radius:100px; transition:width 0.6s ease;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:6px;">
                <div style="font-size:0.78rem; color:${achievementColor(s.achievement)}; font-weight:600;">${achievementLabel(s.achievement)}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${s.achievement}%</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${sorted.length > 0 ? `
      <div class="card">
        <div style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:16px; display:flex; align-items:center; gap:8px;">
          <span class="material-icons-round" style="color:var(--accent-gold);">leaderboard</span>
          Leaderboard — ${monthLabel}
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);">
                <th style="text-align:left; padding:10px 12px; color:var(--text-muted); font-weight:600;">Rank</th>
                <th style="text-align:left; padding:10px 12px; color:var(--text-muted); font-weight:600;">Name</th>
                <th style="text-align:right; padding:10px 12px; color:var(--text-muted); font-weight:600;">Orders</th>
                <th style="text-align:right; padding:10px 12px; color:var(--text-muted); font-weight:600;">Revenue</th>
                <th style="text-align:right; padding:10px 12px; color:var(--text-muted); font-weight:600;">Target</th>
                <th style="text-align:right; padding:10px 12px; color:var(--text-muted); font-weight:600;">Achievement</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((s, i) => `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:10px 12px;">
                    <span style="font-size:1.2rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  </td>
                  <td style="padding:10px 12px; font-weight:600; color:var(--text-primary);">${s.staff.name}</td>
                  <td style="padding:10px 12px; text-align:right; color:var(--text-secondary);">${s.placed}</td>
                  <td style="padding:10px 12px; text-align:right; color:var(--accent-gold); font-weight:600;">${formatCurrency(s.revenue)}</td>
                  <td style="padding:10px 12px; text-align:right; color:var(--text-secondary);">${formatCurrency(s.target)}</td>
                  <td style="padding:10px 12px; text-align:right;">
                    <span style="color:${achievementColor(s.achievement)}; font-weight:700;">${s.achievement}%</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}
    </div>`;
}

export function init() {
  const monthInput = document.getElementById('perf-month');
  if (monthInput) {
    monthInput.addEventListener('change', () => {
      selectedMonth = monthInput.value;
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  }

  document.querySelectorAll('.edit-target-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const staffId = btn.dataset.staffId;
      const staffName = btn.dataset.staffName;
      const currentTarget = btn.dataset.target;

      Modal.show({
        title: `Set Target — ${staffName}`,
        content: `
          <div class="form-group">
            <label class="form-label">Monthly Sales Target (₹)</label>
            <input type="number" class="form-input" id="target-amount" value="${currentTarget}" min="0" placeholder="e.g. 200000" />
            <span class="form-hint">Target for ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>`,
        confirmText: 'Save Target',
        onConfirm: () => {
          const amount = parseFloat(document.getElementById('target-amount').value);
          if (isNaN(amount) || amount < 0) { Toast.error('Enter a valid amount'); return; }
          saveTarget(staffId, selectedMonth, amount);
          Modal.hide();
          Toast.success('Target saved!');
          document.getElementById('page-body').innerHTML = render();
          init();
        }
      });
    });
  });
}
