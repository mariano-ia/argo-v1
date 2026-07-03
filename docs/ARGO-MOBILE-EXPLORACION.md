# Exploración: versión mobile exclusiva de Argo (roadmap #16, ampliado)

> Estado: opción B ("Modo Cancha") CONFIRMADA por uso; **B1 parcialmente EN
> PRODUCCIÓN desde 2026-07-03**. El resto del doc conserva la exploración
> original para contexto.

## As-built B1 (2026-07-03, decisiones del owner en iteración)

- **Tab bar inferior** (< md): Inicio · Jugadores · [Compartir link] · Coach ·
  Grupos. Sin pestaña "Más" y **sin menú hamburguesa**: en mobile solo
  existen las superficies de cancha; Ajustes/Ayuda/Guía/administración son
  desktop-only por decisión explícita del owner.
- **Compartir link** es el botón central destacado (círculo violeta elevado,
  etiqueta "Compartir link"): el tap COPIA el link y una snackbar sobre el
  botón confirma "Link copiado. Ya puedes compartirlo." (solo texto, sin
  acción dentro: el owner pidió sacar el enlace "Compartir"). El link es
  contextual (plantel activo o institución) y hay guard de equipo completo.
- **Switch de planteles en la topbar mobile, extremo derecho** (pastilla +
  dropdown; incluye el sombrero Administración para no-coaches; oculto si no
  hay nada que cambiar). Reemplaza el acceso al context switcher que se
  perdió al sacar la hamburguesa.
- Base técnica: alto en 100dvh, safe-area inset, padding inferior del main,
  chat con altura ajustada a la barra.

**Pendiente del Modo Cancha:** superficie "Hoy" (qué observar en la sesión
según los perfiles del plantel), ficha pocket del jugador, "Registrar"
(espera la feature de notas), pulido PWA instalable y dictado por voz.

## El usuario mobile real

El entrenador con el teléfono en la mano tiene 3 momentos de uso, todos cortos
y todos al borde de la cancha:

1. **Antes de la sesión (2-5 min)**: "¿qué tengo hoy? ¿a quién miro?"
2. **Durante/entre ejercicios (30 seg)**: consulta puntual sobre un niño que
   acaba de hacer algo ("Fede se volvió a frenar").
3. **Después de la sesión (1-2 min)**: registrar lo que pasó antes de que se
   olvide (conecta directo con la feature de notas que se viene).

Nada de esto es "el dashboard achicado": es otra herramienta. El dashboard
desktop es de ANÁLISIS (planteles, química, reportes, administración); el
mobile es de ACCIÓN en contexto.

## Tres opciones de arquitectura

### A. Responsive profundo del dashboard actual
Arreglar cada página para que funcione bien en el teléfono.
- Pro: un solo código, sin decisiones de producto.
- Contra: hereda la densidad del desktop; la administración (planteles,
  usuarios, billing) no tiene sentido táctil; mucho trabajo distribuido en 10
  páginas para una experiencia mediocre. Es lo que el owner descartó al
  ampliar el alcance.

### B. "Modo Cancha": superficie mobile propia y reducida (RECOMENDADA)
Una experiencia mobile-first con SOLO las 4 superficies del contexto cancha,
servida desde el mismo repo/login (sin app store):

1. **Hoy** (home): el plantel activo, 2-3 "qué observar hoy" generados de los
   perfiles, acceso a la sesión de chat de preparación.
2. **ArgoCoach** (centro de la experiencia): el chat a pantalla completa,
   con dictado por voz como input futuro. El modo consultivo brilla acá.
3. **Jugadores**: lista liviana → "ficha pocket" de un niño (arquetipo,
   combustible, 3 palabras puente, 3 palabras a evitar, botón consultar).
   Nada de PDF, historial completo ni edición.
4. **Registrar**: una nota rápida sobre un niño (cuando llegue la feature de
   notas). Un tap, dictado o texto, listo.

Lo que queda EXCLUSIVO de desktop: administración de planteles y usuarios,
química de grupos (creación/edición; la consulta vía chat sí está en mobile),
reportes completos/PDF, billing, settings, admin.

- Pro: experiencia diseñada para el momento real de uso; superficie chica de
  construir y mantener; PWA instalable (manifest ya existe) = ícono en el home
  del teléfono sin app store.
- Contra: dos layouts que mantener; requiere decidir qué NO está (eso es
  también su virtud).

### C. App nativa (React Native / Capacitor)
- Contra: costo de build+store+review continuo injustificable hoy; nada del
  contexto actual lo exige (no push crítico, no offline duro, no sensores).
- Veredicto: descartar por ahora. La PWA cubre instalación e ícono; si algún
  día hace falta push nativo confiable en iOS, reevaluar con Capacitor
  envolviendo lo ya construido.

## Cómo se construiría la opción B (fases)

- **Fase B0 (barata, ya parcialmente hecha)**: los fixes responsive del chat
  shippeados hoy (sidebar cerrada en mobile, dvh, burbujas más anchas) +
  auditoría rápida de las 2-3 pantallas más usadas en teléfono.
- **Fase B1**: layout mobile dedicado detrás de un breakpoint (mismo router:
  bajo `md` se monta `MobileShell` con tab bar inferior de 4 items; encima,
  el dashboard actual). Home "Hoy" + ficha pocket + chat fullscreen.
- **Fase B2**: PWA instalable pulida (splash, ícono, standalone), dictado por
  voz en el chat (Web Speech API con fallback), y "Registrar" cuando exista
  la feature de notas.
- **Fase B3 (con memoria por niño completa)**: el loop cancha: registrar →
  el asistente lo recuerda → prep de la próxima sesión lo usa.

## Preguntas abiertas para el owner

1. ¿Confirmamos la opción B (Modo Cancha reducido) como dirección?
2. ¿Las 4 superficies propuestas son las correctas? ¿Falta/sobra alguna?
3. ¿Coaches y admins ven el mismo Modo Cancha (scopeado) o solo coaches?
4. ¿Priorizamos B1 antes o después del digest semanal? (Mi lectura: digest
   primero, es más barato y trae usuarios de vuelta; el Modo Cancha los
   retiene una vez que vuelven.)
