-- Bật Supabase Realtime cho dữ liệu ứng dụng và hồ sơ người dùng.
-- Nhờ đó trang đang mở tự cập nhật khi có thay đổi từ tab, thiết bị
-- hoặc vai trò khác mà không cần tải lại trang.
-- Chạy một lần: Supabase → SQL Editor → dán nội dung này → Run
-- (hoặc `supabase db push` nếu dùng CLI).

-- Thêm bảng vào publication realtime (bỏ qua nếu đã được thêm trước đó).
do $$
begin
  alter publication supabase_realtime add table public.app_records;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

-- Cần replica identity full để sự kiện update/delete mang đủ dữ liệu cũ
-- và để Realtime kiểm tra Row Level Security trên từng dòng.
alter table public.app_records replica identity full;
alter table public.profiles replica identity full;
