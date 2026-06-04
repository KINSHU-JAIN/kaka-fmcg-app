// ============================================
// Printable Product Catalog Helper
// ============================================

import { Store } from '../data/store.js';

export function printCatalog(firmId = 'firm_ka') {
  const firm = Store.getFirmById(firmId);
  const companies = Store.getCompanies(firmId).filter(c => c.isActive !== false);
  const products = Store.getProducts({ firmId, isActive: true });

  const printWindow = window.open('', '_blank', 'width=900,height=950');
  if (!printWindow) {
    alert('Please allow popups to download/print the product catalog.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // Group products by company
  const companySections = companies.map(company => {
    const companyProducts = products.filter(p => p.companyId === company.id);
    if (companyProducts.length === 0) return '';

    const productRows = companyProducts.map((p, idx) => {
      const tierPricesStr = p.tierPrices && p.tierPrices.length > 0
        ? p.tierPrices.map(t => `<div style="font-size: 11px; font-weight:600; color: #d97706;">${t.minQty}+ units @ ₹${t.price}</div>`).join('')
        : '<span style="color:#94a3b8; font-size:11px;">—</span>';

      return `
        <tr>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px; font-size: 12px;">${idx + 1}</td>
          <td style="border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; font-weight: 600; color:#1e293b;">${p.name}</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-transform: capitalize;">${p.unit}</td>
          <td style="text-align: right; border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-decoration: line-through; color: #94a3b8;">₹${p.mrp.toLocaleString('en-IN')}</td>
          <td style="text-align: right; border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; font-weight: 700; color:#0f172a;">₹${p.sellingPrice.toLocaleString('en-IN')}</td>
          <td style="border: 1px solid #e2e8f0; padding: 8px; font-size: 12px;">${tierPricesStr}</td>
        </tr>
      `;
    }).join('');

    // Logo image rendering logic
    let logoHtml = '';
    if (company.icon) {
      if (company.icon.startsWith('/') || company.icon.startsWith('http')) {
        logoHtml = `<img src="${company.icon}" style="height:36px; max-width:80px; object-fit:contain; background:white; padding:2px; border:1px solid #cbd5e1; border-radius:4px; margin-right:12px;" />`;
      } else {
        logoHtml = `<span style="font-size:28px; margin-right:12px;">${company.icon}</span>`;
      }
    }

    return `
      <div style="margin-bottom: 35px; page-break-inside: avoid;">
        <div style="display:flex; align-items:center; border-bottom: 2px solid #0f172a; padding-bottom:8px; margin-bottom:12px;">
          ${logoHtml}
          <h2 style="margin:0; font-size:18px; font-weight:800; color:#0f172a; text-transform:uppercase;">${company.name}</h2>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <thead>
            <tr>
              <th style="width: 50px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: 700; color:#475569; text-transform: uppercase;">S.No</th>
              <th style="text-align: left; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: 700; color:#475569; text-transform: uppercase;">Product Name</th>
              <th style="width: 90px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: 700; color:#475569; text-transform: uppercase;">Unit</th>
              <th style="width: 90px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: 700; color:#475569; text-transform: uppercase;">MRP</th>
              <th style="width: 110px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: 700; color:#475569; text-transform: uppercase;">Trade Rate</th>
              <th style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: 700; color:#475569; text-transform: uppercase;">Bulk Discount Tiers</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${firm.name} - Product Price List</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 40px;
          color: #1e293b;
          background-color: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 3px double #0f172a;
          padding-bottom: 16px;
          margin-bottom: 30px;
        }
        .firm-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }
        .firm-subtitle {
          font-size: 12px;
          color: #475569;
          margin: 0;
          font-weight: 500;
        }
        .catalog-title {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: 0.5px;
          text-align: right;
        }
        .catalog-date {
          font-size: 12px;
          color: #64748b;
          text-align: right;
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
          body { padding: 0; }
          .print-btn-container { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-container">
        <button class="print-btn" onclick="window.print()">
          Print / Save PDF
        </button>
      </div>

      <div class="header">
        <div>
          <h1 class="firm-title">${firm.name}</h1>
          <p class="firm-subtitle">${firm.type} &nbsp;·&nbsp; ${firm.phone}</p>
          <p class="firm-subtitle">${firm.address}</p>
        </div>
        <div>
          <h2 class="catalog-title">PRODUCT CATALOG</h2>
          <div class="catalog-date"><strong>Published on:</strong> ${dateStr}</div>
        </div>
      </div>

      <div>
        ${companySections || '<div style="text-align:center; padding:50px; color:#64748b;">No active products in catalog.</div>'}
      </div>

      <div style="margin-top:50px; border-top:1px dashed #cbd5e1; padding-top:15px; text-align:center; font-size:11px; color:#94a3b8; page-break-inside:avoid;">
        Prices are subject to market change. Please connect with your representative for orders.
        <p style="margin-top:4px; font-weight:600; color:#475569;">Generated via Kaka FMCG Distribution System</p>
      </div>

      <script>
        window.onload = function() {
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
