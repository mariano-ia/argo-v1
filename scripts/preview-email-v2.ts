/**
 * Preview del email rediseñado (v2) — teaser + link al informe web.
 * Run: npx tsx scripts/preview-email-v2.ts
 */

import fs from 'fs';
import path from 'path';

const axisColor   = '#f97316';   // dot color only (axis identity)
const pillColor   = '#16a34a';   // green — bridge words are positive/activating
const pillBg      = 'rgba(34,197,94,0.09)';
const pillBorder  = 'rgba(34,197,94,0.25)';
const motorBg     = 'rgba(245,158,11,0.13)';
const motorText   = '#b45309';
const violet      = '#955FB5';
const violetShadow = 'rgba(149,95,181,0.28)';

const pill = (word: string) =>
    `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:500;color:${pillColor};background:${pillBg};border:1px solid ${pillBorder};margin:0 5px 6px 0;">${word}</span>`;

const reportUrl = 'https://argomethod.com/report/a3f8c2d1-…';   // mock UUID

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>El informe de Lucas está listo · Argo Method</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

  <!-- ── HEADER ──────────────────────────────────────────────────── -->
  <tr>
    <td style="background:#1D1D1F;padding:26px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:100;"> Method</span>
            <span style="background:#BBBCFF;color:#1D1D1F;font-size:9px;font-weight:600;padding:2px 7px;border-radius:4px;letter-spacing:0.05em;margin-left:8px;vertical-align:middle;">beta</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:14px;">
            <p style="margin:0;font-size:23px;font-weight:300;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">
              El informe de <strong style="font-weight:700;">Lucas</strong> está listo.
            </p>
            <p style="margin:7px 0 0;font-size:13px;color:#86868B;">Para Marcelo García &nbsp;·&nbsp; Fútbol &nbsp;·&nbsp; 13 años</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── HERO: ARQUETIPO ──────────────────────────────────────────── -->
  <tr>
    <td style="padding:30px 28px 26px;">

      <!-- Eyebrow -->
      <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#AEAEB2;">Arquetipo</p>

      <!-- Archetype name row -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:9px;">
            <span style="display:block;width:11px;height:11px;border-radius:50%;background:${axisColor};"></span>
          </td>
          <td style="vertical-align:middle;padding-right:12px;">
            <span style="font-size:29px;font-weight:300;color:#1D1D1F;letter-spacing:-0.04em;line-height:1;">Impulsor Dinámico</span>
          </td>
          <td style="vertical-align:middle;">
            <span style="background:${motorBg};color:${motorText};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;white-space:nowrap;">Motor dinámico</span>
          </td>
        </tr>
      </table>

      <!-- Perfil sentence -->
      <p style="margin:18px 0 0;font-size:15px;color:#424245;line-height:1.7;max-width:480px;">
        Actúa antes de pensar. Su velocidad de decisión es su mayor ventaja (y su mayor riesgo). Necesita desafíos reales para mantenerse conectado al entrenamiento.
      </p>

      <!-- Bridge words -->
      <div style="margin-top:20px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">Palabras que lo activan</p>
        <div style="line-height:1;">
          ${['Desafío','Acción','Avanza','Lidera','Rápido'].map(pill).join('')}
        </div>
      </div>

    </td>
  </tr>

  <!-- ── SEPARADOR ────────────────────────────────────────────────── -->
  <tr><td style="padding:0 28px;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- ── CTA ─────────────────────────────────────────────────────── -->
  <tr>
    <td style="padding:28px 28px 8px;text-align:center;">

      <p style="margin:0 0 22px;font-size:14px;color:#86868B;line-height:1.65;max-width:420px;margin-left:auto;margin-right:auto;">
        El informe completo incluye patrón de decisión, guía de comunicación, checklist de entrenamiento, brújula secundaria y más.
      </p>

      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td><![endif]-->
      <a href="${reportUrl}"
         style="display:inline-block;background:${violet};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:17px 44px;border-radius:12px;letter-spacing:-0.01em;box-shadow:0 4px 18px ${violetShadow};">
        Ver informe completo &nbsp;→
      </a>
      <!--[if mso]></td></tr></table><![endif]-->

      <!-- Security note -->
      <p style="margin:20px auto 0;font-size:11px;color:#AEAEB2;line-height:1.7;max-width:400px;">
        🔒 Este link es personal e intransferible. Solo tú lo recibiste.<br/>
        <a href="https://argomethod.com/privacy" style="color:#AEAEB2;text-decoration:underline;">Política de Privacidad de Argo Method</a>
      </p>

    </td>
  </tr>

  <!-- ── SEPARADOR ────────────────────────────────────────────────── -->
  <tr><td style="padding:28px 28px 0;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- ── REVIEW WIDGET ────────────────────────────────────────────── -->
  <tr>
    <td style="padding:24px 28px;">
      <div style="background:#F5F5F7;border-radius:14px;padding:22px 20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1D1D1F;letter-spacing:-0.01em;">Tu opinión nos ayuda a mejorar</p>
        <p style="margin:0 0 18px;font-size:13px;color:#86868B;">¿Qué tan claro te resultó el informe?</p>
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
          <td style="padding:0 4px;"><![endif]-->
        <a href="${reportUrl}?feedback=muy_claro"
           style="display:inline-block;background:${violet};color:#fff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 3px 8px;box-shadow:0 2px 8px ${violetShadow};">
          Muy claro
        </a>
        <!--[if mso]></td><td style="padding:0 4px;"><![endif]-->
        <a href="${reportUrl}?feedback=algo_claro"
           style="display:inline-block;background:#ffffff;color:#424245;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 3px 8px;border:1px solid #D2D2D7;">
          Algo claro
        </a>
        <!--[if mso]></td><td style="padding:0 4px;"><![endif]-->
        <a href="${reportUrl}?feedback=confuso"
           style="display:inline-block;background:#ffffff;color:#86868B;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 3px 8px;border:1px solid #D2D2D7;">
          Confuso
        </a>
        <!--[if mso]></td></tr></table><![endif]-->
        <p style="margin:12px 0 0;font-size:11px;color:#AEAEB2;">Son solo 4 preguntas · 30 segundos</p>
      </div>
    </td>
  </tr>

  <!-- ── FOOTER ───────────────────────────────────────────────────── -->
  <tr>
    <td style="background:#F5F5F7;border-top:1px solid #E8E8ED;padding:18px 28px;text-align:center;">
      <p style="margin:0 0 5px;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">
        Argo Method · Informe de Sintonía
      </p>
      <p style="margin:0;font-size:11px;color:#AEAEB2;line-height:1.6;">
        Este informe es una fotografía del presente, no una etiqueta permanente.
        <br/>
        <a href="https://argomethod.com/privacy" style="color:#AEAEB2;text-decoration:underline;">Privacidad</a>
        &nbsp;·&nbsp;
        <a href="https://argomethod.com/terms" style="color:#AEAEB2;text-decoration:underline;">Términos</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;

const outPath = path.join(process.cwd(), 'scripts', 'email-preview-v2.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Preview generado:', outPath);
