// js/cotizador.js
// Cálculo de la cuota. Es la única función que calcula precios: la usan las
// cards de plan, el resumen, el pago y la pantalla de éxito.

export const FACTOR_ANTIGUEDAD = {
  'menos-1': 1.0,   // Menos de 1 año
  '1-2': 1.1,       // 1 a 2 años
  'mas-2': 1.25,    // Más de 2 años
};

export const ETIQUETA_ANTIGUEDAD = {
  'menos-1': 'Menos de 1 año',
  '1-2': '1 a 2 años',
  'mas-2': 'Más de 2 años',
};

// cuota = Math.round(valor × tasaAnual / 12 × factorAntiguedad)
export function calcularCuota(valor, tasaAnual, factorAntiguedad) {
  return Math.round(valor * tasaAnual / 12 * factorAntiguedad);
}

// Cuota de un plan para el equipo cargado, o null si todavía no se puede calcular.
export function cuotaDelPlan(plan, equipo) {
  const factor = FACTOR_ANTIGUEDAD[equipo.antiguedad];
  if (!plan || !factor || !equipo.valor) return null;
  return calcularCuota(equipo.valor, plan.tasaAnual, factor);
}

// Los inputs devuelven strings: "$ 600.000" no es un número.
export function aNumero(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '');
  return digitos ? Number(digitos) : 0;
}

const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatearMoneda(numero) {
  return moneda.format(numero);
}
