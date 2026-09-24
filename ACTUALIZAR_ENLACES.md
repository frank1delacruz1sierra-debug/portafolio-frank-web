# Actualización: soporte de enlaces

Esta versión permite agregar enlaces externos a una actividad desde el panel de administración.

1. Reemplaza los archivos de tu repositorio GitHub por los de esta carpeta.
2. Haz Commit changes.
3. No necesitas ejecutar SQL nuevo: los enlaces se guardan dentro de la columna JSONB `files` que ya usa la versión multiarchivo.
4. En el panel, usa **Agregar un enlace**, escribe un nombre y la URL, ordénalo junto con los archivos y publica la actividad.
