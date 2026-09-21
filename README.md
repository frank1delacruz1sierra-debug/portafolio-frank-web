# Portafolio Académico — Frank de la Cruz Sierra

Portafolio web para presentar actividades de **Algoritmos** y **Desarrollo de Aplicaciones**. La web se publica en GitHub Pages y utiliza Supabase para autenticación, base de datos y almacenamiento de archivos.

## Nueva versión: varios archivos por actividad

Cada semana puede contener una actividad con:

- Título.
- Descripción.
- Varios archivos.
- Nombre visible personalizado para cada archivo.
- Tipo/categoría por archivo.
- Nota opcional por archivo.
- Orden de presentación configurable.
- Estado **Borrador** o **Publicada**.
- Vista previa antes de publicar.

Los borradores no aparecen en la página principal. Al pulsar **Publicar actividad**, la entrega se muestra públicamente con opciones de **Ver** y **Descargar** para cada archivo.

## Importante al actualizar una instalación existente

Antes de subir esta versión a GitHub, ejecuta una sola vez en Supabase:

`MIGRAR_MULTIARCHIVOS.sql`

Ruta: **Supabase → SQL Editor → New query → pegar el contenido → Run**.

Después reemplaza los archivos del repositorio por los de esta carpeta. No necesitas crear otra base de datos ni otro bucket.
