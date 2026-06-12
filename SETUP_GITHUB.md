# 📘 Panduan Setup GitHub Repository

Panduan langkah-demi-langkah untuk publish aplikasi TAMIMA Booking Dashboard ke GitHub & deploy ke GitHub Pages.

---

## 🎯 Tujuan

Setelah ikuti panduan ini:
- ✅ Code tersimpan di GitHub repository
- ✅ Aplikasi otomatis ter-deploy ke `https://USERNAME.github.io/REPO-NAME/`
- ✅ Setiap push ke `main` → auto-rebuild & deploy
- ✅ Customer bisa install sebagai PWA dari URL tersebut

---

## 📝 Prerequisites

1. **Akun GitHub** — Daftar di [github.com](https://github.com)
2. **Git** terinstall di komputer — Download [git-scm.com](https://git-scm.com)
3. **Node.js 18+** terinstall — Download [nodejs.org](https://nodejs.org)

---

## 🚀 Langkah-Langkah

### 1️⃣ Buat Repository Baru di GitHub

1. Login ke GitHub
2. Klik **"+"** (kanan atas) → **"New repository"**
3. Isi form:
   - **Repository name**: `tamima-booking-dashboard`
   - **Description**: `TAMIMA Hotel Booking Profitability Dashboard PWA`
   - **Visibility**: 
     - 🔒 **Private** (rekomendasi untuk internal company)
     - 🌍 **Public** (jika ingin opensource)
   - ❌ JANGAN centang "Add README/license/.gitignore" (sudah ada di project)
4. Klik **"Create repository"**

### 2️⃣ Setup Local Repository

Buka **Terminal/CMD** di folder project, jalankan:

```bash
# Inisialisasi git (jika belum)
git init

# Set git username & email (sekali saja)
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Add semua files
git add .

# Commit pertama
git commit -m "🎉 Initial commit: TAMIMA Booking Dashboard PWA"

# Set default branch ke main
git branch -M main

# Connect ke remote repository (GANTI USERNAME!)
git remote add origin https://github.com/USERNAME/tamima-booking-dashboard.git

# Push ke GitHub
git push -u origin main
```

**📌 Catatan**: Ganti `USERNAME` dengan username GitHub Anda.

### 3️⃣ Enable GitHub Pages

1. Di repository GitHub, klik **"Settings"** (tab paling kanan)
2. Sidebar kiri → **"Pages"**
3. Pada **"Build and deployment"**:
   - **Source**: pilih **"GitHub Actions"**
4. Workflow `.github/workflows/deploy.yml` akan auto-detect

### 4️⃣ Tunggu Auto-Deploy

1. Klik tab **"Actions"** di repository
2. Lihat workflow **"🚀 Build & Deploy to GitHub Pages"** sedang berjalan
3. Tunggu ~2-3 menit sampai selesai (✅ hijau)
4. URL deploy akan muncul:
   ```
   https://USERNAME.github.io/tamima-booking-dashboard/
   ```

### 5️⃣ Test Aplikasi

1. Buka URL tersebut di browser
2. ✅ Aplikasi harus tampil normal
3. Test tombol **"Install App"** untuk install sebagai PWA

---

## 🔄 Update Aplikasi (Setelah Ada Perubahan Code)

```bash
# 1. Add perubahan
git add .

# 2. Commit dengan message yang jelas
git commit -m "✨ Add: Feature baru xyz"

# 3. Push ke GitHub
git push

# 4. GitHub Actions otomatis re-build & deploy (~2-3 menit)
```

User yang sudah install PWA akan dapat **notifikasi auto-update** saat buka aplikasi.

---

## 🌐 Alternative: Deploy ke Custom Domain

### 1. Beli Domain (opsional)
Contoh: `booking.tamimajaya.co.id`

### 2. Setup di GitHub
1. Settings → Pages → **Custom domain**
2. Isi: `booking.tamimajaya.co.id`
3. Centang **"Enforce HTTPS"**

### 3. Update DNS di Domain Provider
Tambahkan CNAME record:
```
CNAME   booking   USERNAME.github.io
```

Atau A record:
```
A   @   185.199.108.153
A   @   185.199.109.153
A   @   185.199.110.153
A   @   185.199.111.153
```

### 4. Tunggu DNS propagate (~5-30 menit)

---

## 🆘 Troubleshooting

### Error: "Permission denied (publickey)"
Setup SSH key atau gunakan HTTPS dengan Personal Access Token:
```bash
# Generate PAT di GitHub: Settings → Developer settings → Personal access tokens
# Lalu push dengan:
git push https://USERNAME:TOKEN@github.com/USERNAME/REPO.git main
```

### Error: "404 Not Found" di GitHub Pages
1. Pastikan file `index.html` ada di root `dist/`
2. Cek workflow Actions sudah selesai (✅ hijau)
3. Wait 5 menit untuk DNS propagation
4. Hard refresh browser (Ctrl+Shift+R)

### Error: "Service Worker tidak load"
- Pastikan situs diakses via **HTTPS** (bukan HTTP)
- GitHub Pages otomatis HTTPS, tidak masalah
- Cek browser console (F12) untuk error detail

### Workflow gagal: "npm ci" error
- Pastikan `package-lock.json` ter-commit ke git
- Cek `node-version` di workflow sesuai (default v20)

---

## 📦 Alternative Deployment Platforms

Jika tidak mau pakai GitHub Pages, bisa deploy ke:

| Platform | URL | Note |
|----------|-----|------|
| **Vercel** | [vercel.com](https://vercel.com) | Otomatis CI/CD dari GitHub, gratis |
| **Netlify** | [netlify.com](https://netlify.com) | Drag & drop folder dist/ |
| **Cloudflare Pages** | [pages.cloudflare.com](https://pages.cloudflare.com) | Free, fast global CDN |
| **Firebase Hosting** | [firebase.google.com](https://firebase.google.com) | Google's hosting |

Semua platform di atas support PWA out-of-the-box.

---

## 📊 Monitor Penggunaan

GitHub Pages bandwidth limit:
- **100 GB/bulan** (gratis)
- Cukup untuk ~10.000 visitor/bulan untuk app size ~350KB

Untuk monitoring lebih lanjut, integrate dengan:
- **Google Analytics** (free)
- **Plausible Analytics** (privacy-friendly, paid)
- **Cloudflare Web Analytics** (free, privacy-friendly)

---

## ✅ Checklist Setup

- [ ] Akun GitHub sudah ada
- [ ] Git terinstall di komputer
- [ ] Repository GitHub baru sudah dibuat
- [ ] `git remote` sudah connect ke repo
- [ ] Code sudah ter-push ke `main` branch
- [ ] GitHub Pages sudah enabled
- [ ] Workflow Actions sudah jalan sukses
- [ ] URL `https://USERNAME.github.io/REPO/` bisa diakses
- [ ] Aplikasi bisa di-install sebagai PWA
- [ ] Offline mode bekerja
- [ ] (Optional) Custom domain sudah setup

---

## 🎉 Selesai!

Aplikasi TAMIMA Booking Dashboard kini live di internet dan bisa di-install sebagai PWA di Windows, Mac, Android, atau iOS!

**Share URL ke tim sales/admin** untuk mulai pakai aplikasinya.

---

**PT. TAMIMA JAYA WISATA** — Beyond LA & Handling Service  
📞 WA: 0813-8383-8115 / 0852-2009-9694
