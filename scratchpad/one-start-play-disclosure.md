# Security Finding — `one-start-play-disclosure`

**Verdict:** CONFIRMED
**Severity:** MEDIUM
**Endpoint:** `POST /api/one-start-play`
**Component:** ArgoOne standalone play flow
**Reviewed:** 2026-07-05 (read-only verification against source)

---

## Claim

> `api/one-start-play.ts` is public (no auth), NOT rate-limited, and given a
> `one_links.slug` returns `recipient_email` + `child_name` + `sport` and mutates
> link status to `pending`. The slug is only 48-bit (`encode(gen_random_bytes(6))`).

All five assertions are literally true in the code. **Nothing is refuted.**

---

## Evidence

### 1. Public / no auth — `api/one-start-play.ts:11-22`
The handler only checks the HTTP method and the presence of a slug. There is no
token, session, or ownership check.

```ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    // ...
    const { slug } = req.body as { slug?: string };
    if (!slug) return res.status(400).json({ error: 'Missing slug' });
```

No `middleware.ts` / `_middleware` exists (verified: no matches), and `vercel.json`
has no auth or rate rewrites for `/api`. The endpoint is fully public.

### 2. Not rate-limited — isolated gap vs. its own siblings
`one-start-play.ts` contains **zero** rate-limit code. This is not a codebase-wide
absence — the sibling endpoints implement the exact same fixed-window Vercel-KV
limiter and this one simply omits it:

- `api/start-play.ts:26` `async function rateLimited(...)`
- `api/start-play.ts:64` `if (await rateLimited(\`rl:start-play:${clientIp(req)}\`, 80, 60)) return res.status(429)...`
- `api/one-panel.ts:109-110` `rateLimited(\`rl:one-access:ip:${ip}\`, 20, 3600) || ... \`rl:one-access:email:${email}\`, 5, 3600)`

So the protection pattern existed and was left off this endpoint — almost
certainly an oversight.

### 3. Discloses `recipient_email` + `child_name` + `sport` — `api/one-start-play.ts:25-56`

```ts
const { data: link } = await sb
    .from('one_links')
    .select('id, status, purchase_id, recipient_email, child_name, sport')
    .eq('slug', slug)
    .single();
// ...
return res.status(200).json({
    ok: true,
    link_id: link.id,
    recipient_email: link.recipient_email,
    child_name: link.child_name,
    sport: link.sport,
});
```

Consumed as PII pre-fill on the client (`src/pages/OnePlay.tsx:44-50`:
`email: data.recipient_email`, `nombreNino: data.child_name`).

**Nuance:** disclosure is gated on the linked purchase being paid
(`api/one-start-play.ts:35-43`):

```ts
if (!purchase || purchase.payment_status !== 'paid') {
    return res.status(403).json({ error: 'Payment not confirmed' });
}
```

But every real, sent link is paid, so this barely mitigates.

### 4. Mutates status to `pending` — `api/one-start-play.ts:46-48`

```ts
if (link.status !== 'pending') {
    await sb.from('one_links').update({ status: 'pending' }).eq('id', link.id);
}
```

Unauthenticated state write; only skipped when the link is already `completed`
(403 at line 32).

### 5. 48-bit slug — `supabase/migrations/20260331_argo_one.sql:38`

```sql
slug text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),  -- 12 hex chars
```

`gen_random_bytes(6)` = **48 bits**. Anomalously weak versus the *same migration's*
own standard for the magic-link token (line 21):

```sql
access_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')  -- 256-bit
```

---

## Impact / exploit scenario

An unauthenticated attacker POSTs `{ slug }` to `/api/one-start-play` and, for any
paid link, receives:

- the accompanying **adult's email**,
- the **child's first name**, and
- the **sport**

— PII of a minor in a COPPA-sensitive product — and silently flips the link's
status from `available`/`sent` to `pending`.

With no rate limit (unlike its siblings), an attacker can hammer the endpoint to
(a) brute-force the 48-bit slug space and (b) tamper with link state at will.
Realistic leak vectors for a slug: URL sharing, referer headers, browser history,
chat forwards — each yields the minor's name + adult email immediately, since the
slug is a low-entropy bearer credential.

---

## Why MEDIUM, not HIGH

- The 48-bit keyspace is ~2.8e14 and **sparsely populated** by real links, so blind
  mass-enumeration is slow (~`2^48 / N` tries per hit; hundreds of days at ~1k rps
  for N ~ 1e4 links). The weak token is a real defect, not a one-shot harvest.
- The slug is **by design** a bearer token embedded in the parent's play URL
  (`/one/:slug`), and the flow intentionally pre-fills `child_name` / `email` for
  that recipient — so disclosure to the slug-holder is partly intended.

The genuinely actionable defects are the **missing rate limit** (inconsistent with
`start-play.ts` / `one-panel.ts`, and it also permits unauthenticated status
mutation) and the **48-bit entropy** far below the project's own 256-bit standard
for `one_purchases.access_token`.

---

## Recommended remediation

1. Add the same fixed-window KV rate limiter used by `start-play.ts` /
   `one-panel.ts` (per-IP, e.g. `rl:one-start-play:${ip}`), returning `429`.
2. Raise slug entropy to match the codebase standard
   (`encode(gen_random_bytes(16|32), 'hex')`) for newly generated links.
3. Consider not returning `recipient_email` in the response (the client only needs
   it to pre-fill; a server-side pre-fill or a redacted value would avoid echoing
   the adult's email to any slug-holder).
