# Configurar el asistente IA y accesos flotantes

La página incluye tres accesos circulares fijos en la parte inferior: Asistente IA, WhatsApp e Intranet UPLA.

## Enlaces
- Intranet UPLA: `https://intranet.upla.edu.pe/sesion`.
- WhatsApp: actualmente abre WhatsApp con un mensaje prellenado sin destinatario. Para enlazar un número específico, edita `index.html`, busca `https://wa.me/?text=` y reemplázalo por `https://wa.me/519XXXXXXXX?text=...` (usa el código de país y el número, solo dígitos, sin `+` ni espacios).

## Activar respuestas reales de IA
La interfaz del chat ya está integrada. Para que genere respuestas reales, hay que desplegar la función de Supabase incluida en `supabase/functions/ai-chat/index.ts` y guardar la clave de OpenAI como secreto del servidor. No pongas la clave de OpenAI en archivos HTML o JavaScript públicos.

1. Instala la CLI de Supabase y vincula este proyecto al proyecto Supabase correcto (`supabase login` y `supabase link --project-ref TU_PROJECT_REF`).
2. Configura el secreto en Supabase: `supabase secrets set OPENAI_API_KEY=tu_clave_de_openai`.
3. Despliega la función: `supabase functions deploy ai-chat`.
4. Confirma que la función está activa y prueba el chat en la página publicada.

La función usa el modelo `gpt-4o-mini` mediante la API de OpenAI; el uso de la API puede generar costos según la cuenta y el consumo. La clave se guarda como secreto de servidor, nunca en el navegador.

## WhatsApp
El enlace genérico permite abrir WhatsApp, pero para que contacte directamente contigo hay que sustituirlo por tu número real. El número no se ha inventado ni incluido en esta versión.
