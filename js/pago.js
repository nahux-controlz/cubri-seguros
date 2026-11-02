// js/pago.js
// Pago simulado y número de póliza. No hay backend ni pagos reales: la
// respuesta depende solo del número de tarjeta (tarjetas de prueba).
//   4111 1111 1111 1111 → aprobado
//   4000 0000 0000 0002 → rechazado
//   cualquier otro número válido → aprobado

export const DEMORA_PAGO_MS = 1500;

export function simularPago(numero) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const limpio = numero.replace(/\s/g, '');
      resolve(limpio === '4000000000000002'
        ? { ok: false, motivo: 'Tarjeta rechazada' }
        : { ok: true });
    }, DEMORA_PAGO_MS);
  });
}

// Número de póliza: POL-AAAA-NNNNNN
export function generarPoliza(contador, fecha = new Date()) {
  return `POL-${fecha.getFullYear()}-${String(contador).padStart(6, '0')}`;
}

// El contador sigue entre visitas (localStorage). Si el navegador no deja
// guardar (modo privado, cookies bloqueadas), sigue contando en memoria.
const CLAVE_CONTADOR = 'cubri:contador-polizas';
let contadorEnMemoria = 0;

export function siguienteContador() {
  try {
    const siguiente = Number(localStorage.getItem(CLAVE_CONTADOR) ?? 0) + 1;
    localStorage.setItem(CLAVE_CONTADOR, String(siguiente));
    return siguiente;
  } catch {
    contadorEnMemoria += 1;
    return contadorEnMemoria;
  }
}

// Últimos 4 dígitos para mostrar la tarjeta sin exponerla.
export function ultimosDigitos(numero) {
  return numero.replace(/\D/g, '').slice(-4);
}
