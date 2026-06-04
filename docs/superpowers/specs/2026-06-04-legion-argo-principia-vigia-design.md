# Legión de Argo — Principia + Vigía (diseño)

> Organización AI-centered de Argo. El humano (Imperator) define la visión; la IA ejecuta en un loop continuo 24x7. Primer sector construido: Producto / Salud Técnica, con el centurión **Vigía**, dentro de un centro de mando único, la **Principia**, diseñado para todas las áreas desde el día uno.

- **Fecha:** 2026-06-04
- **Estado:** aprobado por el Imperator (luz verde). Listo para plan de implementación.
- **Alcance del build v1:** Producto / Vigía en vivo + la columna vertebral de datos + la Principia. Las otras 4 cohortes, como módulos "próximamente".
- **Capas de lenguaje:** el producto que ve el niño sigue siendo náutico (Argo, la odisea, los Argonautas). La **legión romana** es el lenguaje interno de la organización de IA. Dos capas, dos públicos, sin choque.

---

## 0. Resumen y decisiones tomadas

| Decisión | Valor |
|---|---|
| **Autonomía** | N2: detecta → avisa → diagnostica → propone fix → el humano aprueba. Diseñado para escalar a N4 vía graduación (Promotio) |
| **Alcance de "salud"** | Técnica + Entrega + Calidad IA + Dashboards y herramientas |
| **Sustrato** | Híbrido incremental (C): columna vertebral en Vercel cron + Supabase; luego agente de PR + actuadores de runtime |
| **Gobierno** | Dos relojes. Rápido (la IA, casi en tiempo real). Lento (el Imperator, el Consilium semanal) |
| **Canal de alerta** | Telegram + email de respaldo (Vigiliae). El proactivo (Exploratores) va al briefing del Consilium, nunca push |
| **Centro de mando** | La **Principia**, ruta `/admin/principia` (evita el choque con la feature de consumo Puentes / `el_puente`) |
| **Multi-área** | Las 5 cohortes existen desde el día uno; solo Producto poblado. El resto, mosaicos "próximamente" |

---

## 1. Doctrina: la organización como legión

La empresa se modela como una **legión**, no como un organigrama de personas. Cada sector es un **bucle de control** (sensores → controlador → actuadores → rumbo → escalación) operado por un agente con rango, función y reglas de empeñamiento.

### El escalafón (cadena de mando)

| Rango | Quién (mapeo al sistema) | Función | Autonomía |
|---|---|---|---|
| **Imperator** | El humano (vos). Gateado por el allowlist `admin_users` | Define el *mandatum* (la misión y el rumbo), aprueba lo irreversible, preside el Consilium | Total. Único que toca el rumbo |
| **Legatus** | La capa orquestadora (el cron de detección + la policy + el compilador del Consilium) | Corre los dos relojes, enruta el trabajo a las cohortes, mantiene la policy, arma el acta semanal | Ejecuta y coordina. No define rumbo |
| **Centurio** | El agente de cada cohorte. **Vigía** es el centurión de Producto | Dueño de su bucle, sus *Commentarii* y su tropa. Detecta, diagnostica, propone | Rango ganado, por clase de incidente (N1→N3) |
| **Legionarii** | Sub-agentes efímeros (los workers que investigan, patrullan o abren un PR) | Una tarea concreta, se disuelven al terminar | Mandato acotado por el centurión |

### Regla de oro: el rango se gana

El rango de un centurión sobre una **clase de incidente** es su nivel de autonomía, y se materializa en `incident_classes.autonomy_mode`:

- **`propose`** (recluta, N2): solo detecta y propone. El humano aprueba cada acción.
- **`auto`** (veterano, N3): ya demostró criterio en esa clase. Actúa solo dentro de guardrails, manteniendo el verify-loop.

El ascenso (**Promotio**) lo firma el Imperator en el Consilium, sobre la hoja de servicios del centurión (sus *Acta*). El escalafón de la legión y la escalera de autonomía N2→N4 son la misma cosa. **Nada asciende solo.**

---

## 2. Las 5 Cohortes (las áreas)

Cada área es una cohorte con su centurión. Los nombres son secundarios (provisionales). Lo que importa es la función y de dónde sale cada dato. En la base de datos, la cohorte es la columna `area` (`'producto'|'marketing'|'ventas'|'personas'|'finanzas'`).

