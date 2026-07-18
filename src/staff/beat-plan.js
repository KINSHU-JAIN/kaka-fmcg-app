// ============================================
// Staff — Today's Beat Plan
// ============================================

import { Store } from '../data/store.js';

function getFirmId() { return window.__currentFirm || 'firm_ka'; }
function formatCurrency(n) { return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function formatDate(iso) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getBeatPlans() {
  try {
    const plans = Store.getBeatPlans(getFirmId());
    if (plans && plans.length >= 0) return plans;
  } catch {}
  try { return JSON.parse(localStorage.getItem('kaka_beat_plans') || '[]'); } catch { return []; }
}

export function render() {
  const session = Store.getSession();
  if (!session) return '';
  const staffId = session.user.id;
  const firmId = getFirmId();

  const todayDow = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayName = DAYS[todayDow];
  const todayStr = new Date().toISOString().split('T')[0];

  const plans = getBeatPlans();
  const todayPlan = plans.find(p => p.staffId === staffId && p.dayOfWeek === todayDow && p.firmId === firmId);
  const shopIds = todayPlan ? (todayPlan.shopIds || []) : [];
  const shops = Store.getShops();
  const allOrders = Store.getOrders({ firmId });

  const todayShops = shopIds.map(id => shops.find(s => s.id === id)).filter(Boolean);

  const visitedShopIds = todayShops.filter(shop => {
    return allOrders.some(o =>
      o.shopId === shop.id &&
      o.staffId === staffId &&
      o.createdAt.split('T')[0] === todayStr
    );
  }).map(s => s.id);

  const total = todayShops.length;
  const visited = visitedShopIds.length;
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0;

  return `
    <div style="display:flex; align-items:center; gap:16px; padding:16px; background:var(--bg-card); border-radius:var(--radius-lg); margin-bottom:20px; border:1px solid var(--border);">
      <div style="width:56px; height:56px; border-radius:50%; background:var(--accent-gold)22; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <span class="material-icons-round" style="color:var(--accent-gold); font-size:28px;">today</span>
      </div>
      <div style="flex:1;">
        <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">📍 ${todayName}'s Beat</div>
        <div style="font-size:0.85rem; color:var(--text-muted);">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.5rem; font-weight:800; color:${pct >= 100 ? 'var(--success)' : 'var(--accent-gold)'};">${visited}/${total}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Shops Visited</div>
      </div>
    </div>

    ${total > 0 ? `
    <div style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.82rem; color:var(--text-muted);">
        <span>Progress</span><span>${pct}%</span>
      </div>
      <div style="background:var(--bg-base); border-radius:100px; height:10px; overflow:hidden;">
        <div style="height:100%; width:${pct}%; background:${pct >= 100 ? 'var(--success)' : 'var(--accent-gold)'}; border-radius:100px; transition:width 0.6s;"></div>
      </div>
    </div>` : ''}

    ${total === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon"><span class="material-icons-round">event_busy</span></div>
        <h3>No Beat Plan for Today</h3>
        <p>Ask your admin to set up your visit schedule for ${todayName}.</p>
      </div>` :
      `<div style="display:flex; flex-direction:column; gap:12px;">
        ${todayShops.map(shop => {
          const outstanding = Store.getShopOutstanding(shop.id);
          const shopOrders = allOrders.filter(o => o.shopId === shop.id);
          const lastOrder = shopOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          const isVisited = visitedShopIds.includes(shop.id);
          return `
            <div class="card" style="${isVisited ? 'opacity:0.7;' : ''} position:relative; overflow:hidden;">
              ${isVisited ? `<div style="position:absolute; top:0; left:0; right:0; height:3px; background:var(--success);"></div>` : ''}
              <div style="display:flex; align-items:flex-start; gap:12px;">
                <div style="width:44px; height:44px; border-radius:50%; background:${isVisited ? 'var(--success)22' : 'var(--accent-gold)22'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span class="material-icons-round" style="color:${isVisited ? 'var(--success)' : 'var(--accent-gold)'}; font-size:22px;">
                    ${isVisited ? 'check_circle' : 'store'}
                  </span>
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${shop.name}</div>
                    ${isVisited ? `<span style="background:var(--success)22; color:var(--success); border-radius:100px; padding:2px 8px; font-size:0.7rem; font-weight:600;">✓ Visited</span>` : ''}
                    ${outstanding.totalOutstanding > 0 ? `<span style="background:var(--danger)22; color:var(--danger); border-radius:100px; padding:2px 8px; font-size:0.7rem; font-weight:600;">Due: ${formatCurrency(outstanding.totalOutstanding)}</span>` : ''}
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-muted); margin-top:3px;">${shop.address || 'No address'}</div>
                  <div style="font-size:0.78rem; color:var(--text-dim); margin-top:2px;">Last order: ${lastOrder ? formatDate(lastOrder.createdAt) : 'Never'}</div>
                </div>
              </div>
              <div style="display:flex; gap:8px; margin-top:12px; justify-content:flex-end;">
                ${outstanding.totalOutstanding > 0 ? `
                  <a href="#/staff/credit-recovery" class="btn btn-secondary btn-sm" style="font-size:0.8rem;">
                    <span class="material-icons-round" style="font-size:15px;">payments</span> Collect
                  </a>` : ''}
                <a href="#/staff/new-order" class="btn btn-primary btn-sm" style="font-size:0.8rem;" onclick="window.__beatShopId='${shop.id}'">
                  <span class="material-icons-round" style="font-size:15px;">add_shopping_cart</span> Take Order
                </a>
              </div>
            </div>`;
        }).join('')}
      </div>`}`;
}

export function init() {
  // Auto-refresh on return
  Store.on('orders:change', () => {
    const body = document.getElementById('page-body');
    if (body) { body.innerHTML = render(); init(); }
  });
}
