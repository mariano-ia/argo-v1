# ArgoCoach — Roster name matching

How the AI consultant (`api/tenant-chat.ts`) decides that a coach's chat message
mentions one of their roster players, so it can inject that child's report.

## The bug this replaced (2026-07-02)

The old matcher required a **capitalized** proper-noun form for any first name
that is also an everyday es/pt word (`Sol`, `Luna`, `Paz`, `León`...). The intent
was to stop "hace mucho **sol**" from triggering a player named Sol. But coaches
type lowercase in chat, so a real player typed lowercase was **silently missed**:
`mentionedPlayer` came back `null` and ArgoCoach answered generically ("dime su
perfil DISC") as if it had no data — the exact symptom seen in a live demo.

The trigger that surfaced it was worse: `'olivia'` had been wrongly added to the
common-word list. "olivia" is not a Spanish/Portuguese word (the word is "oliva"),
so it never should have required capitalization. A coach asking "crees que
**olivia**..." got the empty answer even though her report existed.

## The model: roster-anchored, match-by-default, veto-not-gate

Candidates are **always names that exist in this tenant's roster**, so a message
containing a roster name is overwhelmingly *about* that player. The base rate of
"types a common word that happens to equal a roster name but means the literal
thing (weather, etc.)" is low. So the failure asymmetry — a silent empty answer is
far worse than a bit of extra context — demands a **recall bias**.

`classifyNameMention(name, message, lang, ctx)` → `{ match, confidence }`:

1. **Multi-word name** ("Juan Pablo") → plain accent-insensitive word-boundary test
   (never a common noun). `strong`.
2. **Ordinary single name** (not in the common-word set) → matches on a word
   boundary, **lowercase included**. `strong`. *(This is the branch that fixes the
   Olivia class.)*
3. **Common-word name** (`Sol`, `Luna`, `Paz`, en `Sky`/`Hope`...) → **match by
   default**, and only **veto** an occurrence on a positive literal-noun cue:
   - a preceding **determiner/quantifier** (`la sol`, `un solo pilar`, `the sky`), or
   - an **anchored idiom collocation** (`hace sol`, `luna llena`, `en paz`, `señal
     de la cruz`, `have faith`). Anchored = the idiom's name-part must sit exactly
     at this token, so "a clear sky **but** sky needs to press" still matches the
     second, real, "sky".
   - **Person cues** (`perfil de`, `como motivo a`, `talk to`) or a **mid-sentence
     capital** override the veto → `strong`.
   - No cue and no veto (bare "sol") → recall-biased **`weak`** accept (injected,
     but flagged `qa.contextWeak`).

Capitalization is now a *soft* person signal, never a requirement.

### Language specifics
- Per-language common-word sets: `COMMON_WORD_NAMES_ES_PT` and `COMMON_WORD_NAMES_EN`
  (the app serves an en UI; Sky/Hope/Grace/Faith/Sunny/Summer were previously
  unguarded). `''`/unknown → union.
- Spanish **personal `a`** ("ayudo **a** sol") is a *person* marker, so `a` is
  deliberately **not** an es/union determiner; in pt/en `a` *is* an article.

## Prevention (so this class can't silently recur)
- **Golden fixture** — `scripts/qa/coach-helpers.test.ts` runs an 83-case es/en/pt
  battery. Append every future incident here.
- **Denylist lint** — `PROPER_NAME_DENYLIST` (olivia, mateo, thiago...) may never
  appear in a common-word set. Re-adding `'olivia'` now fails CI.
- **Normalized-entry lint** — every set entry must equal `normalizeName(entry)`.

## Detection
- `qa.contextWeak` + a `console.info` fire on every weak accept. A per-tenant spike
  means a real player named Sol/Luna is being repeatedly weak-matched.
- *Follow-up (not built):* promote `context_weak` to a first-class `ai_events`
  column for dashboards; add a qa-monitor synthetic canary seeding a player "Sol"
  and probing "como va sol en los partidos".

## Known limitations (pre-existing, out of scope of the 2026-07-02 change)
The caller still falls back to the first name, so a **compound name typed split or
reversed** ("vino Juan pero Pablo", "jose maria") resolves via its first name, and
**plural morphology** ("dos juanes") is not stemmed. Pinned as documented residuals
in the test. Proper compound-name disambiguation is separate future work.
