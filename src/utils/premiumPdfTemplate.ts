/**
 * 🎨 PREMIUM PDF TEMPLATE GENERATOR
 * 
 * Style: Clean, Premium, Corporate, Professional
 * Standard: Travel Industry & Hotel Wholesaler
 * Colors: Orange #F97316 + Navy #0F172A
 * Layouts: A4 (210×297mm) | Legal (215.9×355.6mm) | Letter (215.9×279.4mm)
 * Margins: 15-18mm
 * 
 * Used for: Confirmation Letter, Invoice, Voucher, Booking Statement
 */

import type { BookingData } from '../types';
import { calcRow, formatNumber } from './calc';
import { generateBookingQR, DocumentType } from './qrVerification';

export type PaperFormat = 'A4' | 'Legal' | 'Letter';

export interface PaperDimensions {
  width: number;   // mm
  height: number;  // mm
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export const PAPER_FORMATS: Record<PaperFormat, PaperDimensions> = {
  A4:     { width: 210,   height: 297,   marginTop: 15, marginRight: 15, marginBottom: 15, marginLeft: 15 },
  Letter: { width: 215.9, height: 279.4, marginTop: 16, marginRight: 18, marginBottom: 16, marginLeft: 18 },
  Legal:  { width: 215.9, height: 355.6, marginTop: 16, marginRight: 18, marginBottom: 16, marginLeft: 18 },
};

export interface TemplateOptions {
  format?: PaperFormat;
  documentType: DocumentType;
  bookingNumber?: string;
  showWatermark?: boolean;
  customCss?: string;
}

const DEFAULT_OPTIONS: Required<Omit<TemplateOptions, 'documentType' | 'bookingNumber' | 'customCss'>> = {
  format: 'A4',
  showWatermark: true,
};

// ════════════════════════════════════════════════════════════════
// 🎨 PREMIUM CSS BASE
// Corporate / Professional / Travel Industry Standard
// ════════════════════════════════════════════════════════════════
const PREMIUM_CSS = (paper: PaperDimensions, format: PaperFormat) => `
  @page {
    size: ${format} portrait;
    margin: ${paper.marginTop}mm ${paper.marginRight}mm ${paper.marginBottom}mm ${paper.marginLeft}mm;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  body {
    font-family: 'Helvetica Neue', 'Segoe UI', Arial, sans-serif;
    font-size: 9pt;
    line-height: 1.4;
    color: #0F172A;
    background: white;
    width: 100%;
  }
  
  /* ════════════════════════════════════
     🏢 BRAND COLORS & ACCENTS
  ════════════════════════════════════ */
  :root {
    --orange-primary: #F97316;
    --orange-dark: #EA580C;
    --orange-light: #FB923C;
    --orange-pale: #FFF7ED;
    --navy-primary: #0F172A;
    --navy-mid: #1E293B;
    --navy-soft: #334155;
    --gray-50: #F8FAFC;
    --gray-100: #F1F5F9;
    --gray-300: #CBD5E1;
    --gray-500: #64748B;
    --green: #16A34A;
    --red: #DC2626;
  }
  
  /* ════════════════════════════════════
     📐 LAYOUT HELPERS
  ════════════════════════════════════ */
  .doc {
    width: 100%;
    max-width: 100%;
  }
  
  .row { display: flex; gap: 8px; align-items: stretch; }
  .row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .row-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  
  /* ════════════════════════════════════
     🎯 SECTION TITLES
  ════════════════════════════════════ */
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(90deg, #0F172A, #1E293B);
    color: white;
    padding: 5px 10px;
    margin: 0 0 6px 0;
    font-size: 9pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    border-left: 4px solid #F97316;
  }
  
  .section-title.orange {
    background: linear-gradient(90deg, #F97316, #EA580C);
    border-left-color: #0F172A;
  }
  
  /* ════════════════════════════════════
     📄 HEADER — Premium Corporate
  ════════════════════════════════════ */
  .header {
    border-bottom: 3px solid #F97316;
    padding-bottom: 10px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-brand {
    flex: 1;
  }
  
  .header-brand .accent-bar {
    width: 40px;
    height: 4px;
    background: linear-gradient(90deg, #F97316, #EA580C);
    margin-bottom: 6px;
    border-radius: 2px;
  }
  
  .header-brand .tagline {
    font-size: 7pt;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: bold;
    margin-bottom: 3px;
  }
  
  .header-brand .company-name {
    font-size: 18pt;
    font-weight: 900;
    color: #EA580C;
    letter-spacing: -0.5px;
    line-height: 1;
    margin-bottom: 3px;
  }
  
  .header-brand .company-subtitle {
    font-size: 8pt;
    color: #0F172A;
    font-style: italic;
    margin-bottom: 6px;
  }
  
  .header-brand .company-contact {
    font-size: 7pt;
    color: #64748B;
    line-height: 1.5;
  }
  
  .header-doc-info {
    text-align: right;
    min-width: 180px;
  }
  
  .header-doc-info .doc-badge {
    background: #0F172A;
    color: white;
    padding: 6px 12px;
    display: inline-block;
    border-bottom: 3px solid #F97316;
  }
  
  .header-doc-info .doc-badge .label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.85;
    margin-bottom: 2px;
  }
  
  .header-doc-info .doc-badge .title {
    font-size: 14pt;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.5px;
  }
  
  .header-doc-info .doc-meta {
    font-size: 8pt;
    color: #334155;
    margin-top: 6px;
    line-height: 1.5;
  }
  
  .header-doc-info .doc-meta .ref-number {
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: #EA580C;
    font-size: 9pt;
  }
  
  /* ════════════════════════════════════
     📊 BOOKING SUMMARY — Hero Card
  ════════════════════════════════════ */
  .booking-summary {
    background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
    border: 2px solid #F97316;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 14px;
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    gap: 12px;
    align-items: center;
  }
  
  .booking-summary .item {
    border-right: 1px dashed #FB923C;
    padding-right: 12px;
  }
  
  .booking-summary .item:last-child {
    border-right: none;
    padding-right: 0;
  }
  
  .booking-summary .item .label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9A3412;
    font-weight: bold;
    margin-bottom: 3px;
  }
  
  .booking-summary .item .value {
    font-size: 11pt;
    font-weight: 900;
    color: #0F172A;
    line-height: 1.2;
  }
  
  .booking-summary .item .sub {
    font-size: 7pt;
    color: #92400E;
    margin-top: 2px;
  }
  
  /* ════════════════════════════════════
     ℹ️ INFO CARDS (Guest, Hotel)
  ════════════════════════════════════ */
  .info-card {
    border: 1px solid #CBD5E1;
    border-radius: 4px;
    overflow: hidden;
    background: white;
  }
  
  .info-card-header {
    background: #0F172A;
    color: white;
    padding: 4px 8px;
    font-size: 7.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .info-card-header.orange {
    background: linear-gradient(90deg, #F97316, #EA580C);
  }
  
  .info-card-body {
    padding: 8px 10px;
  }
  
  .info-card-body table {
    width: 100%;
    font-size: 8pt;
    border-collapse: collapse;
  }
  
  .info-card-body tr td {
    padding: 2.5px 0;
    vertical-align: top;
  }
  
  .info-card-body tr td:first-child {
    color: #64748B;
    width: 38%;
    font-size: 7.5pt;
  }
  
  .info-card-body tr td:last-child {
    font-weight: 600;
    color: #0F172A;
    font-size: 8pt;
  }
  
  /* ════════════════════════════════════
     🛏️ ROOM DETAILS TABLE
  ════════════════════════════════════ */
  .room-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    border: 1px solid #CBD5E1;
  }
  
  .room-table thead tr {
    background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
    color: white;
  }
  
  .room-table thead th {
    padding: 6px 8px;
    text-align: left;
    font-size: 7pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-right: 1px solid #334155;
  }
  
  .room-table thead th:last-child { border-right: none; }
  
  .room-table tbody tr {
    border-bottom: 1px solid #E2E8F0;
  }
  
  .room-table tbody tr:nth-child(even) {
    background: #F8FAFC;
  }
  
  .room-table tbody td {
    padding: 5px 8px;
  }
  
  .room-table tbody td.text-right { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
  .room-table tbody td.text-center { text-align: center; }
  .room-table tbody td.room-name { font-weight: bold; }
  
  .room-table tfoot tr {
    background: linear-gradient(90deg, #F97316, #EA580C);
    color: white;
  }
  
  .room-table tfoot td {
    padding: 7px 8px;
    font-weight: bold;
    border-top: 2px solid #0F172A;
  }
  
  .room-table tfoot .grand-total {
    font-size: 10pt;
    font-family: 'Courier New', monospace;
  }
  
  /* ════════════════════════════════════
     💰 FINANCIAL SUMMARY
  ════════════════════════════════════ */
  .financial-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin: 8px 0;
  }
  
  .financial-card {
    border: 2px solid;
    border-radius: 4px;
    padding: 8px 10px;
    text-align: center;
  }
  
  .financial-card .label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: bold;
    margin-bottom: 4px;
    opacity: 0.85;
  }
  
  .financial-card .value {
    font-size: 11pt;
    font-weight: 900;
    line-height: 1.1;
    font-family: 'Courier New', monospace;
  }
  
  .financial-card .sub {
    font-size: 7pt;
    margin-top: 3px;
    opacity: 0.75;
  }
  
  .financial-card.green { background: #ECFDF5; border-color: #16A34A; color: #15803D; }
  .financial-card.blue { background: #EFF6FF; border-color: #2563EB; color: #1E40AF; }
  .financial-card.orange { background: #FFF7ED; border-color: #F97316; color: #9A3412; }
  .financial-card.red { background: #FEF2F2; border-color: #DC2626; color: #991B1B; }
  
  /* ════════════════════════════════════
     📋 POLICY BOXES
  ════════════════════════════════════ */
  .policy-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  
  .policy-box {
    border: 1px solid;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 7.5pt;
    line-height: 1.5;
  }
  
  .policy-box.info { background: #F0F9FF; border-color: #38BDF8; color: #075985; }
  .policy-box.warning { background: #FEFCE8; border-color: #EAB308; color: #854D0E; }
  .policy-box.danger { background: #FEF2F2; border-color: #DC2626; color: #991B1B; }
  
  .policy-box .title {
    font-size: 8pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  
  .policy-box ul {
    margin: 0;
    padding-left: 14px;
  }
  
  .policy-box li {
    margin-bottom: 1px;
  }
  
  /* ════════════════════════════════════
     💳 PAYMENT INFO Banner
  ════════════════════════════════════ */
  .payment-banner {
    background: linear-gradient(90deg, #FEF3C7 0%, #FCD34D 100%);
    border: 2px solid #EAB308;
    border-radius: 4px;
    padding: 8px 12px;
    margin: 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 8pt;
  }
  
  .payment-banner .icon {
    font-size: 16pt;
  }
  
  .payment-banner .label {
    background: #854D0E;
    color: white;
    padding: 2px 8px;
    font-size: 7pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 2px;
  }
  
  .payment-banner .account-number {
    font-family: 'Courier New', monospace;
    font-weight: bold;
    background: white;
    padding: 2px 6px;
    border: 1px solid #2563EB;
    color: #1E3A8A;
    border-radius: 2px;
  }
  
  /* ════════════════════════════════════
     📱 QR VERIFICATION SECTION
  ════════════════════════════════════ */
  .qr-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, #FFF7ED, #FED7AA);
    border: 2px dashed #F97316;
    border-radius: 4px;
    padding: 10px 14px;
    margin: 10px 0;
  }
  
  .qr-section .qr-image {
    border: 3px solid white;
    box-shadow: 0 0 0 1px #F97316;
    border-radius: 2px;
  }
  
  .qr-section .qr-info {
    flex: 1;
  }
  
  .qr-section .qr-info .qr-title {
    font-size: 10pt;
    font-weight: 900;
    color: #0F172A;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .qr-section .qr-info .qr-desc {
    font-size: 7pt;
    color: #475569;
    line-height: 1.5;
  }
  
  .qr-section .qr-info .qr-ref {
    font-family: 'Courier New', monospace;
    font-size: 8pt;
    font-weight: bold;
    color: #EA580C;
    background: white;
    padding: 2px 6px;
    border: 1px solid #F97316;
    display: inline-block;
    margin-top: 3px;
    border-radius: 2px;
  }
  
  /* ════════════════════════════════════
     ✍️ SIGNATURE & FOOTER
  ════════════════════════════════════ */
  .signature-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 14px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 2px solid #0F172A;
  }
  
  .signature-section .closing {
    font-size: 8pt;
    color: #334155;
    line-height: 1.6;
  }
  
  .signature-section .closing strong {
    color: #EA580C;
  }
  
  .signature-section .generated {
    font-size: 6.5pt;
    color: #94A3B8;
    font-style: italic;
    margin-top: 6px;
  }
  
  .signature-box {
    text-align: center;
  }
  
  .signature-box .label {
    font-size: 7pt;
    color: #64748B;
    margin-bottom: 4px;
  }
  
  .signature-box .stamp {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .signature-box .stamp img {
    max-height: 40px;
    max-width: 50px;
    object-fit: contain;
    opacity: 0.9;
    transform: rotate(-8deg);
  }
  
  .signature-box .signatory-name {
    border-top: 1px solid #475569;
    padding-top: 3px;
    font-size: 8pt;
    font-weight: bold;
    margin-top: 3px;
  }
  
  .signature-box .signatory-position {
    font-size: 6.5pt;
    color: #94A3B8;
  }
  
  /* ════════════════════════════════════
     📭 FOOTER STRIP
  ════════════════════════════════════ */
  .footer-strip {
    background: linear-gradient(90deg, #0F172A, #1E293B);
    color: white;
    text-align: center;
    padding: 6px 8px;
    margin: 10px -${paper.marginLeft}mm -${paper.marginBottom}mm -${paper.marginRight}mm;
    font-size: 7pt;
    letter-spacing: 2px;
    border-top: 3px solid #F97316;
  }
  
  .footer-strip strong {
    color: #FB923C;
  }
  
  /* ════════════════════════════════════
     💧 WATERMARK
  ════════════════════════════════════ */
  .watermark {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 100pt;
    color: rgba(249, 115, 22, 0.06);
    font-weight: 900;
    letter-spacing: 8px;
    pointer-events: none;
    z-index: 0;
    white-space: nowrap;
    text-transform: uppercase;
  }
  
  /* ════════════════════════════════════
     🎫 STATUS BADGES
  ════════════════════════════════════ */
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: bold;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  
  .badge-success { background: #DCFCE7; color: #15803D; border: 1px solid #16A34A; }
  .badge-warning { background: #FEF3C7; color: #92400E; border: 1px solid #EAB308; }
  .badge-danger { background: #FEE2E2; color: #991B1B; border: 1px solid #DC2626; }
  .badge-info { background: #DBEAFE; color: #1E40AF; border: 1px solid #2563EB; }
  
  /* Margin utilities */
  .mb-1 { margin-bottom: 4px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mt-1 { margin-top: 4px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
`;

// ════════════════════════════════════════════════════════════════
// 🏗️ DOCUMENT META PER TYPE
// ════════════════════════════════════════════════════════════════
const DOC_META: Record<DocumentType, { label: string; ref: string; subtitle: string }> = {
  cl:        { label: 'CONFIRMATION LETTER',   ref: 'CL',  subtitle: 'of Hotel Booking' },
  invoice:   { label: 'INVOICE',                ref: 'INV', subtitle: 'Hotel Reservation Bill' },
  voucher:   { label: 'BOOKING VOUCHER',        ref: 'VCH', subtitle: 'Present at Hotel Check-in' },
  statement: { label: 'BOOKING STATEMENT',      ref: 'STM', subtitle: 'Hotel Booking Statement' },
};

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const formatDate = (iso: string): string => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateLong = (iso: string): string => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// ════════════════════════════════════════════════════════════════
// 🎨 MAIN TEMPLATE BUILDER
// ════════════════════════════════════════════════════════════════
export async function generatePremiumPDF(
  data: BookingData,
  options: TemplateOptions
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const paper = PAPER_FORMATS[opts.format];
  const meta = DOC_META[opts.documentType];
  
  // Calculate financials
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const isLunas = pemesanCalc.sisaTagihanIDR <= 0 && pemesanCalc.totalIDRMasuk > 0;
  const paymentStatus = isLunas 
    ? 'PAID' 
    : pemesanCalc.totalIDRMasuk > 0 
      ? 'PARTIAL' 
      : 'PENDING';
  
  // Generate document number
  const docNumber = options.bookingNumber || `${meta.ref}-${new Date().getFullYear()}-${data.id.slice(-6).toUpperCase()}`;
  const issuedDate = new Date();
  
  // Generate QR
  const qr = await generateBookingQR(data, opts.documentType, 110);
  
  // Active rooms
  const ROOM_LABELS: Record<string, string> = {
    dbl: 'Double Room', trp: 'Triple Room', qrd: 'Quadruple Room',
    qnt: 'Quintuple Room', bed: 'Extra Bed', ext: 'Extension Night',
  };
  const activeRooms = (['dbl','trp','qrd','qnt','bed','ext'] as const)
    .filter(rt => Number(data.pemesan[rt].qty) > 0)
    .map(rt => ({
      label: ROOM_LABELS[rt],
      qty: Number(data.pemesan[rt].qty) || 0,
      rate: Number(data.pemesan[rt].rate) || 0,
      subtotal: (Number(data.pemesan[rt].qty) || 0) * (Number(data.pemesan[rt].rate) || 0) * pemesanCalc.totalNight,
    }));
  
  const totalPax = data.paxCount || activeRooms.reduce((sum, r) => {
    const mult = r.label.includes('Double') ? 2 : r.label.includes('Triple') ? 3 : r.label.includes('Quadruple') ? 4 : r.label.includes('Quintuple') ? 5 : 1;
    return sum + r.qty * mult;
  }, 0);

  // Build HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${meta.label} - ${docNumber}</title>
<style>${PREMIUM_CSS(paper, opts.format)}</style>
</head>
<body>

<div class="doc" style="position:relative">

  ${opts.showWatermark ? `<div class="watermark">${meta.label}</div>` : ''}

  <!-- ════════════════════════════════════════════════════════════
       1️⃣ HEADER — Brand + Document Info
  ════════════════════════════════════════════════════════════ -->
  <div class="header">
    <div class="header-brand">
      <div class="accent-bar"></div>
      <div class="tagline">Hajj & Umrah Travel Wholesaler</div>
      <div class="company-name">PT. TAMIMA JAYA WISATA</div>
      <div class="company-subtitle">Beyond LA &amp; Handling Service</div>
      <div class="company-contact">
        📍 JogloSemar Building, Jl. Magelang No. KM.7 LOT A3,<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;Mlati, Sleman, D.I. Yogyakarta 55285<br/>
        📞 <strong>0813-8383-8115</strong> · <strong>0852-2009-9694</strong> &nbsp;|&nbsp; 📧 booking@tamimajaya.co.id
      </div>
    </div>
    <div class="header-doc-info">
      <div class="doc-badge">
        <div class="label">${meta.subtitle}</div>
        <div class="title">${meta.label}</div>
      </div>
      <div class="doc-meta">
        <div>No: <span class="ref-number">${docNumber}</span></div>
        <div>Date: ${formatDateLong(issuedDate.toISOString())}</div>
        <div class="mt-1">
          <span class="badge ${isLunas ? 'badge-success' : pemesanCalc.totalIDRMasuk > 0 ? 'badge-warning' : 'badge-info'}">
            ${paymentStatus}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       2️⃣ BOOKING SUMMARY — Hero Card
  ════════════════════════════════════════════════════════════ -->
  <div class="booking-summary">
    <div class="item">
      <div class="label">Booking For</div>
      <div class="value">${safeStr(data.customerName) || '-'}</div>
      <div class="sub">${totalPax} Pax · ${activeRooms.reduce((s, r) => s + r.qty, 0)} Room(s)</div>
    </div>
    <div class="item">
      <div class="label">Check-In</div>
      <div class="value">${formatDate(data.checkIn)}</div>
      <div class="sub">From 16:00*</div>
    </div>
    <div class="item">
      <div class="label">Check-Out</div>
      <div class="value">${formatDate(data.checkOut)}</div>
      <div class="sub">Before 14:00*</div>
    </div>
    <div class="item">
      <div class="label">Duration</div>
      <div class="value" style="color:#EA580C">${pemesanCalc.totalNight} Night${pemesanCalc.totalNight > 1 ? 's' : ''}</div>
      <div class="sub">Total Stay</div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       3️⃣ GUEST + 4️⃣ HOTEL INFO — Side by Side
  ════════════════════════════════════════════════════════════ -->
  <div class="row-2 mb-3">
    <div class="info-card">
      <div class="info-card-header">👤 Guest Information</div>
      <div class="info-card-body">
        <table>
          <tr><td>Lead Guest</td><td>${safeStr(data.customerName) || '-'}</td></tr>
          <tr><td>Email</td><td>${safeStr(data.customerEmail) || '-'}</td></tr>
          <tr><td>Phone / WA</td><td>${safeStr(data.customerPhone) || '-'}</td></tr>
          <tr><td>No. of Pax</td><td><strong>${totalPax} Person(s)</strong></td></tr>
        </table>
      </div>
    </div>
    <div class="info-card">
      <div class="info-card-header orange">🏨 Hotel Information</div>
      <div class="info-card-body">
        <table>
          <tr><td>Hotel Name</td><td><strong>${safeStr(data.hotelName) || '-'}</strong> ${data.hotelStars ? `<span style="color:#EAB308">${'★'.repeat(data.hotelStars)}</span>` : ''}</td></tr>
          <tr><td>City</td><td>${safeStr(data.hotelCity) || 'Makkah / Madinah'}</td></tr>
          <tr><td>Address</td><td>${safeStr(data.hotelAddress) || 'Saudi Arabia'}</td></tr>
          <tr><td>Meal Plan</td><td><strong>${safeStr(data.pemesan.mealPlan) || 'Room Only'}</strong></td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       5️⃣ ROOM DETAILS TABLE
  ════════════════════════════════════════════════════════════ -->
  <div class="section-title orange">🛏️ Room Reservation Details</div>
  <table class="room-table mb-3">
    <thead>
      <tr>
        <th>Room Type</th>
        <th class="text-center">Quantity</th>
        <th class="text-center">Nights</th>
        <th style="text-align:right">Rate/Night</th>
        <th style="text-align:right">Subtotal (SAR)</th>
      </tr>
    </thead>
    <tbody>
      ${activeRooms.length === 0 
        ? `<tr><td colspan="5" style="text-align:center;padding:14px;color:#94A3B8;font-style:italic">No room data</td></tr>`
        : activeRooms.map(r => `
          <tr>
            <td class="room-name">${r.label}</td>
            <td class="text-center">${r.qty} Room${r.qty > 1 ? 's' : ''}</td>
            <td class="text-center">${pemesanCalc.totalNight}</td>
            <td class="text-right">SAR ${formatNumber(r.rate)}</td>
            <td class="text-right">SAR ${formatNumber(r.subtotal)}</td>
          </tr>
        `).join('')
      }
      ${Number(data.pemesan.transport) > 0 ? `
        <tr style="background:#EFF6FF">
          <td class="room-name">🚌 Transport (Ground)</td>
          <td colspan="3" class="text-center">—</td>
          <td class="text-right">SAR ${formatNumber(Number(data.pemesan.transport))}</td>
        </tr>
      ` : ''}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right">GRAND TOTAL</td>
        <td style="text-align:right" class="grand-total">SAR ${formatNumber(pemesanCalc.totalSAR)}</td>
      </tr>
      <tr style="background:#0F172A;color:white">
        <td colspan="4" style="text-align:right;font-size:8pt">Equivalent in IDR (Est. Rate: ${formatNumber(pemesanCalc.estKursRataRata)})</td>
        <td style="text-align:right;font-family:'Courier New',monospace;font-weight:bold">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ════════════════════════════════════════════════════════════
       6️⃣ FINANCIAL SUMMARY
  ════════════════════════════════════════════════════════════ -->
  <div class="section-title">💰 Financial Summary</div>
  <div class="financial-grid">
    <div class="financial-card green">
      <div class="label">Total Amount</div>
      <div class="value">IDR ${formatNumber(pemesanCalc.totalIDRActual)}</div>
      <div class="sub">≈ SAR ${formatNumber(pemesanCalc.totalSAR)}</div>
    </div>
    <div class="financial-card blue">
      <div class="label">Amount Paid</div>
      <div class="value">IDR ${formatNumber(pemesanCalc.totalIDRMasuk)}</div>
      <div class="sub">≈ SAR ${formatNumber(pemesanCalc.totalSARMasuk)}</div>
    </div>
    <div class="financial-card ${isLunas ? 'green' : 'orange'}">
      <div class="label">${isLunas ? 'Balance' : 'Outstanding'}</div>
      <div class="value">${isLunas ? '✓ FULLY PAID' : 'IDR ' + formatNumber(pemesanCalc.sisaTagihanIDR)}</div>
      <div class="sub">${isLunas ? 'Booking Confirmed' : 'SAR ' + formatNumber(pemesanCalc.sisaTagihanSAR) + ' remaining'}</div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       7️⃣ POLICY (Booking + Cancellation)
  ════════════════════════════════════════════════════════════ -->
  <div class="policy-grid mb-2">
    <div class="policy-box info">
      <div class="title">📋 Booking Policy</div>
      <ul>
        <li>Check-in from <strong>16:00</strong> · Check-out before <strong>14:00</strong> (local time*)</li>
        <li>* Subject to hotel availability &amp; situation</li>
        <li>Original passport required at check-in</li>
        <li>Present this ${meta.label.toLowerCase()} at reception</li>
      </ul>
    </div>
    <div class="policy-box danger">
      <div class="title">⚠️ Cancellation Policy</div>
      <ul>
        <li>${safeStr(data.cancellationPolicy) || 'Cancellation 30+ days before: Full refund (-5% admin)'}</li>
        <li>14-29 days before: 50% refund</li>
        <li>Less than 14 days: Non-refundable</li>
        <li>No-show: Full charge applies</li>
      </ul>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       8️⃣ PAYMENT INFORMATION (Bank Transfer)
  ════════════════════════════════════════════════════════════ -->
  <div class="payment-banner">
    <span class="icon">💳</span>
    <span class="label">Note / Payment</span>
    <div style="flex:1">
      Pembayaran melalui akun <strong style="color:#1E3A8A">Bank Mandiri</strong> a/n 
      <strong>PT. TAMIMA JAYA WISATA</strong> · No. Rek. 
      <span class="account-number">1370088001686</span>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       9️⃣ QR VERIFICATION
  ════════════════════════════════════════════════════════════ -->
  <div class="qr-section">
    <img src="${qr.qrCodeDataUrl}" alt="QR Verify ${qr.bookingRef}" width="100" height="100" class="qr-image" />
    <div class="qr-info">
      <div class="qr-title">📱 Scan to Verify Booking</div>
      <div class="qr-desc">
        Verifikasi keaslian dokumen ini secara online dengan scan QR code menggunakan kamera HP Anda.
        Sistem akan menampilkan detail booking lengkap dengan signature SHA-256 untuk memastikan dokumen tidak palsu.
      </div>
      <div class="qr-ref">${qr.bookingRef}</div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       🔟 SIGNATURE & CLOSING
  ════════════════════════════════════════════════════════════ -->
  <div class="signature-section">
    <div class="closing">
      Dear <strong style="color:#0F172A">${safeStr(data.customerName) || 'Valued Guest'}</strong>,<br/><br/>
      Thank you for choosing <strong>PT. TAMIMA JAYA WISATA</strong> as your trusted Hajj &amp; Umrah travel partner. 
      We wish you a blessed and comfortable stay. Please keep this ${meta.label.toLowerCase()} as your reference during check-in.
      <div class="generated">
        🔒 System-generated · No physical signature required<br/>
        Generated on ${issuedDate.toLocaleString('en-GB')} · Document version v2.6
      </div>
    </div>
    <div class="signature-box">
      <div class="label">Authorized Signature,</div>
      <div class="stamp">
        <img src="./stamp-tamima.png" alt="Stempel TAMIMA" onerror="this.style.display='none'" />
      </div>
      <div class="signatory-name">( GHOFAR )</div>
      <div class="signatory-position">Booking Manager</div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════
       FOOTER STRIP
  ════════════════════════════════════════════════════════════ -->
  <div class="footer-strip">
    <strong>PT. TAMIMA JAYA WISATA</strong> · BEYOND LA &amp; HANDLING SERVICE · ${meta.label} · ${docNumber}
  </div>

</div>

</body>
</html>`;
}

/**
 * Download HTML sebagai file
 */
export function downloadPremiumHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
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
 * Open dalam popup window untuk print
 */
export function printPremiumDocument(html: string): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
  if (!printWindow) {
    alert('⚠️ Browser memblokir popup. Mohon izinkan popup untuk situs ini.');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.write(`
    <script>
      window.onload = function() {
        var images = document.querySelectorAll('img');
        var loaded = 0;
        var total = images.length;
        
        function doPrint() {
          setTimeout(function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1000);
          }, 300);
        }
        
        if (total === 0) { doPrint(); return; }
        images.forEach(function(img) {
          if (img.complete) { loaded++; if (loaded === total) doPrint(); }
          else { img.onload = img.onerror = function() { loaded++; if (loaded === total) doPrint(); }; }
        });
        setTimeout(doPrint, 3000);
      };
    </script>
  `);
  printWindow.document.close();
}
