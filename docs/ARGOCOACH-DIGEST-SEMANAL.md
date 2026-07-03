# Propuesta: digest semanal de equipo (roadmap #15)

> Estado: PROPUESTA para decisión del owner (aprobado en concepto 2026-07-02,
> pidió desarrollo en detalle antes de construir). Nada de esto está construido.

## La idea en una frase

Una vez por semana, cada tenant activo recibe un email con UN insight concreto
de su equipo y un botón que abre ArgoCoach con la conversación ya iniciada.
Convierte al consultor de "pull" (espera preguntas) a "push" (busca al
entrenador), que es lo que un producto de fair-use invisible necesita para que
el valor se note.

## Por qué funciona (hipótesis)

- El valor de ArgoCoach hoy es invisible hasta que el entrenador pregunta, y
  la mayoría no pregunta. El digest muestra una probadita del análisis sin
  pedir nada a cambio.
- El deep link `?q=` con auto-envío ya existe y funciona: el CTA no aterriza
  en una pantalla vacía sino en una respuesta completa del asistente.
- Todos los building blocks existen: cron + Resend inlined (patrón probado en
  `trial-lifecycle-cron.ts` y `puentes-reminder-cron.ts`), stats de equipo y
  grupos (`buildGroupStats`, distribuciones por eje/motor), situaciones
  curadas, historial de perfilamientos.

## Contenido: un solo insight por email, rotando el tipo

Cada semana se elige UN tipo de insight (rotación, no todos juntos):

1. **Composición**: "Tu plantel Sub 12 es 60% Sostenedor: esta semana observa
   las esperas largas entre ejercicios, ahí es donde este grupo suele
   desconectarse." CTA: "¿Cómo manejo las transiciones con este grupo?"
2. **Niño que cumple hito**: "Fede cumple 6 meses desde su perfilamiento: es
   buen momento para re-perfilar y ver su evolución." CTA: link de re-perfil +
   "¿Qué suele cambiar entre perfilamientos?"
3. **Perfil poco frecuente**: "Tienes 2 Estrategas Observadores en el equipo,
   el patrón menos común: suelen necesitar el 'para qué' antes de moverse."
   CTA: "¿Cómo aprovecho a mis Estrategas?"
4. **Química de grupo**: si el usuario creó grupos de química: "Tu grupo
   'Delanteros' combina 3 motores Dinámicos: pura chispa, poca pausa." CTA:
   "¿Cómo equilibro al grupo Delanteros?"
5. **Situación estacional** (calendario deportivo): inicio de temporada,
   torneos, vuelta de vacaciones → situación curada correspondiente.

Reglas del contenido: 100% determinístico (sin llamada a IA por email, costo
cero), generado de datos que ya tenemos, copy con marco de actividad y lenguaje
probabilístico, es/en/pt según `lang` del tenant.

## Arquitectura

- `api/team-digest-cron.ts` nuevo (Vercel cron semanal). Todo inlined (regla
  no-imports): selector de insight + stats builders + template + Resend.
- Selección de audiencia v1: tenants con >= 5 jugadores resueltos y actividad
  en los últimos 30 días (login o chat o perfilamiento nuevo). Excluye demo,
  trial vencido y quienes hicieron opt-out.
- Un email por tenant al OWNER (v1). Coaches en v2 con su scope de plantel.
- Registro en tabla `digest_log` (tenant_id, insight_type, sent_at) para no
  repetir tipo de insight dos semanas seguidas y para medir.
- CTA: `https://argomethod.com/dashboard/chat?q=<pregunta>` (auto-login lo
  resuelve la sesión persistente; si no hay sesión, pasa por login y el ?q
  sobrevive si usamos redirect param: verificar en implementación).

## Métricas de éxito

- Open rate (Resend lo da) y click rate del CTA.
- Threads creados vía ?q= en las 24h posteriores al envío (medible en
  ai_events + chat_messages).
- Retención semanal de tenants que reciben digest vs no (cohorte natural
  durante el rollout gradual).

## Riesgos y mitigaciones

- **Fatiga/spam**: 1 insight, 1 email, semanal, con opt-out visible. Si el
  open rate cae bajo 25% dos semanas seguidas para un tenant, pausar su envío.
- **Unsubscribe**: la lista de contactos aún no tiene unsubscribe operativo
  (pendiente conocido del tab Contactos). El digest NECESITA opt-out desde el
  día 1: link de baja que setea un flag en tenants.
- **Deliverability**: dominio ya envía transaccional vía Resend; el digest es
  el primer envío recurrente. Empezar con volumen chico (rollout 20% de
  tenants) y monitorear bounces.

## Fases

- **v0 (1 sesión de trabajo)**: generador del insight + preview en el admin
  (sin envío). El owner ve 10 ejemplos reales y ajustamos el copy.
- **v1 (1-2 sesiones)**: cron semanal + digest_log + opt-out + rollout 20%.
- **v2**: coaches con scope propio, insight de "cierre de loop" cuando exista
  la memoria por niño completa ("la semana pasada hablamos de Fede, ¿cómo
  siguió?").

## Decisiones abiertas para el owner

1. Día/hora de envío (propuesta: domingo 19h local del tenant, antes de la
   semana de actividad).
2. ¿Owner solamente en v1, o también coaches desde el inicio?
3. ¿El insight menciona niños por nombre en el email? (propuesta: sí, primer
   nombre, mismo nivel de PII que los emails de reporte que ya enviamos).
4. OK para construir v0 (preview sin envío) como siguiente paso.
