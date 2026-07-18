# Predictor Conductual (Guía situacional)

> Cómo funciona el contenido de situaciones del Predictor Conductual: estructura, convenciones para editar/agregar, y el estado de validación del contenido.
> Última actualización: 2026-07-18 (capa enriquecida eje + veta).

## Qué es

Una biblioteca curada de **situaciones reales de un entrenamiento** (8-16 años) con orientación concreta por **perfil DISC**. Cero tokens de IA: todo el contenido está pre-escrito en el repo. Se ve en el dashboard en la sección **Guía** (`/dashboard/guide`, componente `src/pages/tenant/TenantGuide.tsx`).

## Archivos

| Archivo | Qué tiene |
|---|---|
| `src/lib/situationalGuide.ts` | **Fuente (ES)** + las interfaces `Situation` / `SituationCard` / `CardEnrichment` / `VetaNuance` + los helpers `getSituations(lang)` / `getSituationCards(lang)` / `getCardEnrichment(situationId, eje, lang)` / `getVetaNuance(situationId, primary, veta, lang)` / `isOppositeVeta(a,b)` (selectores por idioma). |
| `src/lib/situationalGuide.en.ts` | Traducción EN (`SITUATIONS_EN`, `SITUATION_CARDS_EN`, `CARD_ENRICHMENTS_EN`, `VETA_NUANCES_EN`). |
| `src/lib/situationalGuide.pt.ts` | Traducción PT-BR (`SITUATIONS_PT`, `SITUATION_CARDS_PT`, `CARD_ENRICHMENTS_PT`, `VETA_NUANCES_PT`). |
| `src/pages/tenant/TenantGuide.tsx` | Render + `CATEGORY_LABELS` + `renderPerspectives` + `VETA_LABEL` (nombre de veta por idioma) + panel de perspectivas que colapsa al perfil del niño seleccionado. |

Los tres archivos comparten **la misma estructura**: un array de `Situation` y un array de `SituationCard`. Los **`id`, `eje` y `category` son identificadores: NO se traducen** (son los mismos en los 3 archivos). Solo se traduce el texto visible.

## Personalización por niño: eje + veta (2026-07-18)

**Problema que resolvió:** al seleccionar un niño, la tarjeta personalizada se resolvía **solo por eje primario** (`SituationCard.eje`), o sea 4 variantes por situación. Dos niños con el mismo primario veían **texto idéntico**, y el bloque grande "Cómo vive cada perfil" no reaccionaba a la selección. Se sentía "lo mismo para todos".

**Solución (capa aditiva, sin tocar las 85 tarjetas base):**

1. **`CardEnrichment`** (una por `situation × eje`, 85 en total = 84 DISC + 1 grupal): agrega dos campos con más carne por perfil:
   - `whatToSay` — una frase concreta para decirle al niño, entre comillas. **Fuera de la UI desde 2026-07-18** (se pisaba con la "frase a su medida" del bloque ArgoCoach); el dato queda en los archivos de contenido para otras superficies.
   - `whatToAvoid` — el error mejor intencionado más común con ese perfil ("Qué evitar", arranca con "Evita").
2. **`VetaNuance`** (una por `situation × primario × veta` no opuesta, **168** = 21 × 8): 1-2 oraciones de cómo el **segundo eje** modifica la respuesta del primario **en esa situación**, con un micro-ajuste para el entrenador. Es el diferenciador: dos "Impulsor" con veta distinta (Conector vs Estratega) reciben lecturas distintas. Granularidad = **arquetipo** (la misma unidad con la que personaliza el resto de Argo), no eje.
3. **Gate de veta = mismo que el nombre del arquetipo:** `getVetaNuance` devuelve `undefined` si la veta falta, es igual al primario, o es el **eje diagonal opuesto** (D↔S, I↔C). En ese caso la tarjeta queda en primario puro. Ver `docs/archetype-naming.md`. Los `eje_secundario` opuestos (~32% de la base) caen acá correctamente.
4. **El panel "Cómo vive cada perfil" colapsa** al perfil del niño seleccionado (resalta su párrafo, con toggle "Ver los cuatro perfiles"). Deja de leerse genérico.

**Fuente del dato:** `api/tenant-sessions.ts` ya exponía `eje` **y** `eje_secundario` por niño (vienen de `current_perfilamiento`); el componente ahora lee ambos (`SessionRow.eje_secundario`).

