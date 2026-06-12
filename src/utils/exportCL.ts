import type { BookingData } from '../types';
import { calcRow, formatNumber } from './calc';

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const formatDateShort = (iso: string) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

/**
 * Get raw HTML from preview (just innerHTML — for DOCX where styles via Tailwind classes work less well)
 * For DOCX we wrap in special MS Word HTML with embedded Tailwind-like styles
 */
function getPreviewInnerHTML(): string | null {
  const previewEl = document.getElementById('cl-preview-content');
  if (!previewEl) return null;
  return previewEl.innerHTML;
}

/**
 * ════════════════════════════════════════════
 * DOWNLOAD CL AS REAL PDF
 * Captures the EXACT preview element using html-to-image + jsPDF
 * Result: PDF matches preview pixel-perfect
 * 
 * Why html-to-image instead of html2canvas?
 * Tailwind v4 uses OKLCH color space which html2canvas cannot parse.
 * html-to-image uses native browser SVG foreignObject which supports
 * all modern CSS (OKLCH, color-mix, etc.)
 * ════════════════════════════════════════════
 */
export async function downloadCLPdf(data: BookingData): Promise<void> {
  const clNumber = `CL-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  const filename = `CL_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${clNumber}.pdf`;

  const previewEl = document.getElementById('cl-preview-content');
  if (!previewEl) {
    throw new Error('Element preview CL tidak ditemukan di DOM. Pastikan modal preview sudah dibuka.');
  }

  // Verify element has actual content rendered
  if (previewEl.children.length === 0) {
    await new Promise(r => setTimeout(r, 500));
    if (previewEl.children.length === 0) {
      throw new Error('Konten CL belum ter-render. Coba lagi dalam beberapa detik.');
    }
  }

  // ════════════════════════════════════════════
  // STRATEGY: html-to-image + jsPDF
  // - html-to-image supports modern CSS (OKLCH from Tailwind v4!)
  // - More reliable than html2canvas which fails on OKLCH colors
  // - Output: PNG dataURL → embed to PDF via jsPDF
  // ════════════════════════════════════════════

  // STEP 1: Traverse parents and force visibility (preview might be in hidden tab)
  const parentOriginalStyles: Array<{ el: HTMLElement; display: string; visibility: string; position: string; left: string }> = [];
  let parentToFix: HTMLElement | null = previewEl.parentElement;
  
  while (parentToFix && parentToFix !== document.body) {
    const computed = window.getComputedStyle(parentToFix);
    if (computed.display === 'none' || computed.visibility === 'hidden' || parentToFix.style.left === '-99999px') {
      parentOriginalStyles.push({
        el: parentToFix,
        display: parentToFix.style.display,
        visibility: parentToFix.style.visibility,
        position: parentToFix.style.position,
        left: parentToFix.style.left,
      });
      parentToFix.style.display = 'block';
      parentToFix.style.visibility = 'visible';
      // Bring offscreen elements back if positioned at left:-99999px
      if (parentToFix.style.left === '-99999px' || parentToFix.style.left.includes('-')) {
        parentToFix.style.position = 'static';
        parentToFix.style.left = 'auto';
      }
    }
    parentToFix = parentToFix.parentElement;
  }

  // STEP 2: Wait for images (especially stempel-tamima.png)
  const images = Array.from(previewEl.querySelectorAll('img'));
  await Promise.all(
    images.map(img => {
      if (img.complete && img.naturalHeight > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 3000);
        img.addEventListener('load', () => { clearTimeout(timer); resolve(); });
        img.addEventListener('error', () => { clearTimeout(timer); resolve(); });
      });
    })
  );

  // STEP 3: Wait for layout to settle
  await new Promise(r => setTimeout(r, 400));

  try {
    // Dynamic import — only load when needed
    const [{ toPng }, { default: jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ]);

    // Get element dimensions for sizing
    const elementWidth = previewEl.offsetWidth || previewEl.scrollWidth;
    const elementHeight = previewEl.offsetHeight || previewEl.scrollHeight;

    if (elementWidth === 0 || elementHeight === 0) {
      throw new Error(`Element memiliki dimensi nol (${elementWidth}x${elementHeight}). Pastikan modal preview terbuka.`);
    }

    // STEP 4: Convert HTML to PNG image (high quality, supports OKLCH)
    const pngDataUrl = await toPng(previewEl, {
      quality: 1.0,
      pixelRatio: 2, // 2x for retina-like quality
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: elementWidth,
      height: elementHeight,
      style: {
        margin: '0',
        padding: previewEl.style.padding || '32px',
      },
      filter: (node: HTMLElement) => {
        // Skip any unwanted nodes (e.g., scripts, hidden buttons)
        if (node.tagName === 'SCRIPT') return false;
        return true;
      },
    });

    if (!pngDataUrl || pngDataUrl.length < 100) {
      throw new Error('PNG dataURL kosong atau invalid');
    }

    // STEP 5: Create LETTER PDF with MINIMUM MARGIN and embed PNG
    // Letter size: 215.9 x 279.4 mm (8.5 x 11 inch)
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'letter',  // ← Letter size (not A4)
      orientation: 'portrait',
      compress: true,
    });

    // Letter dimensions in mm
    const pdfWidth = 215.9;
    const pdfHeight = 279.4;
    const margin = 3; // ← MINIMUM margin (3mm = ~0.12 inch)
    const usableWidth = pdfWidth - (margin * 2);
    const usableHeight = pdfHeight - (margin * 2);

    // Calculate fit dimensions — FORCE FIT 1 PAGE
    // We scale image to fit within usableHeight if needed
    const aspectRatio = elementHeight / elementWidth;
    let imgWidth = usableWidth;
    let imgHeight = imgWidth * aspectRatio;

    // If image height > usable height, scale down to fit in 1 page
    if (imgHeight > usableHeight) {
      imgHeight = usableHeight;
      imgWidth = imgHeight / aspectRatio;
    }

    // Center horizontally if smaller than usable width
    const xPos = (pdfWidth - imgWidth) / 2;
    const yPos = margin;

    // STEP 6: Embed image (ALWAYS 1 PAGE - auto-scaled to fit)
    pdf.addImage(pngDataUrl, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'FAST');

    // STEP 7: Save PDF (triggers download)
    pdf.save(filename);

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    // STEP 8: Restore parent styles
    parentOriginalStyles.forEach(({ el, display, visibility, position, left }) => {
      el.style.display = display;
      el.style.visibility = visibility;
      el.style.position = position;
      el.style.left = left;
    });
  }
}

/**
 * ════════════════════════════════════════════
 * DOWNLOAD CL AS WORD DOC
 * Uses preview HTML + injected CSS for Word compatibility
 * Result: Word file matches preview as closely as possible
 * ════════════════════════════════════════════
 */
export function downloadCLDocx(data: BookingData) {
  const clNumber = `CL-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  const filename = `CL_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${clNumber}.doc`;

  // Get inner HTML from preview
  const previewHTML = getPreviewInnerHTML();
  if (!previewHTML) {
    alert('⚠️ Modal preview CL belum dibuka.\n\nBuka "Preview & Kirim CL" terlebih dahulu agar DOCX identik dengan preview.');
    return;
  }

  // Convert Tailwind classes & inline styles to Word-compatible HTML
  // We inject comprehensive CSS that mimics Tailwind utilities used in CL component
  const wordHTML = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<title>Confirmation Letter ${clNumber}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotPromptForConvert/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page WordSection1 {
  size: 21cm 29.7cm;
  margin: 1.2cm 1.2cm 1.2cm 1.2cm;
  mso-page-orientation: portrait;
}
div.WordSection1 { page: WordSection1; }
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 10pt;
  color: #0f172a;
  margin: 0;
  line-height: 1.4;
}
table { border-collapse: collapse; width: 100%; }
td, th { vertical-align: top; }

