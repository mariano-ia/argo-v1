# Argo — Nomenclatura canónica de arquetipos (ÚNICA fuente de verdad)

> **Regla de oro:** estos son los **únicos** nombres válidos para los perfiles.
> Cualquier otro nombre histórico está **prohibido** y debe eliminarse al encontrarlo.
> **Reescrito 2026-07-06** al esquema **eje × veta** (antes era `[Eje] [Motor]`; ese esquema quedó **prohibido**, ver abajo). Toda coherencia es **hacia adelante** (no se migran informes ya guardados en la DB; conservan su label viejo).
> Cálculo (gates, bandas, formas, motor): `docs/METODO-CALCULO-NUEVO.md`. Este doc = **nombres/labels**; ese doc = **cálculo**.

## Modelo

El perfil se nombra como un **blend DISC**: **`[Eje primario] con veta [Eje secundario]`**.

- **Eje primario** = eje DISC más votado. `D → Impulsor`, `I → Conector`, `S → Sostenedor`, `C → Estratega`.
- **Veta** = **segundo eje más votado** (NO una palabra de tempo). Es otro eje.
- **El tempo salió del nombre.** Dinámico/Rítmico/Sereno/Observador (y Rápido/Medio/Lento) **ya no nombran perfiles ni vetas**: pasan a la sección **"Su motor"** como insight cronométrico per-child (ver "El tempo NO es nombre").

### Tres formas nombrables (gateadas por los datos)

El nombre depende de dos gates de confianza (spec §1/§3, calibrados por enumeración de las 455 composiciones):

1. **Primario puro (4):** `[Eje]` — "Impulsor" / "Conector" / "Sostenedor" / "Estratega". Se usa cuando el primario pasa el **name-gate** (`B ≥ 4` **O** (`B ≥ 2` **∧** `top_count ≥ 7`)) pero la veta **no** se afirma (`B2 ≤ 3`, o la veta es un eje opuesto).
2. **Blend (8 no-opuestos):** `[Eje primario] con veta [Eje secundario]` — p. ej. "Impulsor con veta Estratega". Se usa cuando el primario pasa el name-gate **Y** `B2 ≥ 4` **Y** el eje secundario **no es el diagonal opuesto** del primario.
3. **Sin sustantivo (par / tendencia):** cuando el primario **no** pasa el name-gate — "una mezcla entre X e Y" / co-líderes. No lleva nombre de arquetipo.

> `B = votos(1º) − votos(2º)` gatea el **primario**. `B2 = votos(2º) − votos(3º)` gatea la **veta**. Son independientes.

## Regla de ejes OPUESTOS (D↔S, I↔C)

Los pares diagonales del círculo DISC **nunca forman nombre compuesto**:

- **Impulsor ↔ Sostenedor** (D↔S) y **Conector ↔ Estratega** (I↔C).
- Si la veta cae en el eje opuesto del primario, **el nombre se queda en el primario puro** (aunque `B2 ≥ 4`). La veta opuesta se **narra en el cuerpo** del informe como dos conductas dependientes del contexto que co-ocurren, con vocabulario de eje **positivo**, **sin** los adjetivos "raro / inusual / en tensión / contradictorio" y **sin** el "pero" de conflicto (se usa "y"). Ver `METODO-CALCULO-NUEVO.md` §3.2.
- **La tabla NO agrega filas por opuestos.** No existe "Impulsor con veta Sostenedor" como nombre.
- **Aplicado en código el 2026-07-13** (owner): `buildVotesEvidence` (ficha) y `buildReportHero` (informe/email/dashboard/coach) devuelven el **primario puro** cuando `veta_opuesta = true`, y el lead omite la cláusula de veta. Esto **revierte** la "regla dura" del 2026-07-07 (que nombraba también los opuestos) y realinea el código con esta regla. Forward-only: los informes ya guardados conservan su label viejo.

## Nombres canónicos

### Primarios puros (4)

| id de eje | Eje DISC | Español | English | Português |
|---|---|---|---|---|
| `impulsor` | D | Impulsor | Driver | Impulsionador |
| `conector` | I | Conector | Connector | Conector |
| `sostenedor` | S | Sostenedor | Sustainer | Sustentador |
| `estratega` | C | Estratega | Strategist | Estrategista |

### Blends no-opuestos (8)

El nombre es **derivado**: `[label primario] con veta [label eje secundario]`. Contenido keyed por par de ejes `[primario]_[secundario]` (D/I/S/C) en `TENDENCIA_CONTENT`.

