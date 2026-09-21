-- PORTAFOLIO FRANK - MIGRACIÓN PARA VARIOS ARCHIVOS Y BORRADORES
-- Ejecuta este archivo UNA SOLA VEZ en Supabase > SQL Editor > New query > Run.
-- No elimina actividades existentes.

alter table public.activities
  add column if not exists title text not null default '',
  add column if not exists status text not null default 'published',
  add column if not exists files jsonb not null default '[]'::jsonb;

-- Restricción del estado (se crea solo si todavía no existe).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activities_status_check'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_status_check
      check (status in ('draft','published'));
  end if;
end $$;

-- Convierte automáticamente el archivo único antiguo en el primer elemento
-- del nuevo arreglo de archivos, sin tocar actividades que ya tengan varios.
update public.activities
set files = jsonb_build_array(
  jsonb_build_object(
    'id', coalesce(file_path, id || '-archivo-1'),
    'name', coalesce(file_name, 'archivo'),
    'type', coalesce(file_type, ''),
    'path', coalesce(file_path, ''),
    'url', coalesce(file_url, ''),
    'label', coalesce(file_name, 'Archivo'),
    'category', 'Archivo',
    'note', '',
    'order', 0
  )
)
where coalesce(jsonb_array_length(files), 0) = 0
  and file_url is not null
  and file_url <> '';

-- Los visitantes anónimos solo pueden consultar actividades PUBLICADAS.
-- El administrador autenticado sí puede leer también sus BORRADORES.
drop policy if exists "public_read_activities" on public.activities;
drop policy if exists "admin_read_activities" on public.activities;

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

-- Se conservan las políticas ya existentes para insertar, actualizar y eliminar.