/* === Tailwind utility classes used in CL === */
.bg-white { background-color: #ffffff; }
.bg-slate-50 { background-color: #f8fafc; }
.bg-slate-100 { background-color: #f1f5f9; }
.bg-slate-200 { background-color: #e2e8f0; }
.bg-slate-800 { background-color: #1e293b; color: #ffffff; }
.bg-orange-50 { background-color: #fff7ed; }
.bg-orange-100 { background-color: #ffedd5; }
.bg-orange-500 { background-color: #f97316; color: #ffffff; }
.bg-orange-600 { background-color: #ea580c; color: #ffffff; }
.bg-emerald-50 { background-color: #ecfdf5; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-green-50 { background-color: #f0fdf4; }
.bg-red-50 { background-color: #fef2f2; }
.bg-yellow-100 { background-color: #fef9c3; }
.bg-green-100 { background-color: #dcfce7; }
.bg-slate-100 { background-color: #f1f5f9; }

.text-white { color: #ffffff; }
.text-slate-500 { color: #64748b; }
.text-slate-600 { color: #475569; }
.text-slate-700 { color: #334155; }
.text-slate-800 { color: #1e293b; }
.text-slate-900 { color: #0f172a; }
.text-orange-600 { color: #ea580c; }
.text-orange-700 { color: #c2410c; }
.text-emerald-700 { color: #047857; }
.text-emerald-800 { color: #065f46; }
.text-blue-700 { color: #1d4ed8; }
.text-blue-800 { color: #1e40af; }
.text-green-700 { color: #15803d; }
.text-green-800 { color: #166534; }
.text-red-700 { color: #b91c1c; }
.text-red-800 { color: #991b1b; }
.text-yellow-500 { color: #eab308; }
.text-yellow-800 { color: #854d0e; }

.font-bold { font-weight: bold; }
.font-extrabold { font-weight: 900; }
.font-semibold { font-weight: 600; }
.italic { font-style: italic; }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 1.5px; }
.tracking-wide { letter-spacing: 1px; }
.tracking-tight { letter-spacing: -0.5px; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }
.font-mono { font-family: 'Courier New', Consolas, monospace; }

.border { border: 1px solid #cbd5e1; }
.border-2 { border: 2px solid; }
.border-b { border-bottom: 1px solid #e2e8f0; }
.border-b-4 { border-bottom: 4px solid; }
.border-t { border-top: 1px solid #cbd5e1; }
.border-t-2 { border-top: 2px solid #1e293b; }
.border-slate-200 { border-color: #e2e8f0; }
.border-slate-300 { border-color: #cbd5e1; }
.border-slate-400 { border-color: #94a3b8; }
.border-slate-800 { border-color: #1e293b; }
.border-orange-200 { border-color: #fed7aa; }
.border-orange-400 { border-color: #fb923c; }
.border-orange-500 { border-color: #f97316; }
.border-yellow-400 { border-color: #facc15; }
.border-green-400 { border-color: #4ade80; }
.border-emerald-400 { border-color: #34d399; }
.border-blue-400 { border-color: #60a5fa; }
.border-red-200 { border-color: #fecaca; }
.border-red-400 { border-color: #f87171; }

.rounded { border-radius: 4px; }
.rounded-sm { border-radius: 2px; }

.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-8 { padding: 32px; }
.px-2 { padding-left: 8px; padding-right: 8px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.px-5 { padding-left: 20px; padding-right: 20px; }
.py-1 { padding-top: 4px; padding-bottom: 4px; }
.py-2 { padding-top: 8px; padding-bottom: 8px; }
.py-3 { padding-top: 12px; padding-bottom: 12px; }
.pb-3 { padding-bottom: 12px; }
.pb-4 { padding-bottom: 16px; }
.pt-1 { padding-top: 4px; }
.pt-3 { padding-top: 12px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-5 { margin-top: 20px; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-5 { margin-bottom: 20px; }
.ml-2 { margin-left: 8px; }
.mx-auto { margin-left: auto; margin-right: auto; }

.text-\\[7pt\\] { font-size: 7pt; }
.text-\\[8pt\\] { font-size: 8pt; }
.text-\\[9pt\\] { font-size: 9pt; }
.text-\\[10pt\\] { font-size: 10pt; }
.text-\\[11pt\\] { font-size: 11pt; }
.text-\\[12pt\\] { font-size: 12pt; }
.text-\\[14pt\\] { font-size: 14pt; }
.text-\\[16pt\\] { font-size: 16pt; }
.text-\\[20pt\\] { font-size: 20pt; }

.grid { display: table; width: 100%; }
.grid-cols-2 > * { display: table-cell; width: 50%; vertical-align: top; padding: 0 4px; }
.grid-cols-3 > * { display: table-cell; width: 33.33%; vertical-align: top; padding: 0 3px; }
.grid-cols-4 > * { display: table-cell; width: 25%; vertical-align: top; padding: 0 2px; }

.flex { display: block; }
.w-full { width: 100%; }
.leading-tight { line-height: 1.2; }
.leading-relaxed { line-height: 1.5; }

/* Hide React-only elements that don't translate to Word */
img { max-width: 100px; max-height: 60px; }

/* Ensure tables get proper borders in Word */
.cl-table table, .cl-table td, .cl-table th {
  mso-border-alt: solid windowtext 0.5pt;
}
</style>
</head>
<body lang="EN-US">
<div class="WordSection1">
<div class="cl-table">
${previewHTML}
</div>
</div>
</body>
</html>`;

  const blob = new Blob([
    '\ufeff', // UTF-8 BOM
    wordHTML
  ], { 
    type: 'application/vnd.ms-word;charset=utf-8' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Send via WhatsApp (open WhatsApp Web with pre-filled message)
 */
export function sendCLWhatsApp(data: BookingData) {
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const clNumber = `CL-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  
  let phone = (data.customerPhone || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  else if (!phone.startsWith('62')) phone = '62' + phone;

  const checkInStr = formatDateShort(data.checkIn);
  const checkOutStr = formatDateShort(data.checkOut);
  
  const message = `*CONFIRMATION LETTER OF HOTEL BOOKING*
━━━━━━━━━━━━━━━━━━━━━━━

📋 *Booking Ref:* ${clNumber}
👤 *Guest:* ${data.customerName || '-'}

🏨 *Hotel Details:*
• Name: ${data.hotelName || '-'} ${data.hotelStars ? '★'.repeat(data.hotelStars) : ''}
• City: ${data.hotelCity || 'Makkah / Madinah'}
• Meal Plan: ${data.pemesan.mealPlan || 'Room Only'}

📅 *Stay Period:*
• Check-In: ${checkInStr} (from 16:00*)
• Check-Out: ${checkOutStr} (before 14:00*)
• Duration: *${pemesanCalc.totalNight} Night(s)*
_*Subject to hotel availability & situation_

💰 *Payment Summary:*
• Total Amount: IDR ${formatNumber(pemesanCalc.totalIDRActual)} _(≈ SAR ${formatNumber(pemesanCalc.totalSAR)})_
• Amount Paid: IDR ${formatNumber(pemesanCalc.totalIDRMasuk)} _(≈ SAR ${formatNumber(pemesanCalc.totalSARMasuk)})_
• *Balance (SAR): ${isLunas ? '✓ PAID' : 'SAR ' + formatNumber(pemesanCalc.sisaTagihanSAR)}*
• Status: *${isLunas ? '✅ FULLY PAID' : '⚠️ IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR) + ' Outstanding'}*

📌 *Important Notes:*
• Original passport required at check-in
• Present this confirmation at reception
• Room allocation subject to availability

💳 *PAYMENT INFO:*
Pembayaran melalui akun *Bank Mandiri*
a/n *PT. TAMIMA JAYA WISATA*
No. Rek: *1370088001686*

For complete details and official Confirmation Letter document, please check your email or download the PDF version.

━━━━━━━━━━━━━━━━━━━━━━━
*PT. TAMIMA JAYA WISATA*
_Beyond LA & Handling Service_
📍 JogloSemar Building, Jl. Magelang KM.7 LOT A3
    Mlati, Sleman, D.I. Yogyakarta 55285
📞 WA: 0813-8383-8115 | 0852-2009-9694

Thank you & Barakallahu fiik 🤲`;

  if (!phone || phone.length < 10) {
    alert(`⚠️ Nomor WhatsApp customer kosong atau tidak valid!\n\nMohon isi nomor WhatsApp pada metadata booking terlebih dahulu.\n\nNomor saat ini: "${data.customerPhone || 'kosong'}"`);
    return;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Send via Email
 */
export function sendCLEmail(data: BookingData) {
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const clNumber = `CL-${new Date().getFullYear()}-${data.id.slice(-6)}`;
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;

  const checkInStr = formatDateShort(data.checkIn);
  const checkOutStr = formatDateShort(data.checkOut);

  const subject = `[${clNumber}] Confirmation Letter — Hotel Booking ${data.hotelName || ''} (${checkInStr} - ${checkOutStr})`;

  const body = `Dear ${data.customerName || 'Valued Guest'},

We are pleased to confirm your hotel booking with the following details:

═══════════════════════════════
BOOKING REFERENCE: ${clNumber}
═══════════════════════════════

🏨 HOTEL DETAILS
• Hotel Name : ${data.hotelName || '-'} ${data.hotelStars ? '★'.repeat(data.hotelStars) : ''}
• City       : ${data.hotelCity || 'Makkah / Madinah'}
• Address    : ${data.hotelAddress || 'Saudi Arabia'}
• Meal Plan  : ${data.pemesan.mealPlan || 'Room Only'}

📅 STAY PERIOD
• Check-In   : ${checkInStr} (from 16:00* local time)
• Check-Out  : ${checkOutStr} (before 14:00* local time)
• Duration   : ${pemesanCalc.totalNight} Night(s)
  * Subject to hotel availability & situation

💰 PAYMENT SUMMARY
• Total Amount    : IDR ${formatNumber(pemesanCalc.totalIDRActual)}  (≈ SAR ${formatNumber(pemesanCalc.totalSAR)})
• Amount Paid     : IDR ${formatNumber(pemesanCalc.totalIDRMasuk)}  (≈ SAR ${formatNumber(pemesanCalc.totalSARMasuk)})
• Balance (SAR)   : ${isLunas ? '✓ FULLY PAID' : 'SAR ' + formatNumber(pemesanCalc.sisaTagihanSAR) + ' (Mata Uang Asal)'}
• Payment Status  : ${isLunas ? '✅ FULLY PAID / CONFIRMED' : '⚠️ Outstanding IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR)}

📋 IMPORTANT NOTES
• Original passport required at check-in
• Please present this Confirmation Letter at hotel reception
• Room allocation is subject to hotel availability

⚠️ CANCELLATION POLICY
• Cancellation 30+ days before check-in: Full refund (-5% admin fee)
• Cancellation 14-29 days before: 50% refund
• Cancellation less than 14 days: Non-refundable
• No-show: Full charge applies

═══════════════════════════════
💳 PAYMENT INFORMATION
═══════════════════════════════
Pembayaran melalui akun Bank Mandiri
a/n PT. TAMIMA JAYA WISATA
No. Rekening: 1370088001686

Please find attached the complete Confirmation Letter document for your records.

Thank you for choosing PT. TAMIMA JAYA WISATA as your trusted Hajj & Umrah travel partner.

Best regards,

GHOFAR
Booking Manager
PT. TAMIMA JAYA WISATA
Beyond LA & Handling Service

📍 JogloSemar Building, Jl. Magelang No. KM.7 LOT A3
    Mlati Beningan, Sendangadi, Kec. Mlati,
    Kab. Sleman, D.I. Yogyakarta 55285
📞 WA: 0813-8383-8115 | 0852-2009-9694`;

  if (!data.customerEmail) {
    if (!confirm('⚠️ Email customer kosong.\n\nLanjutkan untuk membuka email client tanpa alamat tujuan?')) return;
  }

  const mailtoUrl = `mailto:${data.customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

// Keep helper exports for backwards compat (no longer used internally)
export { safeStr, formatDateShort };
