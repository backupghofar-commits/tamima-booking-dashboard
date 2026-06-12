import type { BookingData } from '../types';
import { calcRow, formatNumber } from './calc';
import { generateBookingQR, DocumentType } from './qrVerification';

/**
 * Helper: Generate HTML snippet untuk QR verification stamp
 * Returns inline HTML string siap inject ke template
 */
async function generateQRHTML(booking: BookingData, docType: DocumentType, size: number = 90): Promise<string> {
  try {
    const qr = await generateBookingQR(booking, docType, size * 2);
    return `
      <div style="display:inline-flex;flex-direction:column;align-items:center;border:2px solid #fdba74;border-radius:6px;padding:6px;background:linear-gradient(135deg,#fff7ed,#fffbeb)">
        <img src="${qr.qrCodeDataUrl}" alt="QR Verify ${qr.bookingRef}" width="${size}" height="${size}" style="display:block" />
        <div style="font-size:8px;font-weight:bold;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;text-align:center;line-height:1.2">
          📱 Scan to Verify
        </div>
        <div style="font-size:9px;font-family:monospace;font-weight:bold;color:#475569;text-align:center;line-height:1.2">
          ${qr.bookingRef}
        </div>
        <div style="font-size:7px;color:#94a3b8;text-align:center;line-height:1.2;margin-top:1px">
          tamimajaya.co.id/verify
        </div>
      </div>
    `;
  } catch (err) {
    console.warn('QR generation failed:', err);
    return '';
  }
}

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  dbl: 'Double Room',
  trp: 'Triple Room',
  qrd: 'Quadruple Room',
  qnt: 'Quintuple Room',
  bed: 'Extra Bed',
  ext: 'Extension Night',
};

const formatDateShort = (iso: string) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatDateLong = (iso: string) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

/**
 * Helper download HTML file
 */
