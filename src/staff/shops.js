// ============================================
// Staff Panel — Shop Management
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

// ---------- Helpers ----------

function getRouteName(shopId) {
  const routes = Store.getRoutes();
  const route = routes.find(r => (r.shopIds || []).includes(shopId));
  return route ? route.name : null;
}

function shopCard(shop) {
  const routeName = getRouteName(shop.id);
  return `
    <div class="card shop-card" data-shop-id="${shop.id}" style="display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:1rem; color:var(--text-primary); margin-bottom:2px;" class="truncate">${shop.name}</div>
          <div style="font-size:0.82rem; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
            <span class="material-icons-round" style="font-size:14px;">person</span>
            ${shop.ownerName}
          </div>
        </div>
        ${routeName ? `<span class="badge badge-info" style="flex-shrink:0;">${routeName}</span>` : ''}
      </div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        <a href="tel:${shop.phone}" style="font-size:0.85rem; color:var(--accent-gold); display:flex; align-items:center; gap:6px; text-decoration:none;" onclick="event.stopPropagation()">
          <span class="material-icons-round" style="font-size:16px;">call</span>
          ${shop.phone}
        </a>
        <div style="font-size:0.82rem; color:var(--text-secondary); display:flex; align-items:center; gap:6px;">
          <span class="material-icons-round" style="font-size:16px; color:var(--text-dim);">location_on</span>
          ${shop.address}
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-top:4px;">
        <button class="btn btn-primary btn-sm shop-take-order-btn" data-shop-id="${shop.id}" style="flex:1;">
          <span class="material-icons-round" style="font-size:16px;">add_shopping_cart</span>
          Take Order
        </button>
        <button class="btn btn-secondary btn-sm shop-edit-btn" data-shop-id="${shop.id}">
          <span class="material-icons-round" style="font-size:16px;">edit</span>
        </button>
        <button class="btn btn-danger btn-sm shop-delete-btn" data-shop-id="${shop.id}">
          <span class="material-icons-round" style="font-size:16px;">delete</span>
        </button>
      </div>
    </div>`;
}

function shopFormContent(shop = null) {
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
    </div>`;
}

function validateShopForm() {
  const name = document.getElementById('shop-name').value.trim();
  const owner = document.getElementById('shop-owner').value.trim();
  const phone = document.getElementById('shop-phone').value.trim();
  const address = document.getElementById('shop-address').value.trim();

  if (!name) { Toast.error('Shop name is required'); return null; }
  if (!owner) { Toast.error('Owner name is required'); return null; }
  if (!phone) { Toast.error('Phone number is required'); return null; }
  if (!address) { Toast.error('Address is required'); return null; }

  return { name, ownerName: owner, phone, address };
}

// ---------- Render ----------

export function render() {
  const shops = Store.getShops();
  const shopCount = shops.length;

  return `
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1 class="page-title">Shops</h1>
          <p class="page-subtitle">${shopCount} shop${shopCount !== 1 ? 's' : ''} registered</p>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="add-shop-btn">
            <span class="material-icons-round">add</span>
            Add Shop
          </button>
        </div>
      </div>
    </div>

    <div class="page-body">
      <!-- Search -->
      <div style="margin-bottom:20px;">
        <div class="search-bar" style="max-width:420px;">
          <span class="material-icons-round">search</span>
          <input type="text" id="shop-search" placeholder="Search shops by name or owner..." />
        </div>
      </div>

      <!-- Shop Grid -->
      <div id="shops-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
        ${shops.length > 0
          ? shops.map(s => shopCard(s)).join('')
          : `<div class="empty-state" style="grid-column:1/-1;">
              <div class="empty-state-icon">
                <span class="material-icons-round">storefront</span>
              </div>
              <h3>No shops yet</h3>
              <p>Add your first shop to start taking orders.</p>
              <button class="btn btn-primary" id="empty-add-shop-btn">
                <span class="material-icons-round">add</span>
                Add Shop
              </button>
            </div>`
        }
      </div>
    </div>`;
}

// ---------- Init ----------

export function init() {
  // Search
  const searchInput = document.getElementById('shop-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      const shops = Store.getShops({ search: query || undefined });
      const grid = document.getElementById('shops-grid');
      if (!grid) return;

      if (shops.length > 0) {
        grid.innerHTML = shops.map(s => shopCard(s)).join('');
      } else {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-state-icon">
              <span class="material-icons-round">search_off</span>
            </div>
            <h3>No shops found</h3>
            <p>Try a different search term.</p>
          </div>`;
      }
      // Re-bind card buttons after re-render
      bindShopButtons();
    });
  }

  // Add shop button(s)
  const addBtn = document.getElementById('add-shop-btn');
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  const emptyAddBtn = document.getElementById('empty-add-shop-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

  // Bind card-level buttons
  bindShopButtons();
}

function bindShopButtons() {
  // Take Order
  document.querySelectorAll('.shop-take-order-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shopId = btn.dataset.shopId;
      window.location.hash = '#/staff/new-order?shop=' + shopId;
    });
  });

  // Edit
  document.querySelectorAll('.shop-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shopId = btn.dataset.shopId;
      openEditModal(shopId);
    });
  });

  // Delete
  document.querySelectorAll('.shop-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const shopId = btn.dataset.shopId;
      const shop = Store.getShopById(shopId);
      if (!shop) return;

      const confirmed = await Modal.confirm(`Delete "${shop.name}"? This action cannot be undone.`);
      if (confirmed) {
        Store.deleteShop(shopId);
        Toast.success(`"${shop.name}" deleted`);
        // Re-render the page
        const appRoot = document.getElementById('main-content') || document.querySelector('.main-content');
        if (appRoot) {
          appRoot.innerHTML = render();
          init();
        }
      }
    });
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

      Store.addShop(data);
      Modal.hide();
      Toast.success(`"${data.name}" added successfully`);

      // Re-render
      const appRoot = document.getElementById('main-content') || document.querySelector('.main-content');
      if (appRoot) {
        appRoot.innerHTML = render();
        init();
      }
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

      Store.updateShop(shopId, data);
      Modal.hide();
      Toast.success(`"${data.name}" updated`);

      // Re-render
      const appRoot = document.getElementById('main-content') || document.querySelector('.main-content');
      if (appRoot) {
        appRoot.innerHTML = render();
        init();
      }
    }
  });
}
