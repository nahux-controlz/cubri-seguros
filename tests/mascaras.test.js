// Bonus máscaras de input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatearTarjeta, formatearVencimiento, formatearMiles } from '../js/mascaras.js';

test('tarjeta en grupos de 4', () => {
  assert.equal(formatearTarjeta('4111'), '4111');
  assert.equal(formatearTarjeta('41111'), '4111 1');
  assert.equal(formatearTarjeta('4111111111111111'), '4111 1111 1111 1111');
  assert.equal(formatearTarjeta('41111111111111119999'), '4111 1111 1111 1111');
});

test('vencimiento con barra automática', () => {
  assert.equal(formatearVencimiento('1'), '1');
  assert.equal(formatearVencimiento('12'), '12');
  assert.equal(formatearVencimiento('122'), '12/2');
  assert.equal(formatearVencimiento('122899'), '12/28');
});

test('valor con separador de miles', () => {
  assert.equal(formatearMiles('600000'), '600.000');
  assert.equal(formatearMiles('1200000'), '1.200.000');
  assert.equal(formatearMiles('0600'), '600');
  assert.equal(formatearMiles(''), '');
});
