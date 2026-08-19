const { Builder, By, until } = require('selenium-webdriver');
const { describe, test, expect, afterEach } = require('@jest/globals');

const BASE_URL = 'http://localhost:5173';
const CORREO = 'juan@email.com';
const PASSWORD = 'admin123';
const CANTIDAD_PRODUCTOS = 3;

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

describe('Selenium - Pedido Completo', () => {
  let driver;

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  test('Login → agregar 3 productos → carrito → checkout → confirmar pedido → cerrar sesión', async () => {
    driver = await new Builder().forBrowser('chrome').build();

    try {
      // 1. Login como juan
      await driver.get(`${BASE_URL}/login`);
      await esperarCargaInicial(driver);

      await driver.wait(until.elementLocated(By.id('email')), 5000);
      await driver.findElement(By.id('email')).sendKeys(CORREO);
      await driver.findElement(By.id('password')).sendKeys(PASSWORD);
      await driver.findElement(By.css('button[type="submit"]')).click();
      await driver.wait(until.urlContains('/cliente'), 8000);
      console.log('1. Login OK');

      // 2. Tomar los primeros 3 productos del catálogo
      await driver.wait(until.elementLocated(By.css('#catalogo .tarjeta')), 8000);
      const tarjetas = await driver.findElements(By.css('#catalogo .tarjeta'));
      expect(tarjetas.length).toBeGreaterThanOrEqual(CANTIDAD_PRODUCTOS);

      const titulos = [];
      for (let i = 0; i < CANTIDAD_PRODUCTOS; i++) {
        titulos.push(await tarjetas[i].findElement(By.css('.tarjeta__titulo')).getText());
      }
      console.log(`2. Productos a agregar: ${titulos.join(' | ')}`);

      // 3. Agregar cada producto al carrito
      for (let i = 0; i < CANTIDAD_PRODUCTOS; i++) {
        await driver.findElements(By.css('#catalogo .tarjeta')).then(async (cards) => {
          await cards[i].findElement(By.css('.tarjeta__boton')).click();
        });
        await driver.wait(until.elementLocated(By.css('.detalle .boton')), 8000);
        await driver.findElement(By.css('.detalle .boton')).click();
        await driver.wait(until.elementLocated(By.css('.alerta--exito')), 8000);
        console.log(`3.${i + 1} Producto agregado: ${titulos[i]}`);

        await driver.findElement(By.css('.barra__enlace')).click();
        await driver.wait(until.elementLocated(By.css('#catalogo .tarjeta')), 8000);
      }

      // 4. Ir al carrito
      await driver.wait(until.elementLocated(By.css('.barra__boton--carrito')), 5000);
      await driver.findElement(By.css('.barra__boton--carrito')).click();
      await driver.wait(until.urlContains('/carrito'), 8000);
      console.log('4. Carrito abierto');

      // 5. Verificar que los 3 productos están en el carrito
      await driver.wait(until.elementLocated(By.css('.carrito__lista .carrito__item')), 8000);
      const titulosCarrito = [];
      const titulosEnCarrito = await driver.findElements(By.css('.carrito__producto-titulo'));
      for (const el of titulosEnCarrito) {
        titulosCarrito.push(await el.getText());
      }
      for (const titulo of titulos) {
        expect(titulosCarrito).toContain(titulo);
      }
      console.log('5. Los 3 productos están en el carrito');

      // 6. Ir al checkout
      await driver.findElement(By.css('.carrito__checkout')).click();
      await driver.wait(until.urlContains('/checkout'), 8000);
      console.log('6. Checkout iniciado');

      // 7. Paso 1: Confirmar dirección de envío
      await driver.wait(until.elementLocated(By.css('.checkout__accion--completo')), 8000);
      await driver.findElement(By.css('.checkout__accion--completo')).click();

      // 8. Paso 2: Método de pago (contraentrega por defecto)
      await driver.wait(until.elementLocated(By.css('.form-pago__titulo')), 8000);
      await driver.findElement(By.css('.checkout__accion--completo')).click();

      // 9. Paso 3: Revisión y confirmar pedido
      await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(),'Confirmar pedido')]")),
        8000
      );
      await driver.findElement(By.xpath("//button[contains(text(),'Confirmar pedido')]")).click();

      // 10. Confirmación del pedido
      await driver.wait(until.elementLocated(By.css('.checkout__gracias-titulo')), 12000);
      const gracias = await driver.findElement(By.css('.checkout__gracias-titulo')).getText();
      expect(gracias).toContain('Gracias');
      console.log('10. Pedido confirmado');

      // 11. Cerrar sesión
      await driver.wait(until.elementLocated(By.css('.barra__boton--relleno')), 5000);
      await driver.findElement(By.css('.barra__boton--relleno')).click();
      await driver.wait(until.urlContains('/perfil'), 8000);
      await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(),'Cerrar sesión')]")),
        8000
      );
      await driver.findElement(By.xpath("//button[contains(text(),'Cerrar sesión')]")).click();

      await driver.wait(until.elementLocated(By.css('.barra__boton--texto')), 8000);
      const botonLogin = await driver.findElement(By.css('.barra__boton--texto'));
      expect(await botonLogin.isDisplayed()).toBe(true);
      console.log('11. Sesión cerrada');
    } catch (err) {
      console.error('Falló el flujo completo:', err.message);
      throw err;
    }
  });
});