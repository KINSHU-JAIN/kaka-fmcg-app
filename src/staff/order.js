// ============================================
// Staff Panel — New Order (Order Taking Flow)
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { getWhatsAppShareUrl } from '../components/invoice.js';

// ---------- Local Cart State ----------
let cart = []; // [{productId, name, price, qty, subtotal}]
let selectedShopId = null;
let selectedCompanyId = null;
let productSearch = '';

// ---------- Helpers ----------

function getPreSelectedShop() {
  const hash = window.location.hash || '';
  const match = hash.match(/[?&]shop=([^&]+)/);
  return match ? match[1] : null;
}

function getReorderItems() {
  try {
    const raw = sessionStorage.getItem('kaka_reorder_items');
    if (raw) {
      sessionStorage.removeItem('kaka_reorder_items');
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return null;
}

function firmId() {
  return window.__currentFirm || 'firm_ka';
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function findCartItem(productId) {
  return cart.find(item => item.productId === productId);
}

function addToCart(product) {
  if (!selectedShopId) {
    Toast.error('Please select a shop first');
    return;
  }
  const existing = findCartItem(product.id);
  if (existing) {
    existing.qty += 1;
    existing.price = Store.getProductPrice(product, existing.qty);
    existing.subtotal = existing.qty * existing.price;
  } else {
    const initialPrice = Store.getProductPrice(product, 1);
    cart.push({
      productId: product.id,
      name: product.name,
      price: initialPrice,
      qty: 1,
      subtotal: initialPrice
    });
  }
}

function updateCartQty(productId, delta) {
  if (!selectedShopId) {
    Toast.error('Please select a shop first');
    return;
  }
  const item = findCartItem(productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.productId !== productId);
  } else {
    const product = Store.getProductById(productId);
    item.price = Store.getProductPrice(product, item.qty);
    item.subtotal = item.qty * item.price;
  }
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
}

function clearCart() {
  cart = [];
  selectedShopId = null;
  selectedCompanyId = null;
  productSearch = '';
}

function showCreditPolicyPopup(onAgree, onCancel) {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000;
    opacity: 0; transition: opacity var(--transition-fast);
  `;
  popup.innerHTML = `
    <div style="
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 24px;
      max-width: 420px;
      width: 90%;
      border: 1px solid var(--border);
      transform: translateY(20px);
      transition: transform var(--transition-fast);
      color: var(--text-primary);
    ">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <span class="material-icons-round" style="color:var(--danger); font-size:32px;">warning</span>
        <h3 style="margin:0; font-family:var(--font-heading); font-size:1.25rem;">Credit Policy Warning</h3>
      </div>
      <p style="font-size:0.95rem; margin-bottom:16px; color:var(--text-secondary); line-height:1.5;">
        Please note: if the payment is not paid after <strong>7 days</strong>:
      </p>
      <ul style="margin: 0 0 20px 20px; padding: 0; color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">
        <li>There will be a penalty of <strong>₹50 per day</strong>.</li>
        <li>The total outstanding amount <strong>must be paid</strong> before placing the next order.</li>
      </ul>
      <div style="display:flex; gap:12px; justify-content:flex-end;">
        <button class="btn btn-secondary" id="credit-cancel-btn" style="flex:1;">Change Method</button>
        <button class="btn btn-primary" id="credit-agree-btn" style="flex:1.5; background:var(--accent-gold); color:white;">I Agree & Proceed</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  popup.offsetHeight; // force reflow
  
  popup.style.opacity = '1';
  popup.querySelector('div').style.transform = 'translateY(0)';

  const cleanup = () => {
    popup.style.opacity = '0';
    popup.querySelector('div').style.transform = 'translateY(20px)';
    setTimeout(() => popup.remove(), 200);
  };

  popup.querySelector('#credit-cancel-btn').addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });

  popup.querySelector('#credit-agree-btn').addEventListener('click', () => {
    cleanup();
    if (onAgree) onAgree();
  });
}

