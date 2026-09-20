# ESTADO: DATOS PRINCIPALES YA CONFIGURADOS

`supabase-config.js` y `supabase-setup.sql` ya están preparados. Solo debes ejecutar el SQL en Supabase y después subir la carpeta al repositorio.

---

# Configuración: Portafolio V3 + Supabase + GitHub Pages

Esta versión conserva el diseño de la V3, pero reemplaza IndexedDB por Supabase.

## Qué cambia

- La página pública sigue alojada en GitHub Pages.
- El inicio de sesión usa Supabase Auth.
- Las descripciones se guardan en una tabla `activities`.
- Los archivos se guardan en Supabase Storage.
- Cualquier visitante con el enlace de GitHub Pages puede ver las actividades publicadas.
- Tu contraseña ya no queda escrita en JavaScript ni en GitHub.

## 1. Crear un proyecto en Supabase

Crea un proyecto nuevo desde el Dashboard de Supabase.

## 2. Crear tu usuario administrador

En **Authentication > Users**, agrega un usuario con tu correo real y la contraseña que quieras usar.

Puedes usar `123frank` si deseas conservar la contraseña anterior, aunque para una web pública es mejor usar una contraseña más fuerte.

La web seguirá pidiendo como nombre de usuario: `Frank`.

Copia el **UUID** del usuario creado.

## 3. Preparar la base de datos y Storage

Abre `supabase-setup.sql`.

Reemplaza cada texto:

`REEMPLAZA_CON_TU_UUID`

por el UUID de tu usuario de Supabase.

Después copia todo el SQL, ve a **SQL Editor** en Supabase, pégalo y pulsa **Run**.

Eso crea:

- tabla `activities`
- lectura pública de actividades
- escritura únicamente para tu usuario
- bucket público `actividades`
- permisos de subida, actualización y eliminación únicamente para tu usuario

## 4. Copiar Project URL y Publishable key

En el Dashboard abre **Connect** o **Settings > API Keys**.

Necesitas únicamente:

- Project URL
- Publishable key (`sb_publishable_...`)

No uses una Secret key ni una `service_role` key en esta web.

## 5. Editar `supabase-config.js`

Reemplaza los tres valores:

```js
window.PORTFOLIO_SUPABASE = {
  url: 'https://TU-PROYECTO.supabase.co',
  publishableKey: 'sb_publishable_...',
  adminEmail: 'tu-correo@ejemplo.com',
  adminUsername: 'Frank',
  bucket: 'actividades'
};
```

El correo debe ser el mismo que usaste al crear el usuario en Authentication.

La contraseña NO se coloca en este archivo.

## 6. Subir esta versión a GitHub

Reemplaza los archivos de tu repositorio actual por los de esta carpeta y realiza un Commit.

GitHub Pages seguirá sirviendo `index.html`.

## 7. Probar

Abre tu enlace de GitHub Pages.

1. Pulsa **Iniciar sesión**.
2. Usuario: `Frank`.
3. Contraseña: la contraseña que configuraste en Supabase Auth.
4. Entra al panel.
5. Elige curso, unidad y semana.
6. Escribe una descripción.
7. Selecciona un archivo.
8. Pulsa **Guardar actividad**.

Después abre el enlace público del portafolio en otro navegador o dispositivo y entra al curso/unidad correspondiente. La actividad se cargará desde Supabase.

## Seguridad

La `Publishable key` puede estar en el navegador porque esta configuración usa Row Level Security (RLS). Las escrituras se limitan al UUID de tu usuario administrador.

Nunca copies una Secret key o `service_role` key dentro de archivos públicos de GitHub.

## Archivos grandes

El selector acepta cualquier tipo de archivo. Para archivos grandes, la carga estándar puede ser menos fiable; conviene mantener los archivos académicos en tamaños moderados.
