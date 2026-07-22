import html, re, json, os
FONT_B64 = open('inter-var.b64').read().strip()
SERIF_B64 = open('fraunces.b64').read().strip()

def esc(s): return html.escape(s, quote=True)
def rich(s):
    out, i = [], 0
    for m in re.finditer(r'\*\*([^*]+)\*\*', s):
        out.append(esc(s[i:m.start()])); out.append('<strong>' + esc(m.group(1)) + '</strong>'); i = m.end()
    out.append(esc(s[i:]))
    return ''.join(out)

AXIS = {'D': '#f97316', 'I': '#f59e0b', 'S': '#22c55e', 'C': '#6366f1'}
AXIS_LABEL = {'D': 'Impulsor', 'I': 'Conector', 'S': 'Sostenedor', 'C': 'Estratega'}
V500, V600 = '#955FB5', '#7A4D96'

# ── datos de muestra (adulto Estratega con veta Sostenedor ↔ niño Impulsor) ──
recipient, email, child = 'Marian', 'marian@ejemplo.com', 'Mateo'
adult_primary, adult_veta, child_axis = 'C', 'S', 'D'
adult_color, veta_color, child_color = AXIS[adult_primary], AXIS[adult_veta], AXIS[child_axis]
mix = {'D': 17, 'I': 21, 'S': 25, 'C': 37}   # composición del adulto (dominante C)
pressure = 'regulado'                          # regulado | reactivo | evitativo

# Contenido = salida real del panel DISC (design-forward: veta tejida + negritas),
# verificada con las guardas del repo (prohibidas/determinista/voseo/guiones). Ver puente_content.json.
_C = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'puente_content.json'), encoding='utf-8'))
saludo = _C['saludo']
perfil_adulto = _C['perfil_adulto_breve']
cierre = _C['cierre']
# Los 4 puentes son slots fijos (momentos). Orden de DISPLAY: antes, después, cuando no sale, largo plazo.
_DISPLAY_ORDER = ['antes', 'despues', 'frustracion', 'largo_plazo']
_by_slot = {p['slot']: p for p in _C['puentes']}
puentes = [_by_slot[s] for s in _DISPLAY_ORDER]

L = {'eyebrow': 'Informe para el adulto', 'kicker': 'Tu perfil', 'greeting': 'Te damos la bienvenida',
     'style': 'Tu estilo natural', 'closing': 'Tu próximo puente', 'closing_sub': 'Oportunidad de mejora', 'childState': 'Cómo tiende a estar',
     'adultStrength': 'Lo que tú traes', 'bridge': 'El puente', 'reflection': 'Una pregunta para llevarte',
     'composition': 'Composición del perfil', 'pressure': 'Estilo bajo presión', 'tipLabel': 'Qué mide esto'}
PRESS = [('regulado', 'Regulado', 0.15), ('reactivo', 'Reactivo', 0.5), ('evitativo', 'Evitativo', 0.85)]

# ── primitivas del design system ──
def hex_rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def orb_bg(hx):
    r, g, b = hex_rgb(hx)
    return (f"radial-gradient(circle at 36% 30%, rgba(255,255,255,.62), rgba(255,255,255,0) 48%),"
            f"radial-gradient(circle at 52% 55%, rgba({r},{g},{b},.30), rgba({r},{g},{b},.15) 62%, rgba({r},{g},{b},.05) 100%)")
def orb_shadow(hx):
    r, g, b = hex_rgb(hx)
    return (f"inset 0 0 0 1px rgba({r},{g},{b},.16), inset 0 1px 12px rgba(255,255,255,.45), "
            f"0 14px 38px -18px rgba({r},{g},{b},.30)")
def orb_div(cls, hx, width=None):
    w = f';width:{width}%' if width else ''
    return f'<div class="orb {cls}" style="background:{orb_bg(hx)};box-shadow:{orb_shadow(hx)}{w}"></div>'
def pill(hx, label, cls):
    return f'<div class="opill {cls}"><span class="opill-dot" style="background:{hx}"></span>{esc(label)}</div>'

INFO_SVG = ('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>')
def tip(text):
    return (f'<span class="tipwrap"><button type="button" class="itip" aria-label="{esc(L["tipLabel"])}" '
            f'aria-expanded="false">{INFO_SVG}</button><span class="tipbox" role="tooltip">{esc(text)}</span></span>')
