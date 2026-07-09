# ArgoOne — Modelo nuevo (fusión ArgoOne + ArgoOne+)

> Documento vivo. Diseño en curso (conversación owner, 2026-07-09). Captura lo **cerrado**,
> lo **abierto** y lo **diferido**. Todavía NO tocado en código: esto es el plano del modelo
> antes de mapear flujos e interfaces. Complementa el relevamiento de la isla ArgoOne/Puente.

## 1. El cambio en una frase

Se fusionan **ArgoOne** y **ArgoOne+** en un solo producto: **ArgoOne**, que **siempre incluye
el informe puente**. Se hace por propuesta de valor (la mejor manera de conocer a un niño es
sumarle el puente del adulto) y para simplificar. Los productos quedan en dos:

- **ArgoOne** — self-serve, checkout digital. (Absorbe a ArgoOne+; ArgoOne+ desaparece.)
- **ArgoAcademy** — consultivo, "solicitar demo", sin checkout digital. (El de dashboard/coach.)

## 2. Los dos informes (terminología, de acá en adelante)

- **Informe individual** = el informe del **niño**. Es el que hoy ya mandamos por email al
  adulto en ArgoOne. **NO** incluye el puente.
- **Informe puente** = el informe del **adulto** (su perfil DISC + los 4 puentes hacia un niño
  puntual).

## 3. Los dos sujetos (clave del modelo)

- **Adulto** → identidad **estable = su email** (magic-link, sin cuenta con contraseña). Tiene
  un **perfil DISC reutilizable**, medido **una sola vez** (cuestionario 100% sobre el adulto,
  no sobre un niño puntual) y **re-perfilable cada 6 meses**. Todo el sistema de puentes/panel
  ya se ancla en `recipient_email` + `magic_token`.
- **Niño** → **NO tiene identidad global**. No tiene cuenta ni email. Un registro de niño existe
  solo **dentro del alcance de consentimiento de UN adulto**. "Mil Juancitos" es correcto y
  esperado. **No** hay dedup ni matching heurístico (nombre+edad+deporte): poco confiable y
  riesgo de privacidad.

### Identidad + consentimiento — CERRADO

- "El mismo Juancito" solo existe dentro del scope de un adulto responsable (el email que
  autorizó esa jugada = dueño del consentimiento de ese registro).
- Dos caminos, y nada más:
  1. **Desde el panel** (el responsable ya tiene a Juancito): botón "Sumar puente" / "Invitar a
     otro adulto". El responsable autoriza en el acto, o **la invitación ES la autorización**.
     Si el niño ya jugó, se le pide solo **autorización de uso del perfil** (no re-juega).
  2. **Adulto nuevo, sin conexión, que quiere a "Juancito"**: no hay forma de referenciar al
     Juancito de otro (no hay directorio ni ID) → arranca de cero → Juancito juega de nuevo →
     nuevo registro → ese adulto pasa a ser el responsable de *ese* registro.
- El **único puente entre adultos para un mismo niño es una invitación explícita** desde el panel
  del responsable. Nunca hay cold-email a un "responsable" desconocido.
- Aceptamos duplicación menor (madre y padre juegan a Juancito sin conectarse = dos registros).
  Las invitaciones son el mecanismo opcional para que una familia comparta un registro.

## 4. El flujo (alto nivel)

1. Alguien compra **ArgoOne** ($12.99). Comprador = entrenador, padre, o quien sea.
2. El comprador recibe **su informe puente** (que tiene que **ejecutar**: completar el
   cuestionario del adulto) + un **link** para mandarle a un niño a testear.
3. El link llega a un adulto responsable, que **autoriza** y deja jugar al niño.
4. Quien autoriza recibe el **informe individual** del niño.
5. Si comprador = adulto que autoriza (caso típico del padre): esa persona termina con los dos
   (individual del niño + su puente).

**Orden libre** (CERRADO): el perfil del adulto se puede computar antes de que el niño juegue.
El **informe puente NO se genera hasta que el niño juegue** (necesita el perfil del niño), pero
el perfil del adulto ya queda listo. Cuando el niño juega, se calculan los puentes. Esto destraba
el "quién juega primero".

## 5. Precios — CERRADO

**La regla, en una frase:** el precio depende de si **un niño juega**.

- **$12.99 — cada vez que un niño juega o re-juega.** Incluye SIEMPRE los dos informes: el
  individual del niño **+ el puente del adulto**. Aplica a:
  - Testear un niño nuevo (primera vez).
  - Testear otro niño distinto (María además de Juancito) → otros $12.99 (es otro test real).
  - Re-perfilado a los 6 meses: el niño re-juega y el adulto re-hace su puente → $12.99, los dos
    informes frescos, **vuelve a arrancar el ciclo completo**.
- **$4.99 — un adulto suma su puente a un niño ya jugado (sin que el niño juegue).** Aplica a:
  - Sumar otro adulto a un niño ya testeado (la abuela, la tía).
  - El upsell al adulto responsable que recibió el informe individual gratis (venta de impulso).
  - Refrescar el puente de un adulto contra un informe de niño que ya existe (sin re-juego).

**Por qué así:** el precio sigue el **costo/valor real** (un juego + IA del niño), no "proactivo
vs impulsivo" ni "nuevo vs el mismo". Nadie paga más por lo mismo, y el $4.99 queda como la venta
no-brainer. Margen del $4.99 ≈ puro: costo marginal ~**$0.001-0.0015** (solo la IA de los 4
puentes; el informe del niño está cacheado, el perfil del adulto es determinístico).

