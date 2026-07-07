# Engine del informe Argo — DISEÑO FINAL + lista de verificación

> Documento maestro consolidado (5 dominios). Fuente única para (1) entender el diseño final y (2) verificar, tras construir, que todo se aplicó. Incluye el fine-tuning de las 3 señales DISC (receta/contingencia/ritmo). Fecha: 2026-07-07.

## 1. Resumen del engine

Recorrido: **12 respuestas + métricas de juego + edad → Capa 1 (ficha determinista autocontenida, con las 3 señales DISC) → sustrato curado (esqueleto = fallback bueno) → Capa 2 IA atada (solo reescribe, no inventa) → choke-point de calidad (gate determinista + juez-IA, fail-closed) → entrega (solo `report_status=ready` sale; ante problema, HOLD + alerta + "tu informe se está preparando")**.

**Garantía central:** nunca sale basura ni esqueleto pelado; cualquier defecto real → HOLD, jamás se degrada a algo roto.

**2 huecos abiertos honestos** (no son bugs de diseño, son la frontera del producto): (1) fabricación conductual en prosa + Barnum intra-eje (se ataca con las señales DISC + generación restringida + medición a volumen, no con más filtros); (2) contenido I/S/C + en/pt sin autorar (launch-gate: se flipea por segmento a medida que se escribe, con tu firma de voz).

---

## 2. Diseño final por dominio

### PERFIL + NAMING + SEÑALES DISC

DISEÑO FINAL — Perfil, naming y señales DISC del engine v4.

== A. NAMING (fuente de verdad: docs/archetype-naming.md, reescrito 2026-07-06 a esquema eje×veta) ==
El perfil se nombra como blend DISC: `[Eje primario] con veta [Eje secundario]`, AMBOS ejes salen SOLO de las elecciones (votos DISC), nunca de la velocidad/tempo.
- Eje primario = eje más votado. Mapa fijo: D→Impulsor, I→Conector, S→Sostenedor, C→Estratega.
- Veta = 2.º eje más votado (es OTRO eje, NO una palabra de tempo).
- 3 formas nombrables: (1) primario puro `[Eje]` (4); (2) blend `[Primario] con veta [Secundario]` (8 no-opuestos); (3) sin sustantivo (par/tendencia) cuando no pasa el name-gate.
- Conteo exacto: 4 primarios puros + 8 blends no-opuestos = 12 etiquetas nombrables (NO 4×3=12 ingenuo; los 4 pares opuestos no se nombran). NO 132 (la veta es un eje, no un arquetipo).
- Eje ≠ arquetipo: el eje S se llama "Sostén" (cualidad, AXIS_LABELS); el arquetipo/veta usa "Sostenedor". No unificar.
- i18n: es Impulsor/Conector/Sostenedor/Estratega; en Driver/Connector/Sustainer/Strategist ("with a X lean", NO invierte orden); pt Impulsionador/Conector/Sustentador/Estrategista ("com veta X").
- El tempo (Dinámico/Rítmico/Sereno/Observador y Rápido/Medio/Lento) SALE del nombre por completo: vive solo en "Su motor". Prohibido también el léxico disposicional del tempo (reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso).
- Nombres PROHIBIDOS (borrar on-sight, es/en/pt): esquema eje×tempo viejo (los 12), metáfora antigua (El Capitán/La Brújula/El Explorador/El Tanque), adjetivos (Impulsor Decidido/Persistente, Conector Vibrante/Relacional/Reflexivo, Estratega Reactivo/Analítico, Sostén Ágil/Confiable), esquema blog viejo. La narrativa náutica del juego (puerto, capitán, brújula) se conserva SOLO como juego, no como nombre.

== B. REGLA DE EJES OPUESTOS (D↔S, I↔C) — spec §3.2/O1 ==
Los pares diagonales del círculo DISC nunca forman nombre compuesto.
- OPPOSITE = {D:S, S:D, I:C, C:I}; isOppositeAxis().
- Si la veta cae en el eje opuesto del primario, NO entra al nombre aunque B2≥4: el nombre se queda en el primario (banda por B intacta).
- La veta opuesta se narra en el CUERPO como dos conductas observables dependientes del contexto que CO-OCURREN, con vocabulario de eje POSITIVO, sin "raro/inusual/en tensión/contradictorio" y sin el "pero" de conflicto (usar "y"). Reconciliación engine-definitivo: la veta opuesta SÍ figura en el encabezado, pero con label de co-ocurrencia ("Impulsor y Sostenedor", NO "con veta"); vetaOpuesta=true es flag de modo-de-copy.
- No se degrada la confianza extra por opuesto (B2 ya midió separación real); el cap es solo sobre el DESTINO de la veta (cuerpo, no nombre).
- archetype-naming.md NO agrega filas por opuestos.
- Monitor poblacional (no regla por chico): fracción de vetas afirmadas (B2≥4 ∧ B≥1) que caen en el opuesto vs nulo 1/3; <1/3 = circumpleja real, ≥1/3 = sospecha de artefacto de ítems.

== C. GATES (spec §1/§3/§3.1; calibrados por enumeración exacta de las 455 composiciones) ==
De 12 votos forzados se derivan: vector completo (D/I/S/C), B = 1º−2º (gatea PRIMARIO), B2 = 2º−3º (gatea VETA, independiente de B), topCount/secondCount/thirdCount, nEjesFuertes (ejes con conteo ≥ topCount−1), secundarioEmpatado (2º==3º).
- BANDA de confianza (3 niveles, classifyBanda): B≥4 'definido' (7.06%), B=2-3 'con_matices' (33.67%), B=0-1 'mezcla' (59.27%).
- NAME-GATE del primario (nameGate): sustantivo único solo si B≥4 O (B≥2 ∧ topCount≥7). Masa nula 7.68% (el viejo B≥2∧top≥6=20.90% queda retirado). Resuelve 6-2-2-2 (B=4, top=6 → nombra).
- VETA-BANDA (classifyVetaBanda): B2≤1 'sin' (75.72% cond.), B2=2-3 'tentativa' (23.14%), B2≥4 'afirmada' (1.15%). La veta entra al NOMBRE solo si B2≥4 ∧ no-opuesto.
- FORMA (7 valores, cascada classifyForma sobre conteos ordenados desc; B=0 evalúa primero): B=0 & nFuertes=2 → duo_empate; B=0 & nFuertes≥3 → equilibrio; B=1 & second≥4 → duo; B=1 resto → versatil; B∈{2,3} → lider_acompanante; B∈{4,5} → definido; B≥6 → muy_definido. Masas suman 100.00%, ninguna cruza banda.

== D. PERFIL SIEMPRE (owner 2026-07-07, METODO-CALIBRACION-VALOR + engine-definitivo R1) ==
Regla dura: SIEMPRE se entrega un perfil con nombre de valor (100% de los chicos), nunca "no pudimos definirlo". La banda comunica QUÉ TIPO de definición, no si hay o no nombre.
- perfilTipo familia-aware (CANÓNICO, único label; supersede el `[Primario] con veta [Secundario]` INCONDICIONAL de profileResolver.ts l.307): `{ familia, label, primario, secundario, coLideres[], vetaMostrada }`. perfilFamilia ∈ 'lider'|'duo'|'versatil'|'parejo'. Deriva:
  · B≥2 → 'lider', label "[Primario]" (+ sufijo de veta según vetaMostrada).
  · B=1 & forma=duo → 'duo', "Perfil de doble motor: [1º] y [2º]" (coLíderes nombrados).
  · B=1 & forma=versatil → 'versatil', "Perfil versátil, con base [1º]".
  · B=0 & duo_empate → 'duo'; B=0 & equilibrio → 'parejo', secundario=null.
- arquetipoLabel persistido = perfilTipo.label; la columna plana veta_eje guarda el EJE (dashboard/query), nunca el string de display.
- Veta graduada SIEMPRE que exista: B2≥4 al nombre; B2=2-3 subtítulo tentativo ("con algo de X"); B2≤1 línea suave. No se tira valor ya computado.

== E. 4 NIVELES DE TONO (registro, owner 2026-07-07; classifyRegistro) ==
El registro escala con el margen de votos B. La firmeza es sobre el DATO (un hecho); la lectura queda en presente/tendencia (nunca rasgo permanente). Los 4 niveles TODOS nombran el perfil.
- B≥6 'rotundo' → suena fuerte, cita la cifra ("apareció en 10 de 12"). meter level 4 ("De lleno").
- B=4-5 'claro' → "se define con claridad por X". meter 3.
- B=2-3 'matices' → "se inclina hacia X, con Y presente" (probabilístico, con nombre). meter 2.
- B=0-1 'parejo' → "dos motores parejos: X y Y" (los dos en el nombre). meter 1.
Decisión de owner que contradice la letra de A9: si se nombra el primario (B=4), el registro NO baja de "con claridad" (claridad-en-presente ≠ intensidad-como-rasgo). El registro "fuerte/marcado" queda eliminado del band-guard salvo describir el MARGEN DE VOTOS ("el margen fue amplio esta vez"), nunca al niño/rasgo.

== F. 3 SEÑALES DISC INDIVIDUALES (owner 2026-07-07; src/lib/dischSignals.ts) ==
Sacar mayor jugo a las 12 elecciones para hablar de ESTE chico, no de su arquetipo. REGLA DE ORO transversal: toda afirmación individual se gatea por robustez; un patrón se afirma SOLO con ≥2 escenas de acuerdo; una elección suelta es literal (nunca "tiende a"); sin patrón claro se calla. Nunca decirle "verde" a un chico "rojo".
1. RECETA (computeReceta): orden completo de los 4 ejes con presencia intra-individual. Presencia: i=0 'principal'; count≥3 'presente'; count≥1 'apenas'; else 'ausente'. Es un HECHO intra-individual (no gateado).
2. CONTINGENCIA (computeContingencia): qué eje eligió por contexto de escena. CONTEXT_MAP_V4 mapea las 12 preguntas a 8 contextos; MULTI_CONTEXTS = ['inicio','adversidad','esfuerzo'] (los que tienen ≥2 escenas → pueden formar patrón robusto; el resto es solo literal). Patrón robusto = mayoría estricta (support≥2 Y support>secondSupport); empate ⇒ contextosVaria ("cambia de registro"/"varía"). esDesvio = axis≠primario (donde cambia de registro).
3. RITMO ACOPLADO (computeRitmoAcople): rápido/lento contra SU PROPIA mediana (conservador, intra-individual). Silencio si prim.length<3 o noPrim.length<3; brecha = fastRate(prim)−fastRate(noPrim); si |brecha|<0.5 ⇒ null (silencio, señal ruidosa). Dirección primario_rapido/primario_lento.
computeDiscSignals junta las 3 sobre (vector, answers, primario).

ESTADO / DIVERGENCIA CLAVE: perfilTipo NO existe aún en código (spec-only, engine-definitivo R1); buildVotesEvidence todavía produce el label INCONDICIONAL con "con veta" siempre. Las 3 señales DISC están construidas y testeadas pero NO wired en resolveEvidenceFicha (la ficha no embebe respuestas[] AnswerRecord ni DiscSignals).

---

### ENGINE FAIL-CLOSED — gate determinista + juez-IA + estados/HOLD + entrega durable (choke-point único de calidad del informe Argo)

REGLA DE ORO: nunca sale un informe que no selló `report_status='ready'` en un control determinista recomputado server-side. Ante cualquier defecto real (dato podrido, IA caída, juez caído, texto sucio, nombre ajeno, idioma mezclado, fallback-dominante, corazón degradado) el sistema RETIENE (HOLD) + alerta al humano y muestra al adulto "tu informe se está preparando". Jamás basura, jamás informe a media frase, jamás el esqueleto pelado, jamás `ai_sections` sucios filtrados.

CHOKE-POINT ÚNICO: el único predicado que autoriza el envío es `report_status='ready'`. `seal-report` es el ÚNICO writer del status y RECOMPUTA el gate server-side sobre `(ai_sections, evidence_ficha)`; el browser NO puede proponer report_status. El live path corre generación+gate+juez+sello en UN endpoint server invocado fire-and-forget por el browser; el niño SIEMPRE ve "preparando", la entrega es por email. El live nunca sella ready en el browser.

RECORRIDO: perfilamiento resolved → GATE DE DATOS (evaluateFichaGate, única autoridad) → generación+degradación por sección → QC determinista sobre ensamblado → juez-IA sobre gate-PASS → seal-report recomputa+sella → send-email solo si ready.

ETAPA A — qualityGate() puro determinista (~1ms, SIEMPRE, corre sobre versión __NAME__ pre-rehydrate), 7 grupos:
- G1 DATOS (HARD, ESPEJA evaluateFichaGate, no lo contradice): sum(vector)===12 && respuestas.length===12; child_name trim 1..40 sin control-chars/placeholder; eje+arquetipo resolubles (nunca Desconocido/unknown); edad→degrade no HOLD; nEjesFuertes===4→plantilla parejo no HOLD; questionVersion validado en ingest (400 si falta, sin default 'unknown').
- G2 FORMA (HARD): ≥5 secciones obligatorias no vacías (hero-lead, perfil, combustible, corazon, guia); motor OPCIONAL no cuenta; cada sección ≥180 chars; informe total ≥900 chars.
- G3 BASURA (HARD, umbral 0): 0 matches /\{[^}]+\}/ y 0 literales undefined/null/NaN/Desconocido/unknown/[object Object].
- G4 GUARDS (HARD, umbral 0, contra plantilla/__NAME__): prohibited (35+), deterministic (ampliado con hedges de frecuencia "casi nunca/le cuesta" + claims longitudinales "a los N años/desde chico"), ground-truth con whitelist EXPANDIDA a ejes co-fuertes cuando nEjesFuertes≥3/secundarioEmpatado (no top-2 fijo), band-guard (intensidad vs banda), closed-scene (whitelist=momentos.seleccionados[]), name-guard (0 nombres ajenos), language-guard (idioma===langCode).
- G5 PROCEDENCIA (HARD): cada sección origen∈{ai,fallback}; HOLD si fallback-dominante (≥2 secciones CORE en fallback O >40% del total) O si el corazón (resumenPerfil/Retrato) cayó a fallback.
- G6 CONSISTENCIA (HARD): C6 compara perfilTipo.label (arquetipoLabel=perfilTipo.label canónico; veta_eje guarda el eje no el display); secundarioEmpatado nombra co-líderes simétricamente en subtítulo+tendencia; opuestos con label de co-ocurrencia ("Impulsor y Sostenedor" no "con veta"); sin lexemas de conflicto (raro/en tensión/pero le cuesta/contradice) en opuestos.
- G7 REPETICIÓN (SOFT→degrada una vez→si sigue mal HOLD): Jaccard trigramas <0.35 entre pares; sin oración idéntica repetida; primeras 6 palabras de 2 secciones no coinciden.
Contrato: `qualityGate(report,ficha,lang)→{pass,reasons[],sectionsStatic,provenance[]}`. Ante duda: HOLD.

ETAPA B — judgeQuality() IA (solo sobre gate-PASS): rúbrica 1-5 (coherencia 0.40, riqueza 0.30, interna 0.15, tono 0.15). UMBRAL CANÓNICO: ready SOLO si overall≥3.5 Y coherencia≥3 Y riqueza≥3 Y vetoes===0. Few-shot incluye caso "competente-pero-intercambiable→riqueza 2". FAIL-CLOSED: caído/timeout/parse/veto → HOLD. (Consecuencia asumida: el floor riqueza≥3 holdea perfiles genéricos legítimos parejo/low-data; tensión no resuelta en diseño.)

IA ATADA + AFG (Capa 2, editor no redactor, temp 0.4): esqueleto casi-final en el prompt; contrato de tokens FROZEN/MUTABLE/PROHIBIDO INTRODUCIR. AFG puro por sección pre-rehydration: allowed = tokens(esqueleto) ∪ factCard ∪ allowedScenes ∪ SAFE_VOCAB ∪ {__NAME__,__SPORT__,edad}; 4 tiers (número, nombre propio, léxico episódico, actor ajeno); allowedNumbers GLOBAL compartido {topCount,12} (no per-sección); léxico episódico ampliado a eventos minúscula (el clásico/la final/el mundial) es/en/pt; detector de estado emocional de mini-juego (lexicón cerrado) en sección motor. Licencia de "gesto genérico del deporte" REVOCADA (deporte solo como slot-sustantivo validado, posiciones/roles fuera del display). Deporte con D3-validación (largo/control-chars/blacklist) tokenizado __SPORT__, nunca crudo en el prompt. __NAME__/__SPORT__ se rehidratan DESPUÉS de todos los checks. Presupuesto: AbortController + deadline t0+54s, caps 18/16/16s; corrección única cross-provider al proveedor opuesto; guard que sobrevive → degrada a esqueleto (grounded por construcción); ambos proveedores caídos → señal ai_unavailable → HOLD; corazón sucio/faltante → HOLD.

3 ESTADOS: E1 feliz (0 fallback, IA individualizó todo); E2 IA-degradada por sección CON TECHO (≤1 sección no-CORE en estático curado, respeta procedencia); E3 HOLD (cualquier defecto duro). Columnas persistidas en perfilamientos: report_status('pending'|'ready'|'held'|'sent'), held_reason, held_at, held_alert_level, retry_count, last_error, report_qc jsonb, evidence_ficha jsonb, judge_score + CHECK NOT VALID + índices parciales + recrear current_perfilamiento (CREATE OR REPLACE verificado en staging) + NOTIFY pgrst.

HOLD (decisión PERSISTIDA no rama de runtime): alerta al admin UNA sola vez en el borde pending→held (race-safe por UPDATE...WHERE report_status<>'held' RETURNING) + agregación global por ventana sobre el dedup per-row; reusa sendAlert de qa-monitor inlineado (Resend qa@ + Telegram). Escalado por SLA: held_at<now-Xh (2-4h) sin resolver → segundo aviso mayor severidad. Vista admin "Informes retenidos" (query report_status='held'). POST /api/admin-approve-report (auth admin, por id) re-corre QC + re-judge y si pasa marca ready + llama send-email, sin ventana. El usuario ve "preparando" es/en/pt buyer-neutral sin guiones en 3 superficies (OnboardingFlowV2 end-screen, ReportPage /report/:id, one-panel); nunca 404 ni informe a medio armar.

CRON durable (report-recovery-cron, NO puede importar src/lib → todo inline/persistido): query accionable incluye held WHERE held_class='auto' AND retry_count<bound (AUTO-holds sí se reintentan); claim atómico de fila (status='processing' / SKIP LOCKED, sin runs solapados); regenera desde evidence_ficha (no flat cols); cuenta retry_count; ambos proveedores caídos/axis_mismatch/ficha ausente tras N intentos → transición a held + alerta (NO continue silencioso, NO reintento infinito); query excluye held('human')/sent; desacoplado de la ventana de 6h; stuck-sweeper sin ventana (ninguna fila pending sobrevive sin verse); held_reason='sin_email' con captura admin.

CLAIM ATÓMICO DE ENVÍO (send-email): guard 409 si status≠ready; claim atómico UPDATE...SET report_status='sent' WHERE report_status IN('ready') RETURNING ANTES de Resend; send-ledger con clave de idempotencia escrita PRE-Resend (sin catch que oculte la marca); email_sent_at estampado exclusivamente en el bloque post-Resend gateado por ready; arco de reenvío resend con status IN('ready','sent'); template:'report'|'unlock' (absorbe admin-grant-access). /api/report gate server-side: si status≠ready/sent devuelve shape "preparando", nunca ai_sections. Auditar los 6 callers (path vivo, cron, one-complete, resend en Sessions.tsx y TenantPlayers.tsx, unlock/full_access) para que ninguno arme su propio envío.

CUTOVER: feature-flag report_gate_enabled + orden de deploy (emisor de verdict → seal-report → guard de send-email ÚLTIMO); flip incremental por-idioma y por-eje solo cuando contenido completo + shadow gate HOLD-rate comprendido + seal recompute==verdict 100% + discriminación intra-celda>azar + delivery sin doble-envío. Métrica tasa_fallback (ratio, día-1) objetivo ≤1%; HOLD NO cuenta como informe roto enviado.

---

