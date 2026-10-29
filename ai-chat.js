(function(){
 const toggle=document.getElementById('aiChatToggle'),panel=document.getElementById('aiChatPanel'),close=document.getElementById('aiChatClose'),form=document.getElementById('aiChatForm'),input=document.getElementById('aiChatInput'),messages=document.getElementById('aiChatMessages');
 if(!toggle||!panel||!form||!input||!messages)return;

 // Pega aquí una CLAVE NUEVA de Gemini. La clave compartida anteriormente debe revocarse.
 // ADVERTENCIA: una clave en JavaScript puede ser vista por cualquier persona con acceso a la página.
 const GEMINI_API_KEY = 'PEGA_AQUI_TU_NUEVA_CLAVE_GEMINI';

 function setOpen(open){panel.classList.toggle('is-open',open);panel.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>input.focus(),50)}
 function addMessage(text,who){const el=document.createElement('div');el.className='ai-message '+(who==='user'?'user-message':'bot-message');el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el}
 function localAnswer(text){const q=text.toLowerCase();
  if(/hola|buenas|buenos días|buenas tardes|hey/.test(q))return '¡Hola! 👋 Bienvenido/a a FRANK.DEV. ¿Qué deseas conocer?';
  if(/actividad|curso|algoritmo|semana|unidad/.test(q))return 'En la sección “Actividades” puedes elegir el curso y explorar sus unidades y semanas.';
  if(/proyecto|portafolio|trabajo/.test(q))return 'En “Proyectos entregados” se muestran las actividades publicadas.';
  if(/whatsapp|contact|teléfono|telefono/.test(q))return 'Puedes utilizar el botón circular verde de WhatsApp en la parte inferior de la página.';
  if(/upla|intranet|universidad/.test(q))return 'El botón circular UPLA abre la intranet institucional.';
  if(/frank|autor|perfil|estudiante/.test(q))return 'Este portafolio pertenece a Frank de la Cruz Sierra. Puedes ver su información en “Sobre mí”.';
  return 'No puedo conectar con Gemini ahora mismo. Revisa la clave de API y la conexión a internet.';
 }
 toggle.addEventListener('click',()=>setOpen(!panel.classList.contains('is-open')));
 if(close)close.addEventListener('click',()=>setOpen(false));
 form.addEventListener('submit',async(e)=>{
  e.preventDefault();const text=input.value.trim();if(!text)return;input.value='';addMessage(text,'user');const pending=addMessage('Gemini está pensando…','bot');input.disabled=true;const submit=form.querySelector('button');if(submit)submit.disabled=true;
  try{
   if(!GEMINI_API_KEY||GEMINI_API_KEY==='PEGA_AQUI_TU_NUEVA_CLAVE_GEMINI')throw new Error('Falta la clave Gemini');
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':GEMINI_API_KEY},
    body:JSON.stringify({
     system_instruction:{parts:[{text:'Eres el asistente virtual del portafolio académico FRANK.DEV. Responde en español, de forma amable, clara y concisa. Ayuda con preguntas generales y con la navegación del portafolio, sus actividades, proyectos y enlaces. No inventes datos específicos ni solicites contraseñas o datos sensibles.'}]},
     contents:[{role:'user',parts:[{text:text.slice(0,2000)}]}],
     generationConfig:{temperature:0.7,maxOutputTokens:500}
    })
   });
   const data=await response.json();
   if(!response.ok)throw new Error(data?.error?.message||'Error de Gemini');
   const reply=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
   if(!reply)throw new Error('Gemini no devolvió respuesta');
   pending.textContent=reply;
  }catch(err){
   pending.textContent=GEMINI_API_KEY==='PEGA_AQUI_TU_NUEVA_CLAVE_GEMINI'
    ? 'Falta configurar la clave de Gemini. Abre ai-chat.js y reemplaza PEGA_AQUI_TU_NUEVA_CLAVE_GEMINI por una clave nueva.'
    : (err.message||'No se pudo conectar con Gemini.')+' Puedes comprobar la clave y los límites de tu cuenta de Google AI Studio.';
  }finally{input.disabled=false;if(submit)submit.disabled=false;input.focus();messages.scrollTop=messages.scrollHeight;}
 });
})();