def sec_head(title, dot=None, tiptext=None, sub=None):
    dotc = dot or adult_color
    t = tip(tiptext) if tiptext else ''
    subhtml = f'<div class="sec-sub">{esc(sub)}</div>' if sub else ''
    return (f'<h2 class="sec-h"><span class="dot" style="background:{dotc}"></span>'
            f'<span class="sec-t">{esc(title)}</span>{t}</h2>{subhtml}<div class="title-rule"></div>')
def aside(text): return f'<div class="ejemplo">{rich(text)}</div>'

ORB_RING = ('<svg class="orb-ring" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
            '<circle cx="232" cy="172" r="152" fill="none" stroke="#D4BCE8" stroke-width="1" '
            'stroke-dasharray="2 8" opacity="0.6"></circle></svg>')

# ── HERO: nombre serif del adulto + dos orbes (sus dos ejes) ──
prof_name = (f'<span class="np" style="color:{adult_color}">{AXIS_LABEL[adult_primary]}</span> '
             f'<span class="nc">con veta</span> <span class="nv" style="color:{veta_color}">{AXIS_LABEL[adult_veta]}</span>')
hero = f'''<div class="card hero-lux">
  <div class="hx-grid">
    <div class="hx-left">
      <div class="wordmark"><span class="wm-a">Argo</span><span class="wm-b">Puente®</span></div>
      <p class="hx-eyebrow">{esc(L["kicker"])}</p>
      <h1 class="hx-name">{prof_name}</h1>
    </div>
    <div class="hx-right">{ORB_RING}
      {orb_div("orb-1", adult_color)}{orb_div("orb-2", veta_color, 56)}
      {pill(adult_color, AXIS_LABEL[adult_primary], "opill-1")}{pill(veta_color, AXIS_LABEL[adult_veta], "opill-2")}
    </div>
  </div>
  <div class="hero-divider"></div>
  <p class="hero-saludo">{rich(saludo)}</p>
</div>'''

# ── Composición: mezcla de 4 orbes por % ──
def mezcla():
    MIN, MAX = 22, 92
    dur = {'D': '9s', 'I': '8s', 'S': '10.5s', 'C': '7.5s'}
    morph = {'D': 'orbMorphA', 'I': 'orbMorphB', 'S': 'orbMorphA', 'C': 'orbMorphB'}
    cols = ''
    for ax in ['D', 'I', 'S', 'C']:
        pct = mix.get(ax, 0); d = MIN + pct / 100 * (MAX - MIN); c = AXIS[ax]
        cols += (f'<div class="mz-col"><div class="mz-orb" style="width:{d:.0f}px;height:{d:.0f}px;'
                 f'background:{orb_bg(c)};box-shadow:{orb_shadow(c)};animation:{morph[ax]} {dur[ax]} ease-in-out infinite"></div>'
                 f'<div class="mz-axis"><span class="mz-dot" style="background:{c}"></span>{AXIS_LABEL[ax]}</div>'
                 f'<div class="mz-pct" style="color:{c}">{pct}%</div></div>')
    return f'<div class="mezcla">{cols}</div>'

# ── Presión: spectrum con marcador mini-orbe ──
def pressure_spectrum():
    pos = dict((k, p) for k, _, p in PRESS)[pressure] * 100
    labels = ''.join(f'<span class="{ "sp-on" if k==pressure else "" }" style="left:{p*100:.0f}%">{esc(lbl)}</span>' for k, lbl, p in PRESS)
    return (f'<div class="spectrum sp-press"><div class="sp-track">'
            f'<span class="sp-mark" style="left:{pos:.0f}%;background:{orb_bg(V500)};box-shadow:{orb_shadow(V500)}"></span></div>'
            f'<div class="sp-labels3">{labels}</div></div>')

perfil_card = f'''<div class="card">{sec_head(L["composition"], tiptext="Cómo se reparten tus respuestas entre los cuatro colores del modelo. El tamaño de cada orbe muestra cuánto pesa ese eje hoy.")}
  {mezcla()}
  <div class="mz-divider"></div>
  <div class="widget-h"><span>{esc(L["pressure"])}</span>{tip("Cómo tiendes a responder cuando la situación aprieta: regulando y ordenando, reaccionando en caliente, o corriéndote del problema.")}</div>
  {pressure_spectrum()}
</div>'''

estilo_card = f'<div class="card">{sec_head(L["style"])}<p class="body">{rich(perfil_adulto)}</p></div>'

