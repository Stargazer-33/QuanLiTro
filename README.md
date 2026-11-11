# L.Maria · Hệ thống quản lý phòng trọ

Ứng dụng quản lý nhà trọ thuần **HTML, CSS, JavaScript**, không có backend và không cần
cài đặt thư viện. Toàn bộ dữ liệu được lưu trong `localStorage` của trình duyệt, nên có thể
chạy hoàn toàn offline sau khi tải trang.

## Cách chạy

Nên chạy qua một static server để đường dẫn tương đối hoạt động ổn định:

```bash
# Cách 1: Python (nếu đã cài)
python -m http.server 8000

# Cách 2: tiện ích Live Server trong VS Code
# Mở thư mục dự án và chọn "Open with Live Server"
```

Sau đó mở `http://localhost:8000/`.

Cũng có thể mở trực tiếp `index.html` bằng trình duyệt. Lưu ý mỗi trình duyệt có thể
quản lý `localStorage` của trang `file://` theo cách khác nhau; dùng static server sẽ ổn định hơn.

## Tài khoản dùng thử

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
|---|---|---|---|
| Chủ trọ | `admin@ancu.vn` | `12345678` | Toàn quyền quản lý |
| Quản lý | `quanly@ancu.vn` | `12345678` | Vận hành hằng ngày |
| Khách thuê | `an@ancu.vn` | `12345678` | Đang ở phòng P101 |
| Khách thuê | `0923456789@tenant.local` | `Tam@864209` | Mật khẩu tạm, buộc đổi khi đăng nhập |
| Khách thuê | `mai@ancu.vn` | `12345678` | Chưa được xếp phòng |
| Khách thuê | `bich@ancu.vn` | `12345678` | Tài khoản đang bị khóa |

Trang đăng nhập có danh sách tài khoản mẫu; bấm vào một dòng để điền nhanh.

## Cấu trúc

```
index.html                 Trang giới thiệu
html/dangnhap.html         Đăng nhập
html/admin.html            Trang chủ trọ
html/quanly.html           Trang quản lý
html/khachthue.html        Trang khách thuê

css/chung.css              Hệ thống giao diện dùng chung
css/trangchu.css           Giao diện trang giới thiệu
css/dangnhap.css           Giao diện đăng nhập
css/admin.css              Tinh chỉnh cho chủ trọ
css/quanly.css             Tinh chỉnh cho quản lý
css/khachthue.css          Tinh chỉnh cho khách thuê

js/dulieu.js               Dữ liệu mẫu, CRUD, đăng nhập, nghiệp vụ tính tiền
js/chung.js                Định dạng, hộp thoại, khung trang, in hợp đồng
js/trangchu.js             Hiển thị phòng trống và bảng giá
js/dangnhap.js             Xử lý đăng nhập và chuyển trang theo vai trò
js/admin.js                Màn hình riêng của chủ trọ
js/quanly.js               Màn hình riêng của quản lý
js/nghiepvu.js             Màn hình phòng, khách, hợp đồng, hóa đơn, sự cố dùng chung
js/khachthue.js            Màn hình khách thuê
```

Mỗi trang vai trò chỉ có một bộ ba file HTML/CSS/JS. Menu bên trái cố định, khi bấm chỉ
thay nội dung trong `<main id="noidung">`.

## Chức năng chính

- **Chủ trọ:** tổng quan, nhân viên và tài khoản, phòng, khách thuê, hợp đồng, giá dịch vụ,
  hóa đơn và thanh toán, sự cố, thông báo, báo cáo doanh thu, công nợ, chi phí.
- **Quản lý:** phòng, khách thuê, hợp đồng, ghi chỉ số điện nước, tạo hóa đơn, gửi link hóa đơn,
  Kanban thanh toán, xử lý sự cố, tài khoản cá nhân.
- **Khách thuê:** tổng quan, hóa đơn và thông tin chuyển khoản, hợp đồng và in hợp đồng,
  chỉ số điện nước, thông báo, gửi sự cố, thành viên ở cùng, thông tin cá nhân, đổi mật khẩu.

Các ràng buộc nghiệp vụ được xử lý trong `js/dulieu.js` và từng màn hình: mã phòng không trùng,
mỗi phòng một hợp đồng hiệu lực, mỗi phòng một hóa đơn mỗi kỳ, không thu vượt số nợ, hóa đơn
đã có thanh toán thì không xóa, khách thuê chỉ thấy dữ liệu của mình.

## Đặt lại dữ liệu mẫu

Mở DevTools → Console và chạy:

```js
localStorage.removeItem('ancu_db_v1');
location.reload();
```

Hoặc xóa dữ liệu trang web trong phần cài đặt trình duyệt. Dữ liệu sẽ được tạo lại từ bộ mẫu
trong `js/dulieu.js` ở lần tải tiếp theo.

## Ghi chú kỹ thuật

- Không dùng framework, TypeScript, npm, build hay code chạy trên server.
- Mật khẩu trong bộ dữ liệu mẫu chỉ phục vụ minh họa và được lưu dạng văn bản trong
  `localStorage`. Khi triển khai thật, cần thay lớp dữ liệu bằng backend có xác thực và mã hóa.
- Lớp dữ liệu được tách riêng trong `js/dulieu.js` để có thể thay bằng API/Supabase sau này
  mà không phải sửa toàn bộ giao diện.
