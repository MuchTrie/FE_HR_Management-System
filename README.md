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

## Menjalankan dengan Docker

Dockerfile frontend berada di `frontend/Dockerfile`. Image frontend melakukan
build React/Vite lalu menyajikan hasil `dist` menggunakan Nginx.

Dari root project, jalankan seluruh stack:

```powershell
docker compose up -d --build
```

Frontend tersedia di:

```text
http://localhost:5173
```

### Setelah mengubah fitur frontend

Perubahan source code frontend harus masuk ke image baru karena file aplikasi
disalin dan dibuild ketika image dibuat. Jalankan:

```powershell
docker compose up -d --build frontend
```

Jika frontend dan backend sama-sama berubah:

```powershell
docker compose up -d --build
```

`docker compose restart frontend` hanya me-restart container dengan image
lama, sehingga tidak cukup untuk memasukkan perubahan source code.

### Perintah Docker yang berguna

```powershell
docker compose ps
docker compose logs -f frontend
docker compose down
```

`docker compose down` tidak menghapus volume database. Hindari
`docker compose down -v` jika data MySQL development masih dibutuhkan.
