/**
 * Authentication Utilities
 * - Password hashing (SHA-256)
 * - Device fingerprinting
 * - IP detection (via 3rd party API as fallback)
 * - Session management
 */

import type { DeviceInfo } from '../types/auth';

/**
 * Hash password using Web Crypto API (SHA-256)
 * Client-side hash — bukan untuk production grade
 * tapi cukup untuk prevent plain-text storage di LocalStorage
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'tamima_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

/**
 * Detect browser dari User Agent
 */
export function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';
  return 'Unknown Browser';
}

/**
 * Detect OS dari User Agent
 */
export function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
  if (ua.includes('Windows NT')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown OS';
}

/**
 * Get device info untuk audit log
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    browser: detectBrowser(),
    os: detectOS(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

/**
 * Get IP Address (via 3rd party API — best effort)
 * Returns 'Local' if offline atau API gagal
 */
let cachedIP: string | null = null;
export async function getIPAddress(): Promise<string> {
  if (cachedIP) return cachedIP;
  
  // Skip if offline
  if (!navigator.onLine) return 'Offline';
  
  try {
    // Use free public IP API
    const response = await fetch('https://api.ipify.org?format=json', { 
      signal: AbortSignal.timeout(3000) 
    });
    if (response.ok) {
      const data = await response.json();
      cachedIP = data.ip;
      return data.ip;
    }
  } catch {
    // Fallback: try alternative API
    try {
      const response = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(3000) 
      });
      if (response.ok) {
        const data = await response.json();
        cachedIP = data.ip;
        return data.ip;
      }
    } catch {
      // Both APIs failed
    }
  }
  
  return 'Unknown';
}

/**
 * Generate session ID (random UUID-like)
 */
export function generateSessionId(): string {
  return 'sess-' + Date.now() + '-' + Math.random().toString(36).substr(2, 12);
}

/**
 * Generate event ID (for logs)
 */
export function generateEventId(prefix = 'evt'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Format device info untuk display di log
 */
export function formatDeviceShort(device: DeviceInfo): string {
  return `${device.browser} · ${device.os}`;
}

/**
 * Format IP untuk display (mask middle digits untuk privacy)
 */
export function maskIP(ip?: string): string {
  if (!ip || ip === 'Unknown' || ip === 'Offline' || ip === 'Local') return ip || 'Unknown';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip;
}
