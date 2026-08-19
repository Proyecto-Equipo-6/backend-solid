const { Builder, By, until } = require('selenium-webdriver');
const { describe, test, expect, afterEach } = require('@jest/globals');

const CORREO = `selenium_${Date.now()}@test.com`;
const NUMERO_DOCUMENTO = `10${Date.now().toString().slice(-8)}`;
const PASSWORD = 'clave123';

describe('Selenium - Registro y Login', () => {
  let driver;

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  test('Registrar cuenta nueva y luego iniciar sesión', async () => {
    driver = await new Builder().forBrowser('chrome').build();

    try {
      // 1. Ir al registro
      await driver.get('http://localhost:5173/register');

      await driver.wait(
        async () => {
          const loaders = await driver.findElements(By.css('.loader'));
          if (loaders.length === 0) return true;
          return !(await loaders[0].isDisplayed());
        },
        8000,
        'El loader no desapareció a tiempo'
      );

      // 2. Llenar el formulario de registro
      await driver.wait(until.elementLocated(By.id('nombre_apellido')), 5000);
      await driver.findElement(By.id('nombre_apellido')).sendKeys('Usuario Selenium');
      await driver.findElement(By.id('email')).sendKeys(CORREO);
      await driver.findElement(By.css('#tipo_documento option[value="CC"]')).click();
      await driver.findElement(By.id('numero_documento')).sendKeys(NUMERO_DOCUMENTO);
      await driver.findElement(By.id('telefono')).sendKeys('3001234567');
      await driver.findElement(By.id('direccion')).sendKeys('Calle 10 # 5-20, Medellín');
      await driver.findElement(By.id('password')).sendKeys(PASSWORD);
      await driver.findElement(By.css('button[type="submit"]')).click();

      // 3. Confirmar éxito y redirección al login
      await driver.wait(until.elementLocated(By.css('.alerta--exito')), 8000);
      await driver.wait(until.urlContains('/login'), 8000);

      // 4. Iniciar sesión con la cuenta recién creada
      await driver.wait(until.elementLocated(By.id('email')), 5000);
      await driver.findElement(By.id('email')).sendKeys(CORREO);
      await driver.findElement(By.id('password')).sendKeys(PASSWORD);
      await driver.findElement(By.css('button[type="submit"]')).click();
      await driver.wait(until.urlContains('/cliente'), 8000);

      const url = await driver.getCurrentUrl();
      expect(url).toContain('/cliente');
    } catch (err) {
      console.error('Falló registro/login:', err.message);
      throw err;
    }
  });
});