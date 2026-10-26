-- Ejecuta este script una sola vez en Supabase > SQL Editor.
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS week_title text NOT NULL DEFAULT '';
