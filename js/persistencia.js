// js/persistencia.js  (bonus)
// Guarda la solicitud en localStorage para que sobreviva a un F5 y la borra
// al terminar. Los datos de la tarjeta (número, vencimiento y CVV) nunca se
// guardan, ni siquiera siendo de prueba.
const CLAVE = 'cubri:solicitud';

export function guardarSolicitud(solicitud) {
  try {
    const { pago, poliza, ...resto } = solicitud;
    const copia = { ...resto, pago: { metodo: pago.metodo, titular: pago.titular } };
    localStorage.setItem(CLAVE, JSON.stringify(copia));
  } catch {
    // Modo privado o almacenamiento bloqueado: el flujo sigue funcionando sin guardar.
  }
}

export function leerSolicitud() {
  try {
    const texto = localStorage.getItem(CLAVE);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function borrarSolicitud() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}
