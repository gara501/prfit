# Plan de implementación — Periodización del entrenamiento

## Objetivo

Permitir que el entrenador programe el trabajo de un cliente como un macrociclo compuesto por mesociclos y microciclos semanales, conservando las rutinas actuales como la prescripción concreta de cada semana.

## Modelo funcional

- **Macrociclo:** plan de largo plazo con cliente, objetivo, fecha de inicio, fecha final calculada y estado.
- **Mesociclo:** bloque enfocado de 1 a 12 semanas, con objetivo, enfoque y niveles de volumen e intensidad.
- **Microciclo:** semana consecutiva dentro del bloque, clasificada como carga, descarga, recuperación o evaluación.
- **Rutina semanal:** una rutina versionada existente puede vincularse a un microciclo. Sus fechas y cliente deben coincidir con la semana planificada.

## Alcance técnico

1. Crear tablas normalizadas para planes, mesociclos y microciclos.
2. Añadir RLS para que el entrenador gestione sólo clientes asignados y el cliente pueda consultar su planificación.
3. Guardar toda la jerarquía mediante una operación transaccional y calcular las fechas semanalmente.
4. Implementar listado, creación, edición y línea de tiempo del plan.
5. Permitir activar un único macrociclo por cliente y archivar ciclos terminados.
6. Integrar cada semana con el editor y versionado existente de rutinas.
7. Verificar TypeScript, pruebas, lint, build y diseño responsive.

## Decisiones de producto

- El plan activo sigue siendo editable para permitir ajustes según respuesta y progreso del deportista.
- Los ciclos archivados son inmutables.
- No se elimina una semana que ya tenga una rutina asociada; primero debe conservarse o reasignarse esa prescripción.
- El horizonte máximo inicial es de 52 semanas y cada mesociclo puede contener hasta 12 semanas.
