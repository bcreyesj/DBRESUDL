// ==================== PANEL ADMINISTRATIVO ====================
// Coordina navegación, indicadores y formularios de administración por módulos.
import { apiFetch } from './api.js';
import { cerrarSesion, configurarUsuario, exigirRol } from './auth.js';

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
const estado = { usuario: null, platillos: [], categorias: [], empleados: [], ingredientes: [] };
const titulos = {
  overview: 'Panel de Control',
  menu: 'Gestión de Menú',
  staff: 'Personal',
  inventory: 'Inventario',
  recipes: 'Recetas',
  sales: 'Ventas y pagos',
  audit: 'Auditoría del sistema'
};

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[caracter]);
}

function moneda(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor) || 0);
}

function fecha(valor, incluirHora = false) {
  const soloFecha = !incluirHora && typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor);
  const partes = soloFecha ? valor.slice(0, 10).split('-').map(Number) : null;
  const fechaDato = soloFecha ? new Date(partes[0], partes[1] - 1, partes[2]) : new Date(valor);
  if (Number.isNaN(fechaDato.getTime())) return '—';
  return fechaDato.toLocaleString('es-MX', incluirHora
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' });
}

function mostrarAviso(texto, tipo = '') {
  const aviso = $('#admin-notice');
  aviso.textContent = texto;
  aviso.className = `notice${tipo ? ` notice-${tipo}` : ''}`;
}

function estadoOrden(estadoOrdenDato) {
  if (estadoOrdenDato === 'Pendiente') return 'status-pending';
  if (estadoOrdenDato === 'En preparacion') return 'status-preparing';
  if (estadoOrdenDato === 'Listo' || estadoOrdenDato === 'Entregado') return 'status-completed';
  return 'status-neutral';
}

function celdaVacia(columnas, mensaje) {
  return `<tr><td colspan="${columnas}" class="empty-state">${escapar(mensaje)}</td></tr>`;
}

async function cargarResumen() {
  try {
    const resumen = await apiFetch('/dashboard/overview');
    $('#kpi-sales').textContent = moneda(resumen.indicadores.ventas_hoy);
    $('#kpi-orders').textContent = resumen.indicadores.ordenes_activas;
    $('#kpi-stock').textContent = resumen.indicadores.alertas_stock;
    $('#overview-orders').innerHTML = resumen.actividad.length
      ? resumen.actividad.map((orden) => `
        <tr>
          <td class="table-primary">#${orden.id_orden}</td>
          <td>Mesa ${escapar(orden.numero_mesa)}</td>
          <td><span class="status ${estadoOrden(orden.estado)}">${escapar(orden.estado)}</span></td>
          <td>${moneda(orden.total)}</td>
        </tr>`).join('')
      : celdaVacia(4, 'No hay órdenes activas en este momento.');
    $('#overview-stock').innerHTML = resumen.alertas.length
      ? resumen.alertas.map((item) => `
        <div class="stock-row">
          <div><div class="stock-name">${escapar(item.nombre)}</div><div class="stock-amount">Mínimo: ${escapar(item.stock_minimo)} ${escapar(item.unidad_medida)}</div></div>
          <span class="status status-pending">${escapar(item.stock_actual)} ${escapar(item.unidad_medida)}</span>
        </div>`).join('')
      : '<div class="empty-state">No hay ingredientes por debajo del mínimo.</div>';
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function cargarMenu() {
  const [menu, categorias] = await Promise.all([apiFetch('/menu'), apiFetch('/menu/categories')]);
  estado.platillos = menu.platillos;
  estado.categorias = categorias.categorias;
  $('#menu-count').textContent = `${estado.platillos.length} platillos`;
  $('#menu-table').innerHTML = estado.platillos.length
    ? estado.platillos.map((platillo) => `
      <tr>
        <td><div class="table-primary">${escapar(platillo.nombre)}</div><div class="table-secondary">${escapar(platillo.descripcion || 'Sin descripción')}</div></td>
        <td>${escapar(platillo.categoria)}</td>
        <td>${moneda(platillo.precio)}</td>
        <td><span class="status ${platillo.disponible ? 'status-completed' : 'status-neutral'}">${platillo.disponible ? 'Disponible' : 'Pausado'}</span></td>
        <td><div class="table-actions">
          <button class="button button-small button-secondary" type="button" data-edit-dish="${platillo.id_platillo}">Editar</button>
          <button class="button button-small button-quiet" type="button" data-toggle-dish="${platillo.id_platillo}">${platillo.disponible ? 'Pausar' : 'Activar'}</button>
        </div></td>
      </tr>`).join('')
    : celdaVacia(5, 'Todavía no hay platillos registrados.');
  $('#categories-table').innerHTML = estado.categorias.length
    ? estado.categorias.map((categoria) => `
      <tr>
        <td class="table-primary">${escapar(categoria.nombre)}</td>
        <td><span class="status ${categoria.activa ? 'status-completed' : 'status-neutral'}">${categoria.activa ? 'Activa' : 'Inactiva'}</span></td>
        <td><div class="table-actions">
          <button class="button button-small button-secondary" type="button" data-edit-category="${categoria.id_categoria}">Renombrar</button>
          <button class="button button-small button-quiet" type="button" data-toggle-category="${categoria.id_categoria}">${categoria.activa ? 'Desactivar' : 'Activar'}</button>
        </div></td>
      </tr>`).join('')
    : celdaVacia(3, 'No hay categorías registradas.');
}

async function cargarPersonal() {
  const resultado = await apiFetch('/staff');
  estado.empleados = resultado.empleados;
  $('#staff-table').innerHTML = estado.empleados.length
    ? estado.empleados.map((empleado) => `
      <tr>
        <td class="table-primary">${escapar(empleado.nombre)}</td>
        <td>${escapar(empleado.usuario)}</td>
        <td>${Number(empleado.rol_id) === 1 ? 'Administrador' : 'Empleado'}</td>
        <td><span class="status ${empleado.estado ? 'status-completed' : 'status-neutral'}">${empleado.estado ? 'Activo' : 'Inactivo'}</span></td>
        <td><div class="table-actions"><button class="button button-small button-secondary" type="button" data-edit-staff="${empleado.id_empleado}">Editar</button></div></td>
      </tr>`).join('')
    : celdaVacia(5, 'No hay empleados registrados.');
}

async function cargarInventario() {
  const resultado = await apiFetch('/inventory/ingredients');
  estado.ingredientes = resultado.ingredientes;
  const alertas = estado.ingredientes.filter((ingrediente) => ingrediente.bajo_minimo).length;
  $('#inventory-alert-count').textContent = `${alertas} ${alertas === 1 ? 'alerta' : 'alertas'}`;
  $('#inventory-table').innerHTML = estado.ingredientes.length
    ? estado.ingredientes.map((ingrediente) => `
      <tr>
        <td class="table-primary">${escapar(ingrediente.nombre)}</td>
        <td>${escapar(ingrediente.stock_actual)}</td>
        <td>${escapar(ingrediente.stock_minimo)}</td>
        <td>${escapar(ingrediente.unidad_medida)}</td>
        <td><span class="status ${ingrediente.bajo_minimo ? 'status-pending' : 'status-completed'}">${ingrediente.bajo_minimo ? 'Bajo mínimo' : 'En rango'}</span></td>
        <td><div class="table-actions"><button class="button button-small button-secondary" type="button" data-edit-stock="${ingrediente.id_ingrediente}">Ajustar</button></div></td>
      </tr>`).join('')
    : celdaVacia(6, 'No hay ingredientes registrados.');
}

async function cargarRecetas() {
  if (!estado.platillos.length) await cargarMenu();
  $('#recipes-table').innerHTML = estado.platillos.length
    ? estado.platillos.map((platillo) => `
      <tr>
        <td class="table-primary">${escapar(platillo.nombre)}</td>
        <td>${escapar(platillo.categoria)}</td>
        <td>${moneda(platillo.precio)}</td>
        <td><span class="muted small">Receta administrable</span></td>
        <td><div class="table-actions"><button class="button button-small button-secondary" type="button" data-edit-recipe="${platillo.id_platillo}">Editar receta</button></div></td>
      </tr>`).join('')
    : celdaVacia(5, 'Agregue un platillo antes de asociar sus ingredientes.');
}

function barras(items, etiqueta, valor) {
  if (!items.length) return '<div class="empty-state">No hay pagos registrados en este periodo.</div>';
  const mayor = Math.max(...items.map((item) => Number(item[valor]) || 0), 1);
  return items.map((item) => `
    <div class="bar-item">
      <span class="bar-label">${escapar(etiqueta(item))}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.max(3, Number(item[valor]) / mayor * 100)}%"></span></span>
      <span class="bar-value">${moneda(item[valor])}</span>
    </div>`).join('');
}

async function cargarVentas() {
  const datos = await apiFetch(`/sales?dias=${encodeURIComponent($('#sales-period').value)}`);
  $('#sales-total').textContent = moneda(datos.resumen.ingresos);
  $('#sales-count').textContent = datos.resumen.cantidad_pagos;
  $('#sales-method-count').textContent = datos.metodos.length;
  $('#sales-daily').innerHTML = barras(datos.diario, (item) => fecha(item.fecha), 'ingresos');
  $('#sales-methods').innerHTML = barras(datos.metodos, (item) => item.metodo, 'monto');
}

async function cargarAuditoria() {
  const datos = await apiFetch('/audit');
  $('#audit-table').innerHTML = datos.eventos.length
    ? datos.eventos.map((evento) => `
      <tr>
        <td>${fecha(evento.fecha, true)}</td>
        <td class="table-primary">${escapar(evento.usuario)}</td>
        <td>${escapar(evento.accion)}</td>
      </tr>`).join('')
    : celdaVacia(3, 'Todavía no hay acciones registradas.');
}

const cargadores = {
  overview: cargarResumen,
  menu: cargarMenu,
  staff: cargarPersonal,
  inventory: cargarInventario,
  recipes: cargarRecetas,
  sales: cargarVentas,
  audit: cargarAuditoria
};

async function mostrarVista(nombreVista) {
  const vista = cargadores[nombreVista] ? nombreVista : 'overview';
  $$('.view').forEach((elemento) => elemento.classList.toggle('is-active', elemento.id === `view-${vista}`));
  $$('.nav-link').forEach((enlace) => {
    if (enlace.dataset.view === vista) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });
  $('#page-title').textContent = titulos[vista];
  history.replaceState(null, '', `#${vista}`);
  $('#sidebar').classList.remove('is-open');
  $('#mobile-menu').setAttribute('aria-expanded', 'false');
  mostrarAviso('');
  try {
    await cargadores[vista]();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function abrirDrawer(titulo, contenido) {
  estado.elementoAnterior = document.activeElement;
  $('#drawer-title').textContent = titulo;
  $('#drawer-content').innerHTML = contenido;
  $('#drawer-backdrop').classList.add('is-open');
  $('#drawer-backdrop').setAttribute('aria-hidden', 'false');
  ($('#drawer-content input, #drawer-content select, #drawer-content button') || $('#drawer-close')).focus();
}

function cerrarDrawer() {
  $('#drawer-backdrop').classList.remove('is-open');
  $('#drawer-backdrop').setAttribute('aria-hidden', 'true');
  estado.elementoAnterior?.focus?.();
}

function formularioPlatillo(platillo = null) {
  const opciones = estado.categorias.filter((categoria) => categoria.activa || Number(platillo?.id_categoria) === Number(categoria.id_categoria)).map((categoria) => `
    <option value="${categoria.id_categoria}" ${Number(platillo?.id_categoria) === Number(categoria.id_categoria) ? 'selected' : ''}>${escapar(categoria.nombre)}</option>`).join('');
  abrirDrawer(platillo ? 'Editar platillo' : 'Nuevo platillo', `
    <form id="drawer-form" class="drawer-form">
      <label class="field">Nombre<input name="nombre" required maxlength="120" value="${escapar(platillo?.nombre || '')}" placeholder="Nombre del platillo"></label>
      <label class="field">Descripción<textarea name="descripcion" maxlength="400" placeholder="Ingredientes o descripción breve">${escapar(platillo?.descripcion || '')}</textarea></label>
      <label class="field">Categoría<select name="id_categoria" required>${opciones}</select></label>
      <label class="field">Precio<input name="precio" type="number" min="0" step="0.01" required value="${escapar(platillo?.precio ?? '')}" placeholder="0.00"></label>
      <div class="drawer-actions"><button class="button button-secondary" type="button" data-close-drawer>Cancelar</button><button class="button" type="submit">Guardar platillo</button></div>
    </form>`);
  $('#drawer-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const body = Object.fromEntries(new FormData(evento.currentTarget));
    try {
      await apiFetch(platillo ? `/menu/${platillo.id_platillo}` : '/menu', {
        method: platillo ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      cerrarDrawer();
      mostrarAviso('Platillo guardado correctamente.', 'success');
      await cargarMenu();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });
}

function formularioCategoria(categoria = null) {
  abrirDrawer(categoria ? 'Renombrar categoría' : 'Nueva categoría', `
    <form id="drawer-form" class="drawer-form">
      <label class="field">Nombre de la categoría<input name="nombre" required maxlength="80" value="${escapar(categoria?.nombre || '')}" placeholder="Ej. Especialidades"></label>
      <div class="drawer-actions"><button class="button button-secondary" type="button" data-close-drawer>Cancelar</button><button class="button" type="submit">Guardar categoría</button></div>
    </form>`);
  $('#drawer-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const body = Object.fromEntries(new FormData(evento.currentTarget));
    try {
      await apiFetch(categoria ? `/menu/categories/${categoria.id_categoria}` : '/menu/categories', {
        method: categoria ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      cerrarDrawer();
      mostrarAviso('Categoría guardada correctamente.', 'success');
      await cargarMenu();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });
}

function formularioPersonal(empleado = null) {
  abrirDrawer(empleado ? 'Editar empleado' : 'Registrar empleado', `
    <form id="drawer-form" class="drawer-form">
      <label class="field">Nombre completo<input name="nombre" required maxlength="120" value="${escapar(empleado?.nombre || '')}" placeholder="Nombre y apellidos"></label>
      <label class="field">Usuario<input name="usuario" required maxlength="60" value="${escapar(empleado?.usuario || '')}" placeholder="Nombre de usuario"></label>
      <label class="field">Rol<select name="rol_id"><option value="2" ${Number(empleado?.rol_id || 2) === 2 ? 'selected' : ''}>Empleado</option><option value="1" ${Number(empleado?.rol_id) === 1 ? 'selected' : ''}>Administrador</option></select></label>
      <label class="field">Contraseña<input name="contrasena" type="password" ${empleado ? '' : 'required'} minlength="10" autocomplete="new-password" placeholder="${empleado ? 'Dejar vacía para conservarla' : 'Mínimo 10 caracteres'}"></label>
      ${empleado ? `<label class="field">Estado<select name="estado"><option value="1" ${empleado.estado ? 'selected' : ''}>Activo</option><option value="0" ${!empleado.estado ? 'selected' : ''}>Inactivo</option></select></label>` : ''}
      ${!empleado ? '<input type="hidden" name="estado" value="1">' : ''}
      <div class="drawer-actions"><button class="button button-secondary" type="button" data-close-drawer>Cancelar</button><button class="button" type="submit">Guardar empleado</button></div>
    </form>`);
  $('#drawer-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const body = Object.fromEntries(new FormData(evento.currentTarget));
    body.estado = body.estado === '1';
    try {
      await apiFetch(empleado ? `/staff/${empleado.id_empleado}` : '/staff', {
        method: empleado ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      cerrarDrawer();
      mostrarAviso('Datos del empleado guardados correctamente.', 'success');
      await cargarPersonal();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });
}

function formularioInventario(ingrediente) {
  abrirDrawer(`Ajustar ${ingrediente.nombre}`, `
    <form id="drawer-form" class="drawer-form">
      <label class="field">Existencia actual (${escapar(ingrediente.unidad_medida)})<input name="stock_actual" type="number" min="0" step="0.001" required value="${escapar(ingrediente.stock_actual)}"></label>
      <label class="field">Nivel mínimo (${escapar(ingrediente.unidad_medida)})<input name="stock_minimo" type="number" min="0" step="0.001" required value="${escapar(ingrediente.stock_minimo)}"></label>
      <p class="field-hint">Use la misma unidad de medida del ingrediente.</p>
      <div class="drawer-actions"><button class="button button-secondary" type="button" data-close-drawer>Cancelar</button><button class="button" type="submit">Guardar existencias</button></div>
    </form>`);
  $('#drawer-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const body = Object.fromEntries(new FormData(evento.currentTarget));
    try {
      await apiFetch(`/inventory/ingredients/${ingrediente.id_ingrediente}`, { method: 'PATCH', body: JSON.stringify(body) });
      cerrarDrawer();
      mostrarAviso('Existencias actualizadas.', 'success');
      await cargarInventario();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });
}

async function formularioReceta(platillo) {
  const [datosReceta, datosInventario] = await Promise.all([
    apiFetch(`/inventory/recipes/${platillo.id_platillo}`),
    apiFetch('/inventory/ingredients')
  ]);
  estado.ingredientes = datosInventario.ingredientes;
  const filas = datosReceta.receta.length ? datosReceta.receta : [{ id_ingrediente: '', cantidad_requerida: '' }];
  const opciones = (seleccionado) => `<option value="">Seleccione un ingrediente</option>${estado.ingredientes.map((ingrediente) => `
    <option value="${ingrediente.id_ingrediente}" ${Number(seleccionado) === Number(ingrediente.id_ingrediente) ? 'selected' : ''}>${escapar(ingrediente.nombre)} (${escapar(ingrediente.unidad_medida)})</option>`).join('')}`;
  const filaHtml = (fila) => `
    <div class="recipe-row">
      <label class="field">Ingrediente<select class="recipe-ingredient" required>${opciones(fila.id_ingrediente)}</select></label>
      <label class="field">Cantidad<input class="recipe-quantity" type="number" min="0.001" step="0.001" required value="${escapar(fila.cantidad_requerida)}"></label>
      <button class="icon-button recipe-remove" type="button" aria-label="Quitar ingrediente">×</button>
    </div>`;
  abrirDrawer(`Receta: ${platillo.nombre}`, `
    <form id="drawer-form" class="drawer-form">
      <div id="recipe-rows">${filas.map(filaHtml).join('')}</div>
      <button id="recipe-add-row" class="button button-secondary" type="button">+ Agregar ingrediente</button>
      <div class="drawer-actions"><button class="button button-secondary" type="button" data-close-drawer>Cancelar</button><button class="button" type="submit">Guardar receta</button></div>
    </form>`);
  $('#recipe-add-row').addEventListener('click', () => {
    $('#recipe-rows .recipe-empty')?.remove();
    $('#recipe-rows').insertAdjacentHTML('beforeend', filaHtml({}));
  });
  $('#recipe-rows').addEventListener('click', (evento) => {
    if (evento.target.closest('.recipe-remove')) {
      evento.target.closest('.recipe-row').remove();
      if (!$$('.recipe-row', $('#recipe-rows')).length) {
        $('#recipe-rows').innerHTML = '<p class="recipe-empty">No hay ingredientes en la receta. Puede guardar esta lista vacía o agregar uno nuevo.</p>';
      }
    }
  });
  $('#drawer-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const ingredientes = $$('.recipe-row', $('#recipe-rows')).map((fila) => ({
      id_ingrediente: $('.recipe-ingredient', fila).value,
      cantidad_requerida: $('.recipe-quantity', fila).value
    }));
    try {
      await apiFetch(`/inventory/recipes/${platillo.id_platillo}`, { method: 'PUT', body: JSON.stringify({ ingredientes }) });
      cerrarDrawer();
      mostrarAviso('Receta guardada correctamente.', 'success');
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });
}

function iniciarNavegacion() {
  $$('.nav-link').forEach((enlace) => enlace.addEventListener('click', (evento) => {
    evento.preventDefault();
    mostrarVista(enlace.dataset.view);
  }));
  $('#mobile-menu').addEventListener('click', () => {
    const abierto = $('#sidebar').classList.toggle('is-open');
    $('#mobile-menu').setAttribute('aria-expanded', String(abierto));
  });
  $('#logout-button').addEventListener('click', cerrarSesion);
  $('[data-refresh]').addEventListener('click', () => mostrarVista('overview'));
  $('#sales-period').addEventListener('change', () => cargarVentas().catch((error) => mostrarAviso(error.message, 'error')));
  $('#add-dish').addEventListener('click', async () => {
    try { if (!estado.categorias.length) await cargarMenu(); formularioPlatillo(); }
    catch (error) { mostrarAviso(error.message, 'error'); }
  });
  $('#add-category').addEventListener('click', () => formularioCategoria());
  $('#add-staff').addEventListener('click', () => formularioPersonal());
  $('#drawer-close').addEventListener('click', cerrarDrawer);
  $('#drawer-backdrop').addEventListener('click', (evento) => {
    if (evento.target === $('#drawer-backdrop') || evento.target.closest('[data-close-drawer]')) cerrarDrawer();
  });
  document.addEventListener('keydown', (evento) => {
    if (!$('#drawer-backdrop').classList.contains('is-open')) return;
    if (evento.key === 'Escape') cerrarDrawer();
    if (evento.key === 'Tab') {
      const elementos = $$('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)', $('#drawer'));
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  });
  document.body.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button');
    if (!boton) return;
    try {
      if (boton.dataset.editDish) formularioPlatillo(estado.platillos.find((item) => item.id_platillo === Number(boton.dataset.editDish)));
      if (boton.dataset.editCategory) formularioCategoria(estado.categorias.find((item) => item.id_categoria === Number(boton.dataset.editCategory)));
      if (boton.dataset.editStaff) formularioPersonal(estado.empleados.find((item) => item.id_empleado === Number(boton.dataset.editStaff)));
      if (boton.dataset.editStock) formularioInventario(estado.ingredientes.find((item) => item.id_ingrediente === Number(boton.dataset.editStock)));
      if (boton.dataset.editRecipe) {
        const platillo = estado.platillos.find((item) => item.id_platillo === Number(boton.dataset.editRecipe));
        if (platillo) await formularioReceta(platillo);
      }
      if (boton.dataset.toggleDish) {
        await apiFetch(`/menu/${boton.dataset.toggleDish}/availability`, { method: 'PATCH' });
        mostrarAviso('Disponibilidad del platillo actualizada.', 'success');
        await cargarMenu();
      }
      if (boton.dataset.toggleCategory) {
        await apiFetch(`/menu/categories/${boton.dataset.toggleCategory}/status`, { method: 'PATCH' });
        mostrarAviso('Estado de la categoría actualizado.', 'success');
        await cargarMenu();
      }
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });
}

async function iniciar() {
  try {
    estado.usuario = await exigirRol(1);
    if (!estado.usuario) return;
    configurarUsuario(estado.usuario, 'user-name', 'user-role');
    $('#user-avatar').textContent = estado.usuario.nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
    $('#today-date').textContent = new Date().toLocaleDateString('es-MX', { dateStyle: 'full' });
    iniciarNavegacion();
    const vistaInicial = location.hash.slice(1) || 'overview';
    await mostrarVista(vistaInicial);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

iniciar();
