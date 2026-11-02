// js/validaciones.js
// Funciones puras: reciben un valor y devuelven el mensaje de error o null.
// No tocan el DOM ni el estado, así se prueban solas (ver tests/).

const LETRA = /\p{L}/gu;

// ---------- Paso 1 · Equipo ----------
export function validarMarca(valor) {
  return String(valor ?? '').trim() ? null : 'Elegí una marca';
}

export function validarModelo(valor) {
  const largo = String(valor ?? '').trim().length;
  return largo >= 2 && largo <= 40 ? null : 'Ingresá el modelo del equipo';
}

export function validarValor(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 100_000 && numero <= 2_500_000
    ? null
    : 'El valor debe estar entre $100.000 y $2.500.000';
}

export function validarAntiguedad(valor) {
  return ['menos-1', '1-2', 'mas-2'].includes(valor) ? null : 'Indicá la antigüedad';
}

// ---------- Paso 3 · Datos personales ----------
function tieneDosLetras(valor) {
  const texto = String(valor ?? '').trim();
  return (texto.match(LETRA) ?? []).length >= 2 && /^[\p{L}' -]+$/u.test(texto);
}

export function validarNombre(valor) {
  return tieneDosLetras(valor) ? null : 'Ingresá tu nombre';
}

export function validarApellido(valor) {
  return tieneDosLetras(valor) ? null : 'Ingresá tu apellido';
}

export function validarDni(valor) {
  // Se aceptan puntos o espacios al escribir (30.123.456)
  const limpio = String(valor ?? '').replace(/[.\s]/g, '');
  return /^\d{7,8}$/.test(limpio) ? null : 'El DNI debe tener 7 u 8 números';
}

// valor viene del <input type="date">: "AAAA-MM-DD"
export function validarNacimiento(valor, hoy = new Date()) {
  const mensaje = 'Tenés que ser mayor de edad';
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor ?? ''));
  if (!partes) return mensaje;
  const [anio, mes, dia] = partes.slice(1).map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return mensaje;
  if (anio < 1900) return mensaje;
  let edad = hoy.getFullYear() - anio;
  const cumplioEsteAnio = hoy.getMonth() + 1 > mes || (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia);
  if (!cumplioEsteAnio) edad -= 1;
  return edad >= 18 ? null : mensaje;
}

export function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor ?? '').trim()) ? null : 'Ingresá un email válido';
}

// 10 dígitos sin el 0 ni el 15 (se ignoran espacios y guiones): 11 5555-1234
export function validarCelular(valor) {
  const limpio = String(valor ?? '').replace(/[\s-]/g, '');
  return /^(?!0|15)\d{10}$/.test(limpio) ? null : 'Ej.: 11 5555-1234';
}

export function validarTerminos(valor) {
  return valor === true ? null : 'Tenés que aceptar los términos';
}

// ---------- Paso 4 · Pago ----------
export function validarTarjeta(valor) {
  const limpio = String(valor ?? '').replace(/\s/g, '');
  return /^\d{16}$/.test(limpio) ? null : 'Número de tarjeta inválido';
}

// MM/AA, mes 01–12 y fecha futura. La tarjeta vale hasta el último día del
// mes que figura, así que el mes en curso todavía es válido.
export function validarVencimiento(valor, hoy = new Date()) {
  const partes = /^(\d{2})\/(\d{2})$/.exec(String(valor ?? '').trim());
  if (!partes) return 'Vencimiento inválido';
  const mes = Number(partes[1]);
  const anio = 2000 + Number(partes[2]);
  if (mes < 1 || mes > 12) return 'Vencimiento inválido';
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;
  const vigente = anio > anioActual || (anio === anioActual && mes >= mesActual);
  return vigente ? null : 'Vencimiento inválido';
}

export function validarCvv(valor) {
  return /^\d{3}$/.test(String(valor ?? '').trim()) ? null : 'CVV inválido';
}

export function validarTitularTarjeta(valor) {
  return String(valor ?? '').trim() ? null : 'Ingresá el nombre del titular';
}

// ---------- Validación por paso ----------
// Qué campos tiene cada paso y con qué función se valida cada uno.
// La clave coincide con el name del input.
export const CAMPOS_POR_PASO = {
  1: {
    marca: (s) => validarMarca(s.equipo.marca),
    modelo: (s) => validarModelo(s.equipo.modelo),
    valor: (s) => validarValor(s.equipo.valor),
    antiguedad: (s) => validarAntiguedad(s.equipo.antiguedad),
  },
  3: {
    nombre: (s) => validarNombre(s.titular.nombre),
    apellido: (s) => validarApellido(s.titular.apellido),
    dni: (s) => validarDni(s.titular.dni),
    nacimiento: (s) => validarNacimiento(s.titular.nacimiento),
    email: (s) => validarEmail(s.titular.email),
    celular: (s) => validarCelular(s.titular.celular),
    terminos: (s) => validarTerminos(s.titular.terminos),
  },
  4: {
    tarjeta: (s) => validarTarjeta(s.pago.tarjeta),
    titularTarjeta: (s) => validarTitularTarjeta(s.pago.titular),
    vencimiento: (s) => validarVencimiento(s.pago.vencimiento),
    cvv: (s) => validarCvv(s.pago.cvv),
  },
};

// Devuelve { campo: mensaje } con los campos inválidos del paso (vacío si está todo bien).
export function validarPaso(paso, solicitud) {
  const errores = {};
  for (const [campo, validar] of Object.entries(CAMPOS_POR_PASO[paso] ?? {})) {
    const mensaje = validar(solicitud);
    if (mensaje) errores[campo] = mensaje;
  }
  return errores;
}

// Primer paso del checkout con datos inválidos (o null si todo está completo hasta `hasta`).
export function primerPasoInvalido(solicitud, hasta = 4) {
  for (const paso of [1, 3, 4]) {
    if (paso > hasta) break;
    if (Object.keys(validarPaso(paso, solicitud)).length) return paso;
  }
  return null;
}
