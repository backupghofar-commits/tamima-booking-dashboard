export interface PaymentTerm {
  idrPaid: number | string;
  kurs: number | string;
}

export interface RoomRate {
  qty: number | string;
  rate: number | string;
}

export interface BookingRow {
  dbl: RoomRate;
  trp: RoomRate;
  qrd: RoomRate;
  qnt: RoomRate;
  bed: RoomRate;
  ext: RoomRate;
  mealPlan: string;
  vat: string;
  transport: number | string;
  payments: PaymentTerm[];
}

export type ViewMode = 'internal' | 'customer';

export interface BookingData {
  id: string;
  hotelName: string;
  customerName: string;
  picInternal: string;
  vendorName: string;
  salesPerson: string;
  status: string;
  checkIn: string;
  checkOut: string;
  vendor: BookingRow;
  pemesan: BookingRow;
  // Contact info for CL
  customerEmail?: string;
  customerPhone?: string;
  hotelAddress?: string;
  hotelCity?: string;
  hotelStars?: number;
  paxCount?: number;
  cancellationPolicy?: string;
  // 🚨 REMINDER OVERRIDES (manual approval)
  reminderApproved?: boolean;       // Klik APPROVED → padamkan blink
  reminderApprovedAt?: string;      // Timestamp approval
  reminderApprovedBy?: string;      // Approver name
  // 🏨 BRN (Block Room Allocation) DATA
  useBRN?: boolean;                 // Toggle BRN on/off
  brnMakkah?: BRNData;              // BRN data Makkah
  brnMadinah?: BRNData;             // BRN data Madinah
}

// BRN (Block Room Allocation) — pembayaran tambahan untuk reservasi blok
export interface BRNData {
  active: boolean;                  // Apakah pakai BRN di kota ini
  qtyPax: number | string;          // Total Pax
  ratePax: number | string;         // Rate per Pax (SAR)
}

export interface CalcResult {
  totalNight: number;
  totalSAR: number;
  totalIDRMasuk: number;
  totalSARMasuk: number;
  sisaTagihanSAR: number;
  estKursRataRata: number;
  sisaTagihanIDR: number;
  totalIDRActual: number;
}
