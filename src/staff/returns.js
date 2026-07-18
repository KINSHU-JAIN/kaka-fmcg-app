// ============================================
// Staff — Sales Returns
// ============================================

import { Store } from '../data/store.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

function getFirmId() { return window.__currentFirm || 'firm_ka'; }
function formatCurrency(n) { return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function getLocalReturns() {
  try { return JSON.parse(localStorage.getItem('kaka_returns') || '[]'); } catch { return []; }
}
function addLocalReturn(ret) {
  const returns = getLocalReturns();
  returns.push(ret);
  localStorage.setItem('kaka_returns', JSON.stringify(returns));
}

function statusBadge(status) {
  const map = { pending: ['#f59e0b', 'Pending'], approved: ['var(--success)', 'Approved'], rejected: ['var(--danger)', 'Rejected'] };
  const [color, label] = map[status] || ['#888', status];
  return `<span style="background:${color}22; color:${color}; border-radius:100px; padding:3px 10px; font-size:0.75rem; font-weight:600;">${label}</span>`;
}

export function render() {
  const session = Store.getSession();
  if (!session) return '';
  const staffId = session.user.id;
  const firmId = getFirmId();

  const allOrders = Store.getOrders({ firmId, staffId });
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered');

  let myReturns = [];
  try { myReturns = Store.getReturns({ firmId, staffId }); } catch {}
  if (!myReturns || myReturns.length === 0) {
    myReturns = getLocalReturns().filter(r => r.staffId === staffId && r.firmId === firmId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return `
    <div style="display:flex; flex-direction:column; gap:24px;">

      <div class="card">
        <div style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          <span class="material-icons-round" style="color:var(--accent-gold);">assignment_return</span>
          My Return Requests
        </div>
        ${myReturns.length === 0 ?
          `<div class="empty-state" style="padding:20px 0;">
            <div class="empty-state-icon"><span class="material-icons-round">receipt_long</span></div>
            <h3>No Returns Yet</h3>
            <p>Raise a return from a delivered order below.</p>
          </div>` :
          `<div style="display:flex; flex-direction:column; gap:10px;">
            ${myReturns.map(ret => `
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:12px 14px; border:1px solid var(--border);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                  <div>
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${ret.shopName}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Return #${ret.id.slice(-6).toUpperCase()} · ${formatDate(ret.createdAt)}</div>
                  </div>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-weight:700; color:var(--danger);">${formatCurrency(ret.total)}</div>
                    ${statusBadge(ret.status)}
                  </div>
                </div>
                ${ret.reason ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">Reason: ${ret.reason}</div>` : ''}
              </div>`).join('')}
          </div>`}
      </div>

      <div class="card">
        <div style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          <span class="material-icons-round" style="color:var(--text-muted);">inventory</span>
          Delivered Orders — Raise a Return
        </div>
        ${deliveredOrders.length === 0 ?
          `<div class="empty-state" style="padding:20px 0;">
            <div class="empty-state-icon"><span class="material-icons-round">local_shipping</span></div>
            <h3>No Delivered Orders</h3>
            <p>Returns can only be raised against delivered orders.</p>
          </div>` :
          `<div style="display:flex; flex-direction:column; gap:10px;">
            ${deliveredOrders.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(order => {
              const alreadyReturned = myReturns.some(r => r.orderId === order.id && r.status !== 'rejected');
              return `
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:12px 14px; border:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                <div>
                  <div style="font-weight:700; color:var(--text-primary);">${order.shopName}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">#${order.id.slice(-6).toUpperCase()} · ${formatDate(order.createdAt)} · ${(order.items||[]).length} items · ${formatCurrency(order.total)}</div>
                </div>
                ${alreadyReturned ?
                  `<span style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">Return raised</span>` :
                  `<button class="btn btn-secondary btn-sm raise-return-btn" data-order-id="${order.id}" style="font-size:0.82rem; flex-shrink:0;">
                    <span class="material-icons-round" style="font-size:15px;">assignment_return</span> Raise Return
                  </button>`}
              </div>`;
            }).join('')}
          </div>`}
      </div>

    </div>`;
}

export function init() {
  document.querySelectorAll('.raise-return-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.orderId;
      const session = Store.getSession();
      const order = Store.getOrderById(orderId);
      if (!order) return;

      const items = order.items || [];

      const content = `
        <div style="margin-bottom:14px;">
          <div style="font-size:0.85rem; color:var(--text-muted);">Order from <strong style="color:var(--text-primary);">${order.shopName}</strong> · ${formatDate(order.createdAt)}</div>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:0.82rem; font-weight:600; color:var(--text-muted); margin-bottom:8px;">Select items to return:</div>
          <div style="display:flex; flex-direction:column; gap:8px;" id="return-items-list">
            ${items.map((item, i) => `
              <div style="background:var(--bg-base); border-radius:var(--radius-md); padding:10px 12px;">
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                  <input type="checkbox" class="return-item-check" data-index="${i}" data-price="${item.price}" data-name="${encodeURIComponent(item.name)}" data-product-id="${item.productId||''}" style="accent-color:var(--accent-gold); width:16px; height:16px; flex-shrink:0;" />
                  <div style="flex:1;">
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${item.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Ordered: ${item.qty} × ${formatCurrency(item.price)}</div>
                  </div>
                </label>
                <div class="return-qty-row" data-index="${i}" style="display:none; margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">
                  <label style="font-size:0.78rem; color:var(--text-muted);">Return Qty (max ${item.qty}):</label>
                  <input type="number" class="form-input return-qty-input" data-index="${i}" data-max="${item.qty}" value="${item.qty}" min="1" max="${item.qty}"
                    style="width:100px; padding:6px 8px; margin-top:4px;" />
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Reason for Return <span style="color:var(--danger);">*</span></label>
          <textarea class="form-input" id="return-reason" rows="3" placeholder="e.g. Damaged goods, Wrong items delivered..."></textarea>
        </div>
        <div id="return-total-display" style="text-align:right; font-size:0.9rem; color:var(--accent-gold); font-weight:700; margin-top:8px;"></div>`;

      Modal.show({
        title: 'Raise Sales Return',
        content,
        confirmText: 'Submit Return',
        onConfirm: () => {
          const reason = document.getElementById('return-reason').value.trim();
          if (!reason) { Toast.error('Please enter a reason for the return'); return; }

          const selectedItems = [];
          document.querySelectorAll('.return-item-check:checked').forEach(chk => {
            const idx = parseInt(chk.dataset.index);
            const qtyInput = document.querySelector(`.return-qty-input[data-index="${idx}"]`);
            const qty = qtyInput ? Math.min(parseInt(qtyInput.value) || 1, items[idx].qty) : items[idx].qty;
            const price = parseFloat(chk.dataset.price);
            selectedItems.push({
              productId: chk.dataset.productId || '',
              name: decodeURIComponent(chk.dataset.name),
              price,
              qty,
              subtotal: price * qty
            });
          });

          if (selectedItems.length === 0) { Toast.error('Select at least one item to return'); return; }

          const total = selectedItems.reduce((s, i) => s + i.subtotal, 0);
          const returnObj = {
            id: uid(),
            orderId: order.id,
            shopId: order.shopId,
            shopName: order.shopName,
            staffId: session.user.id,
            staffName: session.user.name,
            firmId: getFirmId(),
            items: selectedItems,
            total,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
          };

          try { Store.addReturn(returnObj); } catch {}
          addLocalReturn(returnObj);

          Modal.hide();
          Toast.success('Return request submitted!');
          document.getElementById('page-body').innerHTML = render();
          init();
        }
      });

      setTimeout(() => {
        document.querySelectorAll('.return-item-check').forEach(chk => {
          chk.addEventListener('change', () => {
            const idx = chk.dataset.index;
            const qtyRow = document.querySelector(`.return-qty-row[data-index="${idx}"]`);
            if (qtyRow) qtyRow.style.display = chk.checked ? 'block' : 'none';
            updateReturnTotal();
          });
        });
        document.querySelectorAll('.return-qty-input').forEach(inp => {
          inp.addEventListener('input', updateReturnTotal);
        });
        function updateReturnTotal() {
          let total = 0;
          document.querySelectorAll('.return-item-check:checked').forEach(chk => {
            const idx = chk.dataset.index;
            const price = parseFloat(chk.dataset.price);
            const qtyInp = document.querySelector(`.return-qty-input[data-index="${idx}"]`);
            const qty = qtyInp ? (parseInt(qtyInp.value) || 0) : 1;
            total += price * qty;
          });
          const display = document.getElementById('return-total-display');
          if (display) display.textContent = total > 0 ? `Return Total: ${formatCurrency(total)}` : '';
        }
      }, 50);
    });
  });
}
