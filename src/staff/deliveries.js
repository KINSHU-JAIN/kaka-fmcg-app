// ============================================
// Staff Panel — Deliveries View
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

// ---------- State ----------
let selectedRouteId = null;

// ---------- Helpers ----------
function getFirmId() {
  return window.__currentFirm || 'firm_ka';
}

function getStaffId() {
  const session = Store.getSession();
  return session ? session.user.id : null;
}

function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Get routes assigned to the logged-in staff member
function getAssignedRoutes() {
  const staffId = getStaffId();
  if (!staffId) return [];
  
  // Get all routes in the system for this firm
  const routes = [...Store.getRoutes(getFirmId())];
  
  // Check if there are any orders directly assigned to this staff member
  const orders = Store.getOrders({ firmId: getFirmId(), status: 'confirmed' }).filter(o => o.staffId === staffId);
  
  if (orders.length > 0) {
    const directShopIds = [...new Set(orders.map(o => o.shopId))];
    routes.push({
      id: 'direct',
      name: 'Direct Assignments (Today)',
      shopIds: directShopIds
    });
  }
  
  return routes;
}

// Get orders pending delivery (status === 'confirmed') for a list of shop IDs
function getRouteOrders(shopIds, routeId) {
  const staffId = getStaffId();
  const orders = Store.getOrders({ firmId: getFirmId(), status: 'confirmed' });
  
  if (routeId === 'direct') {
    // Return all orders explicitly assigned to this staff member
    return orders.filter(o => o.staffId === staffId);
  }
  
  if (!shopIds || shopIds.length === 0) return [];
  const shopSet = new Set(shopIds);
  return orders.filter(o => shopSet.has(o.shopId));
}

// ---------- Sub-renders ----------

