/*
  CONFIGURACIÓN DEL PORTAFOLIO EN SUPABASE
  1) Crea tu proyecto en Supabase.
  2) Copia Project URL y Publishable key desde el panel Connect / Settings > API Keys.
  3) Coloca aquí el correo de la cuenta administradora que crearás en Authentication > Users.

  IMPORTANTE:
  - La Publishable key SÍ puede estar en el navegador cuando RLS está bien configurado.
  - NUNCA pongas aquí una Secret key / service_role key.
  - La contraseña NO se guarda en este archivo ni en GitHub.
*/

window.PORTFOLIO_SUPABASE = {
  url: 'https://ztxxepqlbkuuwpjeutny.supabase.co',
  publishableKey: 'sb_publishable_mWYl9BsF0m2QliWVpKwaKQ_mqOQH0my',
  adminEmail: 'frank1delacruz1sierra@gmail.com',
  adminUsername: 'Frank',
  bucket: 'actividades'
};
