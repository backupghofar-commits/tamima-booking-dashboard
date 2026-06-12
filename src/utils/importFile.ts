/**
 * Import File Utility
 * Parsing .xls / .xlsx / .csv file ke array BookingData
 * Format mengikuti template TAMIMA yang sudah dibuat
 */

import * as XLSX from 'xlsx';
import type { BookingData, BookingRow, PaymentTerm } from '../types';

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

const EMPTY_PAYMENTS = (): PaymentTerm[] => 
  Array.from({ length: 5 }, () => ({ idrPaid: '', kurs: '' }));

const EMPTY_ROOM = () => ({ qty: '', rate: '' });

const emptyRow = (): BookingRow => ({
  dbl: EMPTY_ROOM(), trp: EMPTY_ROOM(), qrd: EMPTY_ROOM(),
  qnt: EMPTY_ROOM(), bed: EMPTY_ROOM(), ext: EMPTY_ROOM(),
  mealPlan: '', vat: '', transport: '',
  payments: EMPTY_PAYMENTS(),
});

/**
 * Parse cell value yang bisa string atau number
 */
function parseCell(val: any, defaultVal: any = ''): any {
  if (val === null || val === undefined || val === '') return defaultVal;
  // Replace placeholder text dengan empty
  const str = String(val).trim();
  if (str.startsWith('[') && str.endsWith(']')) return defaultVal; // [isi nama...]
  if (str === '-') return defaultVal;
  return val;
}

function parseNum(val: any, defaultVal: number | string = ''): number | string {
  const parsed = parseCell(val, defaultVal);
  if (parsed === '' || parsed === defaultVal) return defaultVal;
  const num = Number(parsed);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Convert various date formats to YYYY-MM-DD
 */
function parseDate(val: any): string {
  if (!val) return '';
  
  // If it's already Date object (Excel serial date)
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  
  // If number (Excel serial)
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  
  // String parsing
  const str = String(val).trim();
  if (str.startsWith('[')) return ''; // placeholder
  
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  
  // DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    let [, p1, p2, p3] = slashMatch;
    let year = p3.length === 2 ? '20' + p3 : p3;
    // Assume DD/MM/YYYY (Indonesian)
    return `${year}-${p2.padStart(2,'0')}-${p1.padStart(2,'0')}`;
  }
  
  // Try Date parsing as fallback
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    return dt.toISOString().split('T')[0];
  }
  
  return '';
}