def bridge_card(i, p):
    triad = (
      f'<div class="tri" style="border-color:{child_color}"><span class="tri-label" style="color:{child_color}">{esc(L["childState"])}</span><span class="tri-text">{rich(p["como_esta_el"])}</span></div>'
      f'<div class="tri" style="border-color:{adult_color}"><span class="tri-label" style="color:{adult_color}">{esc(L["adultStrength"])}</span><span class="tri-text">{rich(p["lo_que_traes"])}</span></div>'
      f'<div class="tri" style="border-color:{V600}"><span class="tri-label" style="color:{V600}">{esc(L["bridge"])}</span><span class="tri-text">{rich(p["el_puente"])}</span></div>')
    return (f'<div class="card">{sec_head(p["titulo"], sub=p["bajada"])}'
            f'<div class="triad">{triad}</div>'
            f'<div class="refl-sep"></div>'
            f'<div class="refl"><span class="refl-label">{esc(L["reflection"])}</span>{rich(p["pregunta_reflexion"])}</div></div>')

bridges = '<div class="sec-divider"></div>'.join(bridge_card(i + 1, p) for i, p in enumerate(puentes))
cierre_card = f'<div class="card">{sec_head(L["closing"], sub=L["closing_sub"])}<p class="body">{rich(cierre)}</p></div>'
notes = ('<div class="notes">'
         f'<p>También te enviamos este informe a {esc(email)}. Puedes revisarlo cuando quieras.</p>'
         '<p class="notes-mut">Guardamos tu perfil para reutilizarlo en nuevos puentes sin repetir el cuestionario. '
         'Si quieres que lo eliminemos, escríbenos a hola@argomethod.com.</p></div>')

banner = '''<div class="banner">
  <div class="banner-tag">Preview de maqueta · Puente con el design system</div>
  <div class="banner-title">ArgoPuente con los elementos del informe del niño</div>
  <p class="banner-sub">Apliqué al Puente el sistema del rediseño: nombre en serif, los dos ejes del adulto como orbes de vidrio en el hero, la composición como mezcla de 4 orbes, el estilo bajo presión como spectrum, más aire, hairlines y (i).</p>
  <p class="banner-note">Primera pasada, para seguir en detalle: los bridges (triada + pregunta) quedaron como estaban (asides), y hay decisiones abiertas (qué significan los % de la composición). Es solo preview.</p>
</div>'''

