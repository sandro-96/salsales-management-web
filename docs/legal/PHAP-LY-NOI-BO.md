# Tài liệu pháp lý nội bộ — Sổ thu chi (SalSales)

> **Mục đích:** Ghi nhận thực tế hệ thống _hiện tại_ để sau này viết **Điều khoản sử dụng**, **Chính sách bảo mật** và trang công khai.  
> **Không phải văn bản pháp lý công bố.** Cần luật sư rà soát trước khi go-live chính thức.  
> **Cập nhật lần cuối:** 2026-05-20

---

## 1. Thông tin chủ thể (điền trước khi public)

### Bạn là **cá nhân** (chưa thành lập công ty) — hoàn toàn được

Phần mềm vẫn chạy bình thường. Pháp lý cần **minh bạch ai vận hành**, không bắt buộc phải có Công ty TNHH ngay từ đầu.

| Mục                               | Cá nhân                                                 |
| --------------------------------- | ------------------------------------------------------- |
| Tên hiển thị sản phẩm             | **Sổ thu chi**                                          |
| Chủ vận hành (hiển thị công khai) | **Chu Thanh Trí**                                       |
| Hình thức                         | `Cá nhân cung cấp dịch vụ phần mềm`                     |
| MST                               |                                                         |
| Địa chỉ liên hệ                   | Liên hệ qua email                                       |
| Email hỗ trợ                      | [vmanage.sass@gmail.com](mailto:vmanage.sass@gmail.com) |
| Số điện thoại                     | +84 0348895626                                          |
| Website (khi có)                  | `________________________________`                      |

**Cách ghi trên Terms / Privacy (nháp):**

> _“Dịch vụ Sổ thu chi do **Chu Thanh Trí** (cá nhân) vận hành. Liên hệ: **vmanage.sass@gmail.com**, **+84 0348895626**.”_

Không cần ghi “Công ty TNHH …” nếu chưa có — **không được** ghi MST/giấy phép giả.

### Khi nào nên lên công ty / hộ kinh doanh?

| Giai đoạn                                    | Gợi ý                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| Dev, beta, vài shop quen                     | Cá nhân + doc nội bộ + Terms/Privacy nháp là đủ                                 |
| Có thu phí ổn định, hợp đồng B2B             | Cân nhắc **hộ kinh doanh** hoặc **công ty** + MST + tài khoản nhận CK tách bạch |
| Shop doanh nghiệp yêu cầu hóa đơn VAT từ bạn | Thường cần pháp nhân có MST — lúc đó mới gấp                                    |

_Thuế và đăng ký kinh doanh: hỏi kế toán địa phương theo mức doanh thu thực tế — tài liệu này không thay tư vấn thuế._

### Nếu sau này có công ty

Đổi §1: tên công ty, MST, đại diện; cập nhật Terms/Privacy + footer; thông báo user nếu đã public.

| Mục       | Công ty (khi có)                 |
| --------- | -------------------------------- |
| Pháp nhân | Tên công ty, MST, địa chỉ trụ sở |
| Đại diện  | Người ký / chịu trách nhiệm      |

**Ghi chú:** Thông tin §1 xuất hiện ở footer landing, trang Liên hệ, đầu Terms/Privacy.

---

## 2. Mô tả dịch vụ (đúng với sản phẩm)

- **Loại hình:** Phần mềm SaaS quản lý bán hàng (web), multi-shop.
- **Đối tượng:** Chủ shop / quản lý / nhân viên tại Việt Nam (mở rộng sau).
- **Tính năng chính:**
  - POS tại quầy, quản lý đơn, sản phẩm, kho, khách hàng, khuyến mãi, báo cáo
  - **Storefront** công khai (khách đặt COD, không bắt buộc tài khoản)
  - **QR gọi món tại bàn** (F&B, qua token QR)
  - **Gói dịch vụ:** dùng thử **30 ngày**, sau đó **99.000 ₫/tháng** (gói BASIC)
  - Thanh toán gói: **chuyển khoản thủ công (MANUAL)** — admin xác nhận; có thể trả trước **1 / 3 / 6 / 9 / 12 tháng**
