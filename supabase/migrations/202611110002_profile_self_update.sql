revoke update on public.profiles from authenticated;
grant update (full_name, active, must_change_password) on public.profiles to authenticated;

drop policy if exists "profiles_update_self_password" on public.profiles;
create policy "profiles_update_self_password"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
