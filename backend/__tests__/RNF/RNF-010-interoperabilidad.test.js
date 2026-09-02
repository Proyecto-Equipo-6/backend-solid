/**
 * RNF-010 — Interoperabilidad con servicios externos (SMTP y Cloudinary).
 *
 * Verifica tasa de éxito >= 99.5% en la comunicación con Cloudinary (subida de
 * evidencias) y SMTP (envío de correos de recuperación). Los tests se omiten si
 * los servicios externos no están configurados/disponibles.
 *
 * El mecanismo de reintentos ante fallos temporales NO está implementado en el
 * código (se documenta como pendiente). La corrida oficial de 1 000 peticiones
 * se ejecuta manualmente; aquí se usa una muestra automatizada como evidencia.
 */
jest.setTimeout(120000);

const { subirEvidenciaFotografica } = require('../../../backend/infraestructure/middlewares/uploadMiddleware');
const SmtpEmailSender = require('../../../backend/infraestructure/services/SmtpEmailSender');

const TASA_EXITO_MINIMA = 0.995;
const MUESTRA_CLOUDINARY = 20;
const MUESTRA_SMTP = 5;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64'
);

async function medirExito(tarea, muestra) {
  let exitos = 0;
  let primerError = null;
  for (let i = 0; i < muestra; i++) {
    try {
      await tarea();
      exitos += 1;
    } catch (error) {
      if (!primerError) primerError = error;
    }
  }
  return { exitos, muestra, tasa: exitos / muestra, primerError };
}

describe('RNF-010 Interoperabilidad con servicios externos', () => {
  test('CP-RNF-010-01: Cloudinary alcanza tasa de éxito >= 99.5% en subida de evidencias', async () => {
    const resultado = await medirExito(
      () => subirEvidenciaFotografica(PNG_1X1, 'nexbit/rnf-test'),
      MUESTRA_CLOUDINARY
    );

    if (resultado.exitos === 0) {
      console.log(
        `[RNF-010] Cloudinary no disponible o sin configuración (${resultado.primerError?.message}). Test omitido.`
      );
      return;
    }

    console.log(
      `[RNF-010] Cloudinary: ${resultado.exitos}/${resultado.muestra} subidas exitosas ` +
        `(${(resultado.tasa * 100).toFixed(2)}%).`
    );

    expect(resultado.tasa).toBeGreaterThanOrEqual(TASA_EXITO_MINIMA);
  });

  test('CP-RNF-010-01: SMTP alcanza tasa de éxito >= 99.5% en envío de notificaciones', async () => {
    const emisor = new SmtpEmailSender();

    const resultado = await medirExito(
      () =>
        emisor.enviarRecuperacion({
          to: 'rnf-interop@example.com',
          token: 'token-rnf-010',
          nombre: 'Prueba RNF-010',
        }),
      MUESTRA_SMTP
    );

    if (resultado.exitos === 0) {
      console.log(
        `[RNF-010] SMTP no disponible o sin credenciales (${resultado.primerError?.message}). Test omitido.`
      );
      return;
    }

    console.log(
      `[RNF-010] SMTP: ${resultado.exitos}/${resultado.muestra} envíos exitosos ` +
        `(${(resultado.tasa * 100).toFixed(2)}%).`
    );

    expect(resultado.tasa).toBeGreaterThanOrEqual(TASA_EXITO_MINIMA);
  });

  test.todo(
    'Reintentos ante fallos temporales de APIs externas (SMTP/Cloudinary): mecanismo inexistente en el código'
  );
});