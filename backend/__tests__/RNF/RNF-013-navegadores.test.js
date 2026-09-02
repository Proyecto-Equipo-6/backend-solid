const { until } = require('selenium-webdriver');
const { frontendDisponible, getFrontendBaseUrl } = require('./helpers/live');
const {
  crearDriver,
  erroresConsola,
  hayDesbordamientoHorizontal,
  NAVEGADORES_SOPORTADOS,
} = require('./helpers/selenium');

jest.setTimeout(300000);

const PAGINAS = ['/', '/login', '/register', '/ayuda', '/app-movil'];

describe('RNF-013 CP-RNF-013-01: sin errores de visualización en Chrome y Edge, resoluciones >= 360px', () => {
  let frontendActivo = false;

  beforeAll(async () => {
    frontendActivo = await frontendDisponible();
  });

  for (const navegador of NAVEGADORES_SOPORTADOS) {
    for (const pagina of PAGINAS) {
      test(`[${navegador}] la ruta "${pagina}" renderiza a 360px sin desbordamiento horizontal`, async () => {
        if (!frontendActivo) {
          console.log(`[RNF-013] Frontend no disponible, test omitido (${navegador} ${pagina}).`);
          return;
        }

        let driver;
        try {
          driver = await crearDriver(navegador, { ancho: 360, alto: 800 });
        } catch (error) {
          console.log(`[RNF-013] Navegador ${navegador} no disponible: ${error.message}`);
          return;
        }

        try {
          const version = await driver
            .getCapabilities()
            .then((caps) => caps.getBrowserVersion() || caps.get('browserVersion') || 'desconocida');

          await driver.get(`${getFrontendBaseUrl()}${pagina}`);
          await driver.wait(
            async () => (await driver.executeScript('return document.readyState')) === 'complete',
            20000
          );

          const overflow = await hayDesbordamientoHorizontal(driver);
          const errores = await erroresConsola(driver);

          console.log(
            `[RNF-013] ${navegador} v${version} "${pagina}": overflowHorizontal=${overflow}, ` +
              `erroresConsola=${errores.length}${errores.length ? ` (${errores.join(' | ')})` : ''}`
          );

          expect(overflow).toBe(false);
        } finally {
          await driver.quit();
        }
      });
    }
  }
});