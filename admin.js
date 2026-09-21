const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)];
const courses={algoritmos:{short:'Algoritmos',full:'Algoritmos y bases de datos'},aplicaciones:{short:'Aplicaciones',full:'Desarrollo de aplicaciones'}};
let course='algoritmos', unit=1, week=1, currentActivity=null;

async function guard(){
  if(!PortfolioCloud.isConfigured()){
    alert('Primero configura Supabase en supabase-config.js.');
    location.replace('index.html');
    return false;
  }
  const session=await PortfolioCloud.session();
  if(!session){ location.replace('index.html'); return false; }
  return true;
}

function renderUnits(){const h=$('#adminUnits');h.innerHTML='';for(let i=1;i<=4;i++){const b=document.createElement('button');b.className=`admin-unit ${i===unit?'active':''}`;b.textContent=`Unidad ${i}`;b.onclick=()=>{unit=i;week=1;renderAll()};h.appendChild(b)}}

async function renderWeeks(){
  const h=$('#adminWeeks');h.innerHTML='';
  let all=[];
  try{ all=await PortfolioDB.listAll(); }catch(err){ console.error(err); }
  for(let i=1;i<=4;i++){
    const a=all.find(x=>x.course===course && x.unit===unit && x.week===i);
    const b=document.createElement('button');
    b.className=`admin-week ${i===week?'active':''}`;
    b.innerHTML=`<div class="admin-week-top"><strong>Semana ${i}</strong><span class="week-state ${a?'published':''}">${a?'Publicada':'Vacía'}</span></div><p>${a?(a.description||'Actividad guardada').slice(0,75):'Selecciona esta semana para agregar una actividad.'}</p>`;
    b.onclick=()=>{week=i;renderAll()};h.appendChild(b);
  }
}

async function loadEditor(){
  currentActivity=await PortfolioDB.get(course,unit,week);
  $('#editorTitle').textContent=`Unidad ${unit} · Semana ${week}`;
  $('#description').value=currentActivity?.description||'';
  $('#fileInput').value='';
  $('#selectedFile').textContent='Ningún archivo seleccionado';
  $('#currentFile').innerHTML=currentActivity?.fileUrl
    ? `Archivo actual: <a href="${currentActivity.fileUrl}" target="_blank" rel="noopener">${currentActivity.fileName}</a>`
    : 'No hay archivo publicado.';
  $('#formMessage').textContent='';$('#formMessage').className='form-message';
}

async function updateStats(){
  const all=await PortfolioDB.listAll();
  const n=all.filter(a=>a.course===course).length;
  $('#statPublished').textContent=n;
  $('#statCourse').textContent=courses[course].short;
  $('#statCourseFull').textContent=courses[course].full;
  $('#statUnit').textContent=String(unit).padStart(2,'0');
}

async function renderAll(){
  renderUnits();
  try{
    await renderWeeks();
    await loadEditor();
    await updateStats();
  }catch(err){
    console.error(err);
    $('#formMessage').className='form-message';
    $('#formMessage').textContent=`Error de conexión: ${err.message}`;
  }
  $('#courseTitle').textContent=courses[course].short;
  $('#coursePill').textContent=courses[course].full;
  $$('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.course===course));
}

$$('.side-link').forEach(b=>b.addEventListener('click',()=>{course=b.dataset.course;unit=1;week=1;renderAll()}));
$('#fileInput').addEventListener('change',()=>{$('#selectedFile').textContent=$('#fileInput').files[0]?.name||'Ningún archivo seleccionado'});

$('#activityForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const description=$('#description').value.trim();
  const file=$('#fileInput').files[0];
  const submit=e.currentTarget.querySelector('button[type="submit"]');

  if(!description){$('#formMessage').textContent='Escribe una descripción para la actividad.';return}
  if(!file&&!currentActivity?.fileUrl){$('#formMessage').textContent='Selecciona un archivo para publicar.';return}

  try{
    submit.disabled=true; submit.textContent='Publicando…';
    $('#formMessage').className='form-message';
    $('#formMessage').textContent='Subiendo archivo y guardando la actividad…';

    const saved=await PortfolioDB.save({course,unit,week,description,file,currentActivity});
    currentActivity=saved;
    $('#formMessage').className='form-message success';
    $('#formMessage').textContent='Actividad publicada. Ya será visible para los visitantes del portafolio.';
    $('#currentFile').innerHTML=`Archivo actual: <a href="${saved.fileUrl}" target="_blank" rel="noopener">${saved.fileName}</a>`;
    $('#fileInput').value='';
    $('#selectedFile').textContent='Ningún archivo seleccionado';
    await renderWeeks(); await updateStats();
  }catch(err){
    console.error(err);
    $('#formMessage').className='form-message';
    $('#formMessage').textContent=`No se pudo publicar: ${err.message}`;
  }finally{
    submit.disabled=false; submit.textContent='Guardar actividad';
  }
});

