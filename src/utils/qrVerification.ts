/**
 * QR Verification System
 * - Generate verification tokens (HMAC-style)
 * - Create QR code images
 * - Verify URLs untuk public access
 * - Token decoder
 */

import QRCode from 'qrcode';
import type { BookingData } from '../types';

const VERIFICATION_SECRET = 'TAMIMA_VERIFY_2026';
const TOKEN_VERSION = 'v1';

export type DocumentType = 'cl' | 'invoice' | 'voucher' | 'statement';

export interface VerificationToken {
  bookingId: string;
  bookingRef: string;
  customerName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  documentType: DocumentType;
  issueDate: string;
  signature: string;
}

/**
 * Generate booking reference dari booking data
 * Format: TMA-{YEAR}-{ID_LAST_6}
 */
export function generateBookingRef(booking: BookingData, docType: DocumentType = 'cl'): string {
  const year = new Date().getFullYear();
  const idShort = booking.id.slice(-6).toUpperCase();
  const prefix = {
    cl: 'CL',
    invoice: 'INV',
    voucher: 'VCH',
    statement: 'STM',
  }[docType];
  return `${prefix}-${year}-${idShort}`;
}

/**
 * Simple hash function untuk signature (SHA-256 via Web Crypto)
 */
async function hashSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + VERIFICATION_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Generate verification token (base64-encoded JSON dengan signature)
 */
export async function generateVerificationToken(
  booking: BookingData,
  documentType: DocumentType
): Promise<{ token: string; bookingRef: string; signature: string }> {
  const bookingRef = generateBookingRef(booking, documentType);
  
  // Data yang akan di-sign
  const payload = {
    v: TOKEN_VERSION,
    id: booking.id,
    ref: bookingRef,
    cust: booking.customerName,
    htl: booking.hotelName,
    in: booking.checkIn,
    out: booking.checkOut,
    doc: documentType,
    iss: new Date().toISOString(),
  };
  
  // Generate signature
  const dataToSign = JSON.stringify(payload);
  const signature = await hashSignature(dataToSign);
  
  // Combine payload + signature
  const fullPayload = { ...payload, sig: signature };
  
  // Encode to base64url (URL-safe)
  const token = btoa(JSON.stringify(fullPayload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { token, bookingRef, signature };
}

/**
 * Decode & verify token
 */
export async function decodeVerificationToken(token: string): Promise<{
  valid: boolean;
  payload?: VerificationToken;
  error?: string;
}> {
  try {
    // Decode base64url
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const jsonStr = atob(padded);
    const data = JSON.parse(jsonStr);
    
    if (!data.sig || !data.id || !data.ref) {
      return { valid: false, error: 'Token format tidak valid' };
    }
    
    // Verify signature
    const { sig, ...payload } = data;
    const dataToSign = JSON.stringify(payload);
    const expectedSig = await hashSignature(dataToSign);
    
    if (sig !== expectedSig) {
      return { valid: false, error: 'Signature tidak valid — token mungkin telah diubah' };
    }
    
    return {
      valid: true,
      payload: {
        bookingId: data.id,
        bookingRef: data.ref,
        customerName: data.cust,
        hotelName: data.htl,
        checkIn: data.in,
        checkOut: data.out,
        documentType: data.doc,
        issueDate: data.iss,
        signature: sig,
      },
    };
  } catch (e: any) {
    return { valid: false, error: `Token decode gagal: ${e.message}` };
  }
}

/**
 * Generate verification URL
 * Untuk PWA mode (single file): pakai hash routing
 * Format: https://domain/#/verify/{bookingRef}?t={token}
 */
export function generateVerificationURL(bookingRef: string, token: string): string {
  // Get base URL (origin + pathname)
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname.replace(/index\.html$/, '')
    : 'https://tamimajaya.co.id/';
  
  // Remove trailing slash
  const cleanBase = baseUrl.replace(/\/$/, '');
  
  return `${cleanBase}/#/verify/${encodeURIComponent(bookingRef)}?t=${token}`;
}

/**
 * Generate QR code sebagai data URL (PNG)
 */
export async function generateQRCode(
  text: string,
  options: {
    size?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  } = {}
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options.size || 200,
      margin: options.margin ?? 2,
      color: {
        dark: options.color?.dark || '#0F172A',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    });
    return dataUrl;
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return '';
  }
}

/**
 * Generate QR with full setup (token + URL + image)
 */
export async function generateBookingQR(
  booking: BookingData,
  documentType: DocumentType,
  qrSize: number = 200
): Promise<{
  token: string;
  bookingRef: string;
  url: string;
  qrCodeDataUrl: string;
  signature: string;
}> {
  const { token, bookingRef, signature } = await generateVerificationToken(booking, documentType);
  const url = generateVerificationURL(bookingRef, token);
  const qrCodeDataUrl = await generateQRCode(url, { size: qrSize });
  
  return { token, bookingRef, url, qrCodeDataUrl, signature };
}

/**
 * Parse URL hash untuk extract verification params
 */
export function parseVerifyURL(): { bookingRef: string; token: string } | null {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash;
  // Format: #/verify/{ref}?t={token}
  const match = hash.match(/#\/verify\/([^?]+)\?t=(.+)/);
  if (!match) return null;
  
  return {
    bookingRef: decodeURIComponent(match[1]),
    token: match[2],
  };
}

/**
 * Check apakah saat ini sedang di verify page
 */
export function isVerifyPage(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash.startsWith('#/verify/');
}

/**
 * Save verification record untuk audit
 */
export function saveVerificationRecord(record: {
  bookingRef: string;
  documentType: DocumentType;
  verifiedAt: string;
  ipAddress?: string;
  userAgent?: string;
}): void {
  try {
    const KEY = 'tamima_verification_log';
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
    const updated = [record, ...existing].slice(0, 500);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save verification record', e);
  }
}
