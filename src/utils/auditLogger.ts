/**
 * Audit Logger — Central logging system
 * Auto-captures all important actions in the app
 */

import type { 
  SecurityEvent, 
  SecurityEventType, 
  AuditEvent, 
  AuditActionType, 
  AuditEntityType,
  AuthSession
} from '../types/auth';
import { SECURITY_LIMITS } from '../types/auth';
import { getDeviceInfo, getIPAddress, generateEventId, formatDeviceShort } from './auth';

const SECURITY_LOG_KEY = 'tamima_security_log';
const AUDIT_LOG_KEY = 'tamima_audit_log';

// ════════════════════════════════════════════════════════════════
// SECURITY LOG — Login, Logout, Password, Lockout, etc.
// ════════════════════════════════════════════════════════════════

export async function logSecurityEvent(
  type: SecurityEventType,
  options: {
    userId?: string;
    username?: string;
    success?: boolean;
    message?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<SecurityEvent> {
  const event: SecurityEvent = {
    id: generateEventId('sec'),
    type,
    timestamp: new Date().toISOString(),
    userId: options.userId,
    username: options.username,
    ipAddress: await getIPAddress(),
    device: getDeviceInfo(),
    success: options.success ?? true,
    message: options.message || getDefaultMessage(type),
    metadata: options.metadata,
  };

  try {
    const existing = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY) || '[]');
    const updated = [event, ...existing].slice(0, SECURITY_LIMITS.MAX_SECURITY_LOG_ENTRIES);
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save security log:', e);
  }

  return event;
}

function getDefaultMessage(type: SecurityEventType): string {
  const messages: Record<SecurityEventType, string> = {
    login_success: 'Login berhasil',
    login_failed: 'Login gagal — kredensial tidak valid',
    logout: 'Logout',
    logout_secure: 'Secure logout — session dihapus',
    session_expired: 'Session expired — auto logout',
    session_destroyed: 'Session destroyed manually',
    password_changed: 'Password berhasil diubah',
    password_reset_requested: 'Password reset requested',
    account_locked: 'Account dikunci karena terlalu banyak failed login',
    account_unlocked: 'Account dibuka kembali',
    suspicious_activity: 'Aktivitas mencurigakan terdeteksi',
    permission_denied: 'Akses ditolak — permission tidak cukup',
  };
  return messages[type];
}

export function getSecurityLog(limit?: number): SecurityEvent[] {
  try {
    const logs = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY) || '[]');
    return limit ? logs.slice(0, limit) : logs;
  } catch {
    return [];
  }
}

export function clearSecurityLog(): void {
  localStorage.removeItem(SECURITY_LOG_KEY);
}

// ════════════════════════════════════════════════════════════════
// AUDIT LOG — Create, Update, Delete, Export, Import, etc.
// ════════════════════════════════════════════════════════════════

let currentSession: AuthSession | null = null;

export function setCurrentSession(session: AuthSession | null): void {
  currentSession = session;
}

export async function logAuditEvent(
  action: AuditActionType,
  entity: AuditEntityType,
  options: {
    entityId?: string;
    entityName?: string;
    description?: string;
    before?: any;
    after?: any;
    status?: 'success' | 'failed';
    errorMessage?: string;
  } = {}
): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: generateEventId('aud'),
    timestamp: new Date().toISOString(),
    userId: currentSession?.userId,
    username: currentSession?.username,
    action,
    entity,
    entityId: options.entityId,
    entityName: options.entityName,
    description: options.description || `${action.toUpperCase()} ${entity}${options.entityName ? `: ${options.entityName}` : ''}`,
    before: options.before,
    after: options.after,
    ipAddress: await getIPAddress(),
    device: { browser: getDeviceInfo().browser, os: getDeviceInfo().os },
    status: options.status || 'success',
    errorMessage: options.errorMessage,
  };

  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
    const updated = [event, ...existing].slice(0, SECURITY_LIMITS.MAX_AUDIT_LOG_ENTRIES);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }

  return event;
}

