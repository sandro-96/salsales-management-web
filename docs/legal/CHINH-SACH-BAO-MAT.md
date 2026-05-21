# Chính sách bảo mật & xử lý dữ liệu cá nhân — Sổ thu chi

**Phiên bản:** 1.0 (nháp)  
**Cập nhật:** 20/05/2026  
**Chủ vận hành / Bên kiểm soát (đối với tài khoản nền tảng):** Chu Thanh Trí (cá nhân)  
**Liên hệ:** [vmanage.sass@gmail.com](mailto:vmanage.sass@gmail.com) · +84 0348895626

> **Lưu ý:** Bản nháp; nên rà soát với Nghị định 13/2023/NĐ-CP trước khi công bố chính thức.

---

## 1. Phạm vi

Chính sách này mô tả cách **Sổ thu chi** thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu khi bạn:

- Đăng ký / đăng nhập tài khoản quản lý  
- Sử dụng POS, quản lý shop, storefront, QR bàn  
- Liên hệ hỗ trợ hoặc thanh toán phí gói dịch vụ  

Không áp dụng cho website hoặc ứng dụng của bên thứ ba (Google, ngân hàng…) — xem chính sách của họ.

---

## 2. Vai trò đối với dữ liệu

| Loại dữ liệu | Vai trò của Chu Thanh Trí / Sổ thu chi |
| ------------ | --------------------------------------- |
| Tài khoản user (email, họ tên, SĐT, đăng nhập…) | **Bên kiểm soát** dữ liệu (chủ yếu) |
| Khách hàng, đơn hàng, sản phẩm **của từng shop** | **Bên xử lý** theo chỉ đạo của **chủ shop**; chủ shop là bên quyết định mục đích kinh doanh với khách của họ |
| Khách đặt qua **storefront / QR** (không có tài khoản app) | Dữ liệu gửi cho **cửa hàng** tương ứng; nền tảng lưu để hoàn tất đơn |

---

## 3. Dữ liệu chúng tôi thu thập

### 3.1. Tài khoản người dùng

Email, họ tên, tên đệm (nếu có), số điện thoại, mật khẩu (lưu dạng mã hóa một chiều), quốc gia; thông tin Google khi đăng nhập OAuth (email, tên, ảnh đại diện theo phạm vi bạn cho phép); thời gian đăng nhập; tùy chọn: địa chỉ, ngày sinh, giới tính, ngôn ngữ.

### 3.2. Shop & vận hành

Tên shop, địa chỉ, SĐT, logo, MST (nếu nhập), cấu hình thuế, sản phẩm, đơn hàng, tồn kho, nhân viên, khuyến mãi, báo cáo, lịch sử gói và giao dịch thanh toán phí SaaS.

### 3.3. Khách cuối (storefront / QR)

Tên, SĐT, địa chỉ giao hàng (nếu khách nhập), nội dung đơn — **không yêu cầu** tài khoản Sổ thu chi.

### 3.4. Kỹ thuật

Nhật ký thao tác (audit), log hỗ trợ, cookie `sidebar_state`, `localStorage` ngôn ngữ, phiên JWT.

**Chúng tôi không** bán dữ liệu cá nhân. **Chưa sử dụng** cookie quảng cáo / Google Analytics (sẽ cập nhật chính sách nếu bật sau).

---

## 4. Mục đích xử lý

- Cung cấp và duy trì tài khoản, xác thực email  
- Vận hành tính năng POS, đơn hàng, kho, báo cáo, storefront, QR  
- Thu phí gói, xác nhận chuyển khoản, gia hạn subscription  
- Hỗ trợ kỹ thuật, xử lý khiếu nại, bảo mật, chống lạm dụng  
- Tuân thủ nghĩa vụ pháp lý (nếu có yêu cầu hợp lệ từ cơ quan nhà nước)

---

## 5. Cơ sở xử lý (tham khảo NĐ 13)

- **Thực hiện hợp đồng / dịch vụ** bạn yêu cầu (điều khoản sử dụng)  
- **Đồng ý** của bạn khi đăng ký  
- **Lợi ích hợp pháp:** bảo mật hệ thống, cải thiện dịch vụ, xử lý tranh chấp phí gói  

---

## 6. Chia sẻ với bên thứ ba

| Bên | Mục đích |
| --- | -------- |
| **Google** | Đăng nhập OAuth (theo cấu hình Google) |
| **Nhà cung cấp email (SMTP)** | Gửi email xác thực, quên mật khẩu |
| **Hạ tầng máy chủ / cơ sở dữ liệu** | Lưu trữ và vận hành (hiện đặt tại **Singapore**) |

