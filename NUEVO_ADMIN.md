# Nuevo administrador

La web está configurada para usar:

- Usuario visible: `Frank`
- Correo de autenticación: `ssmanuelss123@gmail.com`
- UID administrador: `9c980715-ef52-4ad6-8058-d1bbff30ac06`

## Pasos

1. En Supabase abre **SQL Editor**.
2. Abre `actualizar-admin.sql`, copia todo y pulsa **Run**.
3. Debe aparecer `Success`.
4. Sube a GitHub los archivos actualizados, especialmente `supabase-config.js`.
5. Espera el despliegue de GitHub Pages y recarga con `Ctrl + F5`.
6. Inicia sesión con usuario `Frank` y la contraseña que asignaste al nuevo usuario de Supabase.

`actualizar-admin.sql` no borra actividades ni archivos existentes; solo cambia los permisos de administración al nuevo UID.
