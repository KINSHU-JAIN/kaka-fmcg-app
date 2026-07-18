// ============================================
// Admin Orders Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { printInvoice, getWhatsAppShareUrl } from '../components/invoice.js';

let currentTab = 'all';

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
    confirmed: { cls: 'badge-info', label: 'Ready for Delivery' },
    delivered: { cls: 'badge-success', label: 'Delivered' },
    cancelled: { cls: 'badge-danger', label: 'Cancelled' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

function renderStatusFlow(status) {
  const steps = ['pending', 'confirmed', 'delivered'];
  const currentIdx = steps.indexOf(status);
  const isCancelled = status === 'cancelled';

  return `
    <div class="order-status-flow">
      ${steps.map((step, i) => {
        let cls = '';
        if (isCancelled) {
          cls = i === 0 ? 'completed' : '';
        } else if (i < currentIdx) {
          cls = 'completed';
        } else if (i === currentIdx) {
          cls = 'current';
        }
        const icons = { pending: 'hourglass_empty', confirmed: 'check_circle', delivered: 'local_shipping' };
        return `
          <div class="order-status-step ${cls}">
            <span class="material-icons-round" style="font-size:14px">${icons[step]}</span>
          </div>
          ${i < steps.length - 1 ? `<div class="order-status-line ${i < currentIdx && !isCancelled ? 'completed' : ''}"></div>` : ''}
        `;
      }).join('')}
      ${isCancelled ? `
        <div class="order-status-line"></div>
        <div class="order-status-step" style="border-color:var(--danger); background:var(--danger-light); color:var(--danger)">
          <span class="material-icons-round" style="font-size:14px">cancel</span>
        </div>
      ` : ''}
    </div>
  `;
}

function getActionButtons(order) {
  const btns = [];
  if (order.status === 'pending') {
    btns.push(`<button class="btn btn-sm btn-primary order-action-btn" data-id="${order.id}" data-action="confirmed">
      <span class="material-icons-round" style="font-size:16px">check</span> Approve (Set to Deliver)
    </button>`);
  }
  if (order.status === 'confirmed') {
    btns.push(`<button class="btn btn-sm btn-secondary order-action-btn" data-id="${order.id}" data-action="delivered" style="border-color:var(--success); color:var(--success)">
      <span class="material-icons-round" style="font-size:16px">local_shipping</span> Mark Delivered
    </button>`);
  }
  if (order.status === 'pending' || order.status === 'confirmed') {
    btns.push(`<button class="btn btn-sm btn-danger order-action-btn" data-id="${order.id}" data-action="cancelled">
      <span class="material-icons-round" style="font-size:16px">close</span> Cancel
    </button>`);
  }
  return btns.join(' ');
}

function showOrderDetail(order) {
  const shop = Store.getShopById(order.shopId);
  const staff = Store.getStaffById(order.staffId);
  const items = order.items || [];

  const itemRows = items.map((item, i) => {
    const product = Store.getProductById(item.productId);
    const name = product ? product.name : (item.name || 'Unknown Product');
    const price = item.price || (product ? product.sellingPrice : 0);
    const subtotal = price * (item.qty || 1);
    return `
      <tr>
        <td>${i + 1}</td>
        <td class="table-cell-main">${name}</td>
        <td class="text-right">${item.qty || 1}</td>
        <td class="text-right">${formatCurrency(price)}</td>
        <td class="text-right font-bold">${formatCurrency(subtotal)}</td>
      </tr>
    `;
  }).join('');

  const content = `
    <div class="flex justify-between items-center mb-md">
      <div>
        <div class="text-muted" style="font-size:0.78rem">ORDER ID</div>
        <div class="font-bold" style="font-size:1.1rem">#${order.id.slice(-6).toUpperCase()}</div>
      </div>
      <div>${getStatusBadge(order.status)}</div>
    </div>

    <div class="form-row mb-md">
      <div>
        <div class="text-muted" style="font-size:0.78rem">SHOP</div>
        <div style="font-weight:500">${shop ? shop.name : 'Unknown'}</div>
      </div>
      <div>
        <div class="text-muted" style="font-size:0.78rem">STAFF</div>
        <div style="font-weight:500">${staff ? staff.name : 'Unknown'}</div>
      </div>
    </div>

    <div class="form-row mb-md">
      <div>
        <div class="text-muted" style="font-size:0.78rem">DATE</div>
        <div style="font-weight:500">${formatDate(order.createdAt)} ${formatTime(order.createdAt)}</div>
      </div>
      <div>
        <div class="text-muted" style="font-size:0.78rem">STATUS FLOW</div>
        ${renderStatusFlow(order.status)}
      </div>
    </div>

    <div class="form-row mb-md">
      <div>
        <div class="text-muted" style="font-size:0.78rem">PAYMENT METHOD</div>
        <div style="font-weight:500; display:flex; align-items:center; gap:6px; margin-top:4px;">
          <span class="material-icons-round" style="font-size:16px; color: ${order.paymentMode === 'credit' ? 'var(--accent-gold)' : order.paymentMode === 'upi' ? 'var(--accent-blue)' : 'var(--success)'}">${order.paymentMode === 'credit' ? 'hourglass_empty' : order.paymentMode === 'upi' ? 'qr_code_2' : 'payments'}</span>
          <span>${order.paymentMode === 'credit' ? 'Credit / Outstanding' : order.paymentMode === 'upi' ? 'UPI / Online' : 'Cash Collected'}</span>
          <span class="badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem; padding:1px 6px;">${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span>
        </div>
      </div>
      ${order.notes ? `
      <div>
        <div class="text-muted" style="font-size:0.78rem">ORDER REMARKS</div>
        <div style="font-weight:500; font-size:0.85rem; color:var(--text-secondary);">${order.notes}</div>
      </div>
      ` : ''}
    </div>

    <div style="margin-top:16px">
      <table>
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th>Product</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || '<tr><td colspan="5" class="text-center text-muted">No items</td></tr>'}
          ${order.penaltyAdded ? `
            <tr style="border-top:1px dashed var(--border)">
              <td colspan="4" class="text-right text-muted" style="font-size:0.85rem">Unpaid Penalty (₹50/day after 7 days)</td>
              <td class="text-right text-muted" style="font-size:0.85rem">+${formatCurrency(order.penaltyAdded)}</td>
            </tr>
          ` : ''}
          <tr style="border-top:2px solid var(--border-light)">
            <td colspan="4" class="text-right font-bold">Total</td>
            <td class="text-right font-bold text-gold" style="font-size:1.05rem">${formatCurrency(order.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px;">
      <button class="btn btn-secondary" id="print-invoice-btn" style="display:flex; align-items:center; gap:6px;">
        <span class="material-icons-round" style="font-size:18px;">print</span> Print Invoice
      </button>
      <a href="${getWhatsAppShareUrl(order)}" target="_blank" class="btn btn-primary" id="share-whatsapp-btn" style="display:flex; align-items:center; gap:6px; background-color:#25d366; border-color:#25d366; color:white; text-decoration:none;">
        <span class="material-icons-round" style="font-size:18px;">share</span> Share WhatsApp
      </a>
    </div>
  `;

  Modal.show({
    title: 'Order Details',
    content,
    size: 'lg',
    hideFooter: true
  });

  const printBtn = document.getElementById('print-invoice-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printInvoice(order);
    });
  }
}

