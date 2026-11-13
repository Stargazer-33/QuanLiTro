# L.Maria · Hệ thống quản lý phòng trọ

Ứng dụng quản lý nhà trọ thuần **HTML, CSS, JavaScript**. Khi có cấu hình trong
`js/supabase-config.js`, đăng nhập và dữ liệu nghiệp vụ dùng Supabase Auth/Postgres.
Không có cấu hình thì ứng dụng chạy bằng localStorage; lần đầu mở trang đăng nhập sẽ
hiện biểu mẫu tạo tài khoản chủ trọ.

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

## Chế độ localStorage

Khi chưa cấu hình Supabase, dữ liệu được lưu trong trình duyệt. Lần đầu mở
`html/dangnhap.html`, hệ thống hiện biểu mẫu tạo tài khoản chủ trọ đầu tiên; sau đó chủ trọ
có thể tạo cơ sở, phòng và cấp tài khoản cho quản lý, khách thuê.

Chế độ này chỉ dùng để chạy thử, không dùng cho dữ liệu thật. Xem mục
[Đặt lại dữ liệu local](#đặt-lại-dữ-liệu-local) khi cần xoá sạch dữ liệu trong trình duyệt.

Để thử đủ 3 vai trò, đăng nhập bằng tài khoản chủ trọ hiện có rồi vào
**Tài khoản → Nạp bộ dữ liệu thử**. Nếu chưa có tài khoản nào, trang đăng nhập cũng có nút
**Nạp bộ dữ liệu thử** để tạo nhanh. Bộ dữ liệu này thay toàn bộ dữ liệu local và tạo sẵn
các tài khoản sau (trang đăng nhập cũng hiện danh sách để điền nhanh):

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
|---|---|---|---|
| Chủ trọ | `admin@ancu.vn` | `12345678` | Toàn quyền quản lý |
| Quản lý | `quanly@ancu.vn` | `12345678` | Phụ trách cơ sở Khu A |
| Quản lý | `quanly.b@ancu.vn` | `12345678` | Phụ trách cơ sở Khu B |
| Khách thuê | `an@ancu.vn` | `12345678` | Đang ở phòng P101 |
| Khách thuê | `0923456789@tenant.local` | `Tam@864209` | Mật khẩu tạm, buộc đổi khi đăng nhập |
| Khách thuê | `mai@ancu.vn` | `12345678` | Chưa được xếp phòng |
| Khách thuê | `bich@ancu.vn` | `12345678` | Tài khoản đang bị khóa |

## Cấu trúc

```
index.html                 Trang giới thiệu
html/dangnhap.html         Đăng nhập
html/datlaimatkhau.html    Đặt mật khẩu qua liên kết email Supabase
html/admin.html            Trang chủ trọ
html/quanly.html           Trang quản lý
html/khachthue.html        Trang khách thuê

css/chung.css              Hệ thống giao diện dùng chung
css/trangchu.css           Giao diện trang giới thiệu
css/dangnhap.css           Giao diện đăng nhập
css/admin.css              Tinh chỉnh cho chủ trọ
css/quanly.css             Tinh chỉnh cho quản lý
css/khachthue.css          Tinh chỉnh cho khách thuê

js/dulieu.js               Lớp dữ liệu localStorage/Supabase, CRUD, đăng nhập, nghiệp vụ tính tiền
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
  cơ sở, hóa đơn và thanh toán, sự cố, thông báo, báo cáo doanh thu, công nợ, chi phí.
- **Quản lý:** phòng, khách thuê, hợp đồng, ghi chỉ số điện nước, tạo hóa đơn, gửi link hóa đơn,
  Kanban thanh toán, xử lý sự cố, tài khoản cá nhân; chỉ xem và vận hành cơ sở được chủ trọ phân công.
- **Khách thuê:** tổng quan, hóa đơn và thông tin chuyển khoản, hợp đồng và in hợp đồng,
  tìm/lọc hóa đơn, chỉ số điện nước, thông báo, gửi và theo dõi chi tiết sự cố,
  thành viên ở cùng, cập nhật thông tin liên hệ, đổi mật khẩu.

Chủ trọ có thể quản lý nhiều cơ sở; mỗi cơ sở được gán tối đa một quản lý và một quản lý chỉ phụ trách
một cơ sở. Khi tạo phòng hoặc hồ sơ khách thuê, chọn cơ sở tương ứng. Các ràng buộc nghiệp vụ được
xử lý trong `js/dulieu.js` và từng màn hình: mã phòng không trùng,
mỗi phòng một hợp đồng hiệu lực, mỗi phòng một hóa đơn mỗi kỳ, không thu vượt số nợ, hóa đơn
đã có thanh toán thì không xóa, khách thuê chỉ thấy dữ liệu của mình.

## Backend Supabase

Migration nền tảng nằm tại
[`supabase/migrations/202611110001_initial_backend.sql`](./supabase/migrations/202611110001_initial_backend.sql).
Migration tạo profile người dùng, bảng dữ liệu JSONB, ràng buộc cơ bản và Row Level Security
cho chủ trọ, quản lý cơ sở, khách thuê. Không chạy lại trên project đã có các bảng này.
Sau đó chạy một lần migration
[`supabase/migrations/202611110002_profile_self_update.sql`](./supabase/migrations/202611110002_profile_self_update.sql)
để cho phép user đặt lại cờ đổi mật khẩu mà không cấp quyền sửa vai trò/hồ sơ liên kết.
Cuối cùng chạy
[`supabase/migrations/202611110003_secure_profile_updates.sql`](./supabase/migrations/202611110003_secure_profile_updates.sql)
để chỉ cho phép chủ trọ cập nhật trạng thái hồ sơ của nhân viên/khách thuê; user chỉ tự bỏ cờ
bắt buộc đổi mật khẩu sau khi đã đổi mật khẩu thành công.

Nếu chưa cài database, chạy migration một lần trong **Supabase → SQL Editor**. Tạo người dùng
chủ trọ đầu tiên tại **Authentication → Users**, sau đó tạo profile theo hướng dẫn trong
[`supabase/bootstrap_owner.sql`](./supabase/bootstrap_owner.sql). Nếu profile đã tạo và đăng nhập
được thì bỏ qua các bước này.

### Cấu hình frontend và cấp tài khoản

1. Với Netlify, thêm biến môi trường `SUPABASE_URL` và
   `SUPABASE_PUBLISHABLE_KEY` trong **Site configuration → Environment variables**.
   `netlify.toml` sẽ tạo `js/supabase-config.js` khi build; không cần ghi key vào Git.
   Có thể dùng `SUPABASE_ANON_KEY` thay cho `SUPABASE_PUBLISHABLE_KEY` nếu project dùng anon key cũ.
   Publishable/anon key là khóa công khai và sẽ được trình duyệt tải xuống; biến môi trường build
   không biến nó thành bí mật. Không bao giờ đưa `service_role` hoặc secret key vào frontend.
   Bảo vệ dữ liệu bằng RLS và policy trong Supabase.
2. Để chạy Supabase local mà không đăng nhập tài khoản Supabase, cài Docker và Supabase CLI.
   Nếu chưa có `supabase/config.toml`, chạy `supabase init` một lần, rồi khởi động stack local:

   ```text
   supabase start
   supabase migration up
   ```

   Lấy API URL và `anon` key trong kết quả `supabase start` (hoặc chạy `supabase status`).
   Tạo người dùng trong Supabase Studio local (URL thường là `http://127.0.0.1:54323`), rồi tạo
   profile tương ứng trong database local. Người dùng Auth trên cloud không tự xuất hiện ở local.
   Không thể bỏ key: Supabase API, kể cả local, vẫn cần publishable/anon key; dùng key local do CLI
   cấp, tuyệt đối không dùng `service_role`/secret key ở frontend. Tạo cấu hình cho ứng dụng trong
   PowerShell tại thư mục dự án (thay giá trị bên dưới bằng thông tin local):

   ```powershell
   $env:SUPABASE_URL = "http://127.0.0.1:54321"
   $env:SUPABASE_ANON_KEY = "<local-anon-key>"
   node scripts/generate-supabase-config.js
   python -m http.server 8000
   ```

   Mở `http://localhost:8000/`. Khi đổi lại sang Supabase hosted, đặt URL HTTPS và publishable/anon
   key của project hosted rồi chạy lại script. File cấu hình sinh ra là `js/supabase-config.js`.
3. Với Supabase hosted, dùng static server (không mở trang bằng `file://`). Trong Supabase, mở **Authentication →
   URL Configuration** và thêm địa chỉ trang đăng nhập cùng trang đặt lại mật khẩu vào
   **Redirect URLs**, ví dụ `http://localhost:8000/html/dangnhap.html` và
   `http://localhost:8000/html/datlaimatkhau.html`. Khi deploy, thêm hai URL tương ứng trên domain thật.
4. Cài Supabase CLI, mở terminal tại thư mục dự án, liên kết project hosted và deploy Edge Function:

   ```text
   supabase login
   supabase link --project-ref <project-ref>
   supabase functions deploy invite-user
   ```

   Project ref nằm trong Project URL. Function xác minh người gọi là chủ trọ đang hoạt động,
   tạo tài khoản Supabase Auth kèm mật khẩu tạm rồi tạo profile; service-role key chỉ được
   dùng phía Supabase, không đặt trong mã nguồn.
5. Không cần cấu hình SMTP khi thử nghiệm: chủ trọ cấp tài khoản là người dùng đăng nhập
   được ngay bằng email và mật khẩu hiện trong hộp thoại. Hãy sao chép mật khẩu đó trước khi đóng.
6. Đăng nhập bằng tài khoản chủ trọ đã tạo. Khi Supabase chưa có dữ liệu nghiệp vụ và
   muốn thử ứng dụng, chạy
   [`supabase/seed_mock_data.sql`](./supabase/seed_mock_data.sql) trong SQL Editor. Script
   SQL chỉ chạy khi có đúng một chủ trọ đang hoạt động và chủ trọ đó chưa có bản ghi
   nghiệp vụ; script sẽ từ chối nếu đã có dữ liệu để tránh trộn dữ liệu mẫu với dữ liệu
   thật. Dữ liệu mẫu không tạo tài khoản Supabase Auth; chỉ tài khoản chủ trọ hiện có
   đăng nhập được. Muốn thử vai trò quản lý hoặc khách thuê, hãy cấp tài khoản cho họ
   trong ứng dụng. Nếu có dữ liệu cũ trong localStorage, dùng riêng nút **Nhập dữ liệu cũ**.
7. Thêm cơ sở, hồ sơ quản lý/khách thuê rồi cấp tài khoản. Mỗi quản lý phải được phân công
   vào một cơ sở trước khi cấp tài khoản.

Tạo mới một project không tự động áp dụng migration; kiểm tra trong SQL Editor và không chạy
lặp lại nếu schema đã tồn tại. Kiểm tra đăng nhập, cấp tài khoản và phân quyền bằng từng vai trò
trước khi đưa dữ liệu thật vào.

## Đặt lại dữ liệu local

Mở DevTools → Console và chạy:

```js
localStorage.removeItem('ancu_db_v1');
localStorage.removeItem('ancu_phien_v1');
sessionStorage.removeItem('ancu_phien_tam_v1');
location.reload();
```

Hoặc xóa dữ liệu trang web trong phần cài đặt trình duyệt. Ứng dụng sẽ khởi động với dữ
liệu trống và hiện biểu mẫu tạo tài khoản chủ trọ ở trang đăng nhập.

## Ghi chú kỹ thuật

- Không dùng framework hoặc build frontend; SDK Supabase được tải từ CDN.
- Chế độ localStorage chỉ dùng để chạy thử; không dùng mật khẩu ở đó cho Supabase hoặc
  môi trường thật.
- Dữ liệu cũ được nâng cấp tự động: các phòng hiện có được gán vào một cơ sở chính để giữ nguyên
  hoạt động; chủ trọ có thể tạo thêm cơ sở và phân công quản lý trong mục **Cơ sở**.
- Lớp dữ liệu và Supabase Auth nằm trong `js/dulieu.js`; phân quyền dữ liệu cần tiếp tục được
  kiểm thử trên Supabase bằng từng vai trò trước khi triển khai thật.
