# Auditoría — Argo Coach (consultor IA)

> Fecha: 2026-06-04 · Alcance: `api/tenant-chat.ts` (1006 líneas) + `src/pages/tenant/TenantChat.tsx` y dependencias.
> Método: auditoría multi-agente (23 agentes, 54 hallazgos) con verificación adversarial de cada hallazgo crítico/alto. Solo lectura.
> Estado de implementación: ver columna "Estado" y el changelog al final.

## Resumen ejecutivo

Argo Coach funciona, pero tiene tres familias de problemas:

1. **Correctitud que degrada la experiencia premium.** El Coach "se olvida" de lo último que se habló en conversaciones largas (historial cargado al revés) y a veces razona sobre el niño equivocado (matcher de nombres).
2. **Privacidad de datos de menores.** La anonimización deja escapar nombres con acento hacia Gemini/OpenAI, y el nombre real del niño se escribe a los logs de Vercel. Ambos rompen la promesa de anonimización del propio sistema.
3. **Cero observabilidad accionable.** 9 `console.*` efímeros y un dashboard pull-only. Si el Coach alucina o sirve nombres de perfil viejos en producción, hoy nadie se entera. El bug de nombre de arquetipo (Keven → "Sostén Confiable" en vez de "Sostenedor Rítmico") es sistemático para todo niño anterior al 2026-06-02 y es invisible para la única capa que debería atraparlo.

### Correcciones al informe original (feedback del equipo)

- **Costo/CPU a escala**: reclasificado a **baja prioridad, solo Enterprise**. El código limita la carga al `roster_limit` del plan (PRO 50, Academy 100), con piso 50 y techo 1000. PRO/Academy cargan 50/100 (trivial). El costo de IA NO sube con esto (al prompt solo va el resumen agregado); solo crece el egreso de DB/memoria a escala Enterprise.

---

## 1) Errores

