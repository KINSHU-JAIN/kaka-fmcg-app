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

function renderStaffRow(staffMember) {
  const orderCount = getOrderCountForStaff(staffMember.id);
  const isBlocked = !!staffMember.isBlocked;

  return `
    <tr style="${isBlocked ? 'opacity: 0.6; background: var(--danger-light);' : ''}">
      <td class="table-cell-main">
        <div class="flex items-center gap-sm">
          <div style="width:36px; height:36px; border-radius:var(--radius-full); background: ${isBlocked ? 'var(--text-dim)' : 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-blue-light))'}; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; color: ${isBlocked ? '#fff' : 'var(--accent-gold)'}; flex-shrink:0">
            ${staffMember.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600; text-decoration: ${isBlocked ? 'line-through' : 'none'};">${staffMember.name}</div>
            ${isBlocked ? `<span class="badge badge-danger" style="font-size:0.55rem; padding:2px 6px; margin-top:2px; text-transform:none;">Blocked</span>` : ''}
          </div>
        </div>
      </td>
      <td>${staffMember.phone || '<span class="text-muted">—</span>'}</td>
      <td>${staffMember.username || staffMember.name.toLowerCase()}</td>
      <td>${staffMember.password || staffMember.pin || '5678'}</td>
      <td>
        <span class="badge badge-info">${orderCount}</span>
      </td>
      <td>
        <div class="btn-group">
          <button class="btn-icon staff-block-btn" data-id="${staffMember.id}" title="${isBlocked ? 'Unblock Worker' : 'Block Worker'}" style="color: ${isBlocked ? 'var(--success)' : 'var(--danger)'}">
            <span class="material-icons-round" style="font-size:18px">${isBlocked ? 'lock_open' : 'lock'}</span>
          </button>
          <button class="btn-icon staff-edit-btn" data-id="${staffMember.id}" title="Edit" ${isBlocked ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
            <span class="material-icons-round" style="font-size:18px">edit</span>
          </button>
          <button class="btn-icon staff-delete-btn" data-id="${staffMember.id}" title="Delete" style="color:var(--danger)">
            <span class="material-icons-round" style="font-size:18px">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

export function render() {
  const staff = Store.getStaff();
  const adminPin = Store.getAdminPin();

  return `
    <!-- Staff Table -->
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
      ${staff.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Username</th>
            <th>Password</th>
            <th>Orders</th>
            <th style="width:140px">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${staff.map(s => renderStaffRow(s)).join('')}
        </tbody>
      </table>
      ` : `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">groups</span>
        </div>
        <h3>No staff members</h3>
        <p>Add delivery staff so they can log in and take orders.</p>
        <button class="btn btn-primary" id="empty-add-staff-btn">
          <span class="material-icons-round">person_add</span>
          Add Staff
        </button>
      </div>
      `}
    </div>

    <!-- Admin PIN Section -->
    <div class="card" style="max-width:420px">
      <div class="flex items-center gap-sm mb-md">
        <span class="material-icons-round" style="color:var(--accent-gold); font-size:24px">admin_panel_settings</span>
        <h3>Admin PIN</h3>
      </div>
      <p class="text-muted mb-md" style="font-size:0.85rem">Change the admin PIN used to log into the management panel.</p>
      <div class="form-group">
        <label class="form-label">Current PIN</label>
        <code style="background:var(--bg-input); padding:6px 14px; border-radius:var(--radius-sm); font-size:1rem; letter-spacing:3px; border:1px solid var(--border); display:inline-block">${adminPin}</code>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">New PIN</label>
          <input type="text" class="form-input" id="new-admin-pin" placeholder="4 digit PIN"
            maxlength="4" pattern="[0-9]{4}" inputmode="numeric" />
        </div>
        <div class="form-group" style="display:flex; align-items:flex-end">
          <button class="btn btn-primary w-full" id="change-admin-pin-btn">
            <span class="material-icons-round">lock</span>
            Change PIN
          </button>
        </div>
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
