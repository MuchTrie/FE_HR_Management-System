# Konteks Frontend untuk Pengembangan Lanjutan

Frontend SecureHR adalah React 19 + TypeScript + Vite. Routing berada di `src/app/router.tsx`, state autentikasi di `src/contexts/AuthContext.tsx`, API feature functions di `src/lib/api.ts`, penyimpanan token di `src/lib/auth.ts`, dan Axios client di `src/lib/axios.ts`.

## Kontrak Backend

- Base URL berasal dari `VITE_API_URL` di `.env`; jangan hardcode URL API di komponen.
- `VITE_AUTH_REFRESH_ENABLED` mengaktifkan refresh token otomatis saat access token kedaluwarsa.
- `VITE_AUTH_STORAGE_PREFIX` mengatur prefix key localStorage untuk token/user.
- Response sukses berbentuk `{ "success": true, "data": ... }`.
- Response error berbentuk `{ "success": false, "error": { "code": "...", "message": "..." } }`.
- Login mengembalikan access token, refresh token, dan user. Token disimpan melalui `src/lib/auth.ts`.
- Role yang valid: `ADMIN`, `MANAGER`, `EMPLOYEE`.

## Aturan Integrasi

- Jangan menaruh password atau secret di source code frontend.
- Semua request backend dibuat di `src/lib/api.ts` menggunakan `apiClient`; komponen memanggilnya melalui TanStack Query.
- Query/mutation server state menggunakan TanStack Query; state UI lokal tetap di komponen atau context.
- Perubahan bentuk response harus memperbarui `src/types/index.ts` dan halaman pemakaiannya.
- Backend membatasi scope manager berdasarkan `employee.manager_id`.

## Menjalankan dan Memeriksa

```text
npm run dev
npm run build
npm run lint
```

Mock API sudah dihapus. Jika menambah endpoint backend, tambahkan wrapper typed di `src/lib/api.ts`.