| Cohorte · Centurión | Registros clave (existe hoy → pendiente) | Señales de salud (el rumbo) | Acciones IA (N2) | Preparación |
|---|---|---|---|---|
| **Producto / Salud · Vigía** `EN VIVO` | `client_errors`, `audio_events`, `sessions` (eje/ai_sections/email_sent_at), qa-monitor synthetic ✅ → historial de crons, ledger de dependencias, webhook de Resend ❌ | errores/día < 5; audio recoveries < 10/día; entrega de reporte > 99%; 6/6 crons OK; sin `_pending` > 2 h; latencia Gemini < 5 s | reintentar generación, reenviar email, disparar report-recovery *(ejecuta)* · proponer PR / rollback / feature-flag *(propone)* | **~80%** |
| **Marketing · Praeco** `próximamente` | `blog_posts`, `blog_topics`, `blog_posts.ai_cost_usd` ✅ → GA4/GSC/Ads (Windsor MCP), leads Apollo, eventos de email Resend ❌ | cadencia 2 posts/semana; 6 pilares cubiertos; sin pilar sin post en 30 días *(entity)*; ROAS > 3.0; backlog 5-10 | generar tema de pilar con gap, refrescar contenido por caída de keyword, pausar placement de bajo ROAS | **~50%** |
| **Ventas · Mercator** `próximamente` | `tenants`, `one_purchases`, `puentes_purchases`, admin-revenue ✅ → log de churn, pipeline Apollo, CAC, contratos enterprise ❌ | signups > 5/mes; trial→paid > 15%; MRR MoM > 5%; churn < 5%; ACV pipeline > $5k | outreach por churn, avisar lead de alto valor *(entity)*, prompt de upgrade en trial por expirar | **~60%** |
| **Personas · Tribunus** `próximamente` | `tenant_members`, `admin_audit_log` ✅ → telemetría de login/engagement, estado de onboarding, soporte ❌ | tenants activos > 60%; usuarios/tenant ≥ 2; onboarding completo > 80%; adopción chat > 70% | re-enganche a tenant dormido, escalar dropout de onboarding, bienvenida a coach nuevo | **~40%** |
| **Finanzas · Quaestor** `próximamente` | admin-revenue (MRR), admin-ai-usage (COGS), `credit_transactions` ✅ → ledgers de fee/refund/tax, opex, márgenes consolidados ❌ | MRR MoM ≥ 3%; COGS IA < 15% de revenue; éxito de pago > 99%; refunds < 2%; margen bruto > 70%; runway > 6 meses | optimizar prompts por pico de COGS, alertar anomalía de facturación, escalar runway bajo | **~70%** |

**Producto arranca con datos reales** (sale de la telemetría existente). Las otras cuatro renderizan desde el día uno como mosaicos grises `ComingOnline` ("próximamente · módulo en construcción") en la misma grilla y el mismo riel, nunca ocultas, nunca un 404. El día que su `AreaModule` cambia `status` a `'live'` y apunta a sus sensores, heredan Bandeja, Incidentes, Registros y Consilium **sin tocar el shell**.

---

## 3. Los Commentarii (la memoria de cada centurión)

Cada centurión lleva su diario de campaña (como los *Commentarii* de César), que se actualiza solo. Tres secciones:

| Sección | Qué guarda | Respaldo de datos |
|---|---|---|
| **Mandatum** | De qué se ocupa: responsabilidades, rumbo (setpoint), guardrails | Config en el registro `AreaModule` (`AreaSetpoint` + rol). Editable en el Consilium |
| **Acta** | De qué se ocupó: cada acción y decisión | **Vista/filtro** sobre `system_activity_log WHERE actor = <agente>`. Sin tabla nueva |
| **Ordines** | De qué se va a ocupar: tareas abiertas, qué vigilar, patrullas programadas | Tabla nueva `agent_ordines` (la única pieza de datos genuinamente nueva del legajo) |

El centurión **carga sus Commentarii antes de actuar**: por eso mejora con el tiempo. La memoria es el sustrato del aprendizaje hacia N4. Las *Acta* son, además, la hoja de servicios que justifica la Promotio en el Consilium.

```sql
-- La única tabla nueva del legajo (Mandatum vive en config, Acta es vista sobre el log)
CREATE TABLE agent_ordines (         -- el backlog/plan auto-actualizable del centurión
  id           BIGSERIAL PRIMARY KEY,
  area         TEXT NOT NULL,        -- la cohorte: 'producto'|...
  agent        TEXT NOT NULL,        -- 'vigia'
  kind         TEXT NOT NULL,        -- 'watch' (vigilar) | 'patrol' (patrulla programada) | 'task'
  description  TEXT NOT NULL,
  status       TEXT DEFAULT 'open',  -- 'open'|'scheduled'|'done'|'dropped'
  scheduled_for TIMESTAMPTZ,         -- para patrullas y tareas con fecha
  origin       TEXT,                 -- 'self' (el agente se lo agendó) | 'consilium' | 'imperator'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  closed_at    TIMESTAMPTZ,
  metadata     JSONB
);
CREATE INDEX idx_ordines_agent ON agent_ordines(area, agent, status);
```

**El legajo legible.** La página de detalle de cada cohorte (`/admin/principia/area/:areaId`) renderiza los Commentarii del centurión: su Mandatum (rumbo + guardrails), sus Acta recientes (las últimas filas del log que escribió), y sus Ordines (lo que tiene pendiente). Es el "abrir el legajo del empleado" que pediste.

---

## 4. Las dos guardias (el circuito reactivo + el proactivo)

Misma cohorte, dos turnos de guardia. Esta separación es doctrina, no detalle.

| Guardia | Qué hace | Canal | Cadencia |
|---|---|---|---|
| **Vigiliae** (reactivo) | Reacciona a lo que cruza el umbral. El cron de detección itera los `signalSources`, evalúa breaches, abre incidentes | **Telegram + email** al instante (ALTO/MEDIO) | Casi en tiempo real (cadencia del cron) |
| **Exploratores** (proactivo) | Sale a buscar lo que todavía no disparó ninguna alarma: degradaciones lentas, anomalías, oportunidades. Produce *observaciones* | **Briefing del Consilium**, nunca push | Patrullas programadas (más lentas) |

**La regla de canales evita que el valor se vuelva ruido:** lo urgente te busca ya (Vigiliae → push); lo importante-no-urgente te espera ordenado en la reunión (Exploratores → Consilium).

**Modelo de las observaciones.** Una observación es un incidente con `kind = 'observation'`, `severity = 'info'` y canal Consilium: nunca dispara push, nunca exige aprobación inmediata. Vive en la misma tabla `incidents` (discriminada por `kind`), así reusa todo el ciclo de vida.

