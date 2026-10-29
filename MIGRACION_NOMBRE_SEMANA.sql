-- Ejecuta este script en Supabase > SQL Editor.
-- Agrega la columna que necesita el portafolio para guardar el nombre personalizado de cada semana.
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS week_title TEXT NOT NULL DEFAULT '';

-- Solicita a PostgREST/Supabase que actualice la caché del esquema.
NOTIFY pgrst, 'reload schema';
