const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const courses = {
  algoritmos: { short: 'Algoritmos', full: 'Algoritmos y bases de datos', accent: '#44d7ff' },
  aplicaciones: { short: 'Aplicaciones', full: 'Desarrollo de aplicaciones', accent: '#ff6f91' }
};
let activeCourse = 'algoritmos';
let activeUnit = 1;
let authSession = null;
let projectFilter = 'all';

function updateLoginLabel(){ $('#loginButtonText').textContent = authSession ? 'Mi panel' : 'Iniciar sesión'; }

function fileType(name=''){
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if(['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return 'IMG';
  if(ext==='pdf') return 'PDF';
  if(['doc','docx','odt','txt'].includes(ext)) return 'DOC';
  if(['xls','xlsx','csv'].includes(ext)) return 'XLS';
  if(['ppt','pptx'].includes(ext)) return 'PPT';
  if(['zip','rar','7z'].includes(ext)) return 'ZIP';
  if(['java','js','html','css','php','py','sql','jsp','json','xml','c','cpp','cs'].includes(ext)) return 'CODE';
  return 'FILE';
}
function isImage(name=''){ return ['png','jpg','jpeg','gif','webp','svg'].includes(name.split('.').pop()?.toLowerCase()); }
function escapeHtml(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function publishedFiles(a){ return (a?.files || []).filter(f=>f?.url); }

function renderUnits(){
  const host = $('#unitSelector'); host.innerHTML='';
  for(let i=1;i<=4;i++){
    const b=document.createElement('button');
    b.className=`unit-btn ${i===activeUnit?'active':''}`; b.textContent=`Unidad ${i}`;
    b.onclick=()=>{activeUnit=i;renderUnits();renderWeeks()}; host.appendChild(b);
  }
}

function compactFileCard(f){
  const name=escapeHtml(f.label||f.name||'Archivo');
  const rawName=escapeHtml(f.name||'archivo');
  const url=escapeHtml(f.url||'');
  return `<div class="file-card multi-public-file">
    <div class="file-meta"><div class="file-icon">${fileType(f.name)}</div><div class="file-name-wrap"><div class="file-name" title="${name}">${name}</div><small>${escapeHtml(f.category||'Archivo')}</small></div></div>
    <div class="file-actions"><a href="${url}" target="_blank" rel="noopener">Ver</a><a href="${url}?download=${encodeURIComponent(f.name||'archivo')}" target="_blank" rel="noopener">Descargar</a></div>
  </div>`;
}

function makeWeekCard(week, a){
  const card=document.createElement('article');
  card.className='week-card';
  card.style.setProperty('--course-accent',courses[activeCourse].accent);
  card.style.animationDelay=`${(week-1)*70}ms`;
  const top=document.createElement('div');
  top.className='week-top';
  top.innerHTML=`<div class="week-number">${String(week).padStart(2,'0')}</div>${a?'<span class="published-dot" title="Actividad publicada"></span>':''}`;
  card.appendChild(top);
  const h=document.createElement('h3'); h.textContent=`Semana ${week}`; card.appendChild(h);

  if(a){
    if(a.title){ const t=document.createElement('h4'); t.className='week-activity-title'; t.textContent=a.title; card.appendChild(t); }
    if(a.description){ const p=document.createElement('p'); p.className='week-description'; p.textContent=a.description; card.appendChild(p); }
    const files=publishedFiles(a);
    if(files.length){
      const wrap=document.createElement('div'); wrap.className='week-files-list';
      files.slice(0,3).forEach(f=>wrap.insertAdjacentHTML('beforeend',compactFileCard(f)));
      if(files.length>3){const more=document.createElement('div');more.className='more-files';more.textContent=`+ ${files.length-3} archivo(s) más en Proyectos entregados`;wrap.appendChild(more)}
      card.appendChild(wrap);
    }
  } else {
    const empty=document.createElement('div'); empty.className='week-empty'; card.appendChild(empty);
  }
  return card;
}

async function renderWeeks(){
  const grid=$('#weeksGrid'); grid.innerHTML='';
  for(let week=1;week<=4;week++) grid.appendChild(makeWeekCard(week,null));
  if(!PortfolioCloud.isConfigured()) return;
  try{
    const all=await PortfolioDB.listAll();
    const map=new Map(all.filter(a=>a.status==='published' && a.course===activeCourse && a.unit===activeUnit).map(a=>[a.week,a]));
    grid.innerHTML='';
    for(let week=1;week<=4;week++) grid.appendChild(makeWeekCard(week,map.get(week)||null));
  }catch(err){ console.error(err); }
}

function projectFileList(a){
  const files=publishedFiles(a);
  if(!files.length) return '';
  return `<div class="project-files-list">${files.map((f,index)=>{
    const url=escapeHtml(f.url);
    const label=escapeHtml(f.label||f.name||`Archivo ${index+1}`);
    const note=f.note?`<small>${escapeHtml(f.note)}</small>`:'';
    return `<article class="project-file-row">
      <span class="project-file-order">${String(index+1).padStart(2,'0')}</span>
      <span class="project-file-kind">${fileType(f.name)}</span>
      <div class="project-file-info"><strong title="${label}">${label}</strong><span>${escapeHtml(f.category||'Archivo')}</span>${note}</div>
      <div class="project-file-buttons"><a href="${url}" target="_blank" rel="noopener">Ver</a><a href="${url}?download=${encodeURIComponent(f.name||'archivo')}" target="_blank" rel="noopener">Descargar</a></div>
    </article>`;
  }).join('')}</div>`;
}

function makeProjectCard(a,index=0){
  const card=document.createElement('article');
  card.className='project-card project-card-multi';
  card.style.setProperty('--project-accent',courses[a.course]?.accent||'#44d7ff');
  card.style.animationDelay=`${Math.min(index*55,330)}ms`;
  const courseLabel=courses[a.course]?.short||a.course;
  const files=publishedFiles(a);
  const firstImage=files.find(f=>isImage(f.name));
  const preview=firstImage ? `<a href="${escapeHtml(firstImage.url)}" target="_blank" rel="noopener" class="project-preview"><img src="${escapeHtml(firstImage.url)}" alt="Vista previa de ${escapeHtml(firstImage.label||firstImage.name)}" loading="lazy"></a>` : '';
  card.innerHTML=`
    <div class="project-card-top">
      <span class="project-course">${escapeHtml(courseLabel)}</span>
      <span class="project-position">U${a.unit} · S${a.week}</span>
    </div>
    ${preview}
    <div class="project-card-body">
      <h3>${escapeHtml(a.title || `${courseLabel} · Unidad ${a.unit} · Semana ${a.week}`)}</h3>
      <p>${escapeHtml(a.description || 'Actividad publicada.')}</p>
      <div class="project-files-heading"><span>${files.length}</span> archivo(s) publicados</div>
      ${projectFileList(a)}
    </div>`;
  return card;
}

async function renderProjects(){
  const grid=$('#projectsGrid');
  if(!grid) return;
  if(!PortfolioCloud.isConfigured()){
    grid.innerHTML='<div class="projects-empty"><strong>Sin conexión</strong><span>Configura Supabase para mostrar las actividades publicadas.</span></div>';
    $('#projectsCount').textContent='0';
    return;
  }
  grid.innerHTML='<div class="projects-loading">Cargando actividades publicadas…</div>';
  try{
    let all=await PortfolioDB.listAll();
    all=all.filter(a=>a.status==='published' && (publishedFiles(a).length || a.description || a.title));
    const filtered=projectFilter==='all' ? all : all.filter(a=>a.course===projectFilter);
    $('#projectsCount').textContent=filtered.length;
    grid.innerHTML='';
    if(!filtered.length){
      grid.innerHTML='<div class="projects-empty"><strong>Aún no hay actividades publicadas</strong><span>Cuando Frank publique una actividad desde su panel aparecerá aquí automáticamente.</span></div>';
      return;
    }
    filtered.forEach((a,i)=>grid.appendChild(makeProjectCard(a,i)));
  }catch(err){
    console.error(err);
    $('#projectsCount').textContent='0';
    grid.innerHTML='<div class="projects-empty"><strong>No se pudieron cargar las actividades</strong><span>Intenta actualizar la página en unos segundos.</span></div>';
  }
}

async function setCourse(course){
  activeCourse=course; activeUnit=1;
  $$('.course-window').forEach(b=>b.classList.toggle('active',b.dataset.course===course));
  $('#courseKicker').textContent=courses[course].full.toUpperCase();
  $('#activitiesHeading').textContent=`${courses[course].short} · 4 unidades`;
  renderUnits(); await renderWeeks();
}

function openModal(){ $('#loginModal').classList.add('open'); $('#loginModal').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(()=>$('#loginUser').focus(),120); }
function closeModal(){ $('#loginModal').classList.remove('open'); $('#loginModal').setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

$('#loginOpenBtn').addEventListener('click',async()=>{
  authSession = await PortfolioCloud.session();
  updateLoginLabel();
  if(authSession) location.href='admin.html'; else openModal();
});

$('#loginForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const button=e.currentTarget.querySelector('button[type="submit"]');
  const u=$('#loginUser').value.trim(); const p=$('#loginPassword').value;
  $('#loginMessage').classList.remove('success');
  if(!PortfolioCloud.isConfigured()){
    $('#loginMessage').textContent='Primero configura Supabase en supabase-config.js.';
    return;
  }
  try{
    button.disabled=true; button.textContent='Verificando…';
    await PortfolioCloud.signIn(u,p);
    authSession=await PortfolioCloud.session();
    $('#loginMessage').textContent='Acceso correcto. Abriendo tu panel…';
    $('#loginMessage').classList.add('success');
    setTimeout(()=>location.href='admin.html',350);
  }catch(err){ $('#loginMessage').textContent=err.message || 'No se pudo iniciar sesión.'; }
  finally{ button.disabled=false; button.innerHTML='Entrar al panel <span>→</span>'; }
});

$('#forgotPasswordBtn').addEventListener('click',async()=>{
  const btn=$('#forgotPasswordBtn'); const msg=$('#loginMessage');
  if(!PortfolioCloud.isConfigured()){msg.className='form-message';msg.textContent='Primero configura Supabase en supabase-config.js.';return}
  try{
    btn.disabled=true;btn.textContent='Enviando enlace…';msg.className='form-message';msg.textContent='Solicitando un enlace seguro para cambiar tu contraseña…';
    await PortfolioCloud.sendPasswordReset();
    msg.className='form-message success';msg.textContent='Listo. Revisa tu correo y abre el enlace para crear una nueva contraseña.';
  }catch(err){console.error(err);msg.className='form-message';msg.textContent=err.message||'No se pudo enviar el correo de recuperación.'}
  finally{btn.disabled=false;btn.innerHTML='¿No recuerdas tu contraseña? <strong>Cambiar contraseña</strong>'}
});

$('#showPassword').addEventListener('click',()=>{const inp=$('#loginPassword');const show=inp.type==='password';inp.type=show?'text':'password';$('#showPassword').textContent=show?'Ocultar':'Ver'});
$$('[data-close="loginModal"]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeModal()});
$$('.course-window').forEach(b=>b.addEventListener('click',()=>setCourse(b.dataset.course)));
$$('.project-filter').forEach(b=>b.addEventListener('click',async()=>{projectFilter=b.dataset.filter;$$('.project-filter').forEach(x=>x.classList.toggle('active',x===b));await renderProjects()}));
$('#menuButton').addEventListener('click',()=>$('#mobileMenu').classList.toggle('open'));
$$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>$('#mobileMenu').classList.remove('open')));

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1});
$$('.reveal').forEach(el=>observer.observe(el));

$$('.tilt-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{if(matchMedia('(pointer:fine)').matches){const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(900px) rotateY(${x*5}deg) rotateX(${-y*4}deg)`}});
  card.addEventListener('mouseleave',()=>card.style.transform='');
});

async function init(){
  $('#year').textContent=new Date().getFullYear();
  authSession=await PortfolioCloud.session();
  updateLoginLabel();
  renderUnits();
  await renderWeeks();
  await renderProjects();
}
init();