**Cómo se generó el contenido:** workflow multi-agente (autor DISC + psicología del deporte infantil por situación → revisor adversarial DISC/copy → traductor EN+PT), 22 situaciones en pipeline, 66 agentes. Salida validada (85 enrichments + 168 vetas por idioma, blends correctos, vetas de un mismo primario distintas entre sí, sin voseo ni guiones, comprador neutro). Estado de validación: **contenido fundamentado y revisado por IA, no validado clínicamente** (mismo criterio que el resto de la guía, ver abajo). El texto de veta se ancla en el nombre de eje que usa la guía (S = "Sostén", no "Sostenedor", para coherencia interna con la prosa de las tarjetas).

Etiquetas del render en `dashboardTranslations.ts` (`guide`): `queDecirle`, `queEvitar`, `suVeta(label)`, `comoLoVive(name)`, `comoVivenLosPerfiles`, `verLosCuatro`, `verSoloSuPerfil` (es/en/pt).

## Capa de IA: "Verlo con [nombre]" (2026-07-18)

Sobre el piso determinista anterior, un bloque de ejemplo **por niño individual** generado con Gemini 2.5 Flash: `escena` (cómo podría verse esta situación con ESTE niño en una situación general de juego o de la actividad, primario + veta tejidos), `frase` (una frase a su medida) y `senal` (una señal observable + micro-ajuste). Rompe el empate entre dos niños del mismo arquetipo. **Ajeno al deporte (2026-07-18)**: el deporte del niño NO llega al prompt y el validador rechaza deportes nombrados y tecnicismos deportivos; el modelo roleplayaba pericia deportiva que no tiene (un scrum en una edad que no lo practica). Lo que hace único al ejemplo es el perfil, no el deporte.

**Arquitectura** (`api/predictor-example.ts`, endpoint POST único):
- `action: 'peek'` = solo caché (el front lo dispara al seleccionar niño+situación; hit = reveal instantáneo). `action: 'generate'` = pipeline completo (~10-15s).
- **Caché** en `predictor_examples` (child × situation × lang), válida solo para el `perfilamiento_id` actual: re-perfilar invalida solo (miss natural). Migración `20260718_predictor_examples.sql` (aplicada a prod 2026-07-18, RLS deny-all, solo service role).
- **Privacidad**: el nombre del niño **jamás llega a Gemini ni a la caché**; prompt y contenido cacheado usan el placeholder `{{P}}` (patrón tenant-chat) y el server lo sustituye al servir al coach autenticado.
- **Digest inline**: las situaciones + tarjetas por eje + vetas viven en una región `>>> GENERATED:PREDICTOR_DIGEST` dentro del endpoint (Vercel no puede importar de `src/`). NUNCA editarla a mano: `npm run gen:predictor` la regenera desde `situationalGuide*.ts`; `npm run check:predictor-gen` (en `qa:unit`) falla si driftea.
- **Datos inyectados**: eje, veta (mismo gate que el nombre: opuesta/igual ⇒ primario puro), edad, y si existen `ai_sections` (resumenPerfil/combustible/corazon truncados). El **motor queda fuera** a propósito (riesgo de léxico disposicional prohibido) y el **deporte también** (ver arriba: escenas sport-agnostic).

**Seguridad anti-alucinación (en orden):**
1. Prompt: marco HIPOTÉTICO obligatorio, solo datos provistos, prohibido inventar terceros con nombre/eventos/cifras, `{{P}}` literal.
2. Checks locales post-generación: `PROHIBITED_WORDS` + `DETERMINISTIC_PATTERNS` + eje ajeno (`scanWrongAxis`, la veta es legítima) + presencia de `{{P}}` en la escena (si falta, el modelo inventó un nombre).
3. **Validator pass**: segunda llamada barata (thinking off) que audita marco hipotético + specifics inventados + tono.
4. Falla algo ⇒ 1 regeneración con el feedback; falla de nuevo ⇒ `{unavailable}` y NO se cachea (el piso determinista queda).
5. Kill switch: env `PREDICTOR_AI` (`on` en prod/preview-develop/dev desde 2026-07-18); off ⇒ `{disabled}` y el front oculta el bloque.
6. Telemetría en `ai_events` con `source='predictor'` (mode `ejemplo`/`ejemplo_fallido`, tokens, cost_usd, violations). Fair-use: 200 generaciones/tenant/día.

