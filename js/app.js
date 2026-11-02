// js/app.js
// Arranque, eventos y navegación. Cada evento modifica `solicitud` y después
// se llama a render() (a través de las funciones de estado.js).
import { solicitud, ui, RUTAS, actualizarCampo, marcarTocado, irAPaso, reiniciarSolicitud, restaurarSolicitud } from './estado.js';
import { leerSolicitud } from './persistencia.js';
import { aplicarMascara } from './mascaras.js';
import { render, enfocarPrimerError } from './render.js';
import { validarPaso, primerPasoInvalido, CAMPOS_POR_PASO } from './validaciones.js';
import { aNumero, cuotaDelPlan, formatearMoneda, ETIQUETA_ANTIGUEDAD } from './cotizador.js';
import { simularPago, generarPoliza, siguienteContador, ultimosDigitos } from './pago.js';
import { planElegido, formatoFecha } from './render.js';

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
  aplicarMascara(el);   // bonus: tarjeta en grupos de 4, vencimiento con barra, miles en el valor
  actualizarCampo(el.name, valorDelInput(el));
}

// ---------- Navegación ----------
function volver() {
  if (solicitud.paso === 1) ui.editando = false;
  if (solicitud.paso > 0) irAPaso(solicitud.paso - 1);
}

// Avanza al paso siguiente; si se vino desde "Editar" del resumen de pago,
// vuelve directo al pago (siempre que los pasos anteriores sigan completos).
function avanzar(siguiente) {
  if (!ui.editando) {
    irAPaso(siguiente);
    return;
  }
  const incompleto = primerPasoInvalido(solicitud, 3);
  if (incompleto) {
    pasoValido(incompleto);
    return;
  }
  ui.editando = false;
  irAPaso(4);
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
  // Desde el error se vuelve al pago con todos los datos cargados.
  reintentar: () => {
    irAPaso(4);
    document.getElementById('boton-pagar').focus();
  },
  'cambiar-medio': () => {
    irAPaso(4);
    document.querySelector('input[name="metodo"]:checked')?.focus();
  },
  descargar: descargarPoliza,
  // Bonus modo oscuro: basecoat.theme guarda la elección en localStorage.
  tema: () => {
    if (window.basecoat?.theme) window.basecoat.theme.toggle();
    else document.documentElement.classList.toggle('dark');
    render();
  },
  'mi-cuenta': () => mostrarToast({
    category: 'info',
    title: 'Mi cuenta',
    description: 'Muy pronto vas a poder ver tus pólizas desde acá.',
  }),
  // Bonus: links "Editar" del resumen de pago
  editar: (boton) => {
    ui.editando = true;
    irAPaso(Number(boton.dataset.destino));
  },
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
  if (solicitud.paso !== paso) irAPaso(paso);
  marcarTocado(...Object.keys(CAMPOS_POR_PASO[paso]));
  enfocarPrimerError(paso);
  return false;
}

// ---------- Toasts (bonus) ----------
// toast.js de Basecoat le agrega el método toast() al #toaster. Si el CDN no
// cargó, simplemente no se muestra nada: el flujo no depende del toast.
function mostrarToast(config) {
  document.getElementById('toaster')?.toast?.(config);
}

// ---------- Pago ----------
async function pagar() {
  if (ui.procesando) return;                       // evita el doble pago
  const pasoIncompleto = primerPasoInvalido(solicitud, 3);
  if (pasoIncompleto && !pasoValido(pasoIncompleto)) return;
  if (!pasoValido(4)) return;

  ui.procesando = true;
  render();                                        // "Procesando…" y botón deshabilitado ya
  const resultado = await simularPago(solicitud.pago.tarjeta);
  ui.procesando = false;

  if (resultado.ok) {
    solicitud.poliza = generarPoliza(siguienteContador());
    ui.emision = new Date();
    ui.errorPago = null;
    irAPaso(5);
    mostrarToast({
      category: 'success',
      title: 'Pago aprobado',
      description: `Tu póliza ${solicitud.poliza} ya está activa.`,
    });
  } else {
    ui.errorPago = resultado.motivo;
    irAPaso(6);
  }
}

// "Descargar póliza": un comprobante de texto armado con los datos del estado.
function descargarPoliza() {
  const plan = planElegido();
  const { equipo, titular, pago } = solicitud;
  const cuota = cuotaDelPlan(plan, equipo);
  const lineas = [
    'CUBRÍ SEGUROS · Póliza de seguro de celular',
    '='.repeat(44),
    `Póliza: ${solicitud.poliza}`,
    `Vigencia desde: ${formatoFecha.format(ui.emision ?? new Date())}`,
    '',
    `Titular: ${titular.nombre.trim()} ${titular.apellido.trim()} · DNI ${titular.dni}`,
    `Email: ${titular.email.trim()} · Celular: ${titular.celular.trim()}`,
    '',
    `Equipo: ${equipo.marca} ${equipo.modelo.trim()}`,
    `Valor asegurado: ${formatearMoneda(equipo.valor)} · Antigüedad: ${ETIQUETA_ANTIGUEDAD[equipo.antiguedad]}`,
    '',
    `Plan: ${plan.nombre}`,
    `Coberturas: ${plan.coberturas.join(', ')}`,
    `Cuota mensual: ${formatearMoneda(cuota)}`,
    `Medio de pago: tarjeta de ${pago.metodo === 'credito' ? 'crédito' : 'débito'} terminada en ${ultimosDigitos(pago.tarjeta)}`,
    '',
    'Documento de una práctica académica: no tiene validez legal.',
  ];
  const archivo = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `${solicitud.poliza}.txt`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

const AL_ENVIAR = {
  'form-cotizar': async () => {
    if (!pasoValido(1)) return;
    await cargarPlanes();
    avanzar(2);
  },
  'form-plan': () => avanzar(3),
  'form-datos': () => {
    if (pasoValido(3)) avanzar(4);
  },
  'form-pago': pagar,
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

// Bonus persistencia: retomar la solicitud donde quedó antes del F5, sin
// saltear pasos que tengan datos inválidos.
restaurarSolicitud(leerSolicitud());
if (solicitud.paso > 1) {
  solicitud.paso = primerPasoInvalido(solicitud, solicitud.paso - 1) ?? solicitud.paso;
}

render();
cargarPlanes();
