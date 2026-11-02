// js/mascaras.js  (bonus)
// Máscaras de input: se formatea mientras se escribe sin que el cursor salte
// al final. Son funciones puras + un único punto que toca el <input>.

export function formatearTarjeta(digitos) {
  return digitos.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// "1228" → "12/28": la barra aparece sola al escribir el tercer dígito.
export function formatearVencimiento(digitos) {
  const d = digitos.slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// "600000" → "600.000"
export function formatearMiles(digitos) {
  const d = digitos.replace(/^0+(?=\d)/, '').slice(0, 9);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function soloDigitos(digitos, largo) {
  return digitos.slice(0, largo);
}

const MASCARAS = {
  tarjeta: formatearTarjeta,
  vencimiento: formatearVencimiento,
  valor: formatearMiles,
  cvv: (d) => soloDigitos(d, 3),
};

// Aplica la máscara del campo (si tiene) conservando la posición del cursor:
// cuenta cuántos dígitos había antes del cursor y lo deja después de esos
// mismos dígitos en el texto formateado.
export function aplicarMascara(input) {
  const formatear = MASCARAS[input.name];
  if (!formatear) return;
  const { value } = input;
  const cursor = input.selectionStart ?? value.length;
  const digitosAntes = value.slice(0, cursor).replace(/\D/g, '').length;
  const nuevo = formatear(value.replace(/\D/g, ''));
  if (nuevo === value) return;
  input.value = nuevo;
  let posicion = 0;
  for (let vistos = 0; posicion < nuevo.length && vistos < digitosAntes; posicion++) {
    if (/\d/.test(nuevo[posicion])) vistos++;
  }
  input.setSelectionRange(posicion, posicion);
}
