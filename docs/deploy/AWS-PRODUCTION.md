# Production trên AWS — tối ưu chi phí

> Plan deploy production cho **salsales** (backend Spring Boot + frontend React/Vite + MongoDB + Redis + S3).
> Mục tiêu: chạy thật, có SSL, có backup, **chi phí < $30/tháng** trong 12 tháng đầu, scale lên dễ.
>
> Đọc trước: `docs/deploy/STAGING.md` (đang chạy Vercel + Railway + Atlas M0). Production sẽ thay Railway → AWS, Vercel → S3+CloudFront, Atlas M0 → Atlas M2/M10.

---

## Trạng thái production hiện tại (as-built)

Tài liệu này ban đầu là “plan”. Dưới đây là **cấu hình thực tế đang chạy** (đã go-live) để bạn tra cứu nhanh.

- **Domain**
  - Web: `https://sotuci.vn` + `https://www.sotuci.vn`
  - API: `https://api.sotuci.vn`
- **DNS**: Cloudflare (không dùng Route 53)
- **Region AWS**: `ap-southeast-1` (Singapore)
- **EC2**
  - Instance: `i-08167ad5505b5b164`
  - EIP: `13.215.133.238`
  - OS: Amazon Linux 2023 (ARM64 / aarch64)
  - App chạy dạng **JAR + systemd** (`salsales.service`)
- **Reverse proxy / TLS API**: **Caddy (host)** → reverse proxy `127.0.0.1:8080` (đã bỏ CloudFront cho API)
- **Frontend**
  - S3 bucket: `salsales-web-prod`
  - CloudFront web distribution id: `E3EYK7MGS7LL1U`
- **Secrets**: SSM Parameter Store prefix `/salsales/prod/`
- **CI/CD (GitHub Actions)**
  - Web: `.github/workflows/deploy-frontend-prod.yml`
  - Backend: `.github/workflows/deploy-backend-prod.yml`
  - AWS OIDC role: `github-actions-deploy`
- **Backup MongoDB**
  - S3 bucket backup: `salsales-backup-prod` (lifecycle expire 30d cho prefix `mongo/`)
  - EC2 timer/service: `salsales-mongo-backup.timer` / `salsales-mongo-backup.service`
- **Monitoring**
  - UptimeRobot: `https://api.sotuci.vn/actuator/health`
  - CloudWatch alarm: EC2 status check + CPU (SNS email)
- **Security**
  - Security Group: chỉ mở **80/443**; **đã đóng 8080 public** và **đã đóng SSH 22** (dùng SSM Session Manager)
  - Atlas: đã bỏ `0.0.0.0/0`, whitelist IP cần thiết

> Gợi ý: mọi thông tin “để tra cứu nhanh” được tổng hợp thêm ở `docs/deploy/PROD-RUNBOOK.md`.

## 0. Tổng quan kiến trúc

```
                       ┌────────────────────┐
                       │  Cloudflare DNS    │  sotuci.vn / api.sotuci.vn
                       └──────┬─────────────┘
                              │
              ┌───────────────┴───────────────────┐
              ▼                                   ▼
   ┌─────────────────────┐            ┌──────────────────────┐
   │  CloudFront (web)   │            │  EC2 + Caddy (api)   │
   │  + ACM cert         │            │  + Let's Encrypt     │
   │                     │            │                      │
   └──────────┬──────────┘            └──────────┬───────────┘
              │                                  │
              ▼                                  ▼
   ┌─────────────────────┐            ┌──────────────────────┐
   │  S3 (web/dist)      │            │  EC2 t4g.small (ARM) │
   │  static SPA         │            │  systemd:            │
   │  versioned, private │            │   - Spring Boot (JAR)│
   └─────────────────────┘            │   - Redis            │
                                      │   - Caddy (TLS+proxy)│
                                      │  EIP gắn cố định     │
                                      └──────────┬───────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                    ┌──────────────┐  ┌──────────────────┐ ┌─────────────────┐
                    │ MongoDB Atlas│  │  AWS S3          │ │ CloudWatch /    │
                    │ M2/M10 (SGN) │  │  uploads bucket  │ │ SNS alarm email │
                    │ PrivateLink  │  │  + IAM role      │ │                 │
                    └──────────────┘  └──────────────────┘ └─────────────────┘
```

**Tại sao kiến trúc này rẻ:**

- **S3 + CloudFront** cho FE: gần như miễn phí với traffic SaaS nhỏ (CloudFront free tier 1TB/tháng vĩnh viễn cho AWS account mới đăng ký trước 2021; hiện tại có 100GB/tháng free always).
- **1 EC2 t4g.small (ARM Graviton)** chạy cả Spring Boot + Redis + Caddy: không tốn ALB ($16/tháng), không tốn ElastiCache ($12/tháng).
- **Atlas thay vì DocumentDB**: DocumentDB rẻ nhất ~$200/tháng. Atlas M2 chỉ $9/tháng (shared) hoặc M10 $57/tháng (dedicated, backup tự động).
- **Caddy** auto-issue + renew Let's Encrypt → khỏi mua ACM cho EC2 (ACM chỉ free cho ALB/CloudFront).
- **SSM Parameter Store** thay Secrets Manager: Standard parameter free, Secrets Manager $0.40/secret/tháng.

---

## 1. Dự toán chi phí

### Tier khởi đầu — khuyến nghị bắt đầu từ đây (~$15–25/tháng sau free tier)


