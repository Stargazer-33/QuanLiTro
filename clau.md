# Hệ thống quản lý phòng trọ

Tài liệu gồm hai phần: **ràng buộc khi viết code** (mục 0) và **đặc tả chức năng** theo vai trò (mục 1 trở đi).

---

## 0. Ràng buộc khi viết code (BẮT BUỘC ĐỌC TRƯỚC)

Người trong nhóm chỉ biết HTML, CSS, JavaScript cơ bản, nên code phải đơn giản, đọc là hiểu.

### 0.1. Được dùng / không được dùng
- **Được dùng:** HTML, CSS, JavaScript thuần. **Supabase** (CSDL + đăng nhập) gọi bằng `supabase-js` nạp qua thẻ `<script>` (CDN), không cần cài đặt.
- **Không dùng:** TypeScript, framework (React, Vue, Angular, Next.js...), Tailwind, `npm`/`node`/build, Edge Function hay bất kỳ code chạy trên server.
- **Tuyệt đối không đưa `service_role key` vào code frontend.** Chỉ dùng `anon key`.

### 0.2. Cấu trúc file: mỗi vai trò 1 bộ 3 file cùng tên

| Vai trò | HTML | CSS | JS |
|---|---|---|---|
| Đăng nhập | `html/dangnhap.html` | `css/dangnhap.css` | `js/dangnhap.js` |
| Chủ trọ | `html/admin.html` | `css/admin.css` | `js/admin.js` |
| Quản lý | `html/quanly.html` | `css/quanly.css` | `js/quanly.js` |
| Khách thuê | `html/khachthue.html` | `css/khachthue.css` | `js/khachthue.js` |

- Thêm 1 file dùng chung: `js/supabaseClient.js` (khởi tạo kết nối Supabase, các trang khác chỉ dùng lại).
- Tên file viết thường, không dấu, không cách. **Mỗi vai trò chỉ 1 bộ file**, không tách mỗi chức năng thành 1 trang.

### 0.3. Một trang, chỉ đổi nội dung chính
Mỗi trang vai trò có **menu bên trái cố định** và **một vùng `<main id="noidung">`**. Bấm menu chỉ thay nội dung trong `<main>`, không tải lại trang.
- Mỗi chức năng là 1 hàm trong `.js` của vai trò đó (ví dụ `hienHoaDon()`, `hienHopDong()`): lấy dữ liệu từ Supabase rồi gán HTML vào `#noidung`.

```js
const cacManHinh = { hopdong: hienHopDong, hoadon: hienHoaDon, suco: hienSuCo };
function chuyenManHinh(ten) {
  document.getElementById('noidung').innerHTML = 'Đang tải...';
  cacManHinh[ten]();
}
```

### 0.4. Quy ước viết code
- Chú thích **tiếng Việt**, mỗi hàm ghi rõ làm gì.
- Tên biến, tên hàm rõ nghĩa; hàm ngắn, mỗi hàm một việc.
- Dùng `async/await` + `try/catch`; hiển thị lỗi bằng tiếng Việt cho người dùng.

### 0.5. Ghi chú kỹ thuật: tạo tài khoản (mục 6.1) làm hoàn toàn ở frontend
- Tạo **một Supabase client phụ** với `persistSession: false`, dùng nó gọi `auth.signUp(...)` để cấp tài khoản. Nhờ vậy chủ trọ/quản lý đang thao tác **không bị đăng xuất**.
- Trong Supabase Dashboard: **tắt "Confirm email"** (Authentication → Providers → Email).
- Vì `signUp` bật công khai nên **bảo mật dựa vào RLS**: tài khoản không có vai trò hợp lệ trong bảng `profiles` thì không đọc/ghi được dữ liệu nào. **Bật RLS cho mọi bảng.**
- Sau khi tạo tài khoản, ghi vai trò và liên kết tài khoản với hồ sơ nhân viên/khách thuê.

---

## 1. Vai trò người dùng

