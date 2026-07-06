# Registro de decisiones — método e informe determinista

Ledger vivo de las decisiones tomadas con el owner sobre el corazón del método (el informe individualizado). Alimenta el plan de ejecución. Última actualización: 2026-07-06.

> Diseño completo y verificación: [`METODO-INFORME-DETERMINISTA.md`](./METODO-INFORME-DETERMINISTA.md). Age-norming del motor y vigilante: [`SEGURIDAD-HARDENING-20260706.md`](./SEGURIDAD-HARDENING-20260706.md).

## Decisiones cerradas

**D1 — Arquitectura de dos capas.** Capa 1 determinista (computa una "ficha de evidencia" de hechos + ensambla el esqueleto de qué bloque de concepto aprobado aplica y dónde) → Capa 2 IA (solo reescribe en prosa cálida, no decide ni inventa). Regla ipsativa: toda afirmación nace del agregado de los 12 votos + métricas de juego + momentos notables, nunca de una respuesta suelta.

**D2 — Motor normalizado por edad, auto-adaptable.**
- v1: tabla de factores de edad de bibliografía (curvas tipo Kail; `latenciaEfectiva = latenciaCruda / factorEdad`). Factores 8→1.45 ... 15-16→1.00.
- Se adapta al uso: por debajo de 500 juegos reales usa la semilla; de 500 en adelante cada banda de edad mezcla gradualmente sus propios datos, pesado por tamaño de muestra.
- **Excluir del conteo y de las normas:** `marianonoceti@gmail.com`, `mariano@yacare.io`, `federico.diaz.goberna@gmail.com`, y todo `is_demo`.
- Objetivo: construir población propia con el tiempo.

**D3 — QA se ajusta al algoritmo de producción.** `ai-eval.ts` usa `resolveFromAnswers` (el de producción), no el del spread. Sumar fixtures de métricas de juego (con edad) para cubrir los tres motores. Borrar/marcar el resolver muerto.

**D4 — Sección "patrón de decisión": siempre presente.** Cuando no hay suficientes tiempos válidos (dato faltante o ruidoso, no un tiempo "fuera de rango"), la sección existe igual con un texto estático honesto ("no reunimos suficientes datos de ritmo en esta sesión"). No se omite (respeta "iguales en estructura") ni se inventa un patrón.

**D5 — `wow` / `corazon` / `grupoEspacio`: eliminar.** Hoy la IA los genera pero no se renderizan en ningún lado (texto muerto sin gobernanza que consume tokens). Se quitan del schema del prompt, de la interfaz `AISections` y del render. (Ver también el análisis de módulos, D-pendiente.)

**D6 — Palabras puente: reemplazar, no anexar.** Los extras del eje secundario cambian *cuáles* ítems, manteniendo la *cantidad* fija por arquetipo. Estructura literalmente idéntica.

**D7 — Registro de confianza conservador hasta calibrar.** No usar lenguaje de certeza fuerte ("dominante claro / definido") salvo perfiles muy marcados (brecha de votos grande). Los moderados (la mayoría) lideran con "se inclina hacia / es una mezcla con". Se desbloquea lenguaje más firme cuando los datos propios prueben que una brecha dada es confiable (Monte Carlo + población). Reversible: humildes ahora, precisos después.

**D8 — Persistencia: guardar todo.** Se persiste la ficha de evidencia completa por perfilamiento. Garantiza (a) regeneración determinista (el mismo niño da siempre el mismo informe) y (b) la historia del niño para ver su evolución en el tiempo (parte del foso; habilita módulos de evolución que hoy no existen).
- **Extensión (del análisis de módulos, D10):** hoy `answers` se guarda como `{axis, responseTimeMs}` SIN identidad de pregunta. Para el módulo "un momento que lo mostró" (citar la escena real) hay que **persistir `question_id` por respuesta y versionar el banco de preguntas** (`question_version`). Sin eso, no se puede saber deterministamente en qué escena eligió qué, y el módulo caería en invención. Es un cambio de datos chico pero fundacional, prerequisito de A2 y de la estabilidad de respuestas (A13).