export function getAuditLog(filter?: {
  action?: AuditActionType;
  entity?: AuditEntityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): AuditEvent[] {
  try {
    let logs: AuditEvent[] = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
    
    if (filter?.action) logs = logs.filter(l => l.action === filter.action);
    if (filter?.entity) logs = logs.filter(l => l.entity === filter.entity);
    if (filter?.userId) logs = logs.filter(l => l.userId === filter.userId);
    if (filter?.startDate) logs = logs.filter(l => l.timestamp >= filter.startDate!);
    if (filter?.endDate) logs = logs.filter(l => l.timestamp <= filter.endDate!);
    
    return filter?.limit ? logs.slice(0, filter.limit) : logs;
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

// Helper: Export logs sebagai JSON
export function exportLogs(type: 'security' | 'audit' | 'all'): string {
  const data: any = {};
  if (type === 'security' || type === 'all') {
    data.securityLog = getSecurityLog();
  }
  if (type === 'audit' || type === 'all') {
    data.auditLog = getAuditLog();
  }
  data.exportedAt = new Date().toISOString();
  data.totalEntries = (data.securityLog?.length || 0) + (data.auditLog?.length || 0);
  return JSON.stringify(data, null, 2);
}

// Helper: Format event untuk display
export function formatSecurityEventLabel(type: SecurityEventType): { icon: string; label: string; color: string } {
  const map: Record<SecurityEventType, { icon: string; label: string; color: string }> = {
    login_success: { icon: '✅', label: 'Login Success', color: 'bg-green-100 text-green-800 border-green-400' },
    login_failed: { icon: '❌', label: 'Login Failed', color: 'bg-red-100 text-red-800 border-red-400' },
    logout: { icon: '👋', label: 'Logout', color: 'bg-slate-100 text-slate-700 border-slate-400' },
    logout_secure: { icon: '🔒', label: 'Secure Logout', color: 'bg-blue-100 text-blue-800 border-blue-400' },
    session_expired: { icon: '⏰', label: 'Session Expired', color: 'bg-orange-100 text-orange-800 border-orange-400' },
    session_destroyed: { icon: '🗑️', label: 'Session Destroyed', color: 'bg-red-100 text-red-800 border-red-400' },
    password_changed: { icon: '🔑', label: 'Password Changed', color: 'bg-purple-100 text-purple-800 border-purple-400' },
    password_reset_requested: { icon: '🔄', label: 'Password Reset', color: 'bg-amber-100 text-amber-800 border-amber-400' },
    account_locked: { icon: '🔒', label: 'Account Locked', color: 'bg-red-100 text-red-800 border-red-400' },
    account_unlocked: { icon: '🔓', label: 'Account Unlocked', color: 'bg-green-100 text-green-800 border-green-400' },
    suspicious_activity: { icon: '🚨', label: 'Suspicious Activity', color: 'bg-red-100 text-red-800 border-red-400' },
    permission_denied: { icon: '⛔', label: 'Permission Denied', color: 'bg-orange-100 text-orange-800 border-orange-400' },
  };
  return map[type];
}

export function formatAuditActionLabel(action: AuditActionType): { icon: string; label: string; color: string } {
  const map: Record<AuditActionType, { icon: string; label: string; color: string }> = {
    create: { icon: '➕', label: 'CREATE', color: 'bg-green-100 text-green-800 border-green-400' },
    update: { icon: '✏️', label: 'UPDATE', color: 'bg-blue-100 text-blue-800 border-blue-400' },
    delete: { icon: '🗑️', label: 'DELETE', color: 'bg-red-100 text-red-800 border-red-400' },
    export: { icon: '📤', label: 'EXPORT', color: 'bg-amber-100 text-amber-800 border-amber-400' },
    import: { icon: '📥', label: 'IMPORT', color: 'bg-purple-100 text-purple-800 border-purple-400' },
    login: { icon: '🔓', label: 'LOGIN', color: 'bg-green-100 text-green-800 border-green-400' },
    logout: { icon: '🔒', label: 'LOGOUT', color: 'bg-slate-100 text-slate-700 border-slate-400' },
    view: { icon: '👁️', label: 'VIEW', color: 'bg-slate-100 text-slate-700 border-slate-400' },
    print: { icon: '🖨️', label: 'PRINT', color: 'bg-indigo-100 text-indigo-800 border-indigo-400' },
    approve: { icon: '✅', label: 'APPROVE', color: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
  };
  return map[action];
}

export { formatDeviceShort };
