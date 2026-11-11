create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'tenant')),
  full_name text not null,
  email text not null,
  employee_id text,
  tenant_id text,
  facility_id text,
  active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_role_links check (
    (role = 'owner' and owner_id is null and employee_id is null and tenant_id is null and facility_id is null)
    or (role = 'manager' and owner_id is not null and employee_id is not null and tenant_id is null and facility_id is not null)
    or (role = 'tenant' and owner_id is not null and tenant_id is not null and employee_id is null)
  )
);

create unique index if not exists profiles_one_manager_per_facility
  on public.profiles (owner_id, facility_id)
  where role = 'manager';

create unique index if not exists profiles_unique_employee
  on public.profiles (owner_id, employee_id)
  where employee_id is not null;

create unique index if not exists profiles_unique_tenant
  on public.profiles (owner_id, tenant_id)
  where tenant_id is not null;

create table if not exists public.app_records (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  table_name text not null check (table_name in (
    'coso', 'phong', 'khach', 'nhanvien', 'hopdong', 'hoadon', 'chiso',
    'thanhtoan', 'suco', 'thongbao', 'chiphi', 'dichvu'
  )),
  record_id text not null,
  facility_id text,
  tenant_id text,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (owner_id, table_name, record_id)
);

create index if not exists app_records_scope_idx
  on public.app_records (owner_id, facility_id, table_name);

create index if not exists app_records_tenant_scope_idx
  on public.app_records (owner_id, tenant_id, table_name);

create unique index if not exists app_records_unique_room_code
  on public.app_records (owner_id, lower(payload ->> 'ma'))
  where table_name = 'phong';

create unique index if not exists app_records_one_active_contract_per_room
  on public.app_records (owner_id, (payload ->> 'phongId'))
  where table_name = 'hopdong' and payload ->> 'trangThai' = 'hieuluc';

create unique index if not exists app_records_one_invoice_per_room_period
  on public.app_records (owner_id, (payload ->> 'phongId'), (payload ->> 'ky'))
  where table_name = 'hoadon' and coalesce(payload ->> 'trangThai', '') <> 'huy';

create unique index if not exists app_records_one_meter_reading_per_room_period
  on public.app_records (owner_id, (payload ->> 'phongId'), (payload ->> 'ky'))
  where table_name = 'chiso';

create or replace function public.current_owner_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.owner_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.current_facility_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.facility_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.current_tenant_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.tenant_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.current_tenant_room_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.payload ->> 'phongId'
  from public.app_records r
  where r.owner_id = public.current_owner_id()
    and r.table_name = 'khach'
    and r.record_id = public.current_tenant_id()
  limit 1
$$;

create or replace function public.set_app_record_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_row public.app_records%rowtype;
  invoice_row public.app_records%rowtype;
begin
  new.updated_at := now();
  new.facility_id := null;
  new.tenant_id := null;

  if public.current_role() = 'tenant'
    and new.table_name = 'khach'
    and tg_op = 'UPDATE'
    and (
      new.payload ->> 'phongId' is distinct from old.payload ->> 'phongId'
      or new.payload ->> 'coSoId' is distinct from old.payload ->> 'coSoId'
    ) then
    raise exception 'Tenants cannot change their assigned room or facility';
  end if;

  if new.table_name = 'coso' then
    new.facility_id := new.record_id;
  elsif new.table_name = 'phong' then
    new.facility_id := new.payload ->> 'coSoId';
  elsif new.table_name = 'khach' then
    new.facility_id := new.payload ->> 'coSoId';
    new.tenant_id := new.record_id;
  elsif new.table_name in ('hopdong', 'hoadon', 'chiso', 'suco') then
    select r.* into room_row
    from public.app_records r
    where r.owner_id = new.owner_id
      and r.table_name = 'phong'
      and r.record_id = new.payload ->> 'phongId';
    if found then
      new.facility_id := room_row.facility_id;
      new.tenant_id := coalesce(new.payload ->> 'khachId', room_row.tenant_id);
    end if;
    if public.current_role() = 'tenant' and new.table_name = 'suco' then
      if new.payload ->> 'khachId' is distinct from public.current_tenant_id()
        or new.payload ->> 'phongId' is distinct from public.current_tenant_room_id() then
        raise exception 'Tenants can only report incidents for their assigned room';
      end if;
      new.tenant_id := public.current_tenant_id();
    end if;
  elsif new.table_name = 'thanhtoan' then
    select i.* into invoice_row
    from public.app_records i
    where i.owner_id = new.owner_id
      and i.table_name = 'hoadon'
      and i.record_id = new.payload ->> 'hoaDonId';
    if found then
      new.facility_id := invoice_row.facility_id;
      new.tenant_id := invoice_row.tenant_id;
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists app_records_set_scope on public.app_records;
create trigger app_records_set_scope
before insert or update on public.app_records
for each row execute function public.set_app_record_scope();

alter table public.profiles enable row level security;
alter table public.app_records enable row level security;

