# Contratos de datos de entrenamiento

Estos contratos son la referencia inicial para formularios, validaciones, funciones SQL y analítica. Cambiarlos requiere actualizar documentación y pruebas.

## Escalas

| Dato | Rango | Uso |
| --- | --- | --- |
| RIR | 0–10 | Repeticiones que la persona estima que aún podía realizar |
| RPE | 1–10 | Esfuerzo percibido del set o de la sesión |
| Energía | 1–5 | Estado subjetivo antes del entrenamiento |
| Molestia | 0–10 | Intensidad subjetiva; no representa un diagnóstico |

- RIR y RPE son opcionales.
- Un plan debe seleccionar una sola escala principal.
- Molestia 0 significa que no se reporta molestia.
- Registrar molestia nunca debe producir diagnósticos automáticos.

## Peso

- La unidad canónica de persistencia es el kilogramo (`kg`).
- Los valores deben ser finitos y mayores o iguales a cero.
- Una interfaz futura puede aceptar libras, pero debe convertirlas antes de persistir.
- Los valores convertidos se normalizan a tres decimales.

## Datos planificados y reales

Los valores planificados no deben sobrescribirse con los resultados. Un set ejecutado conservará peso, rango de repeticiones y esfuerzo objetivo, además de peso, repeticiones y esfuerzo realmente registrados.

Esta separación es obligatoria para adherencia, historial y progresión.

## Valores derivados

- El volumen se calcula sobre sets completados: `peso × repeticiones`.
- Los calentamientos se excluyen del volumen principal por defecto.
- Las estimaciones de 1RM deben indicar la fórmula.
- La adherencia es una proporción transparente, no una puntuación propietaria.