| Vai trò | Phạm vi |
|---|---|
| Khách vãng lai | Xem trang giới thiệu, đăng nhập |
| Chủ trọ | Quản lý toàn bộ nhà trọ, nhân sự, tài khoản |
| Quản lý | Vận hành hằng ngày: phòng, khách, hợp đồng, điện nước, hóa đơn, thanh toán, sự cố |
| Khách thuê | Xem thông tin của chính mình, nhận thông báo, gửi sự cố |

Tài khoản **chủ trọ** tạo sẵn một lần trong Supabase Dashboard; các vai trò còn lại do hệ thống cấp.

---

## 2. Khách vãng lai

### 2.1. Trang giới thiệu
Giới thiệu nhà trọ, tiện ích, loại phòng, dịch vụ (wifi, giữ xe, giặt ủi, camera...), liên hệ, giờ hỗ trợ; danh sách phòng kèm mô tả, giá, trạng thái trống.

### 2.2. Đăng nhập
- Nhập **tên đăng nhập** (là email; khách không có email dùng **số điện thoại**, xem 6.1) và mật khẩu; có nút hiện/ẩn mật khẩu và “Remember me”.
- Thành công: chuyển đến trang theo vai trò (`admin`, `quanly`, `khachthue`).
- Thất bại: báo lỗi rõ ràng. Tài khoản khóa: “Tài khoản đã bị khóa, vui lòng liên hệ chủ trọ”.
- Không có tự đăng ký; tài khoản do chủ trọ/quản lý cấp.

### 2.3. Mật khẩu tạm / quên mật khẩu
- Hệ thống **không gửi email**. Tài khoản mới hoặc được đặt lại dùng **mật khẩu tạm**; lần đăng nhập đầu **bắt buộc đổi mật khẩu** trước khi vào.
- Mật khẩu mới tối thiểu 8 ký tự, nhập lại để xác nhận, không trùng mật khẩu tạm.
- Quên mật khẩu: liên hệ chủ trọ/quản lý để được đặt lại mật khẩu tạm.

---

## 3. Chủ trọ (`admin`)

### 3.1. Tổng quan
Thống kê: tổng phòng, phòng đang thuê, phòng trống, tổng khách, tổng nhân viên, doanh thu đã thu trong tháng, tổng công nợ. Bảng hóa đơn gần đây. Truy cập nhanh tới phòng, khách, hóa đơn, chi phí.

### 3.2. Quản lý nhân viên
- Xem, tìm (họ tên, SĐT, email), thêm, sửa, xóa nhân viên.
- Thông tin: họ tên, SĐT, email (làm tên đăng nhập), chức vụ (quản lý cơ sở / kế toán / kỹ thuật), khu vực phụ trách.
- Cấp tài khoản quản lý (6.1), đặt lại mật khẩu tạm, khóa/mở tài khoản.
- Hiển thị trạng thái: “Đã cấp / Chưa cấp tài khoản”, “Đang hoạt động / Đã khóa”.

### 3.3. Quản lý phòng
- Xem, tìm (mã, tên, tầng), lọc theo trạng thái (trống / đang thuê / bảo trì), thêm, sửa, xóa.
- Thông tin: mã phòng, tên, tầng, giá thuê/tháng, diện tích, trạng thái.
- Ràng buộc: mã phòng không trùng; không xóa phòng đã có khách, hợp đồng, hóa đơn, chỉ số điện nước hoặc sự cố. Hợp đồng hiệu lực → phòng “Đang thuê”; hợp đồng kết thúc mà không còn hợp đồng khác → “Còn trống”.

### 3.4. Quản lý khách thuê
- Xem, tìm (họ tên, SĐT, CCCD, email, phòng), thêm, sửa, xóa hồ sơ.
- Thông tin: họ tên, SĐT, CCCD/CMND, email (không bắt buộc; bỏ trống thì dùng SĐT đăng nhập), địa chỉ thường trú, phòng đang ở (có thể để trống), ngày vào ở, trạng thái (đang thuê / đã rời đi).
- Cấp tài khoản, đặt lại mật khẩu tạm, khóa/mở tài khoản. Trạng thái tài khoản: chưa cấp / đã cấp / đã khóa.
- Khi chuyển khách sang “Đã rời đi”, hỏi có khóa tài khoản không.
- Ràng buộc: không xóa khách đã có hợp đồng, hóa đơn hoặc sự cố.

