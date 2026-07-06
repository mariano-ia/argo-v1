# Método Argo — ESTADO ACTUAL (punto de retorno)

> Fotografía del cálculo del perfil **como corre hoy en producción**, antes de la reforma documentada en `METODO-CALCULO-NUEVO.md`. Sirve como línea base para volver atrás si la nueva versión funciona mal. La verdad de código está en `src/lib/profileResolver.ts` y `src/lib/argosEngine.ts`; git es el punto de retorno real, este doc es la referencia legible. Fecha: 2026-07-06.

## 1. Eje (DISC) — hoy

- **12 preguntas** de opción múltiple, cada una con 4 opciones, una por eje (D=Impulsor, I=Conector, S=Sostén, C=Estratega). Escala **ipsativa**: 12 votos repartidos entre 4 ejes.
- Se cuentan los votos. **Más votado = eje dominante; 2.º = eje secundario.** (`resolveProfile`, `profileResolver.ts:98`.)
- **Tendencia secundaria:** `TENDENCIA_LABELS[eje_secundario]` (`profileResolver.ts:78-83`): D="con tendencia a la acción", I="a lo social", S="a la calma firme", C="al detalle".
- **Desempate (dispersión):** solo ante empate exacto de votos; consulta sesiones previas y favorece el eje menos representado. Marcado `tiebreakerApplied`. Es diseño de producto, no psicométrico.
- Colores de opción posicionales fijos (A=celeste, B=ámbar, C=violeta, D=esmeralda); nunca revelan el eje.

## 2. Motor — hoy (SIN normalización por edad)

Tres mini-juegos → un puntaje 0-100 cada uno → promedio ponderado → banda. (`resolveMotorFromGames`, `profileResolver.ts:23-66`.)

| Vector | Mini-juego | Fórmula (0-100, clamp) | Peso |
|---|---|---|---|
| Impulso | El cofre (latencia de carta) | `(1 − (avgLatency − 800)/4200) × 100` | 0.30 |
| Ritmo | Mar abierto (reacción) | `(1 − (avgReaction − 200)/1300) × 100` + bonus impulsividad (`min(15, extraTaps×5)`) | 0.30 |
| Adaptación | La Tormenta | `(1 − (avgAdaptation − 300)/3700) × 100` − penalidad inercia (`min(30, inertiaErrors×10)`) | 0.40 |

- Composite = promedio ponderado (pesos re-normalizados si falta algún juego).
- **Umbrales fijos, iguales para toda edad:** composite **≥ 67 → Rápido (Dinámico)**, **≤ 33 → Lento (Sereno)**, resto **Medio (Rítmico)**.
- **Fallback** si no hay métricas de juego: por tiempo de respuesta promedio (`<5000ms → Rápido`, `>12000ms → Lento`, else Medio), con un ajuste por dispersión de ejes.

## 3. Arquetipo — hoy

- `[Eje][Motor]` → 1 de 12. Resuelve `ARQUETIPOS.find(a => a.eje === dominante && a.motor === motor)`.
- Nombres canónicos: Impulsor/Conector/Sostenedor/Estratega × Dinámico/Rítmico/Sereno (C+Lento = "Observador"). Ver `docs/archetype-naming.md`.

## 4. Informe — hoy

Base estática por arquetipo (`archetypeData.ts`, es/en/pt) reescrita por Gemini (`generate-ai.ts`). Secciones renderizadas (`ReportPage.tsx`): Hero (arquetipo + tendencia + chip de motor + AxisBars por votos), Motor, Qué lo mueve, Patrón de decisión, Palabras puente/ruido, Tendencia secundaria, Guía rápida, Checklist del día, Ecos, Reset. Enforcement **fail-open** (si el filtro falla tras un reintento, se sirve igual).

## 5. Limitaciones conocidas del estado actual (documentadas)

- **Motor sin normas por edad:** umbrales fijos → puede medir madurez del desarrollo, no tempo disposicional (`FUNDAMENTO-CIENTIFICO-DISC.md` lo llama "la limitación más seria").
- **Sin banda de confianza:** un 5-4 y un 9-1 rinden el mismo lenguaje; no se comunica mezcla.
- **Escala corta ipsativa:** un dominante con 4-5 votos está poco separado del azar; no comparable entre chicos.
- **Dos implementaciones divergentes:** producción usa `resolveMotorFromGames` (juegos); el harness de QA usa `resolveProfile` (spread de votos DISC).
- **Sin validación empírica propia** (test-retest, validez de constructo): declarado como agenda, no resultado.
- **Enforcement fail-open** + filtro de lenguaje que no caza "muy/fuerte/sobresale".
- `answers` se guarda sin identidad de pregunta (solo `{axis, responseTimeMs}`).

## Cómo volver a este estado

`git revert`/`git checkout` de los commits de la reforma, más revertir la migración de normas por edad y de persistencia de ficha (que serán reversibles por diseño). La lógica de arriba es la definición de "el método viejo".