function renderOutstandingWarning() {
  if (!selectedShopId) return '';
  const outstanding = Store.getShopOutstanding(selectedShopId);
  if (outstanding.totalOutstanding <= 0) return '';

  return `
    <div style="
      margin-top: 16px;
      margin-bottom: 20px;
      padding: 16px;
      border-radius: var(--radius-md);
      background: var(--danger-light);
      border: 1px solid var(--danger);
      display: flex;
      flex-direction: column;
      gap: 12px;
    ">
      <div style="display:flex; align-items:center; gap:10px; color:var(--danger); font-weight:700;">
        <span class="material-icons-round">warning</span>
        <span style="font-size:1.05rem; font-family:var(--font-heading);">Outstanding Balance Block</span>
      </div>
      <p style="margin:0; font-size:0.95rem; color:var(--text-secondary); line-height:1.5;">
        This shop has an outstanding balance of <strong>₹${outstanding.totalOutstanding.toLocaleString('en-IN')}</strong> 
        (including <strong>₹${outstanding.totalPenalty.toLocaleString('en-IN')}</strong> penalty for unpaid orders older than 7 days).
        <br/>
        <span style="color:var(--danger); font-weight:600;">You must settle this outstanding balance before placing a new order.</span>
      </p>
      <div>
        <button class="btn" id="settle-outstanding-btn" style="background:var(--success); color:white; display:flex; align-items:center; gap:8px; border:none; padding:8px 16px; font-weight:600; border-radius:var(--radius-md); cursor:pointer;">
          <span class="material-icons-round">payments</span>
          Collect & Settle Outstanding (₹${outstanding.totalOutstanding.toLocaleString('en-IN')})
        </button>
      </div>
    </div>
  `;
}

function bindSettleButton() {
  const settleBtn = document.getElementById('settle-outstanding-btn');
  if (settleBtn) {
    settleBtn.addEventListener('click', async () => {
      const outstanding = Store.getShopOutstanding(selectedShopId);
      const confirmed = await Modal.confirm(`Collect ₹${outstanding.totalOutstanding.toLocaleString('en-IN')} cash and settle outstanding balance for this shop?`);
      if (confirmed) {
        Store.settleShopOutstanding(selectedShopId);
        Toast.success('Outstanding balance settled successfully!');
        
        // Refresh the warning container
        const warningContainer = document.getElementById('outstanding-warning-container');
        if (warningContainer) {
          warningContainer.innerHTML = renderOutstandingWarning();
        }
        
        refreshAll();
      }
    });
  }
}

// ---------- Sub-renders ----------

function renderShopSelector() {
  const shops = Store.getShops();

  return `
    <div class="form-group" style="max-width:400px;">
      <label class="form-label">Select Shop</label>
      <select class="form-select" id="order-shop-select">
        <option value="">— Choose a shop —</option>
        ${shops.map(s => `
          <option value="${s.id}" ${s.id === selectedShopId ? 'selected' : ''}>${s.name} — ${s.ownerName}</option>
        `).join('')}
      </select>
    </div>`;
}

function renderCompanyIcon(icon, size = '16px') {
  if (!icon) return '';
  if (icon.startsWith('/') || icon.startsWith('http')) {
    return `<img src="${icon}" style="width:${size}; height:${size}; object-fit:contain; vertical-align:middle; border-radius:3px; background:white; padding:1px; border:1px solid var(--border-light); margin-right:4px;" />`;
  }
  return icon + ' ';
}

function renderCompanyChips() {
  const companies = Store.getCompanies(firmId());

  return `
    <div class="chips-row" style="margin-bottom:16px;">
      <button class="chip ${!selectedCompanyId ? 'active' : ''}" data-company-id="">All Companies</button>
      ${companies.map(c => `
        <button class="chip ${selectedCompanyId === c.id ? 'active' : ''}" data-company-id="${c.id}" style="display:inline-flex; align-items:center; gap:4px;">
          ${renderCompanyIcon(c.icon, '16px')}${c.name}
        </button>
      `).join('')}
    </div>`;
}

