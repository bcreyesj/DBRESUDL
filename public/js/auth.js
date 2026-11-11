// ==================== MÓDULO DE AUTENTICACIÓN DEL NAVEGADOR ====================
// Mantiene la identidad local, valida el rol y dirige al panel correspondiente.
import { apiFetch, guardarToken, obtenerToken } from './api.js';

export async function iniciarSesion(usuario, contrasena) {
  localStorage.removeItem('dbrestaurante_token');
  localStorage.removeItem('dbrestaurante_usuario');
  const resultado = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, contrasena })
  });
  guardarToken(resultado.token);
  localStorage.setItem('dbrestaurante_usuario', JSON.stringify(resultado.usuario));
  return resultado.usuario;
}

export function rutaPorRol(rolId) {
  return Number(rolId) === 1 ? '/admin/dashboard' : '/employee/dashboard';
}

export async function exigirRol(rolEsperado) {
  if (!obtenerToken()) {
    location.replace('/');
    return null;
  }
  const { usuario } = await apiFetch('/auth/me');
  if (Number(usuario.rol_id) !== Number(rolEsperado)) {
    location.replace(rutaPorRol(usuario.rol_id));
    return null;
  }
  localStorage.setItem('dbrestaurante_usuario', JSON.stringify(usuario));
  return usuario;
}

export function cerrarSesion() {
  localStorage.removeItem('dbrestaurante_token');
  localStorage.removeItem('dbrestaurante_usuario');
  location.assign('/');
}

export function configurarUsuario(usuario, nombreElemento, rolElemento) {
  const nombre = document.getElementById(nombreElemento);
  const rol = document.getElementById(rolElemento);
  if (nombre) nombre.textContent = usuario.nombre;
  if (rol) rol.textContent = Number(usuario.rol_id) === 1 ? 'Administrador' : 'Personal de servicio';
}