| par (P_S) | Español | English | Português |
|---|---|---|---|
| D_I | Impulsor con veta Conector | Driver with a Connector lean | Impulsionador com veta Conector |
| D_C | Impulsor con veta Estratega | Driver with a Strategist lean | Impulsionador com veta Estrategista |
| I_D | Conector con veta Impulsor | Connector with a Driver lean | Conector com veta Impulsionador |
| I_S | Conector con veta Sostenedor | Connector with a Sustainer lean | Conector com veta Sustentador |
| S_I | Sostenedor con veta Conector | Sustainer with a Connector lean | Sustentador com veta Conector |
| S_C | Sostenedor con veta Estratega | Sustainer with a Strategist lean | Sustentador com veta Estrategista |
| C_D | Estratega con veta Impulsor | Strategist with a Driver lean | Estrategista com veta Impulsionador |
| C_S | Estratega con veta Sostenedor | Strategist with a Sustainer lean | Estrategista com veta Sustentador |

> **Opuestos excluidos** (no llevan nombre compuesto): D_S, S_D, I_C, C_I.
> **CONVENCIÓN PROVISIONAL (confirmar owner):** el sintagma "con veta" (es) / "with a … lean" (en) / "com veta" (pt). Alternativas es: "con matiz de", "con inclinación a". EN ya NO invierte el orden (el viejo "Dynamic Driver" invertía eje×tempo; el blend eje×eje va primario primero). Marcado como decisión abierta #3 del plan.

## El tempo NO es nombre ("Su motor")

Las palabras **Dinámico / Rítmico / Sereno / Observador** y los valores internos **Rápido / Medio / Lento** dejan de existir como nombre. El tempo se mide en los mini-juegos y vive **solo** en la sección **"Su motor"** del informe, como **insight per-child** con léxico **cronométrico** ("respondió tomándose más tiempo" / "respondió rápido"), lectura normativa por edad con intervalo ancho, nunca para rankear. **Prohibido en cualquier nombre o veta**, y prohibido el léxico **disposicional** del tempo: reflexivo / impulsivo / meditado / ágil / calmo / tranquilo / nervioso. Ver `METODO-CALCULO-NUEVO.md` §2.

## Eje vs Arquetipo (no confundir)

| Eje | Nombre del eje | Label del arquetipo |
|---|---|---|
| D | Impulsor | Impulsor |
| I | Conector | Conector |
| S | **Sostén** | **Sostenedor** |
| C | Estratega | Estratega |

El eje `S` se llama **"Sostén"** (la cualidad); el nombre del perfil usa **"Sostenedor"** (quien sostiene). Intencional. Definido en `src/lib/designTokens.ts` (`AXIS_LABELS`). El **2º término del nombre (la veta)** usa el label del arquetipo del eje secundario (Impulsor/Conector/Sostenedor/Estratega).

## Dónde viven los nombres (registro COMPLETO de mapas espejo — checklist de las fases 1-9)

**Fuente de verdad de las etiquetas base:** `src/lib/archetypeData.ts` (ES) / `.en.ts` / `.pt.ts` — 4 bases por eje + `TENDENCIA_CONTENT` (keyed `[primario]_[secundario]`, ya eje×eje) elevado a substrato del nombre, gateado por `vetaBanda`.

**Mapas espejo que DEBEN coincidir** (si tocás uno, tocá todos, en es/en/pt):

| # | Archivo | Símbolo | Nota |
|---|---|---|---|
| 1 | `src/pages/tenant/TenantHome.tsx` | `ARCHETYPE_LABELS`, key `${eje}-${motor}`→`${eje}-${ejeSecundario}`, dev-data | usar `buildDisplayName(ficha,lang)` de argosEngine |
| 2 | `src/context/LangContext.tsx` | listas `profiles` es/en/pt, `archetypes.sub` | 12 = 4 puros + 8 blends |
| 3 | `src/pages/Landing.tsx` | `ARCHETYPES`, `ARCHETYPE_DESCRIPTIONS`, quitar `motorBars`, `archIdx` | tercer módulo "Su motor" aparte |
| 4 | `api/tenant-chat.ts` | `canonicalArchetype`, `MOTOR_DISPLAY`, `FORBIDDEN_OLD_LABELS`, `wrongAxis`, KB (región GENERATED → `scripts/coach-prompt-source.ts`) | NUNCA hand-editar GENERATED |
| 5 | `api/blog-generate.ts` `ARGO_ARCHETYPES` + `api/blog-cron.ts` `ARCHETYPE_LABELS` | ids idénticos entre ambos | regla anti eje×tempo en el prompt |
| 6 | `index.html` | meta/og/JSON-LD copy, quitar "Motor"/"36 variantes"/"brújula secundaria" | **NO tocar `name:'Argo Method'` de JSON-LD** |
| 7 | `public/sales/argo-instituciones.html` | `PROFILES`, borrar `motorBars`/CSS `fc-motor-chip` | chips estáticos + FAQ eje×veta |
| 8 | `src/lib/dashboardTranslations.ts` | `motorNames`→cronométrico o fuera, `tendenciaLabels`→"con veta X", eliminar `distribucionMotor`/`perfilMotorGrupo`, +`bandaLabels` | |
| 9 | `src/lib/odysseyTranslations.ts` | `motorDisplayNames`→`motorZonaLabels` cronométrico | |
| 10 | `src/lib/designTokens.ts` | `MOTOR_CHIP`/`MOTOR_CHIP_STYLE` (→`MOTOR_ZONA_CHIP` o eliminar); `AXIS_LABELS` sin cambio | decisión #5 |
| 11 | `src/lib/childRevealTexts.ts` (+_EN/_PT) | `CHILD_REVEAL_TEXTS` 12 keys eje_motor → 4 keys por eje | sin etiqueta identitaria al niño |
| 12 | `src/lib/helpContent.ts` (+.en/.pt) | art. "12 perfiles", "cómo se calcula" | brújula secundaria → veta |
| 13 | `api/send-email.ts` | `MOTOR_LABELS`/`MOTOR_STYLE`, header sin chip motor | fila "Su motor" opcional |
| 14 | `supabase/migrations/…ai_events.sql` | `label_violation` (invertir: los 12 eje×tempo pasan a prohibidos) | |