| Hạng mục          | Cấu hình                                          | Năm 1 (free tier)                                              | Sau năm 1                                                       |
| ----------------- | ------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| EC2 backend       | `t4g.small` (2 vCPU ARM, 2GB RAM), Reserved 1 năm | t3.micro free 750h/tháng = $0; nâng t4g.small = ~$8 chênh lệch | ~~$12.41 (on-demand) / **~~$7.83 (RI 1y)** / **~$5.40 (RI 3y)** |
| EBS gp3           | 20GB                                              | $1.60                                                          | $1.60                                                           |
| Elastic IP        | gắn vào instance đang chạy                        | $0                                                             | $0                                                              |
| Data transfer out | ~50GB/tháng                                       | 100GB free                                                     | ~$4.50 (sau khi vượt)                                           |
| S3 (FE + uploads) | 5GB                                               | $0 (free tier 5GB năm 1)                                       | ~$0.12                                                          |
| CloudFront        | 50GB/tháng                                        | 100GB always-free                                              | $0 (vẫn trong free tier)                                        |
| Route 53          | 1 hosted zone                                     | $0.50                                                          | $0.50                                                           |
| ACM               | cert                                              | $0                                                             | $0                                                              |
| MongoDB Atlas     | M2 shared (Singapore)                             | **$9**                                                         | $9                                                              |
| **Cộng dồn**      |                                                   | **~$11/tháng**                                                 | **~$25/tháng**                                                  |


### Tier nâng cấp khi có khách trả phí thật (~$70–100/tháng)

- Atlas **M10** ($57/tháng) — dedicated, có backup snapshot tự động, restore point-in-time.
- EC2 **t4g.medium** (4GB RAM) Reserved 1y ~$16/tháng — đủ chạy Spring + Redis + 100 concurrent users thoải mái.
- Thêm **CloudWatch detailed metrics** ~$3/tháng.

### Tier scale (sau khi đủ doanh thu, ~$200+/tháng) — không làm ngay

- Tách Redis sang **ElastiCache** ($12+/tháng).
- Thêm **ALB** + 2 EC2 (HA).
- Atlas **M20** ($169/tháng).
- WAF $5 + rules.

---

## 2. Pre-flight — chuẩn bị trước khi đụng vào AWS

### 2.1. Tài khoản & bảo mật

- Tạo AWS account (dùng email + 2FA TOTP).
- **Root user**: bật MFA, lưu access key vào nơi an toàn, **không** tạo access key cho root, không dùng root để deploy.
- Tạo IAM user `admin-deploy` với policy `AdministratorAccess`, bật MFA. Toàn bộ thao tác bên dưới dùng user này.
- Bật **AWS Budgets**: cảnh báo email khi tháng > $20 và > $50 (Console → Billing → Budgets).
- Bật **CloudTrail** (1 trail, region `ap-southeast-1`) — free tier 90 ngày event history, có sẵn.

### 2.2. Domain

- Mua domain (Namecheap/Cloudflare/PA Việt Nam). Nếu mua tại Route 53 cũng được nhưng đắt hơn.
- Trong tài liệu này dùng:
  - `sotuci.vn` — landing + web app
  - `api.sotuci.vn` — backend API
  - `www.sotuci.vn` → redirect về root

### 2.3. Secrets cần chuẩn bị

Tạo file nháp **local, không commit**:

```
APP_JWT_SECRET=          # random ≥ 64 chars, khác hẳn dev/staging
MONGODB_URI=             # Atlas prod cluster
MONGODB_DATABASE=salesdb
GOOGLE_CLIENT_ID=        # OAuth client mới riêng cho prod (KHÔNG dùng chung dev)
GOOGLE_CLIENT_SECRET=
WEBHOOK_SECRET=          # random 32+ chars
MAIL_USERNAME=           # email gửi noreply (nên dùng SES sau)
MAIL_PASSWORD=
VNPAY_TMN_CODE=          # production VNPay merchant
VNPAY_HASH_SECRET=
VNPAY_PAY_URL=https://pay.vnpay.vn/vpcpay.html         # PROD endpoint
VNPAY_QUERY_URL=https://merchant.vnpay.vn/merchant_webapi/api/transaction
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api   # PROD endpoint
BILLING_BANK_NAME=
BILLING_ACCOUNT_NUMBER=
BILLING_ACCOUNT_HOLDER=
BILLING_VIETQR_BANK_BIN=
```

Sinh secret nhanh trên Windows:

```powershell
# JWT secret 64 chars
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

## 3. Bước 1 — MongoDB Atlas Production

Atlas tách khỏi `salesdb-dev` / `salesdb-test` ở staging. Production dùng project `**salesdb**` (đúng như comment trong `STAGING.md`).

1. Atlas → New Project `**salesdb-prod**` → Build Database.
2. Chọn **Shared M0** lúc đầu nếu chưa có khách trả phí, **M2 ($9/mo)** nếu cần connection pool ổn định, hoặc **M10 ($57/mo)** khi bắt đầu nhận thanh toán thật.
3. Region: **AWS / Singapore (ap-southeast-1)** — cùng region EC2 để latency thấp + miễn phí cross-AZ.
4. **Database Access**:
  - User `salsales-app` chỉ quyền `readWrite` trên database `salesdb`.
  - Password ≥ 32 ký tự ngẫu nhiên.
5. **Network Access**:
  - Tạm thời `0.0.0.0/0` để test deploy lần đầu.
  - Sau khi có Elastic IP của EC2 → đổi sang **IP whitelist** chỉ EIP đó.
  - Khi nâng lên M10+ → bật **AWS PrivateLink** (miễn phí với Atlas, traffic không ra Internet).
6. **Backup** (tự động bật từ M10): giữ snapshot mặc định 7 ngày là đủ.
7. **Connect → Drivers → Java** → copy connection string → lưu vào file secrets ở mục 2.3.
8. (Khuyến nghị) Bật **Atlas Search**, **Performance Advisor** — free.

> ⚠️ **Không** xoá `salesdb-dev` / `salesdb-test`. Giữ tách 3 môi trường.

---

## 4. Bước 2 — S3 buckets

Tạo trong region `ap-southeast-1` (Singapore).

### 4.1. Bucket frontend (private, đọc qua CloudFront)

```
Tên: salsales-web-prod
Region: ap-southeast-1
Block all public access: ✅ BẬT (CloudFront sẽ truy cập qua OAC)
Versioning: ✅ BẬT (rollback nhanh khi deploy lỗi)
Encryption: SSE-S3 (mặc định, miễn phí)
```

### 4.2. Bucket uploads (đã có, kiểm lại)

Bucket hiện đang dùng: `vmg-s3-storage-public-bucket` (dev). **Tạo bucket mới riêng cho prod**, không dùng chung dev.

```
Tên: salsales-uploads-prod
Region: ap-southeast-1
Block all public access:
   ✅ Block public bucket policies
   ✅ Block public ACLs
   ❌ KHÔNG block public read object (vì ảnh sản phẩm cần view trực tiếp)
   → hoặc gắn sau CloudFront để private hoàn toàn (nâng cao, làm ở bước 8.2)
Versioning: ❌ tắt (tiết kiệm chi phí, ảnh không cần versioning)
Lifecycle: chuyển object > 90 ngày sang S3 Intelligent-Tiering
CORS: cho phép GET từ sotuci.vn, *.sotuci.vn
```

CORS JSON dán vào bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://sotuci.vn", "https://www.sotuci.vn"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Bucket policy public-read cho ảnh (dán JSON sẵn có, đổi tên bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::salsales-uploads-prod/*"
  }]
}
```

### 4.3. IAM user cho backend đọc/ghi uploads bucket

> Mục tiêu: backend không lưu access key vĩnh viễn nếu có thể. Tốt nhất là dùng **IAM role gắn EC2** (mục 5.4). User dưới đây chỉ dùng dự phòng / khi chạy ngoài EC2.

```
IAM → Users → Create user "salsales-app-prod"
Không cho Console access. Tạo access key dạng "Application running on AWS compute service" → "I am not sure" → Other.
Policy inline (giống aws-s3-policy.json đã có, đổi tên bucket):
```

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "S3AppAccess",
    "Effect": "Allow",
    "Action": [
      "s3:PutObject", "s3:GetObject", "s3:DeleteObject",
      "s3:GetBucketLocation", "s3:ListBucket"
    ],
    "Resource": [
      "arn:aws:s3:::salsales-uploads-prod",
      "arn:aws:s3:::salsales-uploads-prod/*"
    ]
  }]
}
```

Lưu Access Key ID + Secret vào file secrets local — sẽ đẩy vào SSM Parameter Store ở bước 6.

---

## 5. Bước 3 — EC2 backend

### 5.1. Khởi tạo VPC + Security Group

Dùng **Default VPC** trong `ap-southeast-1` để khỏi tốn NAT Gateway ($35/tháng).

Tạo Security Group `sg-salsales-api`:


| Inbound | Source           | Port | Mục đích                                         |
| ------- | ---------------- | ---- | ------------------------------------------------ |
| TCP     | `0.0.0.0/0`      | 80   | HTTP (Caddy redirect 443)                        |
| TCP     | `0.0.0.0/0`      | 443  | HTTPS                                            |
| TCP     | IP nhà bạn `/32` | 22   | SSH (đổi sau khi xong, dùng SSM Session Manager) |


Outbound: allow all (mặc định).

### 5.2. Launch EC2

```
AMI: Amazon Linux 2023 (ARM 64-bit) hoặc Ubuntu 24.04 ARM
Instance type: t4g.small (2 vCPU ARM, 2GB RAM)
Key pair: tạo mới "salsales-prod.pem" → tải về, chmod 400
Network: Default VPC, public subnet, auto-assign public IP
Storage: 20GB gp3 (3000 IOPS, 125 MB/s — đủ dùng, ~$1.60/tháng)
IAM role: gắn ở bước 5.4 (tạm thời để None, gán sau)
User data: dán script ở 5.3
```

### 5.3. User data — chuẩn bị môi trường tự động

Dán vào field "User data" lúc launch (Amazon Linux 2023):

```bash
#!/bin/bash
set -e
dnf update -y
dnf install -y docker git curl tar
systemctl enable --now docker
usermod -aG docker ec2-user

# Docker Compose plugin v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Caddy (binary tĩnh) — sẽ chạy trong docker-compose, không cài host
mkdir -p /opt/salsales/{data,caddy_data,caddy_config,logs}
chown -R ec2-user:ec2-user /opt/salsales
```

### 5.4. IAM role cho EC2

```
IAM → Roles → Create role
Trusted entity: AWS service → EC2
Permissions: gắn 3 policy
  1. Inline S3 (giống 4.3) cho bucket salsales-uploads-prod
  2. AWS managed: AmazonSSMManagedInstanceCore   ← để dùng Session Manager khỏi SSH
  3. Inline SSM Parameter Store read:
