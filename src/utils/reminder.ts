/**
 * Reminder System untuk Booking Hotel
 * - Pelunasan Hotel: max 15 hari sebelum check-in
 * - Hotel Approval for VISA: max 30 hari sebelum check-in
 */

export interface ReminderStatus {
  daysUntilCheckIn: number;        // Hari menuju check-in (negative = sudah lewat)
  needsPaymentReminder: boolean;   // True jika H-15 dan belum lunas
  needsVisaApprovalReminder: boolean; // True jika H-30 dan masih relevan
  paymentUrgencyLevel: 'safe' | 'warning' | 'critical' | 'overdue'; // Level urgensi
  visaUrgencyLevel: 'safe' | 'warning' | 'critical' | 'overdue';
  paymentMessage: string;
  visaMessage: string;
}

/**
 * Hitung berapa hari menuju check-in (positif = future, negatif = past)
 */
export function daysUntilCheckIn(checkInISO: string): number {
  if (!checkInISO) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInISO);
  checkIn.setHours(0, 0, 0, 0);
  const diffMs = checkIn.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Compute reminder status berdasarkan tanggal check-in dan status pembayaran
 */
export function computeReminderStatus(
  checkInISO: string,
  isFullyPaid: boolean,
  hasAnyPayment: boolean
): ReminderStatus {
  const days = daysUntilCheckIn(checkInISO);

  // PAYMENT REMINDER (H-15 critical, H-30 warning)
  let paymentUrgencyLevel: ReminderStatus['paymentUrgencyLevel'] = 'safe';
  let paymentMessage = '';
  let needsPaymentReminder = false;

  if (!isFullyPaid) {
    if (days < 0) {
      paymentUrgencyLevel = 'overdue';
      paymentMessage = `⚠️ OVERDUE ${Math.abs(days)} hari! Check-in sudah terlewat`;
      needsPaymentReminder = true;
    } else if (days === 0) {
      paymentUrgencyLevel = 'overdue';
      paymentMessage = '🚨 HARI INI CHECK-IN! Pelunasan WAJIB sekarang';
      needsPaymentReminder = true;
    } else if (days <= 7) {
      paymentUrgencyLevel = 'overdue';
      paymentMessage = `🚨 KRITIS! H-${days} pelunasan WAJIB segera`;
      needsPaymentReminder = true;
    } else if (days <= 15) {
      paymentUrgencyLevel = 'critical';
      paymentMessage = `⚠️ H-${days} batas pelunasan hotel (maks 15 hari)`;
      needsPaymentReminder = true;
    } else if (days <= 30) {
      paymentUrgencyLevel = 'warning';
      paymentMessage = `📅 H-${days} mendekati batas pelunasan`;
      needsPaymentReminder = false; // Belum critical
    }
  } else {
    paymentUrgencyLevel = 'safe';
    paymentMessage = '✅ Pelunasan complete';
  }

  // VISA APPROVAL REMINDER (H-30 perlu approval untuk proses visa)
  let visaUrgencyLevel: ReminderStatus['visaUrgencyLevel'] = 'safe';
  let visaMessage = '';
  let needsVisaApprovalReminder = false;

  if (days < 0) {
    visaUrgencyLevel = 'overdue';
    visaMessage = '⚠️ Tanggal check-in sudah terlewat';
    needsVisaApprovalReminder = false;
  } else if (days <= 15) {
    visaUrgencyLevel = 'overdue';
    visaMessage = `🚨 H-${days} VISA URGENT! Request Hotel Approval NOW`;
    needsVisaApprovalReminder = true;
  } else if (days <= 30) {
    visaUrgencyLevel = 'critical';
    visaMessage = `⚠️ H-${days} Request Hotel Approval untuk VISA (max H-30)`;
    needsVisaApprovalReminder = true;
  } else if (days <= 45) {
    visaUrgencyLevel = 'warning';
    visaMessage = `📅 H-${days} siapkan Request Hotel Approval segera`;
    needsVisaApprovalReminder = false;
  } else {
    visaUrgencyLevel = 'safe';
    visaMessage = `✅ H-${days} masih aman, plan VISA approval`;
  }

  // Override jika sudah ada beberapa pembayaran (visa approval biasanya butuh down payment)
  if (!hasAnyPayment && days <= 45) {
    visaMessage += ' (DP belum diterima)';
  }

  return {
    daysUntilCheckIn: days,
    needsPaymentReminder,
    needsVisaApprovalReminder,
    paymentUrgencyLevel,
    visaUrgencyLevel,
    paymentMessage,
    visaMessage,
  };
}

/**
 * Get CSS class untuk badge berdasarkan urgency level
 */
export function getUrgencyBadgeClass(level: ReminderStatus['paymentUrgencyLevel']): string {
  switch (level) {
    case 'overdue':
      return 'blink-red-urgent border border-red-700 px-2 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap';
    case 'critical':
      return 'blink-red-urgent border border-red-700 px-2 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap';
    case 'warning':
      return 'bg-orange-100 text-orange-800 border border-orange-400 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap';
    case 'safe':
    default:
      return 'bg-green-100 text-green-800 border border-green-400 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap';
  }
}

/**
 * Get CSS class untuk badge VISA reminder
 */
export function getVisaUrgencyBadgeClass(level: ReminderStatus['visaUrgencyLevel']): string {
  switch (level) {
    case 'overdue':
      return 'blink-red-urgent border border-red-700 px-2 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap';
    case 'critical':
      return 'blink-orange-urgent border border-orange-700 px-2 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap';
    case 'safe':
    default:
      return 'bg-blue-100 text-blue-800 border border-blue-400 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap';
  }
}
