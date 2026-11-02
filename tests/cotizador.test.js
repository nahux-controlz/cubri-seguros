// Casos de prueba de la sección 5.1: tienen que dar exactamente esto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularCuota, cuotaDelPlan, FACTOR_ANTIGUEDAD, aNumero, formatearMoneda } from '../js/cotizador.js';

const planes = JSON.parse(readFileSync(new URL('../data/planes.json', import.meta.url), 'utf8'));
const tasa = Object.fromEntries(planes.map((p) => [p.id, p.tasaAnual]));

const CASOS = [
  { valor: 600_000, antiguedad: 'menos-1', esperado: { basico: 2000, plus: 3000, premium: 4500 } },
  { valor: 600_000, antiguedad: '1-2', esperado: { basico: 2200, plus: 3300, premium: 4950 } },
  { valor: 1_200_000, antiguedad: 'mas-2', esperado: { basico: 5000, plus: 7500, premium: 11250 } },
];

for (const { valor, antiguedad, esperado } of CASOS) {
  test(`valor ${valor} · ${antiguedad}`, () => {
    for (const [plan, cuota] of Object.entries(esperado)) {
      assert.equal(calcularCuota(valor, tasa[plan], FACTOR_ANTIGUEDAD[antiguedad]), cuota, plan);
      const datosPlan = planes.find((p) => p.id === plan);
      assert.equal(cuotaDelPlan(datosPlan, { valor, antiguedad }), cuota, `${plan} (cuotaDelPlan)`);
    }
  });
}

test('planes.json tiene Básico, Plus (recomendado) y Premium', () => {
  assert.deepEqual(planes.map((p) => p.id), ['basico', 'plus', 'premium']);
  assert.equal(planes.find((p) => p.recomendado).id, 'plus');
});

test('sin valor o sin antigüedad no hay cuota', () => {
  assert.equal(cuotaDelPlan(planes[0], { valor: 0, antiguedad: 'menos-1' }), null);
  assert.equal(cuotaDelPlan(planes[0], { valor: 600_000, antiguedad: '' }), null);
});

test('aNumero limpia separadores y símbolos', () => {
  assert.equal(aNumero('$ 600.000'), 600_000);
  assert.equal(aNumero('1.200.000'), 1_200_000);
  assert.equal(aNumero(''), 0);
});

test('formato de moneda es-AR sin decimales', () => {
  assert.equal(formatearMoneda(600_000).replace(/\s/g, ' '), '$ 600.000');
  assert.equal(formatearMoneda(11_250).replace(/\s/g, ' '), '$ 11.250');
});
