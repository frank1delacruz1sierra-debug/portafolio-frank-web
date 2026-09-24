const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const courses = {
  algoritmos: { short: 'Algoritmos', full: 'Algoritmos y bases de datos' },
  aplicaciones: { short: 'Aplicaciones', full: 'Desarrollo de aplicaciones' }
};
const categories = ['Documento', 'Código', 'Imagen', 'Presentación', 'Hoja de cálculo', 'Comprimido', 'Figma', 'GitHub', 'Google Drive', 'YouTube', 'Enlace', 'Otro'];
let course = 'algoritmos', unit = 1, week = 1, currentActivity = null, stagedFiles = [], activityTabs = [{ id: 'general', label: 'Contenido', order: 0 }];

function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function escapeHtml(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function fileCode(name=''){
  const ext=name.split('.').pop()?.toLowerCase()||'';
  if(['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return 'IMG';
  if(ext==='pdf') return 'PDF';
  if(['doc','docx','odt','txt'].includes(ext)) return 'DOC';
  if(['xls','xlsx','csv'].includes(ext)) return 'XLS';
  if(['ppt','pptx'].includes(ext)) return 'PPT';
  if(['zip','rar','7z'].includes(ext)) return 'ZIP';
  if(['java','js','html','css','php','py','sql','jsp','json','xml','c','cpp','cs'].includes(ext)) return 'CODE';
  return 'FILE';
}
function inferCategory(name=''){
  const code=fileCode(name);
  return ({IMG:'Imagen',PDF:'Documento',DOC:'Documento',XLS:'Hoja de cálculo',PPT:'Presentación',ZIP:'Comprimido',CODE:'Código'})[code]||'Enlace/otro';
}
function baseName(name='archivo') { return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g,' ').trim() || 'Archivo'; }
function isLinkItem(item){ return item?.kind === 'link' || (!item?.path && item?.type === 'text/url'); }
function itemCode(item){ if(!isLinkItem(item)) return fileCode(item?.name || ''); const p=linkProvider(item?.url||''); return p==='Figma'?'FIGMA':p==='GitHub'?'GITHUB':p==='Google Drive'?'DRIVE':p==='YouTube'?'VIDEO':'LINK'; }
function normalizeHttpUrl(value=''){
  const raw=String(value).trim();
  if(!raw) throw new Error('Escribe una dirección web.');
  const candidate=/^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed=new URL(candidate);
  if(!['http:','https:'].includes(parsed.protocol)) throw new Error('El enlace debe comenzar con http:// o https://.');
  return parsed.href;
}
function linkProvider(url=''){ try { const h=new URL(url).hostname.replace(/^www\./,'').toLowerCase(); if(h==='figma.com'||h.endsWith('.figma.com')) return 'Figma'; if(h==='github.com'||h.endsWith('.github.com')) return 'GitHub'; if(h==='drive.google.com'||h==='docs.google.com') return 'Google Drive'; if(h==='youtube.com'||h==='youtu.be'||h.endsWith('.youtube.com')) return 'YouTube'; return 'Enlace'; } catch { return 'Enlace'; } }
function linkName(url=''){ const provider=linkProvider(url); if(provider==='Figma') return 'Diseño de Figma'; if(provider==='GitHub') return 'Repositorio de GitHub'; if(provider==='Google Drive') return 'Archivo de Google Drive'; if(provider==='YouTube') return 'Video de YouTube'; try { return new URL(url).hostname.replace(/^www\./,'') || 'Enlace'; } catch { return 'Enlace'; } }

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

function renderUnits(){
  const h=$('#adminUnits'); h.innerHTML='';
  for(let i=1;i<=4;i++){
    const b=document.createElement('button');
    b.className=`admin-unit ${i===unit?'active':''}`;
    b.textContent=`Unidad ${i}`;
    b.onclick=()=>{unit=i;week=1;renderAll()};
    h.appendChild(b);
  }
}

async function renderWeeks(){
  const h=$('#adminWeeks'); h.innerHTML='';
  let all=[];
  try{ all=await PortfolioDB.listAll(); }catch(err){ console.error(err); }
  for(let i=1;i<=4;i++){
    const a=all.find(x=>x.course===course && x.unit===unit && x.week===i);
    const state = !a ? 'Vacía' : a.status==='draft' ? 'Borrador' : 'Publicada';
    const b=document.createElement('button');
    b.className=`admin-week ${i===week?'active':''}`;
    b.innerHTML=`<div class="admin-week-top"><strong>Semana ${i}</strong><span class="week-state ${a?.status==='published'?'published':a?.status==='draft'?'draft':''}">${state}</span></div><p>${a?(a.title||a.description||'Actividad guardada').slice(0,75):'Selecciona esta semana para preparar una actividad.'}</p>`;
    b.onclick=()=>{week=i;renderAll()};
    h.appendChild(b);
  }
}

function cloneExistingFiles(files=[]){
  return files.map((f,index)=>({
    key: uid(),
    existing: true,
    kind: f.kind || ((!f.path && f.type === 'text/url') ? 'link' : 'file'),
    id: f.id,
    name: f.name,
    type: f.type,
    path: f.path,
    url: f.url,
    label: f.label || f.name,
    category: f.category || ((!f.path && f.type === 'text/url') ? linkProvider(f.url||'') : inferCategory(f.name)),
    note: f.note || '',
    tabId: f.tabId || 'general',
    tabLabel: f.tabLabel || 'Contenido',
    tabOrder: Number.isFinite(Number(f.tabOrder)) ? Number(f.tabOrder) : 0,
    embed: f.embed !== false,
    order:index
  }));
}

function deriveTabs(files=[]){
  const map=new Map();
  files.forEach(item=>{
    const id=item.tabId||'general';
    if(!map.has(id)){
      map.set(id,{
        id,
        label:item.tabLabel||'Contenido',
        order:Number.isFinite(Number(item.tabOrder))?Number(item.tabOrder):map.size
      });
    }
  });
  const tabs=[...map.values()].sort((a,b)=>a.order-b.order);
  return tabs.length?tabs.map((t,i)=>({...t,order:i})):[{id:'general',label:'Contenido',order:0}];
}

function syncTabMetadata(){
  if(!activityTabs.length) activityTabs=[{id:'general',label:'Contenido',order:0}];
  activityTabs.forEach((tab,index)=>tab.order=index);
  stagedFiles.forEach(item=>{
    const tab=activityTabs.find(t=>t.id===item.tabId)||activityTabs[0];
    item.tabId=tab.id;
    item.tabLabel=tab.label;
    item.tabOrder=tab.order;
  });
}

function renderTabOrganizer(){
  const host=$('#tabOrganizer');
  if(!host) return;
  syncTabMetadata();
  host.innerHTML='';
  activityTabs.forEach((tab,index)=>{
    const count=stagedFiles.filter(item=>item.tabId===tab.id).length;
    const row=document.createElement('div');
    row.className='tab-organizer-row';
    row.dataset.tabId=tab.id;
    row.innerHTML=`
      <span class="tab-drag-index">${String(index+1).padStart(2,'0')}</span>
      <input class="text-input tab-name-input" data-tab-field="label" value="${escapeHtml(tab.label)}" maxlength="70" aria-label="Nombre de la pestaña" />
      <span class="tab-item-count">${count} elemento(s)</span>
      <div class="tab-row-actions">
        <button type="button" data-tab-action="up" ${index===0?'disabled':''} title="Mover pestaña a la izquierda">←</button>
        <button type="button" data-tab-action="down" ${index===activityTabs.length-1?'disabled':''} title="Mover pestaña a la derecha">→</button>
        <button type="button" data-tab-action="remove" class="remove-file" ${activityTabs.length===1?'disabled':''} title="Eliminar pestaña">×</button>
      </div>`;
    host.appendChild(row);
  });
}

function renderFileOrganizer(){
  const host=$('#fileOrganizer');
  syncTabMetadata();
  renderTabOrganizer();
  $('#fileCount').textContent=stagedFiles.length;
  if(!stagedFiles.length){
    host.innerHTML='<div class="organizer-empty"><strong>Aún no agregaste contenido</strong><span>Selecciona archivos o agrega enlaces y luego ordénalos aquí antes de publicar.</span></div>';
    renderPreview();
    return;
  }
  host.innerHTML='';
  stagedFiles.forEach((item,index)=>{
    const card=document.createElement('article');
    card.className='organizer-item';
    card.dataset.key=item.key;
    const tabOptions=activityTabs.map(tab=>`<option value="${escapeHtml(tab.id)}" ${tab.id===item.tabId?'selected':''}>${escapeHtml(tab.label)}</option>`).join('');
    const embedOption=isLinkItem(item)?`
      <label class="organizer-embed">
        <input type="checkbox" data-field="embed" ${item.embed!==false?'checked':''}>
        <span>Mostrar vista previa dentro del portafolio</span>
      </label>`:'';
    card.innerHTML=`
      <div class="organizer-index">${String(index+1).padStart(2,'0')}</div>
      <div class="organizer-main">
        <div class="organizer-file-head">
          <span class="organizer-type">${itemCode(item)}</span>
          <div><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><small>${isLinkItem(item) ? `${linkProvider(item.url||'')} · ${item.existing?'guardado':'nuevo'}` : (item.existing?'Archivo ya guardado':'Archivo nuevo')}</small></div>
        </div>
        <div class="organizer-fields organizer-fields-expanded">
          <label>Nombre visible<input data-field="label" value="${escapeHtml(item.label)}" placeholder="Ej. INF Método 1.1"></label>
          <label>Tipo<select data-field="category">${categories.map(c=>`<option ${c===item.category?'selected':''}>${c}</option>`).join('')}</select></label>
          <label>Pestaña<select data-field="tabId">${tabOptions}</select></label>
          <label class="organizer-note">Nota opcional<input data-field="note" value="${escapeHtml(item.note)}" placeholder="Ej. Resultado del ejercicio 1.1"></label>
          ${embedOption}
        </div>
      </div>
      <div class="organizer-controls">
        <button type="button" data-action="up" title="Subir" ${index===0?'disabled':''}>↑</button>
        <button type="button" data-action="down" title="Bajar" ${index===stagedFiles.length-1?'disabled':''}>↓</button>
        ${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" title="Abrir contenido">↗</a>`:''}
        <button type="button" data-action="remove" class="remove-file" title="Quitar">×</button>
      </div>`;
    host.appendChild(card);
  });
  renderPreview();
}

function previewFile(item,index){
  return `<div class="preview-file"><span>${String(index+1).padStart(2,'0')}</span><div><strong>${escapeHtml(item.label||item.name)}</strong><small>${escapeHtml(item.category||'Archivo')}${item.note?` · ${escapeHtml(item.note)}`:''}</small></div></div>`;
}

function renderPreview(){
  syncTabMetadata();
  const title=$('#activityTitle')?.value.trim()||'Título de la actividad';
  const description=$('#description')?.value.trim()||'La descripción aparecerá aquí cuando la escribas.';
  $('#previewTitle').textContent=title;
  $('#previewDescription').textContent=description;
  $('#previewPosition').textContent=`${courses[course].short} · U${unit} · S${week}`;
  const groups=activityTabs.map(tab=>({tab,items:stagedFiles.filter(item=>item.tabId===tab.id)})).filter(group=>group.items.length);
  $('#previewFiles').innerHTML=groups.length
    ? groups.map(group=>`<div class="preview-tab-group"><strong class="preview-tab-title">${escapeHtml(group.tab.label)}</strong>${group.items.map(previewFile).join('')}</div>`).join('')
    : '<span class="preview-empty">Sin archivos organizados todavía.</span>';
}

async function loadEditor(){
  currentActivity=await PortfolioDB.get(course,unit,week);
  $('#editorTitle').textContent=`Unidad ${unit} · Semana ${week}`;
  $('#activityTitle').value=currentActivity?.title||'';
  $('#description').value=currentActivity?.description||'';
  $('#fileInput').value='';
  stagedFiles=cloneExistingFiles(currentActivity?.files||[]);
  activityTabs=deriveTabs(stagedFiles);
  const state=!currentActivity?'Vacía':currentActivity.status==='draft'?'Borrador':'Publicada';
  $('#editorStatus').textContent=state;
  $('#editorStatus').className=`editor-status ${currentActivity?.status||'empty'}`;
  $('#formMessage').textContent='';
  $('#formMessage').className='form-message';
  renderFileOrganizer();
}

async function updateStats(){
  const all=await PortfolioDB.listAll();
  const n=all.filter(a=>a.course===course && a.status==='published').length;
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
$('#activityTitle').addEventListener('input',renderPreview);
$('#description').addEventListener('input',renderPreview);

$('#fileInput').addEventListener('change',e=>{
  const selected=[...e.target.files];
  selected.forEach(file=>stagedFiles.push({
    key:uid(), existing:false, kind:'file', file, name:file.name, type:file.type||'', path:'', url:'',
    label:baseName(file.name), category:inferCategory(file.name), note:'', tabId:activityTabs[0].id, tabLabel:activityTabs[0].label, tabOrder:activityTabs[0].order, embed:false, order:stagedFiles.length
  }));
  e.target.value='';
  renderFileOrganizer();
});

$('#addLinkButton').addEventListener('click',()=>{
  const labelInput=$('#linkLabel');
  const urlInput=$('#linkUrl');
  const msg=$('#formMessage');
  try{
    const url=normalizeHttpUrl(urlInput.value);
    const label=labelInput.value.trim() || linkName(url);
    stagedFiles.push({
      key:uid(), existing:false, kind:'link', id:`link-${uid()}`, name:linkName(url), type:'text/url', path:'', url,
      label, category:linkProvider(url), note:'', tabId:activityTabs[0].id, tabLabel:activityTabs[0].label, tabOrder:activityTabs[0].order, embed:true, order:stagedFiles.length
    });
    labelInput.value='';
    urlInput.value='';
    msg.textContent='';
    renderFileOrganizer();
  }catch(err){
    msg.className='form-message';
    msg.textContent=err.message || 'No se pudo agregar el enlace.';
    urlInput.focus();
  }
});

$('#linkUrl').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); $('#addLinkButton').click(); }
});

$('#addTabButton').addEventListener('click',()=>{
  const input=$('#newTabName');
  const label=input.value.trim();
  if(!label){ $('#formMessage').className='form-message'; $('#formMessage').textContent='Escribe un nombre para la nueva pestaña.'; input.focus(); return; }
  activityTabs.push({id:`tab-${uid()}`,label,order:activityTabs.length});
  input.value='';
  $('#formMessage').textContent='';
  renderFileOrganizer();
});
$('#newTabName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#addTabButton').click();}});

$('#tabOrganizer').addEventListener('input',e=>{
  const row=e.target.closest('.tab-organizer-row');
  if(!row || e.target.dataset.tabField!=='label') return;
  const tab=activityTabs.find(t=>t.id===row.dataset.tabId);
  if(!tab) return;
  tab.label=e.target.value || 'Pestaña';
  syncTabMetadata();
  $$('#fileOrganizer select[data-field="tabId"]').forEach(select=>{
    const option=[...select.options].find(opt=>opt.value===tab.id);
    if(option) option.textContent=tab.label;
  });
  renderPreview();
});
$('#tabOrganizer').addEventListener('click',e=>{
  const btn=e.target.closest('[data-tab-action]');
  if(!btn) return;
  const row=btn.closest('.tab-organizer-row');
  const index=activityTabs.findIndex(t=>t.id===row.dataset.tabId);
  if(index<0) return;
  if(btn.dataset.tabAction==='up' && index>0) [activityTabs[index-1],activityTabs[index]]=[activityTabs[index],activityTabs[index-1]];
  if(btn.dataset.tabAction==='down' && index<activityTabs.length-1) [activityTabs[index+1],activityTabs[index]]=[activityTabs[index],activityTabs[index+1]];
  if(btn.dataset.tabAction==='remove' && activityTabs.length>1){
    const removed=activityTabs[index];
    const target=activityTabs[index===0?1:0];
    stagedFiles.forEach(item=>{if(item.tabId===removed.id)item.tabId=target.id;});
    activityTabs.splice(index,1);
  }
  renderFileOrganizer();
});

$('#fileOrganizer').addEventListener('input',e=>{
  const card=e.target.closest('.organizer-item');
  if(!card) return;
  const item=stagedFiles.find(x=>x.key===card.dataset.key);
  if(!item) return;
  const field=e.target.dataset.field;
  if(!field || e.target.type==='checkbox' || e.target.tagName==='SELECT') return;
  item[field]=e.target.value;
  renderPreview();
});
$('#fileOrganizer').addEventListener('change',e=>{
  const card=e.target.closest('.organizer-item');
  if(!card) return;
  const item=stagedFiles.find(x=>x.key===card.dataset.key);
  if(!item) return;
  const field=e.target.dataset.field;
  if(!field) return;
  if(field==='embed') item.embed=e.target.checked;
  else if(field==='tabId'){
    item.tabId=e.target.value;
    const tab=activityTabs.find(t=>t.id===item.tabId)||activityTabs[0];
    item.tabLabel=tab.label; item.tabOrder=tab.order;
  } else item[field]=e.target.value;
  renderFileOrganizer();
});
$('#fileOrganizer').addEventListener('click',e=>{
  const btn=e.target.closest('[data-action]');
  if(!btn) return;
  const card=btn.closest('.organizer-item');
  const index=stagedFiles.findIndex(x=>x.key===card.dataset.key);
  if(index<0) return;
  if(btn.dataset.action==='remove') stagedFiles.splice(index,1);
  if(btn.dataset.action==='up' && index>0) [stagedFiles[index-1],stagedFiles[index]]=[stagedFiles[index],stagedFiles[index-1]];
  if(btn.dataset.action==='down' && index<stagedFiles.length-1) [stagedFiles[index+1],stagedFiles[index]]=[stagedFiles[index],stagedFiles[index+1]];
  renderFileOrganizer();
});

async function saveActivity(status){
  const title=$('#activityTitle').value.trim();
  const description=$('#description').value.trim();
  const msg=$('#formMessage');
  const buttons=$$('.publish-actions button');
  msg.className='form-message';

  if(status==='published'){
    if(!title){msg.textContent='Escribe un título para la actividad antes de publicarla.';return}
    if(!description){msg.textContent='Escribe una descripción antes de publicar.';return}
    if(!stagedFiles.length){msg.textContent='Agrega al menos un archivo o enlace antes de publicar.';return}
  } else if(!title && !description && !stagedFiles.length){
    msg.textContent='Agrega algún contenido antes de guardar el borrador.'; return;
  }

  try{
    syncTabMetadata();
    buttons.forEach(b=>b.disabled=true);
    msg.textContent=status==='published'?'Guardando contenido y publicando…':'Guardando borrador…';
    const saved=await PortfolioDB.save({
      course,unit,week,title,description,status,
      files:stagedFiles,
      currentActivity
    });
    currentActivity=saved;
    stagedFiles=cloneExistingFiles(saved.files);
    msg.className='form-message success';
    msg.textContent=status==='published'
      ? `Actividad publicada con ${saved.files.length} elemento(s). Ya es visible en el portafolio.`
      : `Borrador guardado con ${saved.files.length} elemento(s). Todavía no aparece en la página pública.`;
    $('#editorStatus').textContent=status==='published'?'Publicada':'Borrador';
    $('#editorStatus').className=`editor-status ${status}`;
    renderFileOrganizer();
    await renderWeeks();
    await updateStats();
  }catch(err){
    console.error(err);
    msg.className='form-message';
    msg.textContent=`No se pudo guardar: ${err.message}`;
  }finally{
    buttons.forEach(b=>b.disabled=false);
  }
}

$('#activityForm').addEventListener('submit',async e=>{e.preventDefault();await saveActivity('published')});
$('#draftButton').addEventListener('click',()=>saveActivity('draft'));

$('#deleteButton').addEventListener('click',async()=>{
  const a=await PortfolioDB.get(course,unit,week);
  if(!a){$('#formMessage').className='form-message';$('#formMessage').textContent='Esta semana no tiene una actividad guardada.';return}
  if(!confirm(`¿Eliminar completamente la actividad de la semana ${week} y todo su contenido?`))return;
  try{
    await PortfolioDB.remove(course,unit,week);
    $('#activityTitle').value='';
    $('#description').value='';
    stagedFiles=[];
    activityTabs=[{id:'general',label:'Contenido',order:0}];
    currentActivity=null;
    $('#editorStatus').textContent='Vacía';
    $('#editorStatus').className='editor-status empty';
    $('#formMessage').className='form-message success';
    $('#formMessage').textContent='Actividad y contenido eliminados.';
    renderFileOrganizer();
    await renderWeeks();await updateStats();
  }catch(err){
    $('#formMessage').className='form-message';
    $('#formMessage').textContent=`No se pudo eliminar: ${err.message}`;
  }
});
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
    submit.disabled=true;submit.textContent='Actualizando…';
    msg.textContent='Verificando y actualizando tu contraseña…';
    await PortfolioCloud.changePassword(current,next);
    msg.className='password-message success';
    msg.textContent='Contraseña actualizada correctamente.';
    $('#passwordForm').reset();
    setTimeout(closePasswordModal,1200);
  }catch(err){console.error(err);msg.textContent=err.message||'No se pudo actualizar la contraseña.'}
  finally{submit.disabled=false;submit.textContent='Actualizar contraseña'}
});

$('#logoutButton').addEventListener('click',async()=>{await PortfolioCloud.signOut();location.href='index.html'});
(async()=>{ if(await guard()) await renderAll(); })();
