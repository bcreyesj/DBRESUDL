// ==================== UTILIDAD: BÚSQUEDA LOCAL ====================
// Filtra las listas renderizadas y los ingredientes disponibles en las recetas.
function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

function obtenerMensajeSinCoincidencias(entrada, destino) {
  const id = `${destino.id}-no-results`;
  let mensaje = document.getElementById(id);
  if (mensaje) return mensaje;

  if (destino instanceof HTMLTableSectionElement) {
    mensaje = document.createElement('tr');
    mensaje.innerHTML = `<td class="empty-state" colspan="${Number(entrada.dataset.searchColumns) || 1}"></td>`;
  } else {
    mensaje = document.createElement('div');
    mensaje.className = 'empty-state search-empty';
  }
  mensaje.id = id;
  mensaje.hidden = true;
  mensaje.textContent = entrada.dataset.searchEmpty || 'No hay resultados que coincidan con la búsqueda.';
  destino.append(mensaje);
  return mensaje;
}

function filtrarLista(entrada) {
  const destino = document.getElementById(entrada.dataset.searchFor);
  if (!destino) return;

  const termino = normalizarTexto(entrada.value);
  const elementos = [...destino.querySelectorAll('[data-search-item]')];
  const visibles = elementos.filter((elemento) => {
    const texto = normalizarTexto(elemento.dataset.searchText || elemento.textContent);
    elemento.hidden = Boolean(termino && !texto.includes(termino));
    return !elemento.hidden;
  }).length;
  const contador = document.getElementById(`${destino.id}-search-count`);
  if (contador) contador.textContent = `${visibles} de ${elementos.length} ${entrada.dataset.searchLabel || 'resultados'}`;

  const mensajeSinCoincidencias = obtenerMensajeSinCoincidencias(entrada, destino);
  if (mensajeSinCoincidencias) mensajeSinCoincidencias.hidden = !termino || visibles > 0 || elementos.length === 0;

  destino.querySelectorAll('[data-search-group]').forEach((grupo) => {
    const elementosGrupo = [...grupo.querySelectorAll('[data-search-item]')];
    const visiblesGrupo = elementosGrupo.filter((elemento) => !elemento.hidden).length;
    const contadorGrupo = grupo.parentElement.querySelector('[data-search-group-count]');
    if (contadorGrupo) contadorGrupo.textContent = visiblesGrupo;
    const mensajeGrupo = grupo.querySelector('[data-search-group-empty]');
    if (mensajeGrupo) mensajeGrupo.hidden = !termino || visiblesGrupo > 0;
  });
}

function filtrarOpcionesIngrediente(entrada) {
  const selector = entrada.closest('.field')?.querySelector('select');
  if (!selector) return;
  const termino = normalizarTexto(entrada.value);
  [...selector.options].forEach((opcion) => {
    opcion.hidden = Boolean(
      termino &&
      opcion.value &&
      !opcion.selected &&
      !normalizarTexto(opcion.textContent).includes(termino)
    );
  });
}

export function configurarBuscadores() {
  document.addEventListener('input', (evento) => {
    const entrada = evento.target.closest('[data-search-for]');
    if (entrada) filtrarLista(entrada);

    const filtroIngrediente = evento.target.closest('[data-filter-options]');
    if (filtroIngrediente) filtrarOpcionesIngrediente(filtroIngrediente);
  });
}

export function aplicarBuscadores() {
  document.querySelectorAll('[data-search-for]').forEach(filtrarLista);
  document.querySelectorAll('[data-filter-options]').forEach(filtrarOpcionesIngrediente);
}