- **Vai trò pháp lý gợi ý (NĐ 13/2023):**
  - Dữ liệu **tài khoản người dùng** đăng ký hệ thống: bạn thường là **bên kiểm soát dữ liệu**.
  - Dữ liệu **khách hàng / đơn hàng của từng shop**: shop là **chủ dữ liệu kinh doanh**; bạn là **bên xử lý** (cung cấp hạ tầng lưu trữ & phần mềm) — cần mô tả rõ trong Privacy.

---

## 3. Dữ liệu thu thập — theo nhóm

### 3.1. Người dùng đăng ký (User)

| Dữ liệu                                           | Bắt buộc?            | Ghi chú kỹ thuật                  |
| ------------------------------------------------- | -------------------- | --------------------------------- |
| Email                                             | Có                   | Xác thực email (token), đăng nhập |
| Mật khẩu (hash BCrypt)                            | Có (hoặc chỉ Google) | Không lưu plaintext               |
| Họ, tên, tên đệm                                  | Có                   |                                   |
| Số điện thoại (VN)                                | Có                   | Chuẩn hóa `phoneNormalized`       |
| Quốc gia (`countryCode`)                          | Mặc định VN          |                                   |
| Google ID / avatar                                | Nếu đăng nhập Google | OAuth; mật khẩu local có thể null |
| Địa chỉ, ngày sinh, giới tính, timezone, ngôn ngữ | Tùy chọn (tài khoản) | Có trên model User                |
| `lastLoginAt`, trạng thái active/verified         | Hệ thống             |                                   |
| JWT session                                       | Hệ thống             |                                   |

### 3.2. Cửa hàng (Shop) & chi nhánh

| Dữ liệu                                           | Ghi chú       |
| ------------------------------------------------- | ------------- |
| Tên shop, loại hình, địa chỉ, SĐT, logo           | Chủ shop nhập |
| MST (`taxRegistrationNumber`)                     | Tùy chọn      |
| Slug storefront, link Zalo/Facebook/TikTok/Shopee | Tùy chọn      |
| Cấu hình thuế, topping, storefront bật/tắt        | Nghiệp vụ     |

### 3.3. Nhân viên & phân quyền

| Dữ liệu                                           | Ghi chú           |
| ------------------------------------------------- | ----------------- |
| Liên kết User ↔ Shop (`ShopUser`), vai trò, quyền |                   |
| Hồ sơ nhân viên (`StaffProfile`)                  | Tùy shop cấu hình |

### 3.4. Khách hàng của shop (Customer)

| Dữ liệu                        | Ghi chú                         |
| ------------------------------ | ------------------------------- |
| Tên, SĐT, email, ghi chú, v.v. | Do shop nhập / phát sinh từ đơn |

### 3.5. Đơn hàng, thanh toán, tồn kho, khuyến mãi

| Dữ liệu                                                        | Ghi chú                          |
| -------------------------------------------------------------- | -------------------------------- |
| Chi tiết đơn, giá, thuế (snapshot), phương thức thanh toán     |                                  |
| Lịch sử tồn kho, báo cáo                                       |                                  |
| **Giao dịch gói SaaS** (`PaymentTransaction`, `billingMonths`) | Tách với thanh toán đơn của shop |

### 3.6. Khách cuối (Storefront / QR bàn) — không đăng ký app

| Dữ liệu                                   | Ghi chú                                                         |
| ----------------------------------------- | --------------------------------------------------------------- |
| Tên / SĐT / địa chỉ giao (nếu khách nhập) | Phục vụ đơn COD / order tại bàn                                 |
| Token QR, mã bàn                          | Không expose chi tiết khách giữa các lượt QR (thiết kế privacy) |

