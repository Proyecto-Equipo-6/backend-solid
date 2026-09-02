const fs = require('fs');
const path = require('path');

const DIR_DB = path.join(__dirname, '../../../DB');
const SCHEMA = fs.readFileSync(path.join(DIR_DB, 'Schema.sql'), 'utf8');
const TRIGGERS = fs.readFileSync(path.join(DIR_DB, 'Triggers.sql'), 'utf8');

const OPERACIONES_CRITICAS = [
  { operacion: 'Registro', auditada: false },
  { operacion: 'Inicio de sesión', auditada: false },
  { operacion: 'Pedidos (creación/cancelación)', auditada: false },
  { operacion: 'Comprobantes', auditada: false },
  { operacion: 'Perfil', auditada: false },
];

describe('RNF-012 CP-RNF-012-01: cobertura de registro de operaciones críticas', () => {
  test('existe la tabla de auditoría de stock (historial_stock)', () => {
    expect(SCHEMA).toMatch(/CREATE TABLE[^(]*historial_stock/i);
  });

  test('historial_stock incluye los metadatos requeridos (producto, admin, cantidades, motivo)', () => {
    const inicio = SCHEMA.search(/CREATE TABLE[^(]*historial_stock/i);
    const bloque = SCHEMA.slice(inicio, inicio + 900);

    for (const columna of ['id_producto', 'id_admin', 'cantidad_anterior', 'cantidad_nueva', 'motivo']) {
      expect(bloque).toMatch(new RegExp(columna, 'i'));
    }
  });

  test('la reintegración de stock por cancelación queda auditada (trigger)', () => {
    expect(TRIGGERS).toMatch(/trg_restaurar_stock_cancelacion/);
    expect(TRIGGERS).toMatch(/trg_auditoria_cambio_stock/);
    expect(TRIGGERS).toMatch(/historial_stock/);
  });

  test('evidencia de cobertura actual de auditoría (operaciones críticas oficiales)', () => {
    const cubiertas = OPERACIONES_CRITICAS.filter((op) => op.auditada).length;
    const cobertura = (cubiertas / OPERACIONES_CRITICAS.length) * 100;

    console.log(
      `[RNF-012] Cobertura actual de bitácora general: ${cubiertas}/${OPERACIONES_CRITICAS.length} (${cobertura}%). ` +
        `Auditadas: ${OPERACIONES_CRITICAS.filter((op) => op.auditada).map((op) => op.operacion).join(', ') || 'ninguna'}. ` +
        `Nota: la auditoría existente (historial_stock) cubre cambios de stock, no estas operaciones.`
    );

    expect(cobertura).toBeLessThan(100);
  });

  for (const op of OPERACIONES_CRITICAS.filter((o) => !o.auditada)) {
    test.todo(`Auditoría pendiente para: ${op.operacion} (bitácora general inexistente en el código)`);
  }
});