function renderRouteSelector(routes) {
  if (routes.length <= 1) return ''; // No selector needed for 1 or 0 routes
  
  return `
    <div class="form-group mb-lg" style="max-width: 400px;">
      <label class="form-label">Select Delivery Route</label>
      <select class="form-select" id="delivery-route-select">
        ${routes.map(r => `
          <option value="${r.id}" ${r.id === selectedRouteId ? 'selected' : ''}>
            ${r.name} (${(r.shopIds || []).length} shops)
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function renderOrderCard(order) {
  const shop = Store.getShopById(order.shopId);
  const itemCount = (order.items || []).reduce((sum, item) => sum + (item.qty || 1), 0);

  return `
    <div class="card" style="display:flex; flex-direction:column; gap:12px; border-left: 4px solid var(--accent-gold);">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:1.05rem; color:var(--text-primary); margin-bottom:4px;">
            ${shop ? shop.name : order.shopName || 'Unknown Shop'}
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span class="material-icons-round" style="font-size:16px; color:var(--text-dim);">location_on</span>
            ${shop ? shop.address : 'No address provided'}
          </div>
          <div style="font-size:0.8rem; color:var(--text-dim); display:flex; align-items:center; gap:6px;">
            <span class="material-icons-round" style="font-size:16px;">schedule</span>
            Ordered: ${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:1.15rem; color:var(--accent-gold);">${formatCurrency(order.total)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid var(--border-light); flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge ${order.paymentMode === 'credit' ? 'badge-warning' : 'badge-success'}" style="font-size:0.7rem; padding:4px 8px; display:flex; align-items:center; gap:4px;">
            <span class="material-icons-round" style="font-size:14px;">${order.paymentMode === 'credit' ? 'hourglass_empty' : order.paymentMode === 'upi' ? 'qr_code_2' : 'payments'}</span>
            ${order.paymentMode === 'credit' ? 'On Credit' : order.paymentMode === 'upi' ? 'UPI / Online' : 'Cash Collected'}
          </span>
          <span class="badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}" style="font-size:0.7rem; padding:4px 8px;">
            ${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
          </span>
          <span class="text-muted" style="font-size:0.75rem;">#${order.id.slice(-6).toUpperCase()}</span>
        </div>

        <button class="btn btn-primary btn-sm complete-delivery-btn" data-order-id="${order.id}">
          <span class="material-icons-round" style="font-size:16px;">check_circle</span>
          Complete Delivery
        </button>
      </div>
    </div>
  `;
}

function renderDeliveryModalContent(order) {
  const currentFirm = Store.getFirmById(getFirmId());
  const upiId = currentFirm?.id === 'firm_km' ? 'kakamarketing@upi' : 'kakaagencies@upi';
  const upiName = encodeURIComponent(currentFirm?.name || 'Kaka');
  const upiUri = `upi://pay?pa=${upiId}&pn=${upiName}&am=${order.total}&cu=INR&tn=Kaka%20Delivery%20Order`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--bg-base); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <div style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Customer Shop</div>
        <div style="font-weight:600; font-size:1rem; color:var(--text-primary); margin-top:2px;">${order.shopName}</div>
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">Order ID: #${order.id}</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:var(--accent-gold-light); border-radius:var(--radius-md); border:1px dashed var(--accent-gold);">
        <span style="font-weight:600; color:var(--text-primary);">Total Amount:</span>
        <span style="font-weight:800; font-size:1.25rem; color:var(--accent-gold);">${formatCurrency(order.total)}</span>
      </div>

      <div>
        <label class="form-label" style="margin-bottom:8px;">Choose Payment Method on Delivery</label>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;" id="modal-payment-mode-tabs">
          <button class="btn btn-secondary modal-payment-tab active" data-mode="credit" style="padding:10px 4px; display:flex; flex-direction:column; gap:6px; font-size:0.78rem; align-items:center; justify-content:center;">
            <span class="material-icons-round" style="color:var(--accent-gold); font-size:20px;">hourglass_empty</span>
            On Credit
          </button>
          <button class="btn btn-secondary modal-payment-tab" data-mode="cash" style="padding:10px 4px; display:flex; flex-direction:column; gap:6px; font-size:0.78rem; align-items:center; justify-content:center;">
            <span class="material-icons-round" style="color:var(--success); font-size:20px;">payments</span>
            Cash
          </button>
          <button class="btn btn-secondary modal-payment-tab" data-mode="upi" style="padding:10px 4px; display:flex; flex-direction:column; gap:6px; font-size:0.78rem; align-items:center; justify-content:center;">
            <span class="material-icons-round" style="color:var(--accent-blue); font-size:20px;">qr_code_2</span>
            UPI / QR
          </button>
        </div>
      </div>

      <!-- UPI QR Code Display -->
      <div id="modal-upi-qr-panel" style="display:none; flex-direction:column; align-items:center; gap:8px; background:var(--bg-base); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <div style="font-weight:600; font-size:0.85rem; color:var(--text-primary);">Scan QR to Pay: ${formatCurrency(order.total)}</div>
        <div style="background:white; padding:8px; border-radius:8px; border:1px solid var(--border);">
          <img src="${qrUrl}" style="width:140px; height:140px; display:block;" alt="UPI QR" />
        </div>
        <div style="font-size:0.72rem; color:var(--text-muted); text-align:center;">UPI ID: ${upiId}</div>
      </div>

      <!-- Credit Warning Display -->
      <div id="modal-credit-warning-panel" style="display:block; padding:12px; background:var(--danger-light); border:1px solid var(--danger); border-radius:var(--radius-md); font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">
        <div style="font-weight:700; color:var(--danger); display:flex; align-items:center; gap:4px; margin-bottom:4px;">
          <span class="material-icons-round" style="font-size:16px;">warning</span>
          Credit Policy Warning
        </div>
        Please note: if the payment is not paid after <strong>7 days</strong>, a penalty of <strong>₹50 per day</strong> will be added and future orders will be blocked.
      </div>

      <div style="display:flex; gap:12px; margin-top:8px;">
        <button class="btn btn-secondary" style="flex:1;" id="modal-close-btn">Cancel</button>
        <button class="btn btn-primary" style="flex:1.5; background:var(--success); color:white;" id="modal-confirm-delivery-btn">
          Confirm Delivery
        </button>
      </div>
    </div>
  `;
}

// ---------- Main Render ----------

export function render() {
  const routes = getAssignedRoutes();
  
  if (routes.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round" style="color:var(--text-dim); font-size:48px;">local_shipping</span>
        </div>
        <h3>No Assigned Routes</h3>
        <p>You have not been assigned to any delivery routes by the Admin. Please contact management to get a route assigned.</p>
      </div>
    `;
  }

  // Initialize selectedRouteId if not set or invalid
  if (!selectedRouteId || !routes.some(r => r.id === selectedRouteId)) {
    selectedRouteId = routes[0].id;
  }

  const activeRoute = routes.find(r => r.id === selectedRouteId);
  const routeShopIds = activeRoute ? (activeRoute.shopIds || []) : [];
  const shops = routeShopIds.map(id => Store.getShopById(id)).filter(Boolean);
  const orders = getRouteOrders(routeShopIds, selectedRouteId);

  return `
    <div class="stagger">
      <!-- Route Selector (if multiple assigned) -->
      ${renderRouteSelector(routes)}

      <!-- Route Header Info -->
      <div class="card mb-lg" style="background:var(--bg-secondary); border-color:var(--border);">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
          <span class="material-icons-round" style="color:var(--accent-gold);">alt_route</span>
          <h2 style="margin:0; font-size:1.3rem;">${activeRoute.name}</h2>
        </div>
        <p style="color:var(--text-muted); font-size:0.85rem; margin:0 0 12px 28px;">
          This route contains ${shops.length} shop${shops.length !== 1 ? 's' : ''} in total.
        </p>

        <!-- Route stops tracker -->
        <div style="margin-left: 28px; display:flex; flex-direction:column; gap:8px;">
          <div style="font-weight:600; font-size:0.78rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Route Sequence / Stops</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:4px;">
            ${shops.map((shop, i) => {
              const shopOrders = orders.filter(o => o.shopId === shop.id);
              const orderCount = shopOrders.length;
              const hasOrders = orderCount > 0;
              
              return `
                <div style="
                  display:flex; align-items:center; gap:6px; 
                  padding:6px 12px; border-radius:var(--radius-full); 
                  background:${hasOrders ? 'var(--accent-gold-light)' : 'var(--bg-primary)'}; 
                  border:1px solid ${hasOrders ? 'var(--accent-gold)' : 'var(--border)'};
                  font-size:0.8rem; font-weight:500;
                  color:${hasOrders ? 'var(--accent-gold)' : 'var(--text-secondary)'};
                ">
                  <span style="
                    display:flex; align-items:center; justify-content:center; 
                    width:18px; height:18px; border-radius:50%; 
                    background:${hasOrders ? 'var(--accent-gold)' : 'var(--text-dim)'}; 
                    color:white; font-size:0.7rem; font-weight:700;
                  ">${i + 1}</span>
                  <span>${shop.name}</span>
                  ${hasOrders ? `<span class="badge badge-warning" style="font-size:0.62rem; padding:1px 5px;">${orderCount} Order${orderCount !== 1 ? 's' : ''}</span>` : ''}
                </div>
                ${i < shops.length - 1 ? '<span class="material-icons-round" style="color:var(--text-dim); font-size:16px;">chevron_right</span>' : ''}
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Orders Section Header -->
      <div style="margin-bottom:16px;">
        <h3 style="display:flex; align-items:center; gap:8px;">
          <span class="material-icons-round">receipt_long</span>
          Pending Deliveries (${orders.length})
        </h3>
        <p style="color:var(--text-muted); font-size:0.82rem; margin-top:2px;">Orders ready for dispatch on this route</p>
      </div>

      <!-- Orders List -->
      <div style="display:flex; flex-direction:column; gap:16px;" id="deliveries-orders-list">
        ${orders.length > 0
          ? orders.map(o => renderOrderCard(o)).join('')
          : `
            <div class="empty-state">
              <div class="empty-state-icon">
                <span class="material-icons-round" style="color:var(--success); font-size:48px;">check_circle</span>
              </div>
              <h3>Route Cleared!</h3>
              <p>There are no pending deliveries for any shop on this route. All orders are completed or pending admin approval.</p>
            </div>
          `
        }
      </div>
    </div>
  `;
}

// ---------- Refresh UI Helper ----------

function reRender() {
  const pageBody = document.getElementById('page-body');
  if (pageBody) {
    pageBody.innerHTML = render();
    init();
  }
}

// ---------- Init & Events ----------

function updateLocation() {
  const staffId = getStaffId();
  if (!staffId || !navigator.geolocation) return;
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      Store.saveStaffLocation(staffId, latitude, longitude);
    },
    (err) => {
      console.warn('Geolocation tracking error:', err.message);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

export function init() {
  // Update location on load
  updateLocation();

  // 1. Route selector event
  const routeSelect = document.getElementById('delivery-route-select');
  if (routeSelect) {
    routeSelect.addEventListener('change', () => {
      selectedRouteId = routeSelect.value || null;
      reRender();
    });
  }

  // 2. Complete delivery buttons
  document.querySelectorAll('.complete-delivery-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.dataset.orderId;
      const order = Store.getOrderById(orderId);
      if (order) openDeliveryModal(order);
    });
  });
}

function openDeliveryModal(order) {
  Modal.show({
    title: 'Complete Delivery Details',
    content: renderDeliveryModalContent(order),
    size: 'md',
    hideFooter: true
  });

  // Modal State Variables
  let selectedMode = 'credit';

  // Timeout to ensure DOM is drawn
  setTimeout(() => {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        Modal.hide();
      });
    }

    // Modal payment tabs toggles
    const paymentTabs = document.querySelectorAll('.modal-payment-tab');
    const upiQrPanel = document.getElementById('modal-upi-qr-panel');
    const creditWarningPanel = document.getElementById('modal-credit-warning-panel');

    paymentTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        paymentTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedMode = tab.dataset.mode || 'credit';
        
        // Show/hide UPI panel
        if (upiQrPanel) {
          upiQrPanel.style.display = selectedMode === 'upi' ? 'flex' : 'none';
        }
        
        // Show/hide Credit Policy Warning panel
        if (creditWarningPanel) {
          creditWarningPanel.style.display = selectedMode === 'credit' ? 'block' : 'none';
        }
      });
    });

    const confirmBtn = document.getElementById('modal-confirm-delivery-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const orderId = order.id;
        const updates = {
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          paymentMode: selectedMode,
          paymentStatus: selectedMode === 'credit' ? 'unpaid' : 'paid'
        };

        Store.updateOrder(orderId, updates);
        Toast.success(`Delivery completed for order #${orderId.slice(-6).toUpperCase()}`);
        Modal.hide();
        reRender();
      });
    }
  }, 100);
}
