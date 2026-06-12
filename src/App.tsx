import React, { useState, useCallback, useEffect } from 'react';
import { useDebouncedEffect } from './hooks/useDebouncedEffect';
import type { BookingData, BookingRow, ViewMode } from './types';
import { calcRow } from './utils/calc';
import KPICards from './components/KPICards';
import SpreadsheetView from './components/SpreadsheetView';
import SavedOrdersTable from './components/SavedOrdersTable';
import BRNSection from './components/BRNSection';
import UploadFileModal from './components/UploadFileModal';
import { calcBRN } from './utils/brn';
import PrintHeader from './components/PrintHeader';
import PrintFooter from './components/PrintFooter';
import ScreenHeader from './components/ScreenHeader';
import DropdownButton from './components/DropdownButton';
import DatabasePrintView from './components/DatabasePrintView';
import CLModal from './components/CLModal';
import InstallPWAButton from './components/InstallPWAButton';
import ResponsiveDebugToggle from './components/ResponsiveDebugToggle';
import MobileHamburgerMenu from './components/MobileHamburgerMenu';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ModernKPICards from './components/dashboard/ModernKPICards';
import SecurityWidget from './components/dashboard/SecurityWidget';
import SystemStatusWidget from './components/dashboard/SystemStatusWidget';
import { logAuditEvent } from './utils/auditLogger';
import { generatePremiumPDF, downloadPremiumHTML, printPremiumDocument } from './utils/premiumPdfTemplate';
import type { DocumentType } from './utils/qrVerification';
import type { PaperFormat } from './utils/premiumPdfTemplate';
import { downloadTemplateInput, downloadLaporanInternal, downloadStatementCustomer } from './utils/exportExcel';
import { downloadCLDocx, downloadCLPdf, sendCLWhatsApp, sendCLEmail } from './utils/exportCL';
import { exportStatementHTML, exportInternalHTML, exportCLHTML } from './utils/exportHTML';

const EMPTY_PAYMENTS = Array.from({ length: 5 }, () => ({ idrPaid: '', kurs: '' }));
const EMPTY_ROOM = () => ({ qty: '', rate: '' });
const createEmptyRow = (): BookingRow => ({
  dbl: EMPTY_ROOM(), trp: EMPTY_ROOM(), qrd: EMPTY_ROOM(),
  qnt: EMPTY_ROOM(), bed: EMPTY_ROOM(), ext: EMPTY_ROOM(), mealPlan: '', vat: '',
  transport: '', payments: EMPTY_PAYMENTS.map((p) => ({ ...p })),
});

const generateId = () => Date.now().toString();

const INITIAL_DATA: BookingData = {
  id: generateId(),
  hotelName: '', customerName: '', picInternal: '', vendorName: '', salesPerson: '', status: '',
  checkIn: '', checkOut: '',
  vendor: createEmptyRow(), pemesan: createEmptyRow(),
};

const IMPORTED_DATA: BookingData = {
  id: generateId(),
  hotelName: 'SAFWAH TOWER 3',
  customerName: 'NUR VIRGIAWAN',
  picInternal: 'NUR VIRGIAWAN',
  vendorName: 'ABEH GOLDEN',
  salesPerson: 'MR. HAZEEM',
  status: 'LUNAS',
  checkIn: '2026-04-08',
  checkOut: '2026-04-11',
  vendor: {
    dbl: { qty: 1, rate: 630 }, trp: EMPTY_ROOM(), qrd: EMPTY_ROOM(), qnt: EMPTY_ROOM(), bed: EMPTY_ROOM(), ext: EMPTY_ROOM(),
    mealPlan: 'FB', vat: '-', transport: 0,
    payments: [
      { idrPaid: 5000000, kurs: 4550 },
      { idrPaid: 3725500, kurs: 4560 },
      { idrPaid: '', kurs: '' }, { idrPaid: '', kurs: '' }, { idrPaid: '', kurs: '' }
    ]
  },
  pemesan: {
    dbl: { qty: 1, rate: 800 }, trp: EMPTY_ROOM(), qrd: EMPTY_ROOM(), qnt: EMPTY_ROOM(), bed: EMPTY_ROOM(), ext: EMPTY_ROOM(),
    mealPlan: 'FB', vat: '-', transport: 0,
    payments: [
      { idrPaid: 6000000, kurs: 4550 },
      { idrPaid: 4920000, kurs: 4555 },
      { idrPaid: '', kurs: '' }, { idrPaid: '', kurs: '' }, { idrPaid: '', kurs: '' }
    ]
  }
};