```

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
    "Resource": "arn:aws:ssm:ap-southeast-1:*:parameter/salsales/prod/*"
  },
  {
    "Effect": "Allow",
    "Action": ["kms:Decrypt"],
    "Resource": "*"
  }]
}
```

Đặt tên role `ec2-salsales-prod`. Sau đó EC2 → Actions → Security → Modify IAM role → gắn role này.

### 5.5. Elastic IP

```
EC2 → Elastic IPs → Allocate → Associate vào instance vừa tạo.
```

Lưu lại EIP (ví dụ `13.213.xxx.xxx`) — sẽ dùng cho DNS ở bước 7.

> ⚠️ **Quan trọng**: EIP **chưa gắn** instance bị tính $3.6/tháng. EIP **đã gắn** instance đang chạy thì free.

---

## 6. Bước 4 — Đẩy secrets vào SSM Parameter Store

Standard parameter free unlimited. Dùng `SecureString` (mã hoá KMS default key — cũng free cho default key).

Cài AWS CLI local, configure profile `admin-deploy`, rồi chạy:

```bash
# Bash trên WSL hoặc Git Bash; PowerShell cũng được, đổi cú pháp
REGION=ap-southeast-1
PREFIX=/salsales/prod

aws ssm put-parameter --region $REGION --name "$PREFIX/MONGODB_URI"          --type SecureString --value 'mongodb+srv://...'
aws ssm put-parameter --region $REGION --name "$PREFIX/MONGODB_DATABASE"     --type String       --value 'salesdb'
aws ssm put-parameter --region $REGION --name "$PREFIX/APP_JWT_SECRET"       --type SecureString --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/GOOGLE_CLIENT_ID"     --type String       --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/GOOGLE_CLIENT_SECRET" --type SecureString --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/WEBHOOK_SECRET"       --type SecureString --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/MAIL_USERNAME"        --type String       --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/MAIL_PASSWORD"        --type SecureString --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/AWS_S3_BUCKET"        --type String       --value 'salsales-uploads-prod'
aws ssm put-parameter --region $REGION --name "$PREFIX/AWS_REGION"           --type String       --value 'ap-southeast-1'
# Nếu KHÔNG dùng IAM role (không khuyến nghị): mới cần access key
# aws ssm put-parameter --region $REGION --name "$PREFIX/AWS_ACCESS_KEY"     --type SecureString --value '...'
# aws ssm put-parameter --region $REGION --name "$PREFIX/AWS_SECRET_KEY"     --type SecureString --value '...'

# Thanh toán + billing
aws ssm put-parameter --region $REGION --name "$PREFIX/VNPAY_TMN_CODE"       --type String       --value '...'
aws ssm put-parameter --region $REGION --name "$PREFIX/VNPAY_HASH_SECRET"    --type SecureString --value '...'
# ... tương tự MOMO_*, BILLING_*
```

---

## 7. Bước 5 — Build & deploy backend lên EC2

### 7.1. SSH vào instance (lần đầu)

```bash
ssh -i salsales-prod.pem ec2-user@<EIP>
```

(Lần sau dùng **Session Manager** từ Console — không cần mở port 22).

### 7.2. Cấu trúc thư mục trên EC2

```
/opt/salsales/
├── docker-compose.yml
├── Caddyfile
├── .env              ← sinh tự động từ SSM lúc start
├── load-env.sh
├── data/             ← Redis AOF persist
├── caddy_data/       ← Let's Encrypt cert
├── caddy_config/
└── logs/
```

### 7.3. Dockerfile cho backend

Thêm file này vào repo backend (root): `salsales-management-backend/Dockerfile`

```dockerfile
# Multi-stage để image cuối nhỏ (~250MB thay vì 600MB)
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src ./src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/sales-*.jar /app/app.jar
USER app
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "-jar", "/app/app.jar", "--spring.profiles.active=prod"]
```

### 7.4. docker-compose.yml trên EC2

Sao chép vào `/opt/salsales/docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    volumes:
      - ./data/redis:/data
    networks: [internal]

  api:
    image: ghcr.io/<github-username>/salsales-backend:latest   # build & push từ GitHub Actions
    restart: unless-stopped
    depends_on: [redis]
    env_file: .env
    environment:
      SPRING_PROFILES_ACTIVE: prod
      REDIS_HOST: redis
      REDIS_PORT: 6379
      SPRING_CACHE_TYPE: redis
    expose: ["8080"]
    networks: [internal, web]
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./caddy_data:/data
      - ./caddy_config:/config
    networks: [web]

networks:
  internal:
  web:
```

### 7.5. Caddyfile (TLS tự động + WebSocket pass-through)

`/opt/salsales/Caddyfile`:

```caddy
api.sotuci.vn {
    encode gzip zstd

    # WebSocket /ws — Caddy 2 mặc định đã pass Upgrade headers
    reverse_proxy api:8080 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Rate limit cơ bản (tùy chọn — cần plugin caddy-ratelimit, có thể bỏ qua)
    # log access bằng file, rotate
    log {
        output file /data/access.log {
            roll_size 10mib
            roll_keep 5
        }
        format json
    }
}
```

> Caddy tự xin Let's Encrypt cert cho `api.sotuci.vn` ngay khi port 80/443 mở và DNS đã trỏ về EIP.

