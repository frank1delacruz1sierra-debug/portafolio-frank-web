(function(){
 const toggle=document.getElementById('aiChatToggle'),panel=document.getElementById('aiChatPanel'),close=document.getElementById('aiChatClose'),form=document.getElementById('aiChatForm'),input=document.getElementById('aiChatInput'),messages=document.getElementById('aiChatMessages');
 if(!toggle||!panel||!form||!input||!messages)return;
 function setOpen(open){panel.classList.toggle('is-open',open);panel.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>input.focus(),50)}
 function addMessage(text,who){const el=document.createElement('div');el.className='ai-message '+(who==='user'?'user-message':'bot-message');el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el}
 toggle.addEventListener('click',()=>setOpen(!panel.classList.contains('is-open')));close.addEventListener('click',()=>setOpen(false));
 form.addEventListener('submit',async(e)=>{e.preventDefault();const text=input.value.trim();if(!text)return;input.value='';addMessage(text,'user');const pending=addMessage('Estoy pensando…','bot');input.disabled=true;form.querySelector('button').disabled=true;
  try{
   const client=window.PortfolioCloud&&window.PortfolioCloud.client?window.PortfolioCloud.client():null;
   if(!client)throw new Error('La conexión del asistente aún no está configurada.');
   const {data,error}=await client.functions.invoke('ai-chat',{body:{message:text}});
   if(error)throw error;
   pending.textContent=(data&&data.reply)||'No recibí una respuesta. Inténtalo de nuevo.';
  }catch(err){pending.textContent='El asistente IA todavía necesita configuración del servidor. Para activarlo, sigue las instrucciones de CONFIGURAR_ASISTENTE_IA.md. Mientras tanto, puedes usar WhatsApp o la Intranet UPLA desde los botones inferiores.';console.warn('AI chat:',err)}
  finally{input.disabled=false;form.querySelector('button').disabled=false;input.focus();messages.scrollTop=messages.scrollHeight}
 });
})();
