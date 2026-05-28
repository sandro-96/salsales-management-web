# PROD RUNBOOK — `sotuci.vn` (as-built)

Tài liệu này là “sổ tay vận hành” cho production hiện tại: thông tin hạ tầng + lệnh thường dùng + checklist xử lý sự cố.

## Thông tin hệ thống

- **Domain**
  - Web: `https://sotuci.vn` / `https://www.sotuci.vn`
  - API: `https://api.sotuci.vn`
- **DNS**: Cloudflare
- **AWS region**: `ap-southeast-1` (Singapore)

## AWS resources

### EC2 (backend)

- **Instance**: `i-08167ad5505b5b164`
- **Elastic IP (EIP)**: `13.215.133.238`
- **OS**: Amazon Linux 2023 (ARM64 / `aarch64`)
- **Service**
  - App: `salsales.service`
  - Caddy: `caddy.service`

### S3

- **Frontend bucket**: `salsales-web-prod`
- **Deploy artifacts (JAR) bucket**: `salsales-deploy-prod`
  - Key latest: `backend/sales-latest.jar`
- **Backup bucket**: `salsales-backup-prod`
  - Prefix: `mongo/`
  - Lifecycle: expire sau **30 ngày**

### CloudFront (web)

- **Distribution ID**: `E3EYK7MGS7LL1U`

## CI/CD (GitHub Actions)

### Workflows

- **Web**: `salsales-management-web/.github/workflows/deploy-frontend-prod.yml`
- **Backend**: `salsales-management-backend/.github/workflows/deploy-backend-prod.yml`

### AWS role (OIDC)

- **Role name**: `github-actions-deploy`
- GitHub secrets:
  - Web repo: `AWS_ROLE_ARN`, `CF_DISTRIBUTION_ID`, `GOOGLE_CLIENT_ID_PROD`
  - Backend repo: `AWS_ROLE_ARN` (+ optional `EC2_INSTANCE_ID`)

## Health / Monitoring

- **Health check**: `https://api.sotuci.vn/actuator/health`
- **UptimeRobot**: monitor URL trên (keyword `"status":"UP"`)
- **CloudWatch alarms**: EC2 status check + CPU high (SNS email)

## MongoDB Atlas (Network Access)

- **Không dùng** `0.0.0.0/0`
- Whitelist tối thiểu: **EIP EC2** `13.215.133.238/32`
- (Tuỳ chọn) whitelist IP máy bạn `/32` để dùng Compass

## Lệnh vận hành thường dùng (EC2)

### Vào server (không cần SSH)

- AWS Console → EC2 → Connect → **Session Manager**

### Kiểm tra trạng thái

```bash
sudo systemctl status salsales --no-pager
sudo systemctl status caddy --no-pager
curl -s http://127.0.0.1:8080/actuator/health
curl -s https://api.sotuci.vn/actuator/health
```

### Xem log

```bash
sudo journalctl -u salsales -n 120 --no-pager
sudo journalctl -u caddy -n 120 --no-pager
```

### Reload env từ SSM (tạo `env.sh`) + restart app

```bash
sudo bash /opt/salsales/load-env.sh
sudo chown ec2-user:ec2-user /opt/salsales/env.sh
sudo chmod 600 /opt/salsales/env.sh
sudo systemctl restart salsales
```

## Backup MongoDB

### systemd timer

- Timer: `salsales-mongo-backup.timer`
- Service: `salsales-mongo-backup.service`

### Chạy thử backup ngay

```bash
sudo systemctl start salsales-mongo-backup.service
sudo journalctl -u salsales-mongo-backup.service -n 80 --no-pager
```

### Kiểm tra lịch chạy

```bash
systemctl list-timers --all | grep salsales-mongo-backup
```

## Checklist “khi có sự cố”

1. **API down**: kiểm `https://api.sotuci.vn/actuator/health`
2. **Trên EC2**:
   - `sudo systemctl status salsales`
   - `sudo journalctl -u salsales -n 120 --no-pager`
   - `sudo systemctl status caddy`
3. **Mongo Atlas**: kiểm Network Access còn whitelist đúng EIP EC2
4. **CI/CD**: xem run cuối cùng, rollback bằng cách redeploy commit trước (workflow)

