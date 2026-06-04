// ============================================
// Sidebar Component
// ============================================

import { Store } from '../data/store.js';

const adminMenuItems = [
  { section: 'Main', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', hash: '#/admin/dashboard' },
  ]},
  { section: 'Management', items: [
    { id: 'companies', label: 'Companies', icon: 'business', hash: '#/admin/companies' },
    { id: 'products', label: 'Products', icon: 'inventory_2', hash: '#/admin/products' },
    { id: 'orders', label: 'Orders', icon: 'receipt_long', hash: '#/admin/orders' },
    { id: 'ledger', label: 'Retailer Ledger', icon: 'menu_book', hash: '#/admin/ledger' },
  ]},
  { section: 'Operations', items: [
    { id: 'routes', label: 'Route Designer', icon: 'route', hash: '#/admin/routes' },
    { id: 'staff', label: 'Staff', icon: 'group', hash: '#/admin/staff' },
    { id: 'tracking', label: 'Live Tracking', icon: 'satellite_alt', hash: '#/admin/tracking' },
  ]},
];

const staffMenuItems = [
  { section: 'Main', items: [
    { id: 'shops', label: 'My Shops', icon: 'store', hash: '#/staff/shops' },
    { id: 'new-order', label: 'New Order', icon: 'add_shopping_cart', hash: '#/staff/new-order' },
    { id: 'history', label: 'Order History', icon: 'history', hash: '#/staff/history' },
    { id: 'deliveries', label: 'Deliveries', icon: 'local_shipping', hash: '#/staff/deliveries' },
  ]},
];

export function renderSidebar(role) {
  const session = Store.getSession();
  const user = session?.user || { name: 'User' };
  const menuItems = role === 'admin' ? adminMenuItems : staffMenuItems;
  const currentHash = window.location.hash || (role === 'admin' ? '#/admin/dashboard' : '#/staff/shops');
  const currentFirm = window.__currentFirm || 'firm_ka';
  const firms = Store.getFirms();
  const activeFirm = Store.getFirmById(currentFirm);

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-logo">
          <div class="sidebar-brand-icon ${currentFirm === 'firm_km' ? 'km' : 'ka'}">
            ${currentFirm === 'firm_km' ? 'KM' : 'KA'}
          </div>
          <div>
            <div class="sidebar-brand-name">${activeFirm?.name || 'Kaka Agencies'}</div>
            <div class="sidebar-brand-sub">FMCG Distribution</div>
          </div>
        </div>
        <div style="margin-top: 14px;">
          <div class="firm-switcher" id="firm-switcher">
            ${firms.map(f => `
              <button class="firm-switcher-btn ${f.id === currentFirm ? 'active' : ''}" data-firm="${f.id}">
                ${f.shortName}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      ${menuItems.map(section => `
        <div class="sidebar-section">
          <div class="sidebar-section-title">${section.section}</div>
          <ul class="sidebar-nav">
            ${section.items.map(item => `
              <li class="sidebar-nav-item ${currentHash === item.hash ? 'active' : ''}" data-hash="${item.hash}">
                <span class="material-icons-round">${item.icon}</span>
                ${item.label}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">${role}</div>
          </div>
          <button class="sidebar-logout" id="sidebar-logout" title="Logout">
            <span class="material-icons-round">logout</span>
          </button>
        </div>
      </div>
    </aside>
  `;
}

export function initSidebar() {
  // Navigation clicks
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const hash = item.dataset.hash;
      if (hash) window.location.hash = hash;
    });
  });

  // Firm switcher
  document.querySelectorAll('#firm-switcher .firm-switcher-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const firmId = btn.dataset.firm;
      window.__currentFirm = firmId;
      // Re-render the entire app
      window.dispatchEvent(new CustomEvent('firm-change', { detail: firmId }));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });

  // Logout
  const logoutBtn = document.getElementById('sidebar-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Store.clearSession();
      window.location.hash = '#/login';
    });
  }

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('mobile-overlay').classList.toggle('active');
    });
  }

  const mobileOverlay = document.getElementById('mobile-overlay');
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      mobileOverlay.classList.remove('active');
    });
  }
}
