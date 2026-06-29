# Identidad del niño y perfilamientos (rediseño)

> Estado: **diseño aprobado, sin implementar**. Decisiones de producto bloqueadas por el owner (2026-06-29).
> Alcance: separar "el niño" de "cada perfilamiento", eliminar el dedup destructivo por nombre+email,
> hacer el re-perfilado explícito y con historial, y cerrar el bug del informe cruzado.

## 1. Por qué existe este documento

Hoy una fila de `public.sessions` es, a la vez, **el niño**, **la jugada**, **el perfil actual**, **el informe**
y **el cupo del plan**. Esa conflación causó un incidente real (caso "Fede Prueba 1 Hijo"): un segundo juego
con el mismo nombre+email **pisó** la fila vía un dedup silencioso, dejó el eje correcto (Conector) pero el
informe viejo (Estratega) y los tokens en 0. Detalle del incidente y su prueba en el audit log:
ver la investigación asociada (evento `report_recovered` id648 + `session_reprofiled` id649 sobre la sesión `4f976bfc`).

Dos problemas de fondo, ambos resueltos acá:

1. **Identidad débil.** El niño se reconocía por `(tenant_id, adult_email, child_name)`. Dos niños distintos con el
   mismo nombre bajo un mismo adulto se pisaban. Re-jugar = sobreescribir, sin aviso ni candado.
2. **Divergencia perfil/informe.** El perfil (`eje/motor`) y el informe (`ai_sections`) se escribían por separado y
   en momentos distintos, así que podían quedar describiendo arquetipos diferentes.

## 2. Decisiones bloqueadas por el owner

1. **Mismo nombre ≠ mismo niño.** Cada cuenta puede tener varios niños con el mismo nombre. El link general
   **siempre crea un niño nuevo**. Se elimina el dedup por nombre+email.
2. **El niño y el perfilamiento son cosas distintas.** Un niño tiene un **historial** de perfilamientos. El perfil
   actual = el último. Re-perfilar **agrega**, nunca borra ni pisa.
