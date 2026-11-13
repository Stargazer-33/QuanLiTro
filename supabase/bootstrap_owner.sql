-- Tạo profile chủ trọ cho một user đã có trong Supabase Auth.
-- Bước 1: Supabase Dashboard > Authentication > Users > Add user
--         (nhập email + mật khẩu, bật "Auto Confirm User").
-- Bước 2: sửa email bên dưới rồi chạy toàn bộ file này trong SQL Editor.

insert into public.profiles (
  id, owner_id, role, full_name, email,
  employee_id, tenant_id, facility_id, active, must_change_password
)
select
  u.id,
  null,
  'owner',
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
  lower(u.email),
  null,
  null,
  null,
  true,
  false
from auth.users u
where lower(u.email) = lower('admin@gmail.com')
on conflict (id) do update
set role = 'owner',
    owner_id = null,
    employee_id = null,
    tenant_id = null,
    facility_id = null,
    active = true,
    must_change_password = false;

-- Kiểm tra kết quả:
select id, role, full_name, email, active
from public.profiles
where role = 'owner';