## Nombres PROHIBIDOS (eliminar al encontrarlos, en es/en/pt)

- **Esquema eje×tempo (el viejo, prohibido desde 2026-07-06):** Impulsor Dinámico/Rítmico/Sereno, Conector Dinámico/Rítmico/Sereno, Sostenedor Dinámico/Rítmico/Sereno, Estratega Dinámico/Rítmico/Observador. **EN:** Dynamic/Rhythmic/Serene Driver, Dynamic/Rhythmic/Serene Connector, Dynamic/Rhythmic/Serene Sustainer, Dynamic/Rhythmic/Observant Strategist. **PT:** Impulsionador Dinâmico/Rítmico/Sereno, Conector Dinâmico/Rítmico/Sereno, Sustentador Dinâmico/Rítmico/Sereno, Estrategista Dinâmico/Rítmico/Observador.
- **Metáfora antigua:** El Capitán, La Brújula, El Explorador, El Tanque (y cualquier "El/La + sustantivo" como nombre de perfil).
- **Esquema de adjetivos:** Impulsor Decidido/Persistente, Conector Vibrante/Relacional/Reflexivo, Sostén Ágil/Confiable, Estratega Reactivo/Analítico.
- **Esquema del blog viejo:** Conector Expresivo/Armónico/Profundo, Sostén Adaptable/Estable/Reflexivo, Estratega Ágil/Preciso/Cauteloso.
- **EN viejo:** Decisive/Persistent Driver, Vibrant/Relational/Reflective Connector, Agile/Reliable Supporter, Reactive/Analytical/Observer Strategist.
- **PT viejo:** Impulsor (como prefijo, usar Impulsionador), Sustento (usar Sustentador), Estrategista Reativo/Analítico.

> "La Brújula Secundaria" y la metáfora náutica de la odisea (puerto, capitán, brújula) son **narrativa del juego**, NO nombres de perfil: esas se conservan.

## Nota sobre la base de datos (forward-only)

Los informes ya generados guardan `archetype_label` como copia estática. **No se migran** (decisión 2026-06-02, reafirmada): los informes viejos conservan su nombre eje×tempo; solo los nuevos (`method_version = 'v4'`) usan esta nomenclatura. Los reportes con `method_version` NULL o < v4 se tratan por el branch legacy.

## Gotchas al renombrar (LEER antes de tocar labels)

1. **Validador anti-alucinación por substring** (`api/tenant-chat.ts`, `wrongAxis`): detecta eje equivocado por `includes()` de tokens de eje. Al cambiar labels, **agregá el token nuevo a las filas D/I/S/C**. Caso real: `Sostén → Sostenedor` rompió la detección (`'sostén'` no es substring de `'Sostenedor'`); se arregló agregando `'sostenedor'`. Mantené el token EN (`'sustainer'`, `'driver'`, `'connector'`, `'strategist'`).
2. **No derivar el label del id.** Nunca title-cases el id snake_case. Usá `getEjeBase(eje).label` / `buildDisplayName(ficha,lang)`.
3. **Sincronizá TODOS los mapas espejo** de la tabla anterior en el mismo cambio, es/en/pt, y barré `api/` además de `src/`.
4. **El nombre se concatena en runtime** (`label` + veta): un grep de string contiguo **NO** caza "Impulsor con veta Estratega" (mismo gotcha que `ProductName`/`BrandName`). El content-linter (Fase 10) debe mirar la composición, no solo literales, y grepear los **12 eje×tempo** para que no reaparezcan.
5. **Eje ≠ arquetipo.** El eje S es "Sostén" (ES) / "Supporter" (EN); el nombre es "Sostenedor" / "Sustainer". No los unifiques.
6. **ids snake_case estables:** los datos base se keyean por eje (`impulsor`/`conector`/`sostenedor`/`estratega`); el contenido de veta por par de ejes (`D_C`, etc.). No inventes ids de blend nuevos.
