-- PORTAFOLIO FRANK - CONFIGURACIÓN COMPLETA DE SUPABASE
-- Administrador actual:
-- UID: 9c980715-ef52-4ad6-8058-d1bbff30ac06

create table if not exists public.activities (
  id text primary key,
  course text not null check (course in ('algoritmos', 'aplicaciones')),
  unit_number smallint not null check (unit_number between 1 and 4),
  week_number smallint not null check (week_number between 1 and 4),
  title text not null default '',
  description text not null default '',
  status text not null default 'published' check (status in ('draft','published')),
  files jsonb not null default '[]'::jsonb,
  file_name text,
  file_type text,
  file_path text,
  file_url text,
  updated_at timestamptz not null default now()
);

-- Si la tabla ya existía, agrega las nuevas columnas.
alter table public.activities
  add column if not exists title text not null default '',
  add column if not exists status text not null default 'published',
  add column if not exists files jsonb not null default '[]'::jsonb;

alter table public.activities enable row level security;

revoke all on table public.activities from anon, authenticated;
grant select on table public.activities to anon, authenticated;
grant insert, update, delete on table public.activities to authenticated;

drop policy if exists "public_read_activities" on public.activities;
drop policy if exists "admin_read_activities" on public.activities;
drop policy if exists "admin_insert_activities" on public.activities;
drop policy if exists "admin_update_activities" on public.activities;
drop policy if exists "admin_delete_activities" on public.activities;

create policy "public_read_activities"
on public.activities
for select
to anon
using (status = 'published');

create policy "admin_read_activities"
on public.activities
for select
to authenticated
using ((select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

create policy "admin_insert_activities"
on public.activities
for insert
to authenticated
with check ((select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

create policy "admin_update_activities"
on public.activities
for update
to authenticated
using ((select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid)
with check ((select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

create policy "admin_delete_activities"
on public.activities
for delete
to authenticated
using ((select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

insert into storage.buckets (id, name, public)
values ('actividades', 'actividades', true)
on conflict (id) do update set public = true;

drop policy if exists "admin_select_portfolio_files" on storage.objects;
drop policy if exists "admin_upload_portfolio_files" on storage.objects;
drop policy if exists "admin_update_portfolio_files" on storage.objects;
drop policy if exists "admin_delete_portfolio_files" on storage.objects;

create policy "admin_select_portfolio_files"
on storage.objects
for select
to authenticated
using (bucket_id = 'actividades' and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

create policy "admin_upload_portfolio_files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'actividades' and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

create policy "admin_update_portfolio_files"
on storage.objects
for update
to authenticated
using (bucket_id = 'actividades' and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid)
with check (bucket_id = 'actividades' and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);

create policy "admin_delete_portfolio_files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'actividades' and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid);
