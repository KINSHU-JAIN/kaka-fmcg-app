// ============================================
// KAKA FMCG — Main App Entry & Router
// ============================================

import { Store } from './data/store.js';
import { getSeedData } from './data/seed.js';
import { renderSidebar, initSidebar } from './components/sidebar.js';
import * as Login from './auth/login.js';

// Store will be initialized asynchronously in the boot sequence at the bottom of this file

// Set default firm
window.__currentFirm = window.__currentFirm || 'firm_ka';

// Lazy-load modules
const modules = {
  // Admin
  '/admin/dashboard': () => import('./admin/dashboard.js'),
  '/admin/companies': () => import('./admin/companies.js'),
  '/admin/products': () => import('./admin/products.js'),
  '/admin/orders': () => import('./admin/orders.js'),
  '/admin/routes': () => import('./admin/routes.js'),
  '/admin/staff': () => import('./admin/staff.js'),
  // Staff
  '/staff/shops': () => import('./staff/shops.js'),
  '/staff/new-order': () => import('./staff/order.js'),
  '/staff/history': () => import('./staff/history.js'),
};

// Page titles
const pageTitles = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'Overview of your business', icon: 'dashboard' },
  '/admin/companies': { title: 'Companies', subtitle: 'Manage your brand partners', icon: 'business' },
  '/admin/products': { title: 'Products', subtitle: 'Manage products & prices', icon: 'inventory_2' },
  '/admin/orders': { title: 'Orders', subtitle: 'Track and manage orders', icon: 'receipt_long' },
  '/admin/routes': { title: 'Route Designer', subtitle: 'Design delivery routes', icon: 'route' },
  '/admin/staff': { title: 'Staff Management', subtitle: 'Manage your team', icon: 'group' },
  '/staff/shops': { title: 'My Shops', subtitle: 'View and manage shops', icon: 'store' },
  '/staff/new-order': { title: 'New Order', subtitle: 'Take a new order', icon: 'add_shopping_cart' },
  '/staff/history': { title: 'Order History', subtitle: 'View past orders', icon: 'history' },
};

const app = document.getElementById('app');

async function navigate() {
  document.body.setAttribute('data-firm', window.__currentFirm || 'firm_ka');
  const hash = window.location.hash.split('?')[0] || '';
  const path = hash.replace('#', '') || '/login';
  const session = Store.getSession();

  // Auth guard
  if (path !== '/login') {
    if (!session) {
      window.location.hash = '#/login';
      return;
    }
    // Role guard
    if (path.startsWith('/admin') && session.role !== 'admin') {
      window.location.hash = '#/staff/shops';
      return;
    }
  }

  // Login page
  if (path === '/login' || !hash) {
    if (session) {
      window.location.hash = session.role === 'admin' ? '#/admin/dashboard' : '#/staff/shops';
      return;
    }
    app.innerHTML = Login.render();
    Login.init();
    return;
  }

  // Get module
  const moduleLoader = modules[path];
  if (!moduleLoader) {
    app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;">
        <span class="material-icons-round" style="font-size:64px;color:var(--text-dim);margin-bottom:16px;">error_outline</span>
        <h2 style="color:var(--text-secondary);">Page Not Found</h2>
        <p style="color:var(--text-dim);margin-top:8px;">${path} does not exist</p>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="window.location.hash='#/${session.role === 'admin' ? 'admin/dashboard' : 'staff/shops'}'">
          Go Home
        </button>
      </div>
    `;
    return;
  }

  // Render layout
  const role = session.role;
  const pageInfo = pageTitles[path] || { title: 'Page', subtitle: '', icon: 'article' };
  const firmId = window.__currentFirm;

  try {
    const mod = await moduleLoader();

    app.innerHTML = `
      ${renderSidebar(role)}
      <div class="mobile-overlay" id="mobile-overlay"></div>
      <main class="main-content">
        <div class="page-header">
          <div class="page-header-top">
            <div style="display:flex;align-items:center;gap:12px;">
              <button class="mobile-menu-btn" id="mobile-menu-btn">
                <span class="material-icons-round">menu</span>
              </button>
              <div>
                <h1 class="page-title">${pageInfo.title}</h1>
                <p class="page-subtitle">${pageInfo.subtitle}</p>
              </div>
            </div>
            <div class="firm-switcher" id="header-firm-switcher">
              ${Store.getFirms().map(f => `
                <button class="firm-switcher-btn ${f.id === firmId ? 'active' : ''}" data-firm="${f.id}">
                  ${f.shortName}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="page-body" id="page-body">
          ${mod.render()}
        </div>
      </main>
    `;

    // Init sidebar
    initSidebar();

    // Init header firm switcher
    document.querySelectorAll('#header-firm-switcher .firm-switcher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.__currentFirm = btn.dataset.firm;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
    });

    // Init module
    if (mod.init) mod.init();

  } catch (err) {
    console.error('Module load error:', err);
    document.getElementById('page-body').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">error_outline</span>
        </div>
        <h3>Failed to load page</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

// Boot application asynchronously
async function boot() {
  await Store.initSupabase(getSeedData());

  // Listen for hash changes
  window.addEventListener('hashchange', navigate);

  // Initial navigation
  navigate();
}

boot();