**Gradual, como pediste.** Los Exploratores arrancan en solo-observar (los lees en el Consilium). Una clase de observación que demuestra valor **gradúa** (Promotio) a poder abrir incidentes accionables por su cuenta. El patrullaje proactivo es el puente concreto a N4: primero detecta lo que no ves, después propone la mejora, al final la ejecuta dentro de guardrails.

**v1 (acotado):** los Exploratores quedan **diseñados** (modelo de datos + separación de canal + una patrulla de tendencia simple, p.ej. drift al alza en errores o latencia de entrega, que alimenta el resumen read-only del Consilium). El motor de patrullas múltiples por área es fase posterior.

---

## 5. La Principia (el centro de mando)

La Principia muta el `/admin` actual: una entrada nueva fija arriba de todo en `NAV_ITEMS` (`src/pages/Dashboard.tsx`), ruta `/admin/principia`. Las tabs operativas existentes (Sesiones, Tenants, Revenue, Health...) quedan **intactas** debajo como herramientas crudas; la Principia es la capa enrollada, triage-first, por encima.

**Jerarquía de enrollado** (cada nivel resume al de abajo para que la cima quede calma): Organización → Cohorte → Bucle → Señal.

**Riel izquierdo, Zona A (transversal):**
- **Resumen** `/admin/principia` (home, triage-first)
- **Bandeja** `/admin/principia/bandeja` (la bandeja de aprobación, el corazón humano-en-el-loop; badge = decisiones pendientes)
- **Incidentes** `/admin/principia/incidentes`
- **Registros** `/admin/principia/registros` (el log unificado, "los registros de todo")
- **Consilium** `/admin/principia/consilium` (el reloj lento)

