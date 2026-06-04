# Acceso CLI para autonomía operativa (Supabase + Vercel)

Objetivo: que Claude pueda operar Supabase y Vercel por CLI (aplicar migraciones, deploys a preview, leer logs/env) sin fricción.

## Estado actual (hecho por Claude)

- **Vercel CLI 54.9.1** y **Supabase CLI 2.105.0** instaladas (arm64).
- Se instalaron con un prefix de npm a nivel usuario para evitar `sudo`:
  `npm config set prefix ~/.npm-global` → binarios en `~/.npm-global/bin/`.
- El proyecto ya está linkeado a Vercel (`.vercel/project.json` → `v0-argo-v1`,
  org `team_NiHOawNWG9vxU1ZIvcaX9l7t`).
- Supabase prod ("Argo"): project ref **`luutdozbhinfiogugjbv`**.

## Lo que Claude NO puede hacer (por diseño) y necesita de vos — UNA sola vez

Dos cosas están fuera de mi alcance, no por cautela sino por límites reales:

1. **Autenticación** (OAuth/login): las credenciales son tuyas. No las tengo ni puedo iniciar un login por browser.
2. **Ampliar mis propios permisos** en `.claude/settings.local.json`: el clasificador de seguridad bloquea que un agente se auto-otorgue permisos. Es la protección que quieres que exista. Por eso el bloque de settings lo pegas tú.

### Setup turnkey (copia y pega)

```bash
# 1) Poner las CLIs en tu PATH (tu terminal). Una línea.
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# 2) Autenticar (one-time; abre el browser)
vercel login
supabase login

# 3) Linkear Supabase prod para migraciones
#    (pide la DB password: Dashboard → Project Settings → Database)
supabase link --project-ref luutdozbhinfiogugjbv
```

### Bloque para `.claude/settings.local.json` (para que Claude corra sin prompts)

Agrega a `permissions.allow` (ya está `vercel`; falta `supabase` + rutas absolutas):

```json
"Bash(supabase:*)",
"Bash(/Users/marianonoceti/.npm-global/bin/vercel:*)",
"Bash(/Users/marianonoceti/.npm-global/bin/supabase:*)"
```

Y agrega este bloque de nivel raíz (para que las CLIs se encuentren en cada sesión de Claude, sin tocar tu `.zshrc`):

```json
"env": {
  "PATH": "/Users/marianonoceti/.npm-global/bin:/Library/Frameworks/Python.framework/Versions/3.12/bin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/pkg/env/global/bin"
}
```

### Alternativa no interactiva (tokens, si preferís evitar el login por browser)

En vez de `vercel login` / `supabase login`, puedes crear tokens y exponerlos como env vars (en tu `~/.zshrc` o en el bloque `env` de settings):

- **Vercel**: token en https://vercel.com/account/tokens → `export VERCEL_TOKEN=...`
- **Supabase**: token en https://supabase.com/dashboard/account/tokens → `export SUPABASE_ACCESS_TOKEN=...`

Con esos tokens, todos los comandos CLI quedan no interactivos. Nota de seguridad: un token de larga vida en el perfil es una superficie de exposición; usa tokens con el menor alcance posible.

## Acuerdo operativo (cómo voy a usar este acceso)

Tener la CLI no cambia las reglas de `CLAUDE.md`. Con autonomía plena, igual voy a:

- **Operar libremente** en lo reversible/diagnóstico: leer logs (`vercel logs`), env (`vercel env ls`), estado, deploys a **preview**, queries de lectura.
- **Confirmar antes** de lo irreversible/prod: aplicar migraciones a **producción**, deploy a **producción** (`--prod` / `main`), borrar recursos. Esto sigue `CLAUDE.md` ("no mandar a prod sin tu OK explícito"). El permiso quita el prompt del sistema; el criterio de cuándo tocar prod lo mantengo yo.

## Verificación post-setup

Cuando completes el setup, Claude puede confirmar todo con:

```bash
vercel whoami                 # → tu usuario/team
supabase projects list        # → debe listar el proyecto Argo
vercel env ls                 # → env vars del proyecto (chequear OPENAI_API_KEY)
```

## Primer uso pendiente

Una vez autenticado, la migración `supabase/migrations/20260604_ai_events.sql`
(telemetría del Coach, ver `docs/ARGO-COACH-AUDIT.md`) queda lista para aplicar:
`supabase db push` (o `supabase migration up --linked`).