### 3.5. Quản lý hợp đồng
- Xem, tìm (mã, phòng, khách), lọc: đang hiệu lực / sắp hết hạn (≤ 30 ngày) / đã hết hạn / đã kết thúc.
- **Tạo hợp đồng** gồm 5 nhóm thông tin:
  1. **Hợp đồng và tài sản thuê:** mã hợp đồng, địa chỉ nhà trọ, phòng, mục đích thuê.
  2. **Bên cho thuê:** họ tên chủ nhà, CCCD, địa chỉ, SĐT.
  3. **Bên thuê đại diện:** họ tên, CCCD, SĐT, địa chỉ, người ở cùng, số người tối đa.
  4. **Thời hạn, tiền, thanh toán:** ngày bắt đầu/kết thúc, tiền thuê/tháng, tiền cọc, hạn thanh toán (ngày 1–28), phương thức (tiền mặt / chuyển khoản / khác), tài khoản nhận tiền, giá điện, giá nước, phí dịch vụ cố định.
  5. **Bàn giao, quyền nghĩa vụ, chấm dứt:** ngày bàn giao, hiện trạng phòng/thiết bị/chỉ số/chìa khóa, quyền nghĩa vụ hai bên và nội quy, số ngày báo trước khi chấm dứt, số ngày hoàn cọc, điều kiện chấm dứt sớm và khấu trừ cọc, thỏa thuận trễ hạn, tranh chấp, bổ sung, ngày ký, trạng thái (đang hiệu lực / đã kết thúc).
- Tự điền mặc định (mục đích thuê, số người tối đa, hạn thanh toán, giá điện/nước, phí dịch vụ, điều khoản mẫu, ngày ký); tự lấy CCCD/SĐT khi chọn khách; tự lấy giá khi chọn phòng.
- Ràng buộc: ngày kết thúc ≥ ngày bắt đầu; mã không trùng; mỗi phòng một hợp đồng hiệu lực.
- Xem chi tiết, in hợp đồng (đầy đủ hai bên, điều khoản, chữ ký).
- **Thanh lý:** xác nhận → hợp đồng “Đã kết thúc” → cập nhật trạng thái phòng. Không tự khóa tài khoản khách (xem 3.4).

### 3.6. Cấu hình giá dịch vụ
Xem, tìm, thêm, sửa, xóa dịch vụ (tên, đơn vị tính, đơn giá). Đơn giá dùng để tính hóa đơn mới.

### 3.7. Hóa đơn và thanh toán
- **Danh sách:** mã, kỳ, phòng, khách, tổng tiền, đã thu, trạng thái; tìm theo mã/kỳ/phòng/khách; lọc: chưa thanh toán / một phần / đã thanh toán / quá hạn / đã hủy; xem nhanh thành phần (phòng, điện, nước, dịch vụ).
- **Tạo hóa đơn:** chọn kỳ, phòng, nhập sản lượng điện, nước, hạn thanh toán. Hệ thống tự lấy khách từ hợp đồng hiệu lực và tự tính: tiền phòng + điện (sản lượng × đơn giá) + nước (sản lượng × đơn giá) + phí dịch vụ = tổng tiền. Không trùng hóa đơn cùng phòng cùng kỳ (đơn đã hủy không tính). Tự ghi/cập nhật chỉ số điện nước theo kỳ (đầu kỳ lấy từ kỳ trước, cuối kỳ = đầu kỳ + tiêu thụ).
- **Ghi nhận thanh toán:** chọn hóa đơn còn nợ, nhập số tiền, phương thức, ghi chú. Thu nhiều lần được; không thu vượt số còn nợ; không sửa số đã thu, mỗi khoản thu là một lần ghi riêng. Trạng thái tự cập nhật:
  - Chưa thanh toán: đã thu = 0.
  - Thanh toán một phần: 0 < đã thu < tổng.
  - Đã thanh toán: đã thu ≥ tổng.
  - Quá hạn: còn nợ và qua hạn (hiển thị kèm, ví dụ “Trả một phần · quá hạn”).