function renderProductGrid() {
  const filters = { firmId: firmId(), isActive: true };
  if (selectedCompanyId) filters.companyId = selectedCompanyId;
  if (productSearch) filters.search = productSearch;

  const products = Store.getProducts(filters);
  const companies = Store.getCompanies(firmId());
  const companyMap = {};
  companies.forEach(c => { companyMap[c.id] = c; });

  const outstanding = selectedShopId ? Store.getShopOutstanding(selectedShopId) : null;
  const isBlocked = outstanding && outstanding.totalOutstanding > 0;

  if (products.length === 0) {
    return `
      <div class="empty-state" style="padding:40px 20px;">
        <div class="empty-state-icon">
          <span class="material-icons-round">inventory_2</span>
        </div>
        <h3>No products found</h3>
        <p>Try a different search or company filter.</p>
      </div>`;
  }

  return `
    <div class="product-grid">
      ${products.map(p => {
        const company = companyMap[p.companyId];
        const inCart = findCartItem(p.id);
        return `
          <div class="product-card">
            <div class="product-card-name" title="${p.name}">${p.name}</div>
            <div class="product-card-company">${company ? company.name : ''}</div>
            <div class="product-card-price">
              <span class="selling">₹${p.sellingPrice.toLocaleString('en-IN')}</span>
              ${p.mrp !== p.sellingPrice ? `<span class="mrp">₹${p.mrp.toLocaleString('en-IN')}</span>` : ''}
            </div>
            <div class="product-card-unit">per ${p.unit}</div>
            ${p.tierPrices && p.tierPrices.length > 0 
              ? `<div class="product-card-tiers" style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
                  ${p.tierPrices.map(t => `<span class="badge badge-info" style="font-size:0.68rem; padding:2px 6px;">${t.minQty}+ @ ₹${t.price}</span>`).join('')}
                 </div>`
              : ''
            }
            <div class="product-card-actions">
              ${isBlocked
                ? `<button class="product-card-add" disabled style="opacity:0.5; cursor:not-allowed; flex:1; justify-content:center; background:var(--text-dim);">
                    Blocked
                   </button>`
                : inCart
                  ? `<div class="cart-item-qty" style="flex:1; justify-content:center;">
                      <button class="product-qty-btn" data-product-id="${p.id}" data-delta="-1">−</button>
                      <span style="font-weight:600; min-width:28px; text-align:center;">${inCart.qty}</span>
                      <button class="product-qty-btn" data-product-id="${p.id}" data-delta="1">+</button>
                    </div>`
                  : `<button class="product-card-add product-add-btn" data-product-id="${p.id}">
                      <span class="material-icons-round" style="font-size:16px;">add</span>
                      Add
                    </button>`
              }
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderCartPanel() {
  const total = cartTotal();
  const count = cartCount();
  const outstanding = selectedShopId ? Store.getShopOutstanding(selectedShopId) : null;
  const isBlocked = outstanding && outstanding.totalOutstanding > 0;

  return `
    <div class="cart-panel" id="cart-panel">
      <div class="cart-header">
        <h3 style="display:flex; align-items:center; gap:8px;">
          <span class="material-icons-round" style="font-size:20px;">shopping_cart</span>
          Cart
        </h3>
        <span class="badge ${count > 0 ? 'badge-success' : 'badge-neutral'}">${count} item${count !== 1 ? 's' : ''}</span>
      </div>

      <div class="cart-items">
        ${cart.length === 0
          ? `<div style="padding:32px 20px; text-align:center; color:var(--text-dim);">
              <span class="material-icons-round" style="font-size:36px; opacity:0.3; margin-bottom:8px; display:block;">remove_shopping_cart</span>
              Your cart is empty
            </div>`
          : cart.map(item => {
            const product = Store.getProductById(item.productId);
            const isDiscounted = product && item.price < product.sellingPrice;
            const originalPriceStr = isDiscounted
              ? `<span style="text-decoration:line-through; font-size:0.75rem; color:var(--text-dim); margin-right:4px;">₹${product.sellingPrice}</span>`
              : '';
            const bulkBadge = isDiscounted
              ? `<span class="badge badge-success" style="font-size:0.62rem; padding:1px 5px; margin-left:4px; vertical-align:middle; text-transform:none; letter-spacing:0;">Bulk</span>`
              : '';

            return `
              <div class="cart-item">
                <div class="cart-item-info">
                  <div class="cart-item-name" title="${item.name}">${item.name}${bulkBadge}</div>
                  <div class="cart-item-price">${originalPriceStr}₹${item.price.toLocaleString('en-IN')} × ${item.qty}</div>
                </div>
                <div class="cart-item-qty" style="${isBlocked ? 'opacity:0.5; pointer-events:none;' : ''}">
                  <button class="cart-qty-btn" data-product-id="${item.productId}" data-delta="-1" ${isBlocked ? 'disabled' : ''}>−</button>
                  <span>${item.qty}</span>
                  <button class="cart-qty-btn" data-product-id="${item.productId}" data-delta="1" ${isBlocked ? 'disabled' : ''}>+</button>
                </div>
                <div class="cart-item-total">₹${item.subtotal.toLocaleString('en-IN')}</div>
                <button class="cart-item-remove cart-remove-btn" data-product-id="${item.productId}" ${isBlocked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                  <span class="material-icons-round" style="font-size:18px;">close</span>
                </button>
              </div>`;
          }).join('')
        }
      </div>

      ${cart.length > 0 ? `
        <div class="cart-summary">
          <div class="cart-summary-row">
            <span>Items</span>
            <span>${count}</span>
          </div>
          <div class="cart-summary-total">
            <span>Total</span>
            <span>₹${total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="padding:12px 20px;">
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Order Notes</label>
            <textarea class="form-input form-textarea" id="order-notes" placeholder="Any special instructions..." style="min-height:50px;" ${isBlocked ? 'disabled' : ''}>${document.getElementById('order-notes')?.value || ''}</textarea>
          </div>
        </div>

        <div class="cart-actions">
          <button class="btn btn-primary btn-lg" id="place-order-btn" ${(isBlocked || !selectedShopId) ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            <span class="material-icons-round">check_circle</span>
            ${isBlocked ? 'Blocked — Clear Outstanding' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
          </button>
          <button class="btn btn-ghost w-full mt-sm" id="clear-cart-btn" style="color:var(--danger);" ${isBlocked ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            Clear Cart
          </button>
        </div>
      ` : ''}
    </div>`;
}

// ---------- Main Render ----------

export function render() {
  // Initialize from URL / reorder
  const preShop = getPreSelectedShop();
  if (preShop) selectedShopId = preShop;

  const reorderItems = getReorderItems();
  if (reorderItems && reorderItems.length > 0) {
    cart = reorderItems.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
      subtotal: item.price * item.qty
    }));
  }

  return `
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1 class="page-title">New Order</h1>
          <p class="page-subtitle">Select a shop, add products, and place your order</p>
        </div>
      </div>
    </div>

    <div class="page-body">
      <!-- Shop Selector -->
      ${renderShopSelector()}

      <!-- Outstanding Balance Warning (if any) -->
      <div id="outstanding-warning-container">
        ${renderOutstandingWarning()}
      </div>

      <!-- Main Layout: Products + Cart -->
      <div id="order-layout" style="display:flex; gap:24px; align-items:flex-start;">
        <!-- Product Browser (left) -->
        <div id="product-browser" style="flex:7; min-width:0;">
          <!-- Search -->
          <div style="margin-bottom:16px;">
            <div class="search-bar" style="max-width:100%;">
              <span class="material-icons-round">search</span>
              <input type="text" id="product-search" placeholder="Search products..." value="${productSearch}" />
            </div>
          </div>

          <!-- Company Chips -->
          <div id="company-chips-container">
            ${renderCompanyChips()}
          </div>

          <!-- Products Grid -->
          <div id="product-grid-container">
            ${renderProductGrid()}
          </div>
        </div>

        <!-- Cart Panel (right) -->
        <div id="cart-container" style="flex:3; min-width:280px; position:sticky; top:90px;">
          ${renderCartPanel()}
        </div>
      </div>

      <!-- Mobile Cart FAB -->
      <button class="btn btn-primary mobile-cart-fab" id="mobile-cart-fab" style="
        display:none; position:fixed; bottom:24px; right:24px; z-index:200;
        width:60px; height:60px; border-radius:50%; font-size:1.2rem;
        box-shadow:var(--shadow-lg); padding:0;">
        <span class="material-icons-round" style="font-size:28px;">shopping_cart</span>
        ${cartCount() > 0 ? `<span style="position:absolute; top:-4px; right:-4px; background:var(--danger); color:#fff; font-size:0.7rem; font-weight:700; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center;">${cartCount()}</span>` : ''}
      </button>
    </div>

    <style>
      @media (max-width: 768px) {
        #order-layout { flex-direction: column !important; }
        #cart-container { position: static !important; min-width: 100% !important; }
        .mobile-cart-fab { display: flex !important; }
      }
    </style>`;
}

// ---------- Refresh helpers ----------

function refreshProducts() {
  const container = document.getElementById('product-grid-container');
  if (container) container.innerHTML = renderProductGrid();
  bindProductButtons();
}

function refreshCart() {
  const container = document.getElementById('cart-container');
  if (container) container.innerHTML = renderCartPanel();
  bindCartButtons();
  refreshMobileFab();
}

function refreshMobileFab() {
  const fab = document.getElementById('mobile-cart-fab');
  if (fab) {
    const count = cartCount();
    fab.innerHTML = `
      <span class="material-icons-round" style="font-size:28px;">shopping_cart</span>
      ${count > 0 ? `<span style="position:absolute; top:-4px; right:-4px; background:var(--danger); color:#fff; font-size:0.7rem; font-weight:700; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center;">${count}</span>` : ''}
    `;
  }
}

function refreshAll() {
  refreshProducts();
  refreshCart();
}

// ---------- Init ----------

export function init() {
  // Shop selector
  const shopSelect = document.getElementById('order-shop-select');
  if (shopSelect) {
    shopSelect.addEventListener('change', () => {
      const newShopId = shopSelect.value || null;
      if (newShopId !== selectedShopId) {
        if (cart.length > 0) {
          Toast.info('Cart cleared due to shop change');
        }
        cart = [];
        selectedShopId = newShopId;
      }
      // Update warning container
      const warningContainer = document.getElementById('outstanding-warning-container');
      if (warningContainer) {
        warningContainer.innerHTML = renderOutstandingWarning();
        bindSettleButton();
      }
      refreshAll();
    });
  }

  // Bind settle button initially
  bindSettleButton();

  // Product search
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    let debounce = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        productSearch = searchInput.value.trim();
        refreshProducts();
      }, 200);
    });
  }

  // Company chips
  bindCompanyChips();

  // Product buttons
  bindProductButtons();

  // Cart buttons
  bindCartButtons();

  // Mobile FAB
  const fab = document.getElementById('mobile-cart-fab');
  if (fab) {
    fab.addEventListener('click', () => {
      const cartEl = document.getElementById('cart-container');
      if (cartEl) {
        cartEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

function bindCompanyChips() {
  document.querySelectorAll('#company-chips-container .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedCompanyId = chip.dataset.companyId || null;
      // Refresh chips to show active state
      const chipsContainer = document.getElementById('company-chips-container');
      if (chipsContainer) chipsContainer.innerHTML = renderCompanyChips();
      bindCompanyChips();
      refreshProducts();
    });
  });
}

function bindProductButtons() {
  // Add to cart
  document.querySelectorAll('.product-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedShopId) {
        Toast.error('Please select a shop first');
        return;
      }
      const productId = btn.dataset.productId;
      const product = Store.getProductById(productId);
      if (!product) return;
      addToCart(product);
      refreshAll();
    });
  });

  // Qty controls in product grid
  document.querySelectorAll('.product-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedShopId) {
        Toast.error('Please select a shop first');
        return;
      }
      const productId = btn.dataset.productId;
      const delta = parseInt(btn.dataset.delta, 10);
      updateCartQty(productId, delta);
      refreshAll();
    });
  });
}

