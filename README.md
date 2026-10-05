# SecureHR Frontend

Frontend SecureHR dibuat menggunakan React, TypeScript, dan Vite.

## Prasyarat

- Node.js dan npm
- Backend SecureHR berjalan di `http://localhost:8080`

## Instalasi

Dari folder `frontend`, jalankan:

```powershell
npm install
Copy-Item .env.example .env
```

Pastikan isi `.env` mengarah ke API backend:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_AUTH_REFRESH_ENABLED=true
VITE_AUTH_STORAGE_PREFIX=securehr
```

Gunakan URL frontend yang diizinkan backend, yaitu `http://localhost:5173` atau `http://127.0.0.1:5173`.

## Menjalankan

```powershell
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya:

```text
http://localhost:5173
```

## Build production

```powershell
npm run build
```
