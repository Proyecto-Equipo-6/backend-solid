describe('Prueba E2E de Autenticación - Remates el Paisa', () => {
  it('Debe iniciar sesión correctamente y llegar al catálogo', () => {
    cy.visit('http://localhost:5173/login');

    cy.url().should('include', '/login');

    cy.get('#email').type('juan@email.com');
    cy.get('#password').type('admin123');

    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/cliente');

    cy.log('Prueba de E2E ejecutada exitosamente');
  });
});