**Gotcha vivido**: los "thinking" tokens de Gemini 2.5 Flash cuentan contra `maxOutputTokens`; con 500-2000 el JSON sale vacío y TODO falla silenciosamente como `ejemplo_fallido`. Generación va con 4000; el validador con `thinkingBudget: 0` y 1000. Verificado en vivo contra prod (harness: peek/generate/cache/400/no-PII/telemetría, todo verde; ~$0.0012 por generación).

**Costo**: ~US$0.002 por ejemplo generado (una vez por niño×situación×idioma hasta el próximo re-perfilamiento). Etiquetas front: `verloCon`, `generarEjemplo`, `generandoEjemplo`, `ejemploEscena/Frase/Senal`, `ejemploDisclaimer`, `ejemploNoDisponible`.

**Hardening post-review adversarial (2026-07-18, 4 lentes × verificación, 19 hallazgos confirmados y TODOS corregidos):**
- **Nombre en ai_sections (HIGH)**: los informes se guardan REHIDRATADOS con el nombre real, así que los extractos inyectados al prompt se pasan por `scrubName()` (espejo del `anonymizeAs` de tenant-chat: nombre completo + nombre de pila, word-boundary acentos-safe). Defensa en profundidad: check `containsName()` sobre el output; si el nombre real aparece, el intento falla y jamás se cachea.
- **Bound de coach (HIGH)**: `resolveTenantContext` ahora trae `role`; un member `coach` solo alcanza niños dentro de sus planteles (`group_coaches` → `group_members`, espejo de tenant-sessions). Fuera del bound ⇒ 404 (no confirma existencia).
- **Cap TOCTOU (MED)**: la generación RESERVA una fila `ai_events` (`mode: 'ejemplo_en_curso'`) antes de llamar a Gemini y la actualiza al final; ráfagas concurrentes se cuentan entre sí.
- **supabase-js no lanza (MED)**: todos los resultados DB chequean `{ error }` explícito (cap query falla ⇒ 503, no cap abierto).
- **{{P}} en frase/senal (MED)**: normalización de variantes del placeholder + regla explícita en el validador (el niño solo puede llamarse {{P}} en los TRES campos) + `containsName` local.
- **Flexiones de eje (MED)**: `scanWrongAxis` usa stem test ("impulsora", "estrategas"); `sostén/sosten` quedan estrictos (su stem colisiona con "sostener/sostenida").
- **LOW**: gate de trial server-side (⇒ `{disabled}`), fallo transitorio de Gemini cuenta como intento fallido (no 500), sesión nula en el front ⇒ estado `unavailable` (no skeleton eterno), `sport` sanitizado en el prompt (newlines + 60 chars), validador con `temperature: 0`.
- Guardrails unit-testeados (15 casos: scrub, fuga de nombre, ejes con flexión, falsos positivos de substring). Harness en vivo re-verificado tras los fixes (todo verde).

## Modelo de datos

```ts
interface Situation {
  id: string;            // kebab-case, identificador estable (igual en es/en/pt)
  title: string;
  whatYouSee: string;    // lo que el entrenador OBSERVA
  whatsHappening: string;// qué pasa por debajo (centrado en el niño)
  profilePerspectives?: string; // párrafo fluido con marcadores {{...}} por perfil
  category: string;      // identificador de categoría (ver abajo)
  icon: string;          // vacío en la práctica
}
interface SituationCard {
  situationId: string;   // referencia al Situation.id
  eje: 'D' | 'I' | 'S' | 'C' | 'group';
  whatYouSeeForProfile?: string;     // opcional
  whatsHappeningForProfile: string;  // arranca con el nombre del perfil
  howToAccompany: string[];          // acciones concretas (2)
  ifNotResponding: string;           // plan B, sin presionar
}
```

Cada situación individual tiene **4 tarjetas** (una por eje D/I/S/C). La situación grupal (`derrota-grupal`, eje `group`) no tiene tarjetas por perfil.

## Convenciones por idioma (CRÍTICO al editar)

**Nombres de perfil** dentro de las tarjetas y los marcadores de `profilePerspectives`:

