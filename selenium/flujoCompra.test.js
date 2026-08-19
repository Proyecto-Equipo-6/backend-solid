const { Builder, By, until } = require('selenium-webdriver');
const { describe, test, expect, afterEach } = require('@jest/globals');

const BASE_URL = 'http://localhost:5173';

async function esperarCargaInicial(driver) {
  await driver.wait(
    async () => {
      const loaders = await driver.findElements(By.css('.loader'));
      if (loaders.length === 0) return true;
      return !(await loaders[0].isDisplayed());
    },
    8000,
    'El loader no desapareció a tiempo'
  );
}

describe('Selenium - Flujo de Compra', () => {
  let driver;

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  test('Flujo completo: login → catálogo → detalle → agregar al carrito', async () => {
    driver = await new Builder().forBrowser('chrome').build();

    try {
      // 1. Login
      await driver.get(`${BASE_URL}/login`);
      await esperarCargaInicial(driver);

      await driver.wait(until.elementLocated(By.id('email')), 5000);
      await driver.findElement(By.id('email')).sendKeys('juan@email.com');
      await driver.findElement(By.id('password')).sendKeys('admin123');
      await driver.findElement(By.css('button[type="submit"]')).click();

      await driver.wait(until.urlContains('/cliente'), 8000);
      console.log('1. Login OK');

      // 2. Catálogo
      const enlaceCatalogo = await driver.findElement(By.css('.barra__enlace'));
      await enlaceCatalogo.click();
      await driver.wait(until.elementLocated(By.css('#catalogo .tarjeta')), 8000);
      console.log('2. Catálogo abierto');

      // 3. Detalle
      const tarjetas = await driver.findElements(By.css('#catalogo .tarjeta'));
      expect(tarjetas.length).toBeGreaterThan(0);

      const botonVerProducto = await tarjetas[0].findElement(By.css('.tarjeta__boton'));
      await botonVerProducto.click();
      await driver.wait(until.urlMatches(/\/articulo\/\d+/), 8000);
      console.log('3. Detalle abierto');

      // 4. Agregar al carrito
      const botonAgregar = await driver.wait(
        until.elementLocated(By.css('.detalle button.boton')),
        8000
      );
      await driver.wait(until.elementTextContains(botonAgregar, 'Agregar al carrito'), 5000);
      await botonAgregar.click();

      const alertaExito = await driver.wait(
        until.elementLocated(By.css('.detalle .alerta--exito')),
        8000
      );
      const texto = await alertaExito.getText();
      expect(texto).toBeTruthy();
      console.log('4. Producto agregado al carrito');
    } catch (err) {
      console.error('Falló el flujo:', err.message);
      throw err;
    }
  });
});
