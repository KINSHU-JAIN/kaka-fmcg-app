// ============================================
// Admin Companies Module
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

function getFirmId() {
  return window.__currentFirm || 'firm_ka';
}

function getProductCount(companyId) {
  return Store.getProducts({ companyId }).length;
}

function renderCompanyRow(company) {
  const productCount = getProductCount(company.id);
  return `
    <tr>
      <td style="font-size:1.5rem; text-align:center; width:50px">${company.icon || '📦'}</td>
      <td class="table-cell-main">${company.name}</td>
      <td>
        <span class="badge badge-info">${productCount}</span>
      </td>
      <td>
        ${company.isActive !== false
          ? '<span class="badge badge-success">Active</span>'
          : '<span class="badge badge-danger">Inactive</span>'}
      </td>
      <td>
        <div class="btn-group">
          <button class="btn-icon company-edit-btn" data-id="${company.id}" title="Edit">
            <span class="material-icons-round" style="font-size:18px">edit</span>
          </button>
          <button class="btn-icon company-delete-btn" data-id="${company.id}" title="Delete" style="color:var(--danger)">
            <span class="material-icons-round" style="font-size:18px">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function getCompanyFormHtml(company = null) {
  return `
    <div class="form-group">
      <label class="form-label">Company Name</label>
      <input type="text" class="form-input" id="company-name" placeholder="e.g. Hindustan Unilever"
        value="${company ? company.name : ''}" required />
    </div>
    <div class="form-group">
      <label class="form-label">Icon (Emoji)</label>
      <input type="text" class="form-input" id="company-icon" placeholder="e.g. 🧴"
        value="${company ? company.icon || '' : ''}" maxlength="4" />
      <span class="form-hint">Paste an emoji or type a short icon character</span>
    </div>
  `;
}

export function render() {
  const firmId = getFirmId();
  const companies = Store.getCompanies(firmId);

  return `
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">
          <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; font-size:20px">business</span>
          Companies (${companies.length})
        </h3>
        <button class="btn btn-primary" id="add-company-btn">
          <span class="material-icons-round">add</span>
          Add Company
        </button>
      </div>
      ${companies.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width:50px">Icon</th>
            <th>Name</th>
            <th>Products</th>
            <th>Status</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${companies.map(c => renderCompanyRow(c)).join('')}
        </tbody>
      </table>
      ` : `
      <div class="empty-state">
        <div class="empty-state-icon">
          <span class="material-icons-round">business</span>
        </div>
        <h3>No companies yet</h3>
        <p>Add your first company to start managing products.</p>
        <button class="btn btn-primary" id="empty-add-company-btn">
          <span class="material-icons-round">add</span>
          Add Company
        </button>
      </div>
      `}
    </div>
  `;
}

function showCompanyModal(company = null) {
  const isEdit = !!company;
  Modal.show({
    title: isEdit ? 'Edit Company' : 'Add Company',
    content: getCompanyFormHtml(company),
    confirmText: isEdit ? 'Update' : 'Add Company',
    onConfirm: () => {
      const name = document.getElementById('company-name').value.trim();
      const icon = document.getElementById('company-icon').value.trim() || '📦';

      if (!name) {
        Toast.error('Company name is required');
        return;
      }

      if (isEdit) {
        Store.updateCompany(company.id, { name, icon });
        Toast.success(`${name} updated`);
      } else {
        Store.addCompany({ firmId: getFirmId(), name, icon });
        Toast.success(`${name} added`);
      }
      Modal.hide();
      reRender();
    }
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
  // Add company button
  const addBtn = document.getElementById('add-company-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showCompanyModal());
  }

  // Empty state add button
  const emptyAddBtn = document.getElementById('empty-add-company-btn');
  if (emptyAddBtn) {
    emptyAddBtn.addEventListener('click', () => showCompanyModal());
  }

  // Edit buttons
  document.querySelectorAll('.company-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const company = Store.getCompanyById(btn.dataset.id);
      if (company) showCompanyModal(company);
    });
  });

  // Delete buttons
  document.querySelectorAll('.company-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const company = Store.getCompanyById(btn.dataset.id);
      if (!company) return;
      const productCount = getProductCount(company.id);
      const warning = productCount > 0
        ? `This will also delete ${productCount} product${productCount !== 1 ? 's' : ''} under this company.`
        : '';
      const confirmed = await Modal.confirm(
        `Are you sure you want to delete "${company.name}"? ${warning}`
      );
      if (confirmed) {
        Store.deleteCompany(company.id);
        Toast.success(`${company.name} deleted`);
        reRender();
      }
    });
  });
}