### 7.6. Script nạp env từ SSM lúc start

`/opt/salsales/load-env.sh`:

```bash
#!/bin/bash
set -euo pipefail
REGION=ap-southeast-1
PREFIX=/salsales/prod
OUT=/opt/salsales/.env

# Lấy tất cả param dưới /salsales/prod/, decrypt SecureString, sinh KEY=VALUE
aws ssm get-parameters-by-path \
  --region "$REGION" \
  --path "$PREFIX" \
  --with-decryption \
  --recursive \
  --query "Parameters[].[Name,Value]" \
  --output text \
  | while IFS=$'\t' read -r name value; do
      key="${name##*/}"
      # escape backslash & dollar trong value để env_file đọc đúng
      printf '%s=%s\n' "$key" "$value"
    done > "$OUT.tmp"

chmod 600 "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
echo "Loaded $(wc -l < "$OUT") params into $OUT"
```

```bash
chmod +x /opt/salsales/load-env.sh
sudo /opt/salsales/load-env.sh
```

### 7.7. Application properties cho prod — bổ sung

Cập nhật `src/main/resources/application-prod.properties` để khớp với staging style (CORS multi-origin, Redis từ env, không hard-code `localhost`):

```properties
# Hiện tại file đang hard-code spring.redis.host=localhost — đổi:
spring.cache.type=redis
spring.redis.host=${REDIS_HOST:redis}
spring.redis.port=${REDIS_PORT:6379}

# CORS prod — KHÔNG mở *.vercel.app
app.fe.cors-origins=${FRONTEND_CORS_ORIGINS:https://sotuci.vn,https://www.sotuci.vn}

# Actuator health cho healthcheck Docker
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never
management.endpoint.health.probes.enabled=true

# Log mức INFO, không log SQL/Mongo query
logging.level.root=INFO
logging.level.org.springframework.data.mongodb.core.MongoTemplate=WARN
logging.level.org.springdoc=WARN

# Tắt Swagger trên prod (hoặc bảo vệ bằng basic auth nếu muốn giữ)
springdoc.api-docs.enabled=false
springdoc.swagger-ui.enabled=false
```

> Sửa xong commit, push. CI sẽ build image mới.

### 7.8. CI/CD — GitHub Actions build & push image

Tạo `salsales-management-backend/.github/workflows/build-and-push.yml`:

```yaml
name: Build & push backend image
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'pom.xml'
      - 'Dockerfile'
      - '.github/workflows/build-and-push.yml'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/arm64                # khớp t4g (Graviton)
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/salsales-backend:latest
            ghcr.io/${{ github.repository_owner }}/salsales-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Image GHCR free cho public repo. Nếu repo private: 500MB free, sau đó $0.25/GB/tháng — vẫn rẻ hơn ECR Private ($0.10/GB nhưng tính cả pull traffic).

### 7.9. Deploy script trên EC2

`/opt/salsales/deploy.sh`:

```bash
#!/bin/bash
set -euo pipefail
cd /opt/salsales

# Refresh secrets
./load-env.sh

# Login GHCR (cần PAT classic scope read:packages — đặt trong SSM cũng được)
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

docker compose pull api
docker compose up -d --remove-orphans

# Cleanup
docker image prune -f
```

> Nếu repo public thì khỏi login GHCR.

### 7.10. Auto-deploy khi push main (tuỳ chọn)

Thêm step thứ 2 vào workflow GitHub Actions, dùng **AWS SSM SendCommand** để chạy `deploy.sh` trên EC2 — không cần mở SSH ra public.

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<account-id>:role/github-actions-deploy
          aws-region: ap-southeast-1
      - run: |
          aws ssm send-command \
            --instance-ids i-xxxxxxxxxxxxx \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=["sudo -u ec2-user /opt/salsales/deploy.sh"]' \
            --comment "Deploy ${{ github.sha }}"
```

(Tạo OIDC trust giữa GitHub và IAM role `github-actions-deploy` — Google "GitHub Actions OIDC AWS" có sẵn doc.)

---

## 8. Bước 6 — Deploy frontend lên S3 + CloudFront

### 8.1. Build & upload

Sửa `salsales-management-web/.env.prod` (đã có sẵn, cập nhật):

```env
VITE_API_BASE_URL=https://api.sotuci.vn/api
VITE_WS_URL=https://api.sotuci.vn/ws
VITE_APP_GOOGLE_CLIENT_ID=<prod client id>
VITE_SITE_URL=https://sotuci.vn
VITE_OG_IMAGE_PATH=/og-landing.png
```

GitHub Actions workflow `salsales-management-web/.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy frontend
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'package*.json'
      - 'vite.config.js'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions: { id-token: write, contents: read }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_BASE_URL: https://api.sotuci.vn/api
          VITE_WS_URL: https://api.sotuci.vn/ws
          VITE_APP_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID_PROD }}
          VITE_SITE_URL: https://sotuci.vn
          VITE_OG_IMAGE_PATH: /og-landing.png
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<account-id>:role/github-actions-deploy
          aws-region: ap-southeast-1
      - name: Sync to S3
        run: |
          aws s3 sync dist/ s3://salsales-web-prod/ \
            --delete \
            --cache-control "public,max-age=31536000,immutable" \
            --exclude "index.html" --exclude "sitemap.xml" --exclude "robots.txt"
          # HTML không cache lâu để deploy mới có hiệu lực ngay
          aws s3 cp dist/index.html s3://salsales-web-prod/index.html \
            --cache-control "public,max-age=60,must-revalidate" \
            --content-type "text/html; charset=utf-8"
          aws s3 cp dist/sitemap.xml s3://salsales-web-prod/sitemap.xml \
            --cache-control "public,max-age=3600" || true
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
            --paths "/index.html" "/sitemap.xml" "/robots.txt"
```