const App: React.FC = () => {
  const [data, setData] = useState<BookingData>(IMPORTED_DATA);
  const [savedOrders, setSavedOrders] = useState<BookingData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('internal');
  
  // State untuk Print Database (multi booking)
  const [databasePrint, setDatabasePrint] = useState<{
    active: boolean;
    orders: BookingData[];
    filterInfo: string;
    mode: ViewMode;
  }>({ active: false, orders: [], filterInfo: '', mode: 'internal' });

  // State untuk CL Modal
  const [clModalOpen, setClModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  // 🆕 Track IDs untuk highlight visual booking yang baru di-import
  const [newlyImportedIds, setNewlyImportedIds] = useState<Set<string>>(new Set());

  const MAX_STORAGE = 150;
  
  // Load from local storage
  useEffect(() => {
    const localData = localStorage.getItem('umrah_bookings');
    if (localData) {
      try { setSavedOrders(JSON.parse(localData)); } catch (e) {}
    }
  }, []);

  // 🚀 PERF: Debounced localStorage write (500ms)
  // Mencegah heavy JSON.stringify+I/O setiap user mengetik
  useDebouncedEffect(() => {
    try {
      localStorage.setItem('umrah_bookings', JSON.stringify(savedOrders));
    } catch (e) {
      console.error('Storage error:', e);
      alert('⚠️ Penyimpanan browser penuh!\n\nSilakan hapus beberapa data lama untuk menambah booking baru.');
    }
  }, [savedOrders], 500);

  const handleMetaChange = useCallback((updated: Partial<BookingData>) => {
    setData((prev) => ({ ...prev, ...updated }));
  }, []);
  const handleVendorChange = useCallback((updated: Partial<BookingRow>) => {
    setData((prev) => ({ ...prev, vendor: { ...prev.vendor, ...updated } }));
  }, []);
  const handlePemesanChange = useCallback((updated: Partial<BookingRow>) => {
    setData((prev) => ({ ...prev, pemesan: { ...prev.pemesan, ...updated } }));
  }, []);

  const handleNewOrder = () => {
    if (window.confirm('Buat orderan baru? Data yang belum disave akan hilang.')) {
      setData({ ...INITIAL_DATA, id: generateId() });
    }
  };

  // ✅ SIMPAN OTOMATIS — Satu tombol untuk menyimpan kedua versi (customer & internal)
  const handleSave = () => {
    if (!data.customerName) {
      alert('⚠️ Nama Customer wajib diisi sebelum menyimpan!');
      return;
    }
    
    // 📝 AUDIT LOG: Save booking (create or update)
    const isExistingBooking = savedOrders.some(o => o.id === data.id);
    logAuditEvent(isExistingBooking ? 'update' : 'create', 'booking', {
      entityId: data.id,
      entityName: `${data.customerName} - ${data.hotelName}`,
      description: `${isExistingBooking ? 'UPDATE' : 'CREATE'} booking: ${data.customerName} di ${data.hotelName} (${data.checkIn} - ${data.checkOut})`,
    }).catch(() => {}); // Non-blocking
    
    // Cek kapasitas penyimpanan untuk data baru
    const isExisting = savedOrders.some(o => o.id === data.id);
    if (!isExisting && savedOrders.length >= MAX_STORAGE) {
      alert(`🚨 PENYIMPANAN PENUH!\n\nKapasitas maksimal ${MAX_STORAGE} booking telah tercapai.\nSilakan hapus beberapa data lama untuk menambah booking baru.`);
      return;
    }
    
    setSavedOrders(prev => {
      const existingIdx = prev.findIndex(o => o.id === data.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = data;
        return updated;
      } else {
        return [data, ...prev];
      }
    });
    
    const slotsLeft = isExisting ? MAX_STORAGE - savedOrders.length : MAX_STORAGE - savedOrders.length - 1;
    const action = isExisting ? 'DIPERBARUI' : 'TERSIMPAN';
    alert(
      `✅ Data ${action}!\n\n` +
      `Booking siap dicetak dalam 2 versi:\n` +
      `  📊 Laporan Internal (versi lengkap)\n` +
      `  👤 Statement Booking Customer (versi aman)\n\n` +
      `Gunakan tombol CETAK atau DOWNLOAD untuk menghasilkan dokumennya.\n\n` +
      `💾 Slot tersisa: ${slotsLeft} dari ${MAX_STORAGE} booking.`
    );
  };

  const handlePrint = (mode: 'customer' | 'internal') => {
    setViewMode(mode);
    setTimeout(() => window.print(), 200);
  };

  // 🖨️ Handler khusus print database (multi-booking)
  const handlePrintDatabase = (orders: BookingData[], filterInfo: string, mode: 'internal' | 'customer') => {
    setDatabasePrint({ active: true, orders, filterInfo, mode });
    setTimeout(() => {
      window.print();
      // Reset setelah print
      setTimeout(() => setDatabasePrint({ active: false, orders: [], filterInfo: '', mode: 'internal' }), 500);
    }, 300);
  };



  /**
   * 🎨 Generate & Print Premium Document
   * Supports: cl, invoice, voucher, statement
   * Paper formats: A4, Legal, Letter
   */
  const handleGeneratePremium = async (
    docType: DocumentType, 
    action: 'print' | 'download',
    paper: PaperFormat = 'A4'
  ) => {
    if (!data.customerName) {
      alert('⚠️ Isi nama customer terlebih dahulu!');
      return;
    }
    
    try {
      const html = await generatePremiumPDF(data, {
        documentType: docType,
        format: paper,
        showWatermark: true,
      });
      
      const docLabel = {
        cl: 'Confirmation Letter',
        invoice: 'Invoice',
        voucher: 'Voucher',
        statement: 'Booking Statement',
      }[docType];
      
      if (action === 'print') {
        printPremiumDocument(html);
      } else {
        const fileName = `${docLabel.replace(/\s+/g, '_')}_${(data.customerName || 'Customer').replace(/\s+/g, '_')}_${data.id.slice(-6)}.html`;
        downloadPremiumHTML(html, fileName);
        alert(`✅ ${docLabel} berhasil didownload sebagai HTML!\n\n📌 File berisi:\n• QR Verification untuk validasi online\n• Style Premium Corporate\n• Format ${paper} dengan margin 15-18mm\n• Siap di-print atau save as PDF dari browser`);
      }
      
      // Audit log
      logAuditEvent(action === 'print' ? 'print' : 'export', docType as any, {
        entityId: data.id,
        entityName: data.customerName,
        description: `${action === 'print' ? 'PRINT' : 'EXPORT'} ${docLabel} (${paper}) untuk ${data.customerName}`,
      }).catch(() => {});
    } catch (err: any) {
      alert(`❌ Gagal generate ${docType}: ${err.message}`);
    }
  };

  const handleEditSaved = (order: BookingData) => {
    setData(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🚨 APPROVED — Tandai semua reminder sebagai Clean & Clear
  const handleApproveReminders = (orderIds: string[]) => {
    const now = new Date().toISOString();
    setSavedOrders(prev => prev.map(o => 
      orderIds.includes(o.id) 
        ? { ...o, reminderApproved: true, reminderApprovedAt: now, reminderApprovedBy: 'GHOFAR' } 
        : o
    ));
  };

  // 🏨 BRN APPROVED — Aktifkan BRN untuk orders & padamkan reminder
  // 📤 IMPORT BOOKINGS — append imported bookings ke saved orders + highlight + auto-scroll
  const handleImportBookings = (imported: BookingData[]) => {
    if (imported.length === 0) return;
    
    // Validate capacity
    if (savedOrders.length + imported.length > MAX_STORAGE) {
      alert(`🚨 Kapasitas storage tidak cukup!\n\nMax: ${MAX_STORAGE} booking\nSaat ini: ${savedOrders.length}\nMau import: ${imported.length}`);
      return;
    }
    
    // STEP 1: Append imported di posisi paling atas
    setSavedOrders(prev => [...imported, ...prev]);
    
    // 📝 AUDIT LOG: Bulk import
    logAuditEvent('import', 'database', {
      entityName: `${imported.length} bookings`,
      description: `IMPORT ${imported.length} bookings dari file (XLSX/CSV)`,
      after: { count: imported.length, customers: imported.slice(0, 3).map(b => b.customerName) },
    }).catch(() => {});
    
    // STEP 2: Track IDs sebagai "newly imported" untuk highlight visual
    const newIds = new Set(imported.map(b => b.id));
    setNewlyImportedIds(newIds);
    
    // STEP 3: Reset filter & search agar booking baru pasti terlihat
    setSearchQuery('');
    
    // STEP 4: Auto-scroll ke section Database setelah render selesai
    setTimeout(() => {
      const dbSection = document.getElementById('database-section');
      if (dbSection) {
        dbSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Tambah bounce attention effect ke header
        const dbHeader = dbSection.querySelector('h3');
        if (dbHeader) {
          dbHeader.classList.add('bounce-attention');
          setTimeout(() => dbHeader.classList.remove('bounce-attention'), 1700);
        }
      }
    }, 300);
    
    // STEP 5: Clear highlight setelah 8 detik (sesuai durasi animation)
    setTimeout(() => {
      setNewlyImportedIds(new Set());
    }, 8000);
  };

  const handleActivateBRN = (orderIds: string[]) => {
    const now = new Date().toISOString();
    setSavedOrders(prev => prev.map(o => 
      orderIds.includes(o.id)
        ? {
            ...o,
            useBRN: true,
            reminderApproved: true,
            reminderApprovedAt: now,
            reminderApprovedBy: 'GHOFAR (BRN)',
            brnMakkah: o.brnMakkah || { active: false, qtyPax: '', ratePax: '' },
            brnMadinah: o.brnMadinah || { active: false, qtyPax: '', ratePax: '' },
          }
        : o
    ));
  };

  const handleDeleteSaved = (id: string) => {
    if (window.confirm('Hapus order ini dari database?')) {
      // 📝 AUDIT LOG: Delete booking
      const orderToDelete = savedOrders.find(o => o.id === id);
      if (orderToDelete) {
        logAuditEvent('delete', 'booking', {
          entityId: id,
          entityName: `${orderToDelete.customerName} - ${orderToDelete.hotelName}`,
          description: `DELETE booking: ${orderToDelete.customerName} di ${orderToDelete.hotelName}`,
          before: { customerName: orderToDelete.customerName, hotelName: orderToDelete.hotelName },
        }).catch(() => {});
      }
      
      setSavedOrders(prev => prev.filter(o => o.id !== id));
      if (data.id === id) {
        setData({ ...INITIAL_DATA, id: generateId() });
      }
    }
  };

  const vendorCalc = calcRow(data.vendor, data.checkIn, data.checkOut);
  const pemesanCalc = calcRow(data.pemesan, data.checkIn, data.checkOut);
  const netProfit = pemesanCalc.totalIDRActual - vendorCalc.totalIDRActual;
  
  // 🏨 BRN Calculation (auto reduce profit jika ada)
  const brnResult = calcBRN(data, pemesanCalc.estKursRataRata);

  return (
    <DashboardLayout>
    <div className="min-h-screen-auto bg-transparent print:bg-white text-black font-sans print:p-0 overflow-x-hidden">
      {/* 🎯 Responsive Container — auto-adjust max-width per breakpoint */}
      <div className="w-full max-w-none print:max-w-none overflow-x-hidden">
        
        {/* Device Debug Indicator (hidden by default) */}
        <div className="device-debug"></div>

        {/* 🎯 MODERN KPI CARDS — 7 metrics (Buy, Sell, Profit, Margin, Revenue, Outstanding, Paid) */}
        <div className="mb-4 no-print">
          <ModernKPICards
            data={{
              totalBuy: vendorCalc.totalIDRActual + brnResult.totalBRN_IDR,
              totalSell: pemesanCalc.totalIDRActual,
              netProfit: netProfit - brnResult.totalBRN_IDR,
              revenue: pemesanCalc.totalIDRActual,
              outstanding: pemesanCalc.sisaTagihanIDR,
              paid: pemesanCalc.totalIDRMasuk,
              marginPercent: pemesanCalc.totalIDRActual > 0 
                ? ((netProfit - brnResult.totalBRN_IDR) / pemesanCalc.totalIDRActual) * 100 
                : 0,
            }}
          />
        </div>

        {/* 🛡️ SECURITY & SYSTEM STATUS WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4 no-print">
          <SecurityWidget />
          <SystemStatusWidget />
        </div>
        
        {/* Top Header / Actions */}
        <div className="no-print flex flex-col gap-3 mb-4 bg-white p-2 sm:p-3 border border-slate-300 shadow-sm rounded">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="text-center md:text-left flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div>
                <div className="font-extrabold text-slate-800 text-base sm:text-lg">Hotel Booking Profitability</div>
                <div className="text-[10px] sm:text-xs text-slate-500">Travel Umrah & Wisata B2B Dashboard</div>
              </div>
              <InstallPWAButton />
              <ResponsiveDebugToggle />
            </div>
            {/* 📱 MOBILE HAMBURGER MENU (< md / 768px) */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-800 shadow rounded whitespace-nowrap"
                title="Simpan booking"
              >
                💾 Simpan
              </button>
              <MobileHamburgerMenu
                title="Menu Aksi"
                items={[
                  {
                    icon: '📄',
                    label: 'Orderan Baru',
                    description: 'Buat booking baru (reset form)',
                    color: 'bg-slate-50 hover:bg-slate-100',
                    onClick: handleNewOrder,
                  },
                  {
                    icon: '📤',
                    label: 'Upload File',
                    description: 'Import data dari .xls/.csv',
                    color: 'bg-purple-50 hover:bg-purple-100',
                    onClick: () => setUploadModalOpen(true),
                  },
                  {
                    icon: '🖨️',
                    label: 'Cetak Laporan Internal',
                    description: 'Print PDF dengan modal & profit',
                    color: 'bg-emerald-50 hover:bg-emerald-100',
                    onClick: () => handlePrint('internal'),
                  },
                  {
                    icon: '👤',
                    label: 'Cetak Statement Customer',
                    description: 'Print PDF aman untuk pemesan',
                    color: 'bg-teal-50 hover:bg-teal-100',
                    onClick: () => handlePrint('customer'),
                  },
                  {
                    icon: '⬇️',
                    label: 'Download Template Excel',
                    description: 'Template kosong untuk diisi',
                    color: 'bg-amber-50 hover:bg-amber-100',
                    onClick: () => downloadTemplateInput(),
                  },
                  {
                    icon: '📊',
                    label: 'Download Laporan Internal',
                    description: 'Excel lengkap dengan profit',
                    color: 'bg-amber-50 hover:bg-amber-100',
                    onClick: () => {
                      if (!data.customerName) { alert('⚠️ Isi nama customer dulu!'); return; }
                      downloadLaporanInternal(data);
                    },
                  },
                  {
                    icon: '👤',
                    label: 'Download Statement',
                    description: 'Excel aman untuk customer',
                    color: 'bg-amber-50 hover:bg-amber-100',
                    onClick: () => {
                      if (!data.customerName) { alert('⚠️ Isi nama customer dulu!'); return; }
                      downloadStatementCustomer(data);
                    },
                  },
                  {
                    icon: '📄',
                    label: 'Terbitkan CL',
                    description: 'Buat Confirmation Letter (legacy)',
                    color: 'bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100',
                    onClick: () => {
                      if (!data.customerName) { alert('⚠️ Isi nama customer dulu!'); return; }
                      setClModalOpen(true);
                    },
                  },
                  // ✨ PREMIUM DOCS (NEW)
                  {
                    icon: '✨',
                    label: '✨ Premium CL (Print)',
                    description: 'Premium Confirmation Letter A4',
                    color: 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200',
                    onClick: () => handleGeneratePremium('cl', 'print', 'A4'),
                  },
                  {
                    icon: '🧾',
                    label: '✨ Premium Invoice (Print)',
                    description: 'Premium Invoice corporate style',
                    color: 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200',
                    onClick: () => handleGeneratePremium('invoice', 'print', 'A4'),
                  },
                  {
                    icon: '🎟️',
                    label: '✨ Premium Voucher (Print)',
                    description: 'Booking Voucher untuk hotel',
                    color: 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200',
                    onClick: () => handleGeneratePremium('voucher', 'print', 'A4'),
                  },
                  {
                    icon: '📋',
                    label: '✨ Premium Statement (Print)',
                    description: 'Booking Statement premium',
                    color: 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200',
                    onClick: () => handleGeneratePremium('statement', 'print', 'A4'),
                  },
                ]}
              />
            </div>

            {/* 💻 TABLET+ TOOLBAR (≥ md / 768px) */}
            <div className="hidden md:flex flex-wrap gap-1.5 sm:gap-2 items-center justify-center md:justify-end">
              {/* Orderan Baru */}
              <button 
                onClick={handleNewOrder} 
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-400 rounded flex items-center gap-1 sm:gap-2 whitespace-nowrap"
              >
                📄 <span className="hidden sm:inline">Orderan</span> Baru
              </button>

              {/* TOMBOL SIMPAN (1 saja) */}
              <button 
                onClick={handleSave} 
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-800 shadow rounded flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                title="Simpan data — siap dicetak versi Internal & Customer"
              >
                💾 SIMPAN
              </button>

              {/* DROPDOWN CETAK */}
              <DropdownButton
                label="CETAK"
                icon="🖨️"
                buttonClassName="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold border border-emerald-800 shadow rounded whitespace-nowrap"
                options={[
                  {
                    icon: '📊',
                    label: 'Cetak Laporan Internal',
                    description: 'PDF lengkap dengan modal vendor & margin profit (Rahasia)',
                    onClick: () => handlePrint('internal'),
                  },
                  {
                    icon: '👤',
                    label: 'Cetak Statement Booking Customer',
                    description: 'PDF aman untuk pemesan (tanpa data internal perusahaan)',
                    onClick: () => handlePrint('customer'),
                  },
                ]}
              />

              {/* 📤 UPLOAD FILE BUTTON */}
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold border border-purple-800 shadow rounded whitespace-nowrap flex items-center gap-1 sm:gap-1.5 transition-colors"
                title="Upload file .xls / .xlsx / .csv untuk import booking otomatis"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                UPLOAD FILE
              </button>

              {/* DROPDOWN DOWNLOAD */}
              <DropdownButton
                label="DOWNLOAD"
                icon="⬇️"
                buttonClassName="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white font-bold border border-amber-800 shadow rounded whitespace-nowrap"
                options={[
                  {
                    icon: '📋',
                    label: 'Template Input Data (.xls)',
                    description: 'File kosong untuk diisi & diimport kembali ke aplikasi',
                    onClick: () => {
                      downloadTemplateInput();
                      setTimeout(() => alert('✅ Template berhasil diunduh!\n\nBuka file di Excel, isi data sesuai petunjuk.'), 200);
                    },
                  },
                  {
                    icon: '📊',
                    label: 'Download Laporan Internal (.xls)',
                    description: 'Excel lengkap dengan BUY, SELL, Modal & Profit',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      downloadLaporanInternal(data);
                      setTimeout(() => alert('✅ Laporan Internal berhasil diunduh!'), 200);
                    },
                  },
                  {
                    icon: '👤',
                    label: 'Download Statement Booking (.xls)',
                    description: 'Excel aman untuk diberikan ke customer',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      downloadStatementCustomer(data);
                      setTimeout(() => alert('✅ Statement Booking Customer berhasil diunduh!'), 200);
                    },
                  },
                  {
                    icon: '🌐',
                    label: 'Save Statement Resource (.html)',
                    description: 'File HTML offline — bisa dibuka di browser apapun & dishare',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      exportStatementHTML(data).catch(e => alert('❌ Export gagal: ' + e.message));
                      setTimeout(() => alert('✅ Statement berhasil disimpan sebagai HTML!\n\n📌 File ini bisa:\n• Dibuka di browser apapun\n• Dishare via WhatsApp/Email\n• Berisi QR untuk verifikasi online'), 200);
                    },
                  },
                  {
                    icon: '🌐',
                    label: 'Save Internal Resource (.html)',
                    description: 'HTML laporan internal — rahasia perusahaan',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      exportInternalHTML(data).catch(e => alert('❌ Export gagal: ' + e.message));
                      setTimeout(() => alert('✅ Laporan Internal disimpan sebagai HTML!\n\n🔒 INGAT: Berisi data rahasia + QR verification.'), 200);
                    },
                  },
                ]}
              />

              {/* 🎨 DROPDOWN PREMIUM DOCUMENTS (NEW) — Clean, Premium, Corporate Style */}
              <DropdownButton
                label="PREMIUM DOCS"
                icon="✨"
                buttonClassName="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] text-white font-bold border border-[#F97316] shadow rounded whitespace-nowrap"
                options={[
                  // CONFIRMATION LETTER
                  {
                    icon: '📄',
                    label: '✨ CL — Print (A4)',
                    description: 'Premium Confirmation Letter, A4 portrait',
                    onClick: () => handleGeneratePremium('cl', 'print', 'A4'),
                  },
                  {
                    icon: '📄',
                    label: '✨ CL — Download HTML (A4)',
                    description: 'Download Premium CL HTML standalone',
                    onClick: () => handleGeneratePremium('cl', 'download', 'A4'),
                  },
                  // INVOICE
                  {
                    icon: '🧾',
                    label: '✨ Invoice — Print (A4)',
                    description: 'Premium Invoice for customer billing',
                    onClick: () => handleGeneratePremium('invoice', 'print', 'A4'),
                  },
                  {
                    icon: '🧾',
                    label: '✨ Invoice — Download HTML',
                    description: 'Download Premium Invoice HTML',
                    onClick: () => handleGeneratePremium('invoice', 'download', 'A4'),
                  },
                  // VOUCHER
                  {
                    icon: '🎟️',
                    label: '✨ Voucher — Print (A4)',
                    description: 'Booking Voucher untuk check-in di hotel',
                    onClick: () => handleGeneratePremium('voucher', 'print', 'A4'),
                  },
                  {
                    icon: '🎟️',
                    label: '✨ Voucher — Download HTML',
                    description: 'Download Voucher untuk customer',
                    onClick: () => handleGeneratePremium('voucher', 'download', 'A4'),
                  },
                  // STATEMENT
                  {
                    icon: '📋',
                    label: '✨ Statement — Print (A4)',
                    description: 'Hotel Booking Statement Premium',
                    onClick: () => handleGeneratePremium('statement', 'print', 'A4'),
                  },
                  {
                    icon: '📋',
                    label: '✨ Statement — Download',
                    description: 'Download Statement HTML',
                    onClick: () => handleGeneratePremium('statement', 'download', 'A4'),
                  },
                ]}
              />

              {/* DROPDOWN TERBITKAN CL (Confirmation Letter) — Legacy */}
              <DropdownButton
                label="TERBITKAN CL"
                icon="📄"
                buttonClassName="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold border border-orange-700 shadow rounded whitespace-nowrap"
                options={[
                  {
                    icon: '👁️',
                    label: 'Preview & Kirim CL',
                    description: 'Buka preview CL profesional + opsi kirim WA/Email',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu sebelum menerbitkan CL!');
                        return;
                      }
                      setClModalOpen(true);
                    },
                  },
                  {
                    icon: '📕',
                    label: 'CL .pdf (Download File)',
                    description: 'File PDF asli — identik dengan preview',
                    onClick: async () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      // Auto-open preview modal dulu agar element ter-render
                      setClModalOpen(true);
                      // Wait React rendering + tab switch ke preview (lebih lama untuk pastikan ready)
                      await new Promise(r => setTimeout(r, 1000));
                      try {
                        await downloadCLPdf(data);
                        setTimeout(() => alert('✅ CL PDF berhasil diunduh!\n\n📄 File 100% identik dengan tampilan preview.\n📱 Bisa dibuka di Windows, Mac, Android, iOS.'), 200);
                      } catch (err: any) {
                        console.error('PDF Error:', err);
                        alert(`❌ Gagal membuat PDF.\n\nDetail: ${err.message || 'Unknown error'}\n\n💡 Solusi:\n• Tunggu modal preview terbuka sepenuhnya\n• Klik tombol DOWNLOAD PDF langsung di jendela preview\n• Atau gunakan tombol PRINT sebagai alternatif`);
                      }
                    },
                  },
                  {
                    icon: '📘',
                    label: 'CL .docx (MS Word)',
                    description: 'Format MS Word — identik dengan preview, editable',
                    onClick: async () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      // Auto-open preview modal dulu agar element ter-render
                      setClModalOpen(true);
                      await new Promise(r => setTimeout(r, 600));
                      downloadCLDocx(data);
                      setTimeout(() => alert('✅ CL berhasil diunduh sebagai Microsoft Word!\n\n📄 Tampilan identik dengan preview.\n📱 Kompatibel di Word, Google Docs, LibreOffice.'), 200);
                    },
                  },
                  {
                    icon: '🌐',
                    label: 'CL .html (Save Resource)',
                    description: 'Simpan CL sebagai HTML offline — bisa dishare langsung',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      exportCLHTML(data).catch(e => alert('❌ Export gagal: ' + e.message));
                      setTimeout(() => alert('✅ Confirmation Letter disimpan sebagai HTML!\n\n📌 Termasuk QR Verification stamp.\n• Bisa dibuka di HP/Laptop\n• Bisa dishare via WhatsApp/Email\n• Customer bisa scan QR untuk verifikasi'), 200);
                    },
                  },
                  {
                    icon: '💬',
                    label: 'Kirim via WhatsApp',
                    description: 'Buka WhatsApp dengan pesan CL otomatis',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      if (!data.customerPhone) {
                        alert('⚠️ No. WhatsApp customer kosong!\n\nKlik "Preview & Kirim CL" untuk mengisi nomor WhatsApp terlebih dahulu.');
                        setClModalOpen(true);
                        return;
                      }
                      sendCLWhatsApp(data);
                    },
                  },
                  {
                    icon: '✉️',
                    label: 'Kirim via Email',
                    description: 'Buka email client dengan template CL',
                    onClick: () => {
                      if (!data.customerName) {
                        alert('⚠️ Isi nama customer terlebih dahulu!');
                        return;
                      }
                      if (!data.customerEmail) {
                        alert('⚠️ Email customer kosong!\n\nKlik "Preview & Kirim CL" untuk mengisi email customer terlebih dahulu.');
                        setClModalOpen(true);
                        return;
                      }
                      sendCLEmail(data);
                    },
                  },
                ]}
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 uppercase">Preview Tampilan:</span>
              <div className="inline-flex rounded-md shadow-sm border border-slate-400 overflow-hidden">
                <button 
                  onClick={() => setViewMode('internal')}
                  className={`px-4 py-1.5 text-xs font-bold transition-colors ${viewMode === 'internal' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  📊 Internal (Lengkap)
                </button>
                <button 
                  onClick={() => setViewMode('customer')}
                  className={`px-4 py-1.5 text-xs font-bold transition-colors border-l border-slate-400 ${viewMode === 'customer' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  👤 Customer (Khusus Pemesan)
                </button>
              </div>
              {viewMode === 'customer' && (
                <span className="text-[11px] text-teal-700 italic bg-teal-50 px-2 py-1 rounded border border-teal-200">
                  🔒 Data Vendor, Modal & Margin tersembunyi
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 italic">
              💡 Tip: Klik <b>SIMPAN</b> sekali, lalu pilih versi cetak/download yang dibutuhkan
            </div>
          </div>
        </div>

        {/* Banner Mode Indicator */}
        {viewMode === 'customer' && (
          <div className="no-print bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 mb-2 rounded shadow text-sm font-bold flex items-center gap-2">
            <span>👤 MODE CUSTOMER AKTIF</span>
            <span className="text-xs font-normal opacity-90">— Tampilan ini aman dibagikan ke pemesan (data internal tidak tampil)</span>
          </div>
        )}

        {/* Current Edit View — disembunyikan saat print database */}
        <div className={`bg-white print:border-none border border-slate-300 overflow-hidden shadow-xl print:shadow-none mb-8 print:m-0 print:p-2 ${databasePrint.active ? 'print:hidden' : ''}`}>
          
          {/* Screen-only Header (Preview Kop Laporan di layar) */}
          <ScreenHeader data={data} />
          
          {/* Print-only Header (Kop Laporan Profesional) */}
          <PrintHeader 
            data={data} 
            viewMode={viewMode} 
            vendorCalc={vendorCalc}
            pemesanCalc={pemesanCalc}
          />

          <KPICards
            totalVendorIDR={vendorCalc.totalIDRActual}
            totalPemesanIDR={pemesanCalc.totalIDRActual}
            netProfit={netProfit}
            viewMode={viewMode}
            totalIDRMasuk={pemesanCalc.totalIDRMasuk}
            sisaTagihanIDR={pemesanCalc.sisaTagihanIDR}
            brnTotalIDR={brnResult.totalBRN_IDR}
            brnTotalSAR={brnResult.totalBRN_SAR}
          />
          <SpreadsheetView
            data={data}
            vendorCalc={vendorCalc}
            pemesanCalc={pemesanCalc}
            onChangeMeta={handleMetaChange}
            onChangeVendor={handleVendorChange}
            onChangePemesan={handlePemesanChange}
            viewMode={viewMode}
          />
          
          {/* 🏨 BRN SECTION — muncul jika useBRN aktif */}
          {data.useBRN && viewMode === 'internal' && (
            <div className="px-2 sm:px-4">
              <BRNSection 
                data={data}
                onChangeMeta={handleMetaChange}
              />
            </div>
          )}

          {/* Print-only Footer (Tanda Tangan & Catatan) */}
          <PrintFooter data={data} viewMode={viewMode} />
        </div>

        {/* DATABASE PRINT VIEW — Hanya muncul saat print database aktif */}
        {databasePrint.active && (
          <DatabasePrintView 
            orders={databasePrint.orders}
            filterInfo={databasePrint.filterInfo}
            viewMode={databasePrint.mode}
          />
        )}

        {/* Saved Orders List */}
        <div id="database-section">
          <SavedOrdersTable 
            orders={savedOrders}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEdit={handleEditSaved}
            onDelete={handleDeleteSaved}
            onPrintDatabase={handlePrintDatabase}
            onApproveReminders={handleApproveReminders}
            onActivateBRN={handleActivateBRN}
            newlyImportedIds={newlyImportedIds}
          />
        </div>

      </div>

      {/* CL Modal — Confirmation Letter Preview & Send */}
      <CLModal 
        isOpen={clModalOpen}
        onClose={() => setClModalOpen(false)}
        data={data}
        onUpdateData={handleMetaChange}
      />

      {/* 📤 Upload File Modal — Import .xls/.csv */}
      <UploadFileModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onImport={handleImportBookings}
        currentOrderCount={savedOrders.length}
        maxStorage={MAX_STORAGE}
      />
    </div>
    </DashboardLayout>
  );
};

export default App;
