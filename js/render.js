// js/render.js
// Pinta cada paso a partir del estado. render() se puede llamar las veces que
// haga falta: siempre deja el DOM igual a lo que dicen `solicitud` y `ui`.
import { solicitud, ui, leerCampo, RUTAS } from './estado.js';
import { validarPaso, CAMPOS_POR_PASO } from './validaciones.js';
import { cuotaDelPlan, formatearMoneda } from './cotizador.js';
import { ultimosDigitos } from './pago.js';

const TITULOS = {
  1: { barra: 'Cotizá tu seguro', pagina: 'Contanos sobre tu celular', accion: 'Ver planes' },
  2: { barra: 'Elegí tu plan', pagina: 'Elegí tu plan', accion: 'Continuar' },
  3: { barra: 'Tus datos', pagina: 'Tus datos', accion: 'Continuar al pago' },
  4: { barra: 'Pago', pagina: 'Pago', accion: 'Pagar y contratar' },
};

// Nombre visible de cada campo, para explicar por qué un botón está deshabilitado.
const ETIQUETAS = {
  marca: 'marca', modelo: 'modelo', valor: 'valor del equipo', antiguedad: 'antigüedad',
  nombre: 'nombre', apellido: 'apellido', dni: 'DNI', nacimiento: 'fecha de nacimiento',
  email: 'email', celular: 'celular', terminos: 'términos y condiciones',
};

const lista = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });
export const formatoFecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

// Escribe el texto en todos los elementos con data-bind="clave".
function pintar(clave, texto) {
  $$(`[data-bind="${clave}"]`).forEach((el) => {
    if (el.textContent !== texto) el.textContent = texto;
  });
}

function mostrar(selector, visible) {
  $$(selector).forEach((el) => { el.hidden = !visible; });
}

export function planElegido() {
  return ui.planes.find((p) => p.id === solicitud.plan) ?? null;
}

export function render() {
  const { paso } = solicitud;
  document.querySelectorAll('section[data-paso]').forEach((s) => {
    s.hidden = Number(s.dataset.paso) !== paso;
  });
  $('#checkout').hidden = paso < 1 || paso > 4;
  document.body.dataset.vista = paso;

  renderEncabezado();
  renderStepper();
  renderPlanes();
  renderCampos();
  renderValidacion();
  renderResumen();
  renderPago();
  renderResultado();
  renderTema();
}

// Bonus modo oscuro: el botón indica si el modo oscuro está activo.
function renderTema() {
  const oscuro = document.documentElement.classList.contains('dark');
  $$('[data-accion="tema"]').forEach((boton) => {
    boton.setAttribute('aria-pressed', String(oscuro));
    boton.title = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  });
}

function renderEncabezado() {
  const titulos = TITULOS[solicitud.paso];
  // Bonus "Editar desde el resumen": el botón principal vuelve directo al pago.
  for (const paso of [1, 2, 3]) {
    pintar(`accion.${paso}`, ui.editando ? 'Guardar y volver al pago' : TITULOS[paso].accion);
  }
  if (titulos) {
    pintar('barra.titulo', titulos.barra);
    pintar('paso.titulo', titulos.pagina);
    document.title = `Paso ${solicitud.paso} de 4 · ${titulos.pagina} — Cubrí Seguros`;
  } else {
    document.title = 'Cubrí Seguros';
  }
}

// Recibe el paso actual y pinta 3 estados: completo / activo / pendiente.
function renderStepper() {
  $$('.stepper li').forEach((li) => {
    const n = Number(li.dataset.step);
    const estado = n < solicitud.paso ? 'completo' : n === solicitud.paso ? 'activo' : 'pendiente';
    li.dataset.estado = estado;
    if (estado === 'activo') li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
    $('.stepper-estado', li).textContent =
      estado === 'activo' ? ', paso actual' : estado === 'completo' ? ', completo' : ', pendiente';
  });
}

// ---------- Planes ----------
function crearCobertura(texto, incluida) {
  const li = $('#tpl-cobertura').content.firstElementChild.cloneNode(true);
  $('span', li).textContent = texto;
  if (!incluida) {
    li.dataset.incluida = 'false';
    $('use', li).setAttribute('href', '#i-x');
    $('span', li).insertAdjacentHTML('afterbegin', '<span class="sr-only">No incluye: </span>');
  }
  return li;
}

