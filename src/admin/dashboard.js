// ============================================
// Admin Dashboard Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';

function getFirmId() {
  return window.__currentFirm || 'firm_ka';
}

function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
  const map = {
    pending: { cls: 'badge-warning', label: 'Pending' },
    confirmed: { cls: 'badge-info', label: 'Confirmed' },
    delivered: { cls: 'badge-success', label: 'Delivered' },
    cancelled: { cls: 'badge-danger', label: 'Cancelled' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

export function render() {
  const firmId = getFirmId();
  const stats = Store.getStats(firmId);
  const orders = Store.getOrders({ firmId });
  const recentOrders = orders.slice(0, 10);

  return `
    <!-- Stats Grid -->
    <div class="stats-grid stagger">
      <div class="stat-card gold">
        <div class="stat-card-header">
          <span class="stat-card-label">Today's Orders</span>
          <div class="stat-card-icon">
            <span class="material-icons-round">shopping_cart</span>
          </div>
        </div>
        <div class="stat-card-value">${stats.todayOrders}</div>
        <div class="stat-card-change up">
          <span class="material-icons-round" style="font-size:14px">trending_up</span>
          Today
        </div>
      </div>

      <div class="stat-card blue">
        <div class="stat-card-header">
          <span class="stat-card-label">Pending Orders</span>
          <div class="stat-card-icon">
            <span class="material-icons-round">pending_actions</span>
          </div>
        </div>
        <div class="stat-card-value">${stats.pendingOrders}</div>
        <div class="stat-card-change" style="color: var(--text-muted)">
          <span class="material-icons-round" style="font-size:14px">schedule</span>
          Awaiting action
        </div>
      </div>

      <div class="stat-card teal">
        <div class="stat-card-header">
          <span class="stat-card-label">Total Revenue</span>
          <div class="stat-card-icon">
            <span class="material-icons-round">account_balance_wallet</span>
          </div>
        </div>
        <div class="stat-card-value">${formatCurrency(stats.totalRevenue)}</div>
        <div class="stat-card-change up">
          <span class="material-icons-round" style="font-size:14px">payments</span>
          All time
        </div>
      </div>

      <div class="stat-card rose">
        <div class="stat-card-header">
          <span class="stat-card-label">Total Products</span>
          <div class="stat-card-icon">
            <span class="material-icons-round">inventory_2</span>
          </div>
        </div>
        <div class="stat-card-value">${stats.totalProducts}</div>
        <div class="stat-card-change" style="color: var(--text-muted)">
          <span class="material-icons-round" style="font-size:14px">category</span>
          ${stats.totalCompanies} companies
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-md mb-lg" style="flex-wrap:wrap">
      <button class="btn btn-primary" id="dash-view-orders">
        <span class="material-icons-round">receipt_long</span>
        View All Orders
      </button>
      <button class="btn btn-secondary" id="dash-add-product">
        <span class="material-icons-round">add_circle</span>
        Add Product
      </button>
    </div>

    <!-- Recent Orders Table -->
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">Recent Orders</h3>
        <span class="badge badge-neutral">${recentOrders.length} of ${orders.length}</span>
      </div>
      ${recentOrders.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Shop</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${recentOrders.map(order => {
            const shop = Store.getShopById(order.shopId);
            const itemCount = (order.items || []).length;
            return `
              <tr>
                <td class="table-cell-main">#${order.id.slice(-6).toUpperCase()}</td>
                <td>${shop ? shop.name : '<span class="text-muted">Unknown</span>'}</td>
                <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                <td class="font-bold text-gold">${formatCurrency(order.total)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                  <div>${formatDate(order.createdAt)}</div>
                  <div class="text-muted" style="font-size:0.75rem">${formatTime(order.createdAt)}</div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ` : `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">receipt_long</span>
        </div>
        <h3>No orders yet</h3>
        <p>Orders placed by staff will appear here.</p>
      </div>
      `}
    </div>
  `;
}

export function init() {
  const viewOrdersBtn = document.getElementById('dash-view-orders');
  if (viewOrdersBtn) {
    viewOrdersBtn.addEventListener('click', () => {
      window.location.hash = '#/admin/orders';
    });
  }

  const addProductBtn = document.getElementById('dash-add-product');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      window.location.hash = '#/admin/products';
    });
  }
}
