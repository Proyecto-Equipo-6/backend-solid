# backend-solid
el backend con una arquitectura mejor 

npx jest selenium/registroFlujo.test.js

## Base de datos (seed)

1. Ejecutar `DB/Schema.sql` (crea la base `sistema_comercial` y sus tablas).
2. Ejecutar `DB/Triggers.sql` (disparadores de negocio).
3. Ejecutar `npm run seed` para cargar los datos de prueba.

El script `DB/seed.js` genera el hash bcrypt de las contraseñas en tiempo de
ejecución (por defecto `admin123`, configurable con `SEED_PASSWORD`), de modo
que no se commitean hashes al repositorio (SonarQube S8215).