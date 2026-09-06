# Plan de gamificación para clientes

## Objetivo

Incorporar una gamificación sobria que refuerce la adherencia al plan del
entrenador mediante una racha de cumplimiento, una mejor racha histórica y una
colección progresiva de medallas.

## Fuente de verdad

La racha se calcula desde `scheduled_workouts`; no se persisten contadores
derivados. Esto evita desincronizaciones y conserva el historial auditable.

- Un día programado cuenta como cumplido cuando todas sus sesiones elegibles
  terminan en `completed`.
- Los días sin entrenamiento se ignoran.
- Una sesión `skipped` o vencida sin completar rompe la racha.
- Una sesión `cancelled` se ignora.
- Una sesión pendiente del día actual no rompe la racha hasta terminar el día
  en la zona horaria `America/Bogota`.
- Los entrenamientos libres no afectan la racha de adherencia.
- Si no existe programación, se muestra un estado explicativo en vez de una
  racha de cero.
- Las medallas desbloqueadas dependen de la mejor racha y no se pierden cuando
  la racha actual se rompe.

La definición actual de sesión completada se conserva: todas las series deben
estar marcadas como completadas, incluidas las configuradas como opcionales.

## Niveles

| Entrenamientos programados consecutivos | Medalla | Tratamiento visual |
| ---: | --- | --- |
| 3 | Impulso | Escudo inicial con una marca |
| 7 | Constancia | Escudo reforzado con dos marcas |
| 14 | Disciplina | Figura atlética y laureles |
| 30 | Fortaleza | Acabado bronce |
| 60 | Élite | Acabado plateado |
| 100 | Leyenda | Acabado dorado de máxima jerarquía |

Antes del primer desbloqueo se utiliza el estado `En marcha`.

## Implementación

1. Crear un módulo de dominio puro que agrupe eventos por fecha y calcule la
   racha actual, la mejor racha, el nivel alcanzado y el progreso al siguiente.
2. Consultar el historial del cliente autenticado con el cliente normal de
   Supabase y las políticas RLS existentes.
3. Generar seis badges originales inspirados en el escudo de referencia, con
   fondo transparente y sin texto incrustado.
4. Crear componentes de dominio para el resumen de racha y la galería de
   medallas, usando texto HTML accesible sobre las ilustraciones.
5. Mostrar el resumen principal en `/client`, crear `/client/achievements` y
   añadir un resumen contextual en `/client/calendar`.
6. Añadir `Logros` a la navegación del cliente.
7. Cubrir estados de carga, error, sin programación, racha activa, racha rota
   y nivel máximo.
8. Probar descansos, cancelaciones, reprogramaciones, vencimientos, múltiples
   sesiones el mismo día, mejor racha y límites de fecha de Colombia.
9. Ejecutar lint, TypeScript, pruebas y build, y revisar la interfaz en
   390×844, 768×1024 y 1440×900.

## Criterios visuales

- Mantener Nunito, Geist Mono, superficies cálidas, texto slate y el naranja
  contenido de CardonaFit.
- Tratar las medallas como hitos deportivos sobrios, no como recompensas
  infantiles.
- Usar el escudo hexagonal y la silueta atlética del ejemplo como referencia
  compositiva, creando ilustraciones originales.
- Mantener nombre, requisito y estado en HTML para asegurar legibilidad,
  accesibilidad y adaptación responsive.
- Respetar tema oscuro, contraste WCAG AA y reducción de movimiento.