drop policy if exists "profiles_read_same_business" on public.profiles;
create policy "profiles_read_same_business"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (
    public.current_role() = 'owner'
    and owner_id = (select auth.uid())
  )
);

drop policy if exists "owner_manage_profiles" on public.profiles;
create policy "owner_manage_profiles"
on public.profiles for update to authenticated
using (
  public.current_role() = 'owner'
  and owner_id = (select auth.uid())
  and role <> 'owner'
)
with check (
  public.current_role() = 'owner'
  and owner_id = (select auth.uid())
  and role in ('manager', 'tenant')
);

drop policy if exists "app_records_read_scoped" on public.app_records;
create policy "app_records_read_scoped"
on public.app_records for select to authenticated
using (
  (
    public.current_role() = 'owner'
    and owner_id = (select auth.uid())
  )
  or (
    public.current_role() = 'manager'
    and owner_id = public.current_owner_id()
    and (
      facility_id = public.current_facility_id()
      or (
        facility_id is null
        and table_name in ('dichvu', 'thongbao')
      )
    )
  )
  or (
    public.current_role() = 'tenant'
    and owner_id = public.current_owner_id()
    and (
      tenant_id = public.current_tenant_id()
      or (
        table_name = 'phong'
        and record_id = public.current_tenant_room_id()
      )
      or (
        table_name = 'coso'
        and record_id = public.current_facility_id()
      )
      or (
        facility_id is null
        and table_name in ('dichvu', 'thongbao')
      )
    )
  )
);

drop policy if exists "owner_insert_records" on public.app_records;
create policy "owner_insert_records"
on public.app_records for insert to authenticated
with check (
  public.current_role() = 'owner'
  and owner_id = (select auth.uid())
);

drop policy if exists "manager_insert_facility_records" on public.app_records;
create policy "manager_insert_facility_records"
on public.app_records for insert to authenticated
with check (
  public.current_role() = 'manager'
  and owner_id = public.current_owner_id()
  and facility_id = public.current_facility_id()
  and table_name in ('phong', 'khach', 'hopdong', 'hoadon', 'chiso', 'thanhtoan', 'suco')
);

drop policy if exists "tenant_insert_own_incidents" on public.app_records;
create policy "tenant_insert_own_incidents"
on public.app_records for insert to authenticated
with check (
  public.current_role() = 'tenant'
  and owner_id = public.current_owner_id()
  and table_name = 'suco'
  and tenant_id = public.current_tenant_id()
  and facility_id = public.current_facility_id()
);

drop policy if exists "owner_update_records" on public.app_records;
create policy "owner_update_records"
on public.app_records for update to authenticated
using (
  public.current_role() = 'owner'
  and owner_id = (select auth.uid())
)
with check (
  public.current_role() = 'owner'
  and owner_id = (select auth.uid())
);

drop policy if exists "manager_update_facility_records" on public.app_records;
create policy "manager_update_facility_records"
on public.app_records for update to authenticated
using (
  public.current_role() = 'manager'
  and owner_id = public.current_owner_id()
  and facility_id = public.current_facility_id()
  and table_name in ('phong', 'khach', 'hopdong', 'hoadon', 'chiso', 'thanhtoan', 'suco')
)
with check (
  public.current_role() = 'manager'
  and owner_id = public.current_owner_id()
  and facility_id = public.current_facility_id()
  and table_name in ('phong', 'khach', 'hopdong', 'hoadon', 'chiso', 'thanhtoan', 'suco')
);

drop policy if exists "tenant_update_own_profile_or_incident" on public.app_records;
create policy "tenant_update_own_profile_or_incident"
on public.app_records for update to authenticated
using (
  public.current_role() = 'tenant'
  and owner_id = public.current_owner_id()
  and tenant_id = public.current_tenant_id()
  and table_name in ('khach', 'suco')
)
with check (
  public.current_role() = 'tenant'
  and owner_id = public.current_owner_id()
  and tenant_id = public.current_tenant_id()
  and table_name in ('khach', 'suco')
);

drop policy if exists "owner_delete_records" on public.app_records;
create policy "owner_delete_records"
on public.app_records for delete to authenticated
using (
  public.current_role() = 'owner'
  and owner_id = (select auth.uid())
);

drop policy if exists "manager_delete_facility_records" on public.app_records;
create policy "manager_delete_facility_records"
on public.app_records for delete to authenticated
using (
  public.current_role() = 'manager'
  and owner_id = public.current_owner_id()
  and facility_id = public.current_facility_id()
  and table_name in ('phong', 'khach', 'hopdong', 'hoadon', 'chiso', 'thanhtoan', 'suco')
);

grant select, insert, update, delete on public.app_records to authenticated;
grant select, update on public.profiles to authenticated;
grant execute on function public.current_owner_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_facility_id() to authenticated;
grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.current_tenant_room_id() to authenticated;

-- After creating the first user in Supabase Auth, run this once using that user's UUID:
-- insert into public.profiles (id, role, full_name, email)
-- values ('<AUTH_USER_UUID>', 'owner', '<OWNER_NAME>', '<OWNER_EMAIL>');
