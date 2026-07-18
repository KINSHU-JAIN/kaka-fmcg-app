// ============================================
// Admin — Beat Plan Manager
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

function getFirmId() { return window.__currentFirm || 'firm_ka'; }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

let selectedStaffId = '';

function getBeatPlans() {
  try {
    const plans = Store.getBeatPlans(getFirmId());
    if (plans && plans.length >= 0) return plans;
  } catch {}
  try { return JSON.parse(localStorage.getItem('kaka_beat_plans') || '[]'); } catch { return []; }
}

function saveBeatPlanLocal(staffId, firmId, dayOfWeek, shopIds) {
  try { Store.setBeatPlan(staffId, firmId, dayOfWeek, shopIds); } catch {}
  const plans = (() => { try { return JSON.parse(localStorage.getItem('kaka_beat_plans') || '[]'); } catch { return []; } })();
  const idx = plans.findIndex(p => p.staffId === staffId && p.dayOfWeek === dayOfWeek && p.firmId === firmId);
  const plan = { id: staffId+'_'+dayOfWeek+'_'+firmId, staffId, firmId, dayOfWeek, shopIds };
  if (idx !== -1) plans[idx] = plan; else plans.push(plan);
  localStorage.setItem('kaka_beat_plans', JSON.stringify(plans));
}

function getStaffDayPlan(staffId, dayOfWeek) {
  const plans = getBeatPlans();
  const firmId = getFirmId();
  const plan = plans.find(p => p.staffId === staffId && p.dayOfWeek === dayOfWeek && p.firmId === firmId);
  return plan ? (plan.shopIds || []) : [];
}

export function render() {
  const staffList = Store.getStaff();
  const shops = Store.getShops();

  return `
    <div style="margin-bottom:20px;">
      <div class="form-group" style="max-width:360px;">
        <label class="form-label">Select Salesman</label>
        <select id="beat-staff-select" class="form-input">
          <option value="">— Choose a salesman —</option>
          ${staffList.map(s => `<option value="${s.id}" ${s.id === selectedStaffId ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
    </div>

    ${!selectedStaffId ? `
      <div class="empty-state">
        <div class="empty-state-icon"><span class="material-icons-round">calendar_month</span></div>
        <h3>Select a Salesman</h3>
        <p>Choose a salesman above to set their weekly beat plan.</p>
      </div>` : `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:14px;">
        ${[1,2,3,4,5,6,0].map(dayIdx => {
          const shopIds = getStaffDayPlan(selectedStaffId, dayIdx);
          const dayShops = shopIds.map(id => shops.find(s => s.id === id)).filter(Boolean);
          const isToday = new Date().getDay() === dayIdx;
          return `
            <div class="card" style="${isToday ? 'border:1px solid var(--accent-gold);' : ''}">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <div>
                  <div style="font-weight:700; color:${isToday ? 'var(--accent-gold)' : 'var(--text-primary)'}; font-size:0.95rem;">
                    ${isToday ? '📍 ' : ''}${DAYS[dayIdx]}
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${shopIds.length} shop${shopIds.length !== 1 ? 's' : ''}</div>
                </div>
                <button class="btn btn-secondary btn-sm add-shop-day-btn" data-day="${dayIdx}" style="padding:4px 10px;">
                  <span class="material-icons-round" style="font-size:15px;">add</span>
                </button>
              </div>
              <div id="day-shops-${dayIdx}" style="display:flex; flex-direction:column; gap:6px; min-height:40px;">
                ${dayShops.length === 0 ? `<div style="font-size:0.78rem; color:var(--text-dim); text-align:center; padding:8px 0;">No shops assigned</div>` :
                  dayShops.map(shop => `
                    <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-base); border-radius:var(--radius-md); padding:6px 10px;">
                      <div style="font-size:0.82rem; color:var(--text-primary); font-weight:500; flex:1; min-width:0;" class="truncate">${shop.name}</div>
                      <button class="remove-shop-btn" data-day="${dayIdx}" data-shop-id="${shop.id}"
                        style="background:none; border:none; cursor:pointer; color:var(--text-dim); padding:0 2px; display:flex; align-items:center; flex-shrink:0;">
                        <span class="material-icons-round" style="font-size:16px;">close</span>
                      </button>
                    </div>`).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>`}`;
}

export function init() {
  const staffSelect = document.getElementById('beat-staff-select');
  if (staffSelect) {
    staffSelect.addEventListener('change', () => {
      selectedStaffId = staffSelect.value;
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  }

  document.querySelectorAll('.add-shop-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayOfWeek = parseInt(btn.dataset.day);
      const shops = Store.getShops();
      const currentShopIds = getStaffDayPlan(selectedStaffId, dayOfWeek);

      const content = `
        <div style="max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          <div class="search-bar" style="margin-bottom:8px;">
            <span class="material-icons-round">search</span>
            <input type="text" id="beat-shop-search" placeholder="Search shops..." />
          </div>
          <div id="beat-shop-list">
            ${shops.map(s => `
              <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:var(--radius-md); cursor:pointer; border:1px solid ${currentShopIds.includes(s.id) ? 'var(--accent-gold)' : 'transparent'}; background:${currentShopIds.includes(s.id) ? 'var(--accent-gold)10' : 'var(--bg-base)'}">
                <input type="checkbox" value="${s.id}" ${currentShopIds.includes(s.id) ? 'checked' : ''} style="accent-color:var(--accent-gold);" />
                <div>
                  <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${s.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${s.address || ''}</div>
                </div>
              </label>`).join('')}
          </div>
        </div>`;

      Modal.show({
        title: `Assign Shops — ${DAYS[dayOfWeek]}`,
        content,
        confirmText: 'Save Beat Plan',
        onConfirm: () => {
          const checked = [...document.querySelectorAll('#beat-shop-list input[type=checkbox]:checked')].map(c => c.value);
          saveBeatPlanLocal(selectedStaffId, getFirmId(), dayOfWeek, checked);
          Modal.hide();
          Toast.success(`Beat plan for ${DAYS[dayOfWeek]} saved!`);
          document.getElementById('page-body').innerHTML = render();
          init();
        }
      });

      setTimeout(() => {
        const searchInput = document.getElementById('beat-shop-search');
        if (searchInput) {
          searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            document.querySelectorAll('#beat-shop-list label').forEach(label => {
              const name = label.querySelector('div div')?.textContent?.toLowerCase() || '';
              label.style.display = name.includes(q) ? '' : 'none';
            });
          });
        }
      }, 50);
    });
  });

  document.querySelectorAll('.remove-shop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayOfWeek = parseInt(btn.dataset.day);
      const shopId = btn.dataset.shopId;
      const currentIds = getStaffDayPlan(selectedStaffId, dayOfWeek);
      const newIds = currentIds.filter(id => id !== shopId);
      saveBeatPlanLocal(selectedStaffId, getFirmId(), dayOfWeek, newIds);
      Toast.success('Shop removed from beat plan');
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  });
}