// Las cards se crean una sola vez a partir de data/planes.json; después
// render() solo actualiza la cuota y cuál está elegida.
function crearCardsDePlanes() {
  const contenedor = $('#lista-planes');
  if (contenedor.children.length || !ui.planes.length) return;
  const plantilla = $('#tpl-plan').content.firstElementChild;
  ui.planes.forEach((plan) => {
    const card = plantilla.cloneNode(true);
    card.dataset.plan = plan.id;
    const radio = $('[data-plan="radio"]', card);
    radio.value = plan.id;
    radio.id = `plan-${plan.id}`;
    const nombre = $('[data-plan="nombre"]', card);
    nombre.textContent = plan.nombre;
    nombre.id = `plan-${plan.id}-nombre`;
    $('[data-plan="precio"]', card).id = `plan-${plan.id}-precio`;
    radio.setAttribute('aria-labelledby', nombre.id);
    radio.setAttribute('aria-describedby', `plan-${plan.id}-precio plan-${plan.id}-coberturas`);
    $('[data-plan="recomendado"]', card).hidden = !plan.recomendado;
    const coberturas = $('[data-plan="coberturas"]', card);
    coberturas.id = `plan-${plan.id}-coberturas`;
    plan.coberturas.forEach((c) => coberturas.append(crearCobertura(c, true)));
    (plan.noIncluye ?? []).forEach((c) => coberturas.append(crearCobertura(c, false)));
    contenedor.append(card);
  });
}

function renderPlanes() {
  crearCardsDePlanes();
  mostrar('#planes-cargando', !ui.planes.length && !ui.errorPlanes);
  mostrar('#planes-error', ui.errorPlanes);
  ui.planes.forEach((plan) => {
    const cuota = cuotaDelPlan(plan, solicitud.equipo);
    pintarEn(`[data-plan="${plan.id}"] [data-plan="cuota"]`, cuota === null ? '—' : formatearMoneda(cuota));
  });
}

function pintarEn(selector, texto) {
  const el = $(selector);
  if (el && el.textContent !== texto) el.textContent = texto;
}

// ---------- Campos ----------
// Rellena los inputs desde el estado: al volver atrás nada se pierde.
// El campo que tiene el foco no se toca para no mover el cursor.
function textoDelCampo(campo, valor) {
  if (campo === 'valor') return valor ? formatearMoneda(valor) : '';
  return valor ? String(valor) : '';
}

function renderCampos() {
  $$('input[name], select[name]').forEach((el) => {
    if (!(el.name in RUTAS)) return;
    const valor = leerCampo(el.name);
    if (el.type === 'radio') {
      el.checked = el.value === valor;
    } else if (el.type === 'checkbox') {
      el.checked = Boolean(valor);
    } else if (el !== document.activeElement) {
      const texto = textoDelCampo(el.name, valor);
      if (el.value !== texto) el.value = texto;
    }
  });
}

// ---------- Validación ----------
// Cada campo muestra su error recién después de que la persona salió de él
// (blur) o intentó avanzar; mientras tanto el botón queda deshabilitado y el
// texto de ayuda explica qué falta.
function pintarError(campo, mensaje) {
  const grupo = $(`[data-campo="${campo}"]`);
  const control = document.getElementById(campo);
  const error = document.getElementById(`${campo}-error`);
  const ayuda = document.getElementById(`${campo}-ayuda`);
  if (!grupo || !control || !error) return;

  if (mensaje) {
    grupo.dataset.invalid = '';
    control.setAttribute('aria-invalid', 'true');
    if (error.textContent !== mensaje) error.textContent = mensaje;
    error.hidden = false;
    control.setAttribute('aria-describedby', error.id);
  } else {
    delete grupo.dataset.invalid;
    control.removeAttribute('aria-invalid');
    error.hidden = true;
    error.textContent = '';
    control.setAttribute('aria-describedby', ayuda ? ayuda.id : error.id);
  }
  if (ayuda) ayuda.hidden = Boolean(mensaje);
}

function renderValidacion() {
  for (const paso of [1, 3, 4]) {
    const errores = validarPaso(paso, solicitud);
    Object.keys(CAMPOS_POR_PASO[paso]).forEach((campo) => {
      pintarError(campo, ui.tocados.has(campo) ? errores[campo] : null);
    });

    // "Ver planes" y "Continuar al pago" se habilitan solo con todo válido.
    if (paso === 4) continue;
    const invalidos = Object.keys(errores);
    const boton = $(`#${paso === 1 ? 'form-cotizar' : 'form-datos'} button[type="submit"]`);
    boton.disabled = invalidos.length > 0;
    const ayuda = $(`#ayuda-paso-${paso}`);
    ayuda.hidden = invalidos.length === 0;
    ayuda.textContent = invalidos.length
      ? `Para continuar, completá: ${lista.format(invalidos.map((c) => ETIQUETAS[c]))}.`
      : '';
  }
}