export function render() {
  const firmId = getFirmId();
  const filters = { firmId };
  if (currentTab !== 'all') filters.status = currentTab;
  const orders = Store.getOrders(filters);
  const allOrders = Store.getOrders({ firmId });

  // Count by status
  const counts = { all: allOrders.length, pending: 0, confirmed: 0, delivered: 0, cancelled: 0 };
  allOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending Approval', count: counts.pending },
    { key: 'confirmed', label: 'Ready to Deliver', count: counts.confirmed },
    { key: 'delivered', label: 'Delivered', count: counts.delivered },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return `
    <!-- Tab Filters -->
    <div class="tabs mb-lg">
      ${tabs.map(t => `
        <button class="tab ${currentTab === t.key ? 'active' : ''}" data-tab="${t.key}">
          ${t.label} (${t.count})
        </button>
      `).join('')}
    </div>

    <!-- Orders Table -->
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">
          <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; font-size:20px">receipt_long</span>
          Orders (${orders.length})
        </h3>
      </div>
      ${orders.length > 0 ? `
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Shop</th>
              <th>Staff</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => {
              const shop = Store.getShopById(order.shopId);
              const staff = Store.getStaffById(order.staffId);
              const itemCount = (order.items || []).length;
              return `
                <tr class="order-row" data-id="${order.id}" style="cursor:pointer">
                  <td class="table-cell-main">#${order.id.slice(-6).toUpperCase()}</td>
                  <td>${shop ? shop.name : '<span class="text-muted">—</span>'}</td>
                  <td>${staff ? staff.name : '<span class="text-muted">—</span>'}</td>
                  <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                  <td class="font-bold text-gold">
                    <div>${formatCurrency(order.total)}</div>
                    <div style="margin-top:4px;">
                      <span class="badge ${order.paymentMode === 'credit' ? 'badge-warning' : order.paymentMode === 'upi' ? 'badge-info' : 'badge-success'}" style="font-size:0.62rem; padding:1px 5px; text-transform:none; letter-spacing:0;">
                        ${order.paymentMode === 'credit' ? 'Credit' : order.paymentMode === 'upi' ? 'UPI' : 'Cash'}
                      </span>
                    </div>
                  </td>
                  <td>${getStatusBadge(order.status)}</td>
                  <td>
                    <div>${formatDate(order.createdAt)}</div>
                    <div class="text-muted" style="font-size:0.72rem">${formatTime(order.createdAt)}</div>
                  </td>
                  <td>
                    <div class="btn-group" style="flex-wrap:wrap; gap:4px;" onclick="event.stopPropagation()">
                      ${getActionButtons(order)}
                      <a href="${getWhatsAppShareUrl(order)}" target="_blank" class="btn btn-sm btn-secondary" title="Share on WhatsApp" style="border-color:#25d366; color:#25d366; display:inline-flex; align-items:center; justify-content:center; padding: 4px 8px; text-decoration:none;">
                        <span class="material-icons-round" style="font-size:16px;">share</span>
                      </a>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">receipt_long</span>
        </div>
        <h3>No ${currentTab !== 'all' ? currentTab : ''} orders</h3>
        <p>${currentTab !== 'all' ? 'No orders with this status.' : 'Orders placed by staff will appear here.'}</p>
      </div>
      `}
    </div>
  `;
}

function reRender() {
  const pageBody = document.querySelector('.page-body');
  if (pageBody) {
    pageBody.innerHTML = render();
    init();
  }
}

export function init() {
  // Tab switching
  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      reRender();
    });
  });

  // Order row click → detail modal
  document.querySelectorAll('.order-row').forEach(row => {
    row.addEventListener('click', () => {
      const order = Store.getOrderById(row.dataset.id);
      if (order) showOrderDetail(order);
    });
  });

  // Action buttons (confirm, deliver, cancel)
  document.querySelectorAll('.order-action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const orderId = btn.dataset.id;
      const action = btn.dataset.action;
      const order = Store.getOrderById(orderId);
      if (!order) return;

      if (action === 'confirmed') {
        const staffList = Store.getStaff().filter(s => !s.isBlocked);
        const shop = Store.getShopById(order.shopId);
        const route = shop && shop.routeId ? Store.getRouteById(shop.routeId) : null;
        const suggestedStaffId = route ? route.assignedStaffId : order.staffId;

        const modalContent = `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <p style="color:var(--text-secondary); font-size:0.95rem; margin:0;">
              Select a delivery worker to deliver this order for today:
            </p>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Delivery Staff</label>
              <select class="form-select" id="assign-delivery-staff" style="width:100%; padding:10px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-input); color:var(--text-primary);">
                <option value="">-- No Assigned Staff (Pending) --</option>
                ${staffList.map(s => `
                  <option value="${s.id}" ${s.id === suggestedStaffId ? 'selected' : ''}>
                    ${s.name} (${s.username})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        `;

        Modal.show({
          title: `Approve Order #${orderId.slice(-6).toUpperCase()}`,
          content: modalContent,
          confirmText: 'Approve & Assign',
          onConfirm: () => {
            const select = document.getElementById('assign-delivery-staff');
            const staffId = select.value || null;
            const selectedStaff = staffId ? staffList.find(s => s.id === staffId) : null;
            const staffName = selectedStaff ? selectedStaff.name : null;

            Store.updateOrder(orderId, { status: 'confirmed', staffId, staffName });
            Toast.success('Order approved & assigned for delivery');
            Modal.hide();
            reRender();
          }
        });
      } else {
        const labels = { delivered: 'mark as delivered', cancelled: 'cancel' };
        const confirmed = await Modal.confirm(`Are you sure you want to ${labels[action]} order #${orderId.slice(-6).toUpperCase()}?`);
        if (!confirmed) return;

        Store.updateOrderStatus(orderId, action);
        const msgs = {
          delivered: 'Order marked as delivered',
          cancelled: 'Order cancelled'
        };
        Toast.success(msgs[action] || 'Status updated');
        reRender();
      }
    });
  });
}
