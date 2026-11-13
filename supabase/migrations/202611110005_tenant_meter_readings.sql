-- 1) Cho khách thuê đọc chỉ số điện nước của đúng phòng mình đang thuê,
--    kể cả khi bản ghi cũ chưa được gắn tenant_id.
drop policy if exists "tenant_read_room_meter_readings" on public.app_records;
create policy "tenant_read_room_meter_readings"
on public.app_records for select to authenticated
using (
  public.current_role() = 'tenant'
  and owner_id = public.current_owner_id()
  and table_name = 'chiso'
  and payload ->> 'phongId' = public.current_tenant_room_id()
);

-- 2) Trang giới thiệu công khai: chỉ cho phép đọc phòng còn trống và bảng giá dịch vụ.
grant select on public.app_records to anon;

drop policy if exists "public_read_available_rooms" on public.app_records;
create policy "public_read_available_rooms"
on public.app_records for select to anon
using (
  table_name = 'phong'
  and payload ->> 'trangThai' = 'trong'
);

drop policy if exists "public_read_services" on public.app_records;
create policy "public_read_services"
on public.app_records for select to anon
using (table_name = 'dichvu');
