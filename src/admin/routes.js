// ============================================
// Admin Routes Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

let expandedRouteId = null;

function getFirmId() {
  return window.__currentFirm || 'firm_ka';
}

function renderRouteCard(route) {
  const staff = Store.getStaffById(route.assignedStaffId);
  const shopIds = route.shopIds || [];
  const shops = shopIds.map(id => Store.getShopById(id)).filter(Boolean);
  const isExpanded = expandedRouteId === route.id;

  return `
    <div class="route-card mb-md" data-route-id="${route.id}">
      <div class="route-card-header" style="cursor:pointer" data-toggle-route="${route.id}">
        <div>
          <div class="route-card-name">
            <span class="material-icons-round" style="vertical-align:middle; margin-right:6px; font-size:20px; color:var(--accent-gold)">alt_route</span>
            ${route.name}
          </div>
          <div class="route-card-meta" style="margin-top:4px">
            <span class="material-icons-round" style="font-size:14px; vertical-align:middle">person</span>
            ${staff ? staff.name : '<em>Unassigned</em>'}
            &nbsp;·&nbsp;
            <span class="material-icons-round" style="font-size:14px; vertical-align:middle">store</span>
            ${shops.length} shop${shops.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div class="btn-group">
          <button class="btn-icon route-edit-btn" data-id="${route.id}" title="Edit Route">
            <span class="material-icons-round" style="font-size:18px">edit</span>
          </button>
          <button class="btn-icon route-delete-btn" data-id="${route.id}" title="Delete Route" style="color:var(--danger)">
            <span class="material-icons-round" style="font-size:18px">delete</span>
          </button>
          <button class="btn-icon" data-toggle-route="${route.id}" title="${isExpanded ? 'Collapse' : 'Expand'}">
            <span class="material-icons-round" style="font-size:20px">${isExpanded ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>
      </div>

      ${isExpanded ? `
      <div class="route-shops-list">
        ${shops.length > 0 ? shops.map((shop, i) => `
          <div class="route-shop-item" data-shop-id="${shop.id}" data-route-id="${route.id}">
            <div class="route-shop-number">${i + 1}</div>
            <div style="flex:1; min-width:0">
              <div class="route-shop-name">${shop.name}</div>
              <div class="route-shop-address">${shop.ownerName || ''} · ${shop.address || ''}</div>
            </div>
            <div class="btn-group">
              <button class="btn-icon shop-move-up" data-route-id="${route.id}" data-idx="${i}" title="Move up" ${i === 0 ? 'disabled style="opacity:0.3"' : ''}>
                <span class="material-icons-round" style="font-size:16px">arrow_upward</span>
              </button>
              <button class="btn-icon shop-move-down" data-route-id="${route.id}" data-idx="${i}" title="Move down" ${i === shops.length - 1 ? 'disabled style="opacity:0.3"' : ''}>
                <span class="material-icons-round" style="font-size:16px">arrow_downward</span>
              </button>
              <button class="btn-icon shop-remove-btn" data-route-id="${route.id}" data-shop-id="${shop.id}" title="Remove shop" style="color:var(--danger)">
                <span class="material-icons-round" style="font-size:16px">close</span>
              </button>
            </div>
          </div>
        `).join('') : `
          <div style="padding:20px; text-align:center; color:var(--text-dim); font-size:0.88rem">
            No shops assigned to this route yet.
          </div>
        `}
      </div>
      <div style="padding:12px 20px; border-top:1px solid var(--border)">
        <button class="btn btn-sm btn-secondary route-add-shops-btn" data-route-id="${route.id}">
          <span class="material-icons-round" style="font-size:16px">add_business</span>
          Add Shops
        </button>
      </div>
      ` : ''}
    </div>
  `;
}