// ---------- Resumen ----------
function nombreEquipo() {
  const { marca, modelo } = solicitud.equipo;
  return [marca, modelo.trim()].filter(Boolean).join(' ');
}

function nombreTitular() {
  const { nombre, apellido } = solicitud.titular;
  return [nombre.trim(), apellido.trim()].filter(Boolean).join(' ');
}

// El resumen se genera una sola vez desde el estado y CSS decide cómo se ve:
// card lateral en desktop, barra arriba del botón (paso 2) o card arriba del
// formulario (paso 4) en mobile.
function renderResumen() {
  const { paso, equipo } = solicitud;
  const plan = planElegido();
  const cuota = cuotaDelPlan(plan, equipo);

  pintar('resumen.seguro', 'Celular');
  pintar('resumen.equipo', nombreEquipo() || '—');
  pintar('resumen.valor', equipo.valor ? formatearMoneda(equipo.valor) : '—');
  pintar('resumen.plan', plan?.nombre ?? '—');
  pintar('resumen.titular', nombreTitular() || '—');
  pintar('resumen.total', cuota === null ? '—' : formatearMoneda(cuota));
  pintar('resumen.compacto', `Plan ${plan?.nombre ?? ''} · ${equipo.modelo.trim() || equipo.marca || 'tu equipo'}`);

  mostrar('#resumen [data-fila="valor"]', paso === 1);
  mostrar('#resumen [data-fila="plan"]', paso >= 2);
  mostrar('#resumen [data-fila="titular"]', paso === 4);
  mostrar('#resumen [data-fila="total"]', paso >= 2);
  mostrar('#resumen [data-fila="nota"]', paso === 1);
  mostrar('#resumen .resumen-editar', paso === 4 && !ui.procesando);
}

// ---------- Pago ----------
// Durante el pago el botón queda en "Procesando…" y deshabilitado: así no se
// puede pagar dos veces. Se vuelve a habilitar solo si el pago falla.
function renderPago() {
  const boton = $('#boton-pagar');
  boton.disabled = ui.procesando;
  boton.toggleAttribute('aria-busy', ui.procesando);
  $('[data-cargando]', boton).classList.toggle('hidden', !ui.procesando);
  pintar('accion.4', ui.procesando ? 'Procesando…' : TITULOS[4].accion);
  $$('#form-pago [data-accion="volver"], #form-pago input').forEach((el) => { el.disabled = ui.procesando; });
}

function renderResultado() {
  const plan = planElegido();
  const cuota = cuotaDelPlan(plan, solicitud.equipo);
  pintar('exito.nombre', solicitud.titular.nombre.trim());
  pintar('exito.email', solicitud.titular.email.trim());
  pintar('exito.poliza', solicitud.poliza ?? '');
  pintar('exito.plan', plan?.nombre ?? '');
  pintar('exito.equipo', nombreEquipo());
  pintar('exito.vigencia', ui.emision ? formatoFecha.format(ui.emision) : '');
  pintar('exito.cuota', cuota === null ? '' : formatearMoneda(cuota));
  pintar('error.motivo', ui.errorPago ?? 'Tarjeta rechazada');
  pintar('error.tarjeta', ultimosDigitos(solicitud.pago.tarjeta));
}

// ---------- Foco ----------
// Después de cambiar de paso: arriba de todo y foco en el título, para que
// teclado y lectores de pantalla arranquen desde el principio del paso.
export function enfocarPaso() {
  const titulos = { 0: '#titulo-inicio', 5: '#titulo-exito', 6: '#titulo-error' };
  const titulo = $(titulos[solicitud.paso] ?? '#titulo-paso');
  window.scrollTo({ top: 0, behavior: 'instant' });
  titulo?.focus({ preventScroll: true });
}

// Al intentar avanzar con errores: foco al primer campo inválido del paso.
export function enfocarPrimerError(paso) {
  const errores = validarPaso(paso, solicitud);
  const primero = Object.keys(CAMPOS_POR_PASO[paso]).find((campo) => campo in errores);
  if (!primero) return;
  const control = document.getElementById(primero);
  const foco = control.matches('[role="radiogroup"]') ? $('input', control) : control;
  foco.focus();
}
