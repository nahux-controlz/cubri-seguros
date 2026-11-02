// js/estado.js
// Un único objeto con toda la información del flujo. El DOM solo muestra lo
// que dice este objeto: nunca se lee un dato del HTML para calcular algo.
import { render, enfocarPaso } from './render.js';

const SOLICITUD_INICIAL = {
  paso: 0,                // 0 = inicio, 1..4 = checkout, 5 = éxito, 6 = error
  equipo:  { marca: '', modelo: '', valor: 0, antiguedad: '' },
  plan: 'plus',
  titular: { nombre: '', apellido: '', dni: '', nacimiento: '',
             email: '', celular: '', terminos: false },
  pago:    { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  poliza: null,
};

export const solicitud = structuredClone(SOLICITUD_INICIAL);

// Estado de la interfaz: no forma parte de la solicitud, pero render() también
// lo usa para pintar (qué campos ya se tocaron, si el pago está en curso, etc.).
export const ui = {
  tocados: new Set(),     // campos que ya perdieron el foco (o se intentó avanzar)
  procesando: false,      // pago en curso
  planes: [],             // catálogo de data/planes.json
  errorPlanes: false,     // falló el fetch del JSON
};

// Dónde vive cada campo del formulario dentro de `solicitud`.
// La clave es el atributo name del input.
export const RUTAS = {
  marca: ['equipo', 'marca'],
  modelo: ['equipo', 'modelo'],
  valor: ['equipo', 'valor'],
  antiguedad: ['equipo', 'antiguedad'],
  plan: ['plan'],
  nombre: ['titular', 'nombre'],
  apellido: ['titular', 'apellido'],
  dni: ['titular', 'dni'],
  nacimiento: ['titular', 'nacimiento'],
  email: ['titular', 'email'],
  celular: ['titular', 'celular'],
  terminos: ['titular', 'terminos'],
  metodo: ['pago', 'metodo'],
  tarjeta: ['pago', 'tarjeta'],
  vencimiento: ['pago', 'vencimiento'],
  cvv: ['pago', 'cvv'],
  titularTarjeta: ['pago', 'titular'],
};

export function leerCampo(campo) {
  const [grupo, clave] = RUTAS[campo];
  return clave ? solicitud[grupo][clave] : solicitud[grupo];
}

export function actualizarCampo(campo, valor) {
  const [grupo, clave] = RUTAS[campo];
  if (clave) solicitud[grupo][clave] = valor;
  else solicitud[grupo] = valor;
  render();               // siempre después de cambiar el estado
}

export function marcarTocado(...campos) {
  campos.forEach((c) => ui.tocados.add(c));
  render();
}

export function irAPaso(n) {
  const cambia = solicitud.paso !== n;
  solicitud.paso = n;
  render();               // siempre después de cambiar el estado
  if (cambia) enfocarPaso();
}

export function reiniciarSolicitud() {
  Object.assign(solicitud, structuredClone(SOLICITUD_INICIAL));
  ui.tocados.clear();
  ui.procesando = false;
}
