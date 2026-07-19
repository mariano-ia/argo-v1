# Sistema de emails — modelo y estilo unificado (2026-07-19)

## Principio: el email es notificación, el producto vive en el panel

Los informes ya no viajan completos por email. El email **avisa** que algo está
listo y manda al destino. El destino depende de si el actor tiene panel:

| Actor | Tiene panel | Email | CTA |
|---|---|---|---|
| Comprador ArgoOne (padre o coach) | Sí | aviso | **Ir a mi panel** (tokenizado) |
| Adulto responsable/autorizante | Sí | aviso | **Ir a mi panel** (tokenizado) |
| Invitado ("abuela", por bridge_link) | No | aviso | **Verlo en línea** → `/puentes/:token` |
| Demo (juega gratis) | No hasta comprar | preview + comprar | (flujo demo, sin cambios) |

El panel del comprador/responsable centraliza informe del niño **y** puente, así
que un solo botón alcanza. La abuela es el único que no tiene panel: recibe el
link online de su puente. Tenant queda fuera por ahora (aún no tiene puente en
el dashboard); todos los "con panel" van al OnePanel.

**Decisor de rol** (inline, sin imports cross-file en Vercel): un email tiene
panel si es `children.responsible_adult_email`/`adult_email` de algún niño o
`one_purchases.email`. Si solo tiene el puente → abuela → online. El token del
panel se resuelve/mintea desde `adult_profiles.access_token`.

## Estilo unificado (todos los emails)

Shell canónico = `buildHtmlV4` del email del informe del niño (`send-email.ts`):
- Font del sistema (`-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,...`).
- Un contenedor blanco (max 600px, `border-radius:16px`, borde `#E8E8ED`).
- Masthead negro `#1D1D1F` con el wordmark (Argo 800 + resto 300 + ® super).
- Eyebrow uppercase `#AEAEB2` + título 22px 600.
- Card interna `border-radius:14px`, CTA con `border-radius:12px`.
- Divisor `#E8E8ED` + footer con el wordmark `ArgoMethod®`.
- **Acento por producto**: azul `#0071E3` = ArgoOne · violeta `#955FB5` = ArgoPuente.

## Emisores y su plantilla (as-built)

| Emisor | Plantilla | Acento |
|---|---|---|
| `send-email` buildHtmlV4 (informe niño) | aviso + `/report` (token) + bloque panel + upsell puente | azul |
| `send-puentes-email` (puente listo) | aviso rol-aware (panel o online) + brújula preview | violeta |
| `one-webhook` unlock ($12.99) | `argoShell` aviso + **panel** | azul |
| `one-webhook` reprofile vigente | `argoShell` aviso + **panel** | azul |
| `one-webhook` reprofile autorización | `argoShell` + `/consent` (autorización) | azul |
| `one-complete` payer notify | shell inline unificado + **panel** | azul |
| `sendPuentesMagicEmail` (compra puente) | "empezar cuestionario" → `/puentes/:token` | (sin tocar) |
| `admin-grant-puentes-free` | "empezar" cuestionario | (sin tocar) |
| `puentes-checkout` existing bridge (abuela) | link a su puente | (sin tocar) |
| reminder-cron renewal satélite (abuela) | "ver mi puente" online | (sin tocar) |

`argoShell` está duplicado inline en `one-webhook.ts` y `one-complete.ts` (la
regla de Vercel prohíbe imports entre archivos `api/`).

## Pendiente / no tocado (deliberado)
- Emails "momento 1" (armá tu puente / invitación al cuestionario): se mantienen,
  mandan al cuestionario, no al panel.
- Upsells de puente (reminder +3d, admin invite): siguen a checkout.
- Tenant/dashboard: cuando el tenant tenga puente, definir su panel de destino.
- `siblingsLabel` del puente: correcto solo para fan-out de tenant free_puentes.