### REGISTRO DE HUECOS + MEDICIÓN + LÍMITES (adjudicación de los 55 ataques, huecos abiertos, ganchos de medición y límites data-gated del engine del informe Argo)

FUENTES: METODO-ENGINE-DEFINITIVO.md §3 (registro de 55 ataques) y §4 (los 3 huecos que solo cierran con datos/build); METODO-CALCULO-NUEVO.md §13 (límites inherentes visibles) y §14/§14.1 (trazabilidad≠validez + agenda empírica). Fine-tuning nuevo: src/lib/dischSignals.ts.

== ADJUDICACIÓN DE LOS 55 ATAQUES ==
Total 55 = Ángulo1(11 IA-fabrica) + Ángulo2(9 datos-degenerados) + Ángulo3(11 Barnum) + Ángulo4(14 entrega/concurrencia) + Ángulo5(10 coherencia/i18n). Veredictos: 38 CERRADO (incl. A3.1 "cerrado con consecuencia", A3.2/A3.11 "cerrado en diseño" data-gated), 7 ACEPTADO con mitigante (A1.6, A1.9, A1.11, A3.9, A4.11, A4.14, A5.2), 10 ABIERTO 🔴. OJO: el header de §3 dice "ABIERTOS: 7" pero enumera 10 (7 fabricación + 3 contenido/i18n) — el conteo correcto es 10; es una errata a corregir en el doc.

Los 10 🔴 ABIERTOS se agrupan en dos familias-raíz:
- Familia fabricación-en-prosa/Barnum (7): A1.1 (fabricación conductual recombinando tokens permitidos), A1.5 (contradicción de eje sin nombrarlo), A1.10 (todo recae en un juez estructuralmente incapaz), A3.3 (juez ciego al Barnum relacional/single-report), A3.4 (~144 esqueletos = 1 texto por eje para toda la población), A3.5 (perfil modal parejo = el más Barnum), A3.7 (momentos apagados en los perfiles más nítidos). A1.5/A1.10/A3.3/A3.4/A3.5/A3.7 son EL MISMO hueco visto desde 6 ángulos.
- Familia contenido/i18n (3): A3.10 + A4.6 (I/S/C + en/pt sin autorar) + A5.3 (i18n roto de raíz, buildReportHero sin lang).