| # | Sev | Hallazgo | Evidencia | Estado |
|---|-----|----------|-----------|--------|
| E1 | Alto | Historial carga los mensajes **más viejos**, no los recientes (`ascending: true` + `limit`) → pérdida de contexto en hilos largos | tenant-chat.ts:848 | ☐ |
| E2 | Alto | Matcher: falsos positivos con nombres-palabra (Sol, León, Rosa, Mar, Cruz, Pilar, Ángel, Luz) | tenant-chat.ts:694 | ☐ |
| E3 | Alto | Matcher: desempate de homónimos elige al jugador equivocado con nombre completo | tenant-chat.ts:696-698 | ☐ |
| E4 | Alto | Capa 5 (ground-truth) solo valida el **eje**, no el motor ni el nombre del arquetipo | tenant-chat.ts:955-983 | ☐ |
| E5 | Alto | Colisión de placeholders entre niños con mismo primer nombre → cruza identidades | tenant-chat.ts:608-618 | ☐ |
| E6 | Medio | Matcher **no es insensible a acentos** (ivan ≠ Iván) pese al comentario | tenant-chat.ts:694 | ☐ |
| E7 | Medio | Matcher de grupos usa word-boundary ASCII → falla con acentos | tenant-chat.ts:731+ | ☐ |
| E8 | Medio | Detección de situación por substring: falsos positivos, gana solo la primera | tenant-chat.ts (situations) | ☐ |
| E9 | Medio | `potentialNames` marca palabras capitalizadas/arquetipos → NOTA anti-alucinación espuria | tenant-chat.ts:683 | ☐ |
| E10 | Medio | Datos contradictorios: inyección usa label congelado + motor crudo vs base de conocimiento canónica (**bug #2**) | tenant-chat.ts:726 | ☐ |
| E11 | Medio | Si ambos proveedores caen, el mensaje del entrenador se pierde (persistencia post-IA) | tenant-chat.ts:990 | ☐ |
| E12 | Medio | `ai_sections` malformado tumba toda la request a un 500 genérico | tenant-chat.ts:712-720 | ☐ |
| E13 | Medio | Contabilidad de costo incompleta: tokens de reintento y fallback OpenAI no se registran | tenant-chat.ts:944 | ☐ |
| E14 | Medio | Soft cap de fair use es un no-op (no limita ni avisa) | tenant-chat.ts:538-542 | ☐ |
| E15 | Medio | Tier premium (Gemini Pro/Enterprise) se pierde en el reintento y en el fallback | tenant-chat.ts:944 | ☐ |
| E16 | Bajo | Sin guard de null en `child_name` → TypeError rompería el endpoint | tenant-chat.ts:678-680 | ☐ |
| E17 | Bajo | Inconsistencia de marca: UI dice "Argo Coach", disclaimer dice "Argo Engine" | TenantChat.tsx | ☐ |

## 2) Riesgos

| # | Sev | Hallazgo | Evidencia | Estado |
|---|-----|----------|-----------|--------|
| R1 | Alto | Anonimización deja escapar nombres con acento al inicio/final (`\b` no Unicode) → **PII de menores a Gemini/OpenAI** | tenant-chat.ts:629 | ☐ |
| R2 | Medio | **PII de menores en logs de Vercel** (nombre real + eje DISC) | tenant-chat.ts:983 | ☐ |
| R3 | Medio | Fallback OpenAI sin try/catch ni reintento; `OPENAI_API_KEY` no documentada → puede estar muerto | tenant-chat.ts:85-95 | ☐ |
| R4 | Medio | Fair use completamente fail-open: nunca aplica techo de costo | tenant-chat.ts:538 | ☐ |
| R5 | Medio | Filtro de palabras prohibidas no re-escanea el reintento → puede salir contaminado | tenant-chat.ts:931-945 | ☐ |
| R6 | Medio | Loop de regeneración falla en silencio | tenant-chat.ts:944 | ☐ |
| R7 | Medio | `increment_ai_queries` cuenta la query antes de saber si la IA responde (cobra fallos) | tenant-chat.ts:538 | ☐ |
| R8 | Medio | Tasa de alucinación residual ~6-10% en el caso de mayor valor (jugador con perfil viejo / PT / nombre corto) | (transversal) | ☐ |
| R9 | Bajo | `maxDuration=60` depende del plan de Vercel; en Hobby muere a 10s | tenant-chat.ts:442 | ☐ |
| R10 | Bajo | Mensaje del entrenador sin mitigación de prompt-injection (acotado al propio tenant) | tenant-chat.ts | ☐ |
| R11 | Bajo | `thinkingBudget:0` fijo también recorta a Enterprise (Gemini Pro) | tenant-chat.ts:21 | ☐ |
| R12 | Bajo | Re-fetch de ai_sections / insert sin filtro redundante por `tenant_id` (defensa en profundidad) | tenant-chat.ts:705 | ☐ |
| R13 | Bajo | Respuesta de Gemini bloqueada por safety: se reintenta inútilmente y termina en error opaco | tenant-chat.ts:32-34 | ☐ |

## 3) Oportunidades de mejora

| # | Sev | Hallazgo | Estado |
|---|-----|----------|--------|
| O1 | Medio | 7-9 round-trips serializados a Supabase antes de llamar a la IA → paralelizar en 2-3 olas | ☐ |
| O2 | Medio | Anonimización O(nombres × texto) recompila ~1000 regex por turno → un único regex alternado precompilado | ☐ |
| O3 | Medio | Few-shot/base de conocimiento de PT recortados → nivelar con ES/EN | ☐ |
| O4 | Medio | Al recargar se pierde la conversación visible → persistir/rehidratar thread | ☐ |
| O5 | Medio | Contador de trial "X/10" se incrementa aun con error de IA → usar conteo autoritativo del servidor | ☐ |
| O6 | Medio | Errores como burbuja de asistente, sin botón de reintentar | ☐ |
| O7 | Bajo (Enterprise) | Carga hasta 1000 jugadores por mensaje → cachear resumen / no enumerar 500 placeholders | ☐ |
| O8 | Bajo | Inyección truncada por carácter (150-200) corta listas → truncar por frase | ☐ |
| O9 | Bajo | Idioma del Coach depende del toggle global → persistir preferencia / anclar al thread | ☐ |
| O10 | Bajo | Prompts sugeridos decorativos con nombres ajenos → clickeables con roster real + mini-onboarding | ☐ |

## 4) Monitoreo / circuito de testing

### Estado actual (prácticamente ciego)
- 9 `console.*` efímeros, ninguno alertable.
- Tokens/costo en `chat_messages` + dashboard `admin-ai-usage` (pull-only).
- PostHog 100% client-side: cero analítica del chat.
- Existe `api/qa-monitor.ts` (cron 12:00 UTC, alerta por Resend) pero **no ejercita el Coach**. Infraestructura de canary+alerta reutilizable.

### Señales a instrumentar

| Prio | Señal | Alerta |
|------|-------|--------|
| P0 | Tasa de violaciones ground-truth (eje equivocado) | > 2% diario o ≥5 en 1h |
| P0 | Incidentes de nombre de arquetipo viejo/equivocado (bug #2) | Cualquier label viejo prohibido servido |
| P0 | Hits de palabras prohibidas + éxito de regeneración | Palabra prohibida servida pese al reintento |
| P0 | Tasa de error de Gemini y % servido por OpenAI | > 10% del día por OpenAI o 3 seguidas |
| P1 | Latencia p50/p95 y near-timeouts | p95 > 15s; respuesta > 45s |
| P1 | Costo por tenant y cruce de soft-cap | > 3x promedio de 7 días |
| P2 | Respuestas sin contexto (jugador no encontrado) | > 15% de mensajes con nombre detectado |
| P2 | Anomalías cross-tenant (concentración/429) | Un tenant > 60% del volumen; > 20 429/h |

**Almacenamiento:** tabla `ai_events` (o columnas de calidad en `chat_messages`), siempre con placeholder/hash de session, **nunca el nombre real**. Inserción best-effort (try/catch) para no romper el chat si falta la migración.

### Canary diario (atrapa el bug #2 automáticamente)
Extender `api/qa-monitor.ts` con un check del Coach sobre el tenant sintético (`is_synthetic`), 3 jugadores ficticios de control:
- **A**: S + Medio con label viejo guardado a propósito → espera "Sostenedor Rítmico", falla si dice "Sostén Confiable".
- **B**: C + Lento → "Estratega Observador" (excepción del naming).
- **C**: D + Rápido → "Impulsor Dinámico" (control sano).

El check hace un POST real, verifica eje + motor + label canónico + rehidratación + sin palabras prohibidas, y si falla dispara el email de Resend existente. Única señal que ejercita el camino completo end-to-end.

---

## Plan de ejecución (olas)

- **Ola 0 — Privacidad**: R1 (anonimización acento-segura), R2 (PII fuera de logs).
- **Ola 1 — Correctitud**: E1 (historial), E2/E3/E6 (matcher integral), E5 (placeholders), E16 (null guard).
- **Ola 2 — Naming canónico**: E10 + E4 (derivar canónico de eje+motor en inyección Y validación), E9.
- **Ola 3 — Resiliencia/costo**: R3 (fallback), E11 (persistir mensaje antes de IA), E12 (ai_sections tolerante), R5/R6 (re-escaneo), E13 (costo), R7/E14/R4 (fair use), R13 (safety block), R11 (thinking).
- **Ola 4 — Performance**: O1 (paralelizar queries), O2 (anonimización precompilada), O3 (PT), E7/E8 (grupos/situaciones).
- **Ola 5 — Producto/UX**: O4, O5, O6, O9, O10, E17.
- **Ola 6 — Monitoreo/testing**: tabla `ai_events`, instrumentación best-effort de señales, canary en qa-monitor, tests unitarios de helpers.

---

## Changelog de implementación

Todo en `develop` (sin tocar `main`). 5 commits, verificados con typecheck (`tsconfig.api.json` + `tsconfig.json`) y `npm run qa:unit` (9 tests nuevos de helpers + los preexistentes).

| Commit | Wave | Items resueltos |
|--------|------|-----------------|
| `710e2cd` | A — Naming + matcher + privacidad | E2, E3, E4 (parcial), E5, E6, E9, E10, E12, E16, R1, R12, O2 |
| `6442af2` | B — Resiliencia + costo | R3, R5, R6, R11, R13, E13, R4/E14 (observabilidad) |
| `69b8f68` | C — Historial + grupos + situaciones | E1, E7, E8 |
| `66bcb82` | E — Monitoreo + canary | tabla `ai_events`, instrumentación best-effort, qa-monitor checks + canary |
| `6ba5c04` | D — UX frontend | O4, O5, O6, O10, E17, R2 (note visible) |

### Cómo quedó cada bug que viste vos
- **Mayúsculas**: el matcher es case-insensitive y acento-insensitive. `keven`, `Keven`, `iván`/`ivan` resuelven igual.
- **Nombre de perfil viejo (Keven → "Sostén Confiable")**: la inyección ahora deriva el canónico de eje+motor (`Sostenedor Rítmico`), nunca el `archetype_label` congelado. La nota correctiva y la base de conocimiento hablan el mismo vocabulario. El canary lo verifica a diario.

### Estado de despliegue (2026-06-04)
- **Aplicado a producción.** Mergeado `develop` → `main` (commit `808306e`) y deploy de Vercel en estado Ready en argomethod.com.
- ~~Aplicar la migración `ai_events`~~ **HECHO**: aplicada a `luutdozbhinfiogugjbv`, tabla verificada (19 columnas). La telemetría ya captura en prod.
- ~~Verificar `OPENAI_API_KEY`~~ **HECHO**: confirmada en Production/Preview/Development (el fallback a OpenAI no está muerto, R3).

### Pendiente (opcional)
- **Provisionar `QA_COACH_TOKEN`** (Bearer de un usuario QA) para activar el canary HTTP en vivo del Coach en qa-monitor. Sin él, el monitoreo igual funciona por telemetría (`ai_events`).

### Deferidos (bajo impacto, fuera del scope inmediato)
- **O9** (idioma del Coach persistente por usuario/thread): requiere store de preferencias; el fallback a `es` es seguro mientras tanto.
- **O7** (cache de roster para Enterprise): solo relevante a gran escala; reclasificado a baja prioridad.
- **Personalización total de O10** con nombres reales del roster: hecho parcial (prompts clickeables + sin nombres falsos); el onboarding/nombres reales queda para una iteración de producto.
- **Regenerar/normalizar `ai_sections` viejos** (prose con nombres viejos): mitigado (priorizamos el dato canónico estructurado + detección de labels prohibidos), pero la normalización de datos históricos es un trabajo aparte.
- **R7** (contar la query antes de responder): impacto nulo hoy porque el cap es no-bloqueante; documentado.
