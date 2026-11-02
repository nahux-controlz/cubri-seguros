// js/app.js
// Arranque, eventos y navegación. Cada evento modifica `solicitud` y después
// se llama a render() (a través de las funciones de estado.js).
import { solicitud, ui, RUTAS, actualizarCampo, marcarTocado, irAPaso, reiniciarSolicitud } from './estado.js';
import { render, enfocarPrimerError } from './render.js';
import { validarPaso, CAMPOS_POR_PASO } from './validaciones.js';
import { aNumero } from './cotizador.js';

// ---------- Planes (data/planes.json) ----------
let cargaDePlanes = null;

function cargarPlanes() {
  cargaDePlanes ??= fetch('data/planes.json')
    .then((respuesta) => {
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return respuesta.json();
    })
    .then((planes) => {
      ui.planes = planes;
      ui.errorPlanes = false;
    })
    .catch(() => {
      // Pasa si se abre index.html con doble click (file://): el paso 2 lo explica.
      ui.errorPlanes = true;
      cargaDePlanes = null;
    })
    .finally(render);
  return cargaDePlanes;
}

// ---------- Lectura de inputs ----------
function valorDelInput(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.name === 'valor') return aNumero(el.value);   // "$ 600.000" → 600000
  return el.value;
}

function alCambiarCampo(evento) {
  const el = evento.target;
  if (!(el.name in RUTAS)) return;
  actualizarCampo(el.name, valorDelInput(el));
}

// ---------- Navegación ----------
function volver() {
  if (solicitud.paso > 0) irAPaso(solicitud.paso - 1);
}

const ACCIONES = {
  comenzar: () => irAPaso(1),
  volver,
  inicio: () => {
    if (solicitud.paso === 5) reiniciarSolicitud();
    irAPaso(0);
  },
  reiniciar: () => {
    reiniciarSolicitud();
    irAPaso(0);
  },
  reintentar: () => irAPaso(4),
  'cambiar-medio': () => irAPaso(4),
  'recargar-planes': () => {
    ui.errorPlanes = false;
    render();
    cargarPlanes();
  },
};

function alHacerClick(evento) {
  if (evento.target.closest('a[aria-disabled="true"]')) {
    evento.preventDefault();         // "Siniestros" y "Ayuda" todavía no existen
    return;
  }
  const disparador = evento.target.closest('[data-accion]');
  if (!disparador) return;
  const accion = ACCIONES[disparador.dataset.accion];
  if (!accion) return;
  evento.preventDefault();
  accion(disparador);
}

// ---------- Formularios ----------
// Revalida todo el paso al intentar avanzar. Si hay errores los muestra todos
// y lleva el foco al primer campo inválido.
function pasoValido(paso) {
  const errores = validarPaso(paso, solicitud);
  if (Object.keys(errores).length === 0) return true;
  marcarTocado(...Object.keys(CAMPOS_POR_PASO[paso]));
  enfocarPrimerError(paso);
  return false;
}

const AL_ENVIAR = {
  'form-cotizar': async () => {
    if (!pasoValido(1)) return;
    await cargarPlanes();
    irAPaso(2);
  },
  'form-plan': () => irAPaso(3),
  'form-datos': () => {
    if (pasoValido(3)) irAPaso(4);
  },
  'form-pago': () => {
    if (pasoValido(4)) irAPaso(5);
  },
};

function alEnviar(evento) {
  const enviar = AL_ENVIAR[evento.target.id];
  if (!enviar) return;
  evento.preventDefault();           // sin esto el <form> recarga la página
  enviar();
}

// ---------- Arranque ----------
const esOpcion = (el) => el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT';

document.addEventListener('input', (e) => {
  if (!esOpcion(e.target)) alCambiarCampo(e);
});
document.addEventListener('change', (e) => {
  if (esOpcion(e.target)) alCambiarCampo(e);
});
// Los errores se muestran al salir de cada campo, no mientras se escribe.
document.addEventListener('focusout', (e) => {
  if (e.target.name in RUTAS) marcarTocado(e.target.name);
});
document.addEventListener('click', alHacerClick);
document.addEventListener('submit', alEnviar);

render();
cargarPlanes();