### 8.2. CloudFront distribution cho web

```
CloudFront → Create distribution
Origin domain: salsales-web-prod.s3.ap-southeast-1.amazonaws.com
Origin access: OAC (Origin Access Control) → tạo mới, ký S3 → CloudFront tự sinh bucket policy
Viewer protocol: Redirect HTTP to HTTPS
Allowed methods: GET, HEAD
Cache policy: CachingOptimized (managed)
Response headers policy: SecurityHeadersPolicy (managed) — thêm HSTS, X-Content-Type-Options, etc.
Compress objects: Yes
Price class: "Use only North America, Europe, Asia, Middle East, Africa" (rẻ hơn ~$1–2/tháng so với all edges)
Alternate domain (CNAME): sotuci.vn, www.sotuci.vn
SSL certificate: Request ACM cert ở region us-east-1 (BẮT BUỘC cho CloudFront) cho 2 domain trên
Default root object: index.html

Custom error responses (cho SPA routing):
  403 → /index.html, response code 200, TTL 0
  404 → /index.html, response code 200, TTL 0
```

> ACM cert cho CloudFront phải tạo ở **us-east-1** kể cả khi origin ở Singapore — đây là lỗi sai hay gặp.

### 8.3. (Tuỳ chọn) CloudFront cho `api.sotuci.vn`

**Khuyến nghị tạm thời bỏ qua** — Caddy đã làm TLS rồi. CloudFront cho API chỉ đáng làm khi:

- Muốn dùng AWS WAF / Shield Standard.
- Có GET API nặng cần cache edge.
- Muốn hide origin IP.

Bù lại tốn thêm tiền data transfer CF → origin và phức tạp WebSocket (CloudFront có hỗ trợ WS nhưng phải dùng cache policy `CachingDisabled` + origin request policy `AllViewer`).

---

## 9. Bước 7 — DNS Route 53

```
Route 53 → Hosted zone → Create "sotuci.vn"
→ Lấy 4 nameserver NS, đổi nameserver tại nhà đăng ký domain.
```

Records:


| Tên               | Loại               | Giá trị                                                            |
| ----------------- | ------------------ | ------------------------------------------------------------------ |
| `sotuci.vn`     | A — Alias          | CloudFront distribution (web)                                      |
| `www.sotuci.vn` | A — Alias          | CloudFront distribution (web)                                      |
| `api.sotuci.vn` | A                  | Elastic IP của EC2                                                 |
| `sotuci.vn`     | MX (nếu nhận mail) | bỏ qua nếu chỉ gửi outbound                                        |
| `sotuci.vn`     | TXT — SPF          | `v=spf1 include:_spf.google.com ~all` (nếu vẫn gửi qua Gmail SMTP) |


> Đợi DNS propagate ~5–30 phút. Verify bằng `dig api.sotuci.vn` và `nslookup sotuci.vn`.

---

## 10. Bước 8 — OAuth, Payment, Mail prod

### 10.1. Google OAuth client production

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → tạo **OAuth client Web** mới (không dùng chung dev):

```
Authorized JavaScript origins:
  https://sotuci.vn
  https://www.sotuci.vn

Authorized redirect URIs:
  https://sotuci.vn/login
  https://www.sotuci.vn/login
```

Copy Client ID + Secret → cập nhật SSM (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) + GitHub secret `GOOGLE_CLIENT_ID_PROD`.

OAuth consent screen: chuyển sang **In production**, điền:

- Privacy policy URL: `https://sotuci.vn/privacy`
- Terms of Service URL: `https://sotuci.vn/terms`
- Authorized domains: `sotuci.vn`

### 10.2. VNPay / MoMo production

- VNPay: đăng ký merchant production, lấy `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` real, đổi endpoint `pay.vnpay.vn` (không dùng `sandbox.vnpayment.vn`).
- MoMo: tương tự, endpoint `payment.momo.vn`.
- `VNPAY_RETURN_URL=https://sotuci.vn/billing`
- `MOMO_REDIRECT_URL=https://sotuci.vn/billing`
- `MOMO_IPN_URL=https://api.sotuci.vn/api/webhook/momo`

### 10.3. Email — chuyển sang AWS SES (khuyến nghị)

Gmail SMTP miễn phí nhưng giới hạn 500 mail/ngày + dễ vào spam khi gửi cho khách. SES:

- Verify domain `sotuci.vn` trong SES Console (`ap-southeast-1`) → thêm DKIM CNAME records vào Route 53.
- Sandbox mode: chỉ gửi cho email verified. Request production access (free, duyệt 24h).
- Cost: 62k email/tháng free khi gửi từ EC2; sau đó $0.10/1000.
- Tạo SMTP credentials trong SES → cập nhật SSM:

```
MAIL_HOST=email-smtp.ap-southeast-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=<SES SMTP user>
MAIL_PASSWORD=<SES SMTP pass>
```

---

## 11. Bước 9 — Khởi động production lần đầu

