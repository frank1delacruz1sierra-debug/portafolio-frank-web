(function () {
  const toggle = document.getElementById('aiChatToggle');
  const panel = document.getElementById('aiChatPanel');
  const close = document.getElementById('aiChatClose');
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiChatInput');
  const messages = document.getElementById('aiChatMessages');
  if (!toggle || !panel || !form || !input || !messages) return;

  // Modelo ejecutado íntegramente en el navegador del visitante.
  // Primera carga: descarga del modelo; siguientes visitas: caché del navegador cuando esté disponible.
  const MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
  let enginePromise = null;
  let conversation = [
    {
      role: 'system',
      content: 'Eres un asistente de inteligencia artificial general, útil, claro y amable. Puedes responder preguntas de cualquier tema, explicar conceptos, ayudar con tareas, traducciones, programación y escritura. Responde en español si el usuario escribe en español. Sé honesto cuando no sepas algo y no inventes datos actuales. No afirmes tener acceso a internet. Mantén las respuestas claras y proporcionadas.'
    }
  ];

  function setOpen(open) {
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) setTimeout(() => input.focus(), 50);
  }

  function addMessage(text, who) {
    const el = document.createElement('div');
    el.className = 'ai-message ' + (who === 'user' ? 'user-message' : 'bot-message');
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function setComposerBusy(busy) {
    input.disabled = busy;
    const button = form.querySelector('button[type="submit"], button:not([type])');
    if (button) button.disabled = busy;
  }

  async function getEngine(statusMessage) {
    if (!('gpu' in navigator)) {
      throw new Error('Tu navegador no parece ser compatible con WebGPU. Prueba con una versión reciente de Google Chrome o Microsoft Edge en una computadora compatible.');
    }
    if (!enginePromise) {
      enginePromise = (async () => {
        statusMessage.textContent = 'Preparando la IA local… La primera carga puede descargar más de 1 GB. No cierres esta pestaña.';
        const webllm = await import('https://esm.run/@mlc-ai/web-llm');
        return await webllm.CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (report) => {
            if (report && report.text) {
              const pct = typeof report.progress === 'number'
                ? ' (' + Math.round(report.progress * 100) + '%)'
                : '';
              statusMessage.textContent = 'Preparando la IA: ' + report.text + pct;
            }
          }
        });
      })().catch((error) => {
        enginePromise = null;
        throw error;
      });
    }
    return enginePromise;
  }

  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  if (close) close.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');
    const pending = addMessage('Conectando con la IA local…', 'bot');
    setComposerBusy(true);

    try {
      const engine = await getEngine(pending);
      pending.textContent = 'Pensando…';
      conversation.push({ role: 'user', content: text });

      // Limita el historial para evitar consumir demasiada memoria en dispositivos modestos.
      if (conversation.length > 13) {
        conversation = [conversation[0], ...conversation.slice(-12)];
      }

      const result = await engine.chat.completions.create({
        messages: conversation,
        temperature: 0.7,
        max_tokens: 700
      });
      const reply = result && result.choices && result.choices[0] &&
        result.choices[0].message && result.choices[0].message.content;
      if (!reply) throw new Error('El modelo no generó una respuesta. Intenta de nuevo.');
      conversation.push({ role: 'assistant', content: reply });
      pending.textContent = reply;
    } catch (error) {
      const message = error && error.message ? error.message : 'Ocurrió un error al iniciar la IA.';
      pending.textContent = 'No pude iniciar la IA en este dispositivo. ' + message +
        '\n\nComprueba que tengas conexión para la primera descarga y que tu navegador y equipo sean compatibles. También puedes abrir esta página en Chrome o Edge actualizado.';
    } finally {
      setComposerBusy(false);
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });
})();