export interface ImportResult {
  success: boolean;
  bookings: BookingData[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse template TAMIMA format (vertikal: metadata di atas, BUY/SELL di bawah)
 */
function parseTemplateFormat(rows: any[][]): BookingData | null {
  // Skip null rows
  const filtered = rows.filter(r => r && r.length > 0);
  if (filtered.length < 3) return null;

  // Cari row metadata dengan keyword HOTEL:
  let metaRow: any[] | null = null;
  let buyRow: any[] | null = null;
  let sellRow: any[] | null = null;

  for (const row of filtered) {
    const firstCell = String(row[0] || '').trim().toUpperCase();
    if (firstCell.startsWith('HOTEL') && row.length > 2) {
      metaRow = row;
    }
    if (firstCell === 'BUY' || firstCell.includes('BUY')) buyRow = row;
    if (firstCell === 'SELL' || firstCell.includes('SELL')) sellRow = row;
  }

  if (!buyRow || !sellRow) return null;

  // Parse metadata dari format: HOTEL: [val] ... CUSTOMER: [val] ...
  let hotelName = '', customerName = '', picInternal = '', vendorName = '', salesPerson = '';
  
  if (metaRow) {
    // Find labels by string matching
    for (let i = 0; i < metaRow.length; i++) {
      const cell = String(metaRow[i] || '').trim().toUpperCase();
      const nextVal = parseCell(metaRow[i + 1], '');
      if (cell === 'HOTEL:' || cell === 'HOTEL') hotelName = String(nextVal);
      if (cell === 'CUSTOMER:' || cell === 'CUSTOMER') customerName = String(nextVal);
      if (cell === 'PIC INTERNAL:' || cell === 'PIC:') picInternal = String(nextVal);
      if (cell === 'VENDOR:' || cell === 'VENDOR') vendorName = String(nextVal);
      if (cell === 'SALES PERSON:' || cell === 'SALES:') salesPerson = String(nextVal);
    }
  }

  // Parse BUY/SELL rows
  // Column layout: [Label, CheckIn, CheckOut, Night, DBL_Q, DBL_R, TRP_Q, TRP_R, QRD_Q, QRD_R, QNT_Q, QNT_R, BED_Q, BED_R, EXT_Q, EXT_R, Meal, VAT, Trans, TotalSAR, P1_IDR, P1_Kurs, P2_IDR, P2_Kurs, P3_IDR, P3_Kurs, P4_IDR, P4_Kurs, P5_IDR, P5_Kurs]
  const parseRowToBookingRow = (row: any[]): BookingRow => {
    return {
      dbl: { qty: parseNum(row[4]), rate: parseNum(row[5]) },
      trp: { qty: parseNum(row[6]), rate: parseNum(row[7]) },
      qrd: { qty: parseNum(row[8]), rate: parseNum(row[9]) },
      qnt: { qty: parseNum(row[10]), rate: parseNum(row[11]) },
      bed: { qty: parseNum(row[12]), rate: parseNum(row[13]) },
      ext: { qty: parseNum(row[14]), rate: parseNum(row[15]) },
      mealPlan: String(parseCell(row[16], '')),
      vat: String(parseCell(row[17], '')),
      transport: parseNum(row[18]),
      payments: [
        { idrPaid: parseNum(row[20]), kurs: parseNum(row[21]) },
        { idrPaid: parseNum(row[22]), kurs: parseNum(row[23]) },
        { idrPaid: parseNum(row[24]), kurs: parseNum(row[25]) },
        { idrPaid: parseNum(row[26]), kurs: parseNum(row[27]) },
        { idrPaid: parseNum(row[28]), kurs: parseNum(row[29]) },
      ],
    };
  };

  const checkIn = parseDate(sellRow[1] || buyRow[1]);
  const checkOut = parseDate(sellRow[2] || buyRow[2]);

  return {
    id: generateId(),
    hotelName, customerName, picInternal, vendorName, salesPerson,
    status: '',
    checkIn, checkOut,
    vendor: parseRowToBookingRow(buyRow),
    pemesan: parseRowToBookingRow(sellRow),
  };
}

/**
 * Parse simple "flat" CSV/XLS format (1 booking = 1 row)
 * Header: HotelName, CustomerName, PIC, Vendor, Sales, CheckIn, CheckOut, DBL_Qty_Buy, DBL_Rate_Buy, ...
 */
function parseFlatFormat(rows: any[][]): BookingData[] {
  if (rows.length < 2) return [];
  
  const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
  const bookings: BookingData[] = [];

  // Find column indexes by name (flexible)
  const findCol = (...names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const colHotel = findCol('hotel');
  const colCustomer = findCol('customer', 'pemesan');
  const colPic = findCol('pic');
  const colVendor = findCol('vendor');
  const colSales = findCol('sales');
  const colCheckIn = findCol('checkin', 'check in', 'in');
  const colCheckOut = findCol('checkout', 'check out', 'out');

  // For each data row, create booking
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (colHotel >= 0 && !row[colHotel]) continue; // skip empty

    bookings.push({
      id: generateId(),
      hotelName: String(parseCell(row[colHotel], '')),
      customerName: String(parseCell(row[colCustomer], '')),
      picInternal: String(parseCell(row[colPic], '')),
      vendorName: String(parseCell(row[colVendor], '')),
      salesPerson: String(parseCell(row[colSales], '')),
      status: '',
      checkIn: parseDate(row[colCheckIn]),
      checkOut: parseDate(row[colCheckOut]),
      vendor: emptyRow(),
      pemesan: emptyRow(),
    });
  }

  return bookings;
}

/**
 * Main import function — auto-detect format
 */
export async function importBookingFile(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    bookings: [],
    errors: [],
    warnings: [],
  };

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

    if (workbook.SheetNames.length === 0) {
      result.errors.push('File tidak memiliki sheet apapun');
      return result;
    }

    // Process each sheet — each sheet bisa berisi 1 booking (template format)
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { 
        header: 1, 
        defval: '',
        raw: false,
        blankrows: false,
      });

      if (rows.length === 0) continue;

      // Try template format first (1 sheet = 1 booking with BUY/SELL rows)
      const template = parseTemplateFormat(rows);
      if (template) {
        result.bookings.push(template);
        continue;
      }

      // Fallback: flat format (1 row = 1 booking)
      const flat = parseFlatFormat(rows);
      if (flat.length > 0) {
        result.bookings.push(...flat);
        continue;
      }

      result.warnings.push(`Sheet "${sheetName}" tidak dapat di-parse — format tidak dikenali`);
    }

    // Validation
    if (result.bookings.length === 0) {
      result.errors.push('Tidak ada data booking yang berhasil dibaca dari file');
      return result;
    }

    // Check empty critical fields
    result.bookings.forEach((b, i) => {
      if (!b.customerName) {
        result.warnings.push(`Booking #${i + 1}: Nama Customer kosong`);
      }
      if (!b.hotelName) {
        result.warnings.push(`Booking #${i + 1}: Nama Hotel kosong`);
      }
    });

    result.success = true;
    return result;

  } catch (err: any) {
    result.errors.push(`Gagal parse file: ${err.message || 'Unknown error'}`);
    return result;
  }
}

/**
 * CSV file support — parse as text
 */
export async function importCSVFile(file: File): Promise<ImportResult> {
  return importBookingFile(file); // XLSX.read handles CSV too
}

/**
 * Generate Excel template file with 3 customer × 5 hotel sample data for June-July 2026
 */