### 3.7. Nhật ký & vận hành

| Dữ liệu                          | Ghi chú                   |
| -------------------------------- | ------------------------- |
| Audit log (thao tác shop, admin) |                           |
| Subscription history             | Thay đổi gói / thanh toán |
| Log server, WebSocket, thông báo | Vận hành & hỗ trợ         |
| Cookie `sidebar_state` (UI)      | Không tracking marketing  |

---

## 4. Mục đích xử lý dữ liệu

| Mục đích                               | Dữ liệu liên quan                     |
| -------------------------------------- | ------------------------------------- |
| Cung cấp tài khoản & đăng nhập         | User, JWT, Google OAuth               |
| Vận hành shop (POS, đơn, kho, báo cáo) | Shop, đơn, KH, sản phẩm               |
| Storefront / QR                        | Đơn khách, slug shop                  |
| Thu phí gói SaaS                       | Subscription, PaymentTransaction      |
| Hỗ trợ kỹ thuật, xử lý sự cố           | Audit, session, impersonation (admin) |
| Bảo mật, chống lạm dụng                | Log, trạng thái khóa gói EXPIRED      |
| Email xác thực / quên mật khẩu         | Email, token tạm                      |

**Chưa làm (ghi vào roadmap pháp lý nếu cam kết sau):**

- Marketing email / newsletter
- Phân tích hành vi (Google Analytics, pixel)
- Bán / cho thuê danh sách dữ liệu cho bên thứ ba

---

## 5. Ai được truy cập dữ liệu?

| Đối tượng                         | Phạm vi                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Chủ shop (OWNER)                  | Dữ liệu shop mình, phân quyền nhân viên                                                          |
| Nhân viên (theo quyền)            | Subset theo `ShopPermission`                                                                     |
| **Admin hệ thống** (`ROLE_ADMIN`) | Quản lý user/shop, billing, hỗ trợ; có **impersonation** (đăng nhập thay user — hiển thị banner) |
| Khách storefront                  | Chỉ đơ của chính họ / flow công khai                                                             |
| Hosting / nhà cung cấp            | `[ điền: VPS / cloud / MongoDB / email SMTP ]`                                                   |

**Cam kết đề xuất cho Privacy (bản nháp):** Nhân viên nội bộ chỉ truy cập khi cần hỗ trợ; impersonation có log `impersonatedBy`.

---

## 6. Lưu trữ, bảo mật, thời gian lưu

### Thực tế kỹ thuật (code hiện tại)

- MongoDB; hầu hết bản ghi dùng **xóa mềm** (`deleted`, `deletedAt`) — dữ liệu vẫn còn trên DB.
- Gói **EXPIRED**: khóa thao tác ghi, **không tự xóa** shop/đơn.
- **Chưa có** nút “Xóa tài khoản” / xóa cứng tự động trên app — xử lý qua **email** là phù hợp giai đoạn này.

### Chính sách đã chốt (2026-05-20)

| Mục | Quyết định |
| --- | --- |
| **Vị trí server** | **Singapore** — dữ liệu có thể được lưu/xử lý ngoài Việt Nam; ghi trong Privacy (chuyển dữ liệu xuyên biên giới theo NĐ 13). |
| **HTTPS** | Bắt buộc trên production. |
| **Mã hóa at-rest** | Theo tiêu chuẩn nhà cung cấp hạ tầng / MongoDB (cloud hoặc VPS Singapore). |
| **Backup** | **Chưa có** (2026-05). **Mục tiêu trước public:** sao lưu **hàng ngày**, giữ **30 ngày** — **chưa ghi** trên Privacy/web cho đến khi đã triển khai. |
| **Xóa tài khoản** | Email **vmanage.sass@gmail.com** → xác minh → xóa mềm → xóa cứng/ẩn danh sau **90 ngày** (trừ billing 5 năm). |
| **Shop / EXPIRED** | Giữ dữ liệu **tối thiểu 12 tháng** (khóa ghi). Sau 12 tháng không gia hạn: email nhắc; có thể xóa/dọn thêm sau **12 tháng** nữa theo yêu cầu hoặc chính sách shop không hoạt động. |
| **Lịch sử gói & thanh toán** | **5 năm** |
| **Audit log** | **24 tháng** |
| **Log server / lỗi** | **90 ngày** khi có hệ thống log tập trung; hiện chưa bắt buộc thu đủ loại log. |