$('#deleteButton').addEventListener('click',async()=>{
  const a=await PortfolioDB.get(course,unit,week);
  if(!a){$('#formMessage').className='form-message';$('#formMessage').textContent='Esta semana no tiene una actividad publicada.';return}
  if(!confirm(`¿Eliminar la actividad de la semana ${week}?`))return;
  try{
    await PortfolioDB.remove(course,unit,week);
    $('#description').value='';
    $('#currentFile').textContent='No hay archivo publicado.';
    $('#formMessage').className='form-message success';
    $('#formMessage').textContent='Actividad eliminada de la base de datos y del almacenamiento.';
    currentActivity=null;
    await renderWeeks();await updateStats();
  }catch(err){
    $('#formMessage').className='form-message';
    $('#formMessage').textContent=`No se pudo eliminar: ${err.message}`;
  }
});



// Cambio de contraseña
const passwordModal=$('#passwordModal');
function openPasswordModal(){
  passwordModal.classList.add('open');
  passwordModal.setAttribute('aria-hidden','false');
  $('#passwordMessage').textContent='';
  $('#passwordMessage').className='password-message';
  $('#passwordForm').reset();
  setTimeout(()=>$('#currentPassword').focus(),80);
}
function closePasswordModal(){
  passwordModal.classList.remove('open');
  passwordModal.setAttribute('aria-hidden','true');
  $('#passwordForm').reset();
  $('#passwordMessage').textContent='';
}
$('#passwordButton').addEventListener('click',openPasswordModal);
$('#passwordClose').addEventListener('click',closePasswordModal);
$('#passwordCancel').addEventListener('click',closePasswordModal);
passwordModal.querySelector('[data-close-password]').addEventListener('click',closePasswordModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&passwordModal.classList.contains('open'))closePasswordModal()});
$$('.toggle-pass').forEach(btn=>btn.addEventListener('click',()=>{
  const input=document.getElementById(btn.dataset.target);
  const show=input.type==='password';
  input.type=show?'text':'password';
  btn.textContent=show?'Ocultar':'Ver';
}));
$('#passwordForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const current=$('#currentPassword').value;
  const next=$('#newPassword').value;
  const confirm=$('#confirmPassword').value;
  const submit=e.currentTarget.querySelector('button[type="submit"]');
  const msg=$('#passwordMessage');
  msg.className='password-message';
  if(next!==confirm){msg.textContent='Las nuevas contraseñas no coinciden.';return}
  try{
    submit.disabled=true;
    submit.textContent='Actualizando…';
    msg.textContent='Verificando y actualizando tu contraseña…';
    await PortfolioCloud.changePassword(current,next);
    msg.className='password-message success';
    msg.textContent='Contraseña actualizada correctamente.';
    $('#passwordForm').reset();
    setTimeout(closePasswordModal,1200);
  }catch(err){
    console.error(err);
    msg.textContent=err.message||'No se pudo actualizar la contraseña.';
  }finally{
    submit.disabled=false;
    submit.textContent='Actualizar contraseña';
  }
});

$('#logoutButton').addEventListener('click',async()=>{await PortfolioCloud.signOut();location.href='index.html'});

(async()=>{ if(await guard()) await renderAll(); })();
