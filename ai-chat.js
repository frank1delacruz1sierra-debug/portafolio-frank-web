(function(){
 const toggle=document.getElementById('aiChatToggle'),panel=document.getElementById('aiChatPanel'),close=document.getElementById('aiChatClose'),form=document.getElementById('aiChatForm'),input=document.getElementById('aiChatInput'),messages=document.getElementById('aiChatMessages');
 if(!toggle||!panel||!form||!input||!messages)return;
 function setOpen(open){panel.classList.toggle('is-open',open);panel.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>input.focus(),50)}
 function addMessage(text,who){const el=document.createElement('div');el.className='ai-message '+(who==='user'?'user-message':'bot-message');el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el}
 function localAnswer(text){const q=text.toLowerCase();
  if(/hola|buenas|buenos días|buenas tardes|hey/.test(q))return '¡Hola! 👋 Bienvenido/a a FRANK.DEV. Puedo orientarte sobre las secciones del portafolio. ¿Qué deseas conocer?';
  if(/actividad|curso|algoritmo|semana|unidad/.test(q))return 'En la sección “Actividades” puedes elegir el curso y explorar sus unidades y semanas. Si una actividad está publicada, podrás revisar sus recursos desde la sección de actividades entregadas.';
  if(/proyecto|portafolio|trabajo/.test(q))return 'En “Proyectos entregados” se muestran las actividades publicadas. Puedes filtrar por Algoritmos o Aplicaciones y abrir los recursos disponibles.';
  if(/whatsapp|contact|teléfono|telefono/.test(q))return 'Puedes contactar mediante el botón circular verde de WhatsApp en la parte inferior de la página. Abre WhatsApp Web en una pestaña nueva.';
  if(/upla|intranet|universidad/.test(q))return 'El botón circular con el logo UPLA abre la intranet institucional en una pestaña nueva.';
  if(/frank|autor|perfil|estudiante/.test(q))return 'Este portafolio pertenece a Frank de la Cruz Sierra, estudiante de Ingeniería de Sistemas y Computación. Puedes ver su información en la sección “Sobre mí”.';
  if(/gracias/.test(q))return '¡Con gusto! 😊 Si necesitas más ayuda, escribe otra pregunta.';
  return 'Puedo ayudarte a ubicar las actividades, cursos, proyectos y enlaces de contacto de este portafolio. Prueba preguntando: “¿Dónde veo las actividades?”, “¿Cómo contacto por WhatsApp?” o “¿Qué es la Intranet UPLA?”. Para respuestas generadas por un modelo de IA, el administrador debe configurar el servicio de IA en el servidor.';
 }
 toggle.addEventListener('click',()=>setOpen(!panel.classList.contains('is-open')));close.addEventListener('click',()=>setOpen(false));
 form.addEventListener('submit',async(e)=>{e.preventDefault();const text=input.value.trim();if(!text)return;input.value='';addMessage(text,'user');const pending=addMessage('Estoy revisando tu pregunta…','bot');input.disabled=true;form.querySelector('button').disabled=true;
  try{const client=window.PortfolioCloud&&window.PortfolioCloud.client?window.PortfolioCloud.client():null;if(!client)throw new Error('AI server not configured');const {data,error}=await client.functions.invoke('ai-chat',{body:{message:text}});if(error||!data?.reply)throw error||new Error('No reply');pending.textContent=data.reply;}
  catch(err){pending.textContent=localAnswer(text);}
  finally{input.disabled=false;form.querySelector('button').disabled=false;input.focus();messages.scrollTop=messages.scrollHeight;}
 });
})();