**Riel izquierdo, Zona B (cohortes, desde el registro `AreaModule`):**
- ● Producto / Salud · **Vigía** `EN VIVO` → `/admin/principia/area/producto`
- ○ Marketing · Praeco · ○ Ventas · Mercator · ○ Personas · Tribunus · ○ Finanzas · Quaestor `próximamente`

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Argo·Method  ·  Principia                              Vie 04 jun · 14:32   ◐ Vigía activo │
├────────────────────┬─────────────────────────────────────────────────────────────────────┤
│ TRANSVERSAL        │  ●  Todo operativo salvo Producto: 1 incidente abierto, 2 esperan tu  │ ← veredicto de la org
│  ▸ Resumen      ◉  │     aprobación.                                                        │
│  ▸ Bandeja     (2) │ ──────────────────────────────────────────────────────────────────── │
│  ▸ Incidentes  (1) │  NECESITA TU ATENCIÓN AHORA                              2 decisiones  │ ← la Bandeja
│  ▸ Registros       │ ┌───────────────────────────────────────────────────────────────────┐ │
│  ▸ Consilium       │ │ ● ALTO · Producto · Vigía            detectado hace 6 min          │ │
│                    │ │ Pico de errores de cliente: 14 en 1 h (umbral 5).                  │ │
│ COHORTES           │ │ Causa probable: null en EffectPlayer tras revisión de audio.       │ │
│  ● Producto · Vigía│ │ Propone:  [ Abrir PR #482 ] (propuesta)  confianza 82%             │ │
│      EN VIVO       │ │ [ Aprobar ]  [ Rechazar ]  [ Posponer ]      ver razonamiento ›     │ │
│  ○ Marketing·Praeco│ ├───────────────────────────────────────────────────────────────────┤ │
│      próximamente  │ │ ● MEDIO · Producto · Vigía           detectado hace 22 min         │ │
│  ○ Ventas·Mercator │ │ 3 sesiones sin reporte > 4 h.                                       │ │
│      próximamente  │ │ Propone:  [ Reintentar generación ]  confianza 91%  alcance: 3 ses. │ │
│  ○ Personas·Tribunus│ │ [ Aprobar ]  [ Rechazar ]  [ Posponer ]                            │ │
│      próximamente  │ └───────────────────────────────────────────────────────────────────┘ │
│  ○ Finanzas·Quaestor ──────────────────────────────────────────────────────────────────── │
│      próximamente  │  ESTADO POR COHORTE          [Producto: degradado · resto: gris]      │ ← mosaicos
│                    │  Producto ● degradado   Marketing ○   Ventas ○   Personas ○  Finanzas ○│
│ ────────────────── │ ──────────────────────────────────────────────────────────────────── │
│  v1.7              │  ACTIVIDAD RECIENTE                            Ver todos los registros ›│ ← "registros de todo"
│                    │  14:32  producto  vigía     señal     error_spike  err/h=14   ● alto   │
│                    │  14:31  producto  cron       acción    report-recovery  ok    ● sano   │
│                    │  14:18  ventas    webhook    entrega   payment_received paid  ● sano   │
│                    │  14:05  sistema   imperator  auditoría grant-access  tenant#91 ● sano  │
│                    │  13:50  producto  vigía     incidente diagnosing   audio_surge ● medio │
└────────────────────┴─────────────────────────────────────────────────────────────────────┘

Estado vacío de la banda de atención (calma por defecto: sano = silencioso, no vacío):
┌───────────────────────────────────────────────────────────────────┐
│  Nada requiere tu atención. Vigía está observando.                │
│  Última revisión hace 30 s · 6/6 crons sanos · 0 incidentes.      │
└───────────────────────────────────────────────────────────────────┘
```

### El contrato de área (multi-área desde el día uno)

Cada cohorte enchufa implementando **un** contrato TypeScript. El shell, las vistas transversales y la plantilla de detalle se escriben una vez; agregar una cohorte es registrar un módulo, no reescribir pantallas. Vive en `src/lib/principia/areas.ts`.

```ts
interface AreaModule {
  id: 'producto' | 'marketing' | 'ventas' | 'personas' | 'finanzas';
  label: string;                 // user-facing es (tú, no voseo, sin guiones), p.ej. "Producto / Salud"
  agentName: string;             // el centurión, p.ej. "Vigía"
  icon: LucideIcon;
  status: 'live' | 'coming_soon';
  setpoint: AreaSetpoint;        // el rumbo definido por el humano + escalación (editable en el Consilium)
  loops: ControlLoop[];          // los bucles de control (Técnica, Entrega, Calidad IA, Dashboards...)
  // providers de datos (null/stub para coming_soon, así el shell igual renderiza calmo):
  statusProvider:  () => Promise<AreaStatus>;
  signalSources:   SignalSource[];
  incidentSource:  (f) => Promise<Incident[]>;
  inboxSource:     (f) => Promise<ApprovalItem[]>;
  registroFilter:  ActivityLogFilter;
}

interface SignalSource {
  id: string; kind: 'table'|'cron'|'webhook'|'external_mcp'; ref: string;
  shape: 'threshold' | 'entity';   // threshold = valor vs setpoint; entity = apunta a una entidad concreta
  existsToday: boolean;            // gatea si el bucle muestra datos reales o un stub
}

interface RuntimeActionCapability {  // el inbox solo muestra botones de lo realmente ejecutable
  type: 'retry' | 'resend_email' | 'trigger_report_recovery' | 'open_pr' | 'rollback' | 'feature_flag';
  executable: boolean;             // hoy: retry/resend/trigger = true; open_pr/rollback/feature_flag = false
}
```

**Una cohorte nueva provee cuatro cosas y hereda todo gratis:** (1) SEÑALES (sus `SignalSource`), (2) REGISTROS (su faceta sobre `system_activity_log`, `area='marketing'`), (3) ACCIONES (sus `RuntimeActionCapability` + un `inboxSource`), (4) RUMBO (su `AreaSetpoint`). Una cohorte `coming_soon` provee solo id/label/agentName/icon/status y stubs: renderiza el tile calmo y nunca da 404. **Una sola página genérica de detalle**, no cuatro a medida.

> **Fix de escalabilidad (umbral vs entidad).** No toda señal futura es `measured_value` vs `setpoint`. Producto es numérico (errores/día). Marketing/Ventas tienen señales **por-entidad** ("cayó el ranking de ESTA keyword", "lead de alto valor", "este tenant churneó"). El modelo distingue `SignalSource.shape` (`threshold` | `entity`); las señales `entity` se guardan con `entity_type` + `entity_ref` (ver sección 7). Se diseña ahora, no se implementa para ninguna cohorte no-Producto en v1. Es lo que evita que la promesa "misma forma, solo filas nuevas" se rompa en silencio.

---

## 6. Los dos relojes y el Consilium

**Reloj rápido (la IA, casi en tiempo real):** el ciclo de vida del incidente (sección 7.2). Vive en Resumen + Bandeja + Incidentes + Registros.

**Reloj lento (el Imperator, semanal): el Consilium.**
- **v1 (se construye):** una **vista de resumen read-only**. Por cohorte: incidentes de la semana, MTTR, tasa de aprobación, top clases. Cierra a `weekly_reviews.summary`. **Sin** editor de rumbo, **sin** panel de Promotio. El primer mes, el Consilium es una reunión con un cuaderno; primero enviamos el reloj rápido.
- **Fase posterior (cuando haya una semana real de incidentes que graduar):** se suman los contadores de historial a `incident_classes`, el `SetpointEditor` (re-fijar rumbos) y el `GraduationPanel` (subir una clase de `propose` → `auto`).

**Cómo la Promotio sube N2→N4 (diseño de fase posterior):** una clase acumula hoja de servicios (propuestas, aprobaciones, tasa de éxito). En el Consilium, el Imperator gradúa una clase probada de `propose` a `auto`. A partir de ahí, esa clase se auto-ejecuta sin esperar aprobación, manteniendo el verify-loop. Cualquier cohorte usa el mismo mecanismo: por eso generaliza.

**Frenos de la Promotio (se diseñan con la fase):**
- **Piso mínimo de hoja de servicios** para habilitar graduar (n aprobaciones + tasa de éxito mínima). Sin eso, el botón está deshabilitado.
- **Democión automática:** si una clase `auto` tiene una auto-ejecución fallida (el verify-loop reporta que no volvió bajo el rumbo), la clase **vuelve sola** a `propose` y avisa. Subir N2→N4 sin democión-en-fallo es la mitad peligrosa de la autonomía.
- **Kill-switch global:** un control que revierte **todas** las clases a `propose` al instante.

---

## 7. Modelo de datos generalizado (area-agnostic)

Las tablas de Vigía/Producto se diseñan area-agnostic desde la fila uno cargando una columna `area`, así las otras cuatro cohortes reusan la misma columna vertebral. **La columna `area` se mantiene en todas las tablas** (seguro barato: design-for-5, build-for-1). Lo que se difiere por YAGNI no es `area`; es el plumbing de UI/providers por cohorte y el motor de Promotio/Consilium editable.

> **Fuente única de verdad.** `incidents` es la **única fuente del ESTADO** del incidente (mutable). `system_activity_log` es el **timeline inmutable de transiciones** (una fila append por transición). **La Bandeja consulta `incidents WHERE status='awaiting_approval'`**, no una proyección del log. **Registros muestra el log.** El log nunca posee estado mutable: así no hay drift.

### 7.1 `system_activity_log` — "los registros de todo"

Una tabla real nueva (no una vista) que **suplementa, nunca reemplaza**, las tablas de dominio existentes (`admin_audit_log`, `audio_events`, `client_errors`, `webhook_events`, `sessions`, `one_purchases`, `puentes_*`).

```sql
CREATE TABLE system_activity_log (
  id           BIGSERIAL PRIMARY KEY,
  event_id     UUID DEFAULT gen_random_uuid(),
  area         TEXT NOT NULL,    -- 'producto'|'marketing'|'ventas'|'personas'|'finanzas'|'sistema'
  source_type  TEXT NOT NULL,    -- 'sensor'|'controller'|'actuator'|'cron'|'human'|'webhook'
  event_type   TEXT NOT NULL,    -- 'user_action'|'ai_decision'|'health_check'|'delivery'|'audit'
  actor        TEXT,             -- agente 'vigia' | admin_email | 'system'
  action       TEXT NOT NULL,
  resource_type TEXT, resource_id TEXT,
  severity     TEXT,             -- 'alto'|'medio'|'sano'|'offline' (1:1 con red/amber/green/grey)
  status       TEXT,             -- 'initiated'|'success'|'failed'|'pending_review'|'auto_executed'
  reason       JSONB,            -- por qué: {metric, threshold, current_value}
  result       JSONB,            -- qué pasó: {pr_url, email_sent, ...}
  old_state    JSONB, new_state JSONB,
  related_logs TEXT[],           -- soft FKs: 'admin_audit_log.id','sessions.id','webhook_events.event_id'
  incident_id  BIGINT NULL,      -- FK a incidents cuando la fila es parte de un timeline
  occurred_at  TIMESTAMPTZ, recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata     JSONB
);
CREATE INDEX idx_sal_area_time ON system_activity_log(area, recorded_at DESC);
CREATE INDEX idx_sal_resource  ON system_activity_log(resource_type, resource_id);
CREATE INDEX idx_sal_status    ON system_activity_log(status, recorded_at DESC);
CREATE INDEX idx_sal_incident  ON system_activity_log(incident_id);
CREATE INDEX idx_sal_severity  ON system_activity_log(severity);
-- Append-only, particionada por mes, sin triggers. Cada cron/handler escribe una fila antes de retornar.
```

**Ingesta (sin romper APIs existentes):** los handlers de `admin_audit_log` también emiten `area='sistema'`; `one-webhook` emite `area='ventas', action='payment_received'`; `send-email`/`report-recovery-cron` emiten `area='producto', action='report_email_sent'|'report_email_failed'`; el fin de sesión emite `action='session_completed'`; qa-monitor + Vigía emiten `event_type='health_check', action='incident_detected'|'incident_resolved'`.

**Doble escritura de gobernanza.** Toda acción humana Aprobar/Rechazar/Posponer y toda `auto_executed` escribe a **ambas** tablas: `admin_audit_log` (la traza de gobernanza inmutable ya establecida, sigue siendo autoritativa) **y** `system_activity_log` (el timeline navegable), cruzadas por `related_logs`.

**Retención.** `system_activity_log` queda caliente ~90 días; lo más viejo se mueve a partición fría/archivo. `incidents` y `weekly_reviews` son el registro durable. Particionada por mes desde el día uno.

**UI.** `ActivityLogTable` con **paginación en servidor (ventanas de 100 filas)**, reusando la forma de tabla de eventos de AdminHealth (extraída en Fase 0). Color solo en el punto de severidad vía `SEVERITY_COLORS`; filas neutras (color racionado). Barra de facetas `LogFilterBar` compartida por Registros/Bandeja/Incidentes. Señales idénticas repetidas colapsan en una fila con conteo + sparkline (combate fatiga de alertas). Snooze/mute **se escribe como fila** (`source_type='human', action='snooze'`): silenciar nunca es invisible.

> No se usa librería de virtualización (no existe en el repo). Si hace falta scroll infinito, se agrega `react-window` como dependencia explícita, no como "reuse".

### 7.2 `incidents` — una fila por incidente deduplicado (cualquier cohorte)

```sql
CREATE TABLE incidents (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,                 -- 'producto' hoy; otras luego
  loop_id TEXT,                       -- 'tecnica'|'entrega'|'calidad_ia'|'dashboards'
  class_id BIGINT REFERENCES incident_classes(id),
  agent TEXT,                         -- 'vigia'
  kind TEXT DEFAULT 'incident',       -- 'incident' (Vigiliae) | 'observation' (Exploratores)
  title TEXT, summary TEXT,
  severity TEXT,                      -- 'alto'|'medio'|'sano'|'info'(observación)
  status TEXT,                        -- open|diagnosing|proposed|awaiting_approval|acting|verifying|resolved|snoozed
  signal_count INTEGER DEFAULT 1,     -- contador de dedupe
  entity_type TEXT, entity_ref TEXT,  -- señales por-entidad (qué keyword / lead / tenant)
  first_seen_at TIMESTAMPTZ, last_seen_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ,
  diagnosis JSONB,                    -- análisis de causa de la IA
  proposed_action JSONB,             -- {type, executable, pr_url, confidence, blast_radius}
  action_key TEXT,                    -- idempotencia: clave determinista del actuador
  verified_at TIMESTAMPTZ,            -- cuándo se confirmó que el arreglo funcionó
  verification_result JSONB,          -- {signal_back_under_setpoint: true, recheck_value: ...}
  resolution JSONB, metadata JSONB
);
CREATE INDEX idx_inc_area_status ON incidents(area, status, last_seen_at DESC);
CREATE INDEX idx_inc_class ON incidents(class_id);
```

**Ciclo de vida con verificación:** `open → diagnosing → proposed → awaiting_approval → acting → verifying → resolved`. Tras correr un actuador se escribe un `health_check` de verificación; el incidente pasa a `resolved` **solo** cuando un follow-up confirma que la señal incumplida volvió bajo el rumbo (p.ej. `ai_sections` ya no es null para esas sesiones). Un arreglo aprobado que falla en silencio **no** puede falso-resolver.

**Idempotencia:** cada `ApprovalItem` tiene un `action_key` determinista. La ejecución se registra con guard único `(incident_id, action_key)`: un doble-clic o un retry no disparan el actuador dos veces. El botón se deshabilita optimista al clic y se reconcilia en el servidor (la lección de `webhook_events` aplicada al inbox).

### 7.3 `incident_classes` — la unidad de Promotio (lean en v1)

```sql
CREATE TABLE incident_classes (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL, loop_id TEXT,
  key TEXT,                            -- 'client_error_spike'|'session_delivery_stall'|...
  label TEXT,
  autonomy_mode TEXT DEFAULT 'propose' -- 'propose'(N2) | 'auto'(N3). First-class y visible.
  -- v1 PARA AQUÍ. Lo de abajo es FASE de Promotio, NO se crea ahora:
  -- proposals_count, approvals_count, rejections_count, auto_executions_count, success_count,
  -- default_severity, default_action, graduated_at, graduated_by, last_review_id
);
```

v1 lleva solo `id, area, loop_id, key, label, autonomy_mode` (default `'propose'`). Los contadores de hoja de servicios y los campos `graduated_*` se añaden en la fase que de verdad tenga una semana de incidentes que graduar.

### 7.4 `health_checks` (generaliza a area_signals) — una lectura de sensor vs rumbo

```sql
CREATE TABLE health_checks (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL, loop_id TEXT,
  signal_key TEXT,                     -- 'client_errors_per_day'|'ai_delivery_rate'|'blog_cadence'|...
  source_type TEXT,                    -- 'table'|'cron'|'webhook'|'external_mcp'
  source_ref TEXT,                     -- 'client_errors'|'qa-monitor'|'windsor:googleanalytics4'
  shape TEXT,                          -- 'threshold'|'entity'
  measured_value NUMERIC, setpoint_value NUMERIC, comparator TEXT, unit TEXT, -- threshold
  entity_type TEXT, entity_ref TEXT,   -- entity (qué keyword / lead / tenant)
  breached BOOLEAN,
  severity TEXT, checked_at TIMESTAMPTZ,
  last_successful_check_at TIMESTAMPTZ, -- respalda el relevo de guardia (dead-man's-switch)
  raw JSONB
);
CREATE INDEX idx_hc_area_signal ON health_checks(area, signal_key, checked_at DESC);
```

### 7.5 `weekly_reviews` — el snapshot del Consilium (read-only en v1)

```sql
CREATE TABLE weekly_reviews (
  id BIGSERIAL PRIMARY KEY,
  area TEXT,                           -- NULL = Consilium org-wide
  period_start DATE, period_end DATE,
  summary JSONB,                       -- {incidents, mttr, approval_rate, top_classes[]}
  setpoint_changes JSONB,              -- diffs que el Imperator aplicó (FASE posterior, vacío en v1)
  graduations JSONB,                   -- [{class_id, from:'propose', to:'auto'}] (FASE posterior, vacío en v1)
  reviewed_by TEXT, closed_at TIMESTAMPTZ
);
```

**Resumen del modelo:** eventos (`system_activity_log`) + señales (`health_checks`) + incidentes/observaciones (`incidents`) + clases-con-autonomía (`incident_classes`) + snapshots de reloj lento (`weekly_reviews`) + backlog de centuriones (`agent_ordines`), **todas con `area`**. Producto es `area='producto'`; Marketing es `area='marketing'` sobre las mismas tablas. Sin schema por-cohorte, sin reescritura: una cohorte nueva son filas nuevas.

---

## 8. El loop de Producto / Vigía hoy

**EN VIVO (~80%), poblado desde la infra existente.**

- **Tarjeta y veredicto del Resumen:** enrolla desde `api/admin-health` (30 días de `client_errors` + `audio_events`) más los synthetic de qa-monitor. Sparkline = errores/día reusando el `by_day` de AdminHealth.
- **Bandeja** sembrada con casos N2 reales y detectables que ya existen como señales:
  - (a) Pico de errores de cliente (`client_errors` > 5/día) → propone PR o feature-flag *(propuesta, ejecución manual)* o reintentar si es transitorio *(ejecutable)*.
  - (b) Surge de recuperación de audio (`audio_events` > 10/día) → propone investigar codec *(propuesta)*.
  - (c) Sesiones con `ai_sections=null` > 4 h (`sessions` + qa-monitor) → propone **Reintentar generación** o disparar report-recovery *(ejecutable)*.
  - (d) Email de reporte no enviado (`email_sent_at` null tras generación) → propone **reenviar** *(ejecutable)*.

  Mapean directo a campos existentes: el inbox es **real, no mockeado**, incluso antes del agente de PR.

  > **Actuadores no aspiracionales.** Los botones se gatean por `RuntimeActionCapability.executable`. **Botones vivos solo** para retry / reenviar email / disparar report-recovery. PR / rollback / feature-flag se renderizan como **"propuesta (ejecución manual)"** con el diagnóstico copiable, no como ejecutor clicable, hasta que existan el agente de PR y los actuadores de runtime.

- **Incidentes:** respaldados por `incidents`, sembrados por Vigía. Timeline desde `system_activity_log` filtrado por `incident_id`.
- **Registros:** vivos de inmediato ingiriendo los logs existentes a `system_activity_log`, más las filas de health_check/decisión de Vigía.

**Bucles de control de Producto:**

| Bucle | Sensores | Estado |
|---|---|---|
| Salud técnica | `client_errors` + `audio_events` | **VIVO** |
| Entrega | `sessions` (ai_sections + email_sent_at) + report-recovery-cron | **VIVO** |
| Calidad IA | `scripts/qa/ai-eval.ts` | **PARCIAL** (cablear el eval para que escriba `health_checks`) |
| Dashboards / Herramientas | qa-monitor synthetic checks | **VIVO** |

---

## 9. Cobertura de Producto (qué vigila Vigía)

- **Odisea (el juego):** `session_completed`, eje resuelto desde `_pending`, `ai_sections` presente/null, sesiones atascadas > 4 h, `_pending` > 2 h.
- **Dashboards / herramientas:** qa-monitor synthetic confirma que los propios dashboards y endpoints (`admin-health`, `admin-revenue`, `admin-ai-usage`) responden. Si una herramienta del cockpit se rompe, es un incidente de Producto.
- **Entrega:** reporte generado y email efectivamente enviado (`email_sent_at`), report-recovery-cron como red de seguridad, tasa > 99%.
- **Pagos:** `webhook_events` + `one-webhook` como sensores; idempotencia de pagos vigilada (duplicados).
- **Dependencias:** Stripe/MercadoPago (webhook > 99.5%), Resend (entrega > 99%), Gemini (latencia < 5 s). Hoy como stubs "sensor pendiente" hasta materializar el ledger de dependencias.
- **Crons:** las 6 de `vercel.json` ejecutan sin fallos. Hoy stub hasta tener tabla de historial de crons.
- **Calidad IA:** `scripts/qa/ai-eval.ts` cableado a `health_checks` (PARCIAL).
- **Costo de Vigía mismo:** cada diagnóstico es una llamada Gemini. A cadencia de cron es gasto recurrente y debe ser **una señal de Finanzas/health_checks** (`signal_key='vigia_ai_cost_per_day'`). Irónicamente, lo que Vigía debería vigilar.

---

## 10. Seguridad: el relevo de guardia y los frenos

**El relevo de guardia (dead-man's-switch): la pieza número uno.** El agente más importante es el que vigila a los centinelas. Cada bucle persiste `last_successful_check_at`. El veredicto de la org degrada a **amber** si el heartbeat de cualquier bucle vivo está stale más allá de 2x su cadencia, y a **gris "Vigía sin señal"** si el propio cron de detección no escribe en N min. Respaldado por una alerta **out-of-band** independiente (email/Telegram) para que un cockpit muerto igual te alcance. **Un cockpit caído nunca muestra verde mentiroso.**

**Verificación de arreglos:** ningún fix cierra hasta que la señal que lo disparó vuelve a verde (sección 7.2). Sin falsos "resuelto".

**Idempotencia:** `action_key` + guard único evita dobles ejecuciones (sección 7.2).

**Auditoría:** toda acción de gobernanza escribe a `admin_audit_log` (autoritativa) **y** a `system_activity_log` (sección 7.1).

---

## 11. Plan incremental (fases) y YAGNI explícito

### Fase 0 — Fundación del design system (prerrequisito real, no opcional)
- Extraer `Stat` y `BarRow` de `AdminHealth.tsx` (hoy locales, líneas 52/68, con violaciones de tokens: `bg-emerald-50`, `text-[11px]`, `'#955FB5'`) a `src/components/ui/`, refactorizar a tokens, exportar, y hacer que AdminHealth importe las versiones compartidas.
- Añadir `SEVERITY_COLORS` a `designTokens.ts` (incluye grey/offline, que hoy no existe; `STATUS_COLORS` solo tiene success/error/warning/info).
- Sin esto, el cockpit propaga violaciones de tokens.

### Fase 1 — Columna vertebral + reloj rápido de Producto (el corazón de v1)
- Migraciones: `system_activity_log` (particionada), `incidents`, `incident_classes` (lean), `health_checks` (con `last_successful_check_at`), `weekly_reviews`, `agent_ordines`. Todas con `area`.
- Ingesta a `system_activity_log` desde los logs existentes (sin romper APIs).
- Shell `PrincipiaShell` + registro `AreaModule` (`src/lib/principia/areas.ts`) con un módulo vivo (Producto) + tile/página genéricos `ComingOnline` para las otras cuatro.
- Vistas: Resumen, Bandeja (consulta `incidents WHERE status='awaiting_approval'`), Incidentes, Registros (`ActivityLogTable` paginada en servidor).
- Cron de detección único (Legatus) que itera `signalSources` del registro; siembra `incidents` desde `client_errors`/`audio_events`/`sessions`.
- **Relevo de guardia** + alerta out-of-band (email vía Resend como piso, Telegram como mejora).
- Verify-loop + idempotencia + doble escritura de gobernanza.
- Botones de actuador gateados por `executable` (solo retry/resend/trigger vivos).
- Push: ALTO incidents + conteo de Bandeja disparan Telegram + email.
- Commentarii: página de detalle de cohorte renderiza Mandatum + Acta + Ordines de Vigía.

### Fase 2 — Señales de dependencias y crons; Calidad IA completa
- Tablas de historial de crons + ledger de errores de dependencias (Gemini/Stripe/Resend).
- Listener de webhook de Resend para confirmación de entrega.
- Cablear `ai-eval.ts` a `health_checks`.
- Primera patrulla de Exploratores (tendencia simple) alimentando el resumen del Consilium.

### Fase 3 — Primera cohorte no-Producto end-to-end (valida la generalización)
- Implementar **una** cohorte no-Producto completa (probablemente Finanzas o Ventas, 60-70% listas) para probar el contrato `AreaModule` y, en particular, las señales **por-entidad** (`shape='entity'`). Es lo que valida que "misma forma, solo filas nuevas" se sostiene.

### Fase 4 — Promotio + Consilium editable (la subida N2→N4)
- Añadir contadores de hoja de servicios a `incident_classes`, `SetpointEditor`, `GraduationPanel`, frenos (piso de track record, democión automática, kill-switch global).
- Convertir el Consilium de read-only a editable.

### YAGNI explícito (qué NO se construye ahora)
- **NO** el motor de Promotio: sin contadores, sin `GraduationPanel`, sin `auto_executions`. Nada se auto-ejecuta en v1.
- **NO** el Consilium editable: v1 es resumen read-only. La columna `area` y los campos de snapshot se mantienen; setpoint/graduación quedan vacíos.
- **NO** cuatro páginas de detalle a medida: una sola genérica `ComingOnline` que lee del registro.
- **NO** botones de actuador para PR/rollback/feature-flag: "propuesta, ejecución manual" hasta que exista el agente de PR.
- **NO** virtualización con librería: paginación en servidor de 100 filas.
- **NO** RBAC multi-rol: v1 es founder-only sobre el allowlist `admin_users`.
- **SÍ** se mantiene la columna `area` en todas las tablas desde el día uno.

---

## 12. Gaps declarados (no resueltos en v1, anotados para no perderlos)

- **RBAC multi-rol:** cuando Personas (HR) y Finanzas (MRR/runway) convivan en un panel para una org con operadores, hace falta un modelo de roles ("un operador de marketing ve Praeco pero no Quaestor"). Se documenta, no se construye en v1.
- **Transporte push real:** v1 usa Telegram + email; el detalle de entrega y reintentos de push se endurece en Fase 1, no se completa al 100%.
- **Techo de crons de Vercel:** el sensado **no escala solo por registro**; cada cadencia ajustada consume invocaciones, y Vercel limita la cantidad de crons por plan. A documentar como restricción explícita en el plan de implementación. El shell escala por registro; el sensing no.
- **Honestidad de cadencia:** la copy dice "casi en tiempo real, cadencia = N min", nunca "instantáneo" o "continuo" como garantía dura.

---

## 13. Canon de nombres (congelado)

| Concepto | Término | Notas |
|---|---|---|
| Comandante (humano) | **Imperator** | Define el mandatum, preside el Consilium |
| Orquestador | **Legatus** | Corre los dos relojes; vive en la Principia |
| Centro de mando (UI) | **Principia** | Ruta `/admin/principia` (evita choque con Puentes) |
| La organización | **Legio** | La legión de Argo |
| Área / sector | **Cohors** | DB: columna `area` |
| Oficial de área | **Centurio** | **Vigía** = centurión de Producto |
| Sub-agentes de tarea | **Legionarii** | Efímeros, una tarea |
| Memoria del agente | **Commentarii** | Mandatum / Acta / Ordines |
| Guardia reactiva | **Vigiliae** | Push (Telegram + email) |
| Patrulla proactiva | **Exploratores** | Briefing del Consilium |
| Reunión semanal | **Consilium** | Rumbo + junta de ascensos |
| Ascenso / graduación | **Promotio** | `autonomy_mode: propose → auto` |
| Centuriones de cohorte | Vigía (Producto), **Praeco** (Marketing), **Mercator** (Ventas), **Tribunus** (Personas), **Quaestor** (Finanzas) | Los 4 últimos, provisionales |

---

## 14. Notas de revisión para el Imperator

- **La adición más importante** sobre el diseño original es el **relevo de guardia (dead-man's-switch)**: sin él, un cron de detección caído muestra verde mentiroso. Es la pieza de seguridad número uno.
- **Fase 0 es prerrequisito real:** extraer `Stat`/`BarRow` + agregar `SEVERITY_COLORS` antes de construir la Principia, o el cockpit nace con violaciones de tokens.
- **La generalización multi-área se valida recién en Fase 3** (primera cohorte no-Producto). Hasta entonces, "misma forma, solo filas nuevas" es una promesa de diseño, no una probada.
- Archivos verificados: `src/pages/Dashboard.tsx` (NAV_ITEMS = `{to,label,icon}`), `src/lib/designTokens.ts` (existe `STATUS_COLORS`, falta `SEVERITY_COLORS`), `src/pages/dashboard/AdminHealth.tsx` (Stat/BarRow locales con violaciones), `src/types/puentes.ts` (`el_puente`, por eso `/admin/principia` y no `/admin/puente`).