**D9 — Enforcement fail-closed con red de seguridad.** Cambio respecto de hoy (que es fail-open: si el filtro falla tras un reintento, manda el informe igual).
- **Modelo:** una sección no se libera hasta pasar todos los filtros.
- **Camino de falla:** tras un tope acotado de reintentos por sección, degrada al **texto estático pre-aprobado** de esa sección (pasa por construcción). Nunca se sirve texto de IA sin aprobar; nunca se deja a un niño sin informe.
- **Filtros:** palabras prohibidas + lenguaje determinista + band-guard (magnitudes "muy/fuerte/sobresale") + closed-moment (escenas/momentos inventados) + validador de formato + eje correcto (ground-truth) + **NUEVO: filtro de trazabilidad** (cada palabra de intensidad y cada momento nombrado debe apuntar a un campo de la ficha; si no se rastrea, rebota).
- **Ubicación y ajuste (requisito del owner):** el filtro debe estar ubicado en el lugar correcto y calibrado para que la tasa de informes que caen al respaldo estático sea **≈1%**.
- **Observabilidad (requisito del owner):** registrar por informe/sección qué filtros se dispararon, cuántos reintentos, y si cayó al respaldo. Métrica clave: **tasa de fallback (% servido desde estático), objetivo ≤1%**, con alerta si supera el umbral (señal de afinar prompt/guards, no de sumar más filtros). Vive en `ai_events` (extendido) + tablero.

**D12 — Un solo informe (sin split de vistas).** Decisión del owner: hay UN único informe, el mismo para ArgoOne y para entrenadores. No se hace uno para One y otro para coach. Se descarta el `viewer` coach|familia; todos reciben la misma estructura de 15 componentes. "Cómo leer tu equipo" queda fuera del informe (es individual); "Ecos fuera de la cancha" se queda dentro del informe único.

**D13 — Estructura definitiva del informe (15 componentes).** Cerrada con el owner:
1. Su perfil (arquetipo + segunda tendencia) · 2. Qué tan marcado es (banda de confianza, NUEVO) · 3. Su motor · 4. Cómo decide · 5. Qué lo enciende · 6. Palabras que lo encienden y las que lo apagan (puente/ruido) · 7. Guía rápida (mejorar más adelante) · 8. Checklist del día (se queda, muy valorado) · 9. Consejo de reset · 10. Manejo del éxito (NUEVO) · 11. Manejo de la frustración (NUEVO, hoy disperso) · 12. Cómo se banca lo inesperado (NUEVO) · 13. Cómo se lleva con los demás (NUEVO) · 14. Ecos fuera de la cancha · 15. Evolución (desde el 2.º perfilamiento; misma fuente que el dashboard `describeProfileChange`).
- Banda de confianza y evolución usan **una sola fuente de cálculo** (no contradecir el dashboard).
- Los 4 temas nuevos (10-13) tienen dato: manejo del éxito ← pregunta de la meta (Q12); frustración ← preguntas de tormenta; lo inesperado ← mini-juego de adaptación; los demás ← eje Conector + elecciones.

## Decisiones cerradas (cont.)

**D10 — Enriquecimiento de módulos: RESUELTO.** Plan completo en [`METODO-INFORME-MODULOS.md`](./METODO-INFORME-MODULOS.md). Resumen:
- **Quitar:** campos muertos (`axisCounts`, `wow`, `corazon`/`grupoEspacio` como salida); checklist y reset de la vista familia (IA libre/genérico) salvo que se anclen; la condicionalidad de "tendencia secundaria"; toda proyección/score/"mejora".
- **Enriquecer (barato, alto valor):** AxisBars + banda de confianza (la capa de honestidad F4, la de mayor prioridad); motor + sub-motores (F6, que ya está en `game_metrics`); patrón de decisión + ritmo por bloque; tendencia siempre presente ponderada por `second_count`.
- **Agregar:** confianza/mezcla (A1/A5), "un momento que lo mostró" (A2, requiere la extensión de D8), "en casa vas a notar" (A4, familia), "cómo leer tu equipo" (A8, coach), y todo el **bloque de evolución** (A10-A20, el foso, habilitado por D8).
- **Olas:** 1) banda de confianza + limpieza; 2) momento real + lectura de equipo + ritmo; 3) evolución (sin backfill); 4) lo que exige construir campos de ficha (F4b/F10/F6).
- Correcciones de la verificación ya anotadas en el doc (A2 no es shippeable sin `question_id`; F6 es barato; colapsar redundancias; fixes de copy).

## Decisiones pendientes (abiertas)

**D11 — Spec final endurecida.** Incorporar las 39 correcciones de la verificación adversarial + estas decisiones al esqueleto canónico, dejándolo listo para código. Incluye el i18n transversal (todo lexicón/biblioteca/guard es `Record<Lang, …>`).

## Próximo paso

Con D10 cerrada, la última abierta es D11 (spec final endurecida). Después, armar el **plan de ejecución** por fases combinando el worklist de la Parte E de `METODO-INFORME-DETERMINISTA.md` con el plan de olas de `METODO-INFORME-MODULOS.md`, con todas estas decisiones aplicadas.
