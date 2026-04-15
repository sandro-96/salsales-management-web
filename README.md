# salsales-management-web

## Chạy local

### Yêu cầu
- Node.js (khuyến nghị bản LTS)

### Cấu hình môi trường
File `.env` mặc định:
- `VITE_API_BASE_URL=http://localhost:8080/api`
- `VITE_WS_URL=http://localhost:8080/ws`

### Cài đặt & chạy

```bash
npm install
npm run dev
```

Mặc định Vite chạy ở `http://localhost:5173`.

## Build production

```bash
npm run build
```

Lưu ý: `.env.prod` cần có `VITE_API_BASE_URL` (repo đã bổ sung mẫu `https://api.example.com/api`).