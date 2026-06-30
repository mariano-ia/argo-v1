# Auditoría de lenguaje probabilístico — todo el producto

> Fecha: 2026-06-30. Revisión de solo lectura (nada modificado). Método: 6 auditorías paralelas,
> una por zona, contra el "Principio de voz Argo" (`docs/DESCRIPCION-CAMBIO-PERFIL.md` §3 +
> `api/generate-ai.ts` WRITING_RULES). Criterio: el lenguaje debe ser SIEMPRE probabilístico
> ("tiende a / suele / es probable que / podría / parece"), NUNCA categórico sobre el niño
> ("es / siempre / nunca / necesita / va a / definitivamente"), en clave de potencial, sin
> etiqueta clínica. Nombrar el arquetipo como RESULTADO ("tu perfil: Impulsor Dinámico") es válido.

## Veredicto y score global

**Score global: 69 / 100.** Base conceptual fuerte y disciplinada; el producto sabe que su voz es
probabilística y lo declara muy bien en varios lugares. Lo que baja la nota son tres huecos
**sistémicos** (no anecdóticos): (1) la única garantía determinística contra lo categórico —el filtro
de palabras prohibidas— es casi cosmética; (2) el contenido estático escrito a mano arranca en presente
categórico por plantilla; (3) los titulares de marketing prometen certeza que el propio producto jura no dar.

Conteo de respaldo: en el contenido estático principal, ~496 marcadores probabilísticos vs. ~172
construcciones potencialmente categóricas. La base es probabilística; los bolsones categóricos son reales.

## Scores por zona

| Zona | Score | Riesgo dominante |
|---|---|---|
| Contenido de arquetipos (es/en/pt) | 84 | `perfilExtended` abre en presente categórico (12×3) |
| Help / onboarding / dashboard | 78 | "identificamos cómo reacciona" / "revelan su perfil"; disclaimer no está en la entrada |
| Render del informe + revelado al niño | 72 | `decisionPattern` (web+PDF) y `childRevealTexts` ("eres X") |
| Marketing / landing / emails / blog | 68 | "revelar/descubrir/real/único/exacto" en meta tags, H1 de ads, CTA de blog, deck B2B |
| Predictor / guía situacional | 63 | tarjetas (~57×3) abren categórico + predicen futuro ("va a aceptar") |
| Guardrails de IA | 58 | el filtro determinista atrapa ~7 bigramas; pasa todo lo demás. Blog autopublica sin filtro |

## El hallazgo de fondo (una sola idea)

**El estándar de oro ya existe y está bien escrito; el problema no es saber qué decir, sino (a) hacerlo
cumplir automáticamente y (b) ponerlo en los puntos de entrada.** La frase modelo —"una fotografía del
presente, no una etiqueta permanente", "no evalúa talento ni predice el futuro... tendencias que pueden
evolucionar"— vive en el footer del informe, el footer del email, los bullets de consentimiento, dos
artículos del Help, Demo, Puentes, el FAQ de Argo One y `llms.txt`. Pero NO vive donde el usuario entra
(primer artículo del Help, primer slide del onboarding, titulares de marketing, meta tags) y NINGÚN
sistema impide que la copy se desvíe de él.

## Temas transversales