function downloadHTML(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Common CSS shared across all HTML exports — Modern, responsive, OTA style
 */
const SHARED_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    background: #f1f5f9;
    color: #0f172a;
    padding: 20px;
    line-height: 1.5;
  }
  .container {
    max-width: 1000px;
    margin: 0 auto;
    background: white;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border-radius: 12px;
    overflow: hidden;
  }
  .header-bar {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    padding: 20px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .header-bar h1 { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
  .header-bar .subtitle { font-size: 12px; opacity: 0.9; margin-top: 4px; }
  .header-bar .ref { font-family: 'Courier New', monospace; font-size: 11px; opacity: 0.85; }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  .badge-success { background: #16a34a; color: white; }
  .badge-warning { background: #ca8a04; color: white; }
  .badge-danger { background: #dc2626; color: white; }
  .badge-info { background: #2563eb; color: white; }
  .content { padding: 28px; }
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #1e293b;
    border-left: 4px solid #f97316;
    padding-left: 10px;
    margin-bottom: 12px;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .info-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
  }
  .info-card-header {
    background: #1e293b;
    color: white;
    padding: 8px 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .info-card-header.orange { background: #ea580c; }
  .info-card-header.green { background: #059669; }
  .info-card-header.blue { background: #2563eb; }
  .info-card-table { width: 100%; font-size: 13px; }
  .info-card-table tr { border-bottom: 1px solid #e2e8f0; }
  .info-card-table tr:last-child { border-bottom: none; }
  .info-card-table tr:nth-child(even) { background: #f8fafc; }
  .info-card-table td { padding: 8px 14px; }
  .info-card-table .label { color: #64748b; width: 40%; }
  .info-card-table .value { font-weight: 600; color: #0f172a; }
  .stat-box {
    border: 2px solid;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
  }
  .stat-box.red { border-color: #dc2626; background: #fef2f2; color: #991b1b; }
  .stat-box.green { border-color: #16a34a; background: #f0fdf4; color: #15803d; }
  .stat-box.blue { border-color: #2563eb; background: #eff6ff; color: #1e40af; }
  .stat-box.amber { border-color: #d97706; background: #fffbeb; color: #92400e; }
  .stat-box.orange { border-color: #ea580c; background: #fff7ed; color: #c2410c; }
  .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85; }
  .stat-value { font-size: 18px; font-weight: 900; margin-top: 4px; }
  table.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.data-table thead tr { background: #1e293b; color: white; }
  table.data-table thead th {
    padding: 10px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  table.data-table tbody tr { border-bottom: 1px solid #e2e8f0; }
  table.data-table tbody tr:nth-child(even) { background: #f8fafc; }
  table.data-table tbody td { padding: 9px 10px; }
  table.data-table tfoot tr { background: #f97316; color: white; font-weight: 800; }
  table.data-table tfoot td { padding: 11px 10px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-mono { font-family: 'Courier New', monospace; }
  .footer-section {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 2px solid #1e293b;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    font-size: 12px;
  }
  .signature {
    text-align: center;
    padding: 10px;
  }
  .signature-stamp {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e40af;
    font-weight: bold;
    font-size: 28px;
  }
  .signature-name {
    border-top: 1px solid #475569;
    padding-top: 4px;
    font-weight: bold;
    margin-top: 4px;
  }
  .footer-bar {
    background: #1e293b;
    color: white;
    text-align: center;
    padding: 10px;
    font-size: 11px;
    letter-spacing: 1px;
    margin: 28px -28px -28px -28px;
  }
  .action-bar {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 12px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
  }
  .btn-print { background: #16a34a; color: white; }
  .btn-print:hover { background: #15803d; }
  .btn-back { background: #64748b; color: white; }
  @media print {
    body { background: white; padding: 0; }
    .container { box-shadow: none; max-width: 100%; border-radius: 0; }
    .action-bar { display: none !important; }
  }
  @media (max-width: 768px) {
    body { padding: 8px; }
    .content { padding: 16px; }
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .header-bar { flex-direction: column; align-items: flex-start; }
    .footer-section { grid-template-columns: 1fr; }
  }
`;

/**
 * 1. Export STATEMENT BOOKING (Customer view) as HTML
 */
export async function exportStatementHTML(data: BookingData) {
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  const docNum = `STMT-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  
  // 📱 Generate QR verification stamp
  const qrHTML = await generateQRHTML(data, 'statement', 90);
  const period = (() => {
    const refDate = data.checkIn ? new Date(data.checkIn) : new Date();
    const month = refDate.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
    return `${month}, ${refDate.getFullYear()}`;
  })();

  const activeRooms = (['dbl', 'trp', 'qrd', 'qnt', 'bed', 'ext'] as const)
    .filter(rt => Number(data.pemesan[rt].qty) > 0)
    .map(rt => ({
      label: ROOM_TYPE_LABELS[rt],
      qty: Number(data.pemesan[rt].qty) || 0,
      rate: Number(data.pemesan[rt].rate) || 0,
      subtotal: (Number(data.pemesan[rt].qty) || 0) * (Number(data.pemesan[rt].rate) || 0) * pemesanCalc.totalNight,
    }));

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statement Booking — ${safeStr(data.customerName)} — ${docNum}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="container">
    <!-- Action Bar -->
    <div class="action-bar">
      <div style="font-weight:700;color:#64748b;font-size:12px">📄 Statement Booking · Saved HTML Resource</div>
      <div>
        <button class="btn btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
      </div>
    </div>

    <!-- Header -->
    <div class="header-bar">
      <div>
        <h1>STATEMENT BOOKING AGENT</h1>
        <div class="subtitle">PT. TAMIMA JAYA WISATA oleh ${safeStr(data.customerName).toUpperCase() || '( Nama Customer )'}</div>
        <div class="subtitle"><strong>BULAN ${period}</strong></div>
      </div>
      <div style="text-align:right">
        <div class="badge badge-info">👤 STATEMENT CUSTOMER</div>
        <div class="ref" style="margin-top:6px">No: ${docNum}</div>
        <div class="ref">${new Date().toLocaleDateString('id-ID')}</div>
      </div>
    </div>

    <div class="content">
      <!-- Stats (4 kolom: Total, Paid, Balance SAR, Balance IDR) -->
      <div class="section" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;grid-template-columns:repeat(4,1fr)">
        <div class="stat-box green">
          <div class="stat-label">Total Tagihan</div>
          <div class="stat-value" style="font-size:14px">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</div>
          <div style="font-size:10px;font-weight:600;color:#059669;margin-top:2px">≈ SAR ${formatNumber(pemesanCalc.totalSAR)}</div>
        </div>
        <div class="stat-box blue">
          <div class="stat-label">Sudah Dibayar</div>
          <div class="stat-value" style="font-size:14px">IDR ${formatNumber(pemesanCalc.totalIDRMasuk)}</div>
          <div style="font-size:10px;font-weight:600;color:#2563eb;margin-top:2px">≈ SAR ${formatNumber(pemesanCalc.totalSARMasuk)}</div>
        </div>
        <div class="stat-box ${isLunas ? 'green' : 'amber'}" style="${isLunas ? '' : 'border-color:#ea580c;background:#fff7ed;color:#9a3412'}">
          <div class="stat-label">Balance (SAR)</div>
          <div class="stat-value" style="font-size:14px">${isLunas ? '✓ LUNAS' : 'SAR ' + formatNumber(pemesanCalc.sisaTagihanSAR)}</div>
          <div style="font-size:10px;font-weight:600;margin-top:2px;opacity:0.8">Mata Uang Asal</div>
        </div>
        <div class="stat-box ${isLunas ? 'green' : 'red'}">
          <div class="stat-label">${isLunas ? 'Status' : 'Sisa (IDR)'}</div>
          <div class="stat-value" style="font-size:14px">${isLunas ? '✓ LUNAS' : 'IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR)}</div>
          <div style="font-size:10px;font-weight:600;margin-top:2px;opacity:0.8">${isLunas ? '' : 'Kurs Est: ' + formatNumber(pemesanCalc.estKursRataRata)}</div>
        </div>
      </div>

      <!-- Booking Info -->
      <div class="section">
        <div class="section-title">📋 Informasi Booking</div>
        <div class="grid-2">
          <div class="info-card">
            <div class="info-card-header">Customer Information</div>
            <table class="info-card-table">
              <tr><td class="label">Customer</td><td class="value">${safeStr(data.customerName) || '-'}</td></tr>
              <tr><td class="label">Email</td><td class="value">${safeStr(data.customerEmail) || '-'}</td></tr>
              <tr><td class="label">Phone/WA</td><td class="value">${safeStr(data.customerPhone) || '-'}</td></tr>
              <tr><td class="label">Sales Person</td><td class="value">${safeStr(data.salesPerson) || '-'}</td></tr>
            </table>
          </div>
          <div class="info-card">
            <div class="info-card-header orange">Hotel & Stay Information</div>
            <table class="info-card-table">
              <tr><td class="label">Hotel</td><td class="value">${safeStr(data.hotelName) || '-'} ${data.hotelStars ? '★'.repeat(data.hotelStars) : ''}</td></tr>
              <tr><td class="label">Kota</td><td class="value">${safeStr(data.hotelCity) || '-'}</td></tr>
              <tr><td class="label">Periode</td><td class="value">${formatDateLong(data.checkIn)} → ${formatDateLong(data.checkOut)}</td></tr>
              <tr><td class="label">Durasi</td><td class="value">${pemesanCalc.totalNight} Malam</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Room Details -->
      <div class="section">
        <div class="section-title">🛏 Rincian Kamar</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipe Kamar</th>
              <th class="text-center">Qty</th>
              <th class="text-center">Nights</th>
              <th class="text-right">Rate/Night</th>
              <th class="text-right">Subtotal (SAR)</th>
            </tr>
          </thead>
          <tbody>
            ${activeRooms.length === 0 
              ? '<tr><td colspan="5" class="text-center" style="padding:20px;color:#94a3b8;font-style:italic">Tidak ada data kamar</td></tr>'
              : activeRooms.map(r => `
                <tr>
                  <td><strong>${r.label}</strong></td>
                  <td class="text-center">${r.qty}</td>
                  <td class="text-center">${pemesanCalc.totalNight}</td>
                  <td class="text-right text-mono">SAR ${formatNumber(r.rate)}</td>
                  <td class="text-right text-mono"><strong>SAR ${formatNumber(r.subtotal)}</strong></td>
                </tr>
              `).join('')
            }
            ${Number(data.pemesan.transport) > 0 ? `
              <tr style="background:#eff6ff">
                <td colspan="4"><strong>🚌 Transport (Ground)</strong></td>
                <td class="text-right text-mono"><strong>SAR ${formatNumber(Number(data.pemesan.transport))}</strong></td>
              </tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">GRAND TOTAL</td>
              <td class="text-right text-mono">SAR ${formatNumber(pemesanCalc.totalSAR)}</td>
            </tr>
            <tr style="background:#1e293b;color:white">
              <td colspan="4" class="text-right" style="font-size:11px">Equivalent in IDR</td>
              <td class="text-right text-mono">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Terms -->
      <div class="section">
        <div style="background:#fef3c7;border:1px solid #d97706;border-radius:8px;padding:14px;font-size:12px">
          <strong style="color:#92400e">📋 KETERANGAN & SYARAT:</strong>
          <ol style="margin:8px 0 0 20px;line-height:1.7">
            <li>Tagihan ini berlaku berdasarkan kurs SAR ke IDR pada tanggal pembayaran.</li>
            <li>Pembayaran termin selanjutnya menggunakan kurs yang berlaku saat transaksi dilakukan.</li>
            <li>Mohon lakukan konfirmasi pembayaran melalui pihak yang tertera.</li>
            <li>Dokumen ini sah tanpa tanda tangan basah karena dicetak melalui sistem.</li>
          </ol>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div>
          <div style="color:#475569;line-height:1.6">
            Terima kasih telah mempercayakan layanan booking hotel kepada <strong style="color:#ea580c">PT. TAMIMA JAYA WISATA</strong>. 
            Kami berkomitmen memberikan pelayanan terbaik untuk perjalanan ibadah dan wisata Anda.
          </div>
          <div style="color:#94a3b8;font-size:10px;margin-top:10px;font-style:italic">
            Dokumen ini di-generate otomatis pada ${new Date().toLocaleString('id-ID')}.<br>
            Tipe File: HTML Standalone · Bisa dibuka di browser tanpa internet.
          </div>
        </div>
        <div class="signature">
          <div style="color:#64748b;font-size:11px">Tertanda,</div>
          <div class="signature-stamp">[Stempel]</div>
          <div class="signature-name">( GHOFAR )</div>
          <div style="font-size:9px;color:#94a3b8">Booking Manager</div>
        </div>
      </div>

      <!-- 📱 QR VERIFICATION STAMP -->
      <div style="margin-top:14px;padding-top:14px;border-top:2px dashed #cbd5e1;display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap">
        ${qrHTML}
        <div style="text-align:left;max-width:240px">
          <div style="font-size:11px;font-weight:bold;color:#1f2937">📱 Verify Authenticity</div>
          <div style="font-size:10px;color:#6b7280;line-height:1.4">
            Scan QR code dengan kamera HP untuk verifikasi keaslian dokumen ini secara online.
          </div>
        </div>
      </div>

      <div class="footer-bar">
        PT. TAMIMA JAYA WISATA · BEYOND LA &amp; HANDLING SERVICE · ${docNum}
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `Statement_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${docNum}.html`;
  downloadHTML(html, filename);
}

/**
 * 2. Export INTERNAL REPORT (with vendor & profit) as HTML
 */
export async function exportInternalHTML(data: BookingData) {
  const vendorCalc = calcRow(data.vendor, data.checkIn, data.checkOut);
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const margin = pemesanCalc.totalIDRActual - vendorCalc.totalIDRActual;
  const marginPct = pemesanCalc.totalIDRActual > 0 ? (margin / pemesanCalc.totalIDRActual * 100) : 0;
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  const docNum = `RPT-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  const period = (() => {
    const refDate = data.checkIn ? new Date(data.checkIn) : new Date();
    const month = refDate.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
    return `${month}, ${refDate.getFullYear()}`;
  })();

  const renderRoomRow = (label: string, rowData: any, calc: any, bg: string) => {
    const activeRooms = (['dbl', 'trp', 'qrd', 'qnt', 'bed', 'ext'] as const)
      .map(rt => `<td style="text-align:center">${rowData[rt].qty || 0}/${rowData[rt].rate || 0}</td>`).join('');
    return `
      <tr style="background:${bg}">
        <td><strong>${label}</strong></td>
        ${activeRooms}
        <td style="text-align:center">${safeStr(rowData.mealPlan) || '-'}</td>
        <td style="text-align:center">${safeStr(rowData.vat) || '-'}</td>
        <td style="text-align:right">${rowData.transport || 0}</td>
        <td style="text-align:right text-mono"><strong>SAR ${formatNumber(calc.totalSAR)}</strong></td>
        <td style="text-align:right text-mono"><strong>IDR ${formatNumber(calc.totalIDRActual)}</strong></td>
      </tr>
    `;
  };

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Internal — ${safeStr(data.customerName)} — ${docNum}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="container">
    <div class="action-bar">
      <div style="font-weight:700;color:#dc2626;font-size:12px">🔒 LAPORAN INTERNAL — RAHASIA · Saved HTML</div>
      <div>
        <button class="btn btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
      </div>
    </div>

    <!-- Header -->
    <div class="header-bar" style="background:linear-gradient(135deg,#7f1d1d,#dc2626)">
      <div>
        <h1>LAPORAN INTERNAL BOOKING</h1>
        <div class="subtitle">PT. TAMIMA JAYA WISATA oleh ${safeStr(data.customerName).toUpperCase() || '( Nama Customer )'}</div>
        <div class="subtitle"><strong>BULAN ${period}</strong></div>
      </div>
      <div style="text-align:right">
        <div class="badge badge-danger">🔒 INTERNAL CONFIDENTIAL</div>
        <div class="ref" style="margin-top:6px">No: ${docNum}</div>
        <div class="ref">${new Date().toLocaleDateString('id-ID')}</div>
      </div>
    </div>

    <div class="content">
      <!-- Executive Summary -->
      <div class="grid-4 section">
        <div class="stat-box red">
          <div class="stat-label">Modal (BUY)</div>
          <div class="stat-value">IDR ${formatNumber(vendorCalc.totalIDRActual)}</div>
        </div>
        <div class="stat-box green">
          <div class="stat-label">Tagihan (SELL)</div>
          <div class="stat-value">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</div>
        </div>
        <div class="stat-box amber">
          <div class="stat-label">Net Profit</div>
          <div class="stat-value">IDR ${formatNumber(margin)}</div>
        </div>
        <div class="stat-box blue">
          <div class="stat-label">Margin %</div>
          <div class="stat-value">${marginPct.toFixed(2)}%</div>
        </div>
      </div>

      <!-- Booking Info -->
      <div class="section">
        <div class="section-title">📋 Informasi Booking</div>
        <div class="grid-2">
          <div class="info-card">
            <div class="info-card-header">Customer & Sales</div>
            <table class="info-card-table">
              <tr><td class="label">Customer</td><td class="value">${safeStr(data.customerName) || '-'}</td></tr>
              <tr><td class="label">Email</td><td class="value">${safeStr(data.customerEmail) || '-'}</td></tr>
              <tr><td class="label">Phone/WA</td><td class="value">${safeStr(data.customerPhone) || '-'}</td></tr>
              <tr><td class="label">Sales Person</td><td class="value">${safeStr(data.salesPerson) || '-'}</td></tr>
              <tr><td class="label">Status</td><td class="value"><span class="badge ${isLunas ? 'badge-success' : 'badge-warning'}">${isLunas ? '✓ LUNAS' : '⚠ BELUM LUNAS'}</span></td></tr>
            </table>
          </div>
          <div class="info-card">
            <div class="info-card-header" style="background:#7f1d1d">⚠ Vendor & PIC (Rahasia)</div>
            <table class="info-card-table">
              <tr><td class="label">Vendor</td><td class="value" style="color:#dc2626"><strong>${safeStr(data.vendorName) || '-'}</strong></td></tr>
              <tr><td class="label">PIC Internal</td><td class="value" style="color:#dc2626"><strong>${safeStr(data.picInternal) || '-'}</strong></td></tr>
              <tr><td class="label">Hotel</td><td class="value">${safeStr(data.hotelName) || '-'} ${data.hotelStars ? '★'.repeat(data.hotelStars) : ''}</td></tr>
              <tr><td class="label">Periode</td><td class="value">${formatDateShort(data.checkIn)} → ${formatDateShort(data.checkOut)}</td></tr>
              <tr><td class="label">Durasi</td><td class="value">${pemesanCalc.totalNight} Malam</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- BUY vs SELL Comparison -->
      <div class="section">
        <div class="section-title">💰 Perbandingan BUY (Modal) vs SELL (Tagihan)</div>
        <table class="data-table" style="font-size:11px">
          <thead>
            <tr>
              <th>Type</th>
              <th class="text-center">DBL Q/R</th>
              <th class="text-center">TRP Q/R</th>
              <th class="text-center">QRD Q/R</th>
              <th class="text-center">QNT Q/R</th>
              <th class="text-center">BED Q/R</th>
              <th class="text-center">EXT Q/R</th>
              <th class="text-center">Meal</th>
              <th class="text-center">VAT</th>
              <th class="text-right">Trans</th>
              <th class="text-right">Total SAR</th>
              <th class="text-right">Total IDR</th>
            </tr>
          </thead>
          <tbody>
            ${renderRoomRow('BUY', data.vendor, vendorCalc, '#fce7e5')}
            ${renderRoomRow('SELL', data.pemesan, pemesanCalc, '#e6f4ea')}
            <tr style="background:#fef3c7;font-weight:bold">
              <td colspan="10" class="text-right">NET PROFIT (SELL - BUY):</td>
              <td colspan="2" class="text-right text-mono" style="color:#92400e">IDR ${formatNumber(margin)} (${marginPct.toFixed(2)}%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Payment Detail -->
      <div class="section">
        <div class="section-title">💳 Detail Pembayaran (5 Termin)</div>
        <div class="grid-2">
          <div class="info-card">
            <div class="info-card-header" style="background:#dc2626">Vendor (BUY)</div>
            <table class="info-card-table">
              ${data.vendor.payments.map((p, i) => {
                const idr = Number(p.idrPaid) || 0;
                if (idr === 0) return '';
                return `<tr><td class="label">Termin ${i + 1}</td><td class="value text-mono">IDR ${formatNumber(idr)} @ Kurs ${p.kurs || 0}</td></tr>`;
              }).join('') || '<tr><td colspan="2" style="padding:12px;color:#94a3b8;font-style:italic;text-align:center">Belum ada pembayaran</td></tr>'}
              <tr style="background:#fce7e5;font-weight:bold">
                <td class="label">Total Terbayar</td>
                <td class="value text-mono">IDR ${formatNumber(vendorCalc.totalIDRMasuk)}</td>
              </tr>
            </table>
          </div>
          <div class="info-card">
            <div class="info-card-header green">Pemesan (SELL)</div>
            <table class="info-card-table">
              ${data.pemesan.payments.map((p, i) => {
                const idr = Number(p.idrPaid) || 0;
                if (idr === 0) return '';
                return `<tr><td class="label">Termin ${i + 1}</td><td class="value text-mono">IDR ${formatNumber(idr)} @ Kurs ${p.kurs || 0}</td></tr>`;
              }).join('') || '<tr><td colspan="2" style="padding:12px;color:#94a3b8;font-style:italic;text-align:center">Belum ada pembayaran</td></tr>'}
              <tr style="background:#e6f4ea;font-weight:bold">
                <td class="label">Total Diterima</td>
                <td class="value text-mono">IDR ${formatNumber(pemesanCalc.totalIDRMasuk)}</td>
              </tr>
              <tr style="background:#fef3c7;font-weight:bold">
                <td class="label">Sisa Tagihan</td>
                <td class="value text-mono" style="color:${isLunas ? '#15803d' : '#dc2626'}">${isLunas ? '✓ LUNAS' : 'IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Notice -->
      <div class="section">
        <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:8px;padding:14px;font-size:12px">
          <strong style="color:#7f1d1d;font-size:13px">🔒 INFORMASI RAHASIA INTERNAL:</strong>
          <ul style="margin:8px 0 0 20px;line-height:1.7;color:#475569">
            <li><strong>Vendor:</strong> ${safeStr(data.vendorName) || '-'} — Jangan disebarkan ke customer.</li>
            <li><strong>PIC Internal:</strong> ${safeStr(data.picInternal) || '-'}</li>
            <li>Dokumen ini berisi perhitungan modal & margin profit perusahaan.</li>
            <li><strong>Hanya untuk konsumsi internal manajemen dan tim finance.</strong></li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div>
          <div style="color:#475569;line-height:1.6">
            Laporan internal ini mencakup detail finansial booking lengkap termasuk margin profit.
            Gunakan informasi ini untuk evaluasi kinerja & forecasting bisnis.
          </div>
          <div style="color:#94a3b8;font-size:10px;margin-top:10px;font-style:italic">
            Generated: ${new Date().toLocaleString('id-ID')} · Tipe: HTML Standalone (offline-ready)
          </div>
        </div>
        <div class="signature">
          <div style="color:#64748b;font-size:11px">Tertanda,</div>
          <div class="signature-stamp">[Stempel]</div>
          <div class="signature-name">( GHOFAR )</div>
          <div style="font-size:9px;color:#94a3b8">Booking Manager</div>
        </div>
      </div>

      <div class="footer-bar" style="background:#7f1d1d">
        🔒 INTERNAL — PT. TAMIMA JAYA WISATA · CONFIDENTIAL · ${docNum}
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `Internal_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${docNum}.html`;
  downloadHTML(html, filename);
}

/**
 * 3. Export CONFIRMATION LETTER (CL) as HTML
 */
export async function exportCLHTML(data: BookingData) {
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  const clNumber = `CL-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  const paymentStatus = isLunas ? 'PAID / CONFIRMED' : (pemesanCalc.totalIDRMasuk > 0 ? 'PARTIAL PAYMENT' : 'PENDING PAYMENT');
  
  // 📱 Generate QR verification stamp
  const qrHTML = await generateQRHTML(data, 'cl', 90);
  
  const activeRooms = (['dbl', 'trp', 'qrd', 'qnt', 'bed', 'ext'] as const)
    .filter(rt => Number(data.pemesan[rt].qty) > 0)
    .map(rt => ({
      label: ROOM_TYPE_LABELS[rt],
      qty: Number(data.pemesan[rt].qty) || 0,
      rate: Number(data.pemesan[rt].rate) || 0,
      subtotal: (Number(data.pemesan[rt].qty) || 0) * (Number(data.pemesan[rt].rate) || 0) * pemesanCalc.totalNight,
    }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation Letter — ${safeStr(data.customerName)} — ${clNumber}</title>
  <style>${SHARED_CSS}
    .stay-banner { display: grid; grid-template-columns: repeat(4, 1fr); border: 2px solid #f97316; border-radius: 8px; overflow: hidden; }
    .stay-box { padding: 14px; text-align: center; border-right: 1px solid #fed7aa; }
    .stay-box:last-child { border-right: none; }
    .stay-box.highlight { background: #fff7ed; }
    .stay-label { font-size: 10px; color: #c2410c; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .stay-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 6px; }
    .stay-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="action-bar">
      <div style="font-weight:700;color:#ea580c;font-size:12px">📄 Confirmation Letter · OTA Standard · Saved HTML</div>
      <div>
        <button class="btn btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
      </div>
    </div>

    <!-- CL Header -->
    <div class="header-bar">
      <div>
        <div style="font-size:10px;opacity:0.85;text-transform:uppercase;letter-spacing:2px;font-weight:bold">Issued by</div>
        <h1 style="font-size:22px;margin-top:4px">PT. TAMIMA JAYA WISATA</h1>
        <div class="subtitle">Beyond LA &amp; Handling Service · Hajj &amp; Umrah Specialist</div>
        <div class="subtitle" style="margin-top:4px;font-size:10px;line-height:1.4">📍 JogloSemar Building, Jl. Magelang KM.7 LOT A3, Mlati, Sleman, D.I. Yogyakarta 55285<br>📞 WA: 0813-8383-8115 · 0852-2009-9694</div>
      </div>
      <div style="text-align:right">
        <div style="background:white;color:#ea580c;padding:8px 16px;border-radius:4px;display:inline-block">
          <div style="font-size:18px;font-weight:900;letter-spacing:1px">CONFIRMATION LETTER</div>
          <div style="font-size:11px;margin-top:2px">of Hotel Booking</div>
        </div>
        <div class="ref" style="margin-top:8px">Booking Ref: <strong>${clNumber}</strong></div>
        <div class="ref">${new Date().toLocaleDateString('en-GB')}</div>
        <div style="margin-top:4px">
          <span class="badge ${isLunas ? 'badge-success' : pemesanCalc.totalIDRMasuk > 0 ? 'badge-warning' : 'badge-danger'}">${paymentStatus}</span>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- Greeting -->
      <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:20px">
        Dear <strong style="color:#0f172a">${safeStr(data.customerName) || 'Valued Guest'}</strong>,<br>
        We are pleased to confirm your hotel booking with the following details. Please review carefully and keep this confirmation letter as your reference during check-in.
      </div>

      <!-- Guest & Hotel Info -->
      <div class="grid-2 section">
        <div class="info-card">
          <div class="info-card-header">👤 Guest Information</div>
          <table class="info-card-table">
            <tr><td class="label">Lead Guest</td><td class="value">${safeStr(data.customerName) || '-'}</td></tr>
            <tr><td class="label">Email</td><td class="value">${safeStr(data.customerEmail) || '-'}</td></tr>
            <tr><td class="label">Phone / WA</td><td class="value">${safeStr(data.customerPhone) || '-'}</td></tr>
            <tr><td class="label">No. of Pax</td><td class="value">${data.paxCount || '-'} Person(s)</td></tr>
          </table>
        </div>
        <div class="info-card">
          <div class="info-card-header orange">🏨 Hotel Information</div>
          <table class="info-card-table">
            <tr><td class="label">Hotel Name</td><td class="value">${safeStr(data.hotelName) || '-'} ${data.hotelStars ? '★'.repeat(data.hotelStars) : ''}</td></tr>
            <tr><td class="label">City</td><td class="value">${safeStr(data.hotelCity) || 'Makkah / Madinah'}</td></tr>
            <tr><td class="label">Address</td><td class="value">${safeStr(data.hotelAddress) || 'Saudi Arabia'}</td></tr>
            <tr><td class="label">Meal Plan</td><td class="value">${safeStr(data.pemesan.mealPlan) || 'Room Only'}</td></tr>
          </table>
        </div>
      </div>

      <!-- Stay Banner -->
      <div class="section">
        <div class="stay-banner">
          <div class="stay-box highlight">
            <div class="stay-label">Check-In</div>
            <div class="stay-value">${formatDateShort(data.checkIn)}</div>
            <div class="stay-sub">From 16:00*</div>
          </div>
          <div class="stay-box highlight">
            <div class="stay-label">Check-Out</div>
            <div class="stay-value">${formatDateShort(data.checkOut)}</div>
            <div class="stay-sub">Before 14:00*</div>
          </div>
          <div class="stay-box">
            <div class="stay-label">Duration</div>
            <div class="stay-value" style="color:#ea580c">${pemesanCalc.totalNight} Night${pemesanCalc.totalNight > 1 ? 's' : ''}</div>
            <div class="stay-sub">Total Stay</div>
          </div>
          <div class="stay-box">
            <div class="stay-label">Total Rooms</div>
            <div class="stay-value" style="color:#ea580c">${activeRooms.reduce((s, r) => s + r.qty, 0)}</div>
            <div class="stay-sub">Booked</div>
          </div>
        </div>
      </div>

      <!-- Room Table -->
      <div class="section">
        <div class="section-title">🛏 Room Reservation Details</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Room Type</th>
              <th class="text-center">Quantity</th>
              <th class="text-center">Nights</th>
              <th class="text-right">Rate/Night</th>
              <th class="text-right">Subtotal (SAR)</th>
            </tr>
          </thead>
          <tbody>
            ${activeRooms.length === 0 
              ? '<tr><td colspan="5" class="text-center" style="padding:20px;color:#94a3b8;font-style:italic">No room data</td></tr>'
              : activeRooms.map(r => `
                <tr>
                  <td><strong>${r.label}</strong></td>
                  <td class="text-center">${r.qty} Room${r.qty > 1 ? 's' : ''}</td>
                  <td class="text-center">${pemesanCalc.totalNight}</td>
                  <td class="text-right text-mono">SAR ${formatNumber(r.rate)}</td>
                  <td class="text-right text-mono"><strong>SAR ${formatNumber(r.subtotal)}</strong></td>
                </tr>
              `).join('')
            }
            ${Number(data.pemesan.transport) > 0 ? `
              <tr style="background:#eff6ff">
                <td colspan="4"><strong>🚌 Transport (Ground)</strong></td>
                <td class="text-right text-mono"><strong>SAR ${formatNumber(Number(data.pemesan.transport))}</strong></td>
              </tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">GRAND TOTAL</td>
              <td class="text-right text-mono">SAR ${formatNumber(pemesanCalc.totalSAR)}</td>
            </tr>
            <tr style="background:#1e293b;color:white">
              <td colspan="4" class="text-right" style="font-size:11px">Equivalent in IDR (Est. Rate: ${formatNumber(pemesanCalc.estKursRataRata)})</td>
              <td class="text-right text-mono">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Cards (4 kolom: Total | Paid | Balance SAR | Balance IDR) -->
      <div class="section" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div class="stat-box green">
          <div class="stat-label">Total Amount</div>
          <div class="stat-value" style="font-size:13px">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</div>
          <div style="font-size:10px;font-weight:600;color:#059669;margin-top:2px">≈ SAR ${formatNumber(pemesanCalc.totalSAR)}</div>
        </div>
        <div class="stat-box blue">
          <div class="stat-label">Amount Paid</div>
          <div class="stat-value" style="font-size:13px">IDR ${formatNumber(pemesanCalc.totalIDRMasuk)}</div>
          <div style="font-size:10px;font-weight:600;color:#2563eb;margin-top:2px">≈ SAR ${formatNumber(pemesanCalc.totalSARMasuk)}</div>
        </div>
        <div class="stat-box ${isLunas ? 'green' : 'amber'}" style="${isLunas ? '' : 'border-color:#ea580c;background:#fff7ed;color:#9a3412'}">
          <div class="stat-label">Balance (SAR)</div>
          <div class="stat-value" style="font-size:13px">${isLunas ? '✓ PAID' : 'SAR ' + formatNumber(pemesanCalc.sisaTagihanSAR)}</div>
          <div style="font-size:10px;font-weight:600;margin-top:2px;opacity:0.8">Mata Uang Asal</div>
        </div>
        <div class="stat-box ${isLunas ? 'green' : 'red'}">
          <div class="stat-label">${isLunas ? 'Status' : 'Outstanding'}</div>
          <div class="stat-value" style="font-size:13px">${isLunas ? '✓ FULLY PAID' : 'IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR)}</div>
          <div style="font-size:10px;font-weight:600;margin-top:2px;opacity:0.8">${isLunas ? 'No Balance' : 'Kurs Est: ' + formatNumber(pemesanCalc.estKursRataRata)}</div>
        </div>
      </div>

      <!-- Policies -->
      <div class="grid-2 section">
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:14px;background:#f8fafc">
          <strong style="color:#1e293b">📋 BOOKING POLICY</strong>
          <ul style="margin:8px 0 0 20px;font-size:12px;line-height:1.7;color:#475569">
            <li>Check-in from <strong>16:00</strong> (4:00 PM) local time*</li>
            <li>Check-out before <strong>14:00</strong> (2:00 PM) local time*</li>
            <li>* Subject to hotel availability &amp; situation</li>
            <li>Original passport required at check-in</li>
            <li>Present this Confirmation Letter at hotel reception</li>
          </ul>
        </div>
        <div style="border:1px solid #fecaca;border-radius:8px;padding:14px;background:#fef2f2">
          <strong style="color:#991b1b">⚠️ CANCELLATION POLICY</strong>
          <ul style="margin:8px 0 0 20px;font-size:12px;line-height:1.7;color:#475569">
            <li>${safeStr(data.cancellationPolicy) || 'Cancellation 30+ days before: Full refund (-5% admin)'}</li>
            <li>Cancellation 14-29 days before: 50% refund</li>
            <li>Cancellation less than 14 days: Non-refundable</li>
            <li>No-show: Full charge applies</li>
            <li>Date change subject to availability &amp; rate difference</li>
          </ul>
        </div>
      </div>

      <!-- Payment Bank Info -->
      <div class="section">
        <div style="border:2px solid #eab308;background:#fef9c3;border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="background:#eab308;color:white;padding:5px 10px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;border-radius:4px">
            💳 NOTE / PAYMENT
          </div>
          <div style="flex:1;font-size:13px;color:#0f172a;line-height:1.5">
            Pembayaran melalui akun <strong style="color:#1e40af">Bank Mandiri</strong> a/n 
            <strong>PT. TAMIMA JAYA WISATA</strong> · No. Rek. 
            <strong style="font-family:'Courier New',monospace;color:#1e3a8a;background:white;padding:3px 8px;border:1px solid #60a5fa;border-radius:4px;font-size:14px">1370088001686</strong>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div>
          <div style="color:#475569;line-height:1.6">
            Thank you for choosing <strong style="color:#ea580c">PT. TAMIMA JAYA WISATA</strong> as your trusted Hajj &amp; Umrah travel partner. 
            We wish you a blessed and comfortable stay.
          </div>
          <div style="color:#94a3b8;font-size:10px;margin-top:10px;font-style:italic">
            This is a system-generated confirmation letter. No physical signature required.<br>
            Generated on ${new Date().toLocaleString('en-GB')} · HTML Standalone (offline-ready)
          </div>
        </div>
        <div class="signature">
          <div style="color:#64748b;font-size:11px">Authorized Signature,</div>
          <div class="signature-stamp">[Stempel]</div>
          <div class="signature-name">( GHOFAR )</div>
          <div style="font-size:9px;color:#94a3b8">Booking Manager</div>
        </div>
      </div>

      <!-- 📱 QR VERIFICATION STAMP -->
      <div style="margin-top:14px;padding:14px;border:2px dashed #cbd5e1;border-radius:8px;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;background:#fafafa">
        ${qrHTML}
        <div style="text-align:left;max-width:260px">
          <div style="font-size:12px;font-weight:bold;color:#1f2937;margin-bottom:4px">📱 Verify Booking Authenticity</div>
          <div style="font-size:10px;color:#6b7280;line-height:1.5">
            Scan QR code dengan kamera HP untuk verifikasi keaslian Confirmation Letter ini secara online.
            <br/><br/>
            Sistem akan menampilkan detail booking lengkap dengan signature SHA-256 untuk memastikan dokumen tidak palsu.
          </div>
        </div>
      </div>

      <div class="footer-bar">
        PT. TAMIMA JAYA WISATA · BEYOND LA &amp; HANDLING SERVICE · CONFIRMATION LETTER #${clNumber}
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `CL_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${clNumber}.html`;
  downloadHTML(html, filename);
}

/**
 * 4. Export DATABASE (multi booking) as HTML
 */
export function exportDatabaseHTML(orders: BookingData[], filterInfo: string, mode: 'internal' | 'customer') {
  const isInternal = mode === 'internal';
  
  const totalAllRevenue = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).totalIDRActual, 0);
  const totalAllModal = orders.reduce((sum, o) => sum + calcRow(o.vendor, o.checkIn, o.checkOut).totalIDRActual, 0);
  const totalAllReceived = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).totalIDRMasuk, 0);
  const totalAllSisa = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).sisaTagihanIDR, 0);
  const totalAllProfit = totalAllRevenue - totalAllModal;
  
  const docNum = `DB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Booking — ${isInternal ? 'Internal' : 'Customer'} — ${orders.length} Booking</title>
  <style>${SHARED_CSS}
    .booking-row td:hover { background: #fef3c7 !important; }
    .container { max-width: 1400px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="action-bar">
      <div style="font-weight:700;color:${isInternal ? '#dc2626' : '#0f766e'};font-size:12px">
        🗂️ Database ${isInternal ? 'Laporan Internal' : 'Statement Customer'} · ${orders.length} Booking
      </div>
      <div>
        <button class="btn btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
      </div>
    </div>

    <!-- Header -->
    <div class="header-bar" style="background:${isInternal ? 'linear-gradient(135deg,#7f1d1d,#dc2626)' : 'linear-gradient(135deg,#0f766e,#0d9488)'}">
      <div>
        <h1>DATABASE BOOKING — ${isInternal ? 'LAPORAN INTERNAL' : 'STATEMENT CUSTOMER'}</h1>
        <div class="subtitle">PT. TAMIMA JAYA WISATA</div>
        <div class="subtitle">Filter Aktif: <strong>${filterInfo}</strong> · Total <strong>${orders.length}</strong> Booking · ${today}</div>
      </div>
      <div style="text-align:right">
        <div class="badge ${isInternal ? 'badge-danger' : 'badge-info'}">${isInternal ? '🔒 INTERNAL CONFIDENTIAL' : '👤 STATEMENT CUSTOMER'}</div>
        <div class="ref" style="margin-top:6px">No: ${docNum}</div>
      </div>
    </div>

    <div class="content">
      <!-- Grand Summary -->
      <div class="${isInternal ? 'grid-4' : 'grid-3'} section" style="grid-template-columns:${isInternal ? 'repeat(5,1fr)' : 'repeat(3,1fr)'}">
        ${isInternal ? `
          <div class="stat-box red">
            <div class="stat-label">Total Modal</div>
            <div class="stat-value" style="font-size:14px">IDR ${formatNumber(totalAllModal)}</div>
          </div>
        ` : ''}
        <div class="stat-box green">
          <div class="stat-label">Total Tagihan</div>
          <div class="stat-value" style="font-size:14px">IDR ${formatNumber(totalAllRevenue)}</div>
        </div>
        <div class="stat-box blue">
          <div class="stat-label">Total Dibayar</div>
          <div class="stat-value" style="font-size:14px">IDR ${formatNumber(totalAllReceived)}</div>
        </div>
        <div class="stat-box ${totalAllSisa <= 0 ? 'green' : 'red'}">
          <div class="stat-label">Total Sisa</div>
          <div class="stat-value" style="font-size:14px">${totalAllSisa <= 0 ? '✓ LUNAS' : 'IDR ' + formatNumber(totalAllSisa)}</div>
        </div>
        ${isInternal ? `
          <div class="stat-box amber">
            <div class="stat-label">Net Profit</div>
            <div class="stat-value" style="font-size:14px">IDR ${formatNumber(totalAllProfit)}</div>
          </div>
        ` : ''}
      </div>

      <!-- Database Table -->
      <div class="section">
        <div class="section-title">📊 Daftar Booking (${orders.length} entries)</div>
        <table class="data-table" style="font-size:11px">
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Hotel</th>
              <th>Customer</th>
              ${isInternal ? '<th>Vendor</th><th>PIC</th>' : ''}
              <th>Sales</th>
              <th class="text-center">Periode</th>
              <th class="text-center">N</th>
              ${isInternal ? '<th class="text-right">Modal IDR</th>' : ''}
              <th class="text-right">Tagihan IDR</th>
              <th class="text-right">Dibayar</th>
              <th class="text-right">Sisa</th>
              ${isInternal ? '<th class="text-right">Profit</th>' : ''}
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((order, idx) => {
              const vc = calcRow(order.vendor, order.checkIn, order.checkOut);
              const pc = calcRow(order.pemesan, order.checkIn, order.checkOut);
              const profit = pc.totalIDRActual - vc.totalIDRActual;
              const isLunas = pc.sisaTagihanIDR <= 0 && pc.totalIDRMasuk > 0;
              const hasPayments = pc.totalIDRMasuk > 0;
              const statusBadge = isLunas ? 'badge-success' : (hasPayments ? 'badge-warning' : 'badge-info');
              const statusText = isLunas ? '✓ LUNAS' : (hasPayments ? '⚠ BELUM' : '📝 DRAFT');
              const dateRange = order.checkIn && order.checkOut
                ? `${formatDateShort(order.checkIn)} - ${formatDateShort(order.checkOut)}`
                : '-';
              return `
                <tr class="booking-row">
                  <td class="text-center"><strong>${idx + 1}</strong></td>
                  <td><strong>${safeStr(order.hotelName) || '-'}</strong></td>
                  <td>${safeStr(order.customerName) || '-'}</td>
                  ${isInternal ? `<td style="color:#dc2626"><strong>${safeStr(order.vendorName) || '-'}</strong></td><td>${safeStr(order.picInternal) || '-'}</td>` : ''}
                  <td>${safeStr(order.salesPerson) || '-'}</td>
                  <td class="text-center" style="font-size:10px">${dateRange}</td>
                  <td class="text-center">${pc.totalNight}</td>
                  ${isInternal ? `<td class="text-right text-mono" style="color:#991b1b">${formatNumber(vc.totalIDRActual)}</td>` : ''}
                  <td class="text-right text-mono" style="color:#065f46"><strong>${formatNumber(pc.totalIDRActual)}</strong></td>
                  <td class="text-right text-mono" style="color:#1e40af">${formatNumber(pc.totalIDRMasuk)}</td>
                  <td class="text-right text-mono" style="color:${isLunas ? '#15803d' : '#991b1b'}"><strong>${isLunas ? '✓ 0' : formatNumber(pc.sisaTagihanIDR)}</strong></td>
                  ${isInternal ? `<td class="text-right text-mono" style="color:${profit >= 0 ? '#92400e' : '#991b1b'}"><strong>${formatNumber(profit)}</strong></td>` : ''}
                  <td class="text-center"><span class="badge ${statusBadge}" style="font-size:9px;padding:2px 6px">${statusText}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#1e293b;color:white">
              <td colspan="${isInternal ? 8 : 6}" class="text-right">GRAND TOTAL (${orders.length} Booking):</td>
              ${isInternal ? `<td class="text-right text-mono">${formatNumber(totalAllModal)}</td>` : ''}
              <td class="text-right text-mono">${formatNumber(totalAllRevenue)}</td>
              <td class="text-right text-mono">${formatNumber(totalAllReceived)}</td>
              <td class="text-right text-mono">${formatNumber(totalAllSisa)}</td>
              ${isInternal ? `<td class="text-right text-mono" style="color:#fef3c7">${formatNumber(totalAllProfit)}</td>` : ''}
              <td class="text-center">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Notes -->
      <div class="section">
        ${isInternal ? `
          <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:8px;padding:14px;font-size:12px;color:#7f1d1d">
            <strong>🔒 INFO:</strong> Dokumen ini berisi data finansial internal perusahaan termasuk modal vendor dan margin profit. <strong>TIDAK BOLEH disebarkan ke customer.</strong>
          </div>
        ` : `
          <div style="background:#fef3c7;border:1px solid #d97706;border-radius:8px;padding:14px;font-size:12px;color:#92400e">
            <strong>📋 KETERANGAN:</strong> Tagihan berlaku berdasarkan kurs SAR ke IDR pada tanggal pembayaran. Mohon konfirmasi pembayaran melalui pihak yang tertera.
          </div>
        `}
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div>
          <div style="color:#94a3b8;font-size:10px;font-style:italic">
            Database export dihasilkan otomatis pada ${new Date().toLocaleString('id-ID')}<br>
            Tipe File: HTML Standalone · Bisa dibuka di browser tanpa internet · ${orders.length} booking record
          </div>
        </div>
        <div class="signature">
          <div style="color:#64748b;font-size:11px">Tertanda,</div>
          <div class="signature-stamp">[Stempel]</div>
          <div class="signature-name">( GHOFAR )</div>
        </div>
      </div>

      <div class="footer-bar" style="background:${isInternal ? '#7f1d1d' : '#0f766e'}">
        ${isInternal ? '🔒 INTERNAL' : '👤 CUSTOMER'} — PT. TAMIMA JAYA WISATA · ${docNum}
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `Database_${mode}_${new Date().toISOString().split('T')[0]}.html`;
  downloadHTML(html, filename);
}