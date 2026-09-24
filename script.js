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
function figmaEmbedUrl(value=''){
  const url=safeUrl(value);
  return url ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}` : '';
}
function youtubeEmbedUrl(value=''){
  try{
    const u=new URL(value);
    let id='';
    if(u.hostname.replace(/^www\./,'')==='youtu.be') id=u.pathname.slice(1).split('/')[0];
    else id=u.searchParams.get('v') || u.pathname.match(/\/shorts\/([^/?]+)/)?.[1] || u.pathname.match(/\/embed\/([^/?]+)/)?.[1] || '';
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : '';
  }catch{return '';}
}
function resourceEmbed(f){
  if(!isLinkItem(f) || f.embed===false) return '';
  const raw=safeUrl(f.url);
  if(!raw) return '';
  const provider=linkProvider(raw);
  let src='';
  if(provider==='Figma') src=figmaEmbedUrl(raw);
  if(provider==='YouTube') src=youtubeEmbedUrl(raw);
  if(!src) return '';
  return `<details class="shared-preview"><summary>Vista previa dentro del portafolio</summary><div class="shared-preview-frame"><iframe src="${escapeHtml(src)}" title="Vista previa de ${escapeHtml(f.label||provider)}" loading="lazy" allowfullscreen></iframe></div></details>`;
}
function resourceGroups(files=[]){
  const map=new Map();
  files.forEach((f,index)=>{
    const id=f.tabId||'general';
    if(!map.has(id)){
      map.set(id,{
        id,
        label:f.tabLabel||'Contenido',
        order:Number.isFinite(Number(f.tabOrder))?Number(f.tabOrder):map.size,
        items:[]
      });
    }
    map.get(id).items.push({...f,_sourceOrder:index});
  });
  return [...map.values()]
    .sort((a,b)=>a.order-b.order)
    .map(group=>({...group,items:group.items.sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0))}));
}
function safeDomId(value=''){return String(value).replace(/[^a-zA-Z0-9_-]/g,'-')}
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

function compactFileCard(f,index=0){
  const link=isLinkItem(f);
  const label=escapeHtml(f.label||f.name||(link?'Enlace':'Archivo'));
  const original=escapeHtml(link?displayUrl(f.url):(f.name||'archivo'));
  const category=escapeHtml(f.category||(link?'Enlace':'Archivo'));
  const note=f.note?`<p class="week-file-note">${escapeHtml(f.note)}</p>`:'';
  const rawUrl=safeUrl(f.url);
  const url=escapeHtml(rawUrl);
  if(!rawUrl) return '';
  const thumb=!link && isImage(f.name)?`<a class="week-file-thumb" href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${label}" loading="lazy"></a>`:'';
  const visibleLink=link?`<a class="shared-link-address" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayUrl(rawUrl))}</a>`:'';
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
      ${visibleLink}
      ${note}
      ${actions}
      ${resourceEmbed(f)}
    </div>
  </article>`;
}

function tabbedResourceMarkup(files,scope){
  const groups=resourceGroups(files);
  if(!groups.length) return '';
  const clean=safeDomId(scope);
  const tabs=groups.map((group,index)=>`<button type="button" class="resource-tab-button ${index===0?'active':''}" data-resource-tab="${clean}-${safeDomId(group.id)}" aria-selected="${index===0?'true':'false'}">${escapeHtml(group.label)} <span>${group.items.length}</span></button>`).join('');
  const panels=groups.map((group,index)=>`<section class="resource-tab-panel ${index===0?'active':''}" data-resource-panel="${clean}-${safeDomId(group.id)}">${group.items.map((item,i)=>compactFileCard(item,i)).join('')}</section>`).join('');
  return `<div class="resource-tabs-shell"><div class="resource-tabs-scroll" role="tablist" aria-label="Grupos de ejercicios">${tabs}</div><div class="resource-tab-panels">${panels}</div></div>`;
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
      wrap.innerHTML=tabbedResourceMarkup(files,`week-${activeCourse}-${activeUnit}-${week}`);
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
  return tabbedResourceMarkup(files,`project-${a.course}-${a.unit}-${a.week}`);
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

document.addEventListener('click',e=>{
  const tab=e.target.closest('.resource-tab-button');
  if(!tab) return;
  const shell=tab.closest('.resource-tabs-shell');
  if(!shell) return;
  shell.querySelectorAll('.resource-tab-button').forEach(btn=>{
    const active=btn===tab;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',active?'true':'false');
  });
  shell.querySelectorAll('.resource-tab-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.resourcePanel===tab.dataset.resourceTab));
  tab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
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