1. **El filtro determinista es casi cosmético (verificado ejecutando la lógica real).** Las listas
   `PROHIBITED_WORDS` son exhaustivas y trilingües para lo clínico/déficit (35+ términos), pero el
   componente "determinista" solo intercepta ~7 bigramas exactos ("siempre será", "nunca podrá", "nació
   para", "está destinado" + equivalentes en/pt). Pasan SIN detección, en los tres idiomas: "Mateo es un
   líder nato", "siempre", "nunca", "va a ser", "definitivamente", "sin duda", "garantiza", "is a",
   "will", "always", "é um", "vai", "sempre". La garantía contra lo categórico depende, en la práctica,
   solo de que el modelo obedezca el prompt.

2. **El contenido estático no pasa por ningún filtro, y ahí vive el presente categórico.** Dos patrones
   de plantilla: (a) los 12 `perfilExtended` de `archetypeData` abren con verbo en presente ("Se mueve
   antes...", "Combina...", "Lee el juego..."); (b) las ~57 tarjetas del predictor (`situationalGuide`)
   abren igual ("El Impulsor se castiga...", "El Conector vive...") y varias predicen futuro garantizado
   ("va a aceptar", "se activa solo"). Se arregla la plantilla una vez y se propaga ×3 idiomas.

3. **La superficie más sensible —lo que se le dice AL NIÑO— fija identidad.** `childRevealTexts` (36
   strings) abre con "eres la chispa / la fuerza..." + "Tienes un talento especial". El cierre del propio
   texto ya relativiza ("a veces preferirás observar, y eso está genial"), pero la apertura cristaliza un
   rasgo. Solución: anclar al evento ("hoy mostraste", "hoy se te dio") en vez de a la identidad ("eres").

4. **Los titulares de marketing contradicen la promesa del producto.** "revelar / descubrir / real /
   único / exacto / ideal" aparece en los meta tags de `index.html` (lo que ve Google y cada preview de
   WhatsApp), el H1 de la landing de ads, el CTA al pie de cada artículo de blog y el deck B2B, mientras
   la letra chica dice "no clasifica, no predice". Es desajuste promesa-entrega. Fix de vocabulario acotado.

5. **El blog autopublica sin red.** `blog-generate.ts` no tiene filtro post-generación; el humanizer
   posterior puede reintroducir determinismo ("toma posición", "rompe la regla de tres"); los metadatos
   SEO y la semilla de topics no heredan la regla probabilística. Es el canal de menos control y más alcance.

6. **Portugués es el idioma más determinista; en/pt arrastran guiones largos prohibidos.** Cuando hay
   determinismo, está espejado en los 3 idiomas (corregir = ×3). Pero pt tiende a soltar el sujeto
   suavizador ("Move-se", "Sabe", "Percebe"), y en/pt conservan em-dashes (—) que `CLAUDE.md` prohíbe;
   el español ya los eliminó.

## Hallazgos de severidad Alta (los que conviene mirar primero)

| Zona / archivo:línea | Texto actual | Reescritura probabilística |
|---|---|---|
| Guardrails — `generate-ai.ts:279`, `tenant-chat.ts:1247`, `generate-puentes.ts:19` | Filtro determinista = ~7 bigramas; pasa "es un líder / siempre / nunca / va a / is a / will / é um" | Detector `DETERMINISTIC_PATTERNS` unicode-aware, trilingüe, acotado a frases que nombran al niño |
| Guardrails — `blog-generate.ts` | Sin filtro post-generación; autopublica vía cron | Inline `findProhibitedWords` + detector determinista DESPUÉS del humanizer; si hay hits → `draft` |
| Marketing — `index.html` meta description | "12 arquetipos que **revelan como** tu deportista vive el deporte" | "...que **muestran tendencias** sobre cómo tu deportista vive el deporte" |
| Marketing — `ArgoOneLanding.tsx:98` (H1 de ads) | "Tu hijo tiene un perfil **único**. **Descúbrelo**" | "Tu hijo vive el deporte a su manera. **Conoce sus tendencias**" |
| Marketing — `BlogPost.tsx:9-11` (CTA al pie de cada post) | "**Descubre** el perfil conductual de tus deportistas" | "**Entiende mejor** el perfil conductual de tus deportistas" |
| Marketing — `Deck.tsx:128` / `argo-instituciones.html:1089,1120` | "conoce el perfil **real**" / "**revela** cómo vive el deporte" | "el perfil de tendencias que **mostró**" / "**muestra tendencias** sobre cómo vive el deporte" |
| Marketing — `Landing.tsx:1071,1294` | "**descubre su manera ideal**" / "el **lugar exacto** donde rinde" | "**identifica tendencias** en cómo vive" / "los **lugares donde tiende** a rendir" |
| Niño — `childRevealTexts.ts` (36 strings) | "eres la chispa..." + "Tienes un talento especial" | "hoy mostraste mucha chispa..." + "hoy usaste muy bien" |
| Predictor — `situationalGuide.ts` ~50 tarjetas | "El Impulsor **se castiga** desde la bronca" | "El Impulsor **suele castigarse** desde la bronca" |
| Predictor — `situationalGuide.ts:687,707,717` | "El Impulsor **va a aceptar** al nuevo cuando..." | "El Impulsor **tiende a aceptar** al nuevo cuando..." |
| Predictor — `situationalGuide.ts:729,423,1009` | "reacciona / responde así ante **cualquier** error" | "**suele responder** ante **un** error" |
| Arquetipos — `archetypeData.ts:243,245` | "el equipo puede contar con que **siempre estará**" / "quien **nunca abandona**" | "**suele poder contar** con que estará" / "quien **sostiene su posición** sin soltarla" |
| Arquetipos — los 12 `perfilExtended` (es/en/pt) | abren en presente categórico ("Se mueve antes...") | "**Tiende a moverse** antes..." (anteponer el matiz a la 1ª oración) |
| Render — `decisionPattern.ts:68,73,78` (web+PDF) | "**Necesita** los primeros minutos"; "es muy difícil de frenar"; "varía mucho" | "**Suele tomarse** los primeros minutos"; "tiende a costar frenarlo"; "parece variar" |
| Onboarding — `onboardingData.ts:27` + `onboardingDataI18n.ts` (es/en/pt) | "**identificamos** cómo se motiva, aprende y **reacciona**" | "**exploramos tendencias** de cómo se motiva, aprende y **suele reaccionar**" |

## Soluciones priorizadas

### P0 — máximo apalancamiento, esfuerzo bajo
1. **Cerrar el hueco del filtro determinista.** Un módulo `DETERMINISTIC_PATTERNS` (regex unicode-aware,
   acotado a oraciones que nombran al niño vía `mentionedPlayer` / `NAME_PLACEHOLDER`, trilingüe),
   inlineado en `generate-ai`, `tenant-chat` y `generate-puentes`. Sube el piso de TODA la salida de IA.
2. **Filtro post-generación en el blog** + correrlo DESPUÉS del humanizer + repetir la regla probabilística
   dentro del humanizer. Bloquear a `draft` si persiste tras reintento.
3. **Swap de vocabulario en marketing:** "revelar/descubrir → mostrar/reflejar/identificar tendencias";
   "real/único/exacto/ideal → tiende a / aproximación". Empezar por meta tags de `index.html` (alcance) y
   CTA de blog (conversión).

### P1 — patrones de contenido sistémicos
4. **Suavizar las plantillas:** anteponer "suele/tiende a/puede" a la 1ª oración de los 12 `perfilExtended`
   y de las ~57 tarjetas del predictor. Un patrón, replicado ×3 idiomas.
5. **Reescribir `childRevealTexts`** anclando al evento ("hoy mostraste") en vez de a la identidad ("eres").
   Conserva la calidez; quita la cristalización. 36 strings, una plantilla.
6. **Suavizar `decisionPattern.ts`** ("Necesita", "es muy difícil de frenar", "Sus mejores decisiones
   llegan", "varía mucho"). Impacta dos superficies (informe web + PDF descargable).

### P2 — reforzar y consolidar
7. **Mover el disclaimer de oro a la entrada:** primer artículo del Help (`como-funciona`) y primer slide
   del onboarding; arreglar "identificamos" y "revelan".
8. **Suavizar las `identity` del balance grupal** ("es el superpoder", "su combustible natural", "su manera
   natural de abordar cualquier desafío").
9. **Paridad de guardrails:** dar a `generate-ai` el mismo fallback seguro que ya tiene `tenant-chat`;
   consolidar (o agregar CI de sincronía) las 3 listas `PROHIBITED_WORDS` duplicadas, que ya divergen.
10. **Limpieza residual:** absolutos sueltos ("siempre estará", "nunca abandona", "no es X sino Y", "sin
    errores", "Tiene un radar") y em-dashes en `situationalGuide.en/pt` y `archetypeData.en/pt`.

## Qué está BIEN resuelto (no romper)

- Disclaimers del informe y del email (`odysseyTranslations`, `send-email.ts`): estándar de oro, trilingüe.
- Bullets de consentimiento firmados por el adulto: "fotografía del presente", "no es diagnóstico clínico".
- `bienvenida` de cada arquetipo: "no evalúa el talento ni predice el futuro... no son rasgos fijos".
- `profilePerspectives` de las 22 situaciones: modelo de voz probabilística a imitar.
- Few-shot de `tenant-chat` (3×3 idiomas): ejemplar, "una posibilidad / hipótesis / tiende a".
- Regla 11 anti-identidad de `tenant-chat` y regla 1 de `generate-puentes`: el principio correcto a nivel prompt.
- Dos artículos del Help (`entender-arquetipos`, `perfil-no-coincide`): "una foto del presente, no una
  etiqueta para siempre... una herramienta de lectura, no una verdad absoluta".
- Filtro clínico/déficit: exhaustivo y trilingüe (la mitad del estándar está sólida).
- Demo, Puentes, Argo One FAQ, `llms.txt`: "describe tendencias, no diagnostica / no clasifica, no predice".

## Nota operativa

Cuando hay determinismo, casi siempre está espejado en es/en/pt, así que toda corrección de contenido se
aplica ×3 (y el onboarding duplica el texto en `onboardingData.ts` + `onboardingDataI18n.ts`). La buena
noticia: casi todos los hallazgos son un puñado de PLANTILLAS y un MÓDULO de filtro compartido, no cientos
de frases independientes. Es alto apalancamiento.
