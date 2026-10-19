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


## Modo nuevo: IA general en el navegador (WebLLM, sin backend de IA)

El archivo `ai-chat.js` se ha preparado para usar WebLLM y el modelo `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` directamente en el navegador. Esta modalidad no usa la función de Supabase/OpenAI para responder, ni necesita una clave de API o un servidor propio de IA.

### Cómo probarlo
1. Publica la web estática por HTTPS o ejecútala en un servidor local de desarrollo. No abras `index.html` con `file://`.
2. Abre la web en una versión reciente de Google Chrome o Microsoft Edge en un equipo compatible con WebGPU.
3. Abre el chat y envía una pregunta. La primera vez, espera a que descargue y prepare el modelo; el mensaje de estado muestra el progreso.
4. En visitas posteriores, el navegador puede reutilizar la copia almacenada localmente, si su caché sigue disponible.

### Limitaciones
- El modelo se descarga desde una fuente externa; la primera carga puede ser grande y requiere conexión a internet.
- La IA funciona en el dispositivo del visitante. Velocidad, memoria y calidad dependen de su hardware.
- WebGPU no está disponible en todos los navegadores y dispositivos. En equipos no compatibles el chat mostrará un aviso.
- El modelo no tiene acceso automático a internet ni conocimientos actualizados en tiempo real.
- La página sigue necesitando estar publicada en algún alojamiento estático para que otros puedan abrirla. Lo que no necesita es un backend propio para inferencia.
- Esta integración importa WebLLM desde `https://esm.run/@mlc-ai/web-llm`; por eso necesita conectividad con ese CDN y con el repositorio del modelo en la primera carga.
