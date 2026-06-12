import type { BookingRow, CalcResult } from '../types';

export function toNum(val: number | string): number {
  if (val === '' || val === undefined || val === null) return 0;
  const n = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  return isNaN(n) ? 0 : n;
}

export function diffDays(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function calcRow(row: BookingRow, checkIn: string, checkOut: string): CalcResult {
  const totalNight = diffDays(checkIn, checkOut);

  const roomTotal =
    toNum(row.dbl.qty) * toNum(row.dbl.rate) +
    toNum(row.trp.qty) * toNum(row.trp.rate) +
    toNum(row.qrd.qty) * toNum(row.qrd.rate) +
    toNum(row.qnt.qty) * toNum(row.qnt.rate) +
    toNum(row.bed.qty) * toNum(row.bed.rate) +
    toNum(row.ext.qty) * toNum(row.ext.rate);

  const transport = toNum(row.transport);
  const totalSAR = roomTotal * totalNight + transport;

  let totalIDRMasuk = 0;
  let totalSARMasuk = 0;

  for (const p of row.payments) {
    const idr = toNum(p.idrPaid);
    const kurs = toNum(p.kurs);
    totalIDRMasuk += idr;
    if (kurs > 0) {
      totalSARMasuk += idr / kurs;
    }
  }

  const sisaTagihanSAR = totalSAR - totalSARMasuk;
  const estKursRataRata = totalSARMasuk > 0 ? totalIDRMasuk / totalSARMasuk : 0;
  const sisaTagihanIDR = sisaTagihanSAR * estKursRataRata;
  const totalIDRActual = totalIDRMasuk + sisaTagihanIDR;

  return {
    totalNight,
    totalSAR,
    totalIDRMasuk,
    totalSARMasuk,
    sisaTagihanSAR,
    estKursRataRata,
    sisaTagihanIDR,
    totalIDRActual,
  };
}

export function formatIDR(val: number): string {
  if (isNaN(val) || !isFinite(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatSAR(val: number): string {
  if (isNaN(val) || !isFinite(val)) return 'SAR 0';
  return (
    'SAR ' +
    new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  );
}

export function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(val);
}