function bindCartButtons() {
  // Qty controls in cart
  document.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      const delta = parseInt(btn.dataset.delta, 10);
      updateCartQty(productId, delta);
      refreshAll();
    });
  });

  // Remove from cart
  document.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      removeFromCart(productId);
      refreshAll();
    });
  });

  // Place order
  const placeBtn = document.getElementById('place-order-btn');
  if (placeBtn) {
    placeBtn.addEventListener('click', handlePlaceOrder);
  }

  // Clear cart
  const clearBtn = document.getElementById('clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const confirmed = await Modal.confirm('Clear all items from the cart?');
      if (confirmed) {
        cart = [];
        refreshAll();
      }
    });
  }
}

function renderOrderOverviewHtml(shop, items, total, notes) {
  const currentFirm = Store.getFirmById(firmId());
  const itemRows = items.map((item, idx) => `
    <tr style="font-size:0.85rem;">
      <td style="padding: 6px 10px;">${idx + 1}</td>
      <td class="table-cell-main" style="padding: 6px 10px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</td>
      <td style="text-align:center; padding: 6px 10px;">${item.qty}</td>
      <td style="text-align:right; padding: 6px 10px;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="text-align:right; font-weight:600; padding: 6px 10px; color:var(--text-primary);">₹${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--bg-base); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <div style="font-weight:600; font-size:0.95rem; color:var(--text-primary); margin-bottom:4px;">${shop ? shop.name : 'Unknown Shop'}</div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">${shop ? shop.address : ''}</div>
      </div>

      <div class="table-container" style="max-height:180px; overflow-y:auto; border-radius:var(--radius-md);">
        <table>
          <thead>
            <tr>
              <th style="padding:6px 10px;">#</th>
              <th style="padding:6px 10px;">Item</th>
              <th style="text-align:center; padding:6px 10px;">Qty</th>
              <th style="text-align:right; padding:6px 10px;">Rate</th>
              <th style="text-align:right; padding:6px 10px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr style="border-top:2px solid var(--border); background:var(--bg-secondary); font-weight:700;">
              <td colspan="4" style="text-align:right; padding:8px 10px; color:var(--text-primary);">Grand Total</td>
              <td style="text-align:right; padding:8px 10px; color:var(--accent-gold); font-size:1rem;">₹${total.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${notes ? `<div style="font-size:0.8rem; padding:8px 12px; background:var(--bg-base); border-radius:var(--radius-md); border:1px solid var(--border); color:var(--text-secondary);"><strong>Remarks:</strong> ${notes}</div>` : ''}

      <div style="display:flex; gap:12px; margin-top:8px;">
        <button class="btn btn-secondary" style="flex:1;" id="back-to-edit-btn">Edit Cart</button>
        <button class="btn btn-primary" style="flex:1.5;" id="final-confirm-btn">Confirm & Book</button>
      </div>
    </div>
  `;
}

async function handlePlaceOrder() {
  if (!selectedShopId) {
    Toast.error('Please select a shop first');
    return;
  }
  if (cart.length === 0) {
    Toast.error('Your cart is empty');
    return;
  }

  const session = Store.getSession();
  if (!session) {
    Toast.error('Session expired. Please log in again.');
    return;
  }

  const shop = Store.getShopById(selectedShopId);
  const total = cartTotal();
  const notes = document.getElementById('order-notes')?.value?.trim() || '';
  const items = cart.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    qty: item.qty,
    subtotal: item.subtotal
  }));

  // Show order overview confirmation modal
  Modal.show({
    title: 'Order Confirmation Overview',
    content: renderOrderOverviewHtml(shop, items, total, notes),
    size: 'lg',
    hideFooter: true
  });

  // Back button
  const backBtn = document.getElementById('back-to-edit-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      Modal.hide();
    });
  }

  // Final confirmation
  const confirmBtn = document.getElementById('final-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      submitOrder('credit', 'unpaid', shop, items, total, notes, session);
    });
  }
}

