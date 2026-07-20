// ============================================
// Admin Staff Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

function getOrderCountForStaff(staffId) {
  return Store.getOrders({ staffId }).length;
}

function getStaffFormHtml(staff = null) {
  return `
    <div class="form-group">
      <label class="form-label">Name</label>
      <input type="text" class="form-input" id="staff-name" placeholder="e.g. Raju"
        value="${staff ? staff.name : ''}" required />
    </div>
    <div class="form-group">
      <label class="form-label">Phone</label>
      <input type="tel" class="form-input" id="staff-phone" placeholder="e.g. +91 99887 76655"
        value="${staff ? staff.phone || '' : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Username</label>
      <input type="text" class="form-input" id="staff-username" placeholder="e.g. raju"
        value="${staff ? staff.username || '' : ''}" required />
      <span class="form-hint">Worker will use this username to log in</span>
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input type="text" class="form-input" id="staff-password" placeholder="e.g. Raju@123"
        value="${staff ? staff.password || '' : ''}" required />
      <span class="form-hint">Worker will use this password to log in</span>
    </div>
    <input type="hidden" id="staff-pin" value="${staff ? staff.pin || '5678' : '5678'}" />
  `;
}


export function render() {
  const staff = Store.getStaff();
  const adminPin = Store.getAdminPin();

  return `
    <style>
      @media (max-width: 640px) {
        .staff-table-wrap { display: none !important; }
        .staff-cards-wrap { display: flex !important; }
      }
      @media (min-width: 641px) {
        .staff-table-wrap { display: block !important; }
        .staff-cards-wrap { display: none !important; }
      }
    </style>

    <div class="table-container mb-lg">
      <div class="table-header">
        <h3 class="table-title">
          <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; font-size:20px">groups</span>
          Staff Members (${staff.length})
        </h3>
        <button class="btn btn-primary" id="add-staff-btn">
          <span class="material-icons-round">person_add</span>
          Add Staff
        </button>
      </div>

      ${staff.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon"><span class="material-icons-round">groups</span></div>
          <h3>No staff members</h3>
          <p>Add delivery staff so they can log in and take orders.</p>
          <button class="btn btn-primary" id="empty-add-staff-btn">
            <span class="material-icons-round">person_add</span> Add Staff
          </button>
        </div>` : `

        <!-- TABLE VIEW (tablet / desktop) -->
        <div class="staff-table-wrap" style="overflow-x:auto;">
          <table style="min-width:600px; width:100%;">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Username</th>
                <th>Password</th>
                <th>Orders</th>
                <th style="width:130px; text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${staff.map(s => {
                const orderCount = getOrderCountForStaff(s.id);
                const isBlocked = !!s.isBlocked;
                return `
                  <tr style="${isBlocked ? 'opacity:0.6; background:var(--danger-light);' : ''}">
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:${isBlocked ? 'var(--text-dim)' : 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-blue-light))'}; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; color:${isBlocked ? '#fff' : 'var(--accent-gold)'}; flex-shrink:0;">
                          ${s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style="font-weight:600; text-decoration:${isBlocked ? 'line-through' : 'none'};">${s.name}</div>
                          ${isBlocked ? `<span class="badge badge-danger" style="font-size:0.55rem; padding:2px 6px; margin-top:2px;">Blocked</span>` : ''}
                        </div>
                      </div>
                    </td>
                    <td>${s.phone || '<span class="text-muted">—</span>'}</td>
                    <td><code style="font-size:0.85rem;">${s.username || s.name.toLowerCase()}</code></td>
                    <td><code style="font-size:0.85rem;">${s.password || s.pin || '5678'}</code></td>
                    <td><span class="badge badge-info">${orderCount}</span></td>
                    <td>
                      <div style="display:flex; gap:4px; justify-content:center;">
                        <button class="btn-icon staff-block-btn" data-id="${s.id}" title="${isBlocked ? 'Unblock' : 'Block'}" style="color:${isBlocked ? 'var(--success)' : 'var(--danger)'}">
                          <span class="material-icons-round" style="font-size:18px">${isBlocked ? 'lock_open' : 'lock'}</span>
                        </button>
                        <button class="btn-icon staff-edit-btn" data-id="${s.id}" title="Edit" ${isBlocked ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                          <span class="material-icons-round" style="font-size:18px">edit</span>
                        </button>
                        <button class="btn-icon staff-delete-btn" data-id="${s.id}" title="Delete" style="color:var(--danger)">
                          <span class="material-icons-round" style="font-size:18px">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- CARD VIEW (mobile) -->
        <div class="staff-cards-wrap" style="flex-direction:column; gap:12px; padding:12px 0;">
          ${staff.map(s => {
            const orderCount = getOrderCountForStaff(s.id);
            const isBlocked = !!s.isBlocked;
            return `
              <div style="background:var(--bg-base); border:1px solid var(--border); border-radius:var(--radius-md); padding:14px; ${isBlocked ? 'opacity:0.65;' : ''}">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                  <div style="width:44px; height:44px; border-radius:50%; background:${isBlocked ? 'var(--text-dim)' : 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-blue-light))'}; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; color:${isBlocked ? '#fff' : 'var(--accent-gold)'}; flex-shrink:0;">
                    ${s.name.charAt(0).toUpperCase()}
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary); text-decoration:${isBlocked ? 'line-through' : 'none'};">${s.name}</div>
                    ${isBlocked ? `<span class="badge badge-danger" style="font-size:0.6rem; margin-top:2px;">Blocked</span>` : `<span class="badge badge-info" style="font-size:0.65rem; margin-top:2px;">${orderCount} orders</span>`}
                  </div>
                  <div style="display:flex; gap:4px;">
                    <button class="btn-icon staff-block-btn" data-id="${s.id}" style="color:${isBlocked ? 'var(--success)' : 'var(--danger)'}">
                      <span class="material-icons-round" style="font-size:18px">${isBlocked ? 'lock_open' : 'lock'}</span>
                    </button>
                    <button class="btn-icon staff-edit-btn" data-id="${s.id}" ${isBlocked ? 'disabled style="opacity:0.3;"' : ''}>
                      <span class="material-icons-round" style="font-size:18px">edit</span>
                    </button>
                    <button class="btn-icon staff-delete-btn" data-id="${s.id}" style="color:var(--danger)">
                      <span class="material-icons-round" style="font-size:18px">delete</span>
                    </button>
                  </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.82rem;">
                  <div>
                    <div style="color:var(--text-dim); font-size:0.72rem; margin-bottom:2px;">PHONE</div>
                    <div style="color:var(--text-secondary);">${s.phone || '—'}</div>
                  </div>
                  <div>
                    <div style="color:var(--text-dim); font-size:0.72rem; margin-bottom:2px;">USERNAME</div>
                    <code style="color:var(--text-primary); font-size:0.82rem;">${s.username || s.name.toLowerCase()}</code>
                  </div>
                  <div style="grid-column:1/-1;">
                    <div style="color:var(--text-dim); font-size:0.72rem; margin-bottom:2px;">PASSWORD</div>
                    <code style="color:var(--accent-gold); font-size:0.82rem;">${s.password || s.pin || '5678'}</code>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      `}
    </div>

    <!-- Admin PIN Section -->
    <div class="card" style="max-width:420px">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <span class="material-icons-round" style="color:var(--accent-gold); font-size:24px">admin_panel_settings</span>
        <h3 style="margin:0;">Admin PIN</h3>
      </div>
      <p class="text-muted" style="font-size:0.85rem; margin-bottom:16px;">Change the admin PIN used to log into the management panel.</p>
      <div class="form-group">
        <label class="form-label">Current PIN</label>
        <code style="background:var(--bg-input); padding:6px 14px; border-radius:var(--radius-sm); font-size:1rem; letter-spacing:3px; border:1px solid var(--border); display:inline-block">${adminPin}</code>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
        <div class="form-group" style="flex:1; min-width:120px; margin:0;">
          <label class="form-label">New PIN</label>
          <input type="text" class="form-input" id="new-admin-pin" placeholder="4 digits"
            maxlength="4" pattern="[0-9]{4}" inputmode="numeric" />
        </div>
        <button class="btn btn-primary" id="change-admin-pin-btn" style="height:42px; white-space:nowrap;">
          <span class="material-icons-round">lock</span> Change PIN
        </button>
      </div>
    </div>
  `;
}


function showStaffModal(staff = null) {
  const isEdit = !!staff;
  Modal.show({
    title: isEdit ? 'Edit Staff Member' : 'Add Staff Member',
    content: getStaffFormHtml(staff),
    confirmText: isEdit ? 'Update' : 'Add Worker',
    onConfirm: () => {
      const name = document.getElementById('staff-name').value.trim();
      const phone = document.getElementById('staff-phone').value.trim();
      const username = document.getElementById('staff-username').value.trim();
      const password = document.getElementById('staff-password').value.trim();
      const pin = document.getElementById('staff-pin').value.trim();

      if (!name) { Toast.error('Name is required'); return; }
      if (!username) { Toast.error('Username is required'); return; }
      if (!password) { Toast.error('Password is required'); return; }

      // Check duplicate usernames
      const allStaff = Store.getStaff();
      const duplicateUser = allStaff.find(s => (s.username || s.name || '').toLowerCase() === username.toLowerCase() && (!staff || s.id !== staff.id));
      if (duplicateUser) {
        Toast.error(`Username "${username}" is already used by ${duplicateUser.name}`);
        return;
      }

      if (isEdit) {
        Store.updateStaff(staff.id, { name, phone, username, password, pin });
        Toast.success(`${name} updated`);
      } else {
        Store.addStaff({ name, phone, username, password, pin, isBlocked: false });
        Toast.success(`${name} added`);
      }
      Modal.hide();
      reRender();
    }
  });
}

function reRender() {
  const pageBody = document.querySelector('.page-body');
  if (pageBody) {
    pageBody.innerHTML = render();
    init();
  }
}

export function init() {
  // Add staff
  const addBtn = document.getElementById('add-staff-btn');
  if (addBtn) addBtn.addEventListener('click', () => showStaffModal());

  const emptyAddBtn = document.getElementById('empty-add-staff-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => showStaffModal());

  // Edit buttons
  document.querySelectorAll('.staff-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const staff = Store.getStaffById(btn.dataset.id);
      if (staff) showStaffModal(staff);
    });
  });

  // Delete buttons
  document.querySelectorAll('.staff-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const staff = Store.getStaffById(btn.dataset.id);
      if (!staff) return;
      const orderCount = getOrderCountForStaff(staff.id);
      const warning = orderCount > 0 ? ` They have ${orderCount} order${orderCount !== 1 ? 's' : ''} on record.` : '';
      const confirmed = await Modal.confirm(`Delete staff member "${staff.name}"?${warning}`);
      if (confirmed) {
        Store.deleteStaff(staff.id);
        Toast.success(`${staff.name} deleted`);
        reRender();
      }
    });
  });

  // Block / Unblock buttons
  document.querySelectorAll('.staff-block-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const staff = Store.getStaffById(btn.dataset.id);
      if (!staff) return;
      const isBlocked = !staff.isBlocked;
      const actionText = isBlocked ? 'block' : 'unblock';
      const confirmed = await Modal.confirm(`Are you sure you want to ${actionText} worker "${staff.name}"?`);
      if (confirmed) {
        Store.updateStaff(staff.id, { isBlocked });
        Toast.success(`${staff.name} has been ${actionText}ed`);
        reRender();
      }
    });
  });

  // Change admin PIN
  const changePinBtn = document.getElementById('change-admin-pin-btn');
  if (changePinBtn) {
    changePinBtn.addEventListener('click', () => {
      const newPin = document.getElementById('new-admin-pin').value.trim();
      if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.error('PIN must be exactly 4 digits');
        return;
      }

      // Check if matches any staff PIN
      const allStaff = Store.getStaff();
      const conflictStaff = allStaff.find(s => s.pin === newPin);
      if (conflictStaff) {
        Toast.error(`PIN "${newPin}" is already used by staff member ${conflictStaff.name}`);
        return;
      }

      Store.setAdminPin(newPin);
      Toast.success('Admin PIN changed successfully');
      reRender();
    });
  }
}
