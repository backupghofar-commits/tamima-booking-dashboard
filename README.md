# 🏨 TAMIMA Hotel Booking Profitability Dashboard

> **Full-Stack PWA Web Application** untuk PT. TAMIMA JAYA WISATA  
> Statement Booking Agent & Confirmation Letter System untuk Travel Umrah & Wisata B2B

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success)]() 
[![Offline Support](https://img.shields.io/badge/Offline-Support-blue)]()
[![React 19](https://img.shields.io/badge/React-19-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)]()
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38B2AC)]()
[![Vite](https://img.shields.io/badge/Vite-7-646CFF)]()

---

## 📋 Fitur Utama

### 💼 Core Business Logic
- ✅ **Multi-Payment System** — 5 termin pembayaran dengan kurs dinamis (SAR ↔ IDR)
- ✅ **Multi-Currency** — Kalkulasi otomatis SAR ke IDR dengan estimasi kurs rata-rata
- ✅ **Real-time Calculations** — Total Bill, Sisa Tagihan, Net Profit, Margin %
- ✅ **Auto Status** — LUNAS / BELUM LUNAS / DRAFT berdasarkan kalkulasi
- ✅ **Profit Tracking** — Selisih harga BUY vs SELL (Modal vs Tagihan)

### 📄 Document Generation
- ✅ **Confirmation Letter (CL)** — Profesional OTA-style dengan stempel & TTD
- ✅ **PDF Download** — Real PDF file (jsPDF + html-to-image) Letter size 1 page
- ✅ **DOCX Download** — Microsoft Word compatible (.doc format universal)
- ✅ **HTML Standalone** — Self-contained HTML offline-ready
- ✅ **Excel Export** — `.xls` Template, Internal Report, Statement Customer
- ✅ **Print** — Letter portrait, 3mm margin, auto-fit 1 page

### 📤 Distribution Options
- ✅ **WhatsApp Auto-Message** — Pre-filled message via `wa.me/`
- ✅ **Email Template** — Pre-filled subject & body via `mailto:`
- ✅ **Print Browser** — Popup window dengan stylesheet otomatis

### 🗄️ Database Management
- ✅ **LocalStorage** — Up to 150 booking records
- ✅ **Search & Filter** — by Customer, Hotel, Vendor, PIC, Sales, Status
- ✅ **Sort** — Date, Customer, Hotel, Total Tagihan
- ✅ **Bulk Operations** — Export semua/filtered data

### 🎨 UI/UX
- ✅ **Fully Responsive** — Mobile, Tablet, Desktop
- ✅ **Dual View Mode** — Internal (lengkap) vs Customer (aman)
- ✅ **Dropdown Actions** — CETAK, DOWNLOAD, TERBITKAN CL
- ✅ **Stamp & Signature** — Stempel TAMIMA + GHOFAR signature

### 📱 PWA (Progressive Web App)
- ✅ **Install ke Windows** — Bisa diakses seperti aplikasi native
- ✅ **Offline Support** — Service Worker cache-first strategy
- ✅ **Cross-Platform** — Windows, Mac, Linux, Android, iOS
- ✅ **App Shortcuts** — Quick action dari taskbar/start menu

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18.x ([download](https://nodejs.org))
- **npm** ≥ 9.x (sudah include dengan Node.js)

### 1. Clone Repository

```bash
git clone https://github.com/USERNAME/tamima-booking-dashboard.git
cd tamima-booking-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Aplikasi akan jalan di **http://localhost:5173**

### 4. Build Production

```bash
npm run build
```

Hasil build di folder `dist/index.html` — single file standalone yang bisa langsung dibuka di browser.

### 5. Preview Production Build

```bash
npm run preview
```

---

## 💻 Install ke Windows / Mac / Mobile (PWA)

### 🪟 Windows (Chrome / Edge / Brave)

1. Buka aplikasi di browser: `https://your-deployed-url.com`
2. Klik tombol **"⊕ Install App"** di header aplikasi  
   **ATAU** klik ikon Install (⊕) di address bar  
   **ATAU** Menu (⋮) → **"Install TAMIMA Booking..."**
3. Klik **"Install"**
4. ✅ Aplikasi terpasang di:
   - **Start Menu** → "TAMIMA CL"
   - **Desktop shortcut** (otomatis)
   - **Taskbar** (saat dijalankan)

### 🍎 macOS (Chrome / Edge / Safari)

1. **Chrome/Edge**: Menu → "Install TAMIMA..."
2. **Safari**: Share → "Add to Dock"
3. ✅ Aplikasi muncul di Launchpad & Dock

### 📱 Android (Chrome)

1. Buka aplikasi di Chrome mobile
2. Menu (⋮) → **"Install app"** atau **"Add to Home Screen"**
3. ✅ Icon TAMIMA muncul di Home Screen

### 📱 iOS (Safari)

1. Buka aplikasi di Safari mobile
2. Tap tombol **Share** (⬆️)
3. Pilih **"Add to Home Screen"**
4. ✅ Icon TAMIMA muncul di Home Screen

---

## 🌐 Online & Offline Mode

### Online
- Akses dari URL deploy (Vercel, Netlify, GitHub Pages, dll)
- Auto-update saat ada versi baru
- Bisa dishare via link

### Offline
- Setelah pertama kali load, aplikasi **otomatis cached**
- Bisa diakses tanpa internet (semua fitur tetap berjalan)
- Data tersimpan di LocalStorage browser

---

## 📦 Deploy ke Hosting

### Option 1: GitHub Pages

```bash
# 1. Build
npm run build

# 2. Push dist ke branch gh-pages
git subtree push --prefix dist origin gh-pages

# 3. Settings → Pages → Source: gh-pages branch
```

### Option 2: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Production
vercel --prod
```

### Option 3: Netlify

```bash
# 1. Build
npm run build

# 2. Drag & drop folder `dist` ke netlify.com
# Atau pakai CLI:
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 4: Standalone File

Karena pakai `vite-plugin-singlefile`, hasil build adalah **1 file HTML saja**:
- File: `dist/index.html`
- Bisa dibuka langsung tanpa server
- Bisa di-share via WhatsApp/Email
- Bisa upload ke shared hosting biasa

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript 5.9 |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS v4 |
| **PDF Generation** | jsPDF 4 + html-to-image |
| **Excel Export** | Custom HTML-to-XLS converter |
| **PWA** | Service Worker (manual) + Web Manifest |
| **State Management** | React Hooks + LocalStorage |
| **Bundler** | vite-plugin-singlefile (1 file output) |

---

## 📂 Project Structure

```
tamima-booking-dashboard/
├── public/                          # Static assets
│   ├── manifest.json                # PWA Web Manifest
│   ├── sw.js                        # Service Worker
│   ├── pwa-icon-512.png             # App icon
│   └── stamp-tamima.png             # Logo stempel
├── src/
│   ├── components/
│   │   ├── App.tsx                  # Root component
│   │   ├── SpreadsheetView.tsx      # Main data input form
│   │   ├── KPICards.tsx             # Dashboard summary
│   │   ├── ScreenHeader.tsx         # Company header
│   │   ├── MetadataSection.tsx      # Booking metadata
│   │   ├── PaymentTermsSection.tsx  # Payment terms input
│   │   ├── CorridorCalculation.tsx  # Auto calculations
│   │   ├── ProfitSummary.tsx        # Profit display
│   │   ├── ConfirmationLetter.tsx   # CL OTA-style template
│   │   ├── CLModal.tsx              # CL preview & action modal
│   │   ├── SavedOrdersTable.tsx     # Database management
│   │   ├── DatabasePrintView.tsx    # Multi-booking print view
│   │   ├── PrintHeader.tsx          # Print mode header
│   │   ├── PrintFooter.tsx          # Print mode footer
│   │   ├── DropdownButton.tsx       # Reusable dropdown
│   │   ├── InstallPWAButton.tsx     # PWA install prompt
│   │   └── QuickCalcModal.tsx       # Quick calculator
│   ├── utils/
│   │   ├── calc.ts                  # Business calculations
│   │   ├── exportCL.ts              # PDF, DOCX, WA, Email exports
│   │   ├── exportExcel.ts           # XLS exports (single & multi)
│   │   └── exportHTML.ts            # HTML standalone exports
│   ├── types/                       # TypeScript types
│   ├── types.ts                     # Main types
│   ├── App.tsx                      # Root app
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── index.html                       # Entry HTML (with PWA meta)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎯 Use Cases

### 1. Mencatat Booking Hotel Umrah
- Input data customer, vendor, hotel
- Input rate kamar BUY (modal) & SELL (jual)
- Otomatis hitung profit dalam SAR & IDR

### 2. Tracking Pembayaran Multi-Termin
- Input 5 termin pembayaran dengan kurs masing-masing
- Auto-calc total dibayar, sisa tagihan, est kurs rata-rata

### 3. Generate Dokumen Customer
- **Confirmation Letter** profesional OTA-style → PDF/DOCX/HTML
- **Statement Booking** tanpa data internal → Excel/HTML
- **Share via WhatsApp/Email** dengan template otomatis

### 4. Laporan Internal Perusahaan
- Laporan lengkap dengan modal vendor & profit margin
- Database multi-booking dengan filter status
- Export rekap bulanan dalam Excel

### 5. Akses Offline di Lapangan
- Install sebagai PWA di laptop/HP
- Buka tanpa internet
- Data tersimpan lokal

---

## 🔒 Privacy & Security

- ✅ **No Backend** — Semua data di-store di LocalStorage browser
- ✅ **No Tracking** — Tidak ada analytics atau third-party scripts
- ✅ **No Cloud** — Data tidak di-upload ke server
- ✅ **Offline-First** — Service Worker caches everything
- ✅ **Print Safe** — Mode Customer otomatis hide data internal (vendor, PIC, modal, profit)

---

## 🏢 Company Information

**PT. TAMIMA JAYA WISATA**  
*Beyond LA & Handling Service · Hajj & Umrah Specialist*

📍 **Alamat:**  
JogloSemar Building, Jl. Magelang No. KM.7 LOT A3,  
Mlati Beningan, Sendangadi, Kec. Mlati,  
Kab. Sleman, D.I. Yogyakarta 55285

📞 **WhatsApp:**  
- 0813-8383-8115
- 0852-2009-9694

💳 **Bank Transfer:**  
Bank Mandiri · a/n PT. TAMIMA JAYA WISATA  
No. Rek: **1370088001686**

---

## 📄 License

Proprietary — Untuk penggunaan internal PT. TAMIMA JAYA WISATA.

---

## 🤝 Support

Untuk bug report, feature request, atau pertanyaan:
- Hubungi developer via WhatsApp di nomor di atas
- Atau buat **Issue** di repository GitHub ini

---

## 🎉 Acknowledgments

- **React Team** — React 19
- **Vite Team** — Lightning-fast build tool
- **Tailwind Labs** — Tailwind CSS v4
- **jsPDF & html-to-image** — PDF generation
- **PT. TAMIMA JAYA WISATA** — Business requirements

---

**Made with ❤️ for Indonesian Hajj & Umrah Industry**
