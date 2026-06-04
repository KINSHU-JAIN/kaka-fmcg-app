// ============================================
// Admin Products Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { printCatalog } from '../components/catalog.js';

const UNITS = ['piece', 'pack', 'bottle', 'tube', 'jar', 'can', 'box', 'kg', 'strip', 'tub', 'cup', 'bar', 'tin'];

let currentSearch = '';
let currentCompanyFilter = '';

function getFirmId() {
  return window.__currentFirm || 'firm_ka';
}

function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
}

function getProductFormHtml(product = null) {
  const firmId = getFirmId();
  const companies = Store.getCompanies(firmId);

  return `
    <div class="form-group">
      <label class="form-label">Product Name</label>
      <input type="text" class="form-input" id="prod-name" placeholder="e.g. Surf Excel Easy Wash 1kg"
        value="${product ? product.name : ''}" required />
    </div>
    <div class="form-group">
      <label class="form-label">Company</label>
      <select class="form-select" id="prod-company" required>
        <option value="">Select Company</option>
        ${companies.map(c => `
          <option value="${c.id}" ${product && product.companyId === c.id ? 'selected' : ''}>
            ${c.name}
          </option>
        `).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">MRP (₹)</label>
        <input type="number" class="form-input" id="prod-mrp" placeholder="0" min="0" step="0.01"
          value="${product ? product.mrp : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Selling Price (₹)</label>
        <input type="number" class="form-input" id="prod-selling" placeholder="0" min="0" step="0.01"
          value="${product ? product.sellingPrice : ''}" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-select" id="prod-unit">
          ${UNITS.map(u => `
            <option value="${u}" ${product && product.unit === u ? 'selected' : ''}>${u.charAt(0).toUpperCase() + u.slice(1)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Stock</label>
        <input type="number" class="form-input" id="prod-stock" placeholder="0" min="0"
          value="${product ? product.stock : '0'}" />
      </div>
    </div>
    
    <!-- Bulk Tiers -->
    <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <label class="form-label" style="margin-bottom:0;">Bulk Pricing Tiers</label>
        <button type="button" class="btn btn-secondary btn-sm" id="add-tier-row-btn" style="padding:4px 10px; font-size:0.75rem;">
          <span class="material-icons-round" style="font-size:14px;">add</span> Add Price Tier
        </button>
      </div>
      <div id="tier-rows-container" style="display:flex; flex-direction:column; gap:8px;">
        ${(product?.tierPrices || []).map((t, idx) => `
          <div class="tier-row" style="display:flex; gap:12px; align-items:center;">
            <div style="flex:1;">
              <input type="number" class="form-input tier-min-qty" placeholder="Min Quantity (e.g. 10)" value="${t.minQty}" min="2" required />
            </div>
            <div style="flex:1;">
              <input type="number" class="form-input tier-price" placeholder="Price per unit (₹)" value="${t.price}" min="0" step="0.01" required />
            </div>
            <button type="button" class="btn-icon remove-tier-row-btn" style="color:var(--danger); border-color:transparent; background:transparent; width:32px; height:32px;" title="Remove Tier">
              <span class="material-icons-round" style="font-size:18px;">delete</span>
            </button>
          </div>
        `).join('')}
      </div>
      <p id="no-tiers-msg" style="font-size:0.8rem; color:var(--text-dim); text-align:center; margin-top:8px; display:${(product?.tierPrices || []).length > 0 ? 'none' : 'block'};">
        No volume-tiered pricing configured.
      </p>
    </div>
  `;
}

function renderCompanyIcon(icon, size = '18px') {
  if (!icon) return '📦';
  if (icon.startsWith('/') || icon.startsWith('http')) {
    return `<img src="${icon}" style="width:${size}; height:${size}; object-fit:contain; vertical-align:middle; border-radius:3px; background:white; padding:2px; border:1px solid var(--border-light); margin-right:4px;" />`;
  }
  return icon + ' ';
}

function renderProductRow(product) {
  const company = Store.getCompanyById(product.companyId);
  const companyName = company ? company.name : 'Unknown';
  const isActive = product.isActive !== false;
  
  const tierCount = product.tierPrices ? product.tierPrices.length : 0;
  const tierInfo = tierCount > 0 
    ? `<div style="font-size:0.75rem; color:var(--accent-gold); margin-top:3px; display:flex; align-items:center; gap:4px;">
         <span class="material-icons-round" style="font-size:12px;">sell</span>
         ${tierCount} bulk tier${tierCount !== 1 ? 's' : ''}
       </div>`
    : '';

  return `
    <tr data-id="${product.id}">
      <td class="table-cell-main truncate" style="max-width:220px" title="${product.name}">
        <div>${product.name}</div>
        ${tierInfo}
      </td>
      <td class="truncate" style="max-width:150px; display:flex; align-items:center; gap:6px;">${company ? `${renderCompanyIcon(company.icon, '20px')} ${companyName}` : companyName}</td>
      <td>
        <span class="inline-edit-price" data-id="${product.id}" data-field="mrp" title="Click to edit">
          ${formatCurrency(product.mrp)}
        </span>
      </td>
      <td>
        <span class="inline-edit-price" data-id="${product.id}" data-field="sellingPrice" title="Click to edit">
          ${formatCurrency(product.sellingPrice)}
        </span>
      </td>
      <td>${product.unit || '—'}</td>
      <td>${product.stock ?? 0}</td>
      <td>
        <button class="btn btn-sm ${isActive ? 'btn-ghost' : 'btn-danger'} prod-toggle-btn" data-id="${product.id}" title="${isActive ? 'Deactivate' : 'Activate'}">
          ${isActive
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Inactive</span>'}
        </button>
      </td>
      <td>
        <div class="btn-group">
          <button class="btn-icon prod-edit-btn" data-id="${product.id}" title="Edit">
            <span class="material-icons-round" style="font-size:18px">edit</span>
          </button>
          <button class="btn-icon prod-delete-btn" data-id="${product.id}" title="Delete" style="color:var(--danger)">
            <span class="material-icons-round" style="font-size:18px">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

export function render() {
  const firmId = getFirmId();
  const companies = Store.getCompanies(firmId);

  const filters = { firmId };
  if (currentCompanyFilter) filters.companyId = currentCompanyFilter;
  if (currentSearch) filters.search = currentSearch;
  const products = Store.getProducts(filters);

  return `
    <!-- Toolbar -->
    <div class="flex gap-md mb-md" style="flex-wrap:wrap; align-items:center">
      <div class="search-bar">
        <span class="material-icons-round">search</span>
        <input type="text" id="prod-search" placeholder="Search products..." value="${currentSearch}" />
      </div>
      <button class="btn btn-primary" id="add-product-btn">
        <span class="material-icons-round">add</span>
        Add Product
      </button>
      <button class="btn btn-secondary" id="print-catalog-btn" style="display:inline-flex; align-items:center; gap:6px;">
        <span class="material-icons-round">picture_as_pdf</span>
        Download Catalog
      </button>
    </div>

    <!-- Company Filter Chips -->
    <div class="chips-row mb-md">
      <button class="chip ${!currentCompanyFilter ? 'active' : ''}" data-company="">All Companies</button>
      ${companies.map(c => `
        <button class="chip ${currentCompanyFilter === c.id ? 'active' : ''}" data-company="${c.id}" style="display:inline-flex; align-items:center; gap:6px;">
          ${renderCompanyIcon(c.icon, '16px')} ${c.name}
        </button>
      `).join('')}
    </div>

    <!-- Products Table -->
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">Products (${products.length})</h3>
      </div>
      ${products.length > 0 ? `
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Company</th>
              <th>MRP</th>
              <th>Selling Price</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Status</th>
              <th style="width:100px">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => renderProductRow(p)).join('')}
          </tbody>
        </table>
      </div>
      ` : `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">inventory_2</span>
        </div>
        <h3>No products found</h3>
        <p>${currentSearch || currentCompanyFilter ? 'Try adjusting your filters.' : 'Add your first product to get started.'}</p>
      </div>
      `}
    </div>
  `;
}

function showProductModal(product = null) {
  const isEdit = !!product;
  Modal.show({
    title: isEdit ? 'Edit Product' : 'Add Product',
    content: getProductFormHtml(product),
    confirmText: isEdit ? 'Update' : 'Add Product',
    size: 'lg',
    onConfirm: () => {
      const name = document.getElementById('prod-name').value.trim();
      const companyId = document.getElementById('prod-company').value;
      const mrp = parseFloat(document.getElementById('prod-mrp').value);
      const sellingPrice = parseFloat(document.getElementById('prod-selling').value);
      const unit = document.getElementById('prod-unit').value;
      const stock = parseInt(document.getElementById('prod-stock').value) || 0;

      if (!name) { Toast.error('Product name is required'); return; }
      if (!companyId) { Toast.error('Please select a company'); return; }
      if (isNaN(mrp) || mrp <= 0) { Toast.error('Enter a valid MRP'); return; }
      if (isNaN(sellingPrice) || sellingPrice <= 0) { Toast.error('Enter a valid selling price'); return; }

      // Read tier prices
      const tierPrices = [];
      let validTiers = true;
      document.querySelectorAll('#tier-rows-container .tier-row').forEach(row => {
        const minQty = parseInt(row.querySelector('.tier-min-qty').value);
        const price = parseFloat(row.querySelector('.tier-price').value);
        if (isNaN(minQty) || minQty < 2) {
          Toast.error('Tier minimum quantity must be at least 2');
          validTiers = false;
          return;
        }
        if (isNaN(price) || price <= 0 || price > mrp) {
          Toast.error('Tier price must be positive and less than or equal to MRP');
          validTiers = false;
          return;
        }
        tierPrices.push({ minQty, price });
      });

      if (!validTiers) return;

      // Sort tiers by quantity ascending
      tierPrices.sort((a, b) => a.minQty - b.minQty);

      if (isEdit) {
        Store.updateProduct(product.id, { name, companyId, mrp, sellingPrice, unit, stock, tierPrices });
        Toast.success(`${name} updated`);
      } else {
        Store.addProduct({ firmId: getFirmId(), companyId, name, mrp, sellingPrice, unit, stock, tierPrices });
        Toast.success(`${name} added`);
      }
      Modal.hide();
      reRender();
    }
  });

  // Bind dynamic add/remove tier rows
  const addTierBtn = document.getElementById('add-tier-row-btn');
  const container = document.getElementById('tier-rows-container');
  const noTiersMsg = document.getElementById('no-tiers-msg');

  if (addTierBtn && container) {
    addTierBtn.addEventListener('click', () => {
      if (noTiersMsg) noTiersMsg.style.display = 'none';

      const row = document.createElement('div');
      row.className = 'tier-row';
      row.style.cssText = 'display:flex; gap:12px; align-items:center;';
      row.innerHTML = `
        <div style="flex:1;">
          <input type="number" class="form-input tier-min-qty" placeholder="Min Quantity (e.g. 10)" min="2" required />
        </div>
        <div style="flex:1;">
          <input type="number" class="form-input tier-price" placeholder="Price per unit (₹)" min="0" step="0.01" required />
        </div>
        <button type="button" class="btn-icon remove-tier-row-btn" style="color:var(--danger); border-color:transparent; background:transparent; width:32px; height:32px;" title="Remove Tier">
          <span class="material-icons-round" style="font-size:18px;">delete</span>
        </button>
      `;

      // Bind remove button for this new row
      row.querySelector('.remove-tier-row-btn').addEventListener('click', () => {
        row.remove();
        if (container.children.length === 0 && noTiersMsg) {
          noTiersMsg.style.display = 'block';
        }
      });

      container.appendChild(row);
    });
  }

  // Bind existing remove buttons
  document.querySelectorAll('#tier-rows-container .remove-tier-row-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.tier-row').remove();
      if (container && container.children.length === 0 && noTiersMsg) {
        noTiersMsg.style.display = 'block';
      }
    });
  });
}

