// ============================================
// Admin — Shops Management
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

function getFirmId() { return window.__currentFirm || 'firm_ka'; }

function getRouteName(shopId) {
  const routes = Store.getRoutes();
  const route = routes.find(r => (r.shopIds || []).includes(shopId));
  return route ? route.name : null;
}

function getRouteIdForShop(shopId) {
  const routes = Store.getRoutes();
  const route = routes.find(r => (r.shopIds || []).includes(shopId));
  return route ? route.id : null;
}

function shopFormContent(shop = null) {
  const routes = Store.getRoutes(getFirmId());
  const shopRouteId = shop ? (shop.routeId || getRouteIdForShop(shop.id)) : '';

  return `
    <div class="form-group">
      <label class="form-label">Shop Name</label>
      <input type="text" class="form-input" id="shop-name" placeholder="e.g. Sharma General Store" value="${shop ? shop.name : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Owner Name</label>
        <input type="text" class="form-input" id="shop-owner" placeholder="e.g. Ramesh Sharma" value="${shop ? shop.ownerName : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-input" id="shop-phone" placeholder="+91 98765 43210" value="${shop ? shop.phone : ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Address</label>
      <textarea class="form-input form-textarea" id="shop-address" placeholder="Full address" style="min-height:60px;">${shop ? shop.address : ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Assigned Route</label>
      <select class="form-select" id="shop-route-id" style="width:100%; padding:10px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-input); color:var(--text-primary);">
        <option value="">-- No Route (Unassigned) --</option>
        ${routes.map(r => `
          <option value="${r.id}" ${r.id === shopRouteId ? 'selected' : ''}>${r.name}</option>
        `).join('')}
      </select>
    </div>`;
}

function validateShopForm() {
  const name = document.getElementById('shop-name').value.trim();
  const owner = document.getElementById('shop-owner').value.trim();
  const phone = document.getElementById('shop-phone').value.trim();
  const address = document.getElementById('shop-address').value.trim();
  const routeId = document.getElementById('shop-route-id').value || null;

  if (!name) { Toast.error('Shop name is required'); return null; }
  if (!owner) { Toast.error('Owner name is required'); return null; }
  if (!phone) { Toast.error('Phone number is required'); return null; }
  if (!address) { Toast.error('Address is required'); return null; }

  return { name, ownerName: owner, phone, address, routeId };
}

let searchQuery = '';