**Estado en el código hoy:** el checkout de Puente cobra $4.99 (`puentes-checkout.ts`), pero hay
$9.99 y $12.99 dando vueltas (ArgoOne / ArgoOne+ / mail recordatorio). Unificar al aplicar el modelo.

## 6. Re-perfilado — CERRADO

- **A los 6 meses el ciclo se reinicia:** el niño re-juega **y** el adulto re-hace su puente. Es
  **$12.99** e incluye los dos informes frescos (individual + puente). Mismo paquete que la primera
  compra, medio año después, cuando el niño ya cambió. Venderlo como "informe y puentes
  actualizados", no como "volvé a hacer el mismo test".
- **Niño**: invitación de re-perfilar a los 6 meses (como hoy).
- **Adulto**: su DISC es estable, así que "re-perfilarlo" en la práctica es refrescar su puente.
  Si va junto con el re-juego del niño → entra en el $12.99. Si solo refresca su puente contra un
  informe de niño existente (sin re-juego) → $4.99.

## 7. Diferido (volver más adelante)

1. **Packs "perfilá a toda la familia":** como cada adulto extra cuesta ~$0.001, el panel podría
   empujar sumar mamá/papá/abuela/tía, cada uno su puente al mismo niño a $4.99. Puro margen +
   arma la foto completa del entorno del niño.
2. **Upgrade ArgoOne → ArgoAcademy:** si un comprador de ArgoOne sube a Academy, migrarle sus
   niños al dashboard.
3. **Llevar el Puente al dashboard:** con este modelo resuelto, el Puente (informe del adulto)
   debería existir también dentro de ArgoAcademy/dashboard.

## 8. Detalles de diseño ya resueltos (se aplican en las fases de §9)

- **Acceso al panel:** passwordless. No depende de guardar ningún email: hay una puerta "entrá con
  tu email" que manda un link fresco al instante (`sendAccessLinkEmail` ya existe). Visible en el
  footer de cada email + un link en la home. Los links viejos siguen sirviendo.
- **Panel = hub que cae de los links, no destino con login.** Cada email (informe, upsell,
  recordatorio) abre la misma pantalla liviana. El one-and-done ve su niño + su puente + "sumar
  puente"; la familia ve lo mismo acumulado. Evolución del `OnePanel` actual.
- **Cuestionario del adulto:** reescribir de "sobre {nombre}" a **genérico** (mide el DISC del
  adulto, sirve para cualquier niño). El género-neutro ya hecho viaja bien.
- **El adulto NO tiene "perfil" como objeto visible (CERRADO 2026-07-09):** lo único que recibe/ve es su
  **informe puente**; su DISC se refleja *dentro* de ese informe, ahí y solo ahí. El panel no muestra una
  tarjeta "tu perfil". El cuestionario deja de ser "armá tu perfil" y pasa a ser un paso hacia el puente
  ("Crear mi puente").
- **Sumar un adulto = decisión del AUTORIZADOR, no del comprador (CERRADO 2026-07-09):** solo el adulto que
  dio el consentimiento (`responsible_adult_email`) ve "Crear nuevo puente con [niño]" e invita a otros
  adultos; su invitación ES la autorización (check de auto-atestación en el modal, sin email de ida y vuelta).
  Cuando comprador ≠ autorizador (caso coach), el **comprador NO puede** sumar adultos a ese niño (nunca fue
  dueño del consentimiento): obtiene lo suyo (su puente + el informe del niño) pero ampliar el círculo de
  adultos sobre datos de un menor es del autorizador. El adulto invitado recibe un link directo a
  intro → su cuestionario → desbloqueo del puente + informe por $4.99 (cuestionario primero, pago al final).
- **Frontera One → Academy (CTA en el hub):** el caso "un coach quiere sumar a su ayudante en varios niños" NO
  es ArgoOne (consentimiento de a un adulto por niño); es **ArgoAcademy®**, donde la institución maneja el
  consentimiento con roles. El hub lleva un CTA "Hacer upgrade a ArgoAcademy®" en el estado familia (señal de
  escala). El upgrade que migra los niños al dashboard sigue diferido (§7.2).
- **3 idiomas (STRICT):** todo lo del hub, el flujo de invitación, la landing y los emails nuevos se
  construyen en **es/en/pt** (como el resto del producto). Los mockups de revisión van en es.

## 9. Cómo seguimos (hacia el plan de ejecución)

Modelo cerrado a alto nivel. Para poder planear la ejecución, el camino documentado + analizado es:

- **Fase A — Casos de uso.** Matriz completa de escenarios (padre self-serve; entrenador compra y
  manda link; sumar abuela; re-perfilado a 6 meses; perfil de adulto reusado entre varios niños;
  comprador ≠ autorizador; etc.), cada uno con quién paga, quién autoriza y quién recibe qué.
  Valida el modelo y saca los edge cases. **Arranca por acá.**
- **Fase B — Modelo de datos objetivo.** Aterrizado sobre el código actual: adult_profile (por
  email, reusable, re-perfilable), registros de niño, puente como cruce, consentimiento/
  autorización, y la lógica de SKU/precio. Acá se resuelve G2 (los dos perfilamientos).
- **Fase C — Flujos.** Paso a paso de cada caso (pantallas, emails, estados), con el foco
  transversal en "hiper simple".
- **Fase D — Interfaces/pantallas.** El detalle de cada surface: checkout, hub magic-link, emails
  (individual, puente, upsells, recordatorios, invitaciones/autorizaciones), cuestionario genérico,
  renders de informe.
- **Fase E — Plan de ejecución.** Secuenciado, con dependencias, migraciones y qué es reversible.
  Con esto se planea la construcción.
