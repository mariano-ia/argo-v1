# Predictor Conductual (Guía situacional)

> Cómo funciona el contenido de situaciones del Predictor Conductual: estructura, convenciones para editar/agregar, y el estado de validación del contenido.
> Última actualización: 2026-06-12.

## Qué es

Una biblioteca curada de **situaciones reales de un entrenamiento** (8-16 años) con orientación concreta por **perfil DISC**. Cero tokens de IA: todo el contenido está pre-escrito en el repo. Se ve en el dashboard en la sección **Guía** (`/dashboard/guide`, componente `src/pages/tenant/TenantGuide.tsx`).

## Archivos

| Archivo | Qué tiene |
|---|---|
| `src/lib/situationalGuide.ts` | **Fuente (ES)** + las interfaces `Situation` / `SituationCard` + los helpers `getSituations(lang)` / `getSituationCards(lang)` (selectores por idioma). |
| `src/lib/situationalGuide.en.ts` | Traducción EN (`SITUATIONS_EN`, `SITUATION_CARDS_EN`). |
| `src/lib/situationalGuide.pt.ts` | Traducción PT-BR (`SITUATIONS_PT`, `SITUATION_CARDS_PT`). |
| `src/pages/tenant/TenantGuide.tsx` | Render + `CATEGORY_LABELS` (etiquetas de categoría por idioma) + `renderPerspectives` (mapa de marcadores por idioma). |

Los tres archivos comparten **la misma estructura**: un array de `Situation` y un array de `SituationCard`. Los **`id`, `eje` y `category` son identificadores: NO se traducen** (son los mismos en los 3 archivos). Solo se traduce el texto visible.

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
