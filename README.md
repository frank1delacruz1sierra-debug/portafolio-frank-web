# Portafolio Frank V3 Cloud — CONFIGURADO

Esta copia ya tiene configurados el Project URL, la Publishable key y el usuario administrador de Supabase.

## Lo único que falta

1. En Supabase, abre **SQL Editor > New query**.
2. Copia y ejecuta todo `supabase-setup.sql`.
3. Comprueba que aparezca `activities` en **Table Editor** y `actividades` en **Storage**.
4. Sube estos archivos a tu repositorio de GitHub reemplazando la versión anterior.
5. Activa GitHub Pages desde la rama `main` y `/ (root)`.
6. En la web, inicia sesión con el usuario `Frank` y la contraseña que configuraste en Supabase Authentication.

Cuando publiques una actividad desde `admin.html`, se guardará en Supabase y será visible para cualquier visitante que abra tu enlace de GitHub Pages.

> Importante: la Publishable key es apta para el navegador con RLS configurado. No pongas Secret key, service_role key ni contraseñas en el repositorio.

---

# Portafolio Frank V3 Cloud

Versión de la V3 adaptada para GitHub Pages + Supabase.

## Funciones

- 2 cursos: Algoritmos y Aplicaciones.
- 4 unidades por curso.
- 4 semanas por unidad.
- Página pública alojable en GitHub Pages.
- Inicio de sesión real mediante Supabase Auth.
- Panel privado de administración.
- Descripciones guardadas en PostgreSQL/Supabase.
- Archivos guardados en Supabase Storage.
- Las actividades publicadas son visibles desde otros dispositivos.
- Mantiene foto, diseño y animaciones de la V3.

Lee `CONFIGURAR_SUPABASE.md` antes de publicar.


## Funciones añadidas
- Recuperación de contraseña desde el inicio de sesión.
- Página `reset.html` para establecer una contraseña nueva desde el enlace enviado por Supabase.
- Sección pública **Proyectos entregados** con botones para ver y descargar las actividades publicadas.
