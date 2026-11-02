// Reglas y mensajes de la sección 5.2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../js/validaciones.js';

const HOY = new Date(2026, 10, 2); // 2 de noviembre de 2026

test('marca', () => {
  assert.equal(v.validarMarca(''), 'Elegí una marca');
  assert.equal(v.validarMarca('Samsung'), null);
});

test('modelo: 2 a 40 caracteres', () => {
  assert.equal(v.validarModelo('A'), 'Ingresá el modelo del equipo');
  assert.equal(v.validarModelo('A5'), null);
  assert.equal(v.validarModelo('x'.repeat(40)), null);
  assert.equal(v.validarModelo('x'.repeat(41)), 'Ingresá el modelo del equipo');
});

test('valor del equipo: entre 100.000 y 2.500.000', () => {
  const mensaje = 'El valor debe estar entre $100.000 y $2.500.000';
  assert.equal(v.validarValor(99_999), mensaje);
  assert.equal(v.validarValor(100_000), null);
  assert.equal(v.validarValor(2_500_000), null);
  assert.equal(v.validarValor(2_500_001), mensaje);
  assert.equal(v.validarValor(0), mensaje);
});

test('antigüedad: una opción elegida', () => {
  assert.equal(v.validarAntiguedad(''), 'Indicá la antigüedad');
  assert.equal(v.validarAntiguedad('1-2'), null);
});

test('nombre y apellido: mínimo 2 letras', () => {
  assert.equal(v.validarNombre('J'), 'Ingresá tu nombre');
  assert.equal(v.validarNombre('J4'), 'Ingresá tu nombre');
  assert.equal(v.validarNombre('Juan'), null);
  assert.equal(v.validarApellido(' '), 'Ingresá tu apellido');
  assert.equal(v.validarApellido("Pérez-O'Neil"), null);
});

test('DNI: 7 u 8 números', () => {
  const mensaje = 'El DNI debe tener 7 u 8 números';
  assert.equal(v.validarDni('123456'), mensaje);
  assert.equal(v.validarDni('1234567'), null);
  assert.equal(v.validarDni('30123456'), null);
  assert.equal(v.validarDni('30.123.456'), null);
  assert.equal(v.validarDni('301234567'), mensaje);
  assert.equal(v.validarDni('30a23456'), mensaje);
});

test('fecha de nacimiento: mayor de 18 años', () => {
  const mensaje = 'Tenés que ser mayor de edad';
  assert.equal(v.validarNacimiento('2008-11-02', HOY), null);       // cumple 18 hoy
  assert.equal(v.validarNacimiento('2008-11-03', HOY), mensaje);    // cumple mañana
  assert.equal(v.validarNacimiento('1990-05-10', HOY), null);
  assert.equal(v.validarNacimiento('', HOY), mensaje);
  assert.equal(v.validarNacimiento('2001-02-30', HOY), mensaje);    // fecha inexistente
});

test('email', () => {
  assert.equal(v.validarEmail('juan.perez@'), 'Ingresá un email válido');
  assert.equal(v.validarEmail('juan.perez@mail.com'), null);
});

test('celular: 10 dígitos sin 0 ni 15', () => {
  const mensaje = 'Ej.: 11 5555-1234';
  assert.equal(v.validarCelular('11 5555-1234'), null);
  assert.equal(v.validarCelular('1155551234'), null);
  assert.equal(v.validarCelular('011 5555-1234'), mensaje);
  assert.equal(v.validarCelular('15 5555-1234'), mensaje);
  assert.equal(v.validarCelular('11 15 5555-1234'), mensaje);
  assert.equal(v.validarCelular('11 5555-123'), mensaje);
});

test('términos', () => {
  assert.equal(v.validarTerminos(false), 'Tenés que aceptar los términos');
  assert.equal(v.validarTerminos(true), null);
});

test('tarjeta: 16 dígitos ignorando espacios', () => {
  assert.equal(v.validarTarjeta('4111 1111 1111 1111'), null);
  assert.equal(v.validarTarjeta('4111111111111111'), null);
  assert.equal(v.validarTarjeta('4111 1111 1111'), 'Número de tarjeta inválido');
});

test('vencimiento: MM/AA, mes 01–12 y fecha futura', () => {
  const mensaje = 'Vencimiento inválido';
  assert.equal(v.validarVencimiento('12/28', HOY), null);
  assert.equal(v.validarVencimiento('11/26', HOY), null);   // vence a fin de este mes
  assert.equal(v.validarVencimiento('10/26', HOY), mensaje);
  assert.equal(v.validarVencimiento('13/28', HOY), mensaje);
  assert.equal(v.validarVencimiento('00/28', HOY), mensaje);
  assert.equal(v.validarVencimiento('1228', HOY), mensaje);
});

test('CVV y titular', () => {
  assert.equal(v.validarCvv('12'), 'CVV inválido');
  assert.equal(v.validarCvv('123'), null);
  assert.equal(v.validarTitularTarjeta(''), 'Ingresá el nombre del titular');
  assert.equal(v.validarTitularTarjeta('JUAN PEREZ'), null);
});

test('validarPaso y primerPasoInvalido', () => {
  const solicitud = {
    equipo: { marca: 'Samsung', modelo: 'Galaxy A55', valor: 600_000, antiguedad: 'menos-1' },
    titular: { nombre: 'Juan', apellido: 'Pérez', dni: '30123456', nacimiento: '1990-05-10',
               email: 'juan.perez@', celular: '11 5555-1234', terminos: true },
    pago: { tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  };
  assert.deepEqual(v.validarPaso(1, solicitud), {});
  assert.deepEqual(Object.keys(v.validarPaso(3, solicitud)), ['email']);
  assert.equal(v.primerPasoInvalido(solicitud), 3);
  assert.equal(v.primerPasoInvalido(solicitud, 2), null);
});
