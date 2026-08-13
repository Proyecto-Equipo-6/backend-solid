const { Builder, By, until } = require('selenium-webdriver');

const BASE_URL = 'http://localhost:5173';
const CORREO = `selenium_${Date.now()}@test.com`;
const PASSWORD = '123456';

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

(async function registroLoginCatalogo() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(BASE_URL);
    await esperarCargaInicial(driver);

    await driver.wait(until.elementLocated(By.css('.barra__boton--texto')), 5000);
    await driver.findElement(By.css('.barra__boton--texto')).click();
    await driver.wait(until.urlContains('/login'), 8000);
    console.log('1. Botón "Iniciar sesión" pulsado -> /login');

    await driver.wait(until.elementLocated(By.css('.login__link')), 5000);
    await driver.findElement(By.css('.login__link')).click();
    await driver.wait(until.urlContains('/register'), 8000);
    console.log('2. "Regístrate" pulsado -> /register');

    await driver.wait(until.elementLocated(By.id('nombre_apellido')), 5000);
    await driver.findElement(By.id('nombre_apellido')).sendKeys('Usuario Selenium');
    await driver.findElement(By.id('email')).sendKeys(CORREO);
    await driver
      .findElement(By.css('#tipo_documento option[value="CC"]'))
      .click();
    await driver.findElement(By.id('numero_documento')).sendKeys('1010123456');
    await driver.findElement(By.id('telefono')).sendKeys('3001234567');
    await driver.findElement(By.id('direccion')).sendKeys('Calle 10 # 5-20, Medellín');
    await driver.findElement(By.id('password')).sendKeys(PASSWORD);

    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.elementLocated(By.css('.alerta--exito')), 8000);
    await driver.wait(until.urlContains('/login'), 8000);
    console.log(`3. Registro OK (${CORREO}) -> redirigido a /login`);

    await driver.wait(until.elementLocated(By.id('email')), 5000);
    await driver.findElement(By.id('email')).sendKeys(CORREO);
    await driver.findElement(By.id('password')).sendKeys(PASSWORD);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/cliente'), 8000);
    console.log('4. Inicio de sesión OK -> /cliente');

    const enlaceCatalogo = await driver.findElement(By.css('.barra__enlace'));
    await enlaceCatalogo.click();
    await driver.wait(until.elementLocated(By.css('#catalogo .tarjeta')), 8000);
    console.log('5. Catálogo abierto');

    const tarjetas = await driver.findElements(By.css('#catalogo .tarjeta'));
    if (tarjetas.length === 0) throw new Error('El catálogo no muestra productos');

    const botonVerProducto = await tarjetas[0].findElement(By.css('.tarjeta__boton'));
    await botonVerProducto.click();
    await driver.wait(until.urlMatches(/\/articulo\/\d+/), 8000);
    console.log(`6. Ver producto OK (${await driver.getCurrentUrl()})`);
  } catch (err) {
    console.error('Falló el flujo:', err.message);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();