== LOS 3 HUECOS EXPLÍCITOS (§4) ==
🔴 HUECO 1 (CASO CENTRAL, no residual) — Fabricación conductual en prosa ordinaria + Barnum intra-eje. Ataques A1.1/A1.5/A1.10/A3.3/A3.4/A3.5/A3.6/A3.7. El post-hoc NO lo cierra por dos razones estructurales: (1) el AFG es un diff de tokens — recombinar tokens permitidos en una afirmación nueva y falsa no introduce ningún token nuevo; (2) el juez es single-report — no accede a verdad externa ni ve que 40 niños del mismo eje recibieron el mismo párrafo; premiar "rico y coherente" premia la fabricación plausible. Solo lo cierran TRES prongs de build+volumen: (a) generación restringida construida (IA reescribe SOLO tokens del esqueleto + entity-diff de afirmaciones conductuales), hoy inexistente, medida en shadow; (b) métrica de discriminación intra-celda corrida a VOLUMEN (2AFC in-product desde el usuario #1) — hasta ese volumen "el engine identifica" es HIPÓTESIS, no hecho; (c) más señal por-niño genuina (dischSignals + ESCENA_LITERAL construido + módulos científicos). CONSECUENCIA operativa irresoluble en diseño: el floor de riqueza≥3 que evita el Barnum HOLDEA los perfiles genéricos legítimos (parejo/low-data) → o holdeás mucho o shippeás Barnum.

🔴 HUECO 2 (LAUNCH-GATE DURO) — Cobertura de contenido + i18n. Ataques A3.10/A4.6/A5.3. Prosa I/S/C (hoy solo D esbozado) y espejos en/pt no escritos → ~75% de perfiles no-D y 100% de en/pt quedan en HOLD. Fail-closed es correcto (HOLD > basura) pero no es parcheable: requiere autoría gateada por sign-off de voz del owner + revisión nativa en/pt. Es precondición dura del flip, no residual.

HUECO 3 (data-gated, menor) — Validez del motor. Ataque A5.2 residual. Bandas de tempo son "referencia bibliográfica"; corte p33/p67 real por celda necesita ~500 juegos/celda de población Argo (excl. demo/owners); el confound de latencia de dispositivo (teléfonos ajenos) no está instrumentado; edad en meses reales necesita capturar DOB. Hasta entonces: motor con IC ancho, copy probabilístico, framing de lente-separada.

== EL FINE-TUNING (dischSignals.ts) FRENTE A LOS HUECOS ==
Las 3 señales (receta = orden completo de los 4 ejes con presencia intra-individual; contingencia = qué eje eligió por contexto de escena; ritmo acoplado = rápido/lento contra su propia mediana) son la prong (c) de HUECO 1 (más señal por-niño). NO cierran HUECO 1 solas: siguen faltando generación restringida y medición a volumen. La REGLA DE ORO ("no decirle verde a un chico rojo": toda afirmación individual se gatea por robustez, sin patrón claro se calla o baja al literal) es la implementación on-model del principio anti-fabricación. Gates de robustez ya codificados: contingencia afirma patrón SOLO con ≥2 escenas y mayoría estricta (support≥2 Y > secondSupport; empate→"varía"); ritmo devuelve null si base<3 por lado o |brecha|<0.5; receta es hecho puro (conteos ordenados). Marca desvíos (esDesvio: eje del patrón ≠ primario = "cambia de registro").

== GANCHOS DE MEDICIÓN A INSTRUMENTAR ==
1. tasa_fallback: ratio existe día-1; % de informes con ≥1 sección fallback/held; objetivo ≤1%; ventana 7d; alerta si >1% → afinar prompt/guards, NO sumar filtros. HOLD cuenta como retención correcta, no como "roto enviado". Registrada por informe (§9 + FALLBACK L94).
2. Discriminación INTRA-CELDA con decoys (mismo eje+veta+registro, distinto niño, contra azar 1/2), NO inter-eje. El carril inter-eje se conserva SOLO como piso-de-sanidad (reconcilia A3.2/A3.11). Sintético da número día-1; scripts/qa/discrimination.mjs falla CI si distancia < umbral.
3. Widget 2AFC in-product → tabla report_discrimination_probe, acumulado desde el usuario #1; la correlación del sintético con reconocimiento humano real solo se prueba a volumen.
4. Control Forer/Barnum (§13.8/§14.1#5): reconocimiento del informe real vs genérico/barajado; mide cuánto del "acierto" es efecto Barnum.
5. Monitor poblacional de ejes opuestos (§3.2/O1/R4-H2): fracción de vetas afirmadas (B2≥4 ∧ B≥1 = primario con brecha ≥1, NO "definido") que caen en el eje diagonal opuesto, contra nulo 1/3; masa esperada ≈0.30%. <1/3 → circumpleja real; ≥1/3 → sospecha de artefacto de ítems → alimenta revisión del banco (§13/B2). No cambia ningún informe.
6. Shadow de gate/sello: report_qc loguea verdicts; seal-report recompute == verdict de generate-ai = 100% coincidencia; label-divergencia inesperada de evidence_ficha = 0 (precondiciones de cutover 2 y 3).

== LAUNCH-GATES (cutover binario, §5) ==
Flag report_gate_enabled se enciende POR IDIOMA y POR EJE (nunca global) solo cuando TODAS: (1) contenido completo del segmento (EJE_BASE autorado + sign-off de voz del owner + seedQuality.test verde); (2) shadow de gate con HOLD-rate comprendido y label-divergencia=0; (3) seal-report recompute==verdict 100%; (4) discriminación intra-celda sintética > azar en todas las celdas del segmento; (5) delivery verificado (claim atómico + send-ledger sin doble-envío; /api/report no filtra ai_sections sucios). Mientras un segmento no cumpla (1), su flag queda apagado y sus informes se retienen held('language_mismatch'|'cobertura_eje') con SLA humano visible. Segmento inicial habilitable = es + D.

== LÍMITES DATA-GATED (§13, cada uno con su dato — §14.1) ==
§13.1 comparación no válida para el perfil (ipsativo); motor normativo admite lectura relativa a edad con IC ancho pero nunca rankea/selecciona. §13.2 certeza acotada por la NATURALEZA del instrumento (no calibración) → techo tentativo para TODO B, máximo "con claridad" → dato: test-retest. §13.3 cambio NO ESTIMABLE sin test-retest (no un cero medido) → evolución solo descriptiva, sin RCI/SEM → dato: dos tomas cercanas en cohorte. §13.4 validez de constructo no establecida, sin homogeneidad ítem-eje el claim honesto es "eligió la familia X" (no "tiene el eje X") → dato: análisis a nivel ítem (question_id ya persistido). §13.5 muestra autoseleccionada (norma etiquetada dinámicamente). §13.6 motor de una toma con valencia, latencia de dispositivo NO controlada, percentil intra-celda no controla varianza madurativa, casi-unicidad≠precisión → dato: latencia de dispositivo por sesión + test-retest. §13.7 el nulo vale solo si el banco está balanceado y el nulo uniforme NO es la única alternativa (tendencias no-DISC/deseabilidad direccional, D subseleccionada → "Definidos" de artefacto); P(banda)="referencia optimista"; edades 8-10 flagueadas → dato: tasas base de ELECCIÓN por opción (nulo de deseabilidad + paridad de tasa de elección por eje). §13.8 Barnum/Forer agravado por el lenguaje tentativo no-deficitario; asumido, no corregido por copy → dato: control Forer. §13.9 RIESGOS ASUMIDOS por el owner (2026-07-06), registrados TEXTUAL sin editorializar, NO mitigados: (a) sustantivo-arquetipo a 8-11; (b) nombre usable de facto como selección de menores en clubes; el owner avanza SIN techo de nombramiento por edad ni informe de club separado. §13.10 asentimiento 13-16 + vista del niño = gancho ético-legal PENDIENTE (no límite estadístico) → entregable: flujo de consentimiento por edad + vista objetable del niño. §14: trazabilidad/reproducibilidad ≠ validez; prohibido presentar "determinista" como evidencia de "verdadero"; claim máximo permitido: anclado en teoría, foto del presente, no clínico.

---

### FICHA DETERMINISTA + MOTOR + CÁLCULO (Capa 1a del engine del informe Argo v4)

ARQUITECTURA. Capa 1a es una función PURA y TOTAL: (12 respuestas + métricas de mini-juego + edad + versión + ficha previa) → `EvidenceFicha` jsonb AUTOCONTENIDA que regenera el informe entero sin la DB de origen (requisito del cron que no importa src/lib). Regla dura transversal: el NOMBRE sale SOLO de `votes`, el motor nunca nombra, y ninguna palabra de tempo (Dinámico/Rítmico/Sereno/Observador/Rápido/Medio/Lento/reflexivo/ágil) entra a `arquetipoLabel`.

CONTRATO EvidenceFicha (evidenceFicha.ts): `{version:4, methodVersion:'v4', questionVersion, votes:VotesEvidence, motor:MotorInsight, gameMetricsRaw}` + (PENDIENTE) `respuestas:AnswerRecord[12]` embebido {questionId,axis,responseTimeMs,signatureScene} para que tormenta/meta/momentos/evolución/ritmo regeneren desde la ficha sola. Todo serializable a jsonb.

VOTOS Y ORDEN. vector = conteos crudos por eje (suman 12). Orden canónico AXIS_ORDER=['D','I','S','C'], sort estable descendente por conteo, empate → menor índice (cosmético por construcción). ejePrimario=1º, ejeSecundario=2º. Derivados: B=top−second (gatea el PRIMARIO), B2=second−third (gatea la VETA, nunca por B), topCount/secondCount/thirdCount, nEjesFuertes=#{conteo ≥ topCount−1}, secundarioEmpatado=(secondCount===thirdCount).

BANDA (por B): B≥4 'definido', B≥2 'con_matices', else 'mezcla'. REGISTRO de TONO 4 niveles (owner 2026-07-07, SUPERSEDE el 3-niveles 'mezcla|tentativo|claridad' del plan §1.1 — eliminar on sight): B≥6 'rotundo' (cita la cifra "apareció en N de 12"), B≥4 'claro', B≥2 'matices', B≤1 'parejo'. Los 4 SIEMPRE nombran el perfil; la firmeza es sobre el DATO (margen de votos, un hecho), la lectura queda en presente/tendencia (nunca rasgo permanente). 'rotundo' usa la única excepción R4-A permitida: "marcado" describe el MARGEN DE VOTOS de la toma, jamás al niño ni al rasgo.

GATES DE NOMBRE Y VETA. nameGate(B,topCount)= B≥4 || (B≥2 && topCount≥7) (masa nula 7.68%, vs viejo B≥2∧top≥6=20.90%). classifyVetaBanda(B2): B2≥4 'afirmada', B2≥2 'tentativa', else 'sin'. vetaOpuesta = isOppositeAxis(prim,sec) por mapa OPPOSITE (D↔S, I↔C). vetaEnNombre = (vetaBanda==='afirmada' && !vetaOpuesta && nombrarPrimario). CALIBRACIÓN DE VALOR (owner 2026-07-07): el nombre YA NO se gatea a ausencia — SIEMPRE hay perfil + veta en el encabezado; el gate/registro solo dice CUÁN definido está. Target canónico = `perfilTipo` familia-aware {familia:'lider|duo|versatil|parejo', label, primario, secundario, coLideres[], vetaMostrada} y `arquetipoLabel = perfilTipo.label` (R1). El actual "[Primario] con veta [Secundario]" incondicional (profileResolver l.307) queda ELIMINADO. Veta opuesta SÍ figura en el encabezado pero con label de CO-OCURRENCIA ("Impulsor y Sostenedor", conector "y", vocabulario positivo), nunca "con veta"/"pero".

CASCADA DE 7 FORMAS (classifyForma sobre conteos ordenados desc, evalúa B=0 primero; reproduce EXACTO las 455 comps, cada forma ≥1 comp, masas suman 100.00%, ninguna cruza banda): B=0 & nFuertes===2 → duo_empate (30/9.85%); B=0 & nFuertes≥3 → equilibrio (17/12.94%); B=1 & second≥4 → duo (72/16.65%); B=1 resto → versatil (12/19.83%); B∈{2,3} → lider_acompanante (132/33.67%, nombre único solo si topCount≥7); B∈{4,5} → definido (88/6.27%); B≥6 → muy_definido (104/0.79%). LeveHaciaUno eliminado (0 de 455). classifyForma DEBE ser la MISMA función en el resolver y en test-formas.mjs.

CONSTANTES DEL NULO (nullDistribution.ts, congeladas, reproducidas por enum-bandas.mjs a 0.01%): P_B, NAME_GATE_MASS (7.68/5.70/20.90), P_B2 marginal + condB1 (denominador P(B≥1)=77.21%: le1=75.72, range2to3=23.14, ge4=1.15), BLEND_NULL (blend nombrado 0.092%, no-opuesto 0.061%, monitor opuestos 0.295%), FORMA_STATS. Enumeración multinomial(12,¼), NO Monte Carlo. Las P son "referencia optimista" hasta re-enumerar contra nulo de deseabilidad.

MOTOR — insight cronométrico per-child, lectura NORMATIVA por edad, IC ANCHO siempre, JAMÁS para rankear/seleccionar (MotorInsight en evidenceFicha.ts). Pipeline age-fair (ageNorms.ts): (1) factorEdad(edadMeses) = interpolación POR MESES entre anclas {8:1.45,9:1.38,10:1.30,11:1.23,12:1.16,13:1.10,14:1.05,15:1.02,16:1.00}, clamp años [8,16]; (2) ageFairMs = raw/f (reescalado MULTIPLICATIVO Kail: piso Y rango escalan por el mismo f; nunca escalar solo el piso); (3) tempoScore = 0.50·score(decision.af) + 0.50·score(reaction.af), clamp[0,100] — Adaptación NO entra al tempo (alimenta §5 "ante lo inesperado"); extraTaps/inertiaErrors FUERA del número (impulsivityBonus/errorPenalty ELIMINADOS); (4) tempoZona. narratable exige Juego A (latencia/decision) Y Juego B (reacción); Adaptación faltante NO bloquea. Motor OPCIONAL: narratable=false ⇒ sección omitida limpio (buildMotorSection→null). Confianza 'media' solo decisión+reacción+reacomodo; el resto 'baja' (color). normaLabel dinámico: 'referencia_bibliografica' hasta que el dato Argo domine la celda, luego 'poblacion_argo'. GUARDS requeridos por engine-definitivo §2: narratable también exige isFinite(edadMeses) && 96≤edadMeses≤192 && avg finito>0 && nTrials≥MIN_TRIALS_TEMPO(3); guard NaN: !isFinite(edadMeses) ⇒ edadValidaParaMotor=false (no propagar NaN a tempo). SubMotor persiste {rawMs, ageFair, nTrials, percentilCelda, ic:[lo,hi] ancho, zona, confianza}. tempoZona canónico = null (=>'intermedio') salvo que el IC quede ENTERO de un lado del corte p33/p67 de celda; si cruza, degrada a intermedio. DIVERGENCIA de valor (owner 2026-07-07, data-gated HUECO 3): como NO hay normas p33/p67 reales aún, ageNorms actual bandea por corte fijo de score (≥60 rapido, ≤40 lento) con percentilCelda=null e IC placeholder ±25%; la honestidad vive en copy probabilístico + framing de presente + normaLabel='referencia_bibliografica', no en negarse a leer.

FICHA GATE = ÚNICA AUTORIDAD DE DATOS (fichaGate.ts, evaluateFichaGate, PENDIENTE). HOLD DURO solo por: sum(votos)≠12, respuestas.length≠12, axis inválido, questionId desconocido. Edad inválida / juegos faltantes ⇒ motorDrop (DEGRADA, no HOLD). ESCENA_LITERAL ausente ⇒ themeDegrade (nunca indexa undefined). nEjesFuertes===4 (3-3-3-3) ⇒ enruta a plantilla 'parejo' (NO HOLD, NO veta arbitraria). questionVersion required en ingest (400 si falta; sin default 'unknown'). El QC posterior (qualityGate) ESPEJA evaluateFichaGate, no lo contradice.

SEÑALES DISC INDIVIDUALES (dischSignals.ts, fine-tuning owner 2026-07-07, deterministas sobre votes+respuestas, REGLA DE ORO: toda afirmación individual gateada por robustez; sin patrón claro se calla o baja a literal; nunca decir "verde" a un chico "rojo"): (1) RECETA = orden de los 4 ejes con presencia intra-individual (principal / presente≥3 / apenas≥1 / ausente) — es un hecho. (2) CONTINGENCIA = qué eje eligió por contexto de escena; SOLO contextos multi-escena MULTI_CONTEXTS=['inicio','adversidad','esfuerzo'] (CONTEXT_MAP_V4 versionado con questionVersion); afirma patrón SOLO con mayoría estricta (support≥2 && support>secondSupport), empate ⇒ contextosVaria; marca esDesvío cuando eje≠primario. (3) RITMO ACOPLADO = fastRate del primario vs no-primario contra la propia mediana; null si <3 respuestas primarias o <3 no-primarias, o si |brecha|<0.5 (silencio conservador).

EDGE CASES canónicos: 12-0-0-0 → muy_definido/rotundo, sin veta (secondCount=0). 4-3-3-2 (B=1,second=3) → versatil, sin nombre único. 5-3-2-2 (B=2,top=5<7) → lider_acompanante pero co-líderes (nameGate false). 6-2-2-2 (B=4) → definido, nombra (aunque top=6). 3-3-3-3 (B=0,nFuertes=4) → equilibrio/parejo, secundario=null (no veta arbitraria). D con veta S → vetaOpuesta=true, vetaEnNombre=false (se resuelve en cuerpo). edadMeses NaN → edadValidaParaMotor=false, motorDrop (sin propagar NaN). Sin Juego A o B → narratable=false, sección motor omitida.

---

### CONTENIDO + CALIBRACIÓN DE VALOR + LAS 15 SECCIONES del informe Argo v4

## Principio maestro de calibración (owner 2026-07-07)
UN solo criterio en todo el informe: **afirmar con valor + lenguaje probabilístico ("tiende a") + UNA salvedad de presente que nombra el dato concreto, y SIEMPRE dar algo**, sin cruzar el piso ético (nunca rasgo permanente como identidad, nunca ranking entre chicos, nunca clínica/afecto). El proceso de expertos empujó a la cautela hasta el no-valor; el fix recupera valor sin bajar el piso. Contraste rector: "Mateo ES de acción" (PROHIBIDO, rasgo-identidad) vs "esta toma SE DEFINE por la acción" (PERMITIDO, presente sobre el dato). Firme sobre el DATO (número de votos, forma), presente/tendencia sobre la LECTURA (el chico).

## Las 6 reglas de calibración de valor
1. **Firme sobre el dato + presente sobre la lectura.** Verbo firme ("se define por X", "se apoya de lleno en X") reservado a registros altos; "se inclina" es tentativo. La cifra topCount/12 es el dato más creíble y floor-safe: debe llegar al copy en rotundo/claro (hoy se computa pero nunca se muestra).
2. **Temas con valor, no no-respuesta.** Ningún tema cae en encogimiento de hombros. Tormenta 1-1-1 → sensibilidad al contexto nombrando las 3 escenas. Tormenta 2/3 → peldaño tentativo intermedio. Meta → tip accionable. Inesperado → conductas que conviven ("y", nunca "pero"). Grupo → lectura por I y por S nombrados + acompañamiento positivo.
3. **Evolución en positivo (dos planos).** RASGO: prohibido "cambió/estable/mejoró". REGISTRO: permitido describir lo que las dos fotos mostraron (hecho de las fichas). Mismo eje → "aire de familia... por ahora esto es lo que aparece"; ejes distintos → co-ocurrencia + desactivar "cambió de personalidad" + salvedad + cierre con valor. Dashboard = "foto nueva de cómo juega hoy", no "trayectoria".
4. **UNA salvedad, no la pila.** "Foto/no etiqueta" UNA vez en el marco al pie; el cuerpo describe (el "tiende a" ya hace el trabajo).
5. **Motor cronométrico bandeado.** 3 zonas (rapido/intermedio/lento) por percentil age-fair; léxico cronométrico, nunca disposicional. La cancha es donde el ritmo SE APLICA. Motor OPCIONAL (narratable=false → omitido). Lente separada del perfil de votos.
6. **"Cuando le sale bien" (En la meta) anclado al perfil.** Escena literal Q12 + micro-rótulo n=1 + tip accionable, nunca "maneja el éxito".

## Sacar la pila de disclaimers (partir visible/colapsable)
VISIBLE = 3 barandas (no se compara entre niños, no se selecciona/descarta, no es diagnóstico) + nota al adulto. COLAPSABLE "cómo se hizo" = Barnum, validez no establecida, muestra autoseleccionada, motor con valencia. Reglas internas que NUNCA se muestran: R4-J ("no es cómo regula su frustración real"), R4-C ("es el mismo cuestionario cortado"), §14 ("trazabilidad ≠ validez").

## Fine-tuning: 3 señales individuales DISC (dischSignals.ts) → contenido
REGLA DE ORO transversal: toda afirmación individual se GATEA por robustez; sin patrón claro se calla o baja al literal (nunca decirle "verde" a un chico "rojo").
- RECETA: orden completo de los 4 ejes con presencia intra-individual (principal/presente/apenas/ausente). Hecho, alimenta perfil/tendencia/ecos.
- CONTINGENCIA: qué eje eligió por contexto (inicio/adversidad/esfuerzo multi-escena; resto literal). Afirma patrón SOLO con mayoría estricta ≥2 Y > resto; empate → "varía"; marca desvíos (esDesvio = "cambia de registro"). Alimenta "cómo decide" y "ante la tormenta".
- RITMO ACOPLADO: rápido/lento contra su propia mediana (conservador); null si base<3 o brecha<0.5. Alimenta el matiz de tempo de decisión, distinto del motor.

## Las 15 secciones (contrato: presencia siempre · largo/forma fijos · caso nulo definido) + marco al pie
Nombre canónico eje×veta. perfilTipo SIEMPRE no-null en 4 familias (lider/duo/versatil/parejo); arquetipoLabel = perfilTipo.label. Tono escala con registro. Voz validada = informe de Mateo (probabilística, tuteo, sin guiones, "foto del presente").
1 Su perfil · 2 Banda (meter = forma, no confianza) · 3 Su motor (opcional) · 4 Cómo decide/patrón de decisión (contingencia+ritmo) · 5 Qué lo enciende · 6 Palabras puente/ruido · 7 Guía rápida · 8 Checklist Antes/Durante/Después · 9 Consejo de reset · 10 En la meta (cuando le sale bien) · 11 Ante la tormenta (solo 3/3) · 12 Ante lo inesperado (dos lentes) · 13 Cuánto lo mueve el grupo (I y S separados) · 14 Ecos · 15 Cómo viene evolucionando · + [FIJO] Marco al pie (3 barandas + foto una vez + nota al adulto + dependencia declarada).

## Sustrato curado anti-explosión (records TOTALES por enum)
Cada sección depende de UN driver-dimension (~77 unidades/idioma ×3 = 231). Clases: EJE (Record<Axis,_>), TONO (registro-keyed), ZONA (motor), PATRON, VETA (12 pares + sin-veta), RELACIONAL, EVOLUCION, INVARIANTE. Records TOTALES: celda faltante NO COMPILA (mata EJE_BASE_DRAFT_ES: Partial, hoy solo D). Plantilla vs Dato: prosa fija espejada es/en/pt + slots cerrados; {cifra} solo rotundo/claro; {escena}/{opcionTexto} verbatim de momentos.seleccionados[]. QC build-time (seedQuality.test): cada seed pasa qualityGate + rango de largo + lint de opuestos.

---

## 3. LISTA DE VERIFICACIÓN MAESTRA

> Cada ítem: `[ ]` decisión — **esperado** — **verificar**. Tildar tras construir.

### PERFIL + NAMING + SEÑALES DISC

- [ ] **NAME-01** — El perfil se nombra como blend eje×veta: `[Eje primario] con veta [Eje secundario]`, ambos ejes derivados SOLO de las elecciones (votos DISC), nunca del tempo.
  - *Esperado:* buildVotesEvidence (profileResolver.ts) construye arquetipoLabel desde AXIS_ARCHETYPE_LABEL_ES[ejePrimario] + veta del ejeSecundario; el motor/tempo no participa del label. evidenceFicha.ts documenta la regla dura.
  - *Verificar:* Grep: el label nunca contiene 'Dinámico/Rítmico/Sereno/Observador/Rápido/Medio/Lento'. Test unitario: dado un vector, el label es exactamente '[label primario] con veta [label secundario]'.
- [ ] **NAME-02** — Mapa fijo eje→label del primario: D→Impulsor, I→Conector, S→Sostenedor, C→Estratega (es); Driver/Connector/Sustainer/Strategist (en); Impulsionador/Conector/Sustentador/Estrategista (pt).
  - *Esperado:* AXIS_ARCHETYPE_LABEL_ES en profileResolver.ts y AXIS_ARCHETYPE_LABEL (es/en/pt) en archetypeContentV4.ts coinciden con archetype-naming.md.
  - *Verificar:* Comparar los 3 records es/en/pt contra la tabla 'Primarios puros' de archetype-naming.md; los 4 valores por idioma deben coincidir exactamente.
- [ ] **NAME-03** — La veta es el 2.º eje más votado, un EJE (Impulsor/Conector/Sostenedor/Estratega), NUNCA una palabra de tempo.
  - *Esperado:* getVetaLabel(axis,lang) devuelve 'con veta X' / 'with a X lean' / 'com veta X'; el segundo término usa el label del arquetipo del eje secundario.
  - *Verificar:* Test getVetaLabel para D/I/S/C en es/en/pt; verificar que en NO invierte el orden (no 'Dynamic Driver').
- [ ] **NAME-04** — Existen exactamente 12 etiquetas nombrables: 4 primarios puros + 8 blends no-opuestos. NO 4×3=12 ingenuo (excluye opuestos), NO 132.
  - *Esperado:* TENDENCIA_CONTENT keyed por par [primario]_[secundario] cubre los 8 pares no-opuestos; los 4 pares diagonales no tienen fila.
  - *Verificar:* Enumerar los pares P_S posibles: 12 no-opuestos existen como content, los 4 opuestos (D_S,S_D,I_C,C_I) NO forman nombre. Contra tabla 'Blends no-opuestos (8)' de archetype-naming.md.
- [ ] **NAME-05** — Eje ≠ arquetipo: el eje S se llama 'Sostén' (cualidad); el arquetipo/veta usa 'Sostenedor'. No unificar.
  - *Esperado:* AXIS_LABELS (designTokens.ts) usa 'Sostén' para el eje; el label del arquetipo usa 'Sostenedor'.
  - *Verificar:* Grep AXIS_LABELS: S = 'Sostén'; el label de arquetipo/veta = 'Sostenedor'. En en: eje 'Supporter' vs nombre 'Sustainer'.
- [ ] **NAME-06** — El tempo (Dinámico/Rítmico/Sereno/Observador, Rápido/Medio/Lento) sale del nombre por completo; vive solo en 'Su motor'. Prohibido también el léxico disposicional del tempo.
  - *Esperado:* Ningún label/veta contiene palabras de tempo; MOTOR_INSIGHT_TEMPLATES usa léxico cronométrico; motor-gate bloquea 'reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso'.
  - *Verificar:* Content-linter que grepea las palabras de tempo en cualquier arquetipoLabel/veta. qa:unit falla si aparecen.
- [ ] **NAME-07** — Nombres PROHIBIDOS (borrar on-sight, es/en/pt): los 12 eje×tempo viejos, metáfora antigua (El Capitán/La Brújula/El Explorador/El Tanque), esquema de adjetivos, esquema blog viejo.
  - *Esperado:* FORBIDDEN_OLD_LABELS en api/tenant-chat.ts + label_violation en migración ai_events invierten: los 12 eje×tempo pasan a prohibidos.
  - *Verificar:* Content-linter (Fase 10) grepea los 12 eje×tempo en src/ y api/; ai_events.label_violation los marca. 0 hits en código nuevo (v4).
- [ ] **NAME-08** — El nombre se concatena en runtime (label + veta): un grep de string contiguo NO lo caza. El linter debe mirar la composición.
  - *Esperado:* El content-linter compone label+veta antes de chequear, no busca literales contiguos.
  - *Verificar:* Test del linter con un caso 'Impulsor con veta Estratega' compuesto en runtime: el linter lo detecta pese a no existir como literal.
- [ ] **OPP-01** — Los pares diagonales (D↔S, I↔C) nunca forman nombre compuesto: si la veta cae en el eje opuesto, NO entra al nombre aunque B2≥4; el nombre se queda en el primario.
  - *Esperado:* buildVotesEvidence: vetaEnNombre = vetaBanda==='afirmada' && !vetaOpuesta && nombrarPrimario. isOppositeAxis usa OPPOSITE={D:S,S:D,I:C,C:I}.
  - *Verificar:* Test: vector con B2≥4 donde secundario=opuesto → vetaEnNombre=false, vetaOpuesta=true. Contra nullDistribution.OPPOSITE.
- [ ] **OPP-02** — La veta opuesta se narra en el cuerpo como dos conductas que CO-OCURREN, con label de co-ocurrencia en el encabezado ('Impulsor y Sostenedor', NO 'con veta'), vocabulario de eje positivo, conector 'y' nunca 'pero'.
  - *Esperado:* perfilTipo con vetaOpuesta=true produce label de co-ocurrencia; opuesto-guard bloquea 'raro/inusual/en tensión/contradictorio' y el 'pero'. OPPOSITE_TENDENCIA_KEYS=['D_S','S_D','I_C','C_I'] auditados.
  - *Verificar:* seedQuality.test lint de opuestos: 0 hits de conflicto en los 4 pares diagonales. Opuesto-guard test bloquea las 4 palabras + 'pero' cuando vetaOpuesta=true.
- [ ] **OPP-03** — No se degrada la confianza extra por opuesto (B2 ya midió separación real); el primario mantiene su banda por B. El cap es solo sobre el destino de la veta (cuerpo, no nombre).
  - *Esperado:* vetaOpuesta no toca banda ni registro; solo redirige el destino de la veta.
  - *Verificar:* Test: dos vectores con misma B pero uno con veta opuesta → misma banda/registro; solo difiere vetaEnNombre.
- [ ] **OPP-04** — Monitor poblacional de opuestos: fracción de vetas afirmadas (B2≥4 ∧ B≥1) que caen en el opuesto vs nulo 1/3; <1/3 circumpleja real, ≥1/3 sospecha de artefacto de ítems. No cambia ningún informe.
  - *Esperado:* Telemetría poblacional; constantes BLEND_NULL.oppositeMonitorJoint=0.295 (P(B2≥4∧B≥1∧opuesto)); nulo condicional 1/3.
  - *Verificar:* Verificar que el monitor lee B≥1 (no B≥4) y compara contra 1/3. BLEND_NULL en nullDistribution.ts coincide con spec §7.
- [ ] **GATE-01** — B = votos(1º)−votos(2º) gatea el PRIMARIO; B2 = votos(2º)−votos(3º) gatea la VETA; son independientes.
  - *Esperado:* buildVotesEvidence: B=topCount−secondCount, B2=secondCount−thirdCount.
  - *Verificar:* Test con vector 8-3-1-0: B=5, B2=2. Verificar independencia (B2 no usa B).
- [ ] **GATE-02** — BANDA de confianza a 3 niveles: B≥4 'definido', B=2-3 'con_matices', B=0-1 'mezcla'.
  - *Esperado:* classifyBanda(B) en nullDistribution.ts.
  - *Verificar:* Test classifyBanda: B=4→definido, B=3→con_matices, B=2→con_matices, B=1→mezcla, B=0→mezcla.
- [ ] **GATE-03** — NAME-GATE del primario: sustantivo único solo si B≥4 O (B≥2 ∧ topCount≥7). Masa nula 7.68% (el viejo B≥2∧top≥6=20.90% retirado).
  - *Esperado:* nameGate(B,topCount) = B>=4 || (B>=2 && topCount>=7). NAME_GATE_MASS.adopted=7.68.
  - *Verificar:* Test nameGate: 6-2-2-2 (B=4,top=6)→true; 5-3-2-2 (B=2,top=5)→false; 7-4-1-0 (B=3,top=7)→true. NAME_GATE_MASS coincide con spec §3.1.
- [ ] **GATE-04** — VETA-BANDA: B2≤1 'sin', B2=2-3 'tentativa', B2≥4 'afirmada'. La veta entra al NOMBRE solo si B2≥4 ∧ no-opuesto.
  - *Esperado:* classifyVetaBanda(B2); vetaEnNombre exige vetaBanda==='afirmada' && !vetaOpuesta && nombrarPrimario.
  - *Verificar:* Test classifyVetaBanda: B2=4→afirmada, B2=3→tentativa, B2=1→sin. Y vetaEnNombre solo true cuando afirmada+no-opuesta+primario-nombrado.
- [ ] **GATE-05** — FORMA a 7 valores por cascada (B=0 primero): duo_empate/equilibrio/duo/versatil/lider_acompanante/definido/muy_definido. Ninguna forma cruza banda; masas suman 100.00%.
  - *Esperado:* classifyForma(sortedDesc) en nullDistribution.ts; nFuertes = ejes con conteo ≥ top−1.
  - *Verificar:* scripts/test-formas.mjs enumera las 455 y reproduce FORMA_STATS (comps 30/17/72/12/132/88/104, masas suman 100). qa:unit falla si drifta.
- [ ] **GATE-06** — Las masas del nulo se calibran por ENUMERACIÓN EXACTA de las 455 composiciones (no Monte Carlo), congeladas como constantes reproducibles.
  - *Esperado:* P_B, P_B2, NAME_GATE_MASS, BLEND_NULL, FORMA_STATS en nullDistribution.ts reproducidas por scripts/enum-bandas.mjs.
  - *Verificar:* scripts/enum-bandas.mjs + nullDistribution.test.ts reproducen cada constante; qa:unit falla ante drift.
- [ ] **PERF-01** — SIEMPRE se entrega un perfil con nombre de valor (100% de los chicos); nunca 'una mezcla entre X e Y' / 'no pudimos definirlo'. La banda comunica QUÉ TIPO de definición, no si hay nombre.
  - *Esperado:* perfilTipo familia-aware total (no-null); buildDisplayName nunca devuelve el fallback 'mezcla entre'.
  - *Verificar:* Test barrido de las 455 composiciones: perfilTipo.label !== null en 455/455; ninguno contiene 'no pudimos' ni 'mezcla entre X e Y' como no-dato.
- [ ] **PERF-02** — perfilTipo familia-aware es el label CANÓNICO (supersede el `[Primario] con veta [Secundario]` INCONDICIONAL de profileResolver.ts l.307). perfilFamilia ∈ lider|duo|versatil|parejo.
  - *Esperado:* perfilTipo={familia,label,primario,secundario,coLideres[],vetaMostrada}; se ELIMINA la construcción incondicional del label (l.306-307).
  - *Verificar:* Grep profileResolver.ts: la línea 'con veta ${...}' incondicional ya no existe; existe perfilTipo. C6 (qualityGate) compara perfilTipo.label.
- [ ] **PERF-03** — Derivación de familia: B≥2→'lider' label '[Primario]'; B=1&duo→'duo' 'Perfil de doble motor: [1º] y [2º]'; B=1&versatil→'versatil' 'Perfil versátil, con base [1º]'; B=0&duo_empate→'duo'; B=0&equilibrio→'parejo' secundario=null.
  - *Esperado:* Función pura que mapea (B, forma) a perfilFamilia + label, coLideres nombrados en duo/parejo.
  - *Verificar:* Tests por familia: 8-1-2-1(B≥2)→lider; 5-4-2-1(B=1,second≥4)→duo; 5-4-2-1... versatil rama B=1 second<4; 6-6-0-0→duo; 4-4-4-0→parejo.
- [ ] **PERF-04** — arquetipoLabel persistido = perfilTipo.label; la columna plana veta_eje guarda el EJE de veta (dashboard/query), nunca el string de display.
  - *Esperado:* Persistencia: arquetipoLabel=perfilTipo.label; veta_eje = eje secundario (D/I/S/C).
  - *Verificar:* Inspeccionar el insert/persistencia: veta_eje ∈ {D,I,S,C} o null; archetype_label = perfilTipo.label. C6 no HOLDea por mismatch (A2.1 CERRADO).
- [ ] **PERF-05** — Veta graduada SIEMPRE que exista: B2≥4 al nombre; B2=2-3 subtítulo tentativo ('con algo de X'); B2≤1 línea suave. No se tira valor ya computado.
  - *Esperado:* vetaMostrada refleja los 3 niveles; el render muestra subtítulo tentativo en B2=2-3 en vez de borrar.
  - *Verificar:* Test: B2=3 → subtítulo 'con algo de [X]' presente; B2≥4 → veta en el nombre; B2≤1 → línea suave, no borrado total (salvo secondCount=0).
- [ ] **PERF-06** — Solo se omite la veta si el 2.º eje tuvo 0 votos (mostrarla sería inventar una inclinación inexistente).
  - *Esperado:* En reportV4/perfilTipo: veta/subtítulo solo si secondCount>=1.
  - *Verificar:* Test vector D:12,I:0,S:0,C:0 → sin veta ni subtítulo; D:11,I:1 → línea suave de veta presente.
- [ ] **TONO-01** — 4 niveles de tono (registro) por margen B: B≥6 'rotundo', B=4-5 'claro', B=2-3 'matices', B=0-1 'parejo'. Los 4 nombran el perfil.
  - *Esperado:* classifyRegistro(B) en nullDistribution.ts; Registro type en evidenceFicha.ts.
  - *Verificar:* Test classifyRegistro: B=6→rotundo, B=5→claro, B=4→claro, B=3→matices, B=2→matices, B=1→parejo, B=0→parejo.
- [ ] **TONO-02** — 'rotundo' (B≥6) suena fuerte y CITA LA CIFRA ('apareció en 10 de 12'); es el único que enuncia el margen de votos (permitido por R4-A, floor-safe).
  - *Esperado:* leadParagraph case 'rotundo' incluye v.topCount + '/12'; meter level 4 ('De lleno').
  - *Verificar:* Test buildReportHero con B≥6: lead contiene topCount y '12'; meter.level===4.
- [ ] **TONO-03** — La firmeza es sobre el DATO (hecho); la lectura queda en presente/tendencia. 'esta toma se define por X' permitido; 'Mateo ES de acción' prohibido.
  - *Esperado:* leadParagraph usa 'se define/se apoya/se inclina' + 'Hoy/tiende a'; nunca copula de identidad.
  - *Verificar:* Grep de los 4 lead cases: contienen 'Hoy'/'tiende'/'se apoya'/'se inclina'/'se define'; el deterministic-guard bloquea 'es un/es de' como rasgo.
- [ ] **TONO-04** — Si se nombra el primario (B=4), el registro NO baja de 'con claridad' (decisión owner que contradice la letra de A9: claridad-en-presente ≠ intensidad-como-rasgo).
  - *Esperado:* classifyRegistro devuelve 'claro' en B=4 (no 'matices'); el band-guard permite 'con claridad' desde B≥4 en el carril nombrado.
  - *Verificar:* Test classifyRegistro(4)==='claro'. Verificar que el band-guard no bloquea 'con claridad' cuando registro==='claro' (B=4-5).
- [ ] **TONO-05** — El registro 'fuerte/marcado' queda ELIMINADO del band-guard salvo describir el MARGEN DE VOTOS de la toma ('el margen fue amplio esta vez'), nunca al niño ni al rasgo.
  - *Esperado:* band-guard bloquea 'fuerte/marcado' en toda banda como descriptor del niño/rasgo; permite el uso sobre el margen de votos.
  - *Verificar:* Test band-guard: 'X es marcado' → bloqueado; 'el margen fue marcado/amplio' → permitido. Ningún nivel de registro es 'fuerte'.
- [ ] **TONO-06** — El meter de confianza tiene 4 niveles alineados al registro: Parejo(1)/Con matices(2)/Claro(3)/De lleno(4).
  - *Esperado:* METER_LABELS=['Parejo','Con matices','Claro','De lleno'], METER_LEVEL={parejo:1,matices:2,claro:3,rotundo:4} en reportV4.ts.
  - *Verificar:* Test buildReportHero: meter.level coincide con METER_LEVEL[registro] para los 4 registros.
- [ ] **SIG-00** — REGLA DE ORO transversal: toda afirmación individual se gatea por robustez; un patrón se afirma SOLO con ≥2 escenas de acuerdo; una elección suelta es literal (nunca 'tiende a'); sin patrón claro se calla. Nunca decirle 'verde' a un chico 'rojo'.
  - *Esperado:* dischSignals.ts documenta la regla; cada extractor la aplica (contingencia ≥2 acuerdo, ritmo umbral 0.5, silencio ante ruido).
  - *Verificar:* Revisar los 3 extractores: ninguno emite afirmación de patrón sin cumplir su gate de robustez; tests dischSignals.test.ts cubren los casos de silencio.
- [ ] **SIG-01** — RECETA: orden completo de los 4 ejes con presencia intra-individual. Presencia: i=0 'principal'; count≥3 'presente'; count≥1 'apenas'; else 'ausente'. Es un HECHO intra-individual (no gateado).
  - *Esperado:* computeReceta(vector) ordena desc y asigna presencia; devuelve RecetaItem[] {axis,count,presencia}.
  - *Verificar:* Test computeReceta({D:8,C:3,I:1,S:0}) → [principal,presente,apenas,ausente] en orden D,C,I,S (dischSignals.test.ts).
- [ ] **SIG-02** — CONTINGENCIA: qué eje eligió por contexto. Solo los contextos con ≥2 escenas (MULTI_CONTEXTS=['inicio','adversidad','esfuerzo']) pueden formar patrón robusto; el resto es solo literal.
  - *Esperado:* CONTEXT_MAP_V4 mapea las 12 preguntas a contextos; computeContingencia solo evalúa MULTI_CONTEXTS.
  - *Verificar:* Test: contexto de escena única (disfrute/decision/espera/equipo/meta) nunca produce patrón; verificar CONTEXT_MAP_V4 versionado con questionVersion.
- [ ] **SIG-03** — CONTINGENCIA robustez: patrón robusto = mayoría estricta (support≥2 Y support>secondSupport); empate ⇒ contextosVaria ('cambia de registro'/'varía'), no patrón.
  - *Esperado:* computeContingencia: if(support>=2 && support>secondSupport) push patron; else contextosVaria.
  - *Verificar:* Test: contexto adversidad con [D,D,S] → patrón D support=2; con [D,S,C]→ empate → contextosVaria; con [D,S] (1-1)→varia (dischSignals.test.ts).
- [ ] **SIG-04** — CONTINGENCIA marca desvíos: esDesvio = axis del patrón ≠ primario (donde el chico 'cambia de registro' respecto de su eje dominante).
  - *Esperado:* Patron.esDesvio = axis !== primario.
  - *Verificar:* Test: primario=D, patrón adversidad=S → esDesvio=true; patrón=D → esDesvio=false.
- [ ] **SIG-05** — RITMO ACOPLADO: rápido/lento del primario contra SU PROPIA mediana (conservador, intra-individual). Silencio (null) si prim.length<3 o noPrim.length<3.
  - *Esperado:* computeRitmoAcople: filtra RTs válidos; requiere ≥3 en primario y ≥3 en no-primario; mediana de todos.
  - *Verificar:* Test: <3 respuestas del primario → null (dischSignals.test.ts caso de poca base).
- [ ] **SIG-06** — RITMO umbral de separación: brecha = fastRate(prim)−fastRate(noPrim); si |brecha|<0.5 ⇒ null (silencio, señal ruidosa). Dirección primario_rapido (brecha>0) / primario_lento.
  - *Esperado:* computeRitmoAcople: if(Math.abs(brecha)<0.5) return null; else {direccion, brecha:+toFixed(2)}.
  - *Verificar:* Test: separación <0.5 → null; ≥0.5 con brecha>0 → primario_rapido. Verificar redondeo a 2 decimales.
- [ ] **SIG-07** — Las 3 señales se computan sobre la ficha y alimentan las secciones individuales; deben quedar WIRED en la ficha (respuestas[] AnswerRecord embebidas) para regenerar determinista.
  - *Esperado:* resolveEvidenceFicha embebe respuestas:AnswerRecord[12] y computeDiscSignals(vector,answers,primario) en la ficha (hoy NO lo hace: gap abierto).
  - *Verificar:* Grep resolveEvidenceFicha: debe llamar computeDiscSignals y guardar respuestas[]. Test: la ficha regenera las 3 señales sin la DB de origen. (Estado actual: NO integrado — pendiente).
- [ ] **SIG-08** — CONTEXT_MAP_V4 debe versionarse con questionVersion (si cambia el banco de 12, el mapa de contexto puede desalinearse).
  - *Esperado:* El mapa se selecciona por questionVersion; un builder maneja conteos de tormenta n≠3 (A2.7) sin asumir estructura fija.
  - *Verificar:* Test con questionVersion desconocida → degrade limpio, no indexa undefined. Verificar guard per-celda.

### ENGINE FAIL-CLOSED — gate determinista + juez-IA + estados/HOLD + entrega durable (choke-point único de calidad del informe Argo)

- [ ] **CHOKE-01** — El único predicado que autoriza el envío es report_status='ready'. Ningún camino de entrega envía sin ese sello.
  - *Esperado:* api/send-email.ts: guard temprano que devuelve 409 y no envía si report_status!=='ready'. Los 6 callers (path vivo, cron, one-complete, resend en Sessions.tsx y TenantPlayers.tsx, unlock/full_access) delegan en este único endpoint; ninguno arma su propio envío.
  - *Verificar:* grep report_status api/send-email.ts muestra el guard 409; test: POST send-email con status='pending'/'held' → 409, sin llamada a Resend; auditar callers (grep resend/Resend en Sessions.tsx, TenantPlayers.tsx, one-complete.ts) confirma que ninguno instancia Resend directo.
- [ ] **CHOKE-02** — seal-report es el ÚNICO writer de report_status y RECOMPUTA el gate server-side; el browser no puede proponer el estado (cierra A4.1).
  - *Esperado:* api/seal-report.ts (NUEVO): recibe session_id, lee (ai_sections, evidence_ficha) de DB, corre qualityGate()+judgeQuality() server-side e ESCRIBE report_status. Ignora cualquier verdict/status del body.
  - *Verificar:* POST seal-report con body {report_status:'ready'} forjado sobre un informe que falla el gate → queda 'held', no 'ready'; el recompute server-side == verdict local en 100% de un set; ningún otro archivo hace UPDATE report_status='ready' (grep).
- [ ] **CHOKE-03** — El live path corre generación+gate+juez+sello en un endpoint server fire-and-forget; el niño siempre ve 'preparando', la entrega es por email (cierra A4.10).
  - *Esperado:* OnboardingFlowV2/one-complete disparan el endpoint server; el browser nunca sella ready ni recibe ai_sections en el flujo live; end-screen muestra PreparandoState.
  - *Verificar:* Completar cuestionario en dev → la pantalla final muestra 'preparando' (no el informe); el sello de report_status ocurre en un endpoint server (network tab: el browser no hace el UPDATE); el informe llega por email tras el sello.
- [ ] **GATE-01** — qualityGate() es función pura y determinista que corre SIEMPRE antes de sellar, sobre la versión __NAME__ pre-rehydrate, con contrato {pass,reasons[],sectionsStatic,provenance[]}. Ante duda: HOLD.
  - *Esperado:* src/lib/reportQuality.ts (NUEVO) exporta qualityGate(report,ficha,lang); codegen inline en seal-report vía scripts/gen-quality-gate.mjs + check:quality-gen (patrón gen:coach).
  - *Verificar:* reportQuality.test.ts verde con fixtures adversariales; check:quality-gen falla si el inline de seal-report driftea de la fuente; la función no toca red ni DB (pura).
- [ ] **GATE-02** — GROUP 1 DATOS (HARD) ESPEJA evaluateFichaGate, no lo contradice: edad→degrade, nEjesFuertes===4→plantilla parejo (NO HOLD), questionVersion validado en ingest.
  - *Esperado:* G1 llama/replica la lógica de fichaGate.ts: sum(vector)===12 && respuestas.length===12; child_name 1..40 sin control-chars/placeholder; eje/arquetipo resolubles; edad inválida NO holdea (degrada motor); 3-3-3-3 rutea a parejo.
  - *Verificar:* test: ficha edad fuera de rango → pass=true con motorDrop (no HOLD); ficha 3-3-3-3 → pass con plantilla parejo; ficha sum≠12 o respuestas.length≠12 → HOLD; A2.2/A2.3 no producen HOLD masivo.
- [ ] **GATE-03** — GROUP 2 FORMA + GROUP 3 BASURA (HARD): ≥5 secciones obligatorias no vacías (motor no cuenta), largos mínimos, y 0 placeholders/literales basura.
  - *Esperado:* G2: hero-lead/perfil/combustible/corazon/guia ≥180 chars c/u, total ≥900 chars, motor opcional. G3: 0 matches /\{[^}]+\}/ y 0 de undefined/null/NaN/Desconocido/unknown/[object Object].
  - *Verificar:* test: informe con sección <180 chars → HOLD; informe con '{nombre}' sin interpolar → HOLD; informe con 'undefined' → HOLD; informe sin motor pero 5 secciones completas → pass.
- [ ] **GATE-04** — GROUP 4 GUARDS (HARD, umbral 0): prohibited, deterministic (ampliado hedges de frecuencia + longitudinal), ground-truth con whitelist expandida a co-fuertes, band, closed-scene, name, language. Corren contra la plantilla pre-interpolación.
  - *Esperado:* Detectores en reportQuality.ts: deterministic incluye 'casi nunca'/'le cuesta'/'a los N años'/'desde chico'; ground-truth deriva whitelist de la ficha (incluye ejes co-fuertes cuando nEjesFuertes≥3/secundarioEmpatado, no top-2 fijo); closed-scene whitelist=momentos.seleccionados[]; name-guard 0 ajenos; language===langCode.
  - *Verificar:* test por guard: 'siempre es líder'→deterministic HOLD; 'casi nunca'→HOLD; escena fuera de seleccionados[]→closed-scene HOLD; nombre ajeno→name HOLD; output en 'en' con lang='es'→language HOLD; perfil co-fuerte con eje secundario mencionado→NO dispara ground-truth (A5.7).
- [ ] **GATE-05** — GROUP 5 PROCEDENCIA (HARD): HOLD si fallback-dominante (≥2 secciones CORE en fallback O >40% del total) O si el corazón (resumenPerfil/Retrato) cayó a fallback. Cierra el 'esqueleto disfrazado'.
  - *Esperado:* Cada sección lleva origen∈{ai,fallback}; el gate cuenta CORE en fallback y % total; el corazón en fallback es HOLD incondicional.
  - *Verificar:* test: 2 secciones CORE en fallback→HOLD; >40% total fallback→HOLD; corazón en fallback (resto ai)→HOLD; 1 sección no-CORE en fallback→pass como E2.
- [ ] **GATE-06** — GROUP 6 CONSISTENCIA (HARD): C6 compara perfilTipo.label (arquetipoLabel=perfilTipo.label canónico), secundarioEmpatado nombra co-líderes simétricos, opuestos con label de co-ocurrencia, sin lexemas de conflicto en pares opuestos.
  - *Esperado:* C6 usa perfilTipo.label (no arquetipoLabel vestigial l.307 eliminado); veta_eje guarda el eje no el display; opuestos renderizan 'Impulsor y Sostenedor'; regex de conflicto (raro/en tensión/pero le cuesta/contradice) sobre pares opuestos.
  - *Verificar:* test: perfil duo/parejo NO produce C6 HOLD masivo (cierra A2.1 59%); veta opuesta en subtítulo aparece con 'y' no 'con veta' (A5.10); par opuesto con 'en tensión'→HOLD.
- [ ] **GATE-07** — GROUP 7 REPETICIÓN (SOFT): intenta degradar una vez y re-QC; si sigue mal, HOLD. Jaccard trigramas<0.35 entre pares, sin oración idéntica, primeras 6 palabras no coinciden.
  - *Esperado:* G7 marcado SOFT en reportQuality.ts: al fallar, degrada la sección ofensora a estático y re-corre el gate; segundo fallo → HOLD.
  - *Verificar:* test: dos secciones con Jaccard>0.35 → primero intenta degradar, luego HOLD si persiste; una sección con oración idéntica repetida dispara la ruta SOFT.
- [ ] **JUDGE-01** — judgeQuality() (IA) corre SOLO sobre gate-PASS, con rúbrica 1-5 (coherencia 0.40, riqueza 0.30, interna 0.15, tono 0.15) y UMBRAL: ready sólo si overall≥3.5 Y coherencia≥3 Y riqueza≥3 Y vetoes===0.
  - *Esperado:* api/judge-quality.ts (NUEVO): recibe informe gate-PASS, devuelve {overall,coherencia,riqueza,interna,tono,vetoes[]}; el floor riqueza≥3 está explícito (cierra A3.1).
  - *Verificar:* test: informe con riqueza=2 (competente-intercambiable) → HOLD aunque overall≥3.5; coherencia=2 → HOLD; veto presente → HOLD; solo overall≥3.5 & coherencia≥3 & riqueza≥3 & 0 vetoes → ready.
- [ ] **JUDGE-02** — El juez es FAIL-CLOSED: caído/timeout/parse-error/veto → HOLD. Nunca deja pasar por 'no pude evaluar'.
  - *Esperado:* judge-quality.ts + seal-report: cualquier excepción/timeout/JSON no parseable del juez → held (held_reason='judge_unavailable' o similar), no ready.
  - *Verificar:* simular juez caído (timeout) → report_status='held'; JSON malformado del juez → held; ninguna rama devuelve ready ante fallo del juez.
- [ ] **JUDGE-03** — El few-shot de calibración incluye un caso 'competente-pero-intercambiable → riqueza 2' para anclar el floor de riqueza contra el Barnum bien formado.
  - *Esperado:* El prompt de judge-quality.ts trae ese few-shot explícito (no solo Barnum egregio).
  - *Verificar:* Leer el prompt: existe el ejemplo etiquetado riqueza 2 competente-intercambiable; eval offline sobre un texto genérico-pero-limpio → riqueza≤2.
- [ ] **AFG-01** — La IA es editor de tono (temp 0.4), no redactor: el esqueleto casi-final va en el prompt con contrato de tokens FROZEN/MUTABLE/PROHIBIDO INTRODUCIR.
  - *Esperado:* api/generate-ai.ts: invertir el fail-open (l.175 histórica); el esqueleto de reportV4 es el borrador; la tarea es pulido; temp 0.4.
  - *Verificar:* Leer el prompt de generate-ai: incluye el esqueleto completo + los 3 buckets de tokens; temp===0.4; el output solo reescribe tono, no agrega secciones.
- [ ] **AFG-02** — AFG (Anti-Fabricación por Grounding) puro por sección, pre-rehydration: allowed = tokens(esqueleto) ∪ factCard ∪ allowedScenes ∪ SAFE_VOCAB ∪ {__NAME__,__SPORT__,edad}, con 4 tiers (número, nombre propio, léxico episódico, actor ajeno).
  - *Esperado:* src/lib/reportGrounding.ts (NUEVO)+.test.ts; inline en generate-ai; corre sobre versión __NAME__ antes de rehidratar.
  - *Verificar:* reportGrounding.test.ts: token de número fuera del allowed → rebota; nombre propio ajeno → rebota; evento no-whitelisteado → rebota; test build-time corre AFG sobre TODAS las plantillas con 0 falsos positivos.
- [ ] **AFG-03** — allowedNumbers es GLOBAL compartido {topCount,12}, no per-sección aislado (cierra A5.8: repetir '12' no degrada CORE a HOLD).
  - *Esperado:* reportGrounding.ts: un set único de números permitidos para todo el informe, no reconstruido por sección.
  - *Verificar:* test: informe que repite '12' en 2 secciones → NO dispara AFG; A5.8 no produce HOLD.
- [ ] **AFG-04** — Licencia de 'gesto genérico del deporte' REVOCADA: el deporte aparece solo como slot-sustantivo validado; posiciones/roles fuera del display; nunca como observación de juego inventada (cierra A1.2/A1.4/A3.6).
  - *Esperado:* generate-ai + reportGrounding: SPORT_LEXICON sin posiciones; el prompt no autoriza inferir gestos deportivos; deporte solo como __SPORT__ sustantivo.
  - *Verificar:* test: output con 'como buen delantero se lanza' (rol/gesto no en ficha) → rebota; SPORT_LEXICON no contiene posiciones; A1.2/A1.4 marcados CERRADO por el guard.
- [ ] **AFG-05** — Deporte con D3-validación (largo/control-chars/blacklist), tokenizado __SPORT__, nunca crudo en el prompt (cierra A1.3 canal de inyección). __NAME__/__SPORT__ se rehidratan DESPUÉS de todos los checks.
  - *Esperado:* generate-ai: mismo D3 que el nombre para deporte; se pasa __SPORT__; la rehidratación ocurre post-QC/post-AFG.
  - *Verificar:* test: deporte con payload de inyección → sanitizado por D3, nunca alcanza el prompt crudo; el orden de operaciones rehidrata solo tras gate+AFG (grep rehydrate vs checks).
- [ ] **AFG-06** — Presupuesto de generación acotado: AbortController + deadline t0+54s, caps 18/16/16s; corrección única cross-provider; guard que sobrevive → degrada a esqueleto; ambos proveedores caídos → ai_unavailable → HOLD; corazón sucio/faltante → HOLD.
  - *Esperado:* generate-ai: AbortController por proveedor, caps por sección, una corrección al proveedor opuesto, degradación por sección (no 502 global), regla especial resumenPerfil/corazón→HOLD.
  - *Verificar:* test: proveedor primario cuelga → fallback con margen; ambos caídos → señal ai_unavailable → seal-report holdea; sección no-corazón sucia irreparable → estático (E2); corazón sucio → HOLD; NO hay 502 global (simular todos caídos → status held, no 502).
- [ ] **HOLD-01** — El estado es una decisión PERSISTIDA (no rama de runtime): columnas nuevas en perfilamientos con report_status/held_reason/held_at/held_alert_level/retry_count/last_error/report_qc jsonb/evidence_ficha jsonb/judge_score.
  - *Esperado:* Migración supabase/migrations/*_report_status_hold.sql: ADD COLUMN IF NOT EXISTS de las 9 columnas + CHECK NOT VALID sobre report_status + 2 índices parciales + CREATE OR REPLACE current_perfilamiento + NOTIFY pgrst.
  - *Verificar:* SELECT report_status,held_reason,held_at,retry_count,report_qc,evidence_ficha,judge_score FROM perfilamientos LIMIT 0 no error; la view expone report_status; PostgREST no 500ea (NOTIFY corrido); CHECK rechaza report_status inválido.
- [ ] **HOLD-02** — Tres estados con invariante: E1 (0 fallback), E2 (≤techo fallback, respeta procedencia), E3 (HOLD por defecto duro). Solo ready sale.
  - *Esperado:* seal-report clasifica: gate+juez PASS con 0 fallback → ready(E1); PASS con ≤1 no-CORE fallback → ready(E2); cualquier HARD fail o degradación por encima del techo → held(E3).
  - *Verificar:* test de máquina de estados: 0 fallback→ready; 1 no-CORE fallback→ready; ≥2 CORE fallback→held; el único estado que send-email acepta es ready/sent.
- [ ] **HOLD-03** — La alerta al admin se dispara UNA sola vez en el borde pending→held (race-safe), con agregación global por ventana además del dedup per-row; nunca por cada lectura de una fila ya held.
  - *Esperado:* seal-report/cron: UPDATE...WHERE report_status<>'held' RETURNING para ganar la carrera; sendAlert (Resend qa@ + Telegram) inlineado de qa-monitor; agregador por ventana.
  - *Verificar:* test: dos writes concurrentes sobre la misma fila → una sola alerta (RETURNING vacío en la perdedora); releer una fila held N veces → 0 alertas nuevas; outage masivo → alertas agregadas por ventana, no tormenta (A4.11).
- [ ] **HOLD-04** — El usuario ve 'tu informe se está preparando' (buyer-neutral 'el niño', es/en/pt, sin guiones) en las 3 superficies; nunca 404 ni informe a media frase.
  - *Esperado:* PreparandoState en OnboardingFlowV2 end-screen, ReportPage (/report/:id) y one-panel; se muestra cuando report_status≠ready/sent.
  - *Verificar:* Con una fila held: /report/:id muestra 'preparando' (no 404, no ai_sections); en/pt renderizan su copy; grep de guiones em/en en el copy → 0; el copy dice 'el niño' no 'tu hijo'.
- [ ] **HOLD-05** — Loop humano-en-el-loop: vista admin 'Informes retenidos' + POST /api/admin-approve-report (auth admin, por id) que re-corre QC+juez sobre el informe editado y, si pasa, marca ready + llama send-email. Sin ventana.
  - *Esperado:* api/admin-approve-report.ts (NUEVO): re-QC + re-judge + aprobar; vista admin con query report_status='held' (razones + edad del hold).
  - *Verificar:* POST admin-approve-report sobre un held editado que ahora pasa → ready + email enviado; sobre uno que sigue mal → permanece held; sin auth admin → 401/403; opera independiente del cron de 6h.
- [ ] **HOLD-06** — Escalado por SLA: si held_at<now-Xh (X=2-4h) sin resolver → segundo aviso de mayor severidad (held_alert_level).
  - *Esperado:* qa-monitor.ts (o cron) chequea held antiguos y sube held_alert_level + reenvía alerta escalada.
  - *Verificar:* test: fila held con held_at 3h atrás → segundo aviso disparado, held_alert_level incrementado; fila held reciente → sin escalado.
- [ ] **HOLD-07** — held_reason='sin_email' para filas sin adult_email + ruta de captura admin, para que nunca queden sin entregar en silencio (cierra A4.12).
  - *Esperado:* El flujo detecta adult_email ausente → held('sin_email'); la vista admin permite capturar el email y reintentar.
  - *Verificar:* perfilamiento sin adult_email → held_reason='sin_email' (no drop silencioso); la cola admin lo lista con acción de captura.
- [ ] **CRON-01** — El cron NO dropea en silencio ni reintenta infinito: cuenta retry_count; ambos proveedores caídos/axis_mismatch/ficha ausente tras N intentos → transición a held + alerta (no continue).
  - *Esperado:* api/report-recovery-cron.ts reworkeado: reemplazar los `continue` silenciosos (l.132/163/201) por incremento de retry_count y, al superar N, UPDATE a held + alerta.
  - *Verificar:* grep 'continue' en report-recovery-cron sin manejo → 0 (cada rama registra o holdea); simular fallo persistente → tras N intentos la fila queda held (no reintentada para siempre, no saltada).
- [ ] **CRON-02** — La query del cron incluye held WHERE held_class='auto' AND retry_count<bound (los AUTO-holds SÍ se reintentan) y EXCLUYE held('human')/sent (cierra A4.4).
  - *Esperado:* El SELECT del cron: status resolved AND (report_status='pending' OR (report_status='held' AND held_class='auto' AND retry_count<bound)); nunca toca held humano ni sent.
  - *Verificar:* test: fila held('auto') con retry<bound → la levanta el cron; fila held('human') → NO la toca (deja al humano); fila sent → excluida; A4.4 no queda en limbo.
- [ ] **CRON-03** — Claim atómico de fila (status='processing' / SKIP LOCKED) para que runs solapados no doble-generen ni doble-envíen (cierra A4.9).
  - *Esperado:* El cron reclama filas con UPDATE...SET processing WHERE ... RETURNING o SELECT FOR UPDATE SKIP LOCKED antes de trabajar.
  - *Verificar:* test: dos ejecuciones concurrentes del cron → cada fila procesada por una sola (RETURNING/SKIP LOCKED); no hay doble send-email para la misma fila.
- [ ] **CRON-04** — El cron regenera desde evidence_ficha (jsonb autocontenido), NO desde flat cols, porque no puede importar src/lib (cierra A4.13).
  - *Esperado:* report-recovery-cron pasa evidence_ficha a generate-ai; el tipo EvidenceFicha se inlinea; la ficha regenera el informe entero sin la DB de origen.
  - *Verificar:* test: fila con evidence_ficha completa regenera informe idéntico sin leer flat cols; grep import de src/ en el cron → 0; check:api-imports verde.
- [ ] **CRON-05** — Stuck-sweeper sin ventana: ninguna fila pending (ni processing colgado) sobrevive sin verse; el HOLD está desacoplado de la ventana de 6h.
  - *Esperado:* El cron barre pending/processing viejos sin límite temporal y los enruta a retry o held; independiente del filtro de 6h del cron original.
  - *Verificar:* test: fila pending de hace días → el sweeper la ve y la resuelve o holdea; fila 'processing' colgada (claim huérfano) → reclamada/reseteada; ninguna queda en limbo permanente.
- [ ] **SEND-01** — Claim atómico de envío: UPDATE...SET report_status='sent' WHERE report_status IN('ready') RETURNING ANTES de llamar a Resend (cierra A4.2 doble envío).
  - *Esperado:* send-email: el claim atómico gana el derecho a enviar; si RETURNING vacío (otro ya lo tomó), no envía.
  - *Verificar:* test: dos llamadas concurrentes a send-email sobre la misma fila ready → un solo Resend (una gana el claim, la otra RETURNING vacío); no hay doble email.
- [ ] **SEND-02** — Send-ledger con clave de idempotencia escrita PRE-Resend, sin catch que oculte la marca; email_sent_at estampado exclusivamente en el bloque post-Resend gateado por ready (cierra A4.3).
  - *Esperado:* send-email escribe la fila del send_ledger antes del fetch a Resend; email_sent_at se escribe solo tras éxito y solo en el path gateado por ready.
  - *Verificar:* test: fallo tras escribir ledger → el reintento ve la clave y no re-envía; ningún catch traga la escritura de email_sent_at; email_sent_at nunca se estampa fuera del bloque ready.
- [ ] **SEND-03** — Arco de reenvío: resend permitido con status IN('ready','sent') para no romper los resends legítimos de informes ya enviados (cierra A4.8).
  - *Esperado:* send-email distingue send inicial (claim ready→sent) de resend (acepta ready|sent) con template:'report'|'unlock' (absorbe admin-grant-access).
  - *Verificar:* test: resend de una fila 'sent' → permitido (no 409); resend de una 'held' → 409; unlock/full_access pasa por el mismo endpoint con template='unlock'.
- [ ] **SEND-04** — /api/report tiene gate server-side: si report_status≠ready/sent devuelve shape 'preparando', nunca ai_sections (cierra A4.7).
  - *Esperado:* api/report.ts: quitar ai_sections del path no-ready; devolver {status:'preparando'} cuando ≠ready/sent.
  - *Verificar:* GET /api/report para una fila held → respuesta sin ai_sections, con shape preparando; para una fila ready → informe completo; grep confirma que ai_sections solo se serializa en el branch ready/sent.
- [ ] **SEND-05** — Los 6 callers de envío quedan detrás del choke-point único; ninguno arma su propio Resend ni sella ready por su cuenta.
  - *Esperado:* Auditar path vivo, cron, one-complete, resend en Sessions.tsx y TenantPlayers.tsx, unlock/full_access: todos llaman send-email gateado, ninguno instancia Resend ni escribe report_status='sent' fuera del claim.
  - *Verificar:* grep Resend/resend en api/src fuera de send-email → 0 (o solo el inline autorizado); grep UPDATE report_status='sent' → solo en el claim atómico de send-email; cada caller pasa por el guard 409.
- [ ] **CUT-01** — Cutover gateado por feature-flag report_gate_enabled con orden de deploy estricto: emisor de verdict → seal-report → guard de send-email ÚLTIMO (cierra A4.5 no-entrega masiva).
  - *Esperado:* Flag report_gate_enabled; el guard 409 de send-email se activa último, cuando ya existe seal-report emitiendo ready.
  - *Verificar:* Con el flag off → comportamiento legacy (no holdea de más); orden de deploy documentado y respetado; no hay ventana donde send-email rechace todo porque seal-report aún no sella ready.
- [ ] **CUT-02** — El flip es incremental por-idioma y por-eje: un segmento solo se enciende con contenido completo + shadow gate comprendido + seal recompute==verdict 100% + discriminación intra-celda>azar + delivery sin doble-envío. tasa_fallback objetivo ≤1%, HOLD no cuenta como roto.
  - *Esperado:* El flag se evalúa por (idioma,eje); segmentos sin contenido quedan held('language_mismatch'|'cobertura_eje') con SLA humano visible; métrica tasa_fallback existe día-1.
  - *Verificar:* Segmento en/pt o eje no autorado → informes held con held_reason de cobertura (no basura, no drop); dashboard muestra tasa_fallback; 3-3-3-3/edad inválida NO inflan hold_rate (van a parejo/degrade); shadow report muestra 100% coincidencia seal-vs-verdict antes de flipear.

### REGISTRO DE HUECOS + MEDICIÓN + LÍMITES (adjudicación de los 55 ataques, huecos abiertos, ganchos de medición y límites data-gated del engine del informe Argo)

- [ ] **ATK-01** — Los 55 ataques quedan adjudicados con conteo exacto: 38 CERRADO / 7 ACEPTADO / 10 ABIERTO 🔴 (no 7).
  - *Esperado:* En METODO-ENGINE-DEFINITIVO.md §3 corregir el header 'ABIERTOS: 7' a 10 (7 fabricación + 3 contenido/i18n); mantener las 5 tablas de ángulo intactas.
  - *Verificar:* grep -c '🔴' en §3 devuelve 10; suma 38+7+10=55; cada ángulo suma 11/9/11/14/10.
- [ ] **HUECO1-01** — HUECO 1 (fabricación conductual en prosa + Barnum intra-eje) queda flagueado como caso CENTRAL, no residual.
  - *Esperado:* Nota al owner + §4 marcan 🔴 y NO lo declaran cerrado; ninguna capa post-hoc se presenta como su cierre.
  - *Verificar:* El doc y cualquier resumen de estado listan HUECO 1 como abierto; grep 'ABIERTO' sobre A1.1/A1.5/A1.10/A3.3/A3.4/A3.5/A3.7.
- [ ] **HUECO1-02** — 'El engine identifica' es HIPÓTESIS hasta la métrica intra-celda a volumen; el AFG no cierra la fabricación (diff de tokens ciego a recombinación).
  - *Esperado:* Ningún copy de producto/UI/marketing afirma 'identifica/detecta el perfil'; claim máximo 'anclado en teoría, foto del presente, no clínico'.
  - *Verificar:* grep de 'identifica|detecta|precisión' en copy es/en/pt = 0 hits afirmativos; el claim máximo aparece en §14.
- [ ] **HUECO1-03** — El juez single-report es ciego al Barnum relacional (A1.10/A3.3) y NO es el instrumento anti-Barnum.
  - *Esperado:* El juez/gate nunca se cita como prueba de individuación; el único detector de Barnum es la distancia léxica intra-celda offline.
  - *Verificar:* Docs y comentarios del juez lo describen como floor de calidad, no como validador de individuación; R5 rotulado 'presencia de deporte'.
- [ ] **HUECO1-04** — El floor de riqueza≥3 holdea perfiles genéricos legítimos (parejo/low-data): tensión no resuelta en diseño.
  - *Esperado:* Se monitorea hold_rate del segmento parejo/low-data; el floor NO se baja para 'destapar' envíos; se resuelve con contenido parejo-específico construido.
  - *Verificar:* El juez tiene riqueza≥3 como veto; existe telemetría de hold por familia parejo; no hay bypass del floor.
- [ ] **HUECO1-05** — dischSignals (receta/contingencia/ritmo) es UNA de 3 prongs de HUECO 1, NO su cierre; faltan generación restringida + medición a volumen.
  - *Esperado:* dischSignals se cablea a las secciones individuales del informe, pero el estado 'identifica' sigue flagueado y la generación restringida queda pendiente en shadow.
  - *Verificar:* grep confirma consumidor de computeDiscSignals en el builder del informe; el registro de huecos sigue marcando A3.4/A3.7 abiertos.
- [ ] **HUECO1-06** — REGLA DE ORO: toda afirmación individual gateada por robustez; sin patrón claro, se calla o baja al literal (no verde a un rojo).
  - *Esperado:* En dischSignals.ts: contingencia afirma solo con ≥2 escenas y mayoría estricta (support≥2 Y >secondSupport; empate→contextosVaria); ritmo null si base<3/lado o |brecha|<0.5; receta = conteos puros.
  - *Verificar:* dischSignals.test cubre: empate→'varía', |brecha|<0.5→null, base<3→null, patrón robusto→afirma; ningún path afirma tendencia desde 1 escena.
- [ ] **HUECO1-07** — Los momentos se apagan en los perfiles más nítidos (A3.7): la individuación real exige ESCENA_LITERAL construido + módulos científicos.
  - *Esperado:* ESCENA_LITERAL (onboardingData.ts versionado) construido con dueño; caso nulo cita escena representativa; sin dueño, momentos=[] queda flagueado como abierto.
  - *Verificar:* grep ESCENA_LITERAL poblado por questionVersion; en perfiles Definido los momentos no quedan siempre vacíos.
- [ ] **HUECO2-01** — HUECO 2: I/S/C + en/pt sin autorar → ~75% de perfiles no-D y 100% de en/pt en HOLD; launch-gate duro, no parcheable.
  - *Esperado:* Contenido D-only autorado; perfiles no-D y no-es se retienen held('cobertura_eje'|'language_mismatch') con SLA humano visible.
  - *Verificar:* archetypeContentV4 (.en/.pt) I/S/C no vacíos antes de flipear ese segmento; informes fuera de es+D quedan held con reason correcto.
- [ ] **GATE-01** — El flip de report_gate_enabled es POR IDIOMA y POR EJE, nunca global.
  - *Esperado:* Feature-flag scoped a (idioma, eje); segmento sin contenido completo permanece apagado sin afectar a los demás.
  - *Verificar:* Encender es+D no habilita en/pt ni I/S/C; el flag consulta (lang, eje) del informe.
- [ ] **GATE-02** — Cutover binario: 5 condiciones simultáneas por segmento.
  - *Esperado:* Checklist por segmento: (1) contenido+sign-off+seedQuality verde; (2) shadow gate HOLD-rate comprendido + label-divergencia=0; (3) seal recompute==verdict 100%; (4) discriminación intra-celda>azar en todas las celdas; (5) delivery sin doble-envío + /api/report no filtra sucio.
  - *Verificar:* Existe un runbook/gate que exige las 5 en verde antes de encender el flag de ese (lang,eje).
- [ ] **GATE-03** — Sign-off de voz del owner (I/S/C) + revisión nativa en/pt es precondición DURA del flip.
  - *Esperado:* Sin sign-off, el flip queda restringido a es+D; la autoría I/S/C y los espejos en/pt pasan revisión nativa (no traducción automática).
  - *Verificar:* No hay flip de un segmento sin registro de sign-off; seedQuality.test verde para ese segmento.
- [ ] **MED-01** — tasa_fallback ≤1% instrumentada día-1; HOLD cuenta como retención correcta.
  - *Esperado:* Métrica = % informes con ≥1 sección fallback/held; ventana 7d; alerta si tasa_fallback_7d>1% (afinar prompt/guards, no sumar filtros); registrada por informe.
  - *Verificar:* Query/telemetría de tasa_fallback existe; alerta configurada; HOLD no se contabiliza como 'roto enviado'.
- [ ] **MED-02** — Discriminación medida INTRA-CELDA (mismo eje+veta+registro, distinto niño, azar 1/2); inter-eje solo como piso-de-sanidad.
  - *Esperado:* scripts/qa/discrimination.mjs computa distancia intra-celda sintética y falla CI si < umbral; el carril inter-eje se conserva aparte, no como métrica principal.
  - *Verificar:* El script existe y usa decoys intra-celda; CI rojo cuando la distancia cae bajo el umbral en cualquier celda del segmento.
- [ ] **MED-03** — Widget 2AFC in-product acumula desde el usuario #1 en report_discrimination_probe; 'identifica' es hipótesis hasta volumen.
  - *Esperado:* Tabla report_discrimination_probe migrada; widget 2AFC (mismo arquetipo, distinto niño) escribe cada respuesta; ningún claim de identificación antes del volumen.
  - *Verificar:* La tabla existe con NOTIFY pgrst; el widget inserta filas; el registro de huecos mantiene la hipótesis abierta.
- [ ] **MED-04** — Control Forer/Barnum: reconocimiento del informe real vs genérico/barajado.
  - *Esperado:* Experimento que contrasta acierto del informe real contra uno genérico para cuantificar el efecto Barnum (cierra §13.8 cuando exista el dato).
  - *Verificar:* Diseño del experimento documentado en §14.1; §13.8 sigue listando Barnum como límite asumido hasta tener el dato.
- [ ] **MED-05** — Monitor poblacional de ejes opuestos: fracción veta=opuesto entre B2≥4 ∧ B≥1 vs nulo 1/3 (masa ≈0.30%).
  - *Esperado:* Telemetría que usa 'primario con brecha ≥1' (NO 'definido' B≥4, que da 0.012% sin potencia); <1/3→circumpleja real, ≥1/3→sospecha de artefacto de ítems; alimenta revisión del banco (§13/B2), no cambia informes.
  - *Verificar:* El monitor filtra B2≥4 ∧ B≥1; ningún informe cambia por su valor; el umbral de sospecha es 1/3.
- [ ] **MED-06** — Shadow de gate/sello: seal-report recompute==verdict de generate-ai=100% + label-divergencia inesperada=0.
  - *Esperado:* report_qc loguea verdicts en shadow; se mide coincidencia recompute vs verdict y divergencia de label de evidence_ficha antes del flip.
  - *Verificar:* Reporte de shadow muestra 100% coincidencia y 0 divergencias de label para el segmento antes de encender su flag.
- [ ] **LIM-01** — §13.2 certeza acotada por la NATURALEZA del instrumento (no calibración): techo tentativo para todo B, máximo 'con claridad'.
  - *Esperado:* Límite renderizado como componente fijo (§8.17); ningún copy sube intensidad por rareza del patrón; dato que cierra: test-retest.
  - *Verificar:* band-guard bloquea 'fuerte/marcado' en toda banda y 'con claridad' a B≤4; §13.2 visible en el informe.
- [ ] **LIM-02** — §13.3 la fiabilidad del cambio es NO ESTIMABLE sin test-retest (no un cero medido).
  - *Esperado:* Evolución (§15) SOLO descriptiva, sin RCI/SEM, sin 'cambió/estable/mejoró'; comparar solo entre misma method_version; dato que cierra: dos tomas cercanas en cohorte.
  - *Verificar:* grep en copy de evolución: 0 hits de 'cambió|estable|RCI|SEM'; §15 usa 'esta vez… la vez anterior…'.
- [ ] **LIM-03** — §13.4 validez de constructo no establecida; sin homogeneidad ítem-eje el claim es 'eligió la familia X', no 'tiene el eje X'.
  - *Esperado:* Copy usa 'eligió con más frecuencia la familia de opciones X'; question_id persistido por respuesta; dato que cierra: análisis a nivel ítem.
  - *Verificar:* question_id presente en answers; copy no dice 'tiene/es el eje X'; §13.4 visible.
- [ ] **LIM-04** — §13.6 motor de una toma con VALENCIA; latencia de dispositivo NO controlada; percentil intra-celda no controla varianza madurativa; casi-unicidad≠precisión.
  - *Esperado:* Motor servido normativo con IC ancho siempre, sin ranking/selección; se declara el N real de ensayos; NO se invoca 'control de latencia del dispositivo' como respaldo; dato que cierra: latencia por sesión + test-retest.
  - *Verificar:* Sección motor muestra IC ancho + N ensayos; grep 'latencia controlada|control de dispositivo' = 0; motor_narratable=false omite limpio.
- [ ] **LIM-05** — §13.7 el nulo vale solo si el banco está balanceado y el uniforme no es la única alternativa; P(banda)='referencia optimista'; edades 8-10 flagueadas.
  - *Esperado:* P(banda) rotuladas 'referencia optimista' hasta re-enumerar contra un nulo de DESEABILIDAD; dato que cierra: tasas base de ELECCIÓN por opción + paridad de tasa de elección por eje (reportar subselección de D).
  - *Verificar:* Docs/UI rotulan las P como referencia optimista; la agenda §14.1 lista la re-enumeración por deseabilidad; edades 8-10 marcadas.
- [ ] **LIM-06** — §13.8 efecto Barnum/Forer agravado por el lenguaje tentativo no-deficitario; asumido, no corregido por copy.
  - *Esperado:* §13.8 listado como límite visible; su cierre es MED-04 (control Forer), no una edición de copy.
  - *Verificar:* §13.8 presente en el componente de límites; no se declara resuelto por copy.
- [ ] **LIM-07** — §13.9 riesgos ASUMIDOS por el owner (2026-07-06), registrados TEXTUAL sin editorializar y NO mitigados por diseño.
  - *Esperado:* Se conserva el texto: (a) sustantivo-arquetipo a niños 8-11; (b) nombre usable de facto como selección de menores en clubes; el owner avanza SIN techo de nombramiento por edad ni informe de club separado.
  - *Verificar:* §13.9 aparece textual; no se cuela una mitigación silenciosa que contradiga la decisión del owner.
- [ ] **LIM-08** — §13.10 asentimiento 13-16 + vista del niño = gancho ético-legal PENDIENTE (no límite estadístico).
  - *Esperado:* Listado como pendiente en §13.10/§14.1#6; entregable: flujo de consentimiento/asentimiento por edad + vista del niño para ver/objetar su perfil.
  - *Verificar:* El gancho figura como pendiente y no se declara resuelto; no existe aún el flujo (verificable por ausencia de UI de asentimiento).
- [ ] **LIM-09** — §13.1 perfil ipsativo → no comparación entre niños; motor normativo con IC ancho pero nunca rankea/selecciona.
  - *Esperado:* Barandas §12/§8.16 renderizadas; prohibido mostrar barras de eje crudas comparables columna a columna entre niños; comparación cross-child solo cualitativa.
  - *Verificar:* La superficie del coach no ofrece grilla ordenable/agrupable por arquetipo ni barras crudas comparables; barandas visibles.
- [ ] **LIM-10** — §14 trazabilidad/reproducibilidad ≠ validez.
  - *Esperado:* Prohibido presentar 'determinista/reproducible' como evidencia de 'verdadero'; claim máximo: anclado en teoría, foto del presente, no clínico; prohibidos 'validado/diagnóstico/predice el rendimiento'.
  - *Verificar:* grep en copy de 'validado|diagnóstico|predice' = 0 hits; §14 presente como regla de discurso.

### FICHA DETERMINISTA + MOTOR + CÁLCULO (Capa 1a del engine del informe Argo v4)

- [ ] **FICHA-01** — EvidenceFicha es jsonb autocontenida y regenera el informe sin la DB de origen (cron no importa src/lib).
  - *Esperado:* evidenceFicha.ts: interface EvidenceFicha { version:4; methodVersion; questionVersion; votes; motor; gameMetricsRaw } — todos los campos serializables a jsonb.
  - *Verificar:* JSON.parse(JSON.stringify(ficha)) === ficha (round-trip); un test que reconstruye hero+motor+temas desde solo la ficha, sin acceso a game_metrics de la fila.
- [ ] **FICHA-02** — respuestas[12] embebidas en la ficha ({questionId,axis,responseTimeMs,signatureScene}); tormenta/meta/momentos/evolución/ritmo salen de la ficha sola.
  - *Esperado:* Agregar `respuestas: AnswerRecord[]` a EvidenceFicha y poblarlo en resolveEvidenceFicha; hoy NO existe (solo gameMetricsRaw).
  - *Verificar:* ficha.respuestas.length===12; grep en evidenceFicha.ts por `respuestas`; test: computeRitmoAcople/tormenta se calculan pasando SOLO la ficha.
- [ ] **FICHA-03** — El nombre sale SOLO de votos; ninguna palabra de tempo entra a arquetipoLabel.
  - *Esperado:* arquetipoLabel construido solo desde vector/ejePrimario/ejeSecundario; sin referencia a motor/tempoZona.
  - *Verificar:* regex sobre arquetipoLabel: 0 hits de /Dinámico|Rítmico|Sereno|Observador|Rápido|Medio|Lento|reflexivo|ágil/; test de todas las 455.
- [ ] **CALC-01** — vector = conteos crudos por eje, suman 12.
  - *Esperado:* buildVotesEvidence/resolveEvidenceFicha cuentan answers.axis en {D,I,S,C}.
  - *Verificar:* Object.values(vector).reduce(+)===12 para toda ficha válida; property test.
- [ ] **CALC-02** — Orden canónico AXIS_ORDER=['D','I','S','C'], sort estable, empate → menor índice (cosmético).
  - *Esperado:* sortedAxes = [...['D','I','S','C']].sort((a,b)=>vector[b]-vector[a]) (estable en V8).
  - *Verificar:* Test 3-3-3-3 ⇒ ejeSecundario=I (2º por índice); 0-0-0-0-tipo ties resuelven por orden D,I,S,C.
- [ ] **CALC-03** — B=top−second (gatea el primario); B2=second−third (gatea la veta, NUNCA por B).
  - *Esperado:* B=topCount-secondCount; B2=secondCount-thirdCount en buildVotesEvidence.
  - *Verificar:* profileResolver.test: la veta se clasifica con B2, no con B (6-1-1-... vs 4-4-1-... casos).
- [ ] **CALC-04** — nEjesFuertes=#{conteo ≥ topCount−1}; secundarioEmpatado=(second===third).
  - *Esperado:* sortedCounts.filter(x=>x>=topCount-1).length; secondCount===thirdCount.
  - *Verificar:* 3-3-3-3 ⇒ nEjesFuertes=4, secundarioEmpatado=true; 6-2-2-2 ⇒ nEjesFuertes=1.
- [ ] **CALC-05** — Banda por B: B≥4 definido, B≥2 con_matices, else mezcla.
  - *Esperado:* classifyBanda(B) en nullDistribution.ts.
  - *Verificar:* nullDistribution.test: classifyBanda(4)='definido', (2)='con_matices', (1)='mezcla'.
- [ ] **CALC-06** — Registro 4 niveles (owner 2026-07-07): B≥6 rotundo, B≥4 claro, B≥2 matices, else parejo; los 4 nombran; supersede el 3-niveles del plan.
  - *Esperado:* classifyRegistro(B); type Registro='parejo'|'matices'|'claro'|'rotundo'.
  - *Verificar:* grep 0 de 'tentativo'|'claridad' como valor de Registro en código/DB; classifyRegistro(6)='rotundo',(5)='claro',(3)='matices',(1)='parejo'.
- [ ] **CALC-07** — name-gate: B≥4 || (B≥2 && topCount≥7) (masa nula 7.68%).
  - *Esperado:* nameGate(B,topCount) en nullDistribution.ts.
  - *Verificar:* nameGate(4,6)=true; nameGate(2,5)=false; nameGate(2,7)=true; nameGate(1,any)=false.
- [ ] **CALC-08** — Veta por B2: B2≥4 afirmada, B2≥2 tentativa, else sin. vetaOpuesta por mapa D↔S,I↔C. vetaEnNombre=afirmada&&!opuesta&&nombrarPrimario.
  - *Esperado:* classifyVetaBanda(B2), isOppositeAxis(a,b), y el && en buildVotesEvidence.
  - *Verificar:* D+veta S ⇒ vetaOpuesta=true, vetaEnNombre=false; veta afirmada no-opuesta con nombre ⇒ vetaEnNombre=true.
- [ ] **CALC-09** — SIEMPRE hay perfil+veta en el encabezado (calibración de valor); el gate/registro solo dice cuán definido, nunca oculta el nombre.
  - *Esperado:* perfilTipo familia-aware total; arquetipoLabel=perfilTipo.label. Reemplaza nombrarPrimario:boolean+arquetipoLabel:null.
  - *Verificar:* buildVotesEvidence nunca devuelve arquetipoLabel null/'una mezcla entre'; test de las 455 ⇒ 100% con label no vacío.
- [ ] **CALC-10** — arquetipoLabel canónico = perfilTipo.label familia-aware (lider/duo/versatil/parejo); el '[Primario] con veta [Secundario]' incondicional queda ELIMINADO (R1).
  - *Esperado:* perfilTipo deriva: B≥2→lider '[Primario]'; B=1&duo→'doble motor: X y Y'; B=1&versatil→'versátil con base X'; B=0&duo_empate→duo; B=0&equilibrio→parejo (secundario=null). Opuesta→label co-ocurrencia 'X y Y'.
  - *Verificar:* grep profileResolver.ts l.~307: no queda el template incondicional; 3-3-3-3 ⇒ label 'Perfil parejo' (no 'Impulsor con veta Conector'); veta opuesta ⇒ 'Impulsor y Sostenedor' (no 'con veta').
- [ ] **CALC-11** — veta opuesta SÍ figura en encabezado como co-ocurrencia (conector 'y', vocabulario positivo), nunca 'con veta'/'pero'/'raro'.
  - *Esperado:* vetaOpuesta=true es flag de modo-de-copy; label usa 'y'.
  - *Verificar:* Los 4 pares D_S/S_D/I_C/C_I: 0 hits de /pero|raro|inusual|en tensión|contradic/ y el label usa 'y'.
- [ ] **FORMA-01** — Cascada de 7 formas reproduce EXACTO las 455 comps; cada forma ≥1; masas suman 100.00%; ninguna cruza banda; B=0 se evalúa primero.
  - *Esperado:* classifyForma(sortedDesc) en nullDistribution.ts + FORMA_STATS.
  - *Verificar:* node scripts/test-formas.mjs: enumera 455, cuenta por forma == {30,17,72,12,132,88,104}, suma masas==100.00%.
- [ ] **FORMA-02** — Reglas: B=0&nFuertes2→duo_empate, B=0&nFuertes≥3→equilibrio, B=1&second≥4→duo, B=1 resto→versatil, B∈{2,3}→lider_acompanante, B∈{4,5}→definido, B≥6→muy_definido.
  - *Esperado:* El if-cascade exacto de classifyForma.
  - *Verificar:* 4-3-3-2⇒versatil; 6-6-0-0⇒duo_empate; 4-4-4-0⇒equilibrio; 6-2-2-2⇒definido; 12-0-0-0⇒muy_definido.
- [ ] **FORMA-03** — classifyForma es LA MISMA función en resolver y en test-formas.mjs (no dos implementaciones que diverjan).
  - *Esperado:* resolver importa classifyForma de nullDistribution; el .mjs replica y se checa contra ella.
  - *Verificar:* Test cruzado: forma-en-ficha === forma-enumerada para las 455.
- [ ] **NULL-01** — Constantes del nulo congeladas y reproducibles por enumeración exacta (no Monte Carlo).
  - *Esperado:* nullDistribution.ts: P_B, NAME_GATE_MASS, P_B2 (marginal+condB1), BLEND_NULL, FORMA_STATS.
  - *Verificar:* node scripts/enum-bandas.mjs --check reproduce spec §7 a 0.01% (gate 7.68%, P(B2≥4|B≥1)=1.15%, blend no-opuesto 0.061%); nullDistribution.test verde.
- [ ] **MOTOR-01** — factorEdad = interpolación POR MESES entre anclas {8:1.45…16:1.00}, clamp años [8,16].
  - *Esperado:* ageNorms.factorEdad(edadMeses).
  - *Verificar:* factorEdad monótona decreciente; factorEdad(8*12)=1.45, (16*12)=1.00, (8.5*12)≈1.415 (interpola).
- [ ] **MOTOR-02** — Guard NaN/edad: !isFinite(edadMeses) o fuera de [96,192] ⇒ edadValidaParaMotor=false, motorDrop, sin propagar NaN a tempo.
  - *Esperado:* Guard en factorEdad/resolveMotorInsights; HOY factorEdad(NaN)=NaN se propaga (BUG a corregir).
  - *Verificar:* factorEdad(NaN) NO devuelve NaN (o el llamador cortocircuita); resolveMotorInsights con edadMeses=NaN ⇒ narratable=false, tempoScore=null.
- [ ] **MOTOR-03** — age-fair = raw/f (reescalado multiplicativo Kail: piso Y rango por el mismo f); nunca escalar solo el piso.
  - *Esperado:* ageNorms.ageFairMs(raw,f)=raw/f.
  - *Verificar:* ageFairMs(1000,1.25)=800; x/f neutraliza edad (test: mismo af para dos edades tras dividir).
- [ ] **MOTOR-04** — tempoScore = 0.50·score(decision.af)+0.50·score(reaction.af), clamp[0,100]; Adaptación NO entra al tempo.
  - *Esperado:* tempoScoreFromAgeFair(latencyAf,reactionAf) 0.50/0.50; adaptation solo alimenta §5.
  - *Verificar:* tempoScore no cambia al variar adaptation; test con adaptation nula ⇒ mismo score.
- [ ] **MOTOR-05** — impulsivityBonus y errorPenalty ELIMINADOS del número; extraTaps/inertiaErrors no mueven tempoScore.
  - *Esperado:* resolveMotorInsights sin bonus/penalty; RETIRAR la legacy resolveMotorFromGames (l.44 impulsivityBonus, l.55 errorPenalty) al migrar consumidores.
  - *Verificar:* grep 0 de impulsivityBonus|errorPenalty en el path v4; tempoScore invariante a extraTaps.
- [ ] **MOTOR-06** — narratable exige Juego A (decisión) Y Juego B (reacción) + avg finito>0 + nTrials≥MIN_TRIALS_TEMPO(3); Adaptación faltante NO bloquea.
  - *Esperado:* narratable = isFinite(edad)&&edad∈[96,192]&&decision.avg>0&&reaction.avg>0&&nTrials≥3. HOY solo chequea !!impulse&&!!rhythm (PARCIAL).
  - *Verificar:* Test: sin rhythm ⇒ narratable=false; nTrials=2 ⇒ narratable=false; avg=0 ⇒ narratable=false.
- [ ] **MOTOR-07** — Motor OPCIONAL: narratable=false ⇒ sección 'Su motor' omitida limpio, nunca HOLD.
  - *Esperado:* buildMotorSection devuelve null cuando !narratable (reportV4.ts).
  - *Verificar:* buildMotorSection(ficha con narratable=false)===null; el render omite la card.
- [ ] **MOTOR-08** — tempoZona = null (=>intermedio) salvo IC entero de un lado del corte p33/p67 de celda; IC ancho.
  - *Esperado:* tempoZonaFromScore/IC-crossing. DIVERGENCIA data-gated (HUECO 3): hoy bandea por corte fijo score ≥60/≤40, percentilCelda=null, IC placeholder ±25% (owner value-cal).
  - *Verificar:* Documentar la divergencia; test: con percentilCelda real, si IC cruza el corte ⇒ zona=null; normaLabel='referencia_bibliografica'.
- [ ] **MOTOR-09** — normaLabel dinámico: 'referencia_bibliografica' hasta que el dato Argo domine la celda, luego 'poblacion_argo'.
  - *Esperado:* MotorInsight.normaLabel; hoy hardcodeado 'referencia_bibliografica'.
  - *Verificar:* grep normaLabel; test futuro con población Argo ⇒ 'poblacion_argo' cuando peso_celda domina.
- [ ] **MOTOR-10** — SubMotor persiste rawMs, ageFair, nTrials, percentilCelda, ic[lo,hi] ancho, zona, confianza; adaptation age-corregida pero fuera del tempo.
  - *Esperado:* mkSub construye SubMotor con nTrials=arrays.length real; decision/reaction/adaptation.
  - *Verificar:* ficha.motor.decision.nTrials === games.impulse.latencies.length; adaptation presente pero no en tempoScore.
- [ ] **GATE-01** — evaluateFichaGate = ÚNICA autoridad de datos; el QC posterior la espeja, no la contradice.
  - *Esperado:* fichaGate.ts (NUEVO): evaluateFichaGate(ficha)→{hold, motorDrop, themeDegrade, routeParejo, reason}.
  - *Verificar:* Existe fichaGate.ts; qualityGate GROUP 1 llama/espeja evaluateFichaGate; test de coincidencia de veredicto.
- [ ] **GATE-02** — HOLD DURO solo por: sum(votos)≠12, respuestas.length≠12, axis inválido, questionId desconocido.
  - *Esperado:* Los 4 predicados HARD en evaluateFichaGate.
  - *Verificar:* Fixtures: vector suma 11 ⇒ hold; respuestas.length=10 ⇒ hold; axis 'X' ⇒ hold; qid 'q99' ⇒ hold.
- [ ] **GATE-03** — Edad inválida / juegos faltantes ⇒ motorDrop (DEGRADA), NO HOLD.
  - *Esperado:* Rama motorDrop separada de HOLD.
  - *Verificar:* edad fuera de [96,192] ⇒ gate.motorDrop=true, gate.hold=false; falta Juego B ⇒ igual.
- [ ] **GATE-04** — nEjesFuertes===4 (3-3-3-3) ⇒ plantilla 'parejo' (NO HOLD, NO veta arbitraria).
  - *Esperado:* Ruteo a familia parejo con secundario=null.
  - *Verificar:* Ficha 3-3-3-3 ⇒ gate.routeParejo=true, gate.hold=false; el label no nombra una veta.
- [ ] **GATE-05** — ESCENA_LITERAL[qv][qid][axis] ausente ⇒ themeDegrade, nunca indexa undefined; conteo tormenta ≠3 se maneja (n∈{0,1,2,4}).
  - *Esperado:* Guard per-celda en builders de tormenta/meta/momentos.
  - *Verificar:* Celda faltante ⇒ texto genérico degradado, sin TypeError; n=2 tormenta ⇒ contextual, no asume 3.
- [ ] **GATE-06** — questionVersion required en ingest (400 si falta); sin default 'unknown'.
  - *Esperado:* api/session + one-complete validan questionVersion; resolveEvidenceFicha no defaultea 'unknown' en el path de prod.
  - *Verificar:* POST sin questionVersion ⇒ 400; no aparece ficha con questionVersion='unknown' en prod.
- [ ] **SIG-01** — RECETA = orden de los 4 ejes con presencia intra-individual (principal / presente≥3 / apenas≥1 / ausente); es un hecho.
  - *Esperado:* dischSignals.computeReceta(vector).
  - *Verificar:* computeReceta([D5,I3,S1,C0]) ⇒ presencias principal/presente/apenas/ausente; primer item siempre 'principal'.
- [ ] **SIG-02** — CONTINGENCIA solo en contextos multi-escena (inicio/adversidad/esfuerzo); afirma patrón SOLO con mayoría estricta (support≥2 && support>secondSupport); empate ⇒ 'varía'; marca esDesvío si eje≠primario.
  - *Esperado:* computeContingencia + CONTEXT_MAP_V4 + MULTI_CONTEXTS.
  - *Verificar:* adversidad D,D,I ⇒ patrón D support2>1; adversidad D,I,S ⇒ contextosVaria (empate); esDesvio true cuando axis≠primario.
- [ ] **SIG-03** — RITMO ACOPLADO = fastRate primario vs no-primario contra la propia mediana; null si <3 prim o <3 noPrim, o |brecha|<0.5 (silencio conservador).
  - *Esperado:* computeRitmoAcople(answers,primario).
  - *Verificar:* Con 2 respuestas primarias ⇒ null; brecha 0.3 ⇒ null; brecha 0.6 ⇒ {direccion,brecha}.
- [ ] **SIG-04** — REGLA DE ORO: toda afirmación individual se gatea por robustez; sin patrón se calla o baja a literal; nunca decir 'verde' a un chico 'rojo'.
  - *Esperado:* Los tres extractores devuelven null / contextosVaria en vez de forzar un patrón débil.
  - *Verificar:* Fixture ruidoso (sin mayoría, poca base) ⇒ patrones=[], ritmoAcople=null; ninguna sección afirma tendencia.
- [ ] **EDGE-01** — Casos borde canónicos verificados end-to-end.
  - *Esperado:* profileResolver.test cubre 12-0-0-0, 4-3-3-2, 5-3-2-2, 6-2-2-2, 3-3-3-3, D+veta S, edad NaN, sin Juego A/B.
  - *Verificar:* 12-0-0-0⇒muy_definido/rotundo/sin veta; 5-3-2-2⇒co-líderes sin sustantivo; 6-2-2-2⇒definido nombra; 3-3-3-3⇒parejo; D+S⇒vetaOpuesta/no en nombre; NaN⇒motorDrop; falta juego⇒motor omitido.

### CONTENIDO + CALIBRACIÓN DE VALOR + LAS 15 SECCIONES del informe Argo v4

- [ ] **VAL-01** — perfilTipo SIEMPRE no-null: 100% de los chicos reciben nombre con valor en 4 familias (lider/duo/versatil/parejo). La incertidumbre la comunica el REGISTRO, nunca la ausencia de nombre. Se elimina buildDisplayName→'una mezcla entre X e Y' como no-dato.
  - *Esperado:* buildReportHero.arquetipoLabel string no-null en los 4 casos; leadParagraph cubre rotundo/claro/matices/parejo sin rama 'no pudimos definirlo'. arquetipoLabel = perfilTipo.label.
  - *Verificar:* Test: vectores 12-0-0-0, 5-3-2-2, 6-6-0-0, 3-3-3-3 → hero.arquetipoLabel no-vacío y sin 'mezcla entre'/'no pudimos'. Grep 'una mezcla entre' en el path de nombre = 0.
- [ ] **VAL-02** — El tono escala con el margen de votos en 4 registros canónicos: parejo|matices|claro|rotundo. Eliminar 'mezcla/tentativo/claridad/fuerte/marcado' como registros.
  - *Esperado:* Registro type = 'parejo'|'matices'|'claro'|'rotundo'; METER_LEVEL mapea 1-4; cada builder selecciona variante TONO por ese enum.
  - *Verificar:* grep de los 4 valores como únicos de Registro; ausencia de 'fuerte'/'marcado' como registro. Record<Registro,_> exige exactamente 4 claves (tsc).
- [ ] **VAL-03** — Firme sobre el DATO, presente sobre la LECTURA. 'esta toma se define por X' permitido; 'X es de acción' prohibido (rasgo-identidad).
  - *Esperado:* Ningún template usa 'es un [arquetipo]'/'X es [rasgo]'. deterministic-guard rebota 'es un líder/siempre/nunca'. Todo tema usa 'tiende a/suele/prefirió'.
  - *Verificar:* seedQuality.test: deterministic-guard sobre TODAS las plantillas = 0 hits. Grep ' es un '/' es de ' + arquetipo en templates = 0.
- [ ] **VAL-04** — La cifra topCount/12 llega al copy en rotundo y claro (dato floor-safe más creíble; hoy se computa y no se muestra).
  - *Esperado:* leadParagraph 'rotundo' y 'claro' interpolan v.topCount ('la eligió en {topCount} de sus 12 momentos'). Slot {cifra} SOLO en rotundo/claro.
  - *Verificar:* Render B≥5 contiene el dígito de topCount y '12'; AFG allowedNumbers global={topCount,12}. Grep {cifra} en matices/parejo = 0.
- [ ] **VAL-05** — 4º registro 'rotundo' para B≥6 que enuncia el margen de votos (floor-safe), rompiendo el techo plano (12-0-0-0 no suena igual que 7-2-2-1).
  - *Esperado:* Registro incluye 'rotundo'; leadParagraph case 'rotundo' presente y distinto de 'claro'.
  - *Verificar:* Test: B≥6 → registro='rotundo', lead ≠ lead de B=4/5. 'marcado' solo como descriptor del margen de votos, nunca del niño.
- [ ] **VAL-06** — Al nombrar el primario el registro no baja de 'con claridad' (owner override de A9: claridad-en-presente ≠ intensidad-como-rasgo).
  - *Esperado:* Perfil nombrado (name-gate pass) → registro verbal ≥ 'claro'; 'se inclina' solo para no-nombrado. band-guard permite 'con claridad' en perfil nombrado.
  - *Verificar:* Test: perfil nombrado no renderiza 'se inclina' como verbo principal; band-guard no rebota 'con claridad' ahí. Tensión con A9 documentada.
- [ ] **VAL-07** — UNA salvedad de presente por afirmación, nombrando el dato; nunca una pila de hedges que anule el valor.
  - *Esperado:* Cada template tiene ≤1 cláusula de salvedad ('hoy'/'por ahora'/'en esta toma'); no encadena 2+.
  - *Verificar:* Lint de conteo: ninguna sección con >1 marcador de salvedad de la lista cerrada. Revisión de voz vs Mateo.
- [ ] **VAL-08** — 'Foto del presente/no etiqueta' UNA sola vez, en el marco al pie; NO se repite en el cuerpo (hoy 5 veces).
  - *Esperado:* El string vive solo en el componente MARCO (§8.16); los builders de cuerpo no lo incluyen.
  - *Verificar:* Render completo: 'fotografía del presente'/'no es una etiqueta' = exactamente 1, dentro del marco. Grep en builders de cuerpo = 0.
- [ ] **VAL-09** — Los 10 límites se parten: VISIBLE = 3 barandas (no compara/no selecciona/no diagnóstico) + nota al adulto; COLAPSABLE = Barnum, validez no establecida, muestra autoseleccionada, motor con valencia.
  - *Esperado:* Componente marco con 2 bloques; 'efecto Barnum'/'validez no establecida'/'fiabilidad NO ESTIMABLE' NO en el bloque visible.
  - *Verificar:* Inspección del render/mockup: bloque visible = exactamente 3 barandas; grep 'Barnum'/'validez no establecida' solo dentro del colapsable.
- [ ] **VAL-10** — R4-J, R4-C y §14 son REGLAS INTERNAS de generación, jamás frases mostradas al padre.
  - *Esperado:* Estos textos viven en prompt/comentarios, no en templates de output. R4-C se muestra reencuadrado positivamente en el marco (dependencia declarada), no como negación.
  - *Verificar:* Grep 'cómo regula su frustración real'/'trazabilidad no es validez'/'cuestionario cortado' en templates de output = 0.
- [ ] **VAL-11** — Evolución en dos planos: RASGO prohibido ('cambió/estable/evolucionó/mejoró/empeoró', sin RCI/SEM); REGISTRO permitido (describir las dos fotos, hecho de las fichas).
  - *Esperado:* Builder de evolución: 'esta vez tendió a X, la vez anterior a Y'; mismo-eje→'aire de familia... por ahora'; ejes-distintos→co-ocurrencia + desactiva 'cambió de personalidad' + salvedad + cierre con valor.
  - *Verificar:* Test: output no contiene 'cambió'/'estable'/'mejoró'/'RCI'/'SEM'; sí describe las dos fotos. Dashboard = 'foto nueva de cómo juega hoy'.
- [ ] **VAL-12** — Piso ético inviolable: (1) nunca rasgo permanente como identidad, (2) nunca comparar chico contra chico para rankear/seleccionar, (3) nunca clínica/afecto/diagnóstico.
  - *Esperado:* prohibited-guard (35+ términos) + deterministic-guard + afecto-guard sobre todo output; toda lectura es del chico consigo mismo.
  - *Verificar:* seedQuality.test: 0 hits de los 3 guards sobre todas las plantillas. Ninguna sección referencia otro niño ni percentil comparativo (salvo motor age-fair con IC ancho, sin ranking).
- [ ] **VAL-13** — Verbo firme graduado: 'se define por'/'se apoya de lleno en' en rotundo/claro; 'se inclina hacia'/'tiende a' en matices/parejo.
  - *Esperado:* leadParagraph: rotundo='se apoya de lleno', claro='se define con claridad', matices='se inclina hacia', parejo='dos motores parejos'. band-guard bloquea verbo firme en registros bajos.
  - *Verificar:* Test por registro: verbo del lead = tabla. band-guard rebota 'se define'/'de lleno' en matices/parejo.
- [ ] **VAL-14** — Motor cronométrico bandeado en 3 zonas (rapido/intermedio/lento), léxico cronométrico, cancha como 'donde se aplica y se reconoce', lente separada del perfil de votos.
  - *Esperado:* MOTOR_INSIGHT_TEMPLATES es/en/pt (3 zonas); sin 'reflexivo/impulsivo/ágil/calmo/nervioso'; buildMotorSection null→sección omitida.
  - *Verificar:* getMotorInsight('rapido'|'intermedio'|'lento') = 3 variantes; motor-gate rebota léxico disposicional; narratable=false omite sin header huérfano.
- [ ] **VAL-15** — 'En la meta/cuando le sale bien' anclado al perfil: escena literal Q12 + micro-rótulo n=1 + tip accionable; nunca 'maneja el éxito', nunca puro literal+disclaimer.
  - *Esperado:* Builder cita la elección de Q12 verbatim, rotula 'una sola escena', añade tip ('a los chicos que ante un logro miran lo que viene, suele servirles Y').
  - *Verificar:* Render: contiene escena Q12, marca n=1, línea de tip; grep 'maneja el éxito' = 0.
- [ ] **SEC-01** — §8.1 Su perfil: nombre eje×veta familia-aware; veta al nombre solo B2≥4 y no-opuesto; opuesto→co-ocurrencia ('Impulsor y Sostenedor') en el cuerpo con 'y', vocabulario positivo, sin 'raro/pero'.
  - *Esperado:* buildReportHero.arquetipoLabel+vetaLabel; opposite-guard activo; TENDENCIA_CONTENT de los 4 pares opuestos reescrito como co-ocurrencia.
  - *Verificar:* Test veta-opuesta (D+S): nombre='Impulsor' (sin 'con veta'), cuerpo usa 'y'; opposite-guard rebota 'raro/en tensión/pero'.
- [ ] **SEC-02** — §8.2 Banda: meter reencuadrado a 'forma del perfil' (parejo↔de lleno), NO 'confianza 1-4'; parejo NO se lee como 'peor' (A5.6).
  - *Esperado:* meter labels ['Parejo','Con matices','Claro','De lleno']; eje semántico = forma; copy describe 'qué tipo de definición', varios registros↔un motor dominante, ambos válidos.
  - *Verificar:* Render parejo: meter nivel 1 con copy que NO dice 'poco claro/pobre'; labels = METER_LABELS; parejo presentado como adaptabilidad/doble registro.
- [ ] **SEC-03** — §8.3 Su motor: opcional (narratable=false→omitida limpia); insight cronométrico bandeado; caso nulo = ausente sin header huérfano.
  - *Esperado:* buildMotorSection retorna string|null; render omite si null; motor no cuenta para el mínimo del QC.
  - *Verificar:* Test motor faltante: sección ausente, informe pasa QC (≥5 obligatorias sin motor). Con juegos: 1 de 3 variantes de zona.
- [ ] **SEC-04** — §8.4 Cómo decide/patrón de decisión: elecciones (CONTINGENCIA) + RITMO ACOPLADO; nunca lee velocidad como decisión; afirma patrón solo con ≥2 escenas de acuerdo.
  - *Esperado:* Builder consume contingencia.patrones (mayoría estricta) y ritmoAcople (null→se calla); marca desvíos ('cambia de registro'); patron nulo (sin base)→degrada a literal u omite.
  - *Verificar:* Test: 1 sola escena→no afirma patrón (literal); ritmoAcople null→sin frase de ritmo; esDesvio=true→'cambia de registro'.
- [ ] **SEC-05** — §8.5 Qué lo enciende (combustible): presencia siempre; suma el eje secundario cuando forma=duo o tier bajo ('dos combustibles que conviven').
  - *Esperado:* EjeBaseContent.combustible por eje; secondCount alto/duo→anexa el del secundario con 'casi con el mismo peso'.
  - *Verificar:* Render duo (5-4-...): menciona ambos ejes; definido: solo el primario. combustible no vacío en los 4 ejes (Record total).
- [ ] **SEC-06** — §8.6 Palabras puente/ruido: listas cerradas por eje (3≤N≤6) + extras del secundario; preferencias del presente, no sensibilidades fijas (X4); la IA no las genera.
  - *Esperado:* palabrasPuente/palabrasRuido arrays por eje en EJE_BASE; anexa *Extra del secundario; framing 'suelen', no 'le molesta siempre'.
  - *Verificar:* Render: 3-6 items/lista, de la biblioteca (no del prompt IA); grep 'siempre le molesta' = 0.
- [ ] **SEC-07** — §8.7 Guía rápida: activar/a considerar; los 'a considerar' son condiciones de ENTORNO, nunca fallas del niño.
  - *Esperado:* Builder 2 columnas; reencuadre 'le cuesta'→'en el juego tendió a tomarse un momento'.
  - *Verificar:* Render: columna 'a considerar' sin 'le cuesta/falla/no puede'; cada fila apunta al adulto/entorno.
- [ ] **SEC-08** — §8.8 Checklist del día: exactamente 3 bloques Antes/Durante/Después; no cita escena si momentos.seleccionados=[] (closed-moment guard).
  - *Esperado:* 3 bloques; interpolación de escena solo desde momentos.seleccionados[]; caso nulo describe en abstracto.
  - *Verificar:* Test momentos=[]: 3 bloques, 0 escenas náuticas; closed-moment guard rebota escenas fuera de la whitelist.
- [ ] **SEC-09** — §8.9 Consejo de reset: 1-2 frases; invitación a ajustar el entorno, no una orden al niño.
  - *Esperado:* reseteo por eje en EJE_BASE; tono conservador cuando coherencia_presion=false.
  - *Verificar:* Render: presencia siempre, en rango; framing 'suele ayudarle', no imperativo sobre el niño.
- [ ] **SEC-10** — §8.10 En la meta: escena literal Q12, micro-rótulo n=1 obligatorio, sin 'maneja el éxito', sin regla de convergencia; + tip accionable.
  - *Esperado:* Builder cita opción de Q12 verbatim ('prefirió mirar al próximo reto'/'celebrarlo con los demás'/...), marca 'una sola escena', añade tip.
  - *Verificar:* Render: cita Q12, marca n=1, tip; grep 'maneja el éxito'/'así maneja' = 0.
- [ ] **SEC-11** — §8.11 Ante la tormenta: preferencia SOLO si 3/3 (Q5-Q7); 2/3→peldaño tentativo intermedio; 1-1-1→sensibilidad al contexto nombrando las 3 escenas (no encogimiento); nunca afecto.
  - *Esperado:* Builder consume las 3 escenas; 3/3→tendencia; 2/3→'en dos de tres se inclinó por X, en la tercera Y'; 1-1-1→'no aplica una sola receta, lee cada tormenta según el momento'.
  - *Verificar:* Tests 3/3, 2/3, 1-1-1: cada uno su variante; 1-1-1 NO produce 'eligió de formas distintas' seco; sin lectura de afecto/frustración.
- [ ] **SEC-12** — §8.12 Ante lo inesperado: dos lentes INDEPENDIENTES (eje S de elecciones + avgAdaptation del juego) con 'y', nunca reconciliadas; divergencia NO cae a vacío.
  - *Esperado:* Builder narra ambas ('en sus elecciones prefirió...; en el juego de reglas cambiantes se reacomodó...') + takeaway; adaptación no-narratable→se marca, no se fuerza.
  - *Verificar:* Test divergencia: dos frases con 'y', 0 'pero'; nunca vacía. avgAdaptation faltante→omite solo esa lente.
- [ ] **SEC-13** — §8.13 Cuánto lo mueve el grupo: I y S POR SEPARADO, nunca sumados; intra-individual + acompañamiento positivo (roles donde su fortaleza impacte al equipo); no mide habilidad social/popularidad.
  - *Esperado:* Builder reporta I y S con lenguaje distinto o condiciona a cuál pesa más; nunca un score combinado; aclaración fija de no-habilidad-social.
  - *Verificar:* Test: I y S en frases separadas; grep de suma I+S = 0; bajo-I nunca leído como individualismo (se cruza con S); contiene la aclaración fija.
- [ ] **SEC-14** — §8.14 Ecos fuera de la cancha: generalización probabilística de los ejes; 'son tendencias, no reglas fijas'.
  - *Esperado:* ecos por eje en EJE_BASE; suma el secundario por mezcla; abstracto, sin escena concreta inventada.
  - *Verificar:* Render: presencia siempre, en rango, probabilístico; AFG no deja pasar entidad/evento concreto ausente de la ficha.
- [ ] **SEC-15** — §8.15 Cómo viene evolucionando: descriptiva desde el 2º perfilamiento, misma method_version, sin RCI/SEM, sin 'cambió/estable'; caso nulo (1 toma)=ausente o 'primera foto'.
  - *Esperado:* Builder compara solo fichas de misma method_version (aplica VAL-11); sin ficha previa no fabrica trayectoria.
  - *Verificar:* Test 1 toma: no afirma evolución. Test 2 tomas: describe ambas fotos sin 'cambió'. Comparación cross-version bloqueada.
- [ ] **SEC-16** — Marco al pie [FIJO, §8.16-17]: se renderiza SIEMPRE en informe y superficie coach; 3 barandas visibles + foto/no-diagnóstico (una vez) + nota al adulto (no devolver la etiqueta) + dependencia declarada (mismo set de 12 respuestas).
  - *Esperado:* Componente marco parte del contrato de formato (no opcional); incluye la partición visible/colapsable de VAL-09.
  - *Verificar:* Render de cualquier informe incluye el marco; QC exige su presencia; contiene 3 barandas + nota + dependencia; disclaimers de paper en el colapsable.
- [ ] **SUB-01** — EJE_BASE es Record<Axis,EjeBaseContent> TOTAL (4 ejes, todos los campos), no Partial: celda faltante NO COMPILA. Mata EJE_BASE_DRAFT_ES: Partial (hoy solo D con 2 campos).
  - *Esperado:* archetypeContentV4.ts: EJE_BASE_ES/EN/PT Record<Axis,_> con perfil, combustible, corazon, palabrasPuente, palabrasRuido, guia, checklist, reseteo, ecos para D/I/S/C.
  - *Verificar:* tsc falla si falta clave de Axis o campo. seedQuality.test enumera 4 ejes×9 campos×3 idiomas no-vacíos. Grep 'Partial<Record<Axis' = 0.
- [ ] **SUB-02** — Clase TONO registro-keyed: variantes de prosa por los 4 registros, pre-validadas en build. Reescribir el lead 'matices' que hoy se autocontradice ('presencia clara'+'asoma algo de', A5.4).
  - *Esperado:* PERFIL_LEAD/BANDA Record<Registro,_>; lead matices desacoplado de vetaBanda='sin'.
  - *Verificar:* Test: 4 variantes existen y difieren; lead matices no contiene simultáneamente 'presencia clara' y 'asoma algo de'. Record<Registro,_> total (tsc).
- [ ] **SUB-03** — Clase ZONA (motor) 3 variantes (lento/intermedio/rapido) totales es/en/pt.
  - *Esperado:* MOTOR_INSIGHT_TEMPLATES Record<Lang,{lento,intermedio,rapido}> (ya existe); getMotorInsight cubre las 3 + fallback intermedio.
  - *Verificar:* Presente en archetypeContentV4.ts; test de las 3 zonas×3 idiomas no-vacías.
- [ ] **SUB-04** — Clase VETA: 12 pares nombrables + 4 opuestos como co-ocurrencia + variante sin-veta; los 4 opuestos narrados sin 'raro/tensión/pero'.
  - *Esperado:* TENDENCIA_CONTENT keyed [primario]_[secundario] portado a V4; OPPOSITE_TENDENCIA_KEYS auditadas a co-ocurrencia; getBlendName/getVetaLabel para el nombre.
  - *Verificar:* seedQuality.test lint de opuestos: 0 hits de conflicto ('raro','en tensión','pero','contradice') en los 4 pares diagonales; 12 pares + sin-veta presentes es/en/pt.
- [ ] **SUB-05** — Clases RELACIONAL (grupo I/S), EVOLUCION (registro), INVARIANTE (marco) autoradas como records por su driver-dimension.
  - *Esperado:* GRUPO (rolGrupo por I/S), EVO_REG (registro de evolución), MARCO fijo, en reportV4Slots.ts / archetypeContentV4.ts.
  - *Verificar:* Cada clase existe con celdas totales; render de grupo/evolución/marco no vacío en los 3 idiomas.
- [ ] **SUB-06** — Todo el sustrato espejado es/en/pt (~77 unidades/idioma ×3 = 231), redactado (no traducción automática), con sign-off de voz del owner + revisión nativa como launch-gate.
  - *Esperado:* archetypeContentV4.ts + .en.ts + .pt.ts completos; feature-flag report_gate_enabled por idioma×eje.
  - *Verificar:* Conteo de unidades por idioma coincide; language-guard rebota output no-es hasta que exista i18n; flip solo por segmento con contenido completo.
- [ ] **SUB-07** — Plantilla vs Dato: prosa fija + slots cerrados; {cifra} solo en rotundo/claro; {escena}/{opcionTexto} solo verbatim de momentos.seleccionados[]; interpolación $-safe (callback).
  - *Esperado:* fillSlots callback (replaceAll con función para neutralizar $&/$1); {nombre},{sport} rehidratados tras los checks; buildMotorSection migrado de .replace regex a fillSlots.
  - *Verificar:* Test nombre con '$'/metacaracteres: no rompe; grep {cifra} fuera de rotundo/claro = 0; escenas solo desde la whitelist.
- [ ] **SUB-08** — QC build-time (seedQuality.test): cada seed pasa el mismo qualityGate + rango de largo por sección + lint de opuestos.
  - *Esperado:* seedQuality.test.ts enumera section×index×lang y corre qualityGate + rangos (sección obligatoria ≥180 chars, informe ≥900) + guards.
  - *Verificar:* npm test seedQuality verde; una plantilla que dispare un guard o quede fuera de rango falla CI.
- [ ] **SIG-01** — RECETA (orden completo de los 4 ejes con presencia intra-individual) alimenta el contenido individual (perfil/tendencia/ecos): es un hecho.
  - *Esperado:* reportV4.ts consume dischSignals.receta (RecetaItem[] presencia principal/presente/apenas/ausente) en secciones que describen la mezcla del chico.
  - *Verificar:* Test: computeReceta de 5-4-2-1→D principal, C presente, S/I apenas; el copy de perfil refleja el orden real, no un genérico del arquetipo.
- [ ] **SIG-02** — CONTINGENCIA alimenta 'cómo decide' y 'ante la tormenta': afirma patrón SOLO con mayoría estricta ≥2 Y > resto; empate→'varía'; marca esDesvio ('cambia de registro'). Solo contextos multi-escena (inicio/adversidad/esfuerzo).
  - *Esperado:* Builders consumen contingencia.patrones y contextosVaria; contextos de 1 escena quedan literales; esDesvio→copy de desvío.
  - *Verificar:* Test: adversidad 2-de-3 mismo eje→patrón; empatada→'varía'; contexto de 1 escena (decision/espera/equipo/meta) nunca forma patrón.
- [ ] **SIG-03** — RITMO ACOPLADO alimenta el matiz de tempo de decisión, conservador: null si <3 respuestas por grupo o brecha <0.5 → se calla. Distinto del motor cronométrico absoluto.
  - *Esperado:* Builder de 'cómo decide' añade la frase de ritmo solo si computeRitmoAcople no es null; direccion primario_rapido/primario_lento.
  - *Verificar:* Test: base<3→null→sin frase; brecha 0.3→null; brecha 0.6→frase de ritmo. No se confunde con la sección motor (lente separada).
- [ ] **SIG-04** — REGLA DE ORO transversal: toda afirmación individual de las 3 señales se GATEA por robustez; sin patrón claro se calla o baja al literal (nunca 'verde' a un chico 'rojo'). Nunca se inventa patrón desde ruido.
  - *Esperado:* Los 3 extractores ya codifican el gate (≥2 mayoría estricta; ritmo null en baja base/brecha); los builders respetan null/vacío degradando al literal.
  - *Verificar:* Tests adversariales: ruido uniforme→patrones=[], ritmoAcople=null, y el informe cae al literal sin afirmar tendencia individual. Ground-truth-guard rebota eje equivocado.


**Total de ítems de verificación: 187.**

---

## 4. Estado de construcción (leído del código)

### PERFIL + NAMING + SEÑALES DISC

CONSTRUIDO (aditivo, verificable en código):
- nullDistribution.ts: gates B/B2 completos. classifyBanda (3 niveles), classifyRegistro (4 niveles rotundo/claro/matices/parejo, owner 2026-07-07), nameGate (B≥4 O (B≥2∧top≥7)), classifyVetaBanda (sin/tentativa/afirmada), classifyForma (7 formas), isOppositeAxis/OPPOSITE. Constantes del nulo (P_B, P_B2, NAME_GATE_MASS=7.68, BLEND_NULL, FORMA_STATS) congeladas y reproducidas por scripts/enum-bandas.mjs + test-formas.mjs + nullDistribution.test.ts (qa:unit).
- evidenceFicha.ts: tipos Banda/Registro/FormaId/VetaBanda/Axis/MotorZona; VotesEvidence con todos los campos (B, B2, nEjesFuertes, secundarioEmpatado, banda, registro, forma, nombrarPrimario, vetaBanda, vetaOpuesta, vetaEnNombre, arquetipoLabel).
- profileResolver.ts buildVotesEvidence: deriva primario/secundario/B/B2/banda/registro/forma/gates y arma el label.
- reportV4.ts buildReportHero: 4 párrafos de lead por registro + meter de confianza 4 niveles (Parejo/Con matices/Claro/De lleno) + cita de cifra en rotundo. buildMotorSection.
- archetypeContentV4.ts: getVetaLabel/getBlendName (es/en/pt), MOTOR_INSIGHT_TEMPLATES cronométricas, OPPOSITE_TENDENCIA_KEYS. (BORRADOR pendiente owner: EJE_BASE solo tiene D como ejemplo; I/S/C TODO; en/pt del cuerpo pendientes.)
- dischSignals.ts: las 3 señales (computeReceta/computeContingencia/computeRitmoAcople + computeDiscSignals) con la regla de oro de robustez, + tests en dischSignals.test.ts (casos de silencio cubiertos).
- archetype-naming.md: reescrito 2026-07-06 al esquema eje×veta, con tabla canónica es/en/pt, regla de opuestos, prohibidos y los 14 mapas espejo.

DIVERGENCIAS / PENDIENTE (spec > código):
1. perfilTipo familia-aware (lider/duo/versatil/parejo) es CANÓNICO en METODO-ENGINE-DEFINITIVO.md R1 pero NO existe en código todavía. buildVotesEvidence aún produce el arquetipoLabel INCONDICIONAL '[Primario] con veta [Secundario]' (profileResolver.ts l.306-307); la spec-definitiva lo ELIMINA y lo reemplaza por perfilTipo.label. reportV4 muestra 'con veta' siempre en vez del label de familia (duo→'Perfil de doble motor: X y Y'; parejo; versatil). Esta es la brecha #1 a construir (PERF-02/03/04).
2. Las 3 señales DISC están construidas y testeadas pero NO wired: resolveEvidenceFicha no embebe respuestas[] AnswerRecord ni llama computeDiscSignals; la ficha no las persiste. Faltan para alimentar las secciones individuales del informe (SIG-07).
3. Label de co-ocurrencia para veta opuesta en el encabezado ('X y Y', no 'con veta') es spec-definitivo (R1/A2.1) pero el código actual no lo produce (solo el flag vetaOpuesta existe).
4. Content-linter (Fase 10) que compone label+veta y grepea los 12 eje×tempo: pendiente.
Los 12 eje×tempo viejos siguen vivos en ARCHETYPE_DATA (legacy, informes DB pre-v4); coexisten por diseño forward-only, pero deben quedar fuera del branch v4.

### ENGINE FAIL-CLOSED — gate determinista + juez-IA + estados/HOLD + entrega durable (choke-point único de calidad del informe Argo)

MI DOMINIO ESTÁ 0% CONSTRUIDO — es todo diseño. Verificado leyendo el código:

- NO existe la columna `report_status` en ninguna migración ni en api/src (grep 'report_status' → none). Toda la máquina de estados/HOLD es diseño puro.
- NO existen los archivos nuevos del choke-point: src/lib/reportQuality.ts (MISSING), src/lib/fichaGate.ts (MISSING), src/lib/reportGrounding.ts (MISSING), api/seal-report.ts (MISSING), api/judge-quality.ts (MISSING), api/admin-approve-report.ts (MISSING), scripts/gen-quality-gate.mjs (MISSING).
- api/send-email.ts es FAIL-OPEN hoy: sólo tiene idempotencia por `email_sent_at` (línea 543, no atómica, sin claim), sin guard 409 por report_status, sin send-ledger. No hay gate previo al envío.
- api/report-recovery-cron.ts es el anti-patrón que el diseño prohíbe: usa `continue` para saltarse fallos (líneas 132/163/201 → drops silenciosos), reintenta indefinidamente (no cuenta retry_count, no hay transición a held), query filtra sólo por email_sent_at IS NULL (no excluye held/sent porque no existen). Sin claim atómico de fila, sin stuck-sweeper.
- api/report.ts sirve `ai_sections` directo en el SELECT (línea 36) sin gate server-side de report_status → hoy filtra secciones sucias.
- send-email tiene ~10 callers/referencias (one-complete, report-recovery-cron, principia-act/detect, session, journey-canary, qa-monitor, puentes-sync-cron, emailService); ninguno pasa por un choke-point único todavía.

LO QUE SÍ EXISTE (Capa 1 determinista, NO es mi dominio pero es el sustrato que mi gate consume): src/lib/evidenceFicha.ts, nullDistribution.ts, ageNorms.ts, profileResolver.ts, reportV4.ts, archetypeContentV4.ts, dischSignals.ts. Es decir la ficha/esqueleto existe, pero el gate/juez/HOLD/entrega que lo vetan y lo entregan de forma durable no se construyó. Corresponde a Fase 0 (migración) + Fase 3 (gate+juez) + Fase 5 (máquina de entrega, EL FLIP) del plan, ninguna iniciada.

### REGISTRO DE HUECOS + MEDICIÓN + LÍMITES (adjudicación de los 55 ataques, huecos abiertos, ganchos de medición y límites data-gated del engine del informe Argo)

DOCS: consolidados y coherentes (los 55 ataques adjudicados; los 3 huecos explícitos en §4; §13/§14 con agenda empírica). Errata detectada: §3 dice "ABIERTOS: 7" pero enumera 10.

CÓDIGO YA CONSTRUIDO (mi dominio): src/lib/dischSignals.ts + dischSignals.test.ts existen, con las 3 señales y sus gates de robustez codificados (contingencia mayoría estricta ≥2/empate→varía; ritmo null si base<3 o |brecha|<0.5; receta hecho puro). PERO no tienen NINGÚN consumidor todavía: grep confirma que dischSignals no se importa desde api/ ni desde ningún builder de informe → la "más señal por-niño" (prong c de HUECO 1) está construida como lib pura pero NO wired al informe.

TODO EL APARATO DE MEDICIÓN + GATE + LÍMITES SIGUE SIN CONSTRUIR (fase diseño/shadow-pendiente): no existen reportQuality.ts, reportGrounding.ts ni fichaGate.ts; no existe scripts/qa/discrimination.mjs (el intra-celda solo vive en docs); no hay tabla report_discrimination_probe, send_ledger ni columnas report_status/report_qc/evidence_ficha migradas; el widget 2AFC no existe; el monitor de ejes opuestos no está instrumentado; la telemetría de tasa_fallback ≤1% no está cableada. Los límites de §13/§14 viven solo en el doc: aún NO se renderizan como el componente fijo visible del informe (§8.16 Marco / §8.17 Qué mira y qué no mira). Conclusión de estado: los 10 huecos abiertos y los 3 huecos-raíz siguen íntegramente ABIERTOS; ni un solo gancho de medición ni launch-gate está todavía implementado — todo es checklist forward-looking.

### FICHA DETERMINISTA + MOTOR + CÁLCULO (Capa 1a del engine del informe Argo v4)

CONSTRUIDO (aditivo, no toca el engine viejo):
- nullDistribution.ts COMPLETO y correcto: P_B/NAME_GATE_MASS/P_B2/BLEND_NULL/FORMA_STATS congeladas; classifyBanda, classifyRegistro (4 niveles parejo/matices/claro/rotundo, ya el canónico owner 2026-07-07), nameGate (B≥4||(B≥2&&top≥7)), classifyVetaBanda, isOppositeAxis (D↔S,I↔C), classifyForma (cascada 7 formas, B=0 primero) — todas puras. Falta verificar con enum-bandas.mjs/test-formas.mjs (los .mjs figuran como NUEVO en el plan Fase 1; comprobar que existen y corren en qa:unit).
- evidenceFicha.ts: tipos definidos (VotesEvidence, SubMotor, MotorInsight, EvidenceFicha, Registro 4-niveles). FALTA: `respuestas:AnswerRecord[]` embebido (no autocontenida aún) y `perfilTipo` familia-aware.
- profileResolver.ts: buildVotesEvidence/resolveMotorInsights/resolveEvidenceFicha/buildDisplayName construidos. resolveMotorInsights ya excluye impulsivityBonus/errorPenalty y saca Adaptación del tempo (correcto). PERO conviven las funciones LEGACY resolveProfile/resolveFromAnswers/resolveMotorFromGames con motor-tipo Rápido/Medio/Lento, impulsivityBonus (l.44), errorPenalty (l.55) y tiebreakers — a ELIMINAR al migrar consumidores.
- ageNorms.ts: factorEdad (interpolación por meses + clamp), ageFairMs (x/f), tempoScoreFromAgeFair (0.50/0.50), tempoZonaFromScore. dischSignals.ts COMPLETO (receta/contingencia/ritmoAcople con REGLA DE ORO). reportV4.ts (buildReportHero, buildMotorSection→null). archetypeContentV4.ts (MOTOR_INSIGHT_TEMPLATES es/en/pt, getVetaLabel/getBlendName; EJE_BASE_DRAFT_ES solo el eje D).

PENDIENTE / GAPS (deben tildarse tras construir):
1. `perfilTipo` familia-aware + arquetipoLabel=perfilTipo.label (R1): hoy profileResolver l.307/evidenceFicha usan el '[Primario] con veta [Secundario]' INCONDICIONAL que engine-definitivo manda ELIMINAR. Sin esto, 3-3-3-3 y veta opuesta producen labels arbitrarios (CALC-10, GATE-04).
2. `respuestas:AnswerRecord[12]` embebidas en la ficha (FICHA-02): sin esto ritmo/tormenta/meta no regeneran desde la ficha sola y el cron durable no puede.
3. Guards de motor (MOTOR-02, MOTOR-06): factorEdad(NaN) HOY propaga NaN (bug); narratable solo chequea !!impulse&&!!rhythm, falta isFinite(edad)&&96≤edad≤192&&avg>0&&nTrials≥3.
4. evaluateFichaGate / fichaGate.ts (GATE-01..06): NO existe aún — es la única autoridad de datos que ordena HOLD vs motorDrop vs themeDegrade vs routeParejo.
5. tempoZona por IC-crossing con normas reales (MOTOR-08): hoy bandea por corte fijo de score (≥60/≤40) con percentilCelda=null e IC ±25% placeholder — divergencia data-gated (HUECO 3, necesita ~500 juegos/celda población Argo + edad en meses real + latencia de dispositivo).
6. Migración DB aditiva (~24 columnas planas + evidence_ficha jsonb + recrear current_perfilamiento + NOTIFY pgrst) y persistencia de game_metrics (hoy nunca se escribe): prerrequisito para poblar la ficha y la población Argo.
Nota de riesgo: enum divergente entre el plan §1.1 (registro 3-niveles 'mezcla/tentativo/claridad') y el canónico vigente (4-niveles del código). El código es el correcto; el plan quedó superado por la decisión owner 2026-07-07 (engine-definitivo lo marca 'eliminar on sight').

### CONTENIDO + CALIBRACIÓN DE VALOR + LAS 15 SECCIONES del informe Argo v4

CONSTRUIDO (aditivo, es-only, parcial):
- reportV4.ts: SOLO buildReportHero (lead calibrado con los 4 registros parejo/matices/claro/rotundo, meter 1-4, arquetipoLabel+veta SIEMPRE, cifra topCount/12 ya interpolada en rotundo/claro) y buildMotorSection (null cuando no narratable). Faltan el ensamblador buildReportV4 y 13 de las 15 secciones.
- archetypeContentV4.ts: MOTOR_INSIGHT_TEMPLATES completo es/en/pt (3 zonas, cronométrico, framing de cancha correcto); getVetaLabel/getBlendName/getMotorInsight OK. EJE_BASE_DRAFT_ES es un Partial con SOLO eje D y 2 campos (perfil, combustible); I/S/C y el resto de campos son // TODO. Es el long pole y el bug que el spec quiere matar (Record TOTAL). OPPOSITE_TENDENCIA_KEYS declarado pero TENDENCIA_CONTENT (12 pares + 4 opuestos co-ocurrencia) sin portar/auditar a V4.
- dischSignals.ts: las 3 señales COMPUTAN correctamente con la regla de oro de robustez ya codificada (≥2 mayoría estricta; ritmo null si base<3 o brecha<0.5), pero NO están cableadas a ninguna sección (reportV4.ts no las consume).
- Contenido en/pt de EJE_BASE: inexistente (100% de compradores no-es en HOLD).
- Marco al pie / partición visible-vs-colapsable de disclaimers: no construido.
- Voz validada: worked-example de Mateo (docs/METODO-INFORME-DETERMINISTA.md l.757-903) fija tono/rangos/formas/casos-nulo pero usa el naming VIEJO (Impulsor Dinámico) — solo la VOZ es reutilizable, el naming se toma de archetype-naming.md v4.

PENDIENTE / launch-gate: 13 builders de sección, EJE_BASE total I/S/C, espejos en/pt (sign-off de voz + revisión nativa), cableado de las 3 señales DISC al contenido, meter reescrito (A5.6), lead 'matices' reescrito (A5.4), seedQuality.test, marco al pie con partición de disclaimers. Sin esto el flip queda restringido a es+D.

