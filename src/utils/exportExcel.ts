import type { BookingData } from '../types';
import { calcRow, formatNumber } from './calc';

/**
 * Generate Excel-compatible HTML file (.xls format)
 * Browser akan otomatis membuka di Excel/LibreOffice
 */
function downloadAsExcel(htmlContent: string, filename: string) {
  const blob = new Blob(
    [`<html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Statement Booking</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
      </head>
      <body>${htmlContent}</body>
    </html>`],
    { type: 'application/vnd.ms-excel;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const formatDateID = (isoStr: string): string => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * 1. Template Input Data - Kosong agar user bisa fill
 */
export function downloadTemplateInput() {
  const headerStyle = `style="background-color:#1e3a5f;color:white;font-weight:bold;text-align:center;border:1px solid #000;padding:6px;font-size:11px"`;
  const subHeaderStyle = `style="background-color:#fff9e6;font-weight:bold;border:1px solid #000;padding:4px;font-size:10px"`;
  const cellStyle = `style="border:1px solid #ccc;padding:4px;font-size:10px"`;
  const buyStyle = `style="background-color:#fce7e5;border:1px solid #ccc;padding:4px;font-size:10px"`;
  const sellStyle = `style="background-color:#e6f4ea;border:1px solid #ccc;padding:4px;font-size:10px"`;

  const html = `
    <table border="1" cellspacing="0" cellpadding="3" style="font-family:Calibri;border-collapse:collapse">
      <tr>
        <td colSpan="35" style="background-color:#ff8c00;color:white;font-weight:bold;text-align:center;font-size:14px;padding:10px">
          📋 TEMPLATE INPUT DATA BOOKING — PT. TAMIMA JAYA WISATA
        </td>
      </tr>
      <tr>
        <td colspan="35" style="text-align:center;padding:6px;font-style:italic;background:#fff;font-size:10px">
          Isi kolom-kolom di bawah ini, lalu import ke aplikasi Hotel Booking Profitability Dashboard
        </td>
      </tr>
      <tr><td colspan="35" style="padding:5px"></td></tr>

      <!-- METADATA -->
      <tr>
        <td colspan="35" ${subHeaderStyle}>📌 METADATA TRANSAKSI</td>
      </tr>
      <tr>
        <td ${cellStyle}><b>HOTEL:</b></td>
        <td colspan="6" ${cellStyle}>[isi nama hotel]</td>
        <td ${cellStyle}><b>CUSTOMER:</b></td>
        <td colspan="6" ${cellStyle}>[isi nama customer]</td>
        <td ${cellStyle}><b>PIC INTERNAL:</b></td>
        <td colspan="6" ${cellStyle}>[isi nama PIC]</td>
        <td ${cellStyle}><b>VENDOR:</b></td>
        <td colspan="6" ${cellStyle}>[isi nama vendor]</td>
        <td ${cellStyle}><b>SALES PERSON:</b></td>
        <td colspan="6" ${cellStyle}>[isi nama sales]</td>
      </tr>
      <tr><td colspan="35" style="padding:5px"></td></tr>

      <!-- TABLE HEADER -->
      <tr>
        <td rowspan="2" ${headerStyle}>#</td>
        <td colspan="2" ${headerStyle}>Date</td>
        <td rowspan="2" ${headerStyle}>Total<br>Night</td>
        <td colspan="12" ${headerStyle}>Room Type & Rate (SAR)</td>
        <td rowspan="2" ${headerStyle}>Meal Plan</td>
        <td rowspan="2" ${headerStyle}>VAT</td>
        <td rowspan="2" ${headerStyle}>Transport</td>
        <td rowspan="2" ${headerStyle}>Total Tagihan SAR</td>
        <td colspan="2" ${headerStyle}>Pembayaran 1</td>
        <td colspan="2" ${headerStyle}>Pembayaran 2</td>
        <td colspan="2" ${headerStyle}>Pembayaran 3</td>
        <td colspan="2" ${headerStyle}>Pembayaran 4</td>
        <td colspan="2" ${headerStyle}>Pembayaran 5</td>
      </tr>
      <tr>
        <td ${headerStyle}>Check In</td>
        <td ${headerStyle}>Check Out</td>
        <td ${headerStyle}>DBL Qty</td><td ${headerStyle}>DBL Rate</td>
        <td ${headerStyle}>TRP Qty</td><td ${headerStyle}>TRP Rate</td>
        <td ${headerStyle}>QRD Qty</td><td ${headerStyle}>QRD Rate</td>
        <td ${headerStyle}>QNT Qty</td><td ${headerStyle}>QNT Rate</td>
        <td ${headerStyle}>BED Qty</td><td ${headerStyle}>BED Rate</td>
        <td ${headerStyle}>EXT Qty</td><td ${headerStyle}>EXT Rate</td>
        <td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>
        <td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>
        <td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>
        <td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>
        <td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>
      </tr>

      <!-- BUY ROW -->
      <tr>
        <td ${buyStyle}><b>BUY</b></td>
        <td ${buyStyle}>[YYYY-MM-DD]</td>
        <td ${buyStyle}>[YYYY-MM-DD]</td>
        <td ${buyStyle}>[auto]</td>
        ${Array(12).fill(`<td ${buyStyle}>0</td>`).join('')}
        <td ${buyStyle}>FB</td>
        <td ${buyStyle}>-</td>
        <td ${buyStyle}>0</td>
        <td ${buyStyle}>[auto]</td>
        ${Array(10).fill(`<td ${buyStyle}>0</td>`).join('')}
      </tr>

      <!-- SELL ROW -->
      <tr>
        <td ${sellStyle}><b>SELL</b></td>
        <td ${sellStyle}>[YYYY-MM-DD]</td>
        <td ${sellStyle}>[YYYY-MM-DD]</td>
        <td ${sellStyle}>[auto]</td>
        ${Array(12).fill(`<td ${sellStyle}>0</td>`).join('')}
        <td ${sellStyle}>FB</td>
        <td ${sellStyle}>-</td>
        <td ${sellStyle}>0</td>
        <td ${sellStyle}>[auto]</td>
        ${Array(10).fill(`<td ${sellStyle}>0</td>`).join('')}
      </tr>

      <tr><td colspan="35" style="padding:5px"></td></tr>
      <tr>
        <td colspan="35" style="background:#fef3c7;padding:8px;font-size:10px">
          <b>📝 PETUNJUK PENGISIAN:</b><br>
          1. <b>BUY</b> = Modal/Harga dari Vendor &nbsp; | &nbsp; <b>SELL</b> = Harga Jual ke Customer<br>
          2. Format tanggal: <b>YYYY-MM-DD</b> (contoh: 2026-04-08)<br>
          3. Kolom <b>Total Night</b> & <b>Total Tagihan SAR</b> akan dihitung otomatis sistem<br>
          4. Tipe kamar: DBL (Double), TRP (Triple), QRD (Quad), QNT (Quintuple), BED (Extra Bed), EXT (Extension)<br>
          5. <b>Kurs</b> = nilai tukar IDR per 1 SAR pada tanggal transaksi
        </td>
      </tr>
    </table>
  `;

  downloadAsExcel(html, `Template_Input_Booking_${new Date().toISOString().split('T')[0]}.xls`);
}

/**
 * 2. Download Laporan Internal (.xls) - Versi lengkap dengan modal & profit
 */
export function downloadLaporanInternal(data: BookingData) {
  const vendorCalc = calcRow(data.vendor, data.checkIn, data.checkOut);
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const margin = pemesanCalc.totalIDRActual - vendorCalc.totalIDRActual;
  const marginPercent = pemesanCalc.totalIDRActual > 0 ? (margin / pemesanCalc.totalIDRActual * 100) : 0;
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  const status = isLunas ? '✓ LUNAS' : '⚠ BELUM LUNAS';

  const headerStyle = `style="background-color:#1e3a5f;color:white;font-weight:bold;text-align:center;border:1px solid #000;padding:6px;font-size:10px"`;
  const labelStyle = `style="background-color:#f3f4f6;font-weight:bold;border:1px solid #ccc;padding:5px;font-size:11px"`;
  const cellStyle = `style="border:1px solid #ccc;padding:5px;font-size:11px"`;
  const buyRow = `style="background-color:#fce7e5;border:1px solid #ccc;padding:4px;text-align:center;font-size:10px"`;
  const sellRow = `style="background-color:#e6f4ea;border:1px solid #ccc;padding:4px;text-align:center;font-size:10px"`;

  const customerCompany = (data.customerName || '( Nama Customer )').toUpperCase();
  const period = (() => {
    const refDate = data.checkIn ? new Date(data.checkIn) : new Date();
    const month = refDate.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
    return `${month}, ${refDate.getFullYear()}`;
  })();

  const renderRow = (label: string, rowData: any, calc: any, bg: string) => {
    return `
      <tr>
        <td ${bg}><b>${label}</b></td>
        <td ${bg}>${formatDateID(data.checkIn)}</td>
        <td ${bg}>${formatDateID(data.checkOut)}</td>
        <td ${bg}>${calc.totalNight}</td>
        ${(['dbl','trp','qrd','qnt','bed','ext']).map(r => `
          <td ${bg}>${rowData[r].qty || 0}</td>
          <td ${bg}>${rowData[r].rate || 0}</td>
        `).join('')}
        <td ${bg}>${safeStr(rowData.mealPlan)}</td>
        <td ${bg}>${safeStr(rowData.vat)}</td>
        <td ${bg}>${rowData.transport || 0}</td>
        <td ${bg}><b>SAR ${formatNumber(calc.totalSAR)}</b></td>
        ${rowData.payments.map((p: any) => `
          <td ${bg}>${p.idrPaid ? formatNumber(Number(p.idrPaid)) : '0'}</td>
          <td ${bg}>${p.kurs || 0}</td>
        `).join('')}
        <td ${bg}><b>${formatNumber(calc.totalIDRMasuk)}</b></td>
        <td ${bg}>${formatNumber(calc.totalSARMasuk)}</td>
        <td ${bg}>${formatNumber(calc.sisaTagihanSAR)}</td>
        <td ${bg}>${formatNumber(calc.estKursRataRata)}</td>
        <td ${bg}>${formatNumber(calc.sisaTagihanIDR)}</td>
        <td ${bg}><b>${formatNumber(calc.totalIDRActual)}</b></td>
      </tr>
    `;
  };

  const html = `
    <table border="1" cellspacing="0" cellpadding="3" style="font-family:Calibri;border-collapse:collapse;width:100%">
      
      <!-- HEADER STATEMENT -->
      <tr>
        <td colspan="37" style="text-align:center;padding:12px;border-bottom:3px solid #ff8c00">
          <div style="font-size:18px;font-weight:bold;color:#1f2937">STATEMENT BOOKING AGENT</div>
          <div style="font-size:13px;font-weight:bold;color:#1f2937;margin-top:4px">PT. TAMIMA JAYA WISATA oleh ${customerCompany}</div>
          <div style="font-size:12px;font-weight:bold;color:#374151;margin-top:2px">BULAN ${period}</div>
          <div style="font-size:10px;color:#dc2626;font-weight:bold;margin-top:6px;background:#fee2e2;padding:3px 8px;display:inline-block">🔒 LAPORAN INTERNAL — RAHASIA PERUSAHAAN</div>
        </td>
      </tr>
      <tr><td colspan="37" style="padding:5px"></td></tr>

      <!-- EXECUTIVE SUMMARY -->
      <tr>
        <td colspan="9" style="background-color:#fce7e5;border:2px solid #dc2626;padding:8px;text-align:center">
          <div style="font-size:10px;color:#7f1d1d;font-weight:bold">MODAL VENDOR (BUY)</div>
          <div style="font-size:16px;color:#7f1d1d;font-weight:bold">IDR ${formatNumber(vendorCalc.totalIDRActual)}</div>
        </td>
        <td colspan="9" style="background-color:#e6f4ea;border:2px solid #059669;padding:8px;text-align:center">
          <div style="font-size:10px;color:#065f46;font-weight:bold">HARGA JUAL (SELL)</div>
          <div style="font-size:16px;color:#065f46;font-weight:bold">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</div>
        </td>
        <td colspan="10" style="background-color:#fef3c7;border:2px solid #d97706;padding:8px;text-align:center">
          <div style="font-size:10px;color:#92400e;font-weight:bold">NET PROFIT</div>
          <div style="font-size:16px;color:#92400e;font-weight:bold">IDR ${formatNumber(margin)}</div>
        </td>
        <td colspan="9" style="background-color:#dbeafe;border:2px solid #2563eb;padding:8px;text-align:center">
          <div style="font-size:10px;color:#1e40af;font-weight:bold">MARGIN %</div>
          <div style="font-size:16px;color:#1e40af;font-weight:bold">${marginPercent.toFixed(2)}%</div>
        </td>
      </tr>
      <tr><td colspan="37" style="padding:5px"></td></tr>

      <!-- METADATA -->
      <tr><td colspan="37" ${labelStyle}>📌 INFORMASI BOOKING</td></tr>
      <tr>
        <td colspan="3" ${cellStyle}><b>Hotel:</b></td>
        <td colspan="6" ${cellStyle}>${safeStr(data.hotelName)}</td>
        <td colspan="3" ${cellStyle}><b>Customer:</b></td>
        <td colspan="6" ${cellStyle}>${safeStr(data.customerName)}</td>
        <td colspan="3" ${cellStyle}><b>Status:</b></td>
        <td colspan="6" ${cellStyle}><b>${status}</b></td>
        <td colspan="3" ${cellStyle}><b>Sales:</b></td>
        <td colspan="7" ${cellStyle}>${safeStr(data.salesPerson)}</td>
      </tr>
      <tr>
        <td colspan="3" ${cellStyle}><b>Vendor:</b></td>
        <td colspan="6" ${cellStyle} style="background:#fef3c7"><b>${safeStr(data.vendorName)}</b></td>
        <td colspan="3" ${cellStyle}><b>PIC Internal:</b></td>
        <td colspan="6" ${cellStyle} style="background:#fef3c7"><b>${safeStr(data.picInternal)}</b></td>
        <td colspan="3" ${cellStyle}><b>Periode:</b></td>
        <td colspan="16" ${cellStyle}>${formatDateID(data.checkIn)} → ${formatDateID(data.checkOut)} (${pemesanCalc.totalNight} Malam)</td>
      </tr>
      <tr><td colspan="37" style="padding:5px"></td></tr>

      <!-- TABLE -->
      <tr>
        <td rowspan="2" ${headerStyle}>#</td>
        <td colspan="2" ${headerStyle}>Tanggal</td>
        <td rowspan="2" ${headerStyle}>Total<br>Night</td>
        <td colspan="12" ${headerStyle}>Room Type & Rate (SAR)</td>
        <td rowspan="2" ${headerStyle}>Meal</td>
        <td rowspan="2" ${headerStyle}>VAT</td>
        <td rowspan="2" ${headerStyle}>Trans</td>
        <td rowspan="2" ${headerStyle}>Total<br>Tagihan SAR</td>
        <td colspan="2" ${headerStyle}>Pembayaran 1</td>
        <td colspan="2" ${headerStyle}>Pembayaran 2</td>
        <td colspan="2" ${headerStyle}>Pembayaran 3</td>
        <td colspan="2" ${headerStyle}>Pembayaran 4</td>
        <td colspan="2" ${headerStyle}>Pembayaran 5</td>
        <td colspan="6" ${headerStyle}>Summary Akumulasi</td>
      </tr>
      <tr>
        <td ${headerStyle}>Check In</td>
        <td ${headerStyle}>Check Out</td>
        <td ${headerStyle}>DBL Q</td><td ${headerStyle}>DBL R</td>
        <td ${headerStyle}>TRP Q</td><td ${headerStyle}>TRP R</td>
        <td ${headerStyle}>QRD Q</td><td ${headerStyle}>QRD R</td>
        <td ${headerStyle}>QNT Q</td><td ${headerStyle}>QNT R</td>
        <td ${headerStyle}>BED Q</td><td ${headerStyle}>BED R</td>
        <td ${headerStyle}>EXT Q</td><td ${headerStyle}>EXT R</td>
        ${Array(5).fill(`<td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>`).join('')}
        <td ${headerStyle}>Total IDR<br>Masuk</td>
        <td ${headerStyle}>Total SAR<br>Masuk</td>
        <td ${headerStyle}>Sisa SAR</td>
        <td ${headerStyle}>Est. Kurs</td>
        <td ${headerStyle}>Sisa IDR</td>
        <td ${headerStyle}>Total IDR<br>Aktual</td>
      </tr>

      ${renderRow('BUY', data.vendor, vendorCalc, buyRow)}
      ${renderRow('SELL', data.pemesan, pemesanCalc, sellRow)}

      <tr><td colspan="37" style="padding:8px"></td></tr>

      <!-- KETERANGAN INTERNAL -->
      <tr>
        <td colspan="37" style="background:#e0e7ff;padding:10px;font-size:10px;border:1px solid #6366f1">
          <b style="color:#3730a3">🔒 KETERANGAN INTERNAL (RAHASIA):</b><br>
          • <b>Vendor:</b> ${safeStr(data.vendorName) || '-'}<br>
          • <b>PIC Internal:</b> ${safeStr(data.picInternal) || '-'}<br>
          • <b>Modal Vendor:</b> IDR ${formatNumber(vendorCalc.totalIDRActual)} | <b>Net Profit:</b> IDR ${formatNumber(margin)} (${marginPercent.toFixed(2)}%)<br>
          • Dokumen ini berisi data finansial perusahaan dan TIDAK BOLEH disebarkan ke customer.
        </td>
      </tr>

      <tr><td colspan="37" style="padding:10px"></td></tr>
      <tr>
        <td colspan="25" ${cellStyle}>
          <i>Dicetak otomatis pada ${new Date().toLocaleString('id-ID')}</i>
        </td>
        <td colspan="12" style="text-align:center;padding:10px">
          <div style="font-size:10px;color:#475569">Tertanda,</div>
          <div style="height:30px"></div>
          <div style="border-top:1px solid #475569;font-weight:bold;font-size:10px;padding-top:3px">( GHOFAR )</div>
        </td>
      </tr>
    </table>
  `;

  const filename = `Laporan_Internal_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
  downloadAsExcel(html, filename);
}

/**
 * MULTI-BOOKING: Download Laporan Internal Database (.xls)
 * Berdasarkan filter aktif di tabel database
 */
export function downloadMultipleLaporanInternal(orders: BookingData[], filterInfo: string = 'Semua Data') {
  const headerStyle = `style="background-color:#1e3a5f;color:white;font-weight:bold;text-align:center;border:1px solid #000;padding:5px;font-size:10px"`;
  const cellStyle = `style="border:1px solid #ccc;padding:4px;font-size:10px"`;
  const buyRow = `style="background-color:#fce7e5;border:1px solid #ccc;padding:3px;text-align:center;font-size:9px"`;
  const sellRow = `style="background-color:#e6f4ea;border:1px solid #ccc;padding:3px;text-align:center;font-size:9px"`;

  // Calculate summary
  const totalAllRevenue = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).totalIDRActual, 0);
  const totalAllModal = orders.reduce((sum, o) => sum + calcRow(o.vendor, o.checkIn, o.checkOut).totalIDRActual, 0);
  const totalAllProfit = totalAllRevenue - totalAllModal;
  const totalAllReceived = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).totalIDRMasuk, 0);
  const totalAllSisa = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).sisaTagihanIDR, 0);

  let rowsHtml = '';
  orders.forEach((order, idx) => {
    const vc = calcRow(order.vendor, order.checkIn, order.checkOut);
    const pc = calcRow(order.pemesan, order.checkIn, order.checkOut);
    const profit = pc.totalIDRActual - vc.totalIDRActual;
    const marginPct = pc.totalIDRActual > 0 ? (profit / pc.totalIDRActual * 100) : 0;
    const isLunas = pc.sisaTagihanIDR <= 0 && pc.totalIDRMasuk > 0;
    const statusText = isLunas ? '✓ LUNAS' : (pc.totalIDRMasuk > 0 ? '⚠ BELUM LUNAS' : '📝 DRAFT');

    const renderSubRow = (label: string, rowData: any, calc: any, bg: string) => `
      <tr>
        <td ${bg}><b>${label}</b></td>
        <td ${bg}>${rowData.dbl.qty || 0}/${rowData.dbl.rate || 0}</td>
        <td ${bg}>${rowData.trp.qty || 0}/${rowData.trp.rate || 0}</td>
        <td ${bg}>${rowData.qrd.qty || 0}/${rowData.qrd.rate || 0}</td>
        <td ${bg}>${rowData.qnt.qty || 0}/${rowData.qnt.rate || 0}</td>
        <td ${bg}>${rowData.bed.qty || 0}/${rowData.bed.rate || 0}</td>
        <td ${bg}>${rowData.ext.qty || 0}/${rowData.ext.rate || 0}</td>
        <td ${bg}>${safeStr(rowData.mealPlan)}</td>
        <td ${bg}>${safeStr(rowData.vat)}</td>
        <td ${bg}>${rowData.transport || 0}</td>
        <td ${bg}><b>SAR ${formatNumber(calc.totalSAR)}</b></td>
        <td ${bg}>${formatNumber(calc.totalIDRMasuk)}</td>
        <td ${bg}>${formatNumber(calc.sisaTagihanIDR)}</td>
        <td ${bg}><b>${formatNumber(calc.totalIDRActual)}</b></td>
      </tr>
    `;

    rowsHtml += `
      <!-- Booking Header -->
      <tr>
        <td colspan="14" style="background:#fef3c7;border:2px solid #f59e0b;padding:6px;font-size:11px">
          <b>📋 BOOKING #${idx + 1}</b> 
          | <b>Hotel:</b> ${safeStr(order.hotelName)} 
          | <b>Customer:</b> ${safeStr(order.customerName)} 
          | <b>Vendor:</b> ${safeStr(order.vendorName)}
          | <b>PIC:</b> ${safeStr(order.picInternal)}
          | <b>Sales:</b> ${safeStr(order.salesPerson)}
          | <b>Periode:</b> ${formatDateID(order.checkIn)} → ${formatDateID(order.checkOut)} (${pc.totalNight}M)
          | <b>Status:</b> ${statusText}
          | <b>NET PROFIT: IDR ${formatNumber(profit)}</b> (${marginPct.toFixed(2)}%)
        </td>
      </tr>
      <!-- Table Header -->
      <tr>
        <td ${headerStyle}>Type</td>
        <td ${headerStyle}>DBL Q/R</td>
        <td ${headerStyle}>TRP Q/R</td>
        <td ${headerStyle}>QRD Q/R</td>
        <td ${headerStyle}>QNT Q/R</td>
        <td ${headerStyle}>BED Q/R</td>
        <td ${headerStyle}>EXT Q/R</td>
        <td ${headerStyle}>Meal</td>
        <td ${headerStyle}>VAT</td>
        <td ${headerStyle}>Trans</td>
        <td ${headerStyle}>Total SAR</td>
        <td ${headerStyle}>IDR Masuk</td>
        <td ${headerStyle}>Sisa IDR</td>
        <td ${headerStyle}>Total IDR Aktual</td>
      </tr>
      ${renderSubRow('BUY', order.vendor, vc, buyRow)}
      ${renderSubRow('SELL', order.pemesan, pc, sellRow)}
      <tr><td colspan="14" style="padding:3px"></td></tr>
    `;
  });

  const html = `
    <table border="1" cellspacing="0" cellpadding="3" style="font-family:Calibri;border-collapse:collapse;width:100%">
      <!-- HEADER -->
      <tr>
        <td colspan="14" style="text-align:center;padding:12px;border-bottom:3px solid #ff8c00">
          <div style="font-size:18px;font-weight:bold;color:#1f2937">DATABASE LAPORAN INTERNAL — REKAP MULTI-BOOKING</div>
          <div style="font-size:13px;font-weight:bold;color:#1f2937;margin-top:4px">PT. TAMIMA JAYA WISATA</div>
          <div style="font-size:11px;color:#374151;margin-top:2px">Filter Aktif: <b>${filterInfo}</b> · Total ${orders.length} Booking</div>
          <div style="font-size:10px;color:#dc2626;font-weight:bold;margin-top:6px;background:#fee2e2;padding:3px 8px;display:inline-block">🔒 LAPORAN INTERNAL — RAHASIA PERUSAHAAN</div>
        </td>
      </tr>
      <tr><td colspan="14" style="padding:5px"></td></tr>

      <!-- GRAND SUMMARY -->
      <tr>
        <td colspan="3" style="background:#fce7e5;border:2px solid #dc2626;padding:8px;text-align:center">
          <div style="font-size:9px;color:#7f1d1d;font-weight:bold">TOTAL MODAL (BUY)</div>
          <div style="font-size:14px;color:#7f1d1d;font-weight:bold">IDR ${formatNumber(totalAllModal)}</div>
        </td>
        <td colspan="3" style="background:#e6f4ea;border:2px solid #059669;padding:8px;text-align:center">
          <div style="font-size:9px;color:#065f46;font-weight:bold">TOTAL REVENUE (SELL)</div>
          <div style="font-size:14px;color:#065f46;font-weight:bold">IDR ${formatNumber(totalAllRevenue)}</div>
        </td>
        <td colspan="3" style="background:#fef3c7;border:2px solid #d97706;padding:8px;text-align:center">
          <div style="font-size:9px;color:#92400e;font-weight:bold">TOTAL NET PROFIT</div>
          <div style="font-size:14px;color:#92400e;font-weight:bold">IDR ${formatNumber(totalAllProfit)}</div>
        </td>
        <td colspan="3" style="background:#dbeafe;border:2px solid #2563eb;padding:8px;text-align:center">
          <div style="font-size:9px;color:#1e40af;font-weight:bold">TOTAL DITERIMA</div>
          <div style="font-size:14px;color:#1e40af;font-weight:bold">IDR ${formatNumber(totalAllReceived)}</div>
        </td>
        <td colspan="2" style="background:#fed7aa;border:2px solid #ea580c;padding:8px;text-align:center">
          <div style="font-size:9px;color:#9a3412;font-weight:bold">TOTAL SISA</div>
          <div style="font-size:12px;color:#9a3412;font-weight:bold">IDR ${formatNumber(totalAllSisa)}</div>
        </td>
      </tr>
      <tr><td colspan="14" style="padding:8px"></td></tr>

      ${rowsHtml}

      <!-- FOOTER -->
      <tr><td colspan="14" style="padding:8px"></td></tr>
      <tr>
        <td colspan="14" style="background:#e0e7ff;padding:8px;font-size:10px;border:1px solid #6366f1">
          <b style="color:#3730a3">🔒 INFO:</b> Dokumen ini berisi data finansial internal perusahaan termasuk modal vendor dan margin profit. <b>TIDAK BOLEH disebarkan ke customer.</b>
        </td>
      </tr>
      <tr>
        <td colspan="10" ${cellStyle}><i>Dicetak otomatis pada ${new Date().toLocaleString('id-ID')}</i></td>
        <td colspan="4" style="text-align:center;padding:10px">
          <div style="font-size:10px;color:#475569">Tertanda,</div>
          <div style="height:30px"></div>
          <div style="border-top:1px solid #475569;font-weight:bold;font-size:10px;padding-top:3px">( GHOFAR )</div>
        </td>
      </tr>
    </table>
  `;

  const filename = `Database_Laporan_Internal_${new Date().toISOString().split('T')[0]}.xls`;
  downloadAsExcel(html, filename);
}

/**
 * MULTI-BOOKING: Download Statement Booking Customer Multi (.xls)
 * Untuk satu customer dengan multiple booking
 */
export function downloadMultipleStatementCustomer(orders: BookingData[], filterInfo: string = 'Semua Data') {
  const headerStyle = `style="background-color:#1e3a5f;color:white;font-weight:bold;text-align:center;border:1px solid #000;padding:5px;font-size:10px"`;
  const cellStyle = `style="border:1px solid #ccc;padding:4px;font-size:10px"`;
  const sellRow = `style="background-color:#e6f4ea;border:1px solid #ccc;padding:3px;text-align:center;font-size:9px"`;

  // Calculate summary (only customer-safe data)
  const totalAllRevenue = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).totalIDRActual, 0);
  const totalAllReceived = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).totalIDRMasuk, 0);
  const totalAllSisa = orders.reduce((sum, o) => sum + calcRow(o.pemesan, o.checkIn, o.checkOut).sisaTagihanIDR, 0);

  let rowsHtml = '';
  orders.forEach((order, idx) => {
    const pc = calcRow(order.pemesan, order.checkIn, order.checkOut);
    const isLunas = pc.sisaTagihanIDR <= 0 && pc.totalIDRMasuk > 0;
    const statusText = isLunas ? '✓ LUNAS' : (pc.totalIDRMasuk > 0 ? '⚠ BELUM LUNAS' : '📝 BARU');
    const rowData = order.pemesan;

    rowsHtml += `
      <!-- Booking Header -->
      <tr>
        <td colspan="14" style="background:#fef3c7;border:2px solid #f59e0b;padding:6px;font-size:11px">
          <b>📋 BOOKING #${idx + 1}</b> 
          | <b>Hotel:</b> ${safeStr(order.hotelName)} 
          | <b>Customer:</b> ${safeStr(order.customerName)} 
          | <b>Sales:</b> ${safeStr(order.salesPerson)}
          | <b>Periode:</b> ${formatDateID(order.checkIn)} → ${formatDateID(order.checkOut)} (${pc.totalNight}M)
          | <b>Status:</b> <span style="color:${isLunas ? '#15803d' : '#991b1b'}">${statusText}</span>
        </td>
      </tr>
      <!-- Table Header -->
      <tr>
        <td ${headerStyle}>DBL Q/R</td>
        <td ${headerStyle}>TRP Q/R</td>
        <td ${headerStyle}>QRD Q/R</td>
        <td ${headerStyle}>QNT Q/R</td>
        <td ${headerStyle}>BED Q/R</td>
        <td ${headerStyle}>EXT Q/R</td>
        <td ${headerStyle}>Meal</td>
        <td ${headerStyle}>VAT</td>
        <td ${headerStyle}>Trans</td>
        <td ${headerStyle}>Total SAR</td>
        <td ${headerStyle}>Total Tagihan</td>
        <td ${headerStyle}>Sudah Bayar</td>
        <td ${headerStyle}>Sisa</td>
        <td ${headerStyle}>Status</td>
      </tr>
      <tr>
        <td ${sellRow}>${rowData.dbl.qty || 0}/${rowData.dbl.rate || 0}</td>
        <td ${sellRow}>${rowData.trp.qty || 0}/${rowData.trp.rate || 0}</td>
        <td ${sellRow}>${rowData.qrd.qty || 0}/${rowData.qrd.rate || 0}</td>
        <td ${sellRow}>${rowData.qnt.qty || 0}/${rowData.qnt.rate || 0}</td>
        <td ${sellRow}>${rowData.bed.qty || 0}/${rowData.bed.rate || 0}</td>
        <td ${sellRow}>${rowData.ext.qty || 0}/${rowData.ext.rate || 0}</td>
        <td ${sellRow}>${safeStr(rowData.mealPlan)}</td>
        <td ${sellRow}>${safeStr(rowData.vat)}</td>
        <td ${sellRow}>${rowData.transport || 0}</td>
        <td ${sellRow}><b>SAR ${formatNumber(pc.totalSAR)}</b></td>
        <td ${sellRow}><b>IDR ${formatNumber(pc.totalIDRActual)}</b></td>
        <td ${sellRow}>IDR ${formatNumber(pc.totalIDRMasuk)}</td>
        <td ${sellRow} style="color:${isLunas ? '#15803d' : '#991b1b'}"><b>${isLunas ? '✓ 0' : 'IDR ' + formatNumber(pc.sisaTagihanIDR)}</b></td>
        <td ${sellRow}><b>${statusText}</b></td>
      </tr>
      <tr><td colspan="14" style="padding:3px"></td></tr>
    `;
  });

  const html = `
    <table border="1" cellspacing="0" cellpadding="3" style="font-family:Calibri;border-collapse:collapse;width:100%">
      <!-- HEADER -->
      <tr>
        <td colspan="14" style="text-align:center;padding:12px;border-bottom:3px solid #ff8c00">
          <div style="font-size:18px;font-weight:bold;color:#1f2937">STATEMENT BOOKING — REKAP MULTI-BOOKING</div>
          <div style="font-size:13px;font-weight:bold;color:#1f2937;margin-top:4px">PT. TAMIMA JAYA WISATA</div>
          <div style="font-size:11px;color:#374151;margin-top:2px">Filter: <b>${filterInfo}</b> · Total ${orders.length} Booking</div>
          <div style="font-size:10px;color:#0f766e;font-weight:bold;margin-top:6px;background:#ccfbf1;padding:3px 8px;display:inline-block">👤 STATEMENT BOOKING UNTUK CUSTOMER</div>
        </td>
      </tr>
      <tr><td colspan="14" style="padding:5px"></td></tr>

      <!-- GRAND SUMMARY -->
      <tr>
        <td colspan="5" style="background:#e6f4ea;border:2px solid #059669;padding:10px;text-align:center">
          <div style="font-size:10px;color:#065f46;font-weight:bold">TOTAL TAGIHAN</div>
          <div style="font-size:16px;color:#065f46;font-weight:bold">IDR ${formatNumber(totalAllRevenue)}</div>
        </td>
        <td colspan="5" style="background:#dbeafe;border:2px solid #2563eb;padding:10px;text-align:center">
          <div style="font-size:10px;color:#1e40af;font-weight:bold">SUDAH DIBAYAR</div>
          <div style="font-size:16px;color:#1e40af;font-weight:bold">IDR ${formatNumber(totalAllReceived)}</div>
        </td>
        <td colspan="4" style="background:${totalAllSisa <= 0 ? '#dcfce7' : '#fee2e2'};border:2px solid ${totalAllSisa <= 0 ? '#16a34a' : '#dc2626'};padding:10px;text-align:center">
          <div style="font-size:10px;color:${totalAllSisa <= 0 ? '#15803d' : '#991b1b'};font-weight:bold">TOTAL SISA</div>
          <div style="font-size:16px;color:${totalAllSisa <= 0 ? '#15803d' : '#991b1b'};font-weight:bold">${totalAllSisa <= 0 ? '✓ LUNAS' : 'IDR ' + formatNumber(totalAllSisa)}</div>
        </td>
      </tr>
      <tr><td colspan="14" style="padding:8px"></td></tr>

      ${rowsHtml}

      <!-- FOOTER -->
      <tr><td colspan="14" style="padding:8px"></td></tr>
      <tr>
        <td colspan="14" style="background:#fef3c7;padding:10px;font-size:10px;border:1px solid #d97706">
          <b style="color:#92400e">📋 KETERANGAN:</b><br>
          1. Tagihan berlaku berdasarkan kurs SAR ke IDR pada tanggal pembayaran.<br>
          2. Pembayaran termin selanjutnya menggunakan kurs yang berlaku saat transaksi dilakukan.<br>
          3. Mohon lakukan konfirmasi pembayaran melalui pihak yang tertera.
        </td>
      </tr>
      <tr>
        <td colspan="10" ${cellStyle}><i>Dicetak otomatis pada ${new Date().toLocaleString('id-ID')}</i></td>
        <td colspan="4" style="text-align:center;padding:10px">
          <div style="font-size:10px;color:#475569">Tertanda,</div>
          <div style="height:30px"></div>
          <div style="border-top:1px solid #475569;font-weight:bold;font-size:10px;padding-top:3px">( GHOFAR )</div>
        </td>
      </tr>
    </table>
  `;

  const filename = `Statement_Booking_Database_${new Date().toISOString().split('T')[0]}.xls`;
  downloadAsExcel(html, filename);
}

/**
 * 3. Download Statement Booking Customer (.xls) - Versi aman tanpa data perusahaan
 */
export function downloadStatementCustomer(data: BookingData) {
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  const status = isLunas ? '✓ LUNAS' : '⚠ BELUM LUNAS';

  const headerStyle = `style="background-color:#1e3a5f;color:white;font-weight:bold;text-align:center;border:1px solid #000;padding:6px;font-size:10px"`;
  const labelStyle = `style="background-color:#f3f4f6;font-weight:bold;border:1px solid #ccc;padding:5px;font-size:11px"`;
  const cellStyle = `style="border:1px solid #ccc;padding:5px;font-size:11px"`;
  const sellRow = `style="background-color:#e6f4ea;border:1px solid #ccc;padding:4px;text-align:center;font-size:10px"`;

  const customerCompany = (data.customerName || '( Nama Customer )').toUpperCase();
  const period = (() => {
    const refDate = data.checkIn ? new Date(data.checkIn) : new Date();
    const month = refDate.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
    return `${month}, ${refDate.getFullYear()}`;
  })();

  const rowData = data.pemesan;
  const calc = pemesanCalc;

  const renderRow = `
    <tr>
      <td ${sellRow}>${formatDateID(data.checkIn)}</td>
      <td ${sellRow}>${formatDateID(data.checkOut)}</td>
      <td ${sellRow}>${calc.totalNight}</td>
      ${(['dbl','trp','qrd','qnt','bed','ext']).map(r => `
        <td ${sellRow}>${(rowData as any)[r].qty || 0}</td>
        <td ${sellRow}>${(rowData as any)[r].rate || 0}</td>
      `).join('')}
      <td ${sellRow}>${safeStr(rowData.mealPlan)}</td>
      <td ${sellRow}>${safeStr(rowData.vat)}</td>
      <td ${sellRow}>${rowData.transport || 0}</td>
      <td ${sellRow}><b>SAR ${formatNumber(calc.totalSAR)}</b></td>
      ${rowData.payments.map((p: any) => `
        <td ${sellRow}>${p.idrPaid ? formatNumber(Number(p.idrPaid)) : '0'}</td>
        <td ${sellRow}>${p.kurs || 0}</td>
      `).join('')}
      <td ${sellRow}><b>${formatNumber(calc.totalIDRMasuk)}</b></td>
      <td ${sellRow}>${formatNumber(calc.totalSARMasuk)}</td>
      <td ${sellRow}>${formatNumber(calc.sisaTagihanSAR)}</td>
      <td ${sellRow}>${formatNumber(calc.estKursRataRata)}</td>
      <td ${sellRow}>${formatNumber(calc.sisaTagihanIDR)}</td>
      <td ${sellRow}><b>${formatNumber(calc.totalIDRActual)}</b></td>
    </tr>
  `;

  const html = `
    <table border="1" cellspacing="0" cellpadding="3" style="font-family:Calibri;border-collapse:collapse;width:100%">
      
      <!-- HEADER STATEMENT -->
      <tr>
        <td colspan="36" style="text-align:center;padding:12px;border-bottom:3px solid #ff8c00">
          <div style="font-size:18px;font-weight:bold;color:#1f2937">STATEMENT BOOKING AGENT</div>
          <div style="font-size:13px;font-weight:bold;color:#1f2937;margin-top:4px">PT. TAMIMA JAYA WISATA oleh ${customerCompany}</div>
          <div style="font-size:12px;font-weight:bold;color:#374151;margin-top:2px">BULAN ${period}</div>
          <div style="font-size:10px;color:#0f766e;font-weight:bold;margin-top:6px;background:#ccfbf1;padding:3px 8px;display:inline-block">👤 STATEMENT BOOKING UNTUK CUSTOMER</div>
        </td>
      </tr>
      <tr><td colspan="36" style="padding:5px"></td></tr>

      <!-- EXECUTIVE SUMMARY (HANYA TAGIHAN) -->
      <tr>
        <td colspan="12" style="background-color:#e6f4ea;border:2px solid #059669;padding:10px;text-align:center">
          <div style="font-size:10px;color:#065f46;font-weight:bold">TOTAL TAGIHAN</div>
          <div style="font-size:16px;color:#065f46;font-weight:bold">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</div>
        </td>
        <td colspan="12" style="background-color:#dbeafe;border:2px solid #2563eb;padding:10px;text-align:center">
          <div style="font-size:10px;color:#1e40af;font-weight:bold">SUDAH DIBAYAR</div>
          <div style="font-size:16px;color:#1e40af;font-weight:bold">IDR ${formatNumber(pemesanCalc.totalIDRMasuk)}</div>
        </td>
        <td colspan="12" style="background-color:${isLunas ? '#dcfce7' : '#fee2e2'};border:2px solid ${isLunas ? '#16a34a' : '#dc2626'};padding:10px;text-align:center">
          <div style="font-size:10px;color:${isLunas ? '#15803d' : '#991b1b'};font-weight:bold">SISA TAGIHAN</div>
          <div style="font-size:16px;color:${isLunas ? '#15803d' : '#991b1b'};font-weight:bold">${isLunas ? '✓ LUNAS' : 'IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR)}</div>
        </td>
      </tr>
      <tr><td colspan="36" style="padding:5px"></td></tr>

      <!-- METADATA (TANPA VENDOR & PIC) -->
      <tr><td colspan="36" ${labelStyle}>📌 INFORMASI BOOKING</td></tr>
      <tr>
        <td colspan="4" ${cellStyle}><b>Hotel:</b></td>
        <td colspan="8" ${cellStyle}>${safeStr(data.hotelName)}</td>
        <td colspan="4" ${cellStyle}><b>Customer:</b></td>
        <td colspan="8" ${cellStyle}>${safeStr(data.customerName)}</td>
        <td colspan="4" ${cellStyle}><b>Status:</b></td>
        <td colspan="8" ${cellStyle}><b style="color:${isLunas ? '#15803d' : '#991b1b'}">${status}</b></td>
      </tr>
      <tr>
        <td colspan="4" ${cellStyle}><b>Periode:</b></td>
        <td colspan="20" ${cellStyle}>${formatDateID(data.checkIn)} → ${formatDateID(data.checkOut)} (${pemesanCalc.totalNight} Malam)</td>
        <td colspan="4" ${cellStyle}><b>Sales:</b></td>
        <td colspan="8" ${cellStyle}>${safeStr(data.salesPerson)}</td>
      </tr>
      <tr><td colspan="36" style="padding:5px"></td></tr>

      <!-- TABLE (HANYA SELL) -->
      <tr>
        <td colspan="2" ${headerStyle}>Tanggal</td>
        <td rowspan="2" ${headerStyle}>Total<br>Night</td>
        <td colspan="12" ${headerStyle}>Room Type & Rate (SAR)</td>
        <td rowspan="2" ${headerStyle}>Meal</td>
        <td rowspan="2" ${headerStyle}>VAT</td>
        <td rowspan="2" ${headerStyle}>Trans</td>
        <td rowspan="2" ${headerStyle}>Total<br>Tagihan SAR</td>
        <td colspan="2" ${headerStyle}>Pembayaran 1</td>
        <td colspan="2" ${headerStyle}>Pembayaran 2</td>
        <td colspan="2" ${headerStyle}>Pembayaran 3</td>
        <td colspan="2" ${headerStyle}>Pembayaran 4</td>
        <td colspan="2" ${headerStyle}>Pembayaran 5</td>
        <td colspan="6" ${headerStyle}>Summary Akumulasi</td>
      </tr>
      <tr>
        <td ${headerStyle}>Check In</td>
        <td ${headerStyle}>Check Out</td>
        <td ${headerStyle}>DBL Q</td><td ${headerStyle}>DBL R</td>
        <td ${headerStyle}>TRP Q</td><td ${headerStyle}>TRP R</td>
        <td ${headerStyle}>QRD Q</td><td ${headerStyle}>QRD R</td>
        <td ${headerStyle}>QNT Q</td><td ${headerStyle}>QNT R</td>
        <td ${headerStyle}>BED Q</td><td ${headerStyle}>BED R</td>
        <td ${headerStyle}>EXT Q</td><td ${headerStyle}>EXT R</td>
        ${Array(5).fill(`<td ${headerStyle}>IDR</td><td ${headerStyle}>Kurs</td>`).join('')}
        <td ${headerStyle}>Total IDR<br>Masuk</td>
        <td ${headerStyle}>Total SAR<br>Masuk</td>
        <td ${headerStyle}>Sisa SAR</td>
        <td ${headerStyle}>Est. Kurs</td>
        <td ${headerStyle}>Sisa IDR</td>
        <td ${headerStyle}>Total IDR<br>Aktual</td>
      </tr>

      ${renderRow}

      <tr><td colspan="36" style="padding:8px"></td></tr>

      <!-- SYARAT & KETENTUAN -->
      <tr>
        <td colspan="36" style="background:#fef3c7;padding:10px;font-size:10px;border:1px solid #d97706">
          <b style="color:#92400e">📋 KETERANGAN & SYARAT:</b><br>
          1. Tagihan ini berlaku berdasarkan kurs SAR ke IDR pada tanggal pembayaran.<br>
          2. Pembayaran termin selanjutnya menggunakan kurs yang berlaku saat transaksi dilakukan.<br>
          3. Mohon lakukan konfirmasi pembayaran melalui pihak yang tertera.<br>
          4. Dokumen ini sah tanpa tanda tangan basah karena dicetak melalui sistem.
        </td>
      </tr>

      <tr><td colspan="36" style="padding:10px"></td></tr>
      <tr>
        <td colspan="18" style="text-align:center;padding:10px">
          <div style="font-size:10px;color:#475569">Penerima / Customer,</div>
          <div style="height:30px"></div>
          <div style="border-top:1px solid #475569;font-weight:bold;font-size:10px;padding-top:3px">( ${safeStr(data.customerName) || '..................'} )</div>
        </td>
        <td colspan="18" style="text-align:center;padding:10px">
          <div style="font-size:10px;color:#475569">Tertanda,</div>
          <div style="height:30px"></div>
          <div style="border-top:1px solid #475569;font-weight:bold;font-size:10px;padding-top:3px">( GHOFAR )</div>
        </td>
      </tr>
      <tr>
        <td colspan="36" style="text-align:center;padding:5px;font-style:italic;font-size:9px;color:#64748b">
          Dicetak otomatis pada ${new Date().toLocaleString('id-ID')} · Statement Booking Customer
        </td>
      </tr>
    </table>
  `;

  const filename = `Statement_Booking_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
  downloadAsExcel(html, filename);
}