- **Hủy hóa đơn** (lập sai, có xác nhận): chuyển “Đã hủy”, giữ lịch sử, không tính vào doanh thu/công nợ. Hóa đơn đã có thanh toán thì không hủy được. Chỉ xóa hẳn khi chưa có khoản thanh toán nào.

### 3.8. Quản lý sự cố
- Xem, tìm (mã, phòng, khách, tiêu đề, phân loại), lọc theo trạng thái (mới / đang xử lý / đã hoàn thành).
- Chi tiết: mã, phòng, khách báo, tiêu đề, phân loại, mức độ (thấp / trung bình / cao), ngày gửi, trạng thái, mô tả.
- Tiếp nhận (Mới → Đang xử lý), đánh dấu hoàn thành (→ Đã hoàn thành). Khách không được đổi trạng thái.

### 3.9. Thông báo
Xem, tìm, tạo (tiêu đề, nội dung, ngày đăng tự động), xóa. Hiển thị cho mọi khách thuê của cơ sở.

### 3.10. Báo cáo doanh thu
Lọc theo tháng. Thống kê: doanh thu đã lập (không tính hóa đơn hủy), đã thu, chi phí, thu ròng = đã thu − chi phí. Bảng hóa đơn trong kỳ, xem nhanh thành phần.

### 3.11. Báo cáo công nợ
Thống kê: tổng công nợ, số tiền đã thu một phần, số hóa đơn quá hạn. Danh sách hóa đơn còn nợ (kỳ, phòng, khách, tổng, đã thu, còn lại, hạn), tìm kiếm, ghi nhận thanh toán nhanh.

### 3.12. Quản lý chi phí
Lọc theo tháng, tìm (tên khoản, danh mục, khu vực). Thêm/sửa/xóa khoản chi: ngày chi, tên, danh mục (sửa chữa / bảo trì / vận hành / khác), khu vực hoặc phòng, số tiền, ghi chú. Hiển thị tổng số khoản và tổng chi trong tháng.

### 3.13. Tài khoản chủ trọ
Xem email đăng nhập, đổi mật khẩu (tối thiểu 8 ký tự), đăng xuất về trang chủ.

---

## 4. Quản lý (`quanly`)

Vận hành hằng ngày trong phạm vi cơ sở được chủ trọ giao.

### 4.1. Quản lý phòng
Xem bảng phòng (STT, mã, tên, khu vực, diện tích, giá, trạng thái, ghi chú); thêm, sửa; cập nhật trạng thái (trống / đang thuê / bảo trì); ghi chú từng phòng.

### 4.2. Quản lý khách thuê
- Thống kê: tổng khách, số khách đang ở thực tế.
- Danh sách: mã, họ tên, quê quán, SĐT, CCCD, phòng, ngày vào, trạng thái ở, trạng thái tài khoản.
- Thêm/sửa hồ sơ (thông tin như 3.4). Tùy chọn **“Cấp tài khoản ngay”**: tạo mật khẩu tạm và hiển thị để đưa cho khách (6.1).
- Cấp tài khoản, đặt lại mật khẩu tạm, khóa/mở tài khoản khách.

### 4.3. Quản lý hợp đồng
- Xem danh sách (mã, phòng, khách, ngày bắt đầu/kết thúc, tiền cọc, trạng thái).
- Lập hợp đồng: chọn phòng **còn trống**, khách đại diện, ngày bắt đầu, thời hạn (6 / 12 / 24 tháng), tiền thuê, tiền cọc, ghi chú, thiết bị bàn giao, điều khoản thêm. Khách đại diện, ngày bắt đầu và thời hạn là bắt buộc.
- Xem chi tiết; thanh lý sau khi xác nhận.

