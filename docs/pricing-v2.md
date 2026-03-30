# Argo Method — Pricing v2

> Approved: 2026-03-30
> Status: Pending implementation
> Replaces: Credit-based pricing model

---

## Model change: Credits → Roster

The credit system is eliminated entirely. Users no longer "spend" credits to profile athletes. Instead, they pay for **roster capacity** (active player slots). Profiling and re-profiling are included in the subscription. The 6-month cooldown between re-profiles is the natural usage regulator.

### Key concepts

| Concept | Definition |
|---|---|
| **Roster limit** | Maximum number of active players a tenant can have |
| **Active player** | A player who has been profiled or has a pending profile |
| **Archived player** | Removed from active roster, frees up a slot, profile data retained |
| **Re-profiling** | Available automatically every 6 months per player (included in subscription) |
| **Pending profile** | Player registered but odyssey not yet completed; occupies a roster slot |

### What disappears

- `credits_remaining` field
- `credit_transactions` table
- "Buy credits" flow
- Credit deduction on play start
- Credit anxiety ("I should save my credits")
- Frustration on abandoned sessions ("I lost a credit")

---

## Segment 1: PADRES Y FAMILIAS — Argo One

One-time purchase. No subscription. No dashboard. Report delivered by email.

| | 1 perfil | 3 perfiles | 5 perfiles |
|---|---|---|---|
| **Precio** | $14.99 | $34.99 | $49.99 |
| **Precio por perfil** | $14.99 | $11.66 | $10.00 |
| **Descuento** | — | 22% | 33% |
| **Dashboard** | No | No | No |
| **Entrega** | Informe completo por email | Informe completo por email | Informe completo por email |
| **Consultor IA** | No | No | No |
| **Re-perfilamiento** | Comprar otro perfil | Comprar otro perfil | Comprar otro perfil |

### Flow

1. Parent arrives at argomethod.com (or via shared link)
2. Selects Argo One pack (1, 3, or 5)
3. Pays (Stripe / MercadoPago)
4. Receives unique play link(s) by email
5. Each link allows one athlete to play the odyssey
6. Upon completion, the responsible adult receives the full report by email
7. No account creation required for the parent

### Notes

- Argo One does NOT create a tenant account
- No dashboard access whatsoever
- Each profile is a standalone report
- Pack links can be used for the same child (re-profile) or different children
- The "responsible adult" email field in registration determines where the report is sent

---

## Segment 2: INSTITUCIONES Y EQUIPOS

Subscription model. Dashboard included. Roster-based capacity.

### Trial

| Feature | Detail |
|---|---|
| **Precio** | Gratis |
| **Duración** | 14 días |
| **Jugadores activos** | Hasta 8 |
| **Re-perfilamiento** | No disponible |
| **Grupos** | 1 |
| **Consultor IA** | 10 consultas (total, no renovables) |
| **Dashboard** | Limitado (features premium bloqueadas con blur + lock) |
| **Al vencer** | Dashboard pasa a solo lectura. Perfiles no se eliminan. Prompt para suscribirse. |

**Features bloqueadas en trial:**
- Palabras puente (por jugador)
- Palabras a evitar (por jugador)
- Guia rapida (por jugador)
- Checklist de entrenamiento (por jugador)
- Herramientas de grupo (en panel de balance)
- Analisis detallado de grupo
- Personalizacion por jugador en guia situacional
- Mas de 1 grupo
- Re-perfilamiento

### PRO

| Feature | Detail |
|---|---|
| **Precio** | $49/mes o $499/ano (15% descuento) |
| **Ideal para** | Clubes de barrio, escuelas deportivas, entrenadores independientes |
| **Jugadores activos** | Hasta 50 |
| **Re-perfilamiento** | Cada 6 meses por jugador (incluido) |
| **Grupos** | Ilimitados |
| **Consultor IA** | Incluido (fair use: 500 consultas/mes) |
| **Dashboard** | Completo (todas las features desbloqueadas) |
| **Soporte** | Email |

### Academy

