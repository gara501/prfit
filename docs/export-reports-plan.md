# Plan de exportación y reportes

## Objetivo

Permitir compartir rutinas y evolución de forma profesional, y entregar al cliente una copia íntegra de sus datos sin publicar archivos ni debilitar los controles de acceso.

## Alcance implementado

1. **Rutina en PDF**: documento A4 por versión, con identidad CardonaFit, vigencia, intensidad, RIR/RPE, ejercicios, series, métodos, tempo y notas. Disponible para el cliente propietario, su entrenador activo y administradores.
2. **Reporte de progreso**: constructor para trainers con rango máximo de 24 meses, ejercicios destacados, composición corporal opcional, notas y modo completo o anonimizado. El modo anonimizado omite identidad, salud y texto libre.
3. **Copia de datos del cliente**: ZIP temporal con perfil, asignaciones, rutinas, sesiones, series, feedback, mediciones, progresiones, calendario, logros, evaluaciones de salud descifradas y documentos médicos originales. Disponible al cliente y al administrador.
4. **Auditoría**: registro sin contenido sensible del solicitante, cliente, tipo, rango, anonimización, resultado y tamaño aproximado.

## Seguridad y privacidad

- Autenticación y autorización explícitas en cada Route Handler, además de las políticas RLS.
- Los trainers solo generan reportes de clientes con asignación activa; no descargan el archivo íntegro del cliente.
- Los ZIP y PDF se producen en memoria o por streaming, con `Cache-Control: private, no-store` y sin URL pública persistente.
- Los documentos médicos se leen desde el bucket privado y conservan su formato original.
- Los datos de salud se descifran únicamente durante una exportación autorizada.
- Los nombres de archivo se normalizan y los rangos, comentarios y cantidad de ejercicios tienen límites.
- Para uso comercial, el reporte anonimizado es el valor predeterminado; el reporte identificable exige confirmar autorización del cliente.

## Criterios de aceptación

- PDF de rutina legible en A4 y multipágina.
- Reporte con indicadores de adherencia, sesiones, volumen, marcas, ejercicios destacados y evolución corporal.
- ZIP válido con manifiesto, CSV/JSON y adjuntos esperados.
- Accesos denegados entre clientes, trainers no asignados y roles no autorizados.
- Auditoría creada sin almacenar el contenido exportado.
- TypeScript, pruebas, lint aplicable y build de producción verificados.

## Nota normativa

La exportación apoya los derechos de consulta y acceso previstos por la Ley 1581 de 2012 en Colombia. La aplicación no presenta el archivo como una certificación legal automática ni sustituye la revisión jurídica de los avisos y autorizaciones usados por cada trainer freelance.
