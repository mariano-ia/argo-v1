# Argo — Nomenclatura canónica de arquetipos (ÚNICA fuente de verdad)

> **Regla de oro:** estos son los **únicos** nombres válidos para los 12 perfiles.
> Cualquier otro nombre histórico está **prohibido** y debe eliminarse al encontrarlo.
> Última alineación: 2026-06-02. Toda coherencia es **hacia adelante** (no se migran informes ya guardados en la DB).

## Modelo

Cada perfil se nombra **`[Eje] [Motor]`**.

- **Eje** (dimensión dominante DISC): `D → Impulsor`, `I → Conector`, `S → Sostenedor`, `C → Estratega`.
- **Motor** (tempo de decisión, valor interno → nombre visible):
  `Rápido → Dinámico` · `Medio → Rítmico` · `Lento → Sereno`.
  Excepción: en el eje **C + Lento** el nombre visible del motor es **Observador** (no "Sereno").

## Los 12 arquetipos

| id interno | Eje | Motor (interno) | Español | English | Português |
|---|---|---|---|---|---|
| `impulsor_dinamico` | D | Rápido | Impulsor Dinámico | Dynamic Driver | Impulsionador Dinâmico |
| `impulsor_decidido` | D | Medio | Impulsor Rítmico | Rhythmic Driver | Impulsionador Rítmico |
| `impulsor_persistente` | D | Lento | Impulsor Sereno | Serene Driver | Impulsionador Sereno |
| `conector_vibrante` | I | Rápido | Conector Dinámico | Dynamic Connector | Conector Dinâmico |
| `conector_relacional` | I | Medio | Conector Rítmico | Rhythmic Connector | Conector Rítmico |
| `conector_reflexivo` | I | Lento | Conector Sereno | Serene Connector | Conector Sereno |
| `sosten_agil` | S | Rápido | Sostenedor Dinámico | Dynamic Sustainer | Sustentador Dinâmico |
| `sosten_confiable` | S | Medio | Sostenedor Rítmico | Rhythmic Sustainer | Sustentador Rítmico |
| `sosten_sereno` | S | Lento | Sostenedor Sereno | Serene Sustainer | Sustentador Sereno |
| `estratega_reactivo` | C | Rápido | Estratega Dinámico | Dynamic Strategist | Estrategista Dinâmico |
| `estratega_analitico` | C | Medio | Estratega Rítmico | Rhythmic Strategist | Estrategista Rítmico |
| `estratega_observador` | C | Lento | Estratega Observador | Observant Strategist | Estrategista Observador |

> Nota: el **id interno** (snake_case) es estable y NO se cambia. Solo cambian las etiquetas visibles
> (`label`). Por eso ids como `impulsor_decidido` conviven con la etiqueta "Impulsor Rítmico".

## Eje vs Arquetipo (no confundir)

El **eje** se nombra distinto del prefijo del arquetipo en un solo caso:

| Eje | Nombre del eje | Prefijo del arquetipo |
|---|---|---|
| D | Impulsor | Impulsor |
| I | Conector | Conector |
| S | **Sostén** | **Sostenedor** |
| C | Estratega | Estratega |

El eje `S` se llama **"Sostén"** (la cualidad); el arquetipo usa **"Sostenedor"** (quien sostiene).
Esto es intencional. Definido en `src/lib/designTokens.ts` (`AXIS_LABELS`).

## Dónde viven los nombres (mantener sincronizado)

**Fuente de verdad de las etiquetas:**
- `src/lib/archetypeData.ts` (ES), `archetypeData.en.ts` (EN), `archetypeData.pt.ts` (PT) — campo `label`.

**Mapas espejo que DEBEN coincidir** (si tocas uno, tocá todos):
- `src/pages/tenant/TenantHome.tsx` → `ARCHETYPE_LABELS`
- `src/context/LangContext.tsx` → listas `profiles` (es/en/pt)
- `src/pages/Landing.tsx` → `ARCHETYPES`
- `api/tenant-chat.ts` → base de conocimiento (es/en/pt)
- `api/blog-generate.ts` → `ARGO_ARCHETYPES` · `api/blog-cron.ts` → `ARCHETYPE_LABELS`
- `index.html`, `public/sales/*.html` → schema/copy

**Motor visible** (Rápido/Medio/Lento → Dinámico/Rítmico/Sereno):
- `src/lib/dashboardTranslations.ts` → `motorNames` (es/en/pt)
- `src/lib/odysseyTranslations.ts` → `motorDisplayNames` (es/en/pt)

## Nombres PROHIBIDOS (históricos, nunca usar)

Si aparecen en código, copy, mock data, tests o memoria, **eliminar**:

- **Metáfora antigua:** El Capitán, La Brújula, El Explorador, El Tanque (y cualquier "El/La + sustantivo" como nombre de perfil).
- **Esquema de adjetivos (motor del informe viejo):** Impulsor Decidido/Persistente, Conector Vibrante/Relacional/Reflexivo, Sostén Ágil/Confiable, Estratega Reactivo/Analítico.
- **Esquema del blog viejo:** Conector Expresivo/Armónico/Profundo, Sostén Adaptable/Estable/Reflexivo, Estratega Ágil/Preciso/Cauteloso.
- **EN viejo:** Decisive/Persistent Driver, Vibrant/Relational/Reflective Connector, Agile/Reliable Supporter (o Sustainer), Reactive/Analytical/Observer Strategist.
- **PT viejo:** Impulsor (como prefijo, usar Impulsionador), Sustento (usar Sustentador), Estrategista Reativo/Analítico.

> "La Brújula Secundaria" y la metáfora náutica de la odisea (puerto, capitán, brújula) son **narrativa del juego**, NO nombres de perfil: esas se conservan.

## Nota sobre la base de datos

Los informes ya generados guardan `archetype_label` como copia estática. Por decisión del 2026-06-02,
**no se migran**: los informes viejos conservan su nombre anterior y solo los nuevos usan esta nomenclatura.

## Gotchas al renombrar (LEER antes de tocar labels)

1. **Validador anti-alucinación por substring** (`api/tenant-chat.ts`, mapa `wrongAxis`):
   la capa 5 de anti-hallucination detecta si la IA atribuye el eje equivocado a un jugador
   haciendo `includes()` de tokens de eje contra el texto de la respuesta. Si renombras un
   label, **agrega el token nuevo a las filas D/I/C correspondientes** o el validador deja de
   detectar el error en silencio. Caso real: el rename `Sostén → Sostenedor` rompió la
   detección porque `'sostén'` no es substring de `'Sostenedor'`; se arregló agregando
   `'sostenedor'`. Mantené también el token EN (`'sustainer'`).
2. **No derivar el label del id.** Nunca construyas el nombre visible title-casing el id
   snake_case (mostraría nombres viejos: `impulsor_decidido` → "Impulsor Decidido"). Usá
   `ARCHETYPE_DATA[id].label`. (Bug real corregido en `ResultRevealPreview.tsx`.)
3. **Sincronizá TODOS los mapas espejo** de la sección anterior en el mismo cambio, en es/en/pt,
   y barré `api/` además de `src/` (los emails y prompts de IA viven ahí: `one-webhook`,
   `deck-chat`, `admin-tenants`).
4. **El motor visible se mapea aparte** (Rápido→Dinámico). No muestres el valor interno crudo.
5. **Eje ≠ arquetipo.** El eje S es "Sostén" (ES) / "Supporter" (EN); el arquetipo es
   "Sostenedor" / "Sustainer". Es intencional: no los unifiques.
