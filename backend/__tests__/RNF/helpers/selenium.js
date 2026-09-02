/**
 * Helpers de Selenium para los tests RNF de UI (RNF-005, RNF-013).
 *
 * Crea drivers de Chrome/Edge con viewport configurable, captura errores de
 * consola y detecta desbordamiento horizontal (criterio móvil >= 360px).
 */
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const edge = require('selenium-webdriver/edge');

const NAVEGADORES_SOPORTADOS = ['chrome', 'edge'];

/**
 * Crea un driver para el navegador indicado.
 * @param {'chrome'|'edge'} navegador
 * @param {Object} [opciones]
 * @param {number} [opciones.ancho]  - ancho del viewport (default 360)
 * @param {number} [opciones.alto]   - alto del viewport (default 800)
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
async function crearDriver(navegador, { ancho = 360, alto = 800 } = {}) {
  const builder = new Builder().forBrowser(navegador);

  if (navegador === 'chrome') {
    builder.setChromeOptions(
      new chrome.Options()
        .windowSize({ width: ancho, height: alto })
        .addArguments('--no-sandbox', '--disable-dev-shm-usage')
    );
  } else if (navegador === 'edge') {
    builder.setEdgeOptions(new edge.Options().windowSize({ width: ancho, height: alto }));
  } else {
    throw new Error(`Navegador no soportado: ${navegador}`);
  }

  const driver = await builder.build();
  await driver.manage().window().setRect({ width: ancho, height: alto });
  return driver;
}

/**
 * Devuelve la lista de mensajes de error (SEVERE) registrados por el navegador.
 * @returns {Promise<string[]>}
 */
async function erroresConsola(driver) {
  try {
    const logs = await driver.manage().logs().get('browser');
    return logs
      .filter((entrada) => entrada.level.name === 'SEVERE')
      .map((entrada) => entrada.message);
  } catch {
    return [];
  }
}

/**
 * Detecta si la página tiene desbordamiento horizontal (contenido más ancho
 * que el viewport). Criterio RNF-013 para resoluciones >= 360px.
 * @returns {Promise<boolean>}
 */
async function hayDesbordamientoHorizontal(driver) {
  return driver.executeScript(
    'return document.documentElement.scrollWidth > document.documentElement.clientWidth;'
  );
}

/**
 * Verifica que el driver esté funcional (conexión con el navegador viva).
 * @returns {Promise<boolean>}
 */
async function driverVivo(driver) {
  try {
    await driver.getCurrentUrl();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  NAVEGADORES_SOPORTADOS,
  crearDriver,
  erroresConsola,
  hayDesbordamientoHorizontal,
  driverVivo,
};