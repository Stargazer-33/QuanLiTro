revoke update on public.profiles from authenticated;
revoke update (full_name, active, must_change_password) on public.profiles from authenticated;

drop policy if exists "owner_manage_profiles" on public.profiles;
drop policy if exists "profiles_update_self_password" on public.profiles;

create or replace function public.update_profile_settings(
  p_profile_id uuid,
  p_full_name text default null,
  p_active boolean default null,
  p_must_change_password boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
begin
  select p.role into caller_role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active;

  if caller_role is null then
    raise exception 'An active profile is required';
  end if;

  if p_profile_id = (select auth.uid()) then
    if p_full_name is not null
      or p_active is not null
      or p_must_change_password is distinct from false then
      raise exception 'Users can only clear their own password-change flag';
    end if;

    update public.profiles
    set must_change_password = false
    where id = (select auth.uid());
    return;
  end if;

  if caller_role <> 'owner' then
    raise exception 'Only an owner can update another profile';
  end if;

  if p_full_name is not null and length(trim(p_full_name)) = 0 then
    raise exception 'Full name cannot be empty';
  end if;

  update public.profiles
  set full_name = coalesce(p_full_name, full_name),
      active = coalesce(p_active, active),
      must_change_password = coalesce(p_must_change_password, must_change_password)
  where id = p_profile_id
    and owner_id = (select auth.uid())
    and role in ('manager', 'tenant');

  if not found then
    raise exception 'Profile not found or not managed by this owner';
  end if;
end
$$;

revoke all on function public.update_profile_settings(uuid, text, boolean, boolean) from public;
grant execute on function public.update_profile_settings(uuid, text, boolean, boolean) to authenticated;
