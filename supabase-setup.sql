-- PORTAFOLIO FRANK - CONFIGURACIÓN DE SUPABASE
-- PASO PREVIO:
-- 1. En Authentication > Users crea SOLO tu usuario administrador.
-- 2. Copia su UUID.
-- 3. Este archivo YA contiene el UUID del administrador.
-- 4. Ejecuta este archivo completo en SQL Editor > Run.

create table if not exists public.activities (
  id text primary key,
  course text not null check (course in ('algoritmos', 'aplicaciones')),
  unit_number smallint not null check (unit_number between 1 and 4),
  week_number smallint not null check (week_number between 1 and 4),
  description text not null default '',
  file_name text,
  file_type text,
  file_path text,
  file_url text,
  updated_at timestamptz not null default now()
);

alter table public.activities enable row level security;

revoke all on table public.activities from anon, authenticated;
grant select on table public.activities to anon, authenticated;
grant insert, update, delete on table public.activities to authenticated;

drop policy if exists "public_read_activities" on public.activities;
drop policy if exists "admin_insert_activities" on public.activities;
drop policy if exists "admin_update_activities" on public.activities;
drop policy if exists "admin_delete_activities" on public.activities;

create policy "public_read_activities"
on public.activities
for select
to anon, authenticated
using (true);

create policy "admin_insert_activities"
on public.activities
for insert
to authenticated
with check ((select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid);

create policy "admin_update_activities"
on public.activities
for update
to authenticated
using ((select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid)
with check ((select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid);

create policy "admin_delete_activities"
on public.activities
for delete
to authenticated
using ((select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid);

-- Bucket público: los visitantes pueden abrir los archivos publicados.
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
using (
  bucket_id = 'actividades'
  and (select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid
);

create policy "admin_upload_portfolio_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'actividades'
  and (select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid
);

create policy "admin_update_portfolio_files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'actividades'
  and (select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid
)
with check (
  bucket_id = 'actividades'
  and (select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid
);

create policy "admin_delete_portfolio_files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'actividades'
  and (select auth.uid()) = '192db45e-b275-4480-af85-032977ad718e'::uuid
);
