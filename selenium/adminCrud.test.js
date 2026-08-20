const { Builder, By, until } = require('selenium-webdriver');
const { describe, test, expect, afterEach } = require('@jest/globals');

const BASE_URL = 'http://localhost:5173';
const CORREO_ADMIN = 'admin@remate.com';
const PASSWORD_ADMIN = 'admin123';

// Genera datos únicos por ejecución (teléfono de 10 dígitos, sufijos únicos).
function datosUnicos() {
  const t = Date.now();
  return {
    t,
    tel: `300${String(t).slice(-7)}`,
    letras: String(t).toString(36).replace(/[0-9]/g, '') || 'abc',
  };
}

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

async function iniciarSesionAdmin(driver) {
  await driver.get(`${BASE_URL}/login`);
  await esperarCargaInicial(driver);

  await driver.wait(until.elementLocated(By.id('email')), 8000);
  await driver.findElement(By.id('email')).sendKeys(CORREO_ADMIN);
  await driver.findElement(By.id('password')).sendKeys(PASSWORD_ADMIN);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(until.urlContains('/admin'), 10000);
  await driver.wait(until.elementLocated(By.css('.barra-lat__enlace')), 8000);
}

async function irASeccion(driver, nombreSeccion) {
  const enlace = By.xpath(
    `//button[contains(@class,'barra-lat__enlace') and .//span[normalize-space()='${nombreSeccion}']]`
  );
  await driver.wait(until.elementLocated(enlace), 8000);
  await driver.findElement(enlace).click();
  await driver.wait(until.elementLocated(By.css('button.crud__boton--nuevo')), 10000);
  await driver.wait(until.elementLocated(By.css('.crud__table tbody tr')), 10000);
}

async function abrirNuevo(driver) {
  await driver.findElement(By.css('button.crud__boton--nuevo')).click();
  await driver.wait(until.elementLocated(By.css('.crud__modal form.crud__form')), 8000);
}

async function rellenarCampo(driver, etiqueta, valor) {
  const xpath = `//label[normalize-space()='${etiqueta}']/following-sibling::*[self::input or self::textarea][1]`;
  const elemento = await driver.findElement(By.xpath(xpath));
  await elemento.clear();
  await elemento.sendKeys(valor);
}

async function seleccionarOpcion(driver, etiqueta, valor) {
  const select = await driver.findElement(
    By.xpath(`//label[normalize-space()='${etiqueta}']/following-sibling::select[1]`)
  );
  await select.click();
  await select.findElement(By.xpath(`.//option[@value='${valor}']`)).click();
}

async function guardarFormulario(driver) {
  await driver.findElement(By.css('.crud__modal form.crud__form button[type="submit"]')).click();
}

async function esperarAlerta(driver, contiene) {
  await driver.wait(until.elementLocated(By.css('p.crud__alerta')), 10000);
  const texto = await driver.findElement(By.css('p.crud__alerta')).getText();
  expect(texto).toContain(contiene);
}

function filaPorTexto(driver, texto) {
  return By.xpath(`//table[contains(@class,'crud__table')]//tr[.//td[contains(normalize-space(.), '${texto}')]]`);
}

async function botonEnFila(driver, filaBy, textoBoton) {
  const fila = await driver.findElement(filaBy);
  return fila.findElement(By.xpath(`.//button[contains(text(), '${textoBoton}')]`));
}

describe('Selenium - Admin CRUD Usuarios', () => {
  let driver;

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  test('Usuarios: crear usuario y desactivarlo', async () => {
    const u = datosUnicos();
    const email = `admincrud_${u.t}@test.com`;

    driver = await new Builder().forBrowser('chrome').build();
    try {
      await iniciarSesionAdmin(driver);
      await irASeccion(driver, 'Usuarios');

      await abrirNuevo(driver);
      await seleccionarOpcion(driver, 'Rol', '2');
      await rellenarCampo(driver, 'Nombre completo', `Usuario Test ${u.t}`);
      await seleccionarOpcion(driver, 'Tipo de documento', 'CC');
      await rellenarCampo(driver, 'N° de documento', String(u.t).slice(-9));
      await rellenarCampo(driver, 'Email', email);
      await rellenarCampo(driver, 'Teléfono', u.tel);
      await rellenarCampo(driver, 'Dirección', 'Calle 1 #2-3');
      await rellenarCampo(driver, 'Contraseña', 'admin123');
      await guardarFormulario(driver);

      await esperarAlerta(driver, 'Usuario creado correctamente');
      const fila = filaPorTexto(driver, email);
      await driver.wait(until.elementLocated(fila), 10000);
      console.log('  ✓ Usuario creado');

      const botonDesactivar = await botonEnFila(driver, fila, 'Desactivar');
      await botonDesactivar.click();
      await esperarAlerta(driver, 'desactivado correctamente');

      await driver.wait(
        until.elementLocated(
          By.xpath(
            `//table[contains(@class,'crud__table')]//tr[.//td[contains(normalize-space(.), '${email}')]]//span[contains(@class,'crud__badge--inactivo')]`
          )
        ),
        10000
      );
      console.log('  ✓ Usuario desactivado');
    } catch (err) {
      console.error('Falló CRUD de Usuarios:', err.message);
      throw err;
    }
  });
});