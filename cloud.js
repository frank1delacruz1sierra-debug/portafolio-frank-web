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

  function normalize(row) {
    if (!row) return null;
    return {
      id: row.id,
      course: row.course,
      unit: row.unit_number,
      week: row.week_number,
      description: row.description || '',
      fileName: row.file_name || '',
      fileType: row.file_type || '',
      filePath: row.file_path || '',
      fileUrl: row.file_url || '',
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

  async function removeStorage(path) {
    if (!path) return;
    const { error } = await client().storage.from(cfg().bucket).remove([path]);
    if (error) console.warn('No se pudo eliminar el archivo anterior de Storage:', error.message);
  }

  async function save({ course, unit, week, description, file, currentActivity }) {
    let newUpload = null;
    let fileName = currentActivity?.fileName || '';
    let fileType = currentActivity?.fileType || '';
    let filePath = currentActivity?.filePath || '';
    let fileUrl = currentActivity?.fileUrl || '';

    if (file) {
      newUpload = await uploadFile(course, unit, week, file);
      fileName = file.name;
      fileType = file.type || '';
      filePath = newUpload.path;
      fileUrl = newUpload.publicUrl;
    }

    const row = {
      id: id(course, unit, week),
      course,
      unit_number: unit,
      week_number: week,
      description,
      file_name: fileName || null,
      file_type: fileType || null,
      file_path: filePath || null,
      file_url: fileUrl || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client()
      .from('activities')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (newUpload?.path) await removeStorage(newUpload.path);
      throw error;
    }

    if (newUpload && currentActivity?.filePath && currentActivity.filePath !== newUpload.path) {
      await removeStorage(currentActivity.filePath);
    }

    return normalize(data);
  }

  async function remove(course, unit, week) {
    const current = await get(course, unit, week);
    const { error } = await client()
      .from('activities')
      .delete()
      .eq('id', id(course, unit, week));
    if (error) throw error;
    if (current?.filePath) await removeStorage(current.filePath);
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
