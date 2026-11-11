// ==================== PÁGINA DE ACCESO ====================
// Valida el formulario, muestra errores claros y redirige según el rol.
import { iniciarSesion, rutaPorRol } from './auth.js';

const formulario = document.getElementById('login-form');
const mensaje = document.getElementById('login-message');
const boton = document.getElementById('login-submit');
const avisoSesion = sessionStorage.getItem('dbrestaurante_mensaje');

if (avisoSesion) {
  mensaje.textContent = avisoSesion;
  mensaje.classList.add('notice-error');
  sessionStorage.removeItem('dbrestaurante_mensaje');
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensaje.textContent = '';
  mensaje.className = 'notice';
  boton.disabled = true;
  boton.textContent = 'Validando acceso…';

  const datos = new FormData(formulario);
  try {
    const usuario = await iniciarSesion(datos.get('usuario'), datos.get('contrasena'));
    location.assign(rutaPorRol(usuario.rol_id));
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add('notice-error');
    boton.disabled = false;
    boton.textContent = 'Acceder al sistema';
  }
});