style = ('<style>'
'@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,' + FONT_B64 + ') format("woff2");}'
'@font-face{font-family:"Fraunces";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,' + SERIF_B64 + ') format("woff2");}'
'''
:root{--navy:#1D1D1F;--sec:#424245;--grey:#86868B;--light:#AEAEB2;--border:#E8E8ED;--bg:#F8F8FA;--neutral:#F5F5F7;--paper:#fff;
  --v50:#F9F5FC;--v100:#EDE5F5;--v200:#D4BCE8;--v500:#955FB5;--v600:#7A4D96;--page:#F5F5F7;--page-ink:#1D1D1F;--shadow:0 1px 3px rgba(0,0,0,.04);}
@media (prefers-color-scheme:dark){:root{--page:#141416;--page-ink:#e9e9ec;--shadow:0 1px 2px rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5);}}
:root[data-theme="light"]{--page:#F5F5F7;--page-ink:#1D1D1F;--shadow:0 1px 3px rgba(0,0,0,.04);}
:root[data-theme="dark"]{--page:#141416;--page-ink:#e9e9ec;--shadow:0 1px 2px rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5);}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--page-ink);font-family:"Inter",-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;}
.wrap{max-width:700px;margin:0 auto;padding:26px 18px 64px;}
.pagehead{margin:0 0 18px;padding:0 2px;}
.pagehead .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--light);margin:0 0 6px;}
.pagehead h1{margin:0;font-size:26px;font-weight:700;letter-spacing:-.02em;color:var(--navy);}
.pagehead .email{margin:3px 0 0;font-size:12px;color:var(--light);}
.card{background:var(--paper);border-radius:16px;padding:28px 32px;box-shadow:var(--shadow);color:var(--sec);}
.card + .card{margin-top:14px;}
/* HERO dos columnas + orbes */
.hero-lux{padding:32px 34px;}
.hx-grid{display:grid;grid-template-columns:1fr;gap:22px;}
@media(min-width:660px){.hx-grid{grid-template-columns:1.02fr .98fr;align-items:center;gap:18px;}}
.hx-left{min-width:0;}
.wordmark{font-size:17px;letter-spacing:-.01em;margin-bottom:16px;}
.wordmark .wm-a{font-weight:800;color:var(--navy);}
.wordmark .wm-b{font-weight:200;color:var(--grey);}
.hx-eyebrow{margin:0 0 9px;font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--v500);}
.hx-name{margin:0;font-family:"Fraunces","Inter",Georgia,serif;font-weight:440;font-size:clamp(21px,3.2vw,28px);line-height:1.12;letter-spacing:-.011em;color:var(--navy);}
.hx-name .np{display:block;}
.hx-name .nc{color:var(--navy);font-weight:400;}
.hero-divider{height:1px;margin:26px 0 20px;background:linear-gradient(90deg,transparent,var(--border) 12%,var(--border) 88%,transparent);}
.hero-saludo{margin:0;font-size:15px;line-height:1.72;color:var(--sec);}
.hero-saludo strong{font-weight:600;color:var(--navy);}
.hx-right{position:relative;width:100%;aspect-ratio:1 / 0.9;}
@media(max-width:659px){.hx-right{max-width:360px;margin:10px auto 0;}}
.orb-ring{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.orb{position:absolute;border-radius:50%;will-change:border-radius,transform;}
.orb-1{width:62%;aspect-ratio:1;left:3%;top:6%;z-index:2;animation:orbMorphA 9s ease-in-out infinite,orbFloatA 12s ease-in-out infinite;}
.orb-2{width:50%;aspect-ratio:1;left:36%;top:30%;z-index:1;animation:orbMorphB 8s ease-in-out infinite,orbFloatB 14s ease-in-out infinite;}
@keyframes orbMorphA{0%,100%{border-radius:58% 42% 47% 53% / 56% 51% 49% 44%}50%{border-radius:45% 55% 55% 45% / 50% 45% 55% 50%}}
@keyframes orbMorphB{0%,100%{border-radius:52% 48% 44% 56% / 53% 47% 53% 47%}50%{border-radius:61% 39% 56% 44% / 46% 57% 43% 54%}}
@keyframes orbFloatA{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-9px)}}
@keyframes orbFloatB{0%,100%{transform:translate(0,0)}50%{transform:translate(-7px,7px)}}
@media(prefers-reduced-motion:reduce){.orb,.mz-orb,.sp-mark{animation:none!important}}
.opill{position:absolute;display:inline-flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--border);border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:var(--navy);white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.06);z-index:3;}
.opill-dot{width:7px;height:7px;border-radius:999px;flex:none;}
.opill-1{top:9%;right:0;}
.opill-2{bottom:22%;right:2%;}
/* sección */
.sec-h{display:flex;align-items:center;gap:8px;margin:0 0 9px;font-size:15px;font-weight:600;color:var(--navy);}
.dot{width:7px;height:7px;border-radius:999px;flex:none;}
.sec-sub{margin:-5px 0 9px 15px;font-size:12.5px;color:var(--grey);}
.title-rule{height:1px;margin:0 0 18px;background:linear-gradient(90deg,transparent,var(--border) 10%,var(--border) 90%,transparent);}
.body{font-size:15px;line-height:1.72;color:var(--sec);margin:0;}
.body strong,.tri-text strong,.refl strong{font-weight:600;color:var(--navy);}
.note{margin-top:20px;background:var(--bg);border-radius:10px;padding:12px 15px;font-size:12px;line-height:1.6;color:var(--grey);}
/* mezcla */
.mezcla{display:flex;align-items:flex-end;justify-content:space-around;gap:6px;margin-top:2px;padding:6px 0 0;}
.mz-col{display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;}
.mz-orb{border-radius:50%;flex:none;will-change:border-radius;}
.mz-axis{margin-top:14px;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--navy);}
.mz-dot{width:6px;height:6px;border-radius:999px;flex:none;}
.mz-pct{margin-top:3px;font-size:13.5px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
.mz-divider{height:1px;margin:26px 0 22px;background:linear-gradient(90deg,transparent,var(--border) 18%,var(--border) 82%,transparent);}
.widget-h{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--grey);margin-bottom:16px;}
/* spectrum */
.spectrum{padding:14px 4px 2px;}
.sp-track{position:relative;height:3px;border-radius:999px;background:var(--bg);}
.sp-mark{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);animation:orbMorphA 8s ease-in-out infinite;}
.sp-labels3{position:relative;height:14px;margin-top:12px;}
.sp-labels3 span{position:absolute;transform:translateX(-50%);font-size:10.5px;font-weight:500;color:var(--light);white-space:nowrap;}
.sp-labels3 .sp-on{color:var(--v600);font-weight:700;}
/* dividers/bridges */
.sec-divider{height:1px;margin:14px 6px;background:linear-gradient(90deg,transparent,var(--border) 18%,var(--border) 82%,transparent);}
.ejemplo{margin-top:20px;padding:3px 0 3px 16px;border-left:2px solid var(--v200);font-size:13.5px;line-height:1.65;color:var(--sec);}
.bridge-title{margin:2px 0 16px;font-size:17px;font-weight:600;letter-spacing:-.01em;color:var(--navy);}
.triad{display:flex;flex-direction:column;gap:14px;}
.tri{padding:1px 0 1px 14px;border-left:2px solid;}
.tri-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}
.tri-text{display:block;font-size:14px;line-height:1.65;color:var(--sec);}
/* "Una pregunta para llevarte": sin línea violeta (se confundía con el filete del puente); separador neutro arriba */
.refl-sep{height:1px;margin:16px 0 14px;background:linear-gradient(90deg,transparent,var(--border) 18%,var(--border) 82%,transparent);}
.refl{font-size:13.5px;line-height:1.65;color:var(--sec);}
.refl-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--v600);margin-bottom:5px;}
.notes{margin-top:24px;padding:0 6px;color:var(--grey);}
.notes p{margin:0 0 6px;font-size:12px;line-height:1.6;}
.notes .notes-mut{color:var(--light);font-size:11px;}
/* (i) */
.tipwrap{position:relative;display:inline-flex;flex:none;}
.itip{width:18px;height:18px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);background:var(--bg);border-radius:999px;line-height:1;color:var(--grey);cursor:pointer;transition:background .15s,border-color .15s,color .15s;padding:0;}
.itip:hover,.itip[aria-expanded="true"]{background:var(--v50);border-color:var(--v200);color:var(--v600);}
.itip:focus-visible{outline:2px solid #0071E3;outline-offset:2px;}
.tipbox{display:none;position:absolute;left:0;top:100%;margin-top:6px;z-index:9999;width:max-content;max-width:230px;white-space:normal;background:var(--navy);color:#fff;border-radius:8px;padding:9px 12px;font-size:11px;line-height:1.5;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.28);}
.tipbox.open{display:block;}
.banner{border-radius:16px;padding:20px 22px;margin-bottom:22px;background:var(--v50);border:1px solid var(--v100);}
.banner-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--v600);}
.banner-title{font-size:17px;font-weight:700;color:var(--navy);margin:5px 0 6px;}
.banner-sub{margin:0 0 8px;font-size:13px;line-height:1.6;color:var(--sec);}
.banner-note{margin:0;font-size:12px;color:var(--grey);}
.v-chip{color:var(--v600);font-weight:600;}
'''
'</style>')