### 4.4. Ghi chỉ số điện nước
- Chọn kỳ chốt, lọc theo khu vực/dãy. Mỗi phòng là một thẻ: mã, tên, khách, chỉ số điện/nước cũ, ô nhập chỉ số mới.
- Tự tính tiêu thụ = mới − cũ; cảnh báo khi chỉ số mới nhỏ hơn cũ.
- Trạng thái từng phòng: chưa chốt / đã chốt. Lưu từng phòng hoặc lưu tất cả một lần. Thống kê số phòng đã chốt.

### 4.5. Tạo hóa đơn
Chọn phòng/khách và kỳ; hiển thị tiền phòng, điện, nước, phí dịch vụ, tổng cộng; xác nhận tạo. Mỗi phòng một hóa đơn trong một kỳ.

### 4.6. Gửi link hóa đơn
- Danh sách hóa đơn cần gửi (phòng, mã, khách, tổng, trạng thái gửi) và thống kê: số cần gửi, đã gửi, lượt khách mở link.
- Xem trước tin nhắn (tên khách, kỳ, tổng tiền, đường dẫn). Chọn kênh Zalo / SMS / Email: quản lý **sao chép nội dung rồi tự gửi**.
- Sao chép link; đánh dấu “đã gửi” từng khách hoặc hàng loạt.
- **Link yêu cầu đăng nhập:** khách mở link sẽ được đưa tới đăng nhập rồi vào đúng hóa đơn, và chỉ mở được hóa đơn của mình.

### 4.7. Cập nhật thanh toán
- Chọn kỳ thu. Thống kê đã thu / chưa thu / quá hạn (số phòng + tổng tiền).
- Bảng Kanban 4 cột: Chưa thanh toán · Trả một phần · Quá hạn · Đã thanh toán. Thẻ hiển thị phòng, mã, khách, tổng, đã thu, còn lại, hạn thu.
- Nút **“Thu đủ”** (ghi nhận toàn bộ số còn nợ) và **“Thu một phần”** (nhập số tiền, phương thức như 3.7). Có xác nhận trước khi cập nhật. Thẻ quá hạn nằm ở cột “Quá hạn” cho đến khi thu đủ.

### 4.8. Quản lý sự cố
- Thống kê: mới, đang xử lý, đã hoàn thành trong tháng. Tìm (mã, phòng, tiêu đề), lọc theo mức độ.
- Phiếu: mã, phòng, mức độ, trạng thái, thời gian, tiêu đề, mô tả, người báo + SĐT, phân loại.
- Cập nhật tiến độ: trạng thái, thợ/đơn vị sửa, chi phí phát sinh; phân công thợ.
- **Tạo hộ khách** (khi khách báo qua điện thoại/Zalo): chọn phòng (khách báo lấy theo khách đang thuê), phân loại (điện / nước / cơ sở vật chất / vệ sinh / an ninh / khác), tiêu đề, mức độ, mô tả.

### 4.9. Tài khoản quản lý
Xem hồ sơ cá nhân; đổi mật khẩu (tối thiểu 8 ký tự, nhập lại xác nhận; có thể hiện gợi ý độ mạnh nhưng **chỉ tham khảo, không bắt buộc**); đăng xuất.

---

## 5. Khách thuê (`khachthue`)

Chỉ xem dữ liệu của chính mình và gửi báo cáo sự cố. Không được sửa phòng, hợp đồng, hóa đơn, tiền hay trạng thái sự cố.

### 5.1. Điều kiện truy cập
- Tài khoản chưa liên kết hồ sơ khách thuê: báo liên hệ chủ trọ, không tải dữ liệu.
- Chưa xếp phòng: báo chờ xếp phòng và lập hợp đồng.
- Đang dùng mật khẩu tạm: bắt buộc đổi mật khẩu trước (2.3).
- Tải dữ liệu lỗi: hiển thị lỗi và nút tải lại.

### 5.2. Tổng quan
Thẻ: phòng đang ở (tầng, giá), công nợ hiện tại, trạng thái hợp đồng + số ngày còn lại, số sự cố chưa xong. Hóa đơn gần nhất (kỳ, mã, tổng, hạn, đã trả, còn lại, trạng thái). Hai thông báo mới nhất, ba sự cố gần đây, thông tin khách (họ tên, SĐT, CCCD, email).