### Đoạn copy sang Privacy (nháp)

> Dữ liệu được lưu trữ trên máy chủ đặt tại **Singapore** (có thể chuyển ra ngoài lãnh thổ Việt Nam để vận hành dịch vụ). Truyền tải qua HTTPS. Chúng tôi không bán dữ liệu cá nhân. Dữ liệu đơn hàng, khách hàng của từng shop do **chủ shop** quyết định mục đích kinh doanh; **Chu Thanh Trí** (Sổ thu chi) đóng vai trò cung cấp nền tảng lưu trữ và xử lý theo hợp đồng dịch vụ. Khi gói hết hạn, tài khoản có thể bị **khóa thao tác ghi** nhưng dữ liệu được **giữ tối thiểu 12 tháng** để bạn tra cứu hoặc gia hạn. Yêu cầu xóa tài khoản: **vmanage.sass@gmail.com** — sau xác minh, xóa/ẩn danh trong vòng **90 ngày**, trừ dữ liệu giao dịch gói phải lưu theo chính sách nội bộ (tối đa **5 năm**). Sao lưu định kỳ sẽ được áp dụng khi triển khai (mục tiêu: hàng ngày, giữ 30 ngày); thông tin sẽ cập nhật trên trang này khi có.

### Việc vận hành trước public

- [ ] Bật backup (ngày / 30 ngày) → rồi mới sửa Privacy câu về sao lưu.
- [ ] Privacy: đoạn Singapore + chuyển dữ liệu (có thể cần luật sư rà NĐ 13).

---

## 7. Chia sẻ / bên thứ ba

| Bên                   | Dữ liệu chia sẻ                                 | Ghi chú                  |
| --------------------- | ----------------------------------------------- | ------------------------ |
| **Google**            | OAuth: email, tên, avatar (theo scope OAuth)    | Có nút đăng nhập Google  |
| **Email (SMTP)**      | Email xác thực, reset mật khẩu                  | `[ nhà cung cấp: ___ ]`  |
| **Cổng thanh toán**   | Hiện **MANUAL** chính; VNPay/MoMo có trong code | Public: CK + admin duyệt |
| **Không** bán dữ liệu | —                                               | Nên ghi rõ trong Privacy |

---

## 8. Gói dịch vụ & thanh toán (SaaS)

| Hạng mục        | Nội dung công bố                                           |
| --------------- | ---------------------------------------------------------- |
| Dùng thử        | **30 ngày**, đủ tính năng (theo marketing)                 |
| Phí sau thử     | **99.000 ₫ / tháng** (BASIC)                               |
| Trả trước       | **3 / 6 / 9 / 12 tháng** × 99.000 ₫                        |
| Cách trả        | Chuyển khoản; hệ thống tạo **mã giao dịch** + nội dung CK  |
| Kích hoạt       | Sau khi **admin xác nhận** đã nhận tiền                    |
| Tự động gia hạn | **Không** (không trừ thẻ tự động) — user chủ động trả tiếp |
| Hết hạn         | Trạng thái EXPIRED — khóa thao tác ghi (theo app)          |

### 8.1. Chính sách hoàn tiền — **đã chốt (A + B + C)**