script = '''<script>
(function(){var openBox=null,openBtn=null;
function show(b,t){if(openBox&&openBox!==b)hide();b.classList.add('open');t.setAttribute('aria-expanded','true');openBox=b;openBtn=t;}
function hide(){if(openBox){openBox.classList.remove('open');openBtn.setAttribute('aria-expanded','false');openBox=null;openBtn=null;}}
document.querySelectorAll('.itip').forEach(function(t){var b=t.parentElement.querySelector('.tipbox');
t.addEventListener('mouseenter',function(){show(b,t);});t.addEventListener('mouseleave',hide);
t.addEventListener('click',function(e){e.stopPropagation();(openBox===b)?hide():show(b,t);});});
document.addEventListener('click',function(e){if(openBox&&!openBox.parentElement.contains(e.target))hide();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')hide();});})();
</script>'''

pagehead = (f'<div class="pagehead"><p class="eyebrow">{esc(L["eyebrow"])}</p>'
            f'<h1>{esc(recipient)}</h1><p class="email">{esc(email)}</p></div>')
doc = (f'<title>Maqueta ArgoPuente · design system</title>{style}<div class="wrap">'
       f'{banner}{pagehead}{hero}{perfil_card}{estilo_card}{bridges}{cierre_card}{notes}</div>{script}')
open('argo-puente-preview.html', 'w').write(doc)
print('wrote argo-puente-preview.html', len(doc), 'chars')
