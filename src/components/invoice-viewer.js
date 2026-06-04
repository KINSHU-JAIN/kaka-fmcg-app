import { Store } from '../data/store.js';

export function render() {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const urlParams = new URLSearchParams(queryString);
  const orderId = urlParams.get('id');

  if (!orderId) {
    return renderError('Missing Order ID', 'No order ID was provided in the link.');
  }

  const order = Store.getOrderById(orderId);
  if (!order) {
    return renderError('Order Not Found', `We couldn't find an order matching ID: ${orderId.slice(0, 8)}...`);
  }

  const shop = Store.getShopById(order.shopId);
  const staff = Store.getStaffById(order.staffId);
  const firm = Store.getFirmById(order.firmId) || { name: 'Kaka FMCG', type: 'FMCG Distribution', address: 'Main Bazar', phone: '', phone2: '' };
  const items = order.items || [];

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const timeStr = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const upiId = order.firmId === 'firm_km' ? 'kakamarketing@upi' : 'kakaagencies@upi';
  const upiName = encodeURIComponent(firm.name || 'Kaka FMCG');
  const upiUri = `upi://pay?pa=${upiId}&pn=${upiName}&am=${order.total}&cu=INR&tn=Kaka%20Invoice%20${order.id.slice(-6).toUpperCase()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  const itemRows = items.map((item, index) => `
    <tr>
      <td style="text-align: center;">${index + 1}</td>
      <td style="font-weight: 500;">${item.name}</td>
      <td style="text-align: center;">${item.qty}</td>
      <td style="text-align: right;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
      <td style="text-align: right; font-weight: 600;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const showUpiPayment = order.paymentStatus === 'unpaid' && (order.paymentMode === 'upi' || order.paymentMode === 'credit');

  return `
    <div class="invoice-viewer-wrapper" style="min-height: 100vh; background-color: var(--bg-base); padding: 40px 20px; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; justify-content: center;">
      
      <!-- Top Action Bar -->
      <div class="invoice-actions no-print" style="width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 8px; font-weight: 600;" onclick="window.location.hash='#/login'">
          <span class="material-icons-round" style="font-size: 18px;">login</span>
          Employee Login
        </button>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 8px; font-weight: 600;" onclick="window.print()">
            <span class="material-icons-round" style="font-size: 18px;">print</span>
            Print Invoice
          </button>
          ${showUpiPayment ? `
            <a href="${upiUri}" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px; font-weight: 600; text-decoration: none;">
              <span class="material-icons-round" style="font-size: 18px;">payment</span>
              Pay via UPI App
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Main Container (Responsive Grid) -->
      <div class="invoice-container-grid" style="width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Printable Invoice Sheet -->
        <div class="invoice-sheet card" style="background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-lg); padding: 40px; position: relative; overflow: hidden;">
          
          <!-- Decorative firm bar -->
          <div style="height: 6px; width: 100%; background: var(--theme-gradient); position: absolute; top: 0; left: 0;"></div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--text-primary); padding-bottom: 24px; margin-bottom: 24px; flex-wrap: wrap; gap: 20px;">
            <div>
              <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: -0.5px; font-family: var(--font-heading);">${firm.name}</h1>
              <p style="font-size: 13px; font-weight: 600; color: var(--text-muted); margin: 3px 0;">${firm.type}</p>
              <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0; max-width: 320px; line-height: 1.4;">${firm.address}</p>
              <p style="font-size: 12px; color: var(--text-muted); margin: 6px 0 0 0;"><strong>Phone:</strong> ${firm.phone} ${firm.phone2 ? `&nbsp;|&nbsp; ${firm.phone2}` : ''}</p>
            </div>
            <div style="text-align: right; min-width: 180px;">
              <h2 style="font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px 0; letter-spacing: 1px; font-family: var(--font-heading);">INVOICE</h2>
              <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                <strong>Invoice #:</strong> #${order.id.slice(-6).toUpperCase()}<br>
                <strong>Date:</strong> ${dateStr}<br>
                <strong>Time:</strong> ${timeStr}<br>
                <strong>Status:</strong> <span style="font-weight: 700; color: ${order.status === 'cancelled' ? 'var(--danger)' : order.status === 'delivered' ? 'var(--success)' : 'var(--accent-gold)'};">${order.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <!-- Billed to & Details -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 30px;">
            <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; background: var(--bg-base);">
              <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 6px; letter-spacing: 0.5px;">Billed To</h3>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary);"><strong>Shop Name:</strong> ${shop ? shop.name : order.shopName || 'Unknown Shop'}</p>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary);"><strong>Proprietor:</strong> ${shop ? shop.ownerName : '—'}</p>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;"><strong>Address:</strong> ${shop ? shop.address : '—'}</p>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary);"><strong>Phone:</strong> ${shop ? shop.phone : '—'}</p>
            </div>
            <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; background: var(--bg-base);">
              <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 6px; letter-spacing: 0.5px;">Order Details</h3>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary);"><strong>Sales Agent:</strong> ${staff ? staff.name : 'Admin'}</p>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary);"><strong>Payment Mode:</strong> ${order.paymentMode === 'credit' ? 'Credit / Outstanding' : order.paymentMode === 'upi' ? 'UPI / Online QR' : 'Cash Collected'}</p>
              <p style="margin: 6px 0; font-size: 13px; color: var(--text-secondary);"><strong>Payment Status:</strong> <span style="font-weight: 700; color: ${order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--accent-gold)'};">${order.paymentStatus.toUpperCase()}</span></p>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: var(--bg-secondary); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
                <th style="width: 50px; text-align: center; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: var(--text-muted);">S.No.</th>
                <th style="text-align: left; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: var(--text-muted);">Product Name</th>
                <th style="width: 80px; text-align: center; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: var(--text-muted);">Qty</th>
                <th style="width: 100px; text-align: right; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: var(--text-muted);">Rate</th>
                <th style="width: 120px; text-align: right; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: var(--text-muted);">Amount</th>
              </tr>
            </thead>
            <tbody class="invoice-table-body">
              ${itemRows}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <table style="width: 280px; border: none;">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: var(--text-muted);">Subtotal:</td>
                <td style="padding: 6px 0; font-size: 13px; text-align: right; color: var(--text-secondary); font-weight: 500;">₹${((order.total || 0) - (order.penaltyAdded || 0)).toLocaleString('en-IN')}</td>
              </tr>
              ${order.penaltyAdded ? `
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: var(--text-muted);">Outstanding Penalty (₹50/day):</td>
                <td style="padding: 6px 0; font-size: 13px; text-align: right; color: var(--danger); font-weight: 500;">+₹${order.penaltyAdded.toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr style="font-weight: 800; font-size: 18px; border-top: 1.5px solid var(--text-primary); border-bottom: 1.5px solid var(--text-primary); color: var(--text-primary);">
                <td style="padding: 12px 0;">Grand Total:</td>
                <td style="padding: 12px 0; text-align: right;">₹${(order.total || 0).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <!-- Bottom message -->
          <div style="margin-top: 50px; text-align: center; border-top: 1px dashed var(--border); padding-top: 20px; font-size: 12px; color: var(--text-muted);">
            <p>Thank you for your business! Goods once sold will not be taken back.</p>
            <p style="font-size: 10px; color: var(--text-dim); margin-top: 6px;">System Generated Invoice · Kaka FMCG</p>
          </div>
        </div>

        <!-- UPI Payment Card (Unpaid Only) -->
        ${showUpiPayment ? `
          <div class="card no-print payment-box-card" style="background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-md); padding: 30px; display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="background: var(--accent-gold-light); width: 48px; height: 48px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; color: var(--accent-gold);">
              <span class="material-icons-round" style="font-size: 26px;">qr_code_2</span>
            </div>
            <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 6px 0; color: var(--text-primary);">Scan to Pay Outstanding Bill</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 20px 0; max-width: 380px;">Scan the QR code using Google Pay, PhonePe, Paytm or any BHIM UPI app to pay ₹${(order.total || 0).toLocaleString('en-IN')}</p>
            
            <div style="background: #ffffff; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); margin-bottom: 16px;">
              <img src="${qrUrl}" alt="Payment UPI QR Code" style="width: 160px; height: 160px; display: block;" />
            </div>
            
            <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 20px;">
              UPI VPA: <span style="font-family: monospace; color: var(--text-primary); font-size: 13px;">${upiId}</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px;">
              <a href="${upiUri}" class="btn btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; text-decoration: none; padding: 12px;">
                <span class="material-icons-round">payment</span>
                Pay via Mobile UPI App
              </a>
              <div style="font-size: 11px; color: var(--text-dim);">
                (Clicking the button will open BHIM, GPay, or PhonePe directly on your phone)
              </div>
            </div>
          </div>
        ` : ''}

      </div>
    </div>
    
    <style>
      @media print {
        body {
          background: #ffffff !important;
          color: #000000 !important;
        }
        .invoice-viewer-wrapper {
          padding: 0 !important;
          background: #ffffff !important;
        }
        .invoice-sheet {
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
      .invoice-table-body td {
        border-bottom: 1px solid var(--border-light);
        padding: 12px 8px;
        font-size: 13px;
        color: var(--text-secondary);
      }
    </style>
  `;
}

function renderError(title, desc) {
  return `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;font-family:var(--font-body);background-color:var(--bg-base);padding:20px;text-align:center;">
      <span class="material-icons-round" style="font-size:64px;color:var(--danger);margin-bottom:16px;">error_outline</span>
      <h2 style="color:var(--text-primary);font-size:24px;font-weight:700;margin:0 0 8px 0;">${title}</h2>
      <p style="color:var(--text-muted);font-size:14px;margin:0 0 24px 0;max-width:320px;line-height:1.5;">${desc}</p>
      <button class="btn btn-primary" onclick="window.location.hash='#/login'">
        Go to Login
      </button>
    </div>
  `;
}

export function init() {
  // Any interactive behaviors on the public page
}
