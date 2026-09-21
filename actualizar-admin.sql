-- PORTAFOLIO FRANK - CAMBIAR ADMINISTRADOR
-- Ejecuta este archivo UNA SOLA VEZ en Supabase > SQL Editor > Run.
-- No borra actividades ni archivos. Solo cambia qué usuario puede administrarlos.

-- Nuevo administrador:
-- Correo: ssmanuelss123@gmail.com
-- UID: 9c980715-ef52-4ad6-8058-d1bbff30ac06

-- Tabla public.activities
alter table public.activities enable row level security;

drop policy if exists "admin_insert_activities" on public.activities;
drop policy if exists "admin_update_activities" on public.activities;
drop policy if exists "admin_delete_activities" on public.activities;

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

-- Storage bucket actividades
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
  and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid
);

create policy "admin_upload_portfolio_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'actividades'
  and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid
);

create policy "admin_update_portfolio_files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'actividades'
  and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid
)
with check (
  bucket_id = 'actividades'
  and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid
);

create policy "admin_delete_portfolio_files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'actividades'
  and (select auth.uid()) = '9c980715-ef52-4ad6-8058-d1bbff30ac06'::uuid
);
