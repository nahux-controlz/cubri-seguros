// js/render.js
// Pinta cada paso a partir del estado. render() se puede llamar las veces que
// haga falta: siempre deja el DOM igual a lo que dice `solicitud`.
import { solicitud, leerCampo, RUTAS } from './estado.js';

const TITULOS = {
  1: { barra: 'Cotizá tu seguro', pagina: 'Contanos sobre tu celular', accion: 'Ver planes' },
  2: { barra: 'Elegí tu plan', pagina: 'Elegí tu plan', accion: 'Continuar' },
  3: { barra: 'Tus datos', pagina: 'Tus datos', accion: 'Continuar al pago' },
  4: { barra: 'Pago', pagina: 'Pago', accion: 'Pagar y contratar' },
};

const NOMBRES_PLAN = { basico: 'Básico', plus: 'Plus', premium: 'Premium' };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Escribe el texto en todos los elementos con data-bind="clave".
function pintar(clave, texto) {
  $$(`[data-bind="${clave}"]`).forEach((el) => {
    if (el.textContent !== texto) el.textContent = texto;
  });
}

function mostrar(selector, visible) {
  $$(selector).forEach((el) => { el.hidden = !visible; });
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
  renderCampos();
  renderResumen();
  renderResultado();
}

function renderEncabezado() {
  const titulos = TITULOS[solicitud.paso];
  if (titulos) {
    pintar('barra.titulo', titulos.barra);
    pintar('paso.titulo', titulos.pagina);
    pintar(`accion.${solicitud.paso}`, titulos.accion);
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
    li.querySelector('.stepper-estado').textContent =
      estado === 'activo' ? ', paso actual' : estado === 'completo' ? ', completo' : ', pendiente';
  });
}

// Rellena los inputs desde el estado: al volver atrás nada se pierde.
// El campo que tiene el foco no se toca para no mover el cursor.
function renderCampos() {
  $$('input[name], select[name]').forEach((el) => {
    if (!(el.name in RUTAS)) return;
    const valor = leerCampo(el.name);
    if (el.type === 'radio') {
      el.checked = el.value === valor;
    } else if (el.type === 'checkbox') {
      el.checked = Boolean(valor);
    } else if (el !== document.activeElement) {
      const texto = valor ? String(valor) : '';
      if (el.value !== texto) el.value = texto;
    }
  });
}

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
  const { paso } = solicitud;
  const plan = NOMBRES_PLAN[solicitud.plan];

  pintar('resumen.seguro', 'Celular');
  pintar('resumen.equipo', nombreEquipo() || '—');
  pintar('resumen.valor', solicitud.equipo.valor ? String(solicitud.equipo.valor) : '—');
  pintar('resumen.plan', plan);
  pintar('resumen.titular', nombreTitular() || '—');
  pintar('resumen.total', '—');
  pintar('resumen.compacto', `Plan ${plan} · ${solicitud.equipo.modelo.trim() || solicitud.equipo.marca || 'tu equipo'}`);

  mostrar('#resumen [data-fila="valor"]', paso === 1);
  mostrar('#resumen [data-fila="plan"]', paso >= 2);
  mostrar('#resumen [data-fila="titular"]', paso === 4);
  mostrar('#resumen [data-fila="total"]', paso >= 2);
  mostrar('#resumen [data-fila="nota"]', paso === 1);
}

function renderResultado() {
  pintar('exito.nombre', solicitud.titular.nombre.trim());
  pintar('exito.email', solicitud.titular.email.trim());
  pintar('exito.poliza', solicitud.poliza ?? '');
  pintar('exito.plan', NOMBRES_PLAN[solicitud.plan]);
  pintar('exito.equipo', nombreEquipo());
}

// Después de cambiar de paso: arriba de todo y foco en el título, para que
// teclado y lectores de pantalla arranquen desde el principio del paso.
export function enfocarPaso() {
  const titulos = { 0: '#titulo-inicio', 5: '#titulo-exito', 6: '#titulo-error' };
  const titulo = $(titulos[solicitud.paso] ?? '#titulo-paso');
  window.scrollTo({ top: 0, behavior: 'instant' });
  titulo?.focus({ preventScroll: true });
}
