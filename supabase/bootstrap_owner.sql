-- Create the first Auth user in Supabase Dashboard > Authentication > Users.
-- Replace these values with that user's Auth UUID, display name, and email.
insert into public.profiles (id, role, full_name, email)
values (
  '8c9fc775-39e5-4970-a482-e3ef735f067a',
  'owner',
  'Admin',
  'Admin@gmail.com'
);