Trên EC2 (qua SSH hoặc Session Manager):

```bash
cd /opt/salsales

# 1. Pull image mới nhất (workflow build đã chạy xong)
sudo -u ec2-user docker login ghcr.io -u <user> -p <PAT>
sudo -u ec2-user docker compose pull

# 2. Nạp env từ SSM
sudo /opt/salsales/load-env.sh

# 3. Start
sudo -u ec2-user docker compose up -d

# 4. Theo dõi log
sudo -u ec2-user docker compose logs -f api
```

Log phải có:

- `The following 1 profile is active: "prod"`
- `Started SalesApplication in xx s`
- Không có exception Mongo/Redis.

Verify:

```bash
curl -i https://api.sotuci.vn/actuator/health     # {"status":"UP"}
curl -i https://sotuci.vn                         # 200, HTML SPA
```

Mở browser:

- `https://sotuci.vn` → SPA load.
- F12 Network → request đầu tiên tới `https://api.sotuci.vn/api/...` 200.
- Đăng ký user mới → nhận email verify (SES).
- Đăng nhập, tạo sản phẩm, upload ảnh → object xuất hiện trong `salsales-uploads-prod`.
- WebSocket: mở 2 tab cùng shop, tạo đơn ở tab A → tab B nhận update realtime.

---

## 12. Bước 10 — Backup & disaster recovery

### 12.1. MongoDB

- M0/M2: snapshot thủ công định kỳ → `mongodump` qua cron trên EC2:
  ```bash
  # /etc/cron.d/salsales-backup (chạy 02:00 hằng ngày, giữ 7 ngày)
  0 2 * * * ec2-user docker run --rm --network host \
      mongo:7 mongodump --uri="$MONGODB_URI" --archive --gzip \
      > /opt/salsales/backups/mongo-$(date +\%F).gz \
      && find /opt/salsales/backups -name 'mongo-*.gz' -mtime +7 -delete
  ```
  Sync lên S3 (rất rẻ, lifecycle chuyển Glacier sau 30 ngày):
  ```bash
  aws s3 sync /opt/salsales/backups/ s3://salsales-backups-prod/ \
      --storage-class STANDARD_IA
  ```
- M10+: bật **Continuous Backup** trong Atlas (mặc định) → restore point-in-time 7 ngày.

### 12.2. EC2

- Tạo **AMI snapshot** thủ công sau khi setup xong (Actions → Image → Create image). Lưu lại AMI ID — restore disaster trong 10 phút.
- Bật **Data Lifecycle Manager** snapshot EBS hằng tuần, giữ 4 bản (~$0.10/tháng).

### 12.3. S3 uploads

- Bật **Versioning** + Lifecycle xoá version cũ > 90 ngày (nếu lo file bị overwrite/xoá nhầm).
- Replication sang region khác chỉ làm khi đủ tiền (~$0.02/GB transfer).

---

## 13. Bước 11 — Monitoring & alert

### 13.1. CloudWatch alarm cơ bản (free tier 10 alarm)


| Alarm            | Metric                    | Threshold    | Action    |
| ---------------- | ------------------------- | ------------ | --------- |
| EC2 CPU cao      | CPUUtilization            | > 80% 5 phút | SNS email |
| EC2 status check | StatusCheckFailed         | ≥ 1          | SNS email |
| EBS disk gần đầy | (custom CloudWatch agent) | > 85%        | SNS email |
| Billing          | EstimatedCharges          | > $30        | SNS email |


Tạo SNS topic `salsales-alerts` → subscribe email cá nhân → confirm.

### 13.2. Application log

- Caddy ghi access.log JSON ở `/opt/salsales/caddy_data/access.log`.
- Spring Boot log ra stdout → `docker logs`. Rotate bằng Docker logging driver:
  ```yaml
  # docker-compose.yml — thêm vào service api
  logging:
    driver: json-file
    options:
      max-size: "20m"
      max-file: "5"
  ```
- (Tuỳ chọn) Cài **CloudWatch agent** đẩy log sang CW Logs (~$0.50/GB ingestion).

### 13.3. Uptime