3. **Re-perfilar es explícito.** Único camino: botón "Re-perfilar" (ícono copiar) en la ficha del niño. **Aparece a
   los 4 meses** del perfil actual (no antes), como recomendación. En hover explica que la conducta del niño pudo
   cambiar. Al tocarlo copia el link propio del niño y muestra un snackbar ("Link copiado con éxito, compártelo
   con el adulto responsable del niño"). Jugar ese link crea un perfilamiento nuevo para **ese** niño.
4. **Cupos por niño.** Un niño = un cupo. Re-perfilar **no** consume cupo. Crear un niño nuevo sí (respeta el límite
   del plan). Unificar libera un cupo.
5. **Duplicados con unificación.** Si dos niños parecen la misma persona (mismo email + mismo nombre en el tenant),
   se muestra un aviso **no destructivo**. Nunca se unifica solo. Si el coach confirma "es la misma persona", hay una
   acción de **unificar** que junta los dos en uno con su historial combinado.
6. **Fix del robot de recuperación.** El cron que rescata informes no debe poder escribir un informe con el eje
   equivocado (ver §8, con una corrección importante al alcance literal de este punto).

## 3. Modelo de datos

Se parte la fila `sessions` conflada en **dos tablas** más una **vista** de lectura.

### 3.1 `children` (nueva) — la entidad persistente, el cupo

Una fila por niño. Es lo que ocupa un lugar del plan. Se crea en cada juego por el link general; el re-perfilado
nunca crea una.

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid pk | |
| `tenant_id` | uuid → tenants | NULL para Argo One |
| `adult_name` | text | |
| `adult_email` | text | |
| `child_name` | text | |
| `child_age` | int | |
| `sport` | text | |
| `lang` | text | default `es` |
| `reprofile_token` | text unique not null | capacidad de escritura por niño, 128-bit (`encode(gen_random_bytes(16),'hex')`) |
| `archived_at` | timestamptz | |
| `deleted_at` | timestamptz | |
| `merged_into` | uuid → children | tombstone que deja la unificación en el niño absorbido |
| `is_demo` | boolean | |
| `created_at` | timestamptz | |

### 3.2 `perfilamientos` (la actual `sessions`, renombrada) — el historial append-only

Una fila por jugada/evaluación. **Nunca se sobreescribe ni se borra al re-perfilar.** El perfil resuelto y su
informe viven **co-locados en la misma fila**, así no pueden divergir. Se **preservan los `id` actuales** de
`sessions` para que los links `/report/:id?token=` ya enviados sigan funcionando.

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid pk | preservado desde `sessions.id` |
| `child_id` | uuid not null → children | ON DELETE CASCADE |
| `eje` / `motor` / `archetype_label` | text | default `_pending` |
| `eje_secundario` | text | |
| `answers` | jsonb | forma `{axis, responseTimeMs}[]` |
| `ai_sections` | jsonb | el informe |
| `ai_tokens_input` / `ai_tokens_output` / `ai_cost_usd` | | |
| `lang` | text | |
| `share_token` | text | secreto de lectura del informe, por perfilamiento |
| `email_sent_at` | timestamptz | idempotencia de envío, por perfilamiento |
| `full_access` | boolean | |
| `is_demo` | boolean | |
| `status` | text not null | `in_flight` \| `resolved`. CHECK: `resolved` ⇒ `eje <> '_pending'` |
| `puentes_reminder_sent_at` | timestamptz | |
| `created_at` | timestamptz | fecha del perfilamiento (reloj de los 4 meses) |

`status` reemplaza el centinela frágil `eje = '_pending'` que hoy se usa en ~6 lugares y confunde "tiene eje" con
"es publicable". **Todos** los lectores (vista, `report.ts`, cron, `tenant-chat`, conteo de cupos) filtran
`status = 'resolved'`.

### 3.3 `current_perfilamiento` (vista) — el perfil actual

Una fila por niño = su **último perfilamiento `resolved`**, unida a la identidad del niño, exponiendo **los mismos
nombres de columna que hoy leen los consumidores**. Así ~15 sitios de lectura cambian de `sessions` a esta vista
casi solo por nombre. Expone `id` = id del **niño** (para que el join con `group_members` y los `team_ids` resuelvan),
`perfilamiento_id`, los campos del perfil, `current_profile_date` (= `created_at` del perfilamiento, el reloj de los
4 meses) y `perfilamiento_count`. RLS/grants espejan el acceso actual a `sessions` (la lectura directa desde el
browser en `Sessions.tsx` debe seguir funcionando).

### 3.4 FKs: a qué nivel apunta cada una

Decisión central del esquema (recomendada, a confirmar por el owner):

- **A nivel niño** (`children.id`): `group_members`, `chem_group_members` (membresía de plantel/grupo es del niño).
- **A nivel perfilamiento** (`perfilamientos.id`): `parental_consents.session_id` (cadena de custodia COPPA inmutable),
  `puentes_purchases.source_session_id`, `puentes_sessions.source_session_id`, `feedback.session_id` (cada Puentes/
  informe se autoró contra una evaluación específica).

`parental_consents` además suma `child_id` y un booleano `reprofile`, para reconstruir el link del niño en el
re-perfilado de menores de 13.

## 4. Fuente única de verdad (evita el bug de raíz)

**Modelo elegido: A.** La tabla `perfilamientos` es la única fuente física de verdad. El "perfil actual" se deriva
en la **vista** (último `resolved` por niño). **No** hay columnas-snapshot copiadas al niño, **no** hay puntero
`current_perfilamiento_id` en v1.

Se rechaza el modelo B (snapshot en `children`) porque **recrea exactamente la divergencia del caso Fede**: informe
y perfil vivirían en dos lugares sincronizados por copia de aplicación, y cualquier escritor parcial los desincroniza.

Tres garantías que hacen imposible la divergencia:

1. **Append-only + co-locado.** Cada jugada escribe `eje/motor` y (segundos después) `ai_sections` sobre **la misma
   fila** de `perfilamientos`. Nunca hay una segunda copia ni un overwrite de una evaluación previa.
2. **`status` + CHECK.** `resolved ⇒ eje <> '_pending'`; todos los lectores filtran `resolved`. Una fila con eje
   pero sin informe terminado nunca se trata como publicable.
3. **Actual derivado, sin puntero.** "Actual" = el último `resolved` calculado en la vista. "Agregar un
   perfilamiento" se vuelve actual solo, sin escritura extra ni invariante de puntero que mantener.

## 5. Los dos links

- **Link general** (sin cambios de forma): `${origin}/play/:slug` (y `/play/:slug/:teamSlug`). **Siempre crea un niño
  nuevo + su primer perfilamiento.** Es el **único** camino que consume cupo (chequea `roster_limit`). `/api/start-play`
  firma un `play_token` `{t, tm, exp}` **sin** id de niño: así `session.ts` sabe que es un niño nuevo.
- **Link de re-perfilar** (nuevo): `${origin}/play/r/:reprofileToken`, un único segmento opaco (el `reprofile_token`
  del niño, nunca el UUID, para evitar IDOR enumerable). Ruta nueva `/play/r/:reprofileToken` → página
  `TenantReprofilePlay` → POST `{reprofile_token}` a un endpoint **nuevo y separado** `/api/start-reprofile` (NO un
  flag en `start-play`, para que el bypass de cupo nunca pueda filtrarse al link general).

`start-reprofile`: resuelve el niño por `reprofile_token` (índice único), verifica que esté activo (no archivado/
borrado/unificado), chequea vigencia del plan, **saltea a propósito el chequeo de cupo**, y firma un `play_token`
extendido `{t, tm, cid: childId, m: 'r', exp}` donde `cid` se resuelve en el server desde el token y va **firmado**
(nunca del body). `session.ts` honra `cid` solo desde el token firmado: agrega un perfilamiento nuevo con ese
`child_id`, sin niño nuevo y sin cupo. Cierra el IDOR de pasar un `child_id` arbitrario por el body.

### Token de re-perfilar (seguridad)

`reprofile_token` es estable, reusable, **uno por niño**, generado al crear el niño. Distinto del `share_token`
(lectura del informe, por perfilamiento). Cada reuso agrega un perfilamiento inofensivo (sin cupo). Sin TTL en el
token guardado (una cadencia de 4 meses hace hostil un TTL corto); la expiración vive en el `play_token` firmado por
clic (1h). Rotación: (a) "Regenerar link" manual en la ficha ante sospecha de filtración; (b) **siempre** se rota en
la unificación (el sobreviviente recibe token nuevo; el del absorbido se invalida/redirige vía `merged_into`).
Rate-limit (KV) por `reprofile_token`.

## 6. Cupos

**Un cupo = un niño activo** (`children` con `archived_at IS NULL AND deleted_at IS NULL`), no un perfilamiento.
Este es el arreglo central: re-perfilar agrega un perfilamiento a un niño existente, así que **no puede** consumir
cupo; solo el link general crea un niño y consume cupo.

- Reescribir `check_roster_capacity` (`20260330_roster_model.sql`) para contar **niños activos**.
- `/api/start-reprofile` saltea el chequeo por completo.
- Un primer juego en curso (niño cuyo único perfilamiento es `in_flight`) **igual ocupa cupo** (coincide con
  CLAUDE.md: "abandoned sessions occupy a slot, can be retried").
- **Reconciliar las 5 definiciones hoy divergentes** sobre una sola: `check_roster_capacity`, el gate de reactivar en
  `archive-player` (ruteado por el **mismo** chequeo atómico `FOR UPDATE`, hoy es un SELECT-luego-UPDATE que puede
  correr en carrera), `tenant-info.active_players_count`, `admin-tenants` (quitar el `.not('eje','eq','_pending')`
  divergente de la línea ~198, hoy un tenant puede estar `roster_full` mientras admin lo muestra bajo el límite), y
  los gates del frontend (`LinkWidget`/`TenantHome`).
- Argo One (niños con `tenant_id NULL`) nunca cuentan.
- Unificar libera cupo solo (el conteo baja al tombstonear al absorbido); `liberados = activos_antes - activos_después`.
- Retirar `check_reprofile_cooldown` (RPC de 6 meses, muerto y sin llamadas). Los 4 meses son una recomendación de
  cliente sobre la fecha de la vista, no un candado.

## 7. UX del panel (`TenantPlayers.tsx`)

- **Botón Re-perfilar.** Reemplaza el badge inerte (~278-286) por un botón con ícono de copiar activo por niño. Al
  click: `stopPropagation` (la fila colapsada es un único `<button>` toggle), `navigator.clipboard.writeText(${origin}/play/r/${reprofile_token})`, luego `useToast().toast('success', ...)`. Respeta el mismo gate de plan pago que
  Descargar/Reenviar (en `trial` muestra candado). Para mobile, además una acción full-width en la barra inferior
  expandida (la zona del badge está `hidden sm:flex`).
- **Timeline / historial.** Bloque nuevo en el detalle expandido: una fila por perfilamiento `resolved` (fecha, chip
  de eje/motor, "enviado" si `email_sent_at`, deep-link "ver informe" a `/report/:perfilamientoId?token=share_token`).
  El actual (último) resaltado. `/api/tenant-sessions` debe devolver el array de historial por niño.
- **Gate de 4 meses.** Cambiar `monthsSince(created_at) >= 6` por `>= 4` **y** sobre `current_profile_date` (no
  `created_at`, que es cuándo se creó el cupo y haría re-flaggear a un niño recién perfilado, la misma conflación que
  causó el bug). Aplicar en los **tres** sitios: flag por ficha (~57-58), conteo + banner ámbar (~633, 664-672), y
  filtro "solo re-perfilar" (~619).
- **Copy (tuteo, sin guiones).** Snackbar: "Link copiado con éxito, compártelo con el adulto responsable del niño."
  Tooltip hover: "El comportamiento del niño puede haber cambiado. Recomendamos un nuevo perfilamiento."
  (El borrador "enviáselo al padre del niño" usa voseo y lo rechaza el hook; usar "compártelo".)
- **i18n** (`dashboardTranslations.ts`): `6 meses → 4 meses` en es (~408-410), en (~711-713), pt (~1014-1016); agregar
  claves nuevas (3 idiomas) para snackbar, tooltip, label del timeline, aviso de duplicado y confirmación de unificar.
- **Help/Terms/Pricing**: reescribir "6 meses" y "se actualiza en el lugar" a 4 meses + modelo por-niño que **agrega**
  (no pisa). (Actualización proactiva del Help Center, por CLAUDE.md.)

## 8. Fix del cron (`report-recovery-cron.ts`)

**Corrección importante al item #6 del owner.** El literal "re-resolver eje/motor desde las respuestas" es **inseguro
para el motor**: verificado en vivo, `answers` guarda `{axis, responseTimeMs}[]` **sin** las métricas de los mini-juegos,
y `resolveFromAnswers` deriva el **motor** principalmente de esas métricas (cae a tiempo de respuesta como fallback),
así que re-resolver el motor **corrompería** un motor correcto.

Resolución (el modelo A lo hace limpio):

1. Como `eje/motor` y `ai_sections` están co-locados en una fila append-only escrita al finalizar, el cron **confía**
   en el `eje/motor` de esa fila (no es un snapshot separable: **es** el perfilamiento) y solo **genera** el
   `ai_sections` faltante para filas `status = 'resolved'`. El bug de Fede era un overwrite in-place que dejaba el
   informe viejo respecto a un eje cambiado; A lo elimina al no sobreescribir nunca.
2. **Defensa en profundidad (recomendada, intención del item #6):** re-derivar **solo el eje** desde `answers`
   (inline, porque `api/` no puede importar `src/lib`: `ERR_MODULE_NOT_FOUND`) y si difiere del eje guardado,
   **saltear y avisar** a Principia (`system_activity_log`) en vez de autorar un informe en disputa. **Nunca** reescribir
   el motor.
3. **Guard de "en vuelo":** reemplazar el `.neq('eje','_pending')` débil por `status='resolved' AND email_sent_at IS NULL
   AND ai_sections IS NULL AND answers no vacío AND created_at < now() - interval '2 minutes'` (saltea filas recién
   finalizadas en mitad de la escritura en dos fases).
4. `email_sent_at` es por perfilamiento, así que el informe nuevo de un niño re-perfilado **no** queda bloqueado por el
   `email_sent_at` de un informe previo.
5. Arreglar el no-op existente (líneas ~141-143, ambas ramas de `eje_secundario` iguales).

Fast-follow (no v1): agregar `game_metrics jsonb` a `perfilamientos` al finalizar, para que el motor sea
re-resolvible deterministamente más adelante.

## 9. Unificar dos niños (merge)

Detección **solo aviso, nunca automática**: dentro de un tenant, matchear `lower(adult_email)` **y** `lower(child_name)`
entre niños activos (tolerar diferencia de `child_age`: el niño crece entre perfilados). Aviso ámbar descartable con
"Estos parecen el mismo niño" y acción "Unificar". El modal muestra ambos lado a lado; el coach elige el sobreviviente
(define `adult_name/email/child_age` que quedan).

Todo corre dentro de **una** función `merge_children(p_survivor, p_absorbed, p_actor)` SECURITY DEFINER, en una sola
transacción, con `SELECT ... FOR UPDATE` sobre **ambos** niños ordenados por id (a prueba de deadlocks). Endpoint fino
`POST /api/merge-players` (con `resolveTenantContext`, asegura que ambos ids son del tenant del que llama antes de
invocar el RPC). **Nunca** reusar `delete-session.ts` como primitiva.

Pasos:

1. **Sobreviviente** (default determinístico, override en el modal): el de perfilamiento actual más reciente;
   desempate por `created_at` más viejo, luego menor id.
2. **Re-parentar perfilamientos:** `UPDATE perfilamientos SET child_id = survivor WHERE child_id = absorbed`. Cada
   perfilamiento conserva su id/fecha/eje/motor/informe/share_token/email (los links viejos siguen resolviendo; Puentes
   sigue válido porque los ids no cambian).
3. **Recomputar actual:** sin escritura (la vista deriva el último `resolved` del historial combinado). Si el absorbido
   tenía un perfil más reciente, ese pasa a ser el actual: el sentido de la unificación.
4. **Unir membresías:** en `group_members` y `chem_group_members`, `INSERT` filas del sobreviviente desde las del
   absorbido `ON CONFLICT (group_id, child_id) DO NOTHING`, luego `DELETE` las sobrantes del absorbido.
5. **Puentes/feedback:** sin acción (apuntan al perfilamiento, cuyo id no cambia). Asersión pre-commit: cero filas de
   Puentes cuyo `source_session_id` no resuelva a un perfilamiento vivo bajo el sobreviviente, o `RAISE` + rollback.
6. **Consentimientos:** sin escrituras (cada `parental_consents` queda atado a su perfilamiento original, cadena COPPA
   inmutable). Registrar ids en `old_state`.
7. **Liberar cupo:** `absorbed.deleted_at = now()`, `absorbed.merged_into = survivor` (**tombstone, no hard-delete**:
   preserva reversibilidad y las filas de Puentes NOT NULL/CASCADE). Forzar `survivor.archived_at = NULL` si **alguno**
   de los dos estaba activo. Rotar `survivor.reprofile_token`; redirigir el del absorbido vía `merged_into`.
8. **Auditoría (reversible):** una fila en `system_activity_log` (`area='roster'`, `action='children_merged'`) con
   `old_state` = snapshot JSON completo (niño absorbido, sus perfilamiento ids, membresías, Puentes ids, consent ids,
   estado previo del sobreviviente) y `new_state` = `{survivor id, perfilamiento ids movidos}`. Más una fila en
   `admin_audit_log` (`action='merge_children'`).

Modos de falla cubiertos:

- **Puentes (pago) NOT NULL + CASCADE:** un hard-delete del absorbido borraría una compra paga sin log. Por eso
  tombstone-only + asersión de no-dangling.
- **Colisión de índice único** en plantel compartido: mitigado por `INSERT ON CONFLICT DO NOTHING` + `DELETE` (paso 4).
- **Perfilamiento en vuelo** en cualquiera de los dos al unificar: bloquear la unificación con "Hay un perfilamiento en
  curso, espera a que termine" si hay una fila `in_flight` creada en los últimos ~30 min. El actual deriva solo de
  `resolved`, así que uno en vuelo nunca se vuelve actual.
- **Cupo con input archivado:** si el absorbido estaba archivado, liberados = 0, no 1. Computar `activos_antes - activos_después`.
- **Identidad en conflicto** (casing de email, typo, edad 11 vs 12): el sobreviviente descarta la del absorbido;
  el modal lado a lado lo hace consciente y se persiste lo descartado en `old_state`.
- **Cross-tenant / escalada:** el endpoint asegura ambos ids del tenant que llama; el RPC re-chequea igualdad de
  `tenant_id` dentro del lock y `RAISE` si difieren o alguno es NULL (Argo One nunca unificable).
- **`chat_messages` no tiene `session_id`:** cualquier "reconciliar chat" copiado de `delete-session.ts` sería un no-op
  muerto; el chat es por tenant/member/plantel. (Aparte: arreglar el `chat_messages.delete` muerto en `delete-session.ts`,
  baja prioridad.)
- **`is_demo` mezclado:** bloquear si los sets de perfilamientos difieren en `is_demo` (un niño demo y uno real no son la
  misma persona para billing/métricas).

## 10. Plan de migración (ordenado)

1. **Pre-flight.** El snapshot es 100% interno (136 filas: 90 Argo One `tenant_id NULL`, 46 filas de tenant = 46 niños
   distintos). No hay data de clientes reales que migrar. Confirmar con el owner que re-apuntar ids de `/report` es
   aceptable (lo es, pre-lanzamiento).
2. **`CREATE TABLE children`** (migración nueva, no editar historia) con índice `(tenant_id) WHERE archived_at IS NULL
   AND deleted_at IS NULL` para el conteo de cupos, y único en `reprofile_token`.
3. **Backfill `children`** desde `sessions`: para filas de tenant, un niño por `(tenant_id, lower(adult_email),
   lower(child_name))`; para Argo One, un niño por fila. Datos de la sesión más vieja; generar `reprofile_token`.
4. **`RENAME sessions → perfilamientos`** (preserva ids ⇒ links `/report` estables). Agregar `child_id`, `status`;
   `child_id NOT NULL → children ON DELETE CASCADE`; `CHECK (status='resolved' ⇒ eje<>'_pending')`.
5. **Backfill** `perfilamientos.child_id` (match al niño) y `status` (`resolved` si `eje<>'_pending' AND ai_sections IS
   NOT NULL`, si no `in_flight`).
6. **Re-apuntar FKs de niño:** `group_members.session_id → child_id` (resolver cada `session_id` a su `child_id`,
   reescribir, cambiar FK + único a `(group_id, child_id)`); igual `chem_group_members`. `parental_consents`: agregar
   `child_id` + `reprofile`, mantener `session_id` al perfilamiento.
7. **Mantener FKs de perfilamiento:** `puentes_*.source_session_id`, `feedback.session_id` siguen al perfilamiento.
   Verificar cero dangling.
8. **`CREATE VIEW current_perfilamiento`** (último `resolved` por niño, id del niño AS id, `current_profile_date`,
   `perfilamiento_count`); GRANT/RLS espejando `sessions`.
9. **Reescribir `check_roster_capacity`** (contar niños activos); re-apuntar el índice; retirar `check_reprofile_cooldown`.
10. **`CREATE FUNCTION merge_children(...)`** SECURITY DEFINER (§9).
11. **Código `session.ts`:** quitar `findExistingPlayer` + ambas ramas de overwrite; partir `start` en niño-nuevo vs
    re-perfilar (append vía `cid` firmado, sin cupo); `ensureTeamMembership` al **niño**; `cid` por `verifyPlayToken/signPlayToken`.
12. **Código nuevos endpoints/rutas:** `/api/start-reprofile`, `/api/merge-players`; ruta `/play/r/:reprofileToken` +
    `TenantReprofilePlay`; threading de `child_id`+`reprofile` en consent.
13. **Código lectores:** re-apuntar todo lector de perfil actual a la vista; `report.ts`/`admin-grant-access`/`send-email`
    al perfilamiento **por id**; `Sessions.tsx` a la vista; `tenant-sessions` devuelve una fila por niño con perfil actual
    + `reprofile_token` + array de historial + `current_profile_date`.
14. **Código cron** (§8).
15. **Código UI** `TenantPlayers` (botón copiar, gate 4 meses sobre fecha actual, timeline, aviso + modal de unificar);
    i18n 6→4 + claves nuevas; copy Help/Terms/Pricing.
16. **Verificar en preview de `develop`** (NO en dev local: `sessionStore` mockea `/api/session` en DEV). Correr
    `check:api-imports` (helpers inline del cron/merge). `qa-monitor` CHECK 8. Reconciliar que los 3 conteos de cupo
    coincidan (gate, admin, dashboard).

## 11. Archivos impactados (resumen)

| Archivo | Cambio |
|---|---|
| `api/session.ts` | Quitar `findExistingPlayer` + ambas ramas de overwrite. `start` niño-nuevo vs re-perfilar (cid firmado). `update` por `share_token`. `ensureTeamMembership` al niño. Validar `consent.child_id == cid`. |
| `api/start-play.ts` | Link general: mantener tenant-by-slug + `check_roster_capacity` (cuenta niños). `play_token` sin `cid`. |
| `api/start-reprofile.ts` | **Nuevo.** Resolver niño por `reprofile_token`, saltear cupo, firmar `{t,tm,cid,m:'r',exp}`. |
| `api/merge-players.ts` | **Nuevo.** `resolveTenantContext` + asersión de tenant + RPC `merge_children`. |
| `api/report-recovery-cron.ts` | §8: `status='resolved'` + age floor; generar-no-reescribir; re-derivar solo eje skip-and-flag; fix no-op 141-143. |
| `api/tenant-sessions.ts` | Leer la vista: una fila por niño + `reprofile_token` + `current_profile_date` + historial. |
| `api/tenant-chat.ts` | Roster context + `ai_sections` del jugador + ground-truth desde la vista/perfilamiento actual. |
| `api/report.ts` | Resolver un perfilamiento por id; gate `share_token`; `status='resolved'`. |
| `api/send-email.ts` | `ai_sections`/`share_token`/`email_sent_at` del perfilamiento; estampar en el perfilamiento. |
| `api/admin-grant-access.ts` | Target perfilamiento por id. |
| `api/tenant-info.ts` | `active_players_count` = niños activos (función compartida). |
| `api/admin-tenants.ts` | Conteo = niños activos; quitar `.not('eje','eq','_pending')` divergente. |
| `api/tenant-groups.ts` / `api/tenant-chem-groups.ts` | Miembros = ids de niño; perfil desde la vista. |
| `api/session-context.ts` / `api/admin-ai-usage.ts` | Agregados desde perfilamiento actual / suma de tokens por perfilamiento. |
| `api/one-complete.ts` / `api/one-start-play.ts` | Argo One: un niño + un perfilamiento; nunca cuenta cupo. |
| `api/delete-session.ts` | Borrar niño cascadea sus perfilamientos. No reusar como merge. |
| `supabase/migrations/<new>.sql` | Crear children; rename + child_id/status/CHECK; backfill; re-apuntar membresías; alterar consents; vista + RLS; reescribir `check_roster_capacity`; retirar cooldown; `merge_children()`. |
| `src/App.tsx` | Ruta `/play/r/:reprofileToken`. |
| `src/pages/TenantReprofilePlay.tsx` | **Nuevo.** POST a `/api/start-reprofile`; threading de `cid`; pantallas niño inactivo/unificado. |
| `src/components/onboarding/OnboardingFlowV2.tsx` | Pasar modo re-perfilar por `startSession` y el fallback `saveSession`: la finalización escribe un perfilamiento nuevo, nunca overwrite. |
| `src/lib/sessionStore.ts` | Campos de re-perfilar en payloads. DEV mockea `/api/session`: verificar en preview. |
| `src/pages/tenant/TenantPlayers.tsx` | Botón copiar + snackbar; gate 4 meses sobre `current_profile_date` (3 sitios); timeline; aviso + modal de unificar. |
| `src/pages/dashboard/Sessions.tsx` | Lectura directa del browser → vista `current_perfilamiento`. |
| `src/pages/ReportPage.tsx` | Resolver a un perfilamiento. |
| `src/pages/tenant/TenantHome.tsx` / `TenantDashboard.tsx` / `TenantSettings.tsx` / `LinkWidget.tsx` | `active_players_count` = niños activos; copy de "roster lleno". |
| `src/pages/ConsentLanding.tsx` + `api/request-consent` + `api/confirm-consent` | Threading de `child_id`+`reprofile`; menores de 13 vuelven a `/play/r/<token>?consent=...`. |
| `src/lib/dashboardTranslations.ts` | 6→4 meses (3 idiomas) + claves nuevas (snackbar tuteo, tooltip, timeline, duplicado, unificar). |
| `src/lib/helpContent.ts` (+ `.en`) / `TermsPage.tsx` / `TenantPricing.tsx` | 4 meses + modelo append-not-overwrite. |
| `src/lib/profileResolver.ts` | Sin editar, pero la lógica de conteo de eje/eje_secundario se **inlinea** byte a byte en el cron. |

## 12. Decisiones abiertas para el owner

1. **Re-derivación del cron (importante).** El "re-resolver eje/motor desde answers" del item #6 no es seguro para el
   **motor** (no es reproducible sin métricas de juego). Propuesta: confiar en `eje/motor` co-locados, generar-solo, y
   opcionalmente re-derivar **solo el eje** que **saltea y avisa** si difiere (nunca reescribe). ¿Confirmás esta enmienda?
2. **Nivel de cada FK** (la mayor decisión de esquema): membresías → niño; consents/Puentes/feedback → perfilamiento.
   ¿Confirmás?
3. **`game_metrics` ahora o fast-follow** (para que el motor sea re-resolvible a futuro). Recomendado: fast-follow.
4. **Sin puntero `current_perfilamiento_id` en v1** (actual derivado en la vista). ¿OK, o querés un puntero mantenido por trigger por performance de lectura?
5. **Permiso de unificar:** ¿solo owner o owner + coach? Recomendado owner + coach (el coach es quien ve el duplicado),
   con actor logueado.
6. **Link de un niño absorbido:** redirigir transparente al sobreviviente vía `merged_into` (recomendado) vs "link expirado".
7. **Cap de frecuencia de re-perfilado** (p. ej. ignorar re-perfilados dentro de los 30 días del último) como
   anti-spam. Recomendado agregar; confirmar ventana.
8. **Un niño empezado pero incompleto ocupa cupo** (recomendado, coincide con CLAUDE.md). Confirmar para unificar las 5
   definiciones de cupo y que admin deje de filtrar `_pending`.

## 13. Riesgos clave

- **Debe ir todo junto.** Quitar el dedup solo (sin el split + token de re-perfilar) haría que cada re-juego consuma un
  cupo nuevo y que cada re-perfilado dé `roster_full` (la capacidad se chequea en `start-play` pero el cupo se consume al
  INSERT). No mergear el dedup-removal aislado.
- **El bug está en DOS ramas** (`start` 196-214 y `save` 347-374); la de `save` es el fallback que se usa justo cuando
  `startSession` falló. Arreglar una sola deja el bug de Fede en el camino degradado.
- **Corrupción de motor en el cron** si se re-resuelve desde answers sin métricas de juego (ver §8).
- **Puentes pago NOT NULL + CASCADE:** unificar debe tombstonear, nunca hard-delete.
- **Mis-binding de FK = pérdida silenciosa de datos:** decidir niño-vs-perfilamiento por FK explícitamente.
- **Lectura directa en `Sessions.tsx`** no la sirve un join server-side: necesita la vista con RLS/grants espejados.
- **Re-perfilado de menores de 13** crea un niño nuevo si el round-trip de consentimiento reconstruye el link general:
  hay que threadear `child_id` y validar `consent.child_id == cid` firmado.
- **IDOR:** `cid` solo desde el token firmado, nunca del body.
- **Drift de conteo de cupo (5 definiciones):** unificar sobre una; `archive-player` reactivar debe usar el chequeo
  atómico `FOR UPDATE`.
- **DEV mockea `/api/session`:** toda la lógica nueva se prueba en preview de `develop`, no en dev local.
- **Resolver inlineado en el cron** puede driftear de `src/lib/profileResolver.ts` (api/ no puede importarlo): copiar
  byte a byte + nota, como el gate `check:api-imports`.
