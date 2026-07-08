# Calibración de valor del informe — hallazgos y soluciones

> Pasada de calibración (6 auditorías) buscando dónde el método se hedgea hasta el no-valor y cómo recuperar valor **sin cruzar el piso ético**. Fecha: 2026-07-07. El informe es el valor principal del producto. Origen del pedido: el owner detectó el patrón en el motor ("intermedio para todos" + "observá en la cancha para conocer su ritmo real") y pidió barrer todo el método con el mismo criterio.

## El patrón (uno solo, en todos lados)

El proceso de 3 rondas de expertos empujó a la cautela (bien: sobre-afirmar sobre un chico es un riesgo ético). Se implementó tan fiel que en muchos lugares el informe **no dice nada / cae en no-respuesta / apila disclaimers hasta anular su propio valor**. El fix es un criterio único: **afirmar con valor + lenguaje probabilístico ("tiende a") + UNA salvedad de presente, nombrando el dato concreto, y SIEMPRE dando algo** — sin cruzar el piso (nunca rasgo permanente como identidad, nunca ranking entre chicos, nunca clínica).

---

## 1. SIEMPRE DAR UN PERFIL (lo que pediste expreso)

**El problema:** hoy el name-gate solo "nombra" el 7.68% del espacio (bajo azar); el resto cae en `buildDisplayName → "una mezcla entre X e Y"` = "no pudimos definirlo". **El informe abre con un no-dato para la mayoría de los chicos.** Además la veta se borra salvo B2≥4 (~1% de los casos), así que casi todo perfil nombrado es un "primario pelado" de una palabra.

**La solución (recomendada): `perfilTipo` SIEMPRE no-null, en 3 familias, con la BANDA como capa de "qué tipo de perfil" (no de "hay o no hay nombre").**

- **(A) Hay líder (B ≥ 2) → nombre = el eje primario.** La incertidumbre la comunica el *registro* del lenguaje (tentativo/claro), no la ausencia de nombre. Se elimina el sub-gate `top_count ≥ 7` como interruptor de nombre (a lo sumo decide el registro).
  - *5-3-2-2 hoy:* "una mezcla entre Impulsor y Conector". *Nuevo:* "**Impulsor**. El perfil de {nombre} se inclina hacia Impulsor, con margen visible sobre el resto."
- **(B) No hay líder (B = 0-1) → la FORMA es el nombre, positiva.** Dúo → "**Perfil de doble motor: X y Y**"; equilibrio → "**Perfil parejo**"; versátil → "**Perfil versátil, con base X**". Son perfiles válidos y valiosos (adaptabilidad, doble registro), no la ausencia de uno.
  - *6-6-0-0 hoy:* "una mezcla entre Impulsor y Conector". *Nuevo:* "**Perfil de doble motor: Impulsor y Conector**. Hoy el juego de {nombre} se apoya con fuerza en dos motores casi con el mismo peso. No es indefinición: dispone de dos registros y tiende a elegir según lo que pide la escena."
- **(C) La veta se muestra SIEMPRE que exista, graduada:** B2≥4 → entra al nombre ("Impulsor con veta Estratega", ya está); **B2=2-3 → subtítulo tentativo ("con algo de Estratega")** en vez de borrarse; B2≤1 → una línea suave. Deja de tirarse valor ya computado.

**Cambio técnico:** reemplazar `nombrarPrimario: boolean` + `arquetipoLabel: null` por un `perfilTipo` total; agregar los **nombres de forma** (es/en/pt) a `archetype-naming.md` + su copy en `archetypeContentV4.ts`; reencuadrar el módulo de banda (§8.2) de "cuán claro/pobre" a "qué tipo de definición" (varios registros ↔ un motor dominante, los dos válidos). **Resultado: 100% de los chicos reciben nombre con valor.**

---

## 2. Que los perfiles fuertes SUENEN fuertes (banda / lenguaje)

- **Techo plano en B≥5:** un 12-0-0-0 suena igual que un 7-2-2-1 (los dos "se inclina con claridad"). **Fix:** un 4º registro para B≥6 que enuncia el **margen de votos** de la toma (permitido por R4-A, floor-safe): *"la acción apareció en 11 de sus 12 elecciones; hoy su perfil se apoya de lleno en la acción."*
- **Nombrar y hedgear a la vez:** en B=4 el título dice "Impulsor" pero el cuerpo usa el registro más tentativo. **Fix:** si se nombra el primario, el registro no baja de "con claridad". *(Contradice la letra de A9 "B=4 tentativo" — decisión de owner; el argumento: claridad-en-presente ≠ intensidad-como-rasgo.)*
- **Verbo firme arriba:** reservar para los niveles altos "esta toma se define por X" / "se apoya de lleno en X"; dejar "se inclina" para tentativo. Contraste clave que se mantiene: "Mateo **ES** de acción" (prohibido) vs "esta toma **se define** por la acción" (permitido).
- **La cifra concreta** (topCount/12) hoy se guarda pero nunca llega al copy: es el dato más creíble y 100% floor-safe. Agregarlo.

## 3. Temas: de "no-respuesta" a lectura con valor

