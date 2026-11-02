// Pago simulado y número de póliza (sección 5.3).
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { simularPago, generarPoliza, ultimosDigitos, DEMORA_PAGO_MS } from '../js/pago.js';

async function pagarCon(numero) {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const promesa = simularPago(numero);
    mock.timers.tick(DEMORA_PAGO_MS);
    return await promesa;
  } finally {
    mock.timers.reset();
  }
}

test('4111 1111 1111 1111 se aprueba', async () => {
  assert.deepEqual(await pagarCon('4111 1111 1111 1111'), { ok: true });
});

test('4000 0000 0000 0002 se rechaza', async () => {
  assert.deepEqual(await pagarCon('4000 0000 0000 0002'), { ok: false, motivo: 'Tarjeta rechazada' });
});

test('cualquier otro número válido se aprueba', async () => {
  assert.deepEqual(await pagarCon('5555555555554444'), { ok: true });
});

test('la respuesta tarda 1,5 s', () => {
  assert.equal(DEMORA_PAGO_MS, 1500);
});

test('póliza con formato POL-AAAA-NNNNNN', () => {
  assert.equal(generarPoliza(123, new Date(2026, 9, 23)), 'POL-2026-000123');
  assert.equal(generarPoliza(1, new Date(2027, 0, 1)), 'POL-2027-000001');
  assert.match(generarPoliza(42), /^POL-\d{4}-\d{6}$/);
});

test('últimos 4 dígitos de la tarjeta', () => {
  assert.equal(ultimosDigitos('4000 0000 0000 0002'), '0002');
});
