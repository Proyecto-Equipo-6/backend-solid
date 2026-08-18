const { Builder, By, until } = require('selenium-webdriver');

describe('Selenium - Login Test', () => {
  let driver;

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  test('Login exitoso con test@test.com', async () => {
    driver = await new Builder().forBrowser('chrome').build();

    try {
      await driver.get('http://localhost:5173/login');
      await driver.wait(until.elementLocated(By.id('email')), 5000);
      await driver.findElement(By.id('email')).sendKeys('test@test.com');
      await driver.findElement(By.id('password')).sendKeys('123456');
      await driver.findElement(By.css('button[type="submit"]')).click();
      await driver.wait(until.urlContains('/cliente'), 8000);

      const url = await driver.getCurrentUrl();
      expect(url).toContain('/cliente');
    } catch (err) {
      console.error('Falló login:', err.message);
      throw err;
    }
  });
});
