# Evaluación preventiva de salud CardonaFit

## Alcance

Este módulo es una evaluación propia de CardonaFit para trainers freelance. No
es el PAR-Q+ oficial, no diagnostica y no reemplaza una consulta médica. El
PAR-Q+ se ofrece únicamente como enlace al sitio oficial y como tipo de archivo
adjunto, sin copiar ni modificar su cuestionario.

## Flujo

- El cliente responde, autoriza el tratamiento de datos sensibles y firma.
- Cada envío crea una versión inmutable con vigencia de 12 meses.
- Una respuesta crítica deja la evaluación pendiente de revisión.
- El trainer asignado registra una decisión nueva, sin modificar lo declarado.
- Solo una alerta crítica pendiente, una solicitud expresa de autorización o
  una evaluación de riesgo vencida bloquean la publicación de intensidad 4–5.
- La ausencia de evaluación se muestra como pendiente, pero no bloquea por ahora.

## Seguridad

- Las respuestas y notas se cifran en el servidor con AES-256-GCM.
- Configurar `MEDICAL_DATA_ENCRYPTION_KEY` como secreto largo y aleatorio en
  desarrollo y producción. Mientras se configura, el servidor deriva una clave
  de respaldo de `SUPABASE_SECRET_KEY` para mantener compatibilidad.
- Cambiar la clave exige un proceso de rotación/re-cifrado; no debe cambiarse sin
  migrar los registros existentes.
- RLS limita la lectura al cliente, su trainer activo y el admin.
- Los documentos se guardan en el bucket privado `medical-documents` y se abren
  mediante enlaces firmados por cinco minutos.
- El historial registra envíos, revisiones y adjuntos sin guardar respuestas en
  texto plano.

## Textos legales

Las versiones iniciales son `health-consent-co-2026-01` y
`privacy-health-co-2026-01`. Antes de producción, un abogado colombiano debe
revisar la política de tratamiento de datos, el consentimiento y los términos de
responsabilidad. Si cambian, se debe crear una versión nueva y conservar la
aceptada en cada evaluación.

Fuente oficial PAR-Q+: <https://eparmedx.com/print-versions-of-par-q/>