function startInlineEdit(el) {
  const productId = el.dataset.id;
  const field = el.dataset.field;
  const product = Store.getProductById(productId);
  if (!product) return;

  const currentValue = product[field];
  const originalHtml = el.innerHTML;

  el.innerHTML = `<input type="number" class="form-input" style="width:90px; padding:4px 8px; font-size:0.85rem"
    value="${currentValue}" min="0" step="0.01" />`;

  const input = el.querySelector('input');
  input.focus();
  input.select();

  const save = () => {
    const newValue = parseFloat(input.value);
    if (isNaN(newValue) || newValue < 0) {
      el.innerHTML = originalHtml;
      Toast.error('Invalid price');
      return;
    }
    Store.updateProduct(productId, { [field]: newValue });
    el.innerHTML = `₹${newValue.toLocaleString('en-IN')}`;
    Toast.success('Price updated');
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { el.innerHTML = originalHtml; }
  });
}

function reRender() {
  const pageBody = document.querySelector('.page-body');
  if (pageBody) {
    pageBody.innerHTML = render();
    init();
  }
}

export function init() {
  // Search
  const searchInput = document.getElementById('prod-search');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentSearch = e.target.value.trim();
        reRender();
      }, 300);
    });
  }

  // Company filter chips
  document.querySelectorAll('.chip[data-company]').forEach(chip => {
    chip.addEventListener('click', () => {
      currentCompanyFilter = chip.dataset.company;
      reRender();
    });
  });

  // Add product
  const addBtn = document.getElementById('add-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showProductModal());
  }

  // Print catalog
  const printCatalogBtn = document.getElementById('print-catalog-btn');
  if (printCatalogBtn) {
    printCatalogBtn.addEventListener('click', () => {
      printCatalog(getFirmId());
    });
  }

  // Inline price editing
  document.querySelectorAll('.inline-edit-price').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => startInlineEdit(el));
  });

  // Toggle active/inactive
  document.querySelectorAll('.prod-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = Store.getProductById(btn.dataset.id);
      if (!product) return;
      const newStatus = product.isActive === false ? true : false;
      Store.updateProduct(product.id, { isActive: newStatus });
      Toast.success(`${product.name} ${newStatus ? 'activated' : 'deactivated'}`);
      reRender();
    });
  });

  // Edit buttons
  document.querySelectorAll('.prod-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = Store.getProductById(btn.dataset.id);
      if (product) showProductModal(product);
    });
  });

  // Delete buttons
  document.querySelectorAll('.prod-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const product = Store.getProductById(btn.dataset.id);
      if (!product) return;
      const confirmed = await Modal.confirm(`Delete "${product.name}"? This cannot be undone.`);
      if (confirmed) {
        Store.deleteProduct(product.id);
        Toast.success(`${product.name} deleted`);
        reRender();
      }
    });
  });
}
