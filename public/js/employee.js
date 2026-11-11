// ==================== PUNTO DE VENTA Y SERVICIO ====================
// Sincroniza el mapa, el menú, el carrito y el avance de las comandas.
import { apiFetch } from './api.js';
import { cerrarSesion, configurarUsuario, exigirRol } from './auth.js';
import { aplicarBuscadores, configurarBuscadores } from './search.js';

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
const estado = {
  usuario: null,
  mesas: [],
  categorias: [],
  platillos: [],
  ordenes: [],
  metodosPago: [],
  categoriaActiva: 'Todas',
  mesaSeleccionada: null,
  ordenSeleccionada: null,
  borrador: new Map()
};
const vistas = { tables: 'Mapa de Mesas', pos: 'Comanda Actual', kitchen: 'Estado de Órdenes' };
const columnasOrden = [
  { estado: 'Pendiente', titulo: 'Pendientes', siguiente: 'En preparacion', boton: 'Iniciar preparación' },
  { estado: 'En preparacion', titulo: 'En preparación', siguiente: 'Listo', boton: 'Marcar como listo' },
  { estado: 'Listo', titulo: 'Listas para entregar', siguiente: 'Entregado', boton: 'Entregar comanda' },
  { estado: 'Entregado', titulo: 'Entregadas · por cobrar' }
];

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[caracter]);
}

function moneda(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor) || 0);
}

function mostrarAviso(texto, tipo = '') {
  const aviso = $('#employee-notice');
  aviso.textContent = texto;
  aviso.className = `notice${tipo ? ` notice-${tipo}` : ''}`;
}

function claseEstado(estadoMesa) {
  if (estadoMesa === 'Disponible') return 'status-completed';
  if (estadoMesa === 'Ocupada') return 'status-preparing';
  if (estadoMesa === 'Reservada') return 'status-pending';
  return 'status-alert';
}

function contarArticulos(articulos) {
  return articulos.reduce((total, articulo) => total + Number(articulo.cantidad || 0), 0);
}

async function cargarDatos() {
  const [mesas, menu, categorias, ordenes, metodos] = await Promise.all([
    apiFetch('/tables'),
    apiFetch('/menu'),
    apiFetch('/menu/categories'),
    apiFetch('/orders'),
    apiFetch('/sales/methods')
  ]);
  estado.mesas = mesas.mesas;
  estado.categorias = categorias.categorias.filter((categoria) => Boolean(categoria.activa));
  const categoriasActivas = new Set(estado.categorias.map((categoria) => Number(categoria.id_categoria)));
  estado.platillos = menu.platillos.filter((platillo) =>
    Boolean(platillo.disponible) && categoriasActivas.has(Number(platillo.id_categoria)));
  estado.ordenes = ordenes.ordenes;
  estado.metodosPago = metodos.metodos;
  renderMesas();
  renderMenu();
  renderCocina();
  aplicarBuscadores();
  if (estado.mesaSeleccionada) {
    const mesaActualizada = estado.mesas.find((mesa) => mesa.id_mesa === estado.mesaSeleccionada.id_mesa);
    if (mesaActualizada) {
      estado.mesaSeleccionada = mesaActualizada;
      estado.ordenSeleccionada = estado.ordenes.find((orden) => orden.id_mesa === mesaActualizada.id_mesa) || null;
      renderCarrito();
    }
  }
}

function renderMesas() {
  const contenedor = $('#floor-grid');
  if (!estado.mesas.length) {
    contenedor.innerHTML = '<div class="empty-state">No hay mesas registradas en el sistema.</div>';
    return;
  }
  contenedor.innerHTML = estado.mesas.map((mesa) => {
    const clase = claseEstado(mesa.estado);
    const seleccionada = estado.mesaSeleccionada?.id_mesa === mesa.id_mesa;
    const accion = mesa.estado === 'Limpieza' ? 'Marcar como disponible' :
      (mesa.id_orden ? `Comanda #${mesa.id_orden}` : 'Abrir comanda');
    return `
      <button class="table-card${seleccionada ? ' is-selected' : ''}" type="button" data-search-item
        data-table-id="${mesa.id_mesa}" data-status="${escapar(mesa.estado)}"
        aria-label="Mesa ${escapar(mesa.numero_mesa)}, ${escapar(mesa.estado)}, capacidad ${escapar(mesa.capacidad)}">
        <span class="table-card-top"><span class="table-number">${escapar(mesa.numero_mesa)}</span><span class="status ${clase}">${escapar(mesa.estado)}</span></span>
        <span class="table-capacity">Mesa para ${escapar(mesa.capacidad)} personas</span>
        <span class="table-card-bottom"><span>${mesa.total_orden ? moneda(mesa.total_orden) : 'Sin cuenta abierta'}</span><span>${escapar(accion)} →</span></span>
      </button>`;
  }).join('');
  aplicarBuscadores();
}

