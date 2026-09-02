# RNF-005 CP-RNF-005-01 — Cuestionario SUS (System Usability Scale)

Complemento manual de `RNF-005-usabilidad.test.js`. El test automatizado mide la
tasa de éxito en tareas comunes (>= 90 %); este cuestionario mide el puntaje SUS
percibido por usuarios reales (>= 80/100).

## Instrucciones

1. Con el sistema desplegado, entregar a cada participante las tareas comunes
   (iniciar sesión, explorar catálogo, ver detalle, agregar al carrito, ver
   carrito, ver perfil, ver mis pedidos, buscar, cerrar sesión) **sin asistencia**.
2. Después de usarlo, el participante responde las 10 afirmaciones con la escala
   Likert de 1 (Totalmente en desacuerdo) a 5 (Totalmente de acuerdo).
3. Anotar el resultado en la tabla de registro al final.

## Cuestionario

| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|---|------------|---|---|---|---|---|
| 1 | Creo que me gustaría usar este sistema con frecuencia | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Encontré el sistema innecesariamente complejo | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Pensé que el sistema era fácil de usar | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Creo que necesitaría el apoyo de un técnico para poder usar este sistema | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Encontré que las diversas funciones de este sistema estaban bien integradas | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Pensé que había demasiada inconsistencia en este sistema | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Me imagino que la mayoría de las personas aprendería a usar este sistema muy rápidamente | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Encontré el sistema muy difícil de usar | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Me sentí muy confiado al usar el sistema | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Tuve que aprender muchas cosas antes de poder empezar con este sistema | ☐ | ☐ | ☐ | ☐ | ☐ |

## Cálculo del puntaje

- Ítems impares (1, 3, 5, 7, 9): aporte = valor − 1.
- Ítems pares (2, 4, 6, 8, 10): aporte = 5 − valor.
- Suma de aportes × 2.5 = puntaje SUS (0–100).
- **Criterio RNF-005: puntaje SUS >= 80.**

## Registro de participantes

| Participante | Rol | Tareas exitosas / total | SUS | Fecha | Observaciones |
|--------------|-----|-------------------------|-----|-------|---------------|
| (ej.) Ana | Cliente | 9/9 | 92.5 | 2026-09-02 | — |

## Registro automatizado (RNF-005-usabilidad.test.js)

| Ejecución | Tasa de éxito | Fecha | Resultado |
|-----------|---------------|-------|-----------|
| | | | |