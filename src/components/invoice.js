// ============================================
// Printable Invoice Helper
// ============================================

import { Store } from '../data/store.js';

export function printInvoice(order) {
  const shop = Store.getShopById(order.shopId);
  const staff = Store.getStaffById(order.staffId);
  const firm = Store.getFirmById(order.firmId);
  const items = order.items || [];

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to print invoices.');
    return;
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const timeStr = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const itemRows = items.map((item, index) => {
    const subtotal = item.price * item.qty;
    return `
      <tr>
        <td style="text-align: center; border: 1px solid #ddd; padding: 10px 8px; font-size: 13px;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 10px 8px; font-size: 13px; font-weight: 500;">${item.name}</td>
        <td style="text-align: center; border: 1px solid #ddd; padding: 10px 8px; font-size: 13px;">${item.qty}</td>
        <td style="text-align: right; border: 1px solid #ddd; padding: 10px 8px; font-size: 13px;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
        <td style="text-align: right; border: 1px solid #ddd; padding: 10px 8px; font-size: 13px; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.id.slice(-6).toUpperCase()}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 30px;
          color: #1e293b;
          background-color: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .firm-info {
          flex: 1;
        }
        .firm-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }
        .firm-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 3px 0;
          line-height: 1.4;
        }
        .invoice-info {
          text-align: right;
          flex-shrink: 0;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px 0;
          letter-spacing: 1px;
        }
        .invoice-meta {
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          margin-bottom: 30px;
        }
        .details-box {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          background: #f8fafc;
        }
        .details-box h3 {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .details-box p {
          margin: 6px 0;
          font-size: 13px;
          line-height: 1.5;
          color: #334155;
        }
        .details-box p strong {
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 12px 10px;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.5px;
        }
        .totals-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-table {
          width: 300px;
          margin: 0;
          border: none;
        }
        .totals-table td {
          padding: 8px 12px;
          font-size: 14px;
          color: #475569;
        }
        .totals-table tr.total-row td {
          font-weight: 800;
          font-size: 18px;
          border-top: 2px solid #0f172a;
          border-bottom: 2px solid #0f172a;
          color: #0f172a;
          padding: 12px;
        }
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 80px;
          padding: 0 10px;
        }
        .signature-box {
          width: 220px;
          border-top: 1.5px solid #0f172a;
          text-align: center;
          padding-top: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
        }
        .footer {
          margin-top: 60px;
          font-size: 12px;
          text-align: center;
          color: #94a3b8;
          border-top: 1px dashed #e2e8f0;
          padding-top: 20px;
        }
        .print-btn-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        .print-btn {
          background-color: #0f172a;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .print-btn:hover {
          background-color: #1e293b;
          transform: translateY(-2px);
        }
        @media print {
          body {
            padding: 0;
          }
          .print-btn-container {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-container">
        <button class="print-btn" onclick="window.print()">
          Print Invoice
        </button>
      </div>

      <div class="header">
        <div class="firm-info">
          <h1 class="firm-title">${firm.name}</h1>
          <p class="firm-subtitle" style="font-weight: 600; color: #475569;">${firm.type}</p>
          <p class="firm-subtitle">${firm.address}</p>
          <p class="firm-subtitle"><strong>Phone:</strong> ${firm.phone} &nbsp;|&nbsp; ${firm.phone2}</p>
        </div>
        <div class="invoice-info">
          <h2 class="invoice-title">INVOICE</h2>
          <div class="invoice-meta">
            <strong>Invoice #:</strong> #${order.id.slice(-6).toUpperCase()}<br>
            <strong>Date:</strong> ${dateStr}<br>
            <strong>Time:</strong> ${timeStr}<br>
            <strong>Status:</strong> <span style="font-weight: 700; color: ${order.status === 'cancelled' ? '#ef4444' : order.status === 'delivered' ? '#10b981' : '#f59e0b'};">${order.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div class="details-grid">
        <div class="details-box">
          <h3>Billed To (Customer)</h3>
          <p><strong>Shop Name:</strong> ${shop ? shop.name : order.shopName || 'Unknown Shop'}</p>
          <p><strong>Proprietor:</strong> ${shop ? shop.ownerName : '—'}</p>
          <p><strong>Address:</strong> ${shop ? shop.address : '—'}</p>
          <p><strong>Phone:</strong> ${shop ? shop.phone : '—'}</p>
        </div>
        <div class="details-box">
          <h3>Order & Dispatch Details</h3>
          <p><strong>Sales Representative:</strong> ${staff ? staff.name : 'Admin'}</p>
          <p><strong>Supply Source:</strong> ${firm.name}</p>
          <p><strong>Payment Mode:</strong> ${order.paymentMode === 'credit' ? 'Credit / Outstanding' : order.paymentMode === 'upi' ? 'UPI / Online QR' : 'Cash Collected'}</p>
          <p><strong>Payment Status:</strong> <span style="font-weight: 700; color: ${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};">${order.paymentStatus.toUpperCase()}</span></p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">S.No.</th>
            <th style="text-align: left;">Product Name</th>
            <th style="width: 90px; text-align: center;">Qty</th>
            <th style="width: 110px; text-align: right;">Rate</th>
            <th style="width: 130px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="totals-container">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right; font-weight: 500;">₹${((order.total || 0) - (order.penaltyAdded || 0)).toLocaleString('en-IN')}</td>
          </tr>
          ${order.penaltyAdded ? `
          <tr>
            <td>Unpaid Penalty (₹50/day):</td>
            <td style="text-align: right; font-weight: 500; color: #ef4444;">+₹${order.penaltyAdded.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${(order.total || 0).toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>

      <div class="signature-row">
        <div class="signature-box">
          Customer's Signature
        </div>
        <div class="signature-box">
          For <strong>${firm.name}</strong><br>
          <span style="font-size: 11px; color: #64748b; font-weight: normal;">(Authorized Signatory)</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business! Goods once sold will not be taken back.</p>
        <p style="font-size: 10px; color: #cbd5e1; margin-top: 10px;">System Generated Invoice · Kaka FMCG</p>
      </div>

      <script>
        window.onload = function() {
          // Delay print slightly to ensure font loading
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function getWhatsAppShareUrl(order) {
  const shop = Store.getShopById(order.shopId);
  const firm = Store.getFirmById(order.firmId);
  const items = order.items || [];
  
  const phone = shop?.phone || order.shopPhone || '';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  // Base URL for our online printable invoice
  const onlineInvoiceUrl = `${window.location.origin}${window.location.pathname}#/invoice?id=${order.id}`;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  
  const itemsText = items.map((item) => {
    return `• ${item.name} (${item.qty} units) - ₹${(item.price * item.qty).toLocaleString('en-IN')}`;
  }).join('\n');

  const paymentTerms = order.paymentMode === 'credit' 
    ? 'Credit / Outstanding (Please settle early to avoid ₹50/day penalty)' 
    : order.paymentMode === 'upi' ? 'UPI / Online' : 'Cash Collected';

  const message = `*INVOICE* - *${firm?.name || 'Kaka FMCG'}*\n` +
    `-----------------------------------\n` +
    `*Invoice #:* #${order.id.slice(-6).toUpperCase()}\n` +
    `*Date:* ${dateStr}\n` +
    `*Billed To:* ${shop?.name || 'Customer'}\n` +
    `-----------------------------------\n` +
    `*Items:*\n${itemsText}\n` +
    `-----------------------------------\n` +
    `*Total Amount:* ₹${(order.total || 0).toLocaleString('en-IN')}\n` +
    `*Payment Mode:* ${paymentTerms}\n` +
    `*Payment Status:* ${order.paymentStatus.toUpperCase()}\n` +
    `-----------------------------------\n` +
    `View/Print Invoice & Pay Online: ${onlineInvoiceUrl}\n\n` +
    `Thank you for your business!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