- Free: [UptimeRobot](https://uptimerobot.com) ping `https://api.sotuci.vn/actuator/health` mỗi 5 phút, gửi email/Telegram khi down.
- AWS: Route 53 health check $0.50/check/tháng.

---

## 14. Bước 12 — Hardening security

Sau khi đã chạy ổn:

1. **Đóng port 22** trong Security Group. Truy cập EC2 qua **SSM Session Manager** (đã có sẵn nhờ role `AmazonSSMManagedInstanceCore` ở 5.4):
  ```bash
   aws ssm start-session --target i-xxxxxxxxxxxxx --region ap-southeast-1
  ```
2. **Atlas Network Access**: bỏ `0.0.0.0/0`, chỉ giữ EIP của EC2.
3. **S3 buckets**: bật **S3 Block Public Access account-level** (Account settings → Block public access). Bucket `uploads-prod` cần public-read object thì tách qua CloudFront (mục 8.2 mở rộng) hoặc giữ public read object riêng và document rõ ràng.
4. **CloudFront**: thêm **AWS WAF** managed rule `AWSManagedRulesCommonRuleSet` (~$5/tháng + $1/triệu request) khi đủ traffic.
5. **Update tự động**:
  ```bash
   sudo dnf install -y dnf-automatic
   sudo systemctl enable --now dnf-automatic.timer
  ```
6. **JWT**: rotate `APP_JWT_SECRET` mỗi 6 tháng (cập nhật SSM → deploy → toàn bộ session cũ invalid).
7. **Spring Boot**:
  - Đảm bảo `springdoc.*=false` trên prod (xem 7.7).
  - `management.endpoints.web.exposure.include=health` — không expose `/actuator/env`, `/actuator/heapdump`.
  - Rate limit endpoint `/api/auth/`*, `/api/webhook/*` (đã có `WEBHOOK_SECRET`).
8. **Secret rotation script**: quarterly review SSM parameters.

---

## 15. Checklist cuối — go-live

- AWS Budget alarm $20, $50 đã tạo và xác nhận email
- MFA cho root + IAM admin user
- Atlas prod cluster M2/M10, network whitelist EIP, backup bật
- EC2 t4g.small + EIP + IAM role + Security Group đúng
- SSM Parameter Store đủ secrets, prefix `/salsales/prod/`
- Docker compose start được, healthcheck UP
- Caddy auto-issued cert cho `api.sotuci.vn`
- S3 `salsales-web-prod` + CloudFront + ACM cert (us-east-1) cho `sotuci.vn`, `www.sotuci.vn`
- S3 `salsales-uploads-prod` + CORS đúng + bucket policy đúng
- Route 53: A alias web, A EIP api, propagate xong
- Google OAuth client prod, origins/redirects đúng
- VNPay/MoMo production credentials, IPN URL `https://api.sotuci.vn/...`
- SES verified domain + DKIM, exit sandbox
- Đăng ký/đăng nhập/Google login OK
- Email verify nhận được
- POS/đơn hàng/WebSocket realtime OK
- Upload ảnh sản phẩm OK, ảnh hiển thị
- `/billing` chuyển khoản MANUAL hiển thị đúng + (nếu bật) VNPay redirect đúng
- OG image hiển thị khi share Zalo/FB (`https://sotuci.vn/og-landing.png` 200)
- Sitemap `https://sotuci.vn/sitemap.xml` 200
- Mongo backup cron chạy đêm đầu OK
- CloudWatch alarm + SNS email confirm
- UptimeRobot monitor `api.sotuci.vn/actuator/health`
- Port 22 đã đóng, dùng SSM Session Manager
- AMI snapshot post-setup đã tạo
- Tài liệu này commit vào repo, link từ README

---

## 16. Sự cố thường gặp khi prod

### "502 Bad Gateway" từ Caddy

Container `api` chưa healthy. `docker compose logs api` xem stack trace. Thường do `MONGODB_URI` sai hoặc IP EC2 chưa whitelist trong Atlas.

### Cert Let's Encrypt rate limit

Caddy retry tự động. Nếu test nhiều lần → dùng staging endpoint Let's Encrypt trước bằng cách thêm vào Caddyfile:

```
{
  acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}
```

Đổi lại production khi test xong.

### CloudFront 403 "RequestId..." khi vào `/some-route`

Chưa cấu hình custom error response 403→/index.html→200. Xem lại bước 8.2.

### CORS lỗi từ FE

Backend reject vì `FRONTEND_CORS_ORIGINS` không có domain. Kiểm `aws ssm get-parameter --name /salsales/prod/FRONTEND_CORS_ORIGINS`. Nếu thiếu, set rồi `sudo /opt/salsales/load-env.sh && docker compose up -d api`.

### WebSocket disconnect liên tục

Caddy 2 mặc định pass Upgrade — kiểm tra `VITE_WS_URL=https://api.sotuci.vn/ws` (https, không wss; SockJS tự upgrade). Nếu vẫn rớt: tăng Caddy `flush_interval -1` trong `reverse_proxy`.

### Chi phí tháng vượt dự kiến

Top suspect:

- **NAT Gateway** ($35/tháng) — kiểm VPC, không được có. Nếu có là đã chuyển EC2 sang private subnet nhầm.
- **EIP không attach** ($3.6/tháng mỗi cái) — release các EIP idle.
- **S3 Standard cho ảnh không truy cập** — bật Intelligent-Tiering.
- **CloudWatch Logs ingestion** — nếu vô tình log DEBUG.
- **Data Transfer Out** lớn — bật CloudFront cho ảnh, hoặc giảm log verbosity.

Dùng **Cost Explorer** → "Group by: Service" để debug.

---

## 17. Roadmap nâng cấp (làm sau, khi có doanh thu)

1. **ALB + Auto Scaling Group** 2 EC2 multi-AZ (HA) — khi DAU > 500.
2. **Atlas M20 + PrivateLink** — khi DB > 5GB hoặc cần latency p99 < 50ms.
3. **ElastiCache Redis** — khi cache hit > 1000 ops/s.
4. **CloudFront cho api** + WAF — khi bị scan/brute force.
5. **SES → SendGrid/Postmark** — khi cần template builder, analytics.
6. **Multi-region active-passive** (sau khi có khách enterprise yêu cầu DR < 1h).
7. **ECS Fargate Spot** — khi nhiều microservice hơn (không vội).

---

## Tham chiếu

- Staging hiện tại: `docs/deploy/STAGING.md`
- Backend properties: `salsales-management-backend/src/main/resources/application-prod.properties`
- Pháp lý nội bộ: `docs/legal/PHAP-LY-NOI-BO.md`
- Bucket policy mẫu: `salsales-management-backend/aws-s3-bucket-policy.json`, `aws-s3-policy.json`