- **Tormenta 1-1-1** (hoy "eligió de formas distintas" = encogimiento de hombros): reencuadrar como **sensibilidad al contexto** ("no aplica una sola receta, lee cada tormenta según el momento"), nombrando las 3 escenas.
- **Tormenta 2/3** (hoy 3/3-o-nada): peldaño tentativo intermedio ("en dos de las tres se inclinó por X, en la tercera Y").
- **"En la meta"** (hoy puro literal + disclaimer): sumar un **tip accionable** población-condicional ("a los chicos que ante un logro miran lo que viene, suele servirles Y").
- **"Ante lo inesperado"** (hoy dos hechos planos si divergen): narrar como conductas que **conviven** ("y", no "pero") + takeaway de acompañamiento; nunca caer a vacío.
- **"Cuánto lo mueve el grupo"** (hoy negación seca "aparece menos que su empuje"): lectura concreta por I y por S nombrados + acompañamiento positivo (darle roles donde su fortaleza impacte al equipo).

## 4. Evolución: describir el REGISTRO, no negar todo

Hoy prohíbe hasta "las dos fotos sonaron parecidas" (lo confunde con "el rasgo es estable"). **Fix: separar dos planos.** (A) *Plano del rasgo* → sigue prohibido "cambió/estable" (sin test-retest). (B) *Plano del registro* → **permitido describir lo que las dos fotos mostraron** (es un hecho de las fichas, no una inferencia sobre el chico).
- *Mismo eje:* "Las dos veces que {nombre} jugó, con meses de diferencia, su perfil se apoyó en el mismo lado... El juego reconoció un aire de familia. No lo leemos como 'es así y no va a cambiar', pero sí como que, por ahora, esto es lo que aparece."
- *Ejes distintos:* nombrar los dos lados como co-ocurrencia, **desactivar explícito el "cambió de personalidad"**, una salvedad de indistinguibilidad, cerrar con valor. (Acá la invitación a observar en la cancha SÍ es legítima: la diferencia es genuinamente indecidible con dos tomas.)
- El dashboard promete "captura su evolución" y adentro decimos "no podemos hablar de trayectoria": alinear a "una foto nueva de cómo juega hoy".

## 5. Sacar la pila de disclaimers del cuerpo

- **"Foto/no etiqueta" se repite 5 veces** por informe. → UNA vez, en el marco fijo del pie. El cuerpo describe (el "tiende a" ya hace el trabajo), el pie encuadra.
- **⚠️ El más destructivo:** los **10 "límites inherentes" como componente VISIBLE** al padre incluyen "efecto Barnum", "validez no establecida", "referencia optimista", "fiabilidad NO ESTIMABLE". **Le decimos al padre que pagó, en la cara, que lo que leyó podría ser un efecto Barnum sin validar.** → Partir en dos: **VISIBLE = las 3 barandas que protegen** (no se compara, no se selecciona, no es diagnóstico); **colapsable "cómo se hizo" / letra chica legal** = Barnum, validez, muestra autoseleccionada. Una línea honesta arriba en vez de diez.
- **R4-J "no es cómo regula su frustración real"** y **R4-C "es el mismo cuestionario cortado"** y **§14 "trazabilidad ≠ validez"**: son **reglas internas de generación** (qué NO escribir / no fabricar convergencia), **nunca frases mostradas**. En pantalla anulan la sección; en el generador protegen sin costo.

---

## El piso ético que NO se toca (lo que los expertos protegían bien)

Cada propuesta lo respeta, y se verifica:
1. **Nunca rasgo permanente como identidad** — todo queda en "en esta toma / hoy / tiende a". "Mateo es de acción" sigue prohibido; "esta toma se define por la acción" es presente.
2. **Nunca comparar un chico contra otro** para rankear/seleccionar — todas las lecturas son del chico consigo mismo (su propio conteo, su propia forma).
3. **Nunca clínica / afecto / diagnóstico** — nombra conductas y elecciones observadas, no emociones ni patologías.
4. Las **barandas éticas visibles** (no comparar, no seleccionar, no diagnóstico) se quedan textuales; lo que se saca de la superficie es la **honestidad-de-paper** (Barnum, no-validado), que informa en "cómo se hizo" sin invitar a descartar el informe.

---

## Plan de aplicación

1. **Copy + spec** (bajo, se hace ya): reformular los temas, la evolución, consolidar disclaimers, partir §13 visible/colapsable. Con tu ok al tono.
2. **Engine + naming** (medio): `perfilTipo` total (reemplaza `nombrarPrimario`/`arquetipoLabel-null`), nombres de forma en `archetype-naming.md` + `archetypeContentV4.ts`, 4º registro de banda, alinear registro con name-gate. Aditivo, con tests.
3. **Re-verificación con los mismos expertos, consigna NUEVA:** ya no "encontrá dónde sobre-afirmo", sino **"confirmá que subimos el valor SIN cruzar el piso ético"**. Así el dial queda donde el owner lo quiere, verificado.

## Decisiones abiertas para el owner

- **Registro en B=4:** subir de "tentativo" a "con claridad" cuando se nombra (contradice la letra de A9). Recomendado sí (el argumento del piso lo banca).
- **Nombres de forma** ("Perfil de doble motor / parejo / versátil"): ¿te gustan estos o querés otros? Es branding, lo definís vos.
- **§13 visible:** confirmar que las 3 barandas visibles (no comparar / no seleccionar / no diagnóstico) son las que querés sostener, y el resto va a "cómo se hizo".