- [x] **A.** Không hoàn tiền sau khi admin đã kích hoạt gói / gia hạn đủ số tháng đã thanh toán.  
- [x] **B.** Hoàn **một phần hoặc toàn phần** nếu yêu cầu được gửi trong **7 ngày làm việc** kể từ khi admin kích hoạt, và: (i) gói chưa được sử dụng thực tế (xác minh qua hệ thống), hoặc (ii) lỗi hệ thống khiến không dùng được dịch vụ — quyết định cuối cùng do bên vận hành.  
- [x] **C.** Hoàn khi **admin ghi nhầm / trùng giao dịch** — xử lý thủ công, hoàn về đúng số tiền thừa.  
- [ ] **D.** Khác: *(không dùng)*

**Liên hệ hoàn tiền:** `vmanage.sass@gmail.com` — phản hồi trong **3 ngày làm việc**.

**Thứ tự xử lý gợi ý:** User gửi email (kèm mã giao dịch / shop) → xác minh → nếu thuộc **C** hoặc **B** thì hoàn CK; nếu đã dùng gói ổn định thì áp dụng **A**.

**Đoạn copy sang Terms (nháp):**

> Sau khi admin xác nhận thanh toán và gia hạn gói, **không hoàn tiền** trừ các trường hợp: (1) yêu cầu gửi trong **7 ngày làm việc** kể từ kích hoạt, và bạn chưa sử dụng được dịch vụ do lỗi hệ thống hoặc chưa phát sinh sử dụng thực tế — chúng tôi xem xét hoàn một phần hoặc toàn phần; (2) giao dịch **trùng lặp hoặc ghi nhầm** do phía hệ thống — hoàn phần tiền thừa. Mọi yêu cầu gửi **vmanage.sass@gmail.com**, phản hồi trong **3 ngày làm việc**.

---

## 9. Trách nhiệm thuế & hóa đơn (disclaimer)

- Phần mềm hỗ trợ **chính sách thuế trên đơn** (giá gồm/chưa gồm VAT, snapshot) — **không thay** shop:
  - Xuất hóa đơn điện tử theo quy định
  - Kê khai, nộp thuế
  - Đăng ký MST
- Shop tự chịu trách nhiệm nội dung bán hàng, giá, khuyến mãi, dữ liệu khách họ thu thập.

**Câu disclaimer gợi ý (Terms):**  
_“Sổ thu chi là công cụ hỗ trợ ghi chép và quản lý; mọi nghĩa vụ thuế và hóa đơn thuộc về chủ cửa hàng.”_

---

## 10. Storefront & khách cuối

- Trang công khai theo `slug` shop — **không cần** tài khoản app.
- Cần **thông báo ngắn** (khi public): dữ liệu đặt hàng được gửi cho **cửa hàng [tên shop]**; shop là bên quyết định cách dùng SĐT/địa chỉ.
- QR bàn: khách quét → web order; không cài app.

**Chưa có trong UI (roadmap):** Privacy riêng trên trang checkout storefront.

---

## 11. Quyền của người dùng (để ghi vào Privacy)

| Quyền                       | Thực tế hệ thống / cam kết dự kiến                           |
| --------------------------- | ------------------------------------------------------------ |
| Truy cập / sao chép dữ liệu | `[ ] Có quy trình — qua email support`                       |
| Sửa thông tin               | User sửa trong Account; shop sửa KH/đơn                      |
| Xóa tài khoản               | `[ ] Có API/UI` `[ ] Chỉ qua yêu cầu email` `[ ] Chưa`       |
| Rút đồng ý / ngừng dùng     | Ngừng đăng nhập; **điền:** xóa dữ liệu sau bao lâu?          |
| Khiếu nại                   | Email `[ ___ ]` — NĐ 13: có thể nêu cơ quan có thẩm quyền VN |

---

## 12. Đăng ký & đồng ý (gap hiện tại)

| Hạng mục                                 | Trạng thái code                 |
| ---------------------------------------- | ------------------------------- |
| Checkbox “Đồng ý Điều khoản & Privacy”   | **Có** trên `RegisterPage`      |
| Lưu thời điểm đồng ý (`acceptedTermsAt`) | **Chưa có** trong DB            |
| Trang `/terms`, `/privacy`               | **Có** (nháp markdown)          |

