# Verificación independiente — hardening de seguridad 2026-07-06

Chequeo de que cada cosa marcada "ejecutado / resuelto" en el informe y en `SEGURIDAD-HARDENING-20260706.md` está **efectivamente hecha**, contra tres fuentes de verdad (no contra memoria). Ejecutado el 2026-07-06 a pedido del owner.

## Resultado: TODO lo afirmado como ejecutado/resuelto está confirmado.

## Fuente 1 — el commit (el código está donde debe, no solo en el working tree)

- `9259121` es ancestro de `origin/main` → **está en producción (rama main)**.
- `git diff` sobre `api/ src/ scripts/ supabase/migrations/ package.json vercel.json` → **limpio** (lo commiteado == lo que hay en disco; no hay nada sin commitear que yo haya dicho commitear).
- Cada fix presente en el **blob commiteado** (`git cat-file -p 9259121:<file>`), 16/16:

| Archivo | Marcador verificado |
|---|---|
| `api/report.ts` | `!data.share_token` (fail-closed) |
| `api/generate-puentes.ts` | `NAME_PLACEHOLDER` + rehidratación |
| `api/retention-cron.ts` | `cronSecret \|\| !userAgent.includes` |
| `api/one-start-play.ts` | `rl:one-start-play` (rate limit) |
| `api/delete-account.ts` | borrado del roster (`Erased …`) |
| `api/one-complete.ts` | `share_token: crypto.randomBytes` |
| `api/one-panel.ts` / `src/pages/OnePanel.tsx` | `report_token` |
| `src/lib/odysseyTranslations.ts` | `mayor de 18` (age-gate, x2 idiomas + es) |
| `api/security-canary.ts` | endpoint del vigilante |
| `scripts/security/security-probe.mjs` + `expected-denied.json` | sonda + baseline |
| `supabase/migrations/20260706_security_rls_lockdown.sql` | `REVOKE ALL ON public.children`, `security_invoker = true`, `REVOKE EXECUTE ON FUNCTION`, `SET search_path` |
| `package.json` / `vercel.json` | `check:security` / cron `security-canary` |

- **Nota de transparencia:** un chequeo intermedio reportó la migración con 971 líneas (yo escribí 176). Lo investigué: fue un artefacto de medición de un comando encadenado. La comparación definitiva `diff <(git cat-file -p 9259121:…) <disco>` dio **idéntico, 176 líneas**. No había problema real; lo perseguí hasta confirmarlo.

## Fuente 2 — la base de producción (las políticas están como se dice)

Consulta a `pg_policies` (proyecto `luutdozbhinfiogugjbv`), estado real:

| Tabla | Política(s) vigentes |
|---|---|
| `children` | **ninguna** (RLS on, deny-all → solo service-role) |
| `one_links` | **ninguna** (deny-all) |
| `one_purchases` | **ninguna** (deny-all) |
| `perfilamientos` | solo `admin_select_sessions` (lectura admin). Se fueron `auth_read` USING(true), `anon_insert`, DELETE público. |
| `admin_audit_log` | solo `admin_read_audit` (lectura admin) |
| `blog_topics` | solo `blog_topics_admin_manage` (admin) |
| `leads` | `leads_self_insert` / `leads_self_update` (`user_id = auth.uid()`), `leads_read` (propio o admin), `leads_admin_delete` |

**Cero políticas permisivas `USING(true)` en tablas sensibles.** Además: `has_table_privilege('anon','children'/'perfilamientos','SELECT')` = false; funciones SECURITY DEFINER con `EXECUTE` solo a `service_role` y `search_path` fijado; advisor de Supabase sin errores/warnings críticos.

## Fuente 3 — el deploy en vivo (el código está corriendo en prod)

- `GET https://www.argomethod.com/api/security-canary` → **HTTP 401** (`{"error":"unauthorized"}`). El endpoint es NUEVO en este commit: que exista y responda 401 prueba que (a) el deploy de Vercel de `9259121` tomó, y (b) su auth estricta (sin bypass de UA) funciona.
- `https://www.argomethod.com` → HTTP 200 (sitio arriba).

## Fuente transversal — sonda de caja negra

`npm run check:security` contra prod, corrida post-deploy: **26/26 superficies de ataque denegadas** (lectura, borrado y RPCs con la anon key pública).

## Conclusión

Lo que el informe marca **✓ Resuelto · live** (capa de base de datos) está aplicado y verificado en las tres fuentes. Lo marcado **✓ Deployado** (fixes de código) está commiteado, en `main`, y el deploy está confirmado vivo. No hay nada afirmado como hecho que no esté hecho.

Pendiente (declarado como tal, no afirmado como hecho): toggle de leaked-password en Auth, consentimiento server-side 13-16, envoltorio legal.
