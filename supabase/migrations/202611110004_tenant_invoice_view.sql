-- Khách thuê được ghi nhận lượt mở link hóa đơn của chính mình.
-- Không cấp quyền update trực tiếp bảng app_records cho vai trò tenant.

create or replace function public.increment_invoice_view(p_invoice_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := public.current_owner_id();
  v_tenant text := public.current_tenant_id();
begin
  if public.current_role() is distinct from 'tenant' then
    raise exception 'Only tenants can record invoice views';
  end if;

  update public.app_records r
  set payload = jsonb_set(
        r.payload,
        '{luotMo}',
        to_jsonb(coalesce((r.payload ->> 'luotMo')::integer, 0) + 1),
        true
      )
  where r.owner_id = v_owner
    and r.table_name = 'hoadon'
    and r.record_id = p_invoice_id
    and r.tenant_id = v_tenant;

  if not found then
    raise exception 'Invoice not found for this tenant';
  end if;
end
$$;

revoke all on function public.increment_invoice_view(text) from public;
grant execute on function public.increment_invoice_view(text) to authenticated;