function submitOrder(paymentMode, paymentStatus, shop, items, total, notes, session) {
  const order = Store.addOrder({
    shopId: selectedShopId,
    shopName: shop ? shop.name : '',
    staffId: session.user.id,
    staffName: session.user.name,
    firmId: firmId(),
    items,
    total,
    notes,
    paymentMode,
    paymentStatus
  });

  const isOffline = !navigator.onLine;
  if (isOffline) {
    Toast.info('⚡ Order saved offline! Will auto-sync when online.');
  } else {
    Toast.success('Order placed successfully!');
  }

  // Clear cart immediately so that duplicate submissions cannot occur
  clearCart();
  refreshAll();

  // Show success modal with navigation options
  Modal.show({
    title: isOffline ? '⚡ Order Placed Offline!' : 'Order Placed!',
    content: `
      <div style="text-align:center; padding:12px 0;">
        <div style="width:64px; height:64px; border-radius:50%; background:${isOffline ? 'rgba(245,158,11,0.2)' : 'var(--success-light)'}; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          <span class="material-icons-round" style="font-size:32px; color:${isOffline ? '#f59e0b' : 'var(--success)'};">${isOffline ? 'cloud_off' : 'check_circle'}</span>
        </div>
        <h3 style="margin-bottom:8px;">Order #${order.id.slice(-6).toUpperCase()}</h3>
        <p style="color:var(--text-secondary); margin-bottom:4px;">${shop ? shop.name : 'Unknown Shop'}</p>
        <p style="font-size:1.2rem; font-weight:700; color:var(--accent-gold); margin-bottom:4px;">₹${total.toLocaleString('en-IN')}</p>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:20px; text-transform:uppercase;">
          Payment Method: ${paymentMode === 'credit' ? 'Credit' : paymentMode === 'upi' ? 'UPI' : 'Cash'}
        </p>
        ${isOffline ? `<p style="font-size:0.8rem; color:#f59e0b; font-weight:600; margin-bottom:20px;">⚡ Saved locally — will auto-sync to database automatically when internet is available.</p>` : ''}
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-primary w-full" id="go-history-btn">
            <span class="material-icons-round">receipt_long</span>
            View Order History
          </button>
          <button class="btn btn-secondary w-full" id="new-order-btn">
            <span class="material-icons-round">add_shopping_cart</span>
            Take Another Order
          </button>
        </div>
      </div>
    `,
    hideFooter: true
  });

  // Bind success modal navigation buttons
  setTimeout(() => {
    const historyBtn = document.getElementById('go-history-btn');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        Modal.hide();
        window.location.hash = '#/staff/history';
      });
    }

    const newOrderBtn = document.getElementById('new-order-btn');
    if (newOrderBtn) {
      newOrderBtn.addEventListener('click', () => {
        Modal.hide();
        // Re-render this page
        const appRoot = document.getElementById('main-content') || document.querySelector('.main-content');
        if (appRoot) {
          appRoot.innerHTML = render();
          init();
        }
      });
    }
  }, 100);
}
