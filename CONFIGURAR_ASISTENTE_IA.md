# Configurar el asistente Gemini para FRANK.DEV

El `index.html` ya incluye los tres accesos circulares (WhatsApp Web, Intranet UPLA y chat de IA). `ai-chat.js` llama a la función Supabase `ai-chat`; esta función ahora usa Gemini en lugar de OpenAI.

## 1. Crear una clave de Gemini

1. Abre https://aistudio.google.com/apikey
2. Inicia sesión con tu cuenta de Google.
3. Crea una clave para la Gemini API y cópiala.
4. No publiques la clave ni la pongas en `index.html`, `ai-chat.js` o en otro archivo público.

La disponibilidad gratuita, modelos y límites dependen del proyecto y de las condiciones vigentes de Google. Revisa https://ai.google.dev/gemini-api/docs/billing.

## 2. Guardar la clave como secreto en Supabase

En la terminal, con Supabase CLI instalada e iniciada sesión, ejecuta:

```bash
supabase login
supabase link --project-ref ztxxepqlbkuuwpjeutny
supabase secrets set GEMINI_API_KEY=PEGA_AQUI_TU_CLAVE
```

No incluyas la clave en el repositorio. Si tu proyecto Supabase es diferente, usa su propio project ref.

## 3. Crear la estructura requerida por Supabase

Este ZIP mantiene todos los archivos en la raíz, tal como solicitaste. Supabase, sin embargo, exige que la función se despliegue desde una carpeta específica. Después de extraer el ZIP, crea esta ruta:

```text
supabase/
  functions/
    ai-chat/
      index.ts
```

Copia el contenido del archivo `supabase-functions-ai-chat-index.ts` a `supabase/functions/ai-chat/index.ts`.

Luego ejecuta:

```bash
supabase functions deploy ai-chat
```

## 4. Probar

1. Publica los archivos web actualizados.
2. Abre la página y pulsa el botón circular de IA.
3. Envía una pregunta de prueba, por ejemplo: `¿Qué puedo encontrar en este portafolio?`
4. Si responde con un error, revisa los logs de `ai-chat` en el panel de Supabase y que la clave tenga cuota disponible.

## Notas importantes

- La función usa la API REST de Gemini y el modelo `gemini-2.5-flash`.
- La clave permanece en los secretos de Supabase y no se envía al navegador.
- GitHub Pages por sí solo no ejecuta funciones de servidor; la función se ejecuta en Supabase.
- El enlace de WhatsApp abre WhatsApp Web, pero no dirige a un número concreto porque no se proporcionó uno.
- No se ha probado la función con una clave real; debes completar los pasos de configuración y despliegue.