### 5.3. Báo cáo sự cố
- Gửi sự cố: tiêu đề (≤ 120 ký tự), phân loại (điện / nước / cơ sở vật chất / vệ sinh / an ninh / khác), mức độ, mô tả (≤ 1.000 ký tự).
- Hệ thống tự ghi mã, phòng, khách, người gửi, thời gian, trạng thái ban đầu “mới”.
- Xem lịch sử (mã, tiêu đề, mô tả, phân loại, mức độ, ngày gửi, trạng thái). Không được sửa, xóa hay đổi trạng thái.

### 5.4. Xem hóa đơn
- Danh sách: mã, kỳ, tổng, đã trả, còn lại, hạn, trạng thái (chưa thanh toán / trả một phần / đã thanh toán / quá hạn / trả một phần · quá hạn). Không hiện hóa đơn đã hủy.
- Chi tiết: tiền phòng, điện (sản lượng, tiền), nước (sản lượng, tiền), phí dịch vụ, tổng cộng, đã thanh toán, còn lại.
- Hóa đơn còn nợ: xem thông tin chuyển khoản (số tiền, tài khoản nhận lấy từ hợp đồng, nội dung chuyển khoản có nút sao chép). Khách báo chủ trọ sau khi chuyển; hệ thống không tự tạo giao dịch.

### 5.5. Hợp đồng thuê
- Xem: mã, phòng, ngày bắt đầu/hết hạn, tiền thuê, tiền cọc, trạng thái, thời gian còn lại.
- Điều khoản chi tiết: địa chỉ, mục đích thuê, chủ nhà, người thuê, người ở cùng, hạn và phương thức thanh toán, tài khoản nhận tiền, giá điện/nước/dịch vụ, bàn giao, quyền nghĩa vụ, báo trước chấm dứt, hoàn cọc, ngày ký.
- In hợp đồng. Chưa có hợp đồng: báo chờ chủ trọ lập.

### 5.6. Chỉ số điện nước
Xem theo kỳ (mới nhất trước, chỉ từ ngày bắt đầu hợp đồng): điện và nước đầu kỳ, cuối kỳ, tiêu thụ. Chưa có: báo chờ chủ trọ ghi nhận.

### 5.7. Thông báo
Danh sách thông báo của cơ sở (tiêu đề, ngày đăng, nội dung), mới nhất trước; chưa có thì hiện trạng thái trống.

### 5.8. Thành viên ở cùng
Xem danh sách (STT, họ tên, SĐT, CCCD/ghi chú, vai trò, trạng thái). Chưa có danh sách chính thức thì tạm hiển thị từ “Người ở cùng” trong hợp đồng. Khách không được thêm/sửa/xóa. Mỗi phòng một tài khoản cho khách đại diện; người ở cùng không có tài khoản riêng.

### 5.9. Thông tin cá nhân
Chỉ xem: họ tên, SĐT, CCCD, tên đăng nhập, phòng, trạng thái hồ sơ. Muốn đổi phải liên hệ chủ trọ.

### 5.10. Đổi mật khẩu và đăng xuất
- Mật khẩu mới tối thiểu 8 ký tự, nhập lại xác nhận; báo lỗi nếu quá ngắn, không khớp hoặc cập nhật thất bại; báo thành công khi xong.
- Đăng xuất và quay về trang chủ.

---

## 6. Các luồng nghiệp vụ chính

### 6.1. Cấp tài khoản cho nhân viên / khách thuê (bằng mật khẩu tạm, không gửi email)
1. Chủ trọ (hoặc quản lý, chỉ với khách thuê) mở hồ sơ và bấm “Cấp tài khoản”.
2. Tên đăng nhập là email của hồ sơ; khách không có email thì dùng SĐT (tự quy đổi thành email nội bộ `soDienThoai@tenant.local`).
3. Hệ thống tạo mật khẩu tạm ngẫu nhiên, **chỉ hiển thị một lần** kèm nút sao chép.
4. Chủ trọ/quản lý đưa tên đăng nhập và mật khẩu tạm cho người dùng (nói trực tiếp hoặc Zalo/SMS).
5. Hệ thống gán vai trò và liên kết tài khoản với hồ sơ.
6. Người dùng đăng nhập lần đầu, bị buộc đổi mật khẩu, rồi vào đúng trang.
7. Quên mật khẩu: bấm “Đặt lại mật khẩu” → tạo mật khẩu tạm mới, lặp từ bước 3.
8. Khóa/mở: chủ trọ với nhân viên và khách; quản lý chỉ với khách.

### 6.2. Tạo hợp đồng và xếp phòng
Chọn phòng trống + khách → nhập thời hạn, tiền thuê, tiền cọc, điều khoản → lưu → phòng thành “Đang thuê” → hồ sơ khách cập nhật phòng → khách đăng nhập thấy hợp đồng và phòng của mình.

### 6.3. Lập hóa đơn và thu tiền
1. Ghi chỉ số điện nước (hoặc nhập sản lượng) → tạo hóa đơn theo kỳ; hệ thống tính tổng tiền.
2. Quản lý sao chép link gửi khách qua Zalo/SMS/Email, đánh dấu “đã gửi”.
3. Khách đăng nhập xem hóa đơn và thông tin chuyển khoản.
4. Khách thanh toán → quản lý/chủ trọ ghi nhận số tiền → hóa đơn thành “Thanh toán một phần” hoặc “Đã thanh toán”.
5. Công nợ và báo cáo doanh thu tự cập nhật.

### 6.4. Xử lý sự cố
Khách gửi sự cố (hoặc quản lý tạo hộ) → trạng thái “Mới” → chủ trọ/quản lý tiếp nhận → “Đang xử lý” (phân công thợ, ghi chi phí nếu có) → “Đã hoàn thành” → khách thấy trạng thái mới trong lịch sử.

### 6.5. Kết thúc hợp đồng
Đối chiếu công nợ, tiền cọc, tài sản bàn giao → xác nhận thanh lý → hợp đồng “Đã kết thúc” → phòng về “Còn trống” (nếu không còn hợp đồng hiệu lực) → khách không còn thấy hợp đồng là hiện tại → chuyển khách “Đã rời đi” và chọn khóa tài khoản nếu muốn (3.4).

---

## 7. Ma trận chức năng theo vai trò

| Chức năng | Chủ trọ | Quản lý | Khách thuê |
|---|:---:|:---:|:---:|
| Xem trang giới thiệu | ✔ | ✔ | ✔ |
| Đăng nhập / đổi mật khẩu | ✔ | ✔ | ✔ |
| Quản lý nhân viên | ✔ | ✘ | ✘ |
| Quản lý phòng | ✔ | ✔ | Chỉ xem phòng của mình |
| Quản lý khách thuê | ✔ | ✔ | Chỉ xem hồ sơ của mình |
| Cấp tài khoản / đặt lại mật khẩu / khóa-mở | ✔ (nhân viên, khách) | Chỉ khách thuê | ✘ |
| Quản lý hợp đồng | ✔ | ✔ | Chỉ xem và in của mình |
| Cấu hình giá dịch vụ | ✔ | ✘ | ✘ |
| Ghi chỉ số điện nước | ✔ | ✔ | Chỉ xem |
| Tạo hóa đơn | ✔ | ✔ | ✘ |
| Hủy hóa đơn | ✔ | ✘ | ✘ |
| Gửi link hóa đơn | ✔ | ✔ | Nhận link |
| Ghi nhận thanh toán | ✔ | ✔ | Không tự ghi nhận |
| Xem hóa đơn / công nợ | ✔ | ✔ | Chỉ hóa đơn của mình |
| Gửi sự cố | ✘ | Tạo hộ khách | ✔ |
| Xử lý sự cố | ✔ | ✔ | Chỉ theo dõi |
| Đăng thông báo | ✔ | ✘ | Chỉ đọc |
| Báo cáo doanh thu / công nợ | ✔ | ✘ | ✘ |
| Quản lý chi phí | ✔ | Ghi chi phí sửa chữa | ✘ |
| Xem thành viên ở cùng | ✔ | ✔ | Chỉ xem |

