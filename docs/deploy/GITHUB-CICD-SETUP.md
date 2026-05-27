# GitHub Actions CI/CD — production (`sotuci.vn`)

Workflow:

| Repo | File | Khi push `main` |
|------|------|-----------------|
| `salsales-management-web` | `.github/workflows/deploy-frontend-prod.yml` | Build → S3 `salsales-web-prod` → invalidate CloudFront |
| `salsales-management-backend` | `.github/workflows/deploy-backend-prod.yml` | Build JAR → S3 → SSM restart `salsales` trên EC2 |

---

## 1. Tạo S3 bucket artifact (một lần)

```bash
aws s3 mb s3://salsales-deploy-prod --region ap-southeast-1
```

EC2 instance role `ec2-salsales-prod` cần đọc bucket này — thêm inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::salsales-deploy-prod/backend/*"
    }
  ]
}
```

---

## 2. IAM OIDC cho GitHub

### 2.1. Identity provider (một lần / account)

AWS Console → **IAM** → **Identity providers** → Add **OpenID Connect**:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2.2. Role `github-actions-deploy`

**Trust policy** (đổi `YOUR_GITHUB_USER` và tên repo):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:YOUR_GITHUB_USER/salsales-management-web:ref:refs/heads/main",
            "repo:YOUR_GITHUB_USER/salsales-management-backend:ref:refs/heads/main"
          ]
        }
      }
    }
  ]
}
```

**Permissions** (gộp hoặc tách policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FrontendS3",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::salsales-web-prod",
        "arn:aws:s3:::salsales-web-prod/*"
      ]
    },
    {
      "Sid": "DeployArtifacts",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::salsales-deploy-prod",
        "arn:aws:s3:::salsales-deploy-prod/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_CF_WEB_DIST_ID"
    },
    {
      "Sid": "SSMDeploy",
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations"
      ],
      "Resource": [
        "arn:aws:ec2:ap-southeast-1:YOUR_ACCOUNT_ID:instance/i-08167ad5505b5b164",
        "arn:aws:ssm:ap-southeast-1::document/AWS-RunShellScript",
        "arn:aws:ssm:ap-southeast-1:YOUR_ACCOUNT_ID:*"
      ]
    }
  ]
}
```

Lưu **Role ARN** (vd. `arn:aws:iam::123456789012:role/github-actions-deploy`).

---

## 3. GitHub Secrets (mỗi repo)

Settings → Secrets and variables → **Actions**:

| Secret | Repo | Mô tả |
|--------|------|--------|
| `AWS_ROLE_ARN` | web + backend | ARN role ở trên |
| `CF_DISTRIBUTION_ID` | web only | CloudFront web (`salsales-web-prod`), vd. `E1234...` |
| `GOOGLE_CLIENT_ID_PROD` | web only | OAuth client prod cho `VITE_APP_GOOGLE_CLIENT_ID` |
| `EC2_INSTANCE_ID` | backend (tuỳ chọn) | Mặc định workflow: `i-08167ad5505b5b164` |

---

## 4. Chạy thử

1. Push workflow lên `main` (hoặc **Actions** → **Run workflow**).
2. **Web:** sau ~2–5 phút mở https://sotuci.vn (Ctrl+Shift+R).
3. **Backend:** kiểm tra https://api.sotuci.vn/actuator/health → `{"status":"UP"}`.

### SSM deploy fail

- EC2 phải **Online** trong Fleet Manager / SSM.
- Role EC2 có `AmazonSSMManagedInstanceCore` + quyền `s3:GetObject` bucket deploy.
- Trên EC2 đã cài AWS CLI (`aws --version`).

```bash
sudo journalctl -u salsales -n 80 --no-pager
```

---

## 5. UptimeRobot

Sau deploy backend, monitor vẫn dùng:

`https://api.sotuci.vn/actuator/health` — keyword `"status":"UP"`.

Pause monitor khi chủ động stop EC2.
