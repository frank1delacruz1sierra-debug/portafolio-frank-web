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
function isLinkItem(f){ return f?.kind === 'link' || (!f?.path && f?.type === 'text/url'); }
function safeUrl(value=''){ try{ const u=new URL(String(value||'')); return ['http:','https:'].includes(u.protocol) ? u.href : ''; }catch{return '';} }
function displayUrl(value=''){ try{ const u=new URL(value); return `${u.hostname.replace(/^www\./,'')}${u.pathname==='/'?'':u.pathname}`; }catch{return value||'';} }
function linkProvider(value=''){ try{ const h=new URL(value).hostname.replace(/^www\./,'').toLowerCase(); if(h==='figma.com'||h.endsWith('.figma.com')) return 'Figma'; if(h==='github.com'||h.endsWith('.github.com')) return 'GitHub'; if(h==='drive.google.com'||h==='docs.google.com') return 'Google Drive'; if(h==='youtube.com'||h==='youtu.be'||h.endsWith('.youtube.com')) return 'YouTube'; return 'Enlace'; }catch{return 'Enlace';} }
function linkAction(value=''){ const p=linkProvider(value); return p==='Figma'?'Abrir en Figma':p==='GitHub'?'Abrir GitHub':p==='Google Drive'?'Abrir Drive':p==='YouTube'?'Ver video':'Abrir enlace'; }
function linkCode(value=''){ const p=linkProvider(value); return p==='Figma'?'FIGMA':p==='GitHub'?'GITHUB':p==='Google Drive'?'DRIVE':p==='YouTube'?'VIDEO':'LINK'; }
function formatDescription(text=''){
  const src=String(text||'');
  const re=/(https?:\/\/[^\s<]+)/gi;
  let out='', last=0, match;
  while((match=re.exec(src))){
    out += escapeHtml(src.slice(last,match.index));
    const clean=match[0].replace(/[),.;!?]+$/,'');
    const trailing=match[0].slice(clean.length);
    const url=safeUrl(clean);
    out += url ? `<a class="inline-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(clean)}</a>` : escapeHtml(match[0]);
    out += escapeHtml(trailing);
    last=match.index+match[0].length;
  }
  out += escapeHtml(src.slice(last));
  return out;
}

function renderUnits(){
  const host = $('#unitSelector'); host.innerHTML='';
  for(let i=1;i<=4;i++){
    const b=document.createElement('button');
    b.className=`unit-btn ${i===activeUnit?'active':''}`; b.textContent=`Unidad ${i}`;
    b.onclick=()=>{activeUnit=i;renderUnits();renderWeeks()}; host.appendChild(b);
  }
}

function compactFileCard(f){
  const link=isLinkItem(f);
  const label=escapeHtml(f.label||f.name||(link?'Enlace':'Archivo'));
  const original=escapeHtml(link?displayUrl(f.url):(f.name||'archivo'));
  const category=escapeHtml(f.category||(link?'Enlace':'Archivo'));
  const note=f.note?`<p class="week-file-note">${escapeHtml(f.note)}</p>`:'';
  const rawUrl=safeUrl(f.url);
  const url=escapeHtml(rawUrl);
  if(!rawUrl) return '';
  const thumb=!link && isImage(f.name)?`<a class="week-file-thumb" href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${label}" loading="lazy"></a>`:'';
  const actions=link
    ? `<div class="file-actions"><a href="${url}" target="_blank" rel="noopener noreferrer">${linkAction(rawUrl)}</a><button type="button" class="copy-link-btn" data-copy-url="${url}">Copiar enlace</button></div>`
    : `<div class="file-actions"><a href="${url}" target="_blank" rel="noopener">Ver</a><a href="${url}?download=${encodeURIComponent(f.name||'archivo')}" target="_blank" rel="noopener">Descargar</a></div>`;
  return `<article class="file-card multi-public-file ${link?'public-link-card':''}">
    ${thumb}
    <div class="week-file-content">
      <div class="file-meta">
        <div class="file-icon">${link?linkCode(rawUrl):fileType(f.name)}</div>
        <div class="file-name-wrap">
          <div class="file-name">${label}</div>
          <small>${category} · ${original}</small>
        </div>
      </div>
      ${note}
      ${actions}
    </div>
  </article>`;
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
    if(a.description){ const p=document.createElement('p'); p.className='week-description'; p.innerHTML=formatDescription(a.description); card.appendChild(p); }
    const files=publishedFiles(a);
    if(files.length){
      const wrap=document.createElement('div'); wrap.className='week-files-list';
      files.forEach(f=>wrap.insertAdjacentHTML('beforeend',compactFileCard(f)));
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
    const link=isLinkItem(f);
    const rawUrl=safeUrl(f.url);
    if(!rawUrl) return '';
    const url=escapeHtml(rawUrl);
    const label=escapeHtml(f.label||f.name||(link?`Enlace ${index+1}`:`Archivo ${index+1}`));
    const note=f.note?`<small>${escapeHtml(f.note)}</small>`:'';
    const original=escapeHtml(link?displayUrl(rawUrl):(f.name||'archivo'));
    const buttons=link
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkAction(rawUrl)}</a><button type="button" class="copy-link-btn" data-copy-url="${url}">Copiar</button>`
      : `<a href="${url}" target="_blank" rel="noopener">Ver</a><a href="${url}?download=${encodeURIComponent(f.name||'archivo')}" target="_blank" rel="noopener">Descargar</a>`;
    return `<article class="project-file-row ${link?'project-link-row':''}">
      <span class="project-file-order">${String(index+1).padStart(2,'0')}</span>
      <span class="project-file-kind">${link?linkCode(rawUrl):fileType(f.name)}</span>
      <div class="project-file-info"><strong title="${label}">${label}</strong><span>${escapeHtml(f.category||(link?'Enlace':'Archivo'))} · ${original}</span>${note}</div>
      <div class="project-file-buttons">${buttons}</div>
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
  const firstImage=files.find(f=>!isLinkItem(f) && isImage(f.name));
  const preview=firstImage ? `<a href="${escapeHtml(firstImage.url)}" target="_blank" rel="noopener" class="project-preview"><img src="${escapeHtml(firstImage.url)}" alt="Vista previa de ${escapeHtml(firstImage.label||firstImage.name)}" loading="lazy"></a>` : '';
  card.innerHTML=`
    <div class="project-card-top">
      <span class="project-course">${escapeHtml(courseLabel)}</span>
      <span class="project-position">U${a.unit} · S${a.week}</span>
    </div>
    ${preview}
    <div class="project-card-body">
      <h3>${escapeHtml(a.title || `${courseLabel} · Unidad ${a.unit} · Semana ${a.week}`)}</h3>
      <p>${formatDescription(a.description || 'Actividad publicada.')}</p>
      <div class="project-files-heading"><span>${files.length}</span> elemento(s) publicados</div>
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

document.addEventListener('click',async e=>{
  const button=e.target.closest('.copy-link-btn');
  if(!button) return;
  const url=button.dataset.copyUrl;
  if(!url) return;
  const previous=button.textContent;
  try{
    await navigator.clipboard.writeText(url);
    button.textContent='Copiado';
  }catch{
    const area=document.createElement('textarea');
    area.value=url; area.style.position='fixed'; area.style.opacity='0';
    document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    button.textContent='Copiado';
  }
  setTimeout(()=>button.textContent=previous,1200);
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
