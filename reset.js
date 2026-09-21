const $ = s => document.querySelector(s);
const form = $('#resetForm');
const waiting = $('#resetWaiting');
const status = $('#resetStatus');

function setReady(){
  waiting.hidden=true;
  form.hidden=false;
  setTimeout(()=>$('#resetPassword').focus(),80);
}
function setInvalid(message){
  waiting.innerHTML=`<strong>No se pudo validar el enlace</strong><span>${message}</span>`;
  form.hidden=true;
}

async function checkRecovery(){
  if(!PortfolioCloud.isConfigured()){
    setInvalid('La conexión con Supabase no está configurada.');
    return;
  }
  try{
    const client=PortfolioCloud.client();
    const { data } = await client.auth.getSession();
    if(data?.session){ setReady(); return; }
    let resolved=false;
    const { data: listener } = client.auth.onAuthStateChange((event,session)=>{
      if(resolved) return;
      if((event==='PASSWORD_RECOVERY' || event==='SIGNED_IN') && session){
        resolved=true;
        setReady();
      }
    });
    setTimeout(async()=>{
      if(resolved) return;
      const { data: retry }=await client.auth.getSession();
      if(retry?.session){resolved=true;setReady();}
      else setInvalid('El enlace puede haber vencido. Solicita uno nuevo desde el inicio de sesión.');
      listener?.subscription?.unsubscribe?.();
    },1700);
  }catch(err){ setInvalid(err.message||'El enlace no es válido.'); }
}

document.querySelectorAll('.reset-toggle').forEach(btn=>btn.addEventListener('click',()=>{
  const input=document.getElementById(btn.dataset.target);
  const show=input.type==='password';
  input.type=show?'text':'password';
  btn.textContent=show?'Ocultar':'Ver';
}));

form.addEventListener('submit',async e=>{
  e.preventDefault();
  const p=$('#resetPassword').value;
  const c=$('#resetPasswordConfirm').value;
  const submit=e.currentTarget.querySelector('button[type="submit"]');
  status.className='reset-status';
  if(p!==c){status.textContent='Las contraseñas no coinciden.';return;}
  try{
    submit.disabled=true;submit.textContent='Guardando…';
    await PortfolioCloud.updateRecoveredPassword(p);
    status.className='reset-status success';
    status.textContent='Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña.';
    await PortfolioCloud.signOut();
    setTimeout(()=>location.replace('index.html'),1700);
  }catch(err){status.textContent=err.message||'No se pudo cambiar la contraseña.';}
  finally{submit.disabled=false;submit.innerHTML='Guardar nueva contraseña <span>→</span>';}
});

checkRecovery();
