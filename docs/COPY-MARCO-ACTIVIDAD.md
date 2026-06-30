# Marco de copy: "la actividad / el deporte", no solo "el entrenamiento"

> Decisión de voz de producto (2026-06-30). El copy NO debe encuadrar el acompañamiento
> solo en el momento de entrenar. El perfil aplica igual a partidos, competencias, juego
> libre y al día a día del deporte, y a padres que nunca van a un entrenamiento. Hablar
> solo de "el entrenamiento" estrecha el producto y excluye a esa audiencia.

## Vocabulario canónico (es / en / pt)
| Cuándo | es | en | pt |
|---|---|---|---|
| Paraguas neutro | **la actividad** | the activity | a atividade |
| Hacer el deporte | **el deporte** | the sport | o esporte |
| Momento en juego | **en la cancha** | on the field | em campo |

No es buscar-y-reemplazar 1:1: **reencuadrar**. Ej.: "Si no sabe qué se va a entrenar" →
"Si no sabe qué va a pasar en la actividad". Cuando convenga enumerar, usar el paraguas con
ejemplos entre paréntesis: "la actividad (entrenamientos, partidos, competencias)".

## Checklist diario (nombre unificado del feature)
- Título: es **"Checklist del día"** / en **"Daily checklist"** / pt **"Checklist do dia"**.
  (Reemplazó "Checklist de entrenamiento", que contradecía su propio contenido antes/durante/después de un partido.)
- Pasos SIN sustantivo (el título ya da contexto): es "Antes / Durante / Después" ·
  en "Before / During / After" · pt "Antes / Durante / Depois".

## Qué NO tocar (excepciones deliberadas)
1. **El rol "entrenador / coach / treinador"** es una persona, no el momento. Queda intacto.
2. **El contraste entrenamiento-vs-partido** en la situación "se congela en el partido"
   del Sostén/Sustentador: frases como "hoy jugamos como en el entrenamiento, nada raro"
   calman al niño anclándolo en lo conocido. Cambiarlas rompe el sentido. (`situationalGuide.*`
   y `tenant-chat.ts`.)
3. **Identificadores de código / claves i18n** (ej. `checklistEntrenamiento`): solo cambia
   el valor mostrado, nunca la clave.
4. **Pregunta Puentes** "si {nombre} no quiere ir a entrenar un día": escenario genuinamente
   específico de la sesión; se mantiene.
5. **Enumeraciones que ya incluyen** entrenamiento + partido + otros momentos: ya son amplias.

## Aplicado en (2026-06-30)
Auditoría multi-superficie (197 menciones; 153 ampliadas) + implementación en 35 archivos
user-facing × 3 idiomas: informe/Predictor, odisea, dashboard (guía, simulador, balance,
ficha), consultor IA, prompts de IA (`generate-ai`, `deck-chat`), Centro de ayuda, emails,
deck y landing. Verificado: build, lint:content (cero voseo/guiones), typecheck:api,
check:api-imports. Ver también: reglas de copy en `CLAUDE.md` (latino neutro, sin guiones,
probabilístico).
