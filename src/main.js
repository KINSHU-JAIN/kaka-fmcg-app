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
  '/admin/tracking': () => import('./admin/tracking.js'),
  '/admin/ledger': () => import('./admin/ledger.js'),
  '/admin/shops': () => import('./admin/shops.js'),
  '/admin/performance': () => import('./admin/performance.js'),
  '/admin/reports': () => import('./admin/reports.js'),
  '/admin/beat-plan': () => import('./admin/beat-plan.js'),
  // Staff
  '/staff/shops': () => import('./staff/shops.js'),
  '/staff/new-order': () => import('./staff/order.js'),
  '/staff/history': () => import('./staff/history.js'),
  '/staff/deliveries': () => import('./staff/deliveries.js'),
  '/staff/credit-recovery': () => import('./staff/credit-recovery.js'),
  '/staff/beat-plan': () => import('./staff/beat-plan.js'),
  '/staff/returns': () => import('./staff/returns.js'),
};

// Page titles
const pageTitles = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'Overview of your business', icon: 'dashboard' },
  '/admin/companies': { title: 'Companies', subtitle: 'Manage your brand partners', icon: 'business' },
  '/admin/products': { title: 'Products', subtitle: 'Manage products & prices', icon: 'inventory_2' },
  '/admin/orders': { title: 'Orders', subtitle: 'Track and manage orders', icon: 'receipt_long' },
  '/admin/routes': { title: 'Route Designer', subtitle: 'Design delivery routes', icon: 'route' },
  '/admin/staff': { title: 'Staff Management', subtitle: 'Manage your team', icon: 'group' },
  '/admin/tracking': { title: 'Staff Tracking', subtitle: 'Live geolocation of delivery personnel', icon: 'satellite_alt' },
  '/admin/ledger': { title: 'Retailer Ledger', subtitle: 'Khata Book accounts & partial payments', icon: 'menu_book' },
  '/admin/shops': { title: 'Shops', subtitle: 'Manage all registered shops', icon: 'store' },
  '/admin/performance': { title: 'Performance', subtitle: 'Salesman performance & monthly targets', icon: 'trending_up' },
  '/admin/reports': { title: 'Reports', subtitle: 'Sales reports, top products & aging analysis', icon: 'bar_chart' },
  '/admin/beat-plan': { title: 'Beat Plan', subtitle: 'Schedule daily shop visits per salesman', icon: 'calendar_month' },
  '/staff/shops': { title: 'My Shops', subtitle: 'View and manage shops', icon: 'store' },
  '/staff/new-order': { title: 'New Order', subtitle: 'Take a new order', icon: 'add_shopping_cart' },
  '/staff/history': { title: 'Order History', subtitle: 'View past orders', icon: 'history' },
  '/staff/deliveries': { title: 'My Deliveries', subtitle: 'Manage assigned delivery routes', icon: 'local_shipping' },
  '/staff/credit-recovery': { title: 'Credit Recovery', subtitle: 'Collect payments & settle credit bills route-wise', icon: 'payments' },
  '/staff/beat-plan': { title: "Today's Beat", subtitle: 'Your shop visit schedule for today', icon: 'today' },
  '/staff/returns': { title: 'Sales Returns', subtitle: 'Raise and track return requests', icon: 'assignment_return' },
};

const app = document.getElementById('app');

async function navigate() {
  document.body.setAttribute('data-firm', window.__currentFirm || 'firm_ka');
  const hash = window.location.hash.split('?')[0] || '';
  const path = hash.replace('#', '') || '/login';
  const session = Store.getSession();

  // Auth guard
  if (path !== '/login' && path !== '/invoice') {
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

  // Public invoice viewer (no login required)
  if (path === '/invoice') {
    try {
      const mod = await import('./components/invoice-viewer.js');
      app.innerHTML = mod.render();
      if (mod.init) mod.init();
      return;
    } catch (err) {
      console.error('Invoice viewer load error:', err);
      app.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;font-family:sans-serif;">
          <h2 style="color:var(--text-secondary);">Invoice Error</h2>
          <p style="color:var(--text-muted);">${err.message}</p>
        </div>
      `;
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