function getRouteFormHtml(route = null) {
  const staff = Store.getStaff();

  return `
    <div class="form-group">
      <label class="form-label">Route Name</label>
      <input type="text" class="form-input" id="route-name" placeholder="e.g. Main Market Route"
        value="${route ? route.name : ''}" required />
    </div>
    <div class="form-group">
      <label class="form-label">Assigned Staff</label>
      <select class="form-select" id="route-staff">
        <option value="">None (Unassigned)</option>
        ${staff.map(s => `
          <option value="${s.id}" ${route && route.assignedStaffId === s.id ? 'selected' : ''}>
            ${s.name} (${s.phone || '—'})
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function showAddShopsModal(routeId) {
  const route = Store.getRouteById(routeId);
  if (!route) return;

  const currentShopIds = new Set(route.shopIds || []);
  const allShops = Store.getShops({});
  // Show all shops not already in this route
  const availableShops = allShops.filter(s => !currentShopIds.has(s.id));

  if (availableShops.length === 0) {
    Toast.info('All shops are already in this route or no shops exist.');
    return;
  }

  const content = `
    <p class="text-muted mb-md" style="font-size:0.85rem">Select shops to add to "${route.name}":</p>
    <div style="max-height:350px; overflow-y:auto;">
      ${availableShops.map(shop => `
        <label style="display:flex; align-items:center; gap:12px; padding:10px 8px; border-bottom:1px solid var(--border); cursor:pointer" class="shop-checkbox-row">
          <input type="checkbox" value="${shop.id}" class="add-shop-cb" style="width:18px; height:18px; accent-color:var(--accent-gold)" />
          <div style="flex:1; min-width:0">
            <div style="font-weight:500; font-size:0.9rem">${shop.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">${shop.ownerName || ''} · ${shop.address || ''}</div>
          </div>
        </label>
      `).join('')}
    </div>
  `;

  Modal.show({
    title: 'Add Shops to Route',
    content,
    confirmText: 'Add Selected',
    size: 'lg',
    onConfirm: () => {
      const selectedIds = [];
      document.querySelectorAll('.add-shop-cb:checked').forEach(cb => {
        selectedIds.push(cb.value);
      });
      if (selectedIds.length === 0) {
        Toast.warning('No shops selected');
        return;
      }
      const updatedShopIds = [...(route.shopIds || []), ...selectedIds];
      Store.updateRoute(routeId, { shopIds: updatedShopIds });
      Toast.success(`${selectedIds.length} shop${selectedIds.length !== 1 ? 's' : ''} added`);
      Modal.hide();
      reRender();
    }
  });
}

export function render() {
  const firmId = getFirmId();
  const routes = Store.getRoutes(firmId);

  return `
    <div class="flex justify-between items-center mb-lg" style="flex-wrap:wrap; gap:12px">
      <h3 style="display:flex; align-items:center; gap:8px">
        <span class="material-icons-round" style="color:var(--accent-gold)">map</span>
        Routes (${routes.length})
      </h3>
      <button class="btn btn-primary" id="create-route-btn">
        <span class="material-icons-round">add</span>
        Create Route
      </button>
    </div>

    ${routes.length > 0 ? `
      <div class="stagger">
        ${routes.map(r => renderRouteCard(r)).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">map</span>
        </div>
        <h3>No routes yet</h3>
        <p>Create delivery routes and assign shops to them.</p>
        <button class="btn btn-primary" id="empty-create-route-btn">
          <span class="material-icons-round">add</span>
          Create Route
        </button>
      </div>
    `}
  `;
}

function showRouteModal(route = null) {
  const isEdit = !!route;
  Modal.show({
    title: isEdit ? 'Edit Route' : 'Create Route',
    content: getRouteFormHtml(route),
    confirmText: isEdit ? 'Update' : 'Create Route',
    onConfirm: () => {
      const name = document.getElementById('route-name').value.trim();
      const assignedStaffId = document.getElementById('route-staff').value || null;

      if (!name) {
        Toast.error('Route name is required');
        return;
      }

      if (isEdit) {
        Store.updateRoute(route.id, { name, assignedStaffId });
        Toast.success(`Route "${name}" updated`);
      } else {
        Store.addRoute({ name, firmId: getFirmId(), shopIds: [], assignedStaffId });
        Toast.success(`Route "${name}" created`);
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
  // Create route
  const createBtn = document.getElementById('create-route-btn');
  if (createBtn) createBtn.addEventListener('click', () => showRouteModal());

  const emptyCreateBtn = document.getElementById('empty-create-route-btn');
  if (emptyCreateBtn) emptyCreateBtn.addEventListener('click', () => showRouteModal());

  // Toggle expand/collapse
  document.querySelectorAll('[data-toggle-route]').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't toggle if clicking on action buttons inside the header
      if (e.target.closest('.route-edit-btn') || e.target.closest('.route-delete-btn')) return;
      const routeId = el.dataset.toggleRoute;
      expandedRouteId = expandedRouteId === routeId ? null : routeId;
      reRender();
    });
  });

  // Edit route
  document.querySelectorAll('.route-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const route = Store.getRouteById(btn.dataset.id);
      if (route) showRouteModal(route);
    });
  });

  // Delete route
  document.querySelectorAll('.route-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const route = Store.getRouteById(btn.dataset.id);
      if (!route) return;
      const confirmed = await Modal.confirm(`Delete route "${route.name}"? Shops will be unassigned.`);
      if (confirmed) {
        Store.deleteRoute(route.id);
        if (expandedRouteId === route.id) expandedRouteId = null;
        Toast.success(`Route "${route.name}" deleted`);
        reRender();
      }
    });
  });

  // Move shop up
  document.querySelectorAll('.shop-move-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const routeId = btn.dataset.routeId;
      const idx = parseInt(btn.dataset.idx);
      const route = Store.getRouteById(routeId);
      if (!route || idx <= 0) return;
      const ids = [...route.shopIds];
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      Store.updateRoute(routeId, { shopIds: ids });
      reRender();
    });
  });

  // Move shop down
  document.querySelectorAll('.shop-move-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const routeId = btn.dataset.routeId;
      const idx = parseInt(btn.dataset.idx);
      const route = Store.getRouteById(routeId);
      if (!route || idx >= route.shopIds.length - 1) return;
      const ids = [...route.shopIds];
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      Store.updateRoute(routeId, { shopIds: ids });
      reRender();
    });
  });

  // Remove shop from route
  document.querySelectorAll('.shop-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const routeId = btn.dataset.routeId;
      const shopId = btn.dataset.shopId;
      const route = Store.getRouteById(routeId);
      if (!route) return;
      const updatedIds = (route.shopIds || []).filter(id => id !== shopId);
      Store.updateRoute(routeId, { shopIds: updatedIds });
      const shop = Store.getShopById(shopId);
      Toast.success(`${shop ? shop.name : 'Shop'} removed from route`);
      reRender();
    });
  });

  // Add shops to route
  document.querySelectorAll('.route-add-shops-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showAddShopsModal(btn.dataset.routeId);
    });
  });
}