---

## 8. Quy tắc nghiệp vụ dùng chung

### 8.1. Mã và trạng thái
- Mã phòng (trong cùng cơ sở) và mã hợp đồng không được trùng.
- Mỗi phòng: một hợp đồng hiệu lực; một hóa đơn (chưa hủy) mỗi kỳ; một bộ chỉ số điện nước mỗi kỳ.
- Tên trạng thái thống nhất:
  - Phòng: còn trống / đang thuê / bảo trì.
  - Sự cố: mới / đang xử lý / đã hoàn thành; mức độ thấp / trung bình / cao.
  - Hóa đơn: chưa thanh toán / thanh toán một phần / đã thanh toán / đã hủy; “quá hạn” là trạng thái hiển thị thêm.

### 8.2. Thời gian
Ngày kết thúc hợp đồng ≥ ngày bắt đầu. Hạn thanh toán hằng tháng từ ngày 1 đến 28. Hợp đồng còn ≤ 30 ngày là “Sắp hết hạn”. Hóa đơn qua hạn mà còn nợ là “Quá hạn”.

### 8.3. Tiền và thanh toán
- Tiền thuê, cọc, đơn giá, số tiền chi và thanh toán không được âm.
- Tổng hóa đơn = tiền phòng + điện + nước + phí dịch vụ. Đã thu = tổng các lần thanh toán.
- Không thu vượt số còn nợ; không sửa trực tiếp số đã thu (ghi khoản mới).
- Hóa đơn lập sai thì **hủy** (giữ lịch sử); chỉ hóa đơn chưa có thanh toán mới được xóa hẳn.

### 8.4. Xóa dữ liệu
Không xóa phòng đang có dữ liệu liên quan; không xóa khách đã có hợp đồng, hóa đơn hoặc sự cố; xóa hợp đồng phải cập nhật lại trạng thái phòng; xóa thông báo chỉ ảnh hưởng thông báo đó.

### 8.5. Phân quyền và bảo mật
- Mỗi người chỉ vào đúng trang theo vai trò. Quản lý chỉ thao tác trong cơ sở được giao.
- Khách thuê chỉ thấy dữ liệu của chính mình, không sửa phòng, hợp đồng, hóa đơn, thanh toán, chỉ số điện nước hay trạng thái sự cố.
- Tài khoản bị khóa hoặc không có vai trò hợp lệ thì không đọc/ghi được dữ liệu (RLS của Supabase).
- Chủ trọ không thể bị cấp thành tài khoản quản lý hoặc khách thuê.
- Mật khẩu tạm chỉ hiển thị một lần, không lưu dạng chữ thường. Mật khẩu tối thiểu 8 ký tự ở mọi nơi đổi mật khẩu.

### 8.6. Thông báo và phản hồi
Mọi thao tác thêm/sửa/xóa phải báo thành công hoặc lỗi rõ ràng; xóa, hủy, thanh lý phải có xác nhận; lưu xong hiển thị lại dữ liệu ngay; tải lại trang không mất dữ liệu đã lưu.

---

## 9. Tiêu chí hoàn thành chức năng

Một chức năng được coi là xong khi:

1. Đăng nhập đúng vai trò và mở đúng trang.
2. Thêm/sửa/xóa hoặc gửi dữ liệu được.
3. Dữ liệu còn sau khi tải lại trang.
4. Ràng buộc và thông báo lỗi hoạt động đúng.
5. Người khác vai trò không làm được thao tác không có quyền; khách thuê không thấy dữ liệu của khách khác.
6. Trạng thái, số tiền, báo cáo cập nhật đúng sau thao tác.
7. Code chỉ gồm HTML, CSS, JavaScript thuần, có chú thích tiếng Việt, đúng mục 0 (mỗi vai trò 1 bộ file, bấm menu chỉ đổi `#noidung`).
