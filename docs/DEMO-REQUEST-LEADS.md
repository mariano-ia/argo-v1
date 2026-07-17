# Solicitar demo (ArgoAcademy®) → Leads

Reemplaza el viejo `mailto:` del card de ArgoAcademy® por un formulario de
captación de leads. Estado: **construido, sin deploy** (2026-07-17).

## Flujo

1. En la home (`public/sales/argo-home.html`, card ArgoAcademy®) el botón
   **"Solicitar demo"** abre un modal en vez de `mailto:`.
2. El form postea a `POST /api/demo-request`.
3. El endpoint (service role) valida, guarda en `public.demo_requests`, y en
   paralelo (best-effort):
   - **avisa al equipo** por email (`QA_ALERT_EMAIL`, desde `qa@argomethod.com`) + Telegram (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`).
   - **confirma al usuario** por email (desde `hola@argomethod.com`): "recibimos tu solicitud, te vamos a contactar".
4. El superadmin ve los leads en **`/admin/leads`** (tab "Leads", `AdminLeads.tsx`) y marca estado (Nuevo / Contactado / Cerrado).

## Campos del form

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre y apellido | sí | |
| Email | sí | valida formato |
| Institución o equipo | sí | |
| WhatsApp | sí | canal real de seguimiento (link `wa.me` en el panel) |
| País | sí | select (mercados latam + España/US/Brasil + Otro) |
| Deporte | no | select |
| Cantidad de niños | no | rangos: 1-15 / 16-50 / 51-100 / 100+ |
| Consentimiento | sí (checkbox) | acepta ser contactado + link a `/terms` |

Anti-spam: honeypot oculto `company_url` (si viene lleno, responde 200 sin guardar).

## Endpoint `api/demo-request.ts`

- `POST` (público): captura el lead. Body JSON con los campos + `source`/`lang`.
- `GET` (admin, Bearer token): lista los últimos 500 leads.
- `PATCH` (admin): `{ id, status }` con status ∈ `new|contacted|closed`.

Inline-only (no importa de `src/` ni de otros `api/`), según la regla de Vercel.

## Tabla `public.demo_requests`

Migración: `supabase/migrations/20260717_demo_requests.sql` (**aplicada a prod**,
PostgREST recargado). RLS on, sin policies públicas (writes por service role).
Columnas: `name, email, institution, whatsapp, country, consent` (req) +
`sport, team_size` (opt) + `source, lang, status, user_agent, referrer, created_at`.

## Pendiente

- **Deploy**: el código está local (sin push). La tabla ya existe vacía en prod.
- Otros dos `mailto:` de "Solicitar demo" siguen sin migrar:
  `src/pages/Landing.tsx` (home legacy `/home-legacy`) y
  `src/pages/tenant/TenantPricing.tsx` (Enterprise, dentro del dashboard).
  Se pueden unificar a este mismo endpoint si se decide.