**Trước beta:** có bản nháp Terms + Privacy + checkbox + (khuyến nghị) lưu timestamp đồng ý.

---

## 13. Cookie & công nghệ trình duyệt

| Loại                                       | Mục đích              |
| ------------------------------------------ | --------------------- |
| `localStorage` — ngôn ngữ (`app.language`) | UX i18n               |
| Cookie `sidebar_state`                     | Trạng thái sidebar UI |
| JWT (memory / header)                      | Phiên đăng nhập       |

**Chưa dùng:** cookie quảng cáo, Google Analytics (nếu sau này bật → cần banner cookie / cập nhật Privacy).

---

## 14. Checklist trước khi mở đăng ký công khai

- [x] Điền mục **§1 Chủ thể** (Chu Thanh Trí)
- [x] Chốt **§8.1 Hoàn tiền** (A+B+C)
- [x] Chốt **§6** — server Singapore, backup chưa có (mục tiêu trước public), còn lại theo đề xuất
- [x] Viết nháp **Terms** — `docs/legal/DIEU-KHOAN-SU-DUNG.md` + `/terms`
- [x] Viết nháp **Privacy** — `docs/legal/CHINH-SACH-BAO-MAT.md` + `/privacy`
- [x] Footer landing: link Terms, Privacy, dòng vận hành
- [x] Checkbox đăng ký (chưa lưu `acceptedTermsAt` DB — khuyến nghị sau)
- HTTPS + domain production
- (Tuỳ chọn) Luật sư rà NĐ 13 / TMĐT

---

## 15. Outline nhanh — copy sang Terms / Privacy sau

### Terms (điều khoản) — các mục cần có

1. Chấp nhận điều khoản
2. Mô tả dịch vụ
3. Tài khoản & bảo mật mật khẩu
4. Gói dùng thử, phí, thanh toán CK, admin xác nhận
5. Hoàn tiền _(theo §8.1)_
6. Quyền sở hữu trí tuệ / nội dung shop upload
7. Giới hạn trách nhiệm & từ chối bảo đảm
8. Chấm dứt / khóa tài khoản
9. Thuế & hóa đơn _(disclaimer §9)_
10. Luật áp dụng & giải quyết tranh chấp (Việt Nam)
11. Liên hệ & thay đổi điều khoản

### Privacy (bảo mật) — các mục cần có

1. Phạm vi & chủ thể kiểm soát
2. Loại dữ liệu thu thập _(§3)_
3. Mục đích _(§4)_
4. Cơ sở pháp lý (hợp đồng, đồng ý, lợi ích hợp pháp)
5. Chia sẻ bên thứ ba _(§7)_
6. Thời gian lưu _(§6)_
7. Quyền của chủ thể dữ liệu _(§11)_
8. Bảo mật
9. Trẻ em (không hướng tới < 16 tuổi)
10. Chuyển dữ liệu xuyên biên giới _(nếu server nước ngoài)_
11. Cập nhật chính sách
12. Liên hệ

---

## 16. Ghi chú phiên bản

| Ngày       | Thay đổi                                                            |
| ---------- | ------------------------------------------------------------------- |
| 2026-05-20 | Tạo bản nội bộ đầu — khớp billing 3–12 tháng, MANUAL, trial 30 ngày |
| 2026-05-20 | §1 điền xong; §8.1 A+B+C, hoàn tiền trong 7 **ngày làm việc** |
| 2026-05-20 | §6 chốt: server **Singapore**, backup **chưa có**, 90 ngày / 12 tháng / 5 năm / 24 tháng |

_Khi đổi giá, cổng thanh toán, hoặc flow đăng ký — cập nhật file này trước khi sửa Terms/Privacy công khai._
