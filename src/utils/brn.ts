/**
 * BRN (Block Room Allocation) Calculator
 * 
 * 🆕 RUMUS BARU:
 *  - BRN per Kota = Qty Pax × Rate Pax (SAR) × Total Night
 *  - TOTAL BRN = BRN Makkah + BRN Madinah
 *  - BRN otomatis mengurangi NET PROFIT karena merupakan biaya tambahan vendor
 *  - Bisa diaktifkan di salah satu kota saja atau keduanya
 */

import type { BookingData, BRNData } from '../types';
import { calcRow } from './calc';

export interface BRNCalcResult {
  makkahTotal: number;            // SAR (Qty × Rate × Nights)
  madinahTotal: number;           // SAR (Qty × Rate × Nights)
  totalBRN_SAR: number;           // Total kedua kota dalam SAR
  totalBRN_IDR: number;           // Total dalam IDR (pakai kurs rata-rata)
  totalNight: number;             // Jumlah malam yang dipakai untuk kalkulasi
  hasBRN: boolean;                // Apakah ada BRN aktif
}

/**
 * Hitung total BRN dalam SAR & IDR (× Total Night)
 */
export function calcBRN(data: BookingData, avgKurs: number): BRNCalcResult {
  // Hitung total night dari tanggal check-in/check-out
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const totalNight = pemesanCalc.totalNight || 1;

  if (!data.useBRN) {
    return { 
      makkahTotal: 0, 
      madinahTotal: 0, 
      totalBRN_SAR: 0, 
      totalBRN_IDR: 0,
      totalNight,
      hasBRN: false 
    };
  }

  const makkah = computeSingleBRN(data.brnMakkah, totalNight);
  const madinah = computeSingleBRN(data.brnMadinah, totalNight);
  const totalSAR = makkah + madinah;
  const totalIDR = totalSAR * (avgKurs || 4300);

  return {
    makkahTotal: makkah,
    madinahTotal: madinah,
    totalBRN_SAR: totalSAR,
    totalBRN_IDR: totalIDR,
    totalNight,
    hasBRN: makkah > 0 || madinah > 0,
  };
}

/**
 * Compute single BRN dengan formula: Qty × Rate × Nights
 */
function computeSingleBRN(brn: BRNData | undefined, totalNight: number): number {
  if (!brn || !brn.active) return 0;
  const qty = Number(brn.qtyPax) || 0;
  const rate = Number(brn.ratePax) || 0;
  return qty * rate * totalNight;
}

/**
 * Hitung BRN per kota dengan breakdown — untuk display
 */
export function computeBRNBreakdown(brn: BRNData | undefined, totalNight: number) {
  const qty = Number(brn?.qtyPax) || 0;
  const rate = Number(brn?.ratePax) || 0;
  const subtotalPerNight = qty * rate;
  const total = subtotalPerNight * totalNight;
  return {
    qty,
    rate,
    nights: totalNight,
    subtotalPerNight,  // Qty × Rate (1 malam)
    total,             // Qty × Rate × Nights
  };
}

/**
 * Default empty BRN
 */
export function createEmptyBRN(): BRNData {
  return {
    active: false,
    qtyPax: '',
    ratePax: '',
  };
}