| Eje | ES | EN | PT |
|---|---|---|---|
| D | Impulsor | Driver | Impulsionador |
| I | Conector | Connector | Conector |
| S | Sostén | Supporter | Sustentador |
| C | Estratega | Strategist | Estrategista |

**Marcadores en `profilePerspectives`** (los reemplaza `renderPerspectives` por chips de color): `{{Impulsor}} {{Conector}} {{Sosten}} {{Estratega}}` (ES, ojo: `Sosten` sin tilde) · `{{Driver}} {{Connector}} {{Supporter}} {{Strategist}}` (EN) · `{{Impulsionador}} {{Conector}} {{Sustentador}} {{Estrategista}}` (PT). El mapa vive en `TenantGuide.tsx` (`MARKER_MAP`).

**Categorías** (`category`): el valor es un identificador en español compartido por los 3 archivos. Su etiqueta visible por idioma sale de `CATEGORY_LABELS` en `TenantGuide.tsx`. **Si agregas una categoría nueva, hay que sumarla a `CATEGORY_LABELS` (es/en/pt)** o el filtro muestra el identificador crudo.

**Reglas de copy**: español latam neutro, tuteo (NO voseo: el linter `npm run lint:content` lo bloquea, incluye "acá"→"aquí"), **sin em/en dash** (— –) en ningún idioma. Tono coach-to-coach, cálido, sin jerga clínica ni etiquetas deterministas.

## Las 22 situaciones por categoría

- **Motivación**: entrar en el entrenamiento, quiere dejar el deporte.
- **Emocional**: se frustra al perder, se desborda en el entrenamiento, se castiga ante el error, gestionar el éxito.
- **Comunicación**: procesa las consignas a su ritmo, recibir una corrección.
- **Presión**: tensión en la previa del partido, se congela en partido, expectativa de los padres.
- **Social**: observa antes de sumarse, roce con un compañero, llega un jugador nuevo, le incomoda ser el centro, un compañero se destaca.
- **Concentración**: sostener la atención.
- **Observación**: cambió de forma sostenida.
- **Grupal**: al equipo le cuesta recuperarse de una derrota.
- **Rol** (categoría nueva 2026-06-11): aceptar ser suplente, asumir un rol de referente, subir de categoría.

## Principios editoriales

1. Centrado en el niño, **no** en el adulto (nombrar la experiencia del niño, no la molestia del entrenador ni una exigencia de obediencia).
2. Mirada **en proceso** y en potencial: el niño se está desarrollando, nunca "un problema".
3. **Validar la emoción primero**, después ofrecer herramientas. Nunca presionar a quedarse ni a rendir.
4. La orientación por perfil se **deriva del patrón DISC** del eje (D acción/control, I pertenencia, S estabilidad, C análisis).

## Historial de contenido

- **2026-06-11/12**: se **reformularon 6 títulos** (de encuadre adulto-céntrico/obediencia a desarrollo centrado en el niño, ej. "No hace lo que le pido" → "Procesa las consignas a su propio ritmo") y se **agregaron 7 situaciones deportivas/de desarrollo** (suplente, compañero que se destaca, recibir corrección, gestionar el éxito, rol de referente, expectativa de los padres, subir de categoría), con sus 4 tarjetas DISC en es/en/pt. Categoría nueva "Rol" para las 3 de identidad/lugar en el equipo. En producción desde 2026-06-12.

## Estado de validación (LEER)

Las 15 situaciones originales declaran "Reviewed by psychologist" en el código (revisión humana en su momento; credencial/profundidad no verificable desde el repo).

Las **6 reformulaciones + 7 situaciones nuevas (2026-06)** son **contenido fundamentado y con criterio profesional, generado y revisado por IA** (autor IA como experto DISC + psicología infantil del deporte, segundo pase de consistencia DISC/tono, traducción fiel, linter de copy y revisión de consistencia). **NO están validadas clínicamente por un profesional matriculado** ni respaldadas por estudios empíricos de esas situaciones puntuales.

El owner decidió shippear a producción considerándolo "en mayor medida cosmético" (2026-06-12). Recomendación abierta para una próxima iteración: **sign-off de un psicólogo del deporte/infantil matriculado** sobre las 22 situaciones, y un descargo suave en la herramienta ("orientaciones, no diagnóstico") con crédito de revisor cuando exista.
