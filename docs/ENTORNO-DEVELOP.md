# Entorno de pruebas: develop.argomethod.com

> Operativo desde 2026-07-03. URL estable que sirve SIEMPRE el último push de
> la rama `develop` (Vercel branch domain). Referencia de cómo quedó armado y
> cómo operarlo.

## Cómo está armado

- **Vercel**: dominio `develop.argomethod.com` agregado al proyecto
  `v0-argo-v1` con `gitBranch: develop` (se asignó vía API, el CLI no tiene
  flag de rama). `www.develop.argomethod.com` está configurado como redirect
  308 al anterior.
- **DNS (Google Cloud DNS, zona argomethod.com)**: dos registros A creados
  por el owner: `develop → 76.76.21.21` y `www.develop → 76.76.21.21`
  (TTL 300). Los certificados TLS los emite Vercel solo (el de tercer nivel
  tardó ~1 hora; paciencia antes de diagnosticar).
- **Supabase Auth**: `https://develop.argomethod.com/**` y
  `https://www.develop.argomethod.com/**` están en la allowlist de Redirect
  URLs (sin esto, el login con Google rebota a producción, porque Supabase
  cae a su Site URL). La Site URL sigue siendo la de producción; NO tocarla.

## Cómo cambiar la configuración de auth sin dashboard

`supabase config push` con el manifiesto `supabase/config.toml` (committeado):
muestra un diff y pide confirmación. Procedimiento seguro documentado en el
propio archivo. **REGLA DE ORO: nunca confirmar un diff sin leerlo línea por
línea** — los campos [auth] no declarados en el toml empujan los DEFAULTS del
CLI (Site URL a 127.0.0.1, MFA apagado, confirmaciones de email apagadas),
lo que rompería el auth de producción.

## Particularidades del entorno

- **La base de datos es LA DE PRODUCCIÓN** (instancia única). Todo lo que se
  haga logueado en develop toca datos reales.
- **Los crons NO corren en previews.** Para probar el cron de memoria en
  develop: `curl -H "Authorization: Bearer $CRON_SECRET"
  https://<preview-url>/api/child-memory-cron` (o pedírselo al agente).
- El login con email/contraseña siempre funcionó en develop; el de Google
  requiere la allowlist de arriba.
- El modo dev de UI sin login sigue siendo solo localhost: `?dev` (+
  `&plan=trial` para previsualizar estados bloqueados).
