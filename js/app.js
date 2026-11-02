// js/app.js
// Arranque, eventos y navegación. Cada evento modifica `solicitud` y después
// se llama a render() (a través de las funciones de estado.js).
import { solicitud, RUTAS, actualizarCampo, marcarTocado, irAPaso, reiniciarSolicitud } from './estado.js';
import { render } from './render.js';

// ---------- Lectura de inputs ----------
function valorDelInput(el) {
  if (el.type === 'checkbox') return el.checked;
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
const SIGUIENTE = {
  'form-cotizar': 2,
  'form-plan': 3,
  'form-datos': 4,
  'form-pago': 5,
};

function alEnviar(evento) {
  const form = evento.target;
  if (!(form.id in SIGUIENTE)) return;
  evento.preventDefault();           // sin esto el <form> recarga la página
  irAPaso(SIGUIENTE[form.id]);
}

// ---------- Arranque ----------
document.addEventListener('input', (e) => {
  if (e.target.type !== 'radio' && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') alCambiarCampo(e);
});
document.addEventListener('change', (e) => {
  if (e.target.type === 'radio' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') alCambiarCampo(e);
});
document.addEventListener('focusout', (e) => {
  if (e.target.name in RUTAS) marcarTocado(e.target.name);
});
document.addEventListener('click', alHacerClick);
document.addEventListener('submit', alEnviar);

render();