| Feature | Detail |
|---|---|
| **Precio** | $89/mes o $899/ano (16% descuento) |
| **Ideal para** | Academias competitivas, clubes de mediano tamano, organizaciones multi-equipo |
| **Jugadores activos** | Hasta 100 |
| **Re-perfilamiento** | Cada 6 meses por jugador (incluido) |
| **Grupos** | Ilimitados |
| **Consultor IA** | Incluido (fair use: 1000 consultas/mes) |
| **Dashboard** | Completo |
| **Soporte** | Email prioritario |

### Enterprise

| Feature | Detail |
|---|---|
| **Precio** | A medida |
| **Ideal para** | Canteras profesionales, federaciones, organizaciones de alto volumen |
| **Jugadores activos** | Ilimitados |
| **Re-perfilamiento** | Cada 6 meses por jugador (incluido) |
| **Grupos** | Ilimitados |
| **Consultor IA** | Ilimitado (sin fair use cap) |
| **Dashboard** | Completo + API |
| **Soporte** | Dedicado |
| **Extras** | Integraciones custom, onboarding asistido, SLA |

---

## Consultor IA — Fair use policy

The AI consultant is marketed as "Incluido" in all institutional plans. No visible counter, no limit shown in the UI. Internally, a soft cap applies:

| Plan | Soft cap | Cost estimate (Gemini 1.5 Pro) |
|---|---|---|
| Trial | 10 consultas (hard cap, visible) | $0.19 total |
| PRO | 500/mes (soft, not visible) | ~$9.50/mes max |
| Academy | 1000/mes (soft, not visible) | ~$19/mes max |
| Enterprise | Sin limite | Variable |

### When soft cap is exceeded

1. Show a friendly, non-blocking message: "Has alcanzado el limite de consultas de este mes. Si necesitas mas capacidad, contacta a nuestro equipo."
2. Log the event and notify the Argo team
3. Do NOT block. Allow a 10% buffer above the cap before showing the message.
4. The Argo team contacts the user to discuss needs (upgrade opportunity to Academy/Enterprise)

### Terms of Service language

Include in T&C: "El Consultor IA esta incluido en todos los planes institucionales sujeto a una politica de uso justo. El uso justo contempla hasta [500/1000] consultas mensuales segun el plan contratado. Argo Method se reserva el derecho de contactar a usuarios que excedan consistentemente estos limites para ofrecerles un plan mas adecuado a su volumen de uso."

---

## AI Infrastructure

### Current: OpenAI (GPT-4o)
### Target: Google Gemini 1.5 Pro

| Metric | GPT-4o | Gemini 1.5 Pro | Savings |
|---|---|---|---|
| Cost per query | ~$0.038 | ~$0.019 | 50% |
| PRO avg user (80 queries) | $3.04/mo | $1.52/mo | $1.52 |
| Academy avg user (200 queries) | $7.60/mo | $3.80/mo | $3.80 |
| Quality (coaching use case) | Excellent | Comparable | — |

Migration from OpenAI to Gemini requires:
- New API key (Google AI Studio / Vertex AI)
- SDK swap in `openaiService.ts` (or create `geminiService.ts`)
- Prompt adjustments (minor, same general format)
- Testing pass on report generation + consultant quality

---

## Upgrade paths

```
Trial (free, 14d)
  |
  v
PRO ($49/mo) — 50 players
  |
  v
Academy ($89/mo) — 100 players
  |
  v
Enterprise (custom) — unlimited
```

Downgrade: Academy → PRO requires archiving players down to 50. UI should guide this process.

Trial → expired: dashboard goes read-only. Data is NOT deleted. User can subscribe at any time to resume.

---

## Argo One — Standalone (no upgrade path to institutional)

Argo One is a completely separate product flow. A parent who buys Argo One does NOT become a tenant. If a parent later wants institutional access (e.g., they're also a coach), they sign up separately for a Trial/PRO account.

The profiles generated by Argo One are NOT imported into a tenant dashboard. They are standalone reports delivered by email.
