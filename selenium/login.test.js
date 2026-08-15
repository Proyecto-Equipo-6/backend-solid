const { Builder, By, until } = require('selenium-webdriver');

(async function testLogin() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://localhost:5173/login');

    await driver.wait(
      async () => {
        const loaders = await driver.findElements(By.css('.loader'));
        if (loaders.length === 0) return true;
        return !(await loaders[0].isDisplayed());
      },
      8000,
      'El loader no desapareció a tiempo'
    );

    await driver.wait(until.elementLocated(By.id('email')), 5000);
    await driver.findElement(By.id('email')).sendKeys('juan@email.com');
    await driver.findElement(By.id('password')).sendKeys('admin123');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/cliente'), 8000);
    console.log('Login OK');
  } catch (err) {
    console.error('Falló login:', err.message);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();