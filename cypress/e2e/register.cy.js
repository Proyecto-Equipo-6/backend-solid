describe('Prueba E2E de Registro - Remates el Paisa', () => {
    it('Debe registrarse correctamente y entrar a login', () => {
        cy.visit('http://localhost:5173/register');

        cy.url().should('include', '/register');

        cy.get('#nombre_apellido').type('Juan Perez');
        cy.get('#tipo_documento').select('CC');
        cy.get('#numero_documento').type('123456789');
        cy.get('#email').type('juan.perez@example.com');
        cy.get('#password').type('PneGr4nd');
        cy.get('#telefono').type('1234567890');
        cy.get('#direccion').type('Calle Falsa 123');

        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/login');

        cy.log('Prueba de E2E ejecutada exitosamente');
    });

});