function renderMenu() {
  const opciones = ['Todas', ...estado.categorias.map((categoria) => categoria.nombre)];
  $('#category-tabs').innerHTML = opciones.map((categoria) => `
    <button class="category-tab" type="button" data-category="${escapar(categoria)}"
      aria-pressed="${estado.categoriaActiva === categoria}">${escapar(categoria)}</button>`).join('');
  const platillos = estado.platillos.filter((platillo) =>
    estado.categoriaActiva === 'Todas' || platillo.categoria === estado.categoriaActiva);
  $('#dish-grid').innerHTML = platillos.length
    ? platillos.map((platillo) => `
      <article class="dish-card" data-search-item>
        <div><h3>${escapar(platillo.nombre)}</h3><p>${escapar(platillo.descripcion || 'Preparado al momento.')}</p></div>
        <div class="dish-card-bottom"><span class="dish-price">${moneda(platillo.precio)}</span><button class="button button-small" type="button" data-add-dish="${platillo.id_platillo}" ${!estado.mesaSeleccionada || estado.mesaSeleccionada.estado === 'Limpieza' || (estado.ordenSeleccionada && !['Pendiente', 'En preparacion'].includes(estado.ordenSeleccionada.estado)) ? 'disabled' : ''}>Agregar +</button></div>
      </article>`).join('')
    : '<div class="empty-state">No hay platillos disponibles en esta categoría.</div>';
  aplicarBuscadores();
}

function renderCarrito() {
  const mesa = estado.mesaSeleccionada;
  const order = estado.ordenSeleccionada;
  $('#selected-table-label').textContent = mesa
    ? `Mesa ${mesa.numero_mesa}${order ? ` · Comanda #${order.id_orden} · ${order.estado}` : ' · Nueva comanda'}`
    : 'Seleccione una mesa para comenzar.';
  $('#cart-table-label').textContent = mesa ? `Mesa ${mesa.numero_mesa}` : '';

  const existentes = order?.articulos || [];
  const subtotalExistente = existentes.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const borrador = [...estado.borrador.values()];
  const subtotalNuevo = borrador.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
  const articulosEnCuenta = contarArticulos(existentes) + contarArticulos(borrador);

  $('#existing-order').innerHTML = existentes.length
    ? `<div class="eyebrow existing-order-label">Ya enviado a cocina</div>${existentes.map((item) => `
      <div class="cart-line">
        <div><div class="cart-line-name">${escapar(item.nombre)}</div><div class="cart-line-meta">${item.cantidad} × ${moneda(item.precio_unitario)}</div></div>
        <strong class="small">${moneda(item.subtotal)}</strong>
      </div>`).join('')}`
    : '';
  $('#cart-items').innerHTML = borrador.map((item) => `
    <div class="cart-line">
      <div><div class="cart-line-name">${escapar(item.nombre)}</div><div class="cart-line-meta">${moneda(item.precio)} por unidad</div></div>
      <div class="quantity-control">
        <button type="button" data-quantity-change="${item.id_platillo}" data-delta="-1" aria-label="Quitar una unidad de ${escapar(item.nombre)}">−</button>
        <span>${item.cantidad}</span>
        <button type="button" data-quantity-change="${item.id_platillo}" data-delta="1" aria-label="Agregar una unidad de ${escapar(item.nombre)}">+</button>
      </div>
    </div>`).join('');
  $('#cart-empty').hidden = Boolean(existentes.length || borrador.length);
  $('#existing-total').textContent = moneda(subtotalExistente);
  $('#draft-total').textContent = moneda(subtotalNuevo);
  $('#cart-total').textContent = moneda(subtotalExistente + subtotalNuevo);
  $('#cart-count').textContent = `${articulosEnCuenta} ${articulosEnCuenta === 1 ? 'artículo' : 'artículos'}`;
  const puedeEnviar = Boolean(mesa && borrador.length &&
    (!order || ['Pendiente', 'En preparacion'].includes(order.estado)));
  $('#send-order').disabled = !puedeEnviar;
  $('#send-order').textContent = order ? 'Agregar y enviar a cocina' : 'Enviar a cocina';
}

function tarjetaOrden(orden, columna) {
  const lineas = orden.articulos.map((articulo) => `<li>${articulo.cantidad} × ${escapar(articulo.nombre)}</li>`).join('');
  const accion = columna.siguiente
    ? `<button class="button button-small" type="button" data-advance="${orden.id_orden}" data-next="${escapar(columna.siguiente)}">${escapar(columna.boton)}</button>`
    : `<div class="payment-actions">
        <label class="sr-only" for="method-${orden.id_orden}">Método de pago de la comanda ${orden.id_orden}</label>
        <select id="method-${orden.id_orden}" class="inline-control" data-payment-method="${orden.id_orden}">
          <option value="">Método de pago</option>
          ${estado.metodosPago.map((metodo) => `<option value="${metodo.id_metodo_pago}">${escapar(metodo.nombre)}</option>`).join('')}
        </select>
        <button class="button button-small" type="button" data-pay="${orden.id_orden}">Cobrar</button>
      </div>`;
  return `
    <article class="order-card" data-search-item>
      <div class="order-card-head"><div><h4>Mesa ${escapar(orden.numero_mesa)}</h4><span class="muted small">Comanda #${orden.id_orden}</span></div><span class="status ${columna.estado === 'Pendiente' ? 'status-pending' : columna.estado === 'Entregado' ? 'status-completed' : 'status-preparing'}">${escapar(orden.estado)}</span></div>
      <ul class="order-lines">${lineas || '<li>Sin platillos registrados</li>'}</ul>
      <div class="order-card-foot"><strong>${moneda(orden.total)}</strong>${accion}</div>
    </article>`;
}

function renderCocina() {
  $('#active-order-count').textContent = `${estado.ordenes.length} ${estado.ordenes.length === 1 ? 'orden activa' : 'órdenes activas'}`;
  $('#kitchen-grid').innerHTML = columnasOrden.map((columna) => {
    const ordenes = estado.ordenes.filter((orden) => orden.estado === columna.estado);
    return `
      <section class="kitchen-column" aria-label="${escapar(columna.titulo)}">
        <div class="kitchen-column-header"><h3>${escapar(columna.titulo)}</h3><span class="kitchen-count" data-search-group-count>${ordenes.length}</span></div>
        <div class="kitchen-cards" data-search-group>${ordenes.length
          ? ordenes.map((orden) => tarjetaOrden(orden, columna)).join('')
          : '<div class="empty-state">Sin comandas</div>'}
          <div class="empty-state" data-search-group-empty hidden>Sin comandas que coincidan con la búsqueda.</div>
        </div>
      </section>`;
  }).join('');
  aplicarBuscadores();
}

async function seleccionarMesa(id) {
  const mesa = estado.mesas.find((item) => item.id_mesa === id);
  if (!mesa) return;
  if (mesa.estado === 'Limpieza') {
    try {
      await apiFetch(`/tables/${mesa.id_mesa}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'Disponible' })
      });
      mostrarAviso(`Mesa ${mesa.numero_mesa} marcada como disponible.`, 'success');
      await cargarDatos();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
    return;
  }

  estado.mesaSeleccionada = mesa;
  estado.ordenSeleccionada = estado.ordenes.find((orden) => orden.id_mesa === id) || null;
  estado.borrador.clear();
  renderMesas();
  renderCarrito();
  mostrarVista('pos');
}

async function enviarComanda() {
  const mesa = estado.mesaSeleccionada;
  if (!mesa || !estado.borrador.size) return;
  const articulos = [...estado.borrador.values()].map(({ id_platillo, cantidad }) => ({ id_platillo, cantidad }));
  $('#send-order').disabled = true;
  try {
    await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ id_mesa: mesa.id_mesa, articulos }) });
    estado.borrador.clear();
    mostrarAviso('Comanda enviada a cocina correctamente.', 'success');
    await cargarDatos();
    mostrarVista('pos');
  } catch (error) {
    mostrarAviso(error.message, 'error');
    renderCarrito();
  }
}

async function avanzarOrden(id, siguiente) {
  try {
    await apiFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: siguiente })
    });
    const etiquetaEstado = columnasOrden.find((columna) => columna.estado === siguiente)?.titulo || siguiente;
    mostrarAviso(`Comanda #${id} actualizada: ${etiquetaEstado}.`, 'success');
    await cargarDatos();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function cobrarOrden(id, boton) {
  const metodo = $(`[data-payment-method="${id}"]`).value;
  if (!metodo) {
    mostrarAviso('Seleccione un método de pago antes de cobrar.', 'error');
    return;
  }
  boton.disabled = true;
  try {
    await apiFetch(`/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ id_metodo_pago: Number(metodo) })
    });
    mostrarAviso(`Comanda #${id} cobrada y registrada.`, 'success');
    await cargarDatos();
  } catch (error) {
    mostrarAviso(error.message, 'error');
    boton.disabled = false;
  }
}

function mostrarVista(nombre) {
  const vista = vistas[nombre] ? nombre : 'tables';
  $$('.view').forEach((elemento) => elemento.classList.toggle('is-active', elemento.id === `view-${vista}`));
  $$('.nav-link').forEach((enlace) => {
    if (enlace.dataset.view === vista) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });
  $('#page-title').textContent = vistas[vista];
  history.replaceState(null, '', `#${vista}`);
  $('#sidebar').classList.remove('is-open');
  $('#mobile-menu').setAttribute('aria-expanded', 'false');
  if (vista === 'pos') renderCarrito();
  if (vista === 'kitchen') renderCocina();
}

function iniciarEventos() {
  configurarBuscadores();
  $$('.nav-link').forEach((enlace) => enlace.addEventListener('click', (evento) => {
    evento.preventDefault();
    mostrarVista(enlace.dataset.view);
  }));
  $('#mobile-menu').addEventListener('click', () => {
    const abierto = $('#sidebar').classList.toggle('is-open');
    $('#mobile-menu').setAttribute('aria-expanded', String(abierto));
  });
  $('#logout-button').addEventListener('click', cerrarSesion);
  $('#employee-refresh').addEventListener('click', () => cargarDatos().catch((error) => mostrarAviso(error.message, 'error')));
  $('#back-to-tables').addEventListener('click', () => mostrarVista('tables'));
  $('#floor-grid').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-table-id]');
    if (boton) seleccionarMesa(Number(boton.dataset.tableId));
  });
  $('#category-tabs').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-category]');
    if (!boton) return;
    estado.categoriaActiva = boton.dataset.category;
    renderMenu();
  });
  $('#dish-grid').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-add-dish]');
    if (!boton || boton.disabled) return;
    const platillo = estado.platillos.find((item) => item.id_platillo === Number(boton.dataset.addDish));
    if (!platillo) return;
    const actual = estado.borrador.get(platillo.id_platillo);
    estado.borrador.set(platillo.id_platillo, {
      id_platillo: platillo.id_platillo,
      nombre: platillo.nombre,
      precio: Number(platillo.precio),
      cantidad: (actual?.cantidad || 0) + 1
    });
    renderCarrito();
  });
  $('#cart-items').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-quantity-change]');
    if (!boton) return;
    const id = Number(boton.dataset.quantityChange);
    const articulo = estado.borrador.get(id);
    if (!articulo) return;
    articulo.cantidad += Number(boton.dataset.delta);
    if (articulo.cantidad <= 0) estado.borrador.delete(id);
    else estado.borrador.set(id, articulo);
    renderCarrito();
  });
  $('#send-order').addEventListener('click', enviarComanda);
  $('#clear-cart').addEventListener('click', () => {
    estado.borrador.clear();
    renderCarrito();
  });
  $('#kitchen-grid').addEventListener('click', async (evento) => {
    const siguiente = evento.target.closest('[data-advance]');
    const cobrar = evento.target.closest('[data-pay]');
    if (siguiente) await avanzarOrden(Number(siguiente.dataset.advance), siguiente.dataset.next);
    if (cobrar) await cobrarOrden(Number(cobrar.dataset.pay), cobrar);
  });
}

async function iniciar() {
  try {
    estado.usuario = await exigirRol(2);
    if (!estado.usuario) return;
    configurarUsuario(estado.usuario, 'user-name', 'user-role');
    $('#user-avatar').textContent = estado.usuario.nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
    $('#today-date').textContent = new Date().toLocaleDateString('es-MX', { dateStyle: 'medium' });
    iniciarEventos();
    await cargarDatos();
    mostrarVista(location.hash.slice(1) || 'tables');
    window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarDatos().catch((error) => mostrarAviso(error.message, 'error'));
      }
    }, 15000);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

iniciar();
