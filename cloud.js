const PortfolioCloud = (() => {
  let clientInstance = null;
  const cfg = () => window.PORTFOLIO_SUPABASE || {};

  function isConfigured() {
    const c = cfg();
    return Boolean(
      c.url && /^https:\/\//i.test(c.url) &&
      c.publishableKey && !c.publishableKey.includes('PEGA_AQUI') &&
      c.adminEmail && !c.adminEmail.includes('PEGA_AQUI')
    );
  }

  function requireConfig() {
    if (!isConfigured()) {
      throw new Error('Supabase todavía no está configurado. Completa supabase-config.js.');
    }
  }

  function client() {
    requireConfig();
    if (!clientInstance) {
      clientInstance = window.supabase.createClient(cfg().url, cfg().publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return clientInstance;
  }

  function id(course, unit, week) {
    return `${course}-u${unit}-s${week}`;
  }

  function legacyFiles(row) {
    if (!row?.file_url) return [];
    return [{
      id: row.file_path || `legacy-${row.id}`,
      name: row.file_name || 'archivo',
      type: row.file_type || '',
      path: row.file_path || '',
      url: row.file_url || '',
      label: row.file_name || 'Archivo',
      category: 'Archivo',
      note: '',
      order: 0
    }];
  }

  function normalizeFiles(row) {
    const source = Array.isArray(row?.files) && row.files.length ? row.files : legacyFiles(row);
    return source
      .map((item, index) => ({
        kind: item.kind || ((!item.path && item.type === 'text/url') ? 'link' : 'file'),
        id: item.id || item.path || `file-${index}`,
        name: item.name || item.fileName || 'archivo',
        type: item.type || item.fileType || '',
        path: item.path || item.filePath || '',
        url: item.url || item.fileUrl || '',
        label: item.label || item.name || item.fileName || `Archivo ${index + 1}`,
        category: item.category || 'Archivo',
        note: item.note || '',
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : index
      }))
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index }));
  }

  function normalize(row) {
    if (!row) return null;
    const files = normalizeFiles(row);
    const first = files[0] || null;
    return {
      id: row.id,
      course: row.course,
      unit: row.unit_number,
      week: row.week_number,
      title: row.title || '',
      description: row.description || '',
      status: row.status || 'published',
      files,
      fileName: first?.name || row.file_name || '',
      fileType: first?.type || row.file_type || '',
      filePath: first?.path || row.file_path || '',
      fileUrl: first?.url || row.file_url || '',
      updatedAt: row.updated_at || ''
    };
  }

  function safeFileName(name = 'archivo') {
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'archivo';
  }

  async function get(course, unit, week) {
    const { data, error } = await client()
      .from('activities')
      .select('*')
      .eq('id', id(course, unit, week))
      .maybeSingle();
    if (error) throw error;
    return normalize(data);
  }

  async function listAll() {
    const { data, error } = await client()
      .from('activities')
      .select('*')
      .order('course')
      .order('unit_number')
      .order('week_number');
    if (error) throw error;
    return (data || []).map(normalize);
  }

  async function uploadFile(course, unit, week, file) {
    const unique = `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    const path = `${course}/unidad-${unit}/semana-${week}/${unique}-${safeFileName(file.name)}`;
    const { error } = await client()
      .storage
      .from(cfg().bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      });
    if (error) throw error;
    const { data } = client().storage.from(cfg().bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  async function removeStorage(paths) {
    const clean = [...new Set((Array.isArray(paths) ? paths : [paths]).filter(Boolean))];
    if (!clean.length) return;
    const { error } = await client().storage.from(cfg().bucket).remove(clean);
    if (error) console.warn('No se pudieron eliminar algunos archivos de Storage:', error.message);
  }

  async function save({ course, unit, week, title, description, status, files, currentActivity }) {
    const uploadedPaths = [];
    const finalFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        let stored = null;
        if (item.kind === 'link' || (!item.path && item.type === 'text/url' && !(item.file instanceof File))) {
          const target = String(item.url || '').trim();
          const parsed = new URL(target);
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Uno de los enlaces no es válido.');
          stored = {
            kind: 'link',
            id: item.id || `link-${Date.now()}-${i}`,
            name: item.name || parsed.hostname,
            type: 'text/url',
            path: '',
            url: parsed.href
          };
        } else if (item.file instanceof File) {
          const upload = await uploadFile(course, unit, week, item.file);
          uploadedPaths.push(upload.path);
          stored = {
            kind: 'file',
            id: upload.path,
            name: item.file.name,
            type: item.file.type || '',
            path: upload.path,
            url: upload.publicUrl
          };
        } else {
          stored = {
            kind: item.kind || 'file',
            id: item.id || item.path,
            name: item.name,
            type: item.type || '',
            path: item.path || '',
            url: item.url || ''
          };
        }

        finalFiles.push({
          ...stored,
          label: String(item.label || stored.name || `Archivo ${i + 1}`).trim(),
          category: String(item.category || 'Archivo').trim(),
          note: String(item.note || '').trim(),
          order: i
        });
      }

      const first = finalFiles[0] || null;
      const row = {
        id: id(course, unit, week),
        course,
        unit_number: unit,
        week_number: week,
        title: String(title || '').trim(),
        description: String(description || '').trim(),
        status: status === 'draft' ? 'draft' : 'published',
        files: finalFiles,
        file_name: first?.name || null,
        file_type: first?.type || null,
        file_path: first?.path || null,
        file_url: first?.url || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client()
        .from('activities')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      const oldPaths = (currentActivity?.files || []).map(f => f.path).filter(Boolean);
      const newPaths = finalFiles.map(f => f.path).filter(Boolean);
      const removedPaths = oldPaths.filter(path => !newPaths.includes(path));
      if (removedPaths.length) await removeStorage(removedPaths);

      return normalize(data);
    } catch (error) {
      if (uploadedPaths.length) await removeStorage(uploadedPaths);
      throw error;
    }
  }

  async function remove(course, unit, week) {
    const current = await get(course, unit, week);
    const { error } = await client()
      .from('activities')
      .delete()
      .eq('id', id(course, unit, week));
    if (error) throw error;
    const paths = (current?.files || []).map(f => f.path).filter(Boolean);
    if (paths.length) await removeStorage(paths);
  }

  async function signIn(username, password) {
    requireConfig();
    const expected = String(cfg().adminUsername || 'Frank').trim().toLowerCase();
    if (String(username || '').trim().toLowerCase() !== expected) {
      throw new Error('Usuario o contraseña incorrectos.');
    }
    const { data, error } = await client().auth.signInWithPassword({
      email: cfg().adminEmail,
      password
    });
    if (error) throw new Error('Usuario o contraseña incorrectos.');
    return data;
  }

  async function sendPasswordReset() {
    requireConfig();
    const redirectTo = new URL('reset.html', window.location.href).href;
    const { data, error } = await client().auth.resetPasswordForEmail(cfg().adminEmail, { redirectTo });
    if (error) {
      if (/rate limit/i.test(error.message || '')) {
        throw new Error('Se alcanzó el límite temporal de correos de Supabase. Espera un poco antes de intentarlo nuevamente.');
      }
      throw new Error(error.message || 'No se pudo enviar el correo de recuperación.');
    }
    return data;
  }

  async function updateRecoveredPassword(newPassword) {
    requireConfig();
    const next = String(newPassword || '');
    if (next.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    const { data, error } = await client().auth.updateUser({ password: next });
    if (error) throw new Error(error.message || 'No se pudo actualizar la contraseña.');
    return data;
  }

  async function changePassword(currentPassword, newPassword) {
    requireConfig();
    const current = String(currentPassword || '');
    const next = String(newPassword || '');
    if (!current) throw new Error('Escribe tu contraseña actual.');
    if (next.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    if (current === next) throw new Error('La nueva contraseña debe ser diferente a la actual.');

    const { error: verifyError } = await client().auth.signInWithPassword({
      email: cfg().adminEmail,
      password: current
    });
    if (verifyError) throw new Error('La contraseña actual no es correcta.');

    const { data, error } = await client().auth.updateUser({ password: next });
    if (error) throw new Error(error.message || 'No se pudo actualizar la contraseña.');
    return data;
  }

  async function signOut() {
    if (!isConfigured()) return;
    const { error } = await client().auth.signOut();
    if (error) throw error;
  }

  async function session() {
    if (!isConfigured()) return null;
    const { data, error } = await client().auth.getSession();
    if (error) return null;
    const session = data.session || null;
    if (!session) return null;
    if (String(session.user?.email || '').toLowerCase() !== String(cfg().adminEmail || '').toLowerCase()) return null;
    return session;
  }

  return {
    isConfigured,
    client,
    get,
    listAll,
    save,
    remove,
    signIn,
    sendPasswordReset,
    updateRecoveredPassword,
    changePassword,
    signOut,
    session
  };
})();

const PortfolioDB = {
  get: PortfolioCloud.get,
  listAll: PortfolioCloud.listAll,
  save: PortfolioCloud.save,
  remove: PortfolioCloud.remove
};