export function generateMultiBookingSample() {
  // 3 Customer × 5 Hotel = 15 booking samples
  const customers = [
    { name: 'PT. AL-HARAMAIN TOUR & TRAVEL', email: 'admin@alharamain.co.id', phone: '081234567890', sales: 'BUDI SANTOSO' },
    { name: 'PT. SAFA MARWAH WISATA', email: 'booking@safamarwah.com', phone: '081298765432', sales: 'RIZKY HIDAYAT' },
    { name: 'CV. BAITULLAH TOUR', email: 'cs@baitullah-tour.id', phone: '081387654321', sales: 'AHMAD FAUZI' },
  ];

  const hotels = [
    { name: 'Pullman Zamzam Makkah', city: 'Makkah', stars: 5, vendor: 'ELAF GROUP', pic: 'GHOFAR' },
    { name: 'Swissôtel Al Maqam Makkah', city: 'Makkah', stars: 5, vendor: 'DALLAH TRANS', pic: 'GHOFAR' },
    { name: 'Anjum Hotel Makkah', city: 'Makkah', stars: 5, vendor: 'AL-MAJDIA', pic: 'AHMAD' },
    { name: 'Pullman Zamzam Madinah', city: 'Madinah', stars: 5, vendor: 'TAIBA HOTELS', pic: 'GHOFAR' },
    { name: 'Movenpick Anwar Al Madinah', city: 'Madinah', stars: 5, vendor: 'MARASEM TOURS', pic: 'AHMAD' },
  ];

  // Generate 15 bookings: each customer books all 5 hotels with staggered dates
  const bookings: BookingData[] = [];
  const baseDates = [
    { in: '2026-06-05', out: '2026-06-10' },  // Hotel 1
    { in: '2026-06-12', out: '2026-06-18' },  // Hotel 2
    { in: '2026-06-20', out: '2026-06-26' },  // Hotel 3
    { in: '2026-07-02', out: '2026-07-08' },  // Hotel 4
    { in: '2026-07-10', out: '2026-07-16' },  // Hotel 5
  ];

  // Different rate variations per customer (margin variant)
  const rateVariants = [
    { dblBuy: 850, dblSell: 980, trpBuy: 950, trpSell: 1100, qrdBuy: 1100, qrdSell: 1280 },
    { dblBuy: 780, dblSell: 920, trpBuy: 880, trpSell: 1020, qrdBuy: 1020, qrdSell: 1180 },
    { dblBuy: 920, dblSell: 1080, trpBuy: 1020, trpSell: 1180, qrdBuy: 1180, qrdSell: 1380 },
  ];

  let bookingCount = 0;

  customers.forEach((cust, custIdx) => {
    const rates = rateVariants[custIdx];
    hotels.forEach((hotel, hotelIdx) => {
      const dates = baseDates[hotelIdx];
      
      // Vary room qty per customer (group size variant)
      const dblQty = 8 + (custIdx * 2);  // 8, 10, 12
      const trpQty = 5 + custIdx;         // 5, 6, 7
      const qrdQty = 3;

      bookings.push({
        id: `SMP-${Date.now()}-${++bookingCount}`,
        hotelName: hotel.name,
        customerName: cust.name,
        picInternal: hotel.pic,
        vendorName: hotel.vendor,
        salesPerson: cust.sales,
        status: '',
        checkIn: dates.in,
        checkOut: dates.out,
        customerEmail: cust.email,
        customerPhone: cust.phone,
        hotelCity: hotel.city,
        hotelStars: hotel.stars,
        hotelAddress: `${hotel.city}, Saudi Arabia`,
        paxCount: dblQty * 2 + trpQty * 3 + qrdQty * 4,
        vendor: {
          dbl: { qty: dblQty, rate: rates.dblBuy },
          trp: { qty: trpQty, rate: rates.trpBuy },
          qrd: { qty: qrdQty, rate: rates.qrdBuy },
          qnt: EMPTY_ROOM(),
          bed: EMPTY_ROOM(),
          ext: EMPTY_ROOM(),
          mealPlan: 'FB',
          vat: '15% Included',
          transport: 2500,
          payments: [
            { idrPaid: 100000000 + custIdx * 20000000, kurs: 4320 + hotelIdx * 5 },
            { idrPaid: hotelIdx % 2 === 0 ? 80000000 : 0, kurs: 4325 + hotelIdx * 5 },
            { idrPaid: '', kurs: '' },
            { idrPaid: '', kurs: '' },
            { idrPaid: '', kurs: '' },
          ],
        },
        pemesan: {
          dbl: { qty: dblQty, rate: rates.dblSell },
          trp: { qty: trpQty, rate: rates.trpSell },
          qrd: { qty: qrdQty, rate: rates.qrdSell },
          qnt: EMPTY_ROOM(),
          bed: EMPTY_ROOM(),
          ext: EMPTY_ROOM(),
          mealPlan: 'FB',
          vat: '15% Included',
          transport: 3500,
          payments: [
            { idrPaid: 130000000 + custIdx * 25000000, kurs: 4350 + hotelIdx * 5 },
            { idrPaid: hotelIdx % 2 === 0 ? 100000000 : 50000000, kurs: 4355 + hotelIdx * 5 },
            { idrPaid: '', kurs: '' },
            { idrPaid: '', kurs: '' },
            { idrPaid: '', kurs: '' },
          ],
        },
      });
    });
  });

  return bookings;
}