Không chia sẻ cho mục đích marketing của bên thứ ba. Chỉ tiết lộ khi pháp luật yêu cầu hoặc bảo vệ quyền lợi hợp pháp.

**Admin hệ thống** có thể truy cập khi hỗ trợ (có thể dùng chế độ impersonation có ghi log); nhân viên vận hành chỉ truy cập khi cần thiết.

---

## 7. Lưu trữ, địa điểm và thời gian

- **Máy chủ:** Singapore — dữ liệu có thể được **chuyển / lưu trữ ngoài lãnh thổ Việt Nam** để vận hành dịch vụ.  
- **Truyền tải:** HTTPS trên môi trường production.  
- **Mã hóa khi lưu:** theo tiêu chuẩn nhà cung cấp hạ tầng / cơ sở dữ liệu.  
- **Sao lưu định kỳ:** đang triển khai (mục tiêu: hàng ngày, giữ 30 ngày); sẽ cập nhật chính sách khi có.

| Loại dữ liệu | Thời gian lưu (chính sách nội bộ) |
| ------------ | --------------------------------- |
| Tài khoản đang hoạt động | Trong thời gian sử dụng dịch vụ |
| Yêu cầu **xóa tài khoản** | Xóa mềm ngay; xóa cứng / ẩn danh hóa trong **90 ngày** (trừ giao dịch gói) |
| Giao dịch gói & thanh toán SaaS | Tối đa **5 năm** |
| Shop **hết hạn gói** (EXPIRED) | Giữ tối thiểu **12 tháng** (có thể chỉ xem); sau đó có thể nhắc gia hạn hoặc dọn theo chính sách shop không hoạt động |
| Audit log | **24 tháng** |
| Log kỹ thuật (nếu có) | **90 ngày** |

---

## 8. Bảo mật

Chúng tôi áp dụng các biện pháp hợp lý: phân quyền theo shop, mật khẩu hash, HTTPS, hạn chế quyền admin, ghi log thao tác. Không có hệ thống nào an toàn tuyệt đối — bạn cần bảo vệ mật khẩu và thiết bị của mình.

Nếu phát hiện sự cố rò rỉ dữ liệu ảnh hưởng đến bạn, chúng tôi sẽ thông báo trong khả năng cho phép của pháp luật.

---

## 9. Quyền của bạn

Bạn có thể yêu cầu (qua **vmanage.sass@gmail.com**):

- Truy cập, chỉnh sửa thông tin tài khoản (một phần trong mục Tài khoản)  
- Xóa tài khoản (xác minh qua email đã đăng ký)  
- Rút đồng ý (ngừng sử dụng); xử lý dữ liệu còn lại theo mục 7  
- Khiếu nại về xử lý dữ liệu  

Phản hồi trong thời hạn hợp lý (mục tiêu **15 ngày làm việc**). Bạn có quyền khiếu nại đến cơ quan quản lý nhà nước có thẩm quyền về bảo vệ dữ liệu cá nhân tại Việt Nam theo quy định hiện hành.

---

## 10. Trẻ em

Dịch vụ hướng tới người **từ 16 tuổi trở lên** (hoặc đủ năng lực hành vi dân sự theo pháp luật). Không cố ý thu thập dữ liệu trẻ em. Nếu phát hiện, chúng tôi sẽ xóa khi có thể.

---

## 11. Storefront và khách đặt hàng

Khi khách đặt qua trang storefront hoặc QR của shop, dữ liệu họ nhập được gửi đến **chủ cửa hàng** đó để xử lý đơn. Chủ shop cần thông báo cho khách của mình về cách dùng SĐT/địa chỉ (chính sách riêng của shop).

---

## 12. Cookie và công nghệ trình duyệt

- **Cookie `sidebar_state`:** ghi nhớ trạng thái thanh menu (UI).  
- **`localStorage`:** ngôn ngữ giao diện.  
- **JWT:** phiên đăng nhập.

Bạn có thể xóa cookie / dữ liệu trình duyệt; một số tính năng có thể không hoạt động đúng.

---

## 13. Cập nhật chính sách

Chúng tôi có thể sửa Chính sách; phiên bản mới có ngày **Cập nhật** ở đầu trang. Tiếp tục sử dụng dịch vụ sau khi đăng tải được hiểu là bạn biết đến thay đổi, trừ khi pháp luật yêu cầu hình thức thông báo khác.

---

## 14. Liên hệ

**Chu Thanh Trí** — vận hành Sổ thu chi  
Email: **vmanage.sass@gmail.com**  
Điện thoại: **+84 0348895626**
