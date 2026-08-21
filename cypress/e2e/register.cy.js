describe('Prueba E2E de Registro - Remates el Paisa', () => {
    it('Debe registrarse correctamente y entrar a login y entrar a cliente', () => {
        cy.visit('http://localhost:5173/register');

        cy.url().should('include', '/register');

        cy.get('#nombre_apellido').type('david');
        cy.get('#tipo_documento').select('CC');
        cy.get('#numero_documento').type('5550004441');
        cy.get('#email').type('david@gmail.com');
        cy.get('#password').type('David123');
        cy.get('#telefono').type('5550004441');
        cy.get('#direccion').type('Calle Falsa 123');

        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/login');

        cy.log('Prueba de E2E ejecutada exitosamente');
    });


    it('Debe iniciar sesión correctamente y llegar al catálogo', () => {
    cy.visit('http://localhost:5173/login');

    cy.url().should('include', '/login');

    cy.get('#email').type('david@gmail.com');
    cy.get('#password').type('David123');

    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/cliente');

    cy.log('Prueba de E2E ejecutada exitosamente');
  });

});