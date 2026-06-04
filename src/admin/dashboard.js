import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { printInvoice } from '../components/invoice.js';

function loadChartJS(callback) {
  if (window.Chart) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = () => callback();
  document.head.appendChild(script);
}

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

    <!-- Charts Section -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom: 24px;" class="stagger">
      <!-- Daily Sales Line Chart -->
      <div class="card" style="padding:16px;">
        <h3 style="margin-top:0; font-size:0.95rem; display:flex; align-items:center; gap:6px; color:var(--text-primary);">
          <span class="material-icons-round" style="color:var(--accent-gold); font-size:18px;">trending_up</span>
          Daily Revenue Trend
        </h3>
        <canvas id="sales-trend-chart" style="max-height:220px; width:100%;"></canvas>
      </div>

      <!-- Brand Share Doughnut Chart -->
      <div class="card" style="padding:16px;">
        <h3 style="margin-top:0; font-size:0.95rem; display:flex; align-items:center; gap:6px; color:var(--text-primary);">
          <span class="material-icons-round" style="color:var(--success); font-size:18px;">pie_chart</span>
          Revenue Share by Brand
        </h3>
        <canvas id="brand-share-chart" style="max-height:220px; width:100%;"></canvas>
      </div>

      <!-- Collection Bar Chart -->
      <div class="card" style="padding:16px;">
        <h3 style="margin-top:0; font-size:0.95rem; display:flex; align-items:center; gap:6px; color:var(--text-primary);">
          <span class="material-icons-round" style="color:var(--accent-blue); font-size:18px;">bar_chart</span>
          Collections vs Credit Outstanding
        </h3>
        <canvas id="collection-breakdown-chart" style="max-height:220px; width:100%;"></canvas>
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
              <tr class="order-row" data-id="${order.id}" style="cursor:pointer">
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

function drawCharts() {
  const firmId = getFirmId();
  const orders = Store.getOrders({ firmId }).filter(o => o.status !== 'cancelled');
  
  // --- 1. Daily Sales Trend ---
  const salesByDate = {};
  orders.forEach(o => {
    const date = o.createdAt.split('T')[0];
    salesByDate[date] = (salesByDate[date] || 0) + o.total;
  });
  const sortedDates = Object.keys(salesByDate).sort().slice(-7);
  const salesValues = sortedDates.map(d => salesByDate[d]);
  const formattedDates = sortedDates.map(d => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const ctxTrend = document.getElementById('sales-trend-chart');
  if (ctxTrend) {
    new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: formattedDates.length > 0 ? formattedDates : ['No Data'],
        datasets: [{
          label: 'Revenue (₹)',
          data: salesValues.length > 0 ? salesValues : [0],
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // --- 2. Brand Revenue Share ---
  const salesByBrand = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const product = Store.getProductById(item.productId);
      if (product) {
        const company = Store.getCompanyById(product.companyId);
        if (company) {
          salesByBrand[company.name] = (salesByBrand[company.name] || 0) + (item.price * item.qty);
        }
      }
    });
  });

  const brandLabels = Object.keys(salesByBrand);
  const brandValues = brandLabels.map(b => salesByBrand[b]);

  const ctxBrand = document.getElementById('brand-share-chart');
  if (ctxBrand) {
    new Chart(ctxBrand, {
      type: 'doughnut',
      data: {
        labels: brandLabels.length > 0 ? brandLabels : ['No Sales'],
        datasets: [{
          data: brandValues.length > 0 ? brandValues : [0],
          backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } } }
      }
    });
  }

  // --- 3. Collection Breakdown (Cash vs UPI vs Credit) ---
  let cashTotal = 0;
  let upiTotal = 0;
  let creditTotal = 0;

  orders.forEach(o => {
    if (o.status === 'delivered') {
      if (o.paymentStatus === 'paid') {
        if (o.paymentMode === 'cash') cashTotal += o.total;
        else if (o.paymentMode === 'upi') upiTotal += o.total;
      } else {
        creditTotal += o.total;
      }
    } else if (o.status === 'confirmed') {
      creditTotal += o.total; // Pending delivery is also outstanding credit
    }
  });

  const ctxColl = document.getElementById('collection-breakdown-chart');
  if (ctxColl) {
    new Chart(ctxColl, {
      type: 'bar',
      data: {
        labels: ['Cash', 'UPI', 'Credit Outstanding'],
        datasets: [{
          data: [cashTotal, upiTotal, creditTotal],
          backgroundColor: ['#10b981', '#0ea5e9', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

export function init() {
  // Load Chart.js CDN dynamically and draw charts
  loadChartJS(() => {
    drawCharts();
  });

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

  // Row clicks
  document.querySelectorAll('.order-row').forEach(row => {
    row.addEventListener('click', () => {
      const order = Store.getOrderById(row.dataset.id);
      if (order) showOrderDetail(order);
    });
  });
}
