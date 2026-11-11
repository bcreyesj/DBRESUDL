// ==================== MÓDULO API: SOLICITUDES HTTP ====================
// Centraliza el token JWT, la serialización JSON y los errores de conexión.
const TOKEN_KEY = 'dbrestaurante_token';

export async function apiFetch(ruta, opciones = {}) {
  const encabezados = new Headers(opciones.headers || {});
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) encabezados.set('Authorization', `Bearer ${token}`);
  if (opciones.body && !(opciones.body instanceof FormData)) {
    encabezados.set('Content-Type', 'application/json');
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, { ...opciones, headers: encabezados });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revise la conexión e intente nuevamente.');
  }

  const tipo = respuesta.headers.get('content-type') || '';
  const datos = tipo.includes('application/json')
    ? await respuesta.json().catch(() => null)
    : null;

  if (respuesta.status === 401) {
    if (!ruta.startsWith('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('dbrestaurante_usuario');
      sessionStorage.setItem('dbrestaurante_mensaje', 'Su sesión venció. Inicie sesión nuevamente.');
      if (location.pathname !== '/') location.assign('/');
    }
    throw new Error(datos?.mensaje || 'La sesión venció. Inicie sesión nuevamente.');
  }

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje || 'La solicitud no pudo completarse.');
  }
  if (!datos && respuesta.status !== 204) {
    throw new Error('El servidor devolvió una respuesta que no se pudo leer.');
  }
  return datos;
}

export function guardarToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}
