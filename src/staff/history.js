// ============================================
// Staff Panel — Order History
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { printInvoice, getWhatsAppShareUrl } from '../components/invoice.js';

// ---------- State ----------
let activeFilter = 'all'; // 'all', 'pending', 'confirmed', 'delivered'

// ---------- Helpers ----------

function firmId() {
  return window.__currentFirm || 'firm_ka';
}

function staffId() {
  const session = Store.getSession();
  return session ? session.user.id : null;
}

function statusBadge(status) {
  const map = {
    pending:   { cls: 'badge-warning', label: 'Pending Approval', icon: 'schedule' },
    confirmed: { cls: 'badge-info',    label: 'Ready for Delivery', icon: 'local_shipping' },
    delivered: { cls: 'badge-success', label: 'Delivered', icon: 'check_circle' },
    cancelled: { cls: 'badge-danger',  label: 'Cancelled', icon: 'cancel' }
  };
  const s = map[status] || { cls: 'badge-neutral', label: status, icon: 'help' };
  return `<span class="badge ${s.cls}">
    <span class="material-icons-round" style="font-size:12px;">${s.icon}</span>
    ${s.label}
  </span>`;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function formatDateTime(isoStr) {
  return `${formatDate(isoStr)} · ${formatTime(isoStr)}`;
}

function getFilteredOrders() {
  const filters = {
    firmId: firmId(),
    staffId: staffId()
  };
  if (activeFilter !== 'all') {
    filters.status = activeFilter;
  }
  return Store.getOrders(filters);
}

// ---------- Sub-renders ----------

function renderOrderCard(order) {
  const shop = Store.getShopById(order.shopId);
  const itemCount = (order.items || []).reduce((sum, i) => sum + (i.qty || 1), 0);

  return `
    <div class="card order-history-card" data-order-id="${order.id}" style="cursor:pointer; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-weight:600; font-size:0.95rem; color:var(--text-primary);">
              ${shop ? shop.name : order.shopName || 'Unknown Shop'}
            </span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-dim); display:flex; align-items:center; gap:4px;">
            <span class="material-icons-round" style="font-size:14px;">schedule</span>
            ${formatDateTime(order.createdAt)}
          </div>
        </div>
        ${statusBadge(order.status)}
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; padding-top:8px; border-top:1px solid var(--border);">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:0.82rem; color:var(--text-secondary);">
            <span class="material-icons-round" style="font-size:14px; vertical-align:-2px;">inventory_2</span>
            ${itemCount}
          </div>
          <div style="font-size:0.82rem; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
            <span class="material-icons-round" style="font-size:14px; color:${order.paymentMode === 'credit' ? 'var(--accent-gold)' : order.paymentMode === 'upi' ? 'var(--accent-blue)' : 'var(--success)'}">${order.paymentMode === 'credit' ? 'hourglass_empty' : order.paymentMode === 'upi' ? 'qr_code_2' : 'payments'}</span>
            ${order.paymentMode === 'credit' ? 'Credit' : order.paymentMode === 'upi' ? 'UPI' : 'Cash'}
          </div>
          <div style="font-size:0.75rem; color:var(--text-dim);">
            #${order.id.slice(-6).toUpperCase()}
          </div>
        </div>
        <div style="font-weight:700; font-size:1.05rem; color:var(--accent-gold);">
          ₹${(order.total || 0).toLocaleString('en-IN')}
        </div>
      </div>
    </div>`;
}

function renderOrderDetail(order) {
  const shop = Store.getShopById(order.shopId);
  const items = order.items || [];

  return `
    <div style="margin-bottom:20px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div>
          <div class="form-label" style="margin-bottom:2px;">Shop</div>
          <div style="font-weight:500; color:var(--text-primary);">
            ${shop ? shop.name : order.shopName || 'Unknown'}
          </div>
        </div>
        <div>
          <div class="form-label" style="margin-bottom:2px;">Status</div>
          ${statusBadge(order.status)}
        </div>
        <div>
          <div class="form-label" style="margin-bottom:2px;">Payment Details</div>
          <div style="font-weight:500; display:flex; align-items:center; gap:6px; font-size:0.88rem;">
            <span class="material-icons-round" style="font-size:14px; color:${order.paymentMode === 'credit' ? 'var(--accent-gold)' : order.paymentMode === 'upi' ? 'var(--accent-blue)' : 'var(--success)'}">${order.paymentMode === 'credit' ? 'hourglass_empty' : order.paymentMode === 'upi' ? 'qr_code_2' : 'payments'}</span>
            ${order.paymentMode === 'credit' ? 'Credit' : order.paymentMode === 'upi' ? 'UPI' : 'Cash'}
            <span class="badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem; padding:1px 6px; text-transform:none; letter-spacing:0;">${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span>
          </div>
        </div>
        <div>
          <div class="form-label" style="margin-bottom:2px;">Date</div>
          <div style="color:var(--text-secondary); font-size:0.88rem;">
            ${formatDateTime(order.createdAt)}
          </div>
        </div>
        <div style="grid-column: 1 / -1;">
          <div class="form-label" style="margin-bottom:2px;">Order ID</div>
          <div style="color:var(--text-muted); font-size:0.82rem;">#${order.id}</div>
        </div>
      </div>

      ${order.notes ? `
        <div style="margin-bottom:16px; padding:10px 14px; background:var(--glass-bg); border-radius:var(--radius-md); border:1px solid var(--border);">
          <div class="form-label" style="margin-bottom:2px;">Notes</div>
          <div style="color:var(--text-secondary); font-size:0.88rem;">${order.notes}</div>
        </div>
      ` : ''}

      <!-- Items Table -->
      <div class="table-container" style="margin-bottom:16px;">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="table-cell-main">${item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
                <td style="text-align:right; font-weight:600; color:var(--text-primary);">₹${(item.subtotal || item.price * item.qty || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
            ${order.penaltyAdded ? `
              <tr style="border-top:1px dashed var(--border)">
                <td colspan="3" style="text-align:right; font-size:0.8rem; color:var(--text-secondary);">Unpaid Penalty (₹50/day after 7 days)</td>
                <td style="text-align:right; font-size:0.8rem; color:var(--text-secondary);">+₹${order.penaltyAdded.toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border);">
              <td colspan="3" style="text-align:right; font-weight:700; color:var(--text-primary);">Total</td>
              <td style="text-align:right; font-weight:700; color:var(--accent-gold); font-size:1.05rem;">₹${(order.total || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
        <div style="display:flex; gap:12px;">
          <button class="btn btn-secondary" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px;" id="print-invoice-btn" data-order-id="${order.id}">
            <span class="material-icons-round">print</span>
            Print Invoice
          </button>
          <button class="btn btn-primary" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px;" id="reorder-btn" data-order-id="${order.id}">
            <span class="material-icons-round">replay</span>
            Reorder
          </button>
        </div>
        <a href="${getWhatsAppShareUrl(order)}" target="_blank" class="btn btn-primary" style="display:flex; align-items:center; justify-content:center; gap:8px; background-color:#25d366; border-color:#25d366; color:white; text-decoration:none;" id="share-whatsapp-btn">
          <span class="material-icons-round">share</span>
          Share Invoice on WhatsApp
        </a>
      </div>
    </div>`;
}

// ---------- Main Render ----------

export function render() {
  const orders = getFilteredOrders();
  const allOrders = Store.getOrders({ firmId: firmId(), staffId: staffId() });

  // Count by status for tab badges
  const counts = { all: allOrders.length, pending: 0, confirmed: 0, delivered: 0 };
  allOrders.forEach(o => {
    if (counts[o.status] !== undefined) counts[o.status]++;
  });

  return `
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1 class="page-title">Order History</h1>
          <p class="page-subtitle">${counts.all} total order${counts.all !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="tabs" style="margin-bottom:20px;" id="status-tabs">
        <button class="tab ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
          All (${counts.all})
        </button>
        <button class="tab ${activeFilter === 'pending' ? 'active' : ''}" data-filter="pending">
          Pending Approval (${counts.pending})
        </button>
        <button class="tab ${activeFilter === 'confirmed' ? 'active' : ''}" data-filter="confirmed">
          Ready to Deliver (${counts.confirmed})
        </button>
        <button class="tab ${activeFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">
          Delivered (${counts.delivered})
        </button>
      </div>

      <!-- Orders List -->
      <div id="orders-list" style="display:flex; flex-direction:column; gap:12px;">
        ${orders.length > 0
          ? orders.map(o => renderOrderCard(o)).join('')
          : `<div class="empty-state">
              <div class="empty-state-icon">
                <span class="material-icons-round">receipt_long</span>
              </div>
              <h3>${activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders`}</h3>
              <p>${activeFilter === 'all'
                ? 'Orders you place will appear here.'
                : `You don't have any ${activeFilter} orders right now.`}</p>
              ${activeFilter === 'all' ? `
                <button class="btn btn-primary" id="go-new-order-btn">
                  <span class="material-icons-round">add_shopping_cart</span>
                  Take New Order
                </button>
              ` : ''}
            </div>`
        }
      </div>
    </div>`;
}

// ---------- Init ----------

export function init() {
  // Status filter tabs
  document.querySelectorAll('#status-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter || 'all';
      // Re-render entire page
      const appRoot = document.getElementById('main-content') || document.querySelector('.main-content');
      if (appRoot) {
        appRoot.innerHTML = render();
        init();
      }
    });
  });

  // Order card click → detail modal
  document.querySelectorAll('.order-history-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = card.dataset.orderId;
      openOrderDetail(orderId);
    });
  });

  // Empty state CTA
  const newOrderBtn = document.getElementById('go-new-order-btn');
  if (newOrderBtn) {
    newOrderBtn.addEventListener('click', () => {
      window.location.hash = '#/staff/new-order';
    });
  }
}

function openOrderDetail(orderId) {
  const order = Store.getOrderById(orderId);
  if (!order) {
    Toast.error('Order not found');
    return;
  }

  Modal.show({
    title: 'Order Details',
    content: renderOrderDetail(order),
    size: 'lg',
    hideFooter: true
  });

  // Bind buttons inside modal
  setTimeout(() => {
    const reorderBtn = document.getElementById('reorder-btn');
    if (reorderBtn) {
      reorderBtn.addEventListener('click', () => {
        handleReorder(orderId);
      });
    }

    const printBtn = document.getElementById('print-invoice-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        printInvoice(order);
      });
    }
  }, 100);
}

function handleReorder(orderId) {
  const order = Store.getOrderById(orderId);
  if (!order || !order.items || order.items.length === 0) {
    Toast.error('No items to reorder');
    return;
  }

  // Save items to sessionStorage for the order page to pick up
  const reorderItems = order.items.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    qty: item.qty
  }));

  sessionStorage.setItem('kaka_reorder_items', JSON.stringify(reorderItems));

  // Navigate with shop pre-selected
  Modal.hide();
  Toast.info('Items loaded into cart');
  window.location.hash = '#/staff/new-order?shop=' + order.shopId;
}
