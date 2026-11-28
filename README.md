# L.Maria · Hệ thống quản lý phòng trọ

Ứng dụng quản lý nhà trọ thuần **HTML, CSS, JavaScript**. Đăng nhập và dữ liệu nghiệp vụ
được lấy từ Supabase Auth/Postgres; ứng dụng yêu cầu cấu hình trong `js/supabase-config.js`
và không nạp dữ liệu mẫu hay dùng dữ liệu nghiệp vụ lưu trong trình duyệt.

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

js/dulieu.js               Lớp dữ liệu Supabase, CRUD, đăng nhập, nghiệp vụ tính tiền
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
Chạy tiếp
[`supabase/migrations/202611110004_tenant_invoice_view.sql`](./supabase/migrations/202611110004_tenant_invoice_view.sql)
để khách thuê tăng được lượt mở hóa đơn, và
[`supabase/migrations/202611110005_tenant_meter_readings.sql`](./supabase/migrations/202611110005_tenant_meter_readings.sql)
để khách thuê đọc được chỉ số điện nước của phòng mình cùng dữ liệu công khai cho trang giới thiệu.
Chạy thêm
[`supabase/migrations/202611210001_bat_realtime.sql`](./supabase/migrations/202611210001_bat_realtime.sql)
để bật Realtime: trang đang mở sẽ tự cập nhật khi dữ liệu thay đổi từ tab, thiết bị hoặc vai trò
khác. Nếu bỏ qua migration này, ứng dụng vẫn tự quét lại mỗi 20 giây nhưng không cập nhật tức thì.

Nếu chưa cài database, chạy migration một lần trong **Supabase → SQL Editor**. Tạo người dùng
chủ trọ đầu tiên tại **Authentication → Users** (bật Auto Confirm), sau đó chạy
[`supabase/bootstrap_owner.sql`](./supabase/bootstrap_owner.sql) sau khi sửa email trong file.
Cách nhanh hơn nếu có service role key:

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "MatKhau123!"
node scripts/create-admin.js
```

Script tạo/cập nhật user Auth và profile owner, sau đó in ra thông tin đăng nhập. Không commit
service role key.

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

   Có thể deploy mà không cần CLI: mở **Edge Functions → invite-user** trong Supabase Dashboard,
   dán toàn bộ nội dung `supabase/functions/invite-user/index.ts` rồi bấm **Deploy**. Bản mới dùng
   `admin.createUser` với `email_confirm: true` nên **không gửi email mời/xác nhận**; email chỉ là
   tên đăng nhập. Nếu gặp lỗi *email rate limit exceeded* nghĩa là đang chạy bản cũ dùng
   `inviteUserByEmail` — deploy lại hàm là hết.
5. Không cần cấu hình SMTP khi thử nghiệm: chủ trọ cấp tài khoản là người dùng đăng nhập
   được ngay bằng email và mật khẩu hiện trong hộp thoại. Hãy sao chép mật khẩu đó trước khi đóng.
   Nếu hồ sơ chưa có email, hệ thống tự dùng `SĐT@tenant.local` (hoặc mã hồ sơ nếu chưa có SĐT)
   làm tên đăng nhập; địa chỉ này không cần nhận thư. Hộp thoại có nút **Sao chép tin nhắn** để
   gửi qua Zalo/Messenger/SMS. Tài khoản dùng `@tenant.local` không nhận được thư đặt lại mật
   khẩu; khi quên, chủ trọ mở hồ sơ và bấm **Đặt lại mật khẩu** để cấp mật khẩu tạm mới.
6. Đăng nhập bằng tài khoản chủ trọ đã tạo. Thêm cơ sở, hồ sơ quản lý/khách thuê rồi cấp tài khoản.
   Có thể phân công quản lý vào cơ sở
   trước rồi mới cấp tài khoản; mỗi quản lý chỉ phụ trách một cơ sở.

Tạo mới một project không tự động áp dụng migration; kiểm tra trong SQL Editor và không chạy
lặp lại nếu schema đã tồn tại. Kiểm tra đăng nhập, cấp tài khoản và phân quyền bằng từng vai trò
trước khi đưa dữ liệu thật vào.

## Ghi chú kỹ thuật

- Không dùng framework hoặc build frontend; SDK Supabase được tải từ CDN.
- Session Supabase được SDK lưu trong trình duyệt; dữ liệu nghiệp vụ được tải và lưu qua Supabase.
- Lớp dữ liệu và Supabase Auth nằm trong `js/dulieu.js`; phân quyền dữ liệu cần tiếp tục được
  kiểm thử trên Supabase bằng từng vai trò trước khi triển khai thật.
