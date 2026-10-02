-- Promote your first admin (run in Supabase SQL Editor after you create an account).
-- 1. Sign up on the website with your email.
-- 2. Find your user id in Authentication → Users (or run the select below).
-- 3. Replace YOUR_USER_UUID and run the insert.

-- Optional: look up by email
-- select id, email from auth.users where email = 'you@example.com';

insert into public.user_roles (user_id, role)
values ('YOUR_USER_UUID', 'admin')
on conflict do nothing;

-- If your user_roles table has a unique on (user_id, role), the above is enough.
-- Otherwise you can also:
-- update public.user_roles set role = 'admin' where user_id = 'YOUR_USER_UUID';
