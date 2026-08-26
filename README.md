# backend-solid
el backend con una arquitectura mejor 

npx jest selenium/registroFlujo.test.js

## Base de datos (seed)

1. Ejecutar `DB/Schema.sql` (crea la base `sistema_comercial` y sus tablas).
2. Ejecutar `DB/Triggers.sql` (disparadores de negocio).
3. Ejecutar `DB/Seed.sql` para cargar los datos de prueba.

Los usuarios de prueba usan la contraseña `Admin123` (hash bcrypt incluido en el
seed).