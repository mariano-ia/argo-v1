// src/components/report/reportRedesignStyles.ts
// CSS del rediseño del informe niño (maqueta aprobada 2026-07, preview/redesign-informes-2026-07).
// Se inyecta como <style> UNA vez por instancia de ReportV4View (ver el componente), en vez de un
// import .css: así el test (tsx --test) no tropieza con un loader de CSS y el nodo off-screen del
// export a PDF hereda los estilos igual (CSS es global).
//
// TODO scope-eado bajo `.argo-report-v4` para NO filtrar clases genéricas (.card, .body, .dot, .footer…)
// al resto de la app. Las variables de color viven en el scope (no en :root). Los @keyframes van con
// prefijo `argo` para no colisionar. Informe = light-only (owner): no hay dark mode acá.
// Fuente de verdad del diseño: preview/redesign-informes-2026-07/gen_preview.py (bloque <style>).

export const REPORT_REDESIGN_CSS = `
.argo-report-v4{
  --navy:#1D1D1F; --sec:#424245; --grey:#86868B; --light:#AEAEB2; --border:#E8E8ED;
  --bg:#F8F8FA; --neutral:#F5F5F7; --paper:#ffffff;
  --v50:#F9F5FC; --v100:#EDE5F5; --v200:#D4BCE8; --v400:#A97BD2; --v500:#955FB5; --v600:#7A4D96;
  --shadow:0 1px 3px rgba(0,0,0,.04);
  color:var(--sec);
  font-family:"Inter",-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  line-height:1.5;-webkit-font-smoothing:antialiased;font-feature-settings:"cv11";
}
/* card = shell "papel": radio 16, sombra sutil, sin borde. */
.argo-report-v4 .card{background:var(--paper);border-radius:16px;padding:28px 32px;box-shadow:var(--shadow);color:var(--sec);}
/* Fade-in de cards con el scroll (activado por el hook useCardFade que agrega .cards-fade). El reveal
   es @keyframes, no transition, para que el ocultado inicial no anime. Sin .cards-fade: todo visible. */
.argo-report-v4.cards-fade .card{opacity:0;}
.argo-report-v4.cards-fade .card.in-view{animation:argoCardIn .55s cubic-bezier(.22,.61,.36,1) forwards;}
@keyframes argoCardIn{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){.argo-report-v4.cards-fade .card{opacity:1;}.argo-report-v4.cards-fade .card.in-view{animation:none;}}
/* ── Hero premium: serif de display + orbes de vidrio vivos + pills flotantes ── */
.argo-report-v4 .hero-lux{padding:36px 38px;overflow:visible;}
.argo-report-v4 .hx-grid{display:grid;grid-template-columns:1fr;gap:22px;}
@media(min-width:660px){.argo-report-v4 .hx-grid{grid-template-columns:1.02fr .98fr;align-items:center;gap:18px;}}
.argo-report-v4 .hx-left{min-width:0;}
.argo-report-v4 .hx-meta{margin-bottom:18px;}
.argo-report-v4 .kidmeta{font-size:12px;font-weight:600;color:var(--sec);}
.argo-report-v4 .adulto{margin-top:2px;font-size:11px;color:var(--light);}
.argo-report-v4 .hx-eyebrow{margin:0 0 9px;font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--v500);}
.argo-report-v4 .hx-name{margin:0;font-family:"Fraunces","Inter",Georgia,serif;font-weight:440;font-size:clamp(19px,3.1vw,26px);
  line-height:1.1;letter-spacing:-.008em;color:var(--navy);}
.argo-report-v4 .hx-name .np{display:block;}
.argo-report-v4 .hx-name .nc{color:var(--navy);font-weight:400;}
.argo-report-v4 .hx-lead{margin:22px 0 0;font-size:13.5px;line-height:1.72;color:var(--sec);max-width:46ch;}
/* contenedor de orbes: aspect-ratio => alto sigue al ancho, así los orbes quedan contenidos también en mobile */
.argo-report-v4 .hx-right{position:relative;width:100%;aspect-ratio:1 / 0.9;}
@media(max-width:659px){.argo-report-v4 .hx-right{max-width:360px;margin:10px auto 0;}}
.argo-report-v4 .orb-ring{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.argo-report-v4 .orb{position:absolute;border-radius:50%;will-change:border-radius,transform;}
/* dos lentes de vidrio transparentes, superpuestas (se cruzan en el centro-derecha) */
.argo-report-v4 .orb-1{width:62%;aspect-ratio:1;left:3%;top:6%;z-index:2;
  animation:argoOrbMorphA 9s ease-in-out infinite,argoOrbFloatA 12s ease-in-out infinite;}
/* orbe SECUNDARIO (veta): el ancho lo fija el componente según la banda (destellos<tonos<veta). */
.argo-report-v4 .orb-2{width:48%;aspect-ratio:1;left:36%;top:30%;z-index:1;
  animation:argoOrbMorphB 8s ease-in-out infinite,argoOrbFloatB 14s ease-in-out infinite;}
@keyframes argoOrbMorphA{0%,100%{border-radius:58% 42% 47% 53% / 56% 51% 49% 44%}50%{border-radius:45% 55% 55% 45% / 50% 45% 55% 50%}}
@keyframes argoOrbMorphB{0%,100%{border-radius:52% 48% 44% 56% / 53% 47% 53% 47%}50%{border-radius:61% 39% 56% 44% / 46% 57% 43% 54%}}
@keyframes argoOrbFloatA{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-9px)}}
@keyframes argoOrbFloatB{0%,100%{transform:translate(0,0)}50%{transform:translate(-7px,7px)}}
/* pills flotantes */
.argo-report-v4 .opill,.argo-report-v4 .opill-solo{position:absolute;display:inline-flex;align-items:center;gap:6px;background:var(--paper);
  border:1px solid var(--border);border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:var(--navy);
  white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.06);z-index:3;}
.argo-report-v4 .opill-dot{width:7px;height:7px;border-radius:999px;flex:none;}
.argo-report-v4 .opill-spark{display:inline-flex;color:var(--v500);}
.argo-report-v4 .opill-1{top:9%;right:0;}
.argo-report-v4 .opill-2{bottom:24%;right:0;}
.argo-report-v4 .opill-solo{top:40%;right:0;}
/* confianza como pastilla EN FLUJO, debajo del párrafo */
.argo-report-v4 .hx-conf{display:inline-flex;align-items:center;gap:6px;margin-top:22px;background:var(--v50);border:1px solid var(--v100);
  border-radius:999px;padding:5px 5px 5px 11px;font-size:11.5px;font-weight:600;color:var(--v600);}
/* variantes de orbes por caso */
.argo-report-v4 .orb-solo{width:70%;left:15%;top:6%;}
/* ── Grupos y separadores ── */
.argo-report-v4 .group{margin-top:42px;}
.argo-report-v4 .group:first-child{margin-top:0;}
.argo-report-v4 .group-head{padding:0 4px;margin-bottom:16px;}
.argo-report-v4 .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--grey);}
/* divider delicado entre secciones (hairline que se desvanece en los extremos) */
.argo-report-v4 .sec-divider{height:1px;margin:22px 6px;background:linear-gradient(90deg,transparent,var(--border) 18%,var(--border) 82%,transparent);}
/* hairline delicado debajo de cada título de sección */
.argo-report-v4 .title-rule{height:1px;margin:0 0 18px;background:linear-gradient(90deg,transparent,var(--border) 10%,var(--border) 90%,transparent);}
/* ── Sección de texto ── */
.argo-report-v4 .sec-h{display:flex;align-items:center;gap:8px;margin:0 0 9px;font-size:15px;font-weight:600;color:var(--navy);}
.argo-report-v4 .dot{width:7px;height:7px;border-radius:999px;flex:none;}
.argo-report-v4 .body{font-size:15px;line-height:1.72;color:var(--sec);margin:0;}
.argo-report-v4 .body strong,.argo-report-v4 .hx-lead strong,.argo-report-v4 .pal-nota strong,.argo-report-v4 .tl-text strong,
.argo-report-v4 .ejemplo strong,.argo-report-v4 .footer strong{font-weight:600;color:var(--navy);}
/* aside "bajada a tierra": filete violeta, sin caja pesada */
.argo-report-v4 .ejemplo{margin-top:20px;padding:3px 0 3px 16px;border-left:2px solid var(--v200);
  font-size:13.5px;line-height:1.65;color:var(--sec);}
/* ── "Su mezcla": 4 orbes por eje, dimensionados por %, con el % debajo ── */
.argo-report-v4 .mz-card{padding:30px 32px 28px;}
.argo-report-v4 .mezcla{display:flex;align-items:flex-end;justify-content:space-around;gap:6px;margin-top:2px;padding:6px 0 0;}
.argo-report-v4 .mz-col{display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;}
.argo-report-v4 .mz-orb{border-radius:50%;flex:none;will-change:border-radius;}
.argo-report-v4 .mz-axis{margin-top:14px;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--navy);letter-spacing:-.005em;}
.argo-report-v4 .mz-dot{width:6px;height:6px;border-radius:999px;flex:none;}
.argo-report-v4 .mz-pct{margin-top:3px;font-size:13.5px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
.argo-report-v4 .mz-divider{height:1px;margin:30px 0 24px;background:linear-gradient(90deg,transparent,var(--border) 18%,var(--border) 82%,transparent);}
.argo-report-v4 .mz-body{margin-top:0;}
/* ── viz de secciones (entre header y cuerpo), dentro del sistema de orbes ── */
.argo-report-v4 .viz{margin:6px 0 22px;}
/* spectrum: hairline + relleno tenue + marcador = mini-orbe de vidrio que respira */
.argo-report-v4 .spectrum{padding:16px 4px 4px;}
.argo-report-v4 .sp-track{position:relative;height:3px;border-radius:999px;background:var(--bg);}
.argo-report-v4 .sp-fill{position:absolute;left:0;top:0;height:100%;border-radius:999px;}
.argo-report-v4 .sp-mark{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);
  animation:argoOrbMorphA 8s ease-in-out infinite;}
.argo-report-v4 .sp-ends{display:flex;justify-content:space-between;margin-top:12px;font-size:10.5px;font-weight:500;color:var(--light);}
/* ── línea de tiempo (Antes/Durante/Después): 3 pasos con nodo = mini-orbe de vidrio ── */
.argo-report-v4 .guia-lead{margin:0 0 16px;font-size:14px;color:var(--grey);}
.argo-report-v4 .tl{display:flex;flex-direction:column;margin-top:2px;}
.argo-report-v4 .tl-step{display:grid;grid-template-columns:16px 1fr;gap:14px;position:relative;}
.argo-report-v4 .tl-step:not(:last-child){padding-bottom:28px;}
.argo-report-v4 .tl-step:not(:last-child)::before{content:"";position:absolute;left:7.5px;top:17px;bottom:-4px;width:1px;background:var(--border);}
.argo-report-v4 .tl-node{width:14px;height:14px;border-radius:50%;justify-self:center;margin-top:3px;z-index:1;}
.argo-report-v4 .tl-when{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.argo-report-v4 .tl-text{font-size:14px;line-height:1.65;color:var(--sec);}
/* ── Palabras: dos paneles glass (conectan = wash del eje; ruido = neutro), frases como líneas ── */
.argo-report-v4 .pw-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:560px){.argo-report-v4 .pw-grid{grid-template-columns:1fr;}}
.argo-report-v4 .pw-panel{border:1px solid;border-radius:14px;padding:16px 18px;}
.argo-report-v4 .pw-rui{background:var(--bg);border-color:var(--border);}
.argo-report-v4 .pw-head{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.argo-report-v4 .pw-orb{width:16px;height:16px;border-radius:50%;flex:none;}
.argo-report-v4 .pw-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
.argo-report-v4 .pw-label-rui{color:var(--grey);}
.argo-report-v4 .pw-line{display:flex;align-items:baseline;gap:9px;font-size:13.5px;line-height:1.5;color:var(--navy);padding:7px 0;}
.argo-report-v4 .pw-line + .pw-line{border-top:1px solid rgba(0,0,0,.045);}
.argo-report-v4 .pw-dot{width:5px;height:5px;border-radius:999px;flex:none;position:relative;top:1px;}
.argo-report-v4 .pw-rui .pw-line{color:var(--grey);}
.argo-report-v4 .pal-nota{margin-top:22px;font-size:13.5px;line-height:1.65;color:var(--sec);}
/* ── Footer ── */
.argo-report-v4 .footer{margin-top:34px;background:var(--bg);border-radius:16px;padding:24px 28px;font-size:13px;line-height:1.7;color:var(--sec);}
.argo-report-v4 .footer-h{font-weight:600;color:var(--navy);}
/* Movimiento reducido: los orbes quedan quietos */
@media(prefers-reduced-motion:reduce){
  .argo-report-v4 .orb,.argo-report-v4 .mz-orb,.argo-report-v4 .sp-mark{animation:none !important;}
}
`;