export function render() {
  const allShops = Store.getShops({ search: searchQuery || undefined });
  const routes = Store.getRoutes(getFirmId());

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
      <div class="search-bar" style="max-width:400px; flex:1;">
        <span class="material-icons-round">search</span>
        <input type="text" id="admin-shop-search" placeholder="Search by name, owner or phone..." value="${searchQuery}" />
      </div>
      <button class="btn btn-primary" id="admin-add-shop-btn">
        <span class="material-icons-round">add</span> Add Shop
      </button>
    </div>

    <div class="table-container">
      <div class="table-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h3 class="table-title" style="margin:0;">
          <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; font-size:20px;">store</span>
          All Shops (${allShops.length})
        </h3>
      </div>

      ${allShops.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon"><span class="material-icons-round">storefront</span></div>
          <h3>${searchQuery ? 'No shops found' : 'No shops yet'}</h3>
          <p>${searchQuery ? 'Try a different search term.' : 'Add your first shop to get started.'}</p>
          ${!searchQuery ? `<button class="btn btn-primary" id="admin-empty-add-shop-btn"><span class="material-icons-round">add</span> Add Shop</button>` : ''}
        </div>` : `
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Owner</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Route</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allShops.map(shop => {
              const routeName = getRouteName(shop.id);
              return `
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">${shop.name}</td>
                  <td style="color:var(--text-secondary);">${shop.ownerName}</td>
                  <td>
                    <a href="tel:${shop.phone}" style="color:var(--accent-gold); text-decoration:none; display:flex; align-items:center; gap:4px;">
                      <span class="material-icons-round" style="font-size:14px;">call</span>${shop.phone}
                    </a>
                  </td>
                  <td style="color:var(--text-muted); font-size:0.85rem; max-width:200px;">${shop.address || '—'}</td>
                  <td>
                    ${routeName
                      ? `<span class="badge badge-info">${routeName}</span>`
                      : `<span style="color:var(--text-dim); font-size:0.8rem;">Unassigned</span>`}
                  </td>
                  <td>
                    <div class="btn-group" style="justify-content:center;">
                      <button class="btn btn-secondary btn-sm admin-shop-edit-btn" data-shop-id="${shop.id}" title="Edit">
                        <span class="material-icons-round" style="font-size:16px;">edit</span>
                      </button>
                      <button class="btn btn-danger btn-sm admin-shop-delete-btn" data-shop-id="${shop.id}" data-shop-name="${shop.name}" title="Delete">
                        <span class="material-icons-round" style="font-size:16px;">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;
}

export function init() {
  // Search
  const searchInput = document.getElementById('admin-shop-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  }

  // Add shop button
  const addBtn = document.getElementById('admin-add-shop-btn');
  if (addBtn) addBtn.addEventListener('click', openAddModal);
  const emptyAddBtn = document.getElementById('admin-empty-add-shop-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

  // Edit buttons
  document.querySelectorAll('.admin-shop-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.shopId));
  });

  // Delete buttons
  document.querySelectorAll('.admin-shop-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const shopId = btn.dataset.shopId;
      const shopName = btn.dataset.shopName;
      const confirmed = await Modal.confirm(`Delete "${shopName}"? This cannot be undone.`);
      if (!confirmed) return;
      Store.deleteShop(shopId);
      Toast.success(`"${shopName}" deleted`);
      document.getElementById('page-body').innerHTML = render();
      init();
    });
  });

  // Reactivity
  Store.on('shops:change', () => {
    document.getElementById('page-body').innerHTML = render();
    init();
  });
}

function openAddModal() {
  Modal.show({
    title: 'Add New Shop',
    content: shopFormContent(),
    confirmText: 'Add Shop',
    onConfirm: () => {
      const data = validateShopForm();
      if (!data) return;

      const newShop = Store.addShop(data);
      if (data.routeId) {
        const route = Store.getRouteById(data.routeId);
        if (route) {
          Store.updateRoute(route.id, { shopIds: [...(route.shopIds || []), newShop.id] });
        }
      }

      Modal.hide();
      Toast.success(`"${data.name}" added successfully`);
      document.getElementById('page-body').innerHTML = render();
      init();
    }
  });
}

function openEditModal(shopId) {
  const shop = Store.getShopById(shopId);
  if (!shop) return;

  Modal.show({
    title: 'Edit Shop',
    content: shopFormContent(shop),
    confirmText: 'Save Changes',
    onConfirm: () => {
      const data = validateShopForm();
      if (!data) return;

      const oldRouteId = shop.routeId || getRouteIdForShop(shopId);
      Store.updateShop(shopId, data);

      if (data.routeId !== oldRouteId) {
        // Remove from old route
        if (oldRouteId) {
          const oldRoute = Store.getRouteById(oldRouteId);
          if (oldRoute) {
            Store.updateRoute(oldRoute.id, { shopIds: (oldRoute.shopIds || []).filter(id => id !== shopId) });
          }
        }
        // Add to new route
        if (data.routeId) {
          const newRoute = Store.getRouteById(data.routeId);
          if (newRoute) {
            Store.updateRoute(newRoute.id, { shopIds: [...(newRoute.shopIds || []), shopId] });
          }
        }
      }

      Modal.hide();
      Toast.success(`"${data.name}" updated`);
      document.getElementById('page-body').innerHTML = render();
      init();
    }
  });
}
