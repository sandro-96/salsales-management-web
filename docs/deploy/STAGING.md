# Staging ~$0 (Vercel + MongoDB Atlas M0 + Railway)

Hướng dẫn triển khai **môi trường thử nghiệm** chi phí gần bằng 0. **Production** sau này trên AWS — không dùng stack này cho prod.

| Thành phần | Dịch vụ | Chi phí thường gặp |
|------------|---------|-------------------|
| Web (Vite/React) | [Vercel](https://vercel.com) Hobby | $0 |
| API (Spring Boot) | [Railway](https://railway.app) hoặc [Render](https://render.com) free | $0 (giới hạn giờ/tháng) |
| MongoDB | [Atlas M0](https://www.mongodb.com/cloud/atlas) | $0 |
| Upload ảnh (tuỳ chọn) | AWS S3 bucket staging riêng | vài cent nếu có traffic |

---

## 1. MongoDB Atlas — project **salesdb-test**

Staging dùng Atlas project **`salesdb-test`** (không dùng `salesdb` prod hay `salesdb-dev` local).

| Atlas project | Môi trường | `MONGODB_DATABASE` mặc định |
|---------------|------------|------------------------------|
| `salesdb-dev` | Dev local | `salesdb-dev` |
| **`salesdb-test`** | **Staging** (Railway + Vercel) | **`salesdb-test`** |
| `salesdb` | Production (sau) | `salesdb` |

1. Mở project **salesdb-test** → cluster M0 (Singapore) → **Resume** nếu cluster bị pause do idle.
2. **Database Access** → user/password (có thể dùng chung user với dev, quyền chỉ project test).
3. **Network Access** → tạm **Allow from anywhere** `0.0.0.0/0` (chỉ staging; prod whitelist IP sau).
4. **Connect** → Drivers → copy connection string → Railway `MONGODB_URI`.
5. Railway: `MONGODB_DATABASE=salesdb-test` (trùng `application-staging.properties` và `application-test.properties`).

---

## 2. Backend trên Railway

### Repo & build

- Root directory: `salsales-management-backend`
- File cấu hình: `railway.toml` (build Maven, chạy JAR profile `staging`)
- Hoặc Render: Web Service, Java, build `./mvnw -DskipTests package`, start `java -jar target/sales-0.0.1-SNAPSHOT.jar --spring.profiles.active=staging`

### Biến môi trường

Sao chép từ `env.staging.example` vào Railway → Variables. Bắt buộc:

- `SPRING_PROFILES_ACTIVE=staging`
- `MONGODB_URI`, `MONGODB_DATABASE`
- `APP_JWT_SECRET` (chuỗi ngẫu nhiên ≥ 32 ký tự, **khác** prod)
- `FRONTEND_URL` = URL Vercel (vd. `https://salsales.vercel.app`)
- `FRONTEND_CORS_ORIGINS` = `https://salsales.vercel.app,https://*.vercel.app`
- `FRONTEND_VERIFY_URL` = `https://salsales.vercel.app/verify`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `WEBHOOK_SECRET`

Railway tự gán `PORT` — backend đã đọc `server.port=${PORT:8080}`.

### Kiểm tra API

- Swagger: `https://<railway-host>/swagger-ui/index.html`
- Đăng ký / đăng nhập từ web staging.

### CORS / WebSocket

Profile `staging` + `FRONTEND_CORS_ORIGINS` cho phép Vercel và preview `*.vercel.app`. Web dùng SockJS:

```env
VITE_WS_URL=https://<railway-host>/ws
```

(không dùng `wss://` — SockJS tự nâng cấp qua HTTPS.)

---

## 3. Frontend trên Vercel

### Import project

- Root: `salsales-management-web`
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- `vercel.json` đã cấu hình SPA rewrite.

### Environment variables

Sao chép `.env.staging.example` → Vercel (Production; nên bật cả **Preview** nếu test nhánh):

| Biến | Ví dụ |
|------|--------|
| `VITE_API_BASE_URL` | `https://xxx.up.railway.app/api` |
| `VITE_WS_URL` | `https://xxx.up.railway.app/ws` |
| `VITE_APP_GOOGLE_CLIENT_ID` | cùng client Google |
| `VITE_GOOGLE_OAUTH_REDIRECT_URI` | `https://your-app.vercel.app/login` |
| `VITE_SITE_URL` | `https://your-app.vercel.app` |
| `VITE_OG_IMAGE_PATH` | `/og-landing.png` |

Deploy xong → cập nhật lại `FRONTEND_URL` / `FRONTEND_CORS_ORIGINS` trên Railway nếu URL Vercel khác dự kiến.

---

## 4. Google Cloud Console (OAuth)

Trong OAuth client (Web):

**Authorized JavaScript origins**

- `https://your-app.vercel.app`
- `http://localhost:5173` (dev)

**Authorized redirect URIs** (nếu dùng redirect flow)

- `https://your-app.vercel.app/login`
- `http://localhost:5173/login`

Backend chỉ cần `GOOGLE_CLIENT_ID` khớp với `VITE_APP_GOOGLE_CLIENT_ID`.

---

## 5. Checklist sau deploy

- [ ] Đăng ký, đăng nhập email + Google
- [ ] Email verify (nếu bật `MAIL_*`)
- [ ] POS / đơn hàng / WebSocket realtime
- [ ] `/billing` — chuyển khoản MANUAL (không cần VNPay sandbox trên staging)
- [ ] Upload ảnh sản phẩm (nếu cấu hình S3 staging)
- [ ] `/terms`, `/privacy` mở được
- [ ] Landing + OG: share link có `VITE_SITE_URL`

---

## 6. Giới hạn staging (chấp nhận được)

- Railway/Render free: sleep sau idle, cold start ~30s.
- Atlas M0: 512MB, không backup tự động như cluster trả phí.
- Không dùng cho dữ liệu khách hàng thật quy mô lớn.
- **Không** commit `.env` thật; chỉ `*.example`.

---

## 7. Lên production (AWS) — sau

- Domain + ACM + CloudFront / ALB
- ECS/EC2 hoặc Elastic Beanstalk cho API
- DocumentDB hoặc Atlas M10+
- S3 + IAM riêng, secret trong Parameter Store
- `spring.profiles.active=prod`, CORS chỉ domain prod

Tài liệu nội bộ pháp lý: `docs/legal/PHAP-LY-NOI-BO.md`.
