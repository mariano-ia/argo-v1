import json, html, re, math

d = json.load(open('report-data.json'))
prof = d['profiles'][0]
rep = prof['report']
hero = rep['hero']
tips = d['tips']
colors = d['colors']
ui = d['ui']
GT = d['group_titles']
tipLabel = d['tipLabel']
accent = colors[hero['ejePrimario']]   # color del eje primario = IDENTIDAD
veta = colors[hero['ejeSecundario']]
FONT_B64 = open('inter-var.b64').read().strip()
SERIF_B64 = open('fraunces.b64').read().strip()   # Fraunces variable (display serif del nombre)

def esc(s): return html.escape(s, quote=True)

def rich(s):
    out, i = [], 0
    for m in re.finditer(r'\*\*([^*]+)\*\*', s):
        out.append(esc(s[i:m.start()])); out.append('<strong>' + esc(m.group(1)) + '</strong>'); i = m.end()
    out.append(esc(s[i:]))
    return ''.join(out)

byid = {s['id']: s for s in rep['secciones']}
GROUPS = [
    ('quien', ['receta', 'contingencia', 'patron', 'motor']),
    ('cancha', ['tormenta', 'grupo', 'logro']),
    ('acompanar', ['combustible', 'palabras', 'guia', 'reset']),
    ('masalla', ['ecos']),
]
VETA_DOT = {'contingencia', 'tormenta'}

INFO_SVG = ('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>')

def tip_el(text, up=False):
    box = 'tipbox tipbox-up' if up else 'tipbox'
    return (f'<span class="tipwrap">'
            f'<button type="button" class="itip" aria-label="{esc(tipLabel)}" aria-expanded="false">{INFO_SVG}</button>'
            f'<span class="{box}" role="tooltip">{esc(text)}</span></span>')

def info_tip(sid):
    t = tips.get(sid)
    return tip_el(t) if t else ''

# (i) del medidor de confianza: qué significa "Perfil ___" (definición más profesional)
METER_TIP = ("Expresa cuán definido se ve el perfil hoy: si un eje sobresale con claridad o si conviven "
             "varios de forma pareja. No es una nota: un perfil parejo no es mejor ni peor, solo menos marcado.")

def header(sec):
    dot = veta if sec['id'] in VETA_DOT else accent   # punto = color del eje (identidad)
    return (f'<h2 class="sec-h"><span class="dot" style="background:{dot}"></span>'
            f'<span class="sec-t">{esc(sec["titulo"])}</span>{info_tip(sec["id"])}</h2>')

def example(txt):   # "bajada a tierra": aside con filete violeta (cromática de marca, como los asides del dashboard)
    return f'<div class="ejemplo">{rich(txt)}</div>'

# ── Radar de "Su mezcla": los 4 ejes. Monocromo en el color del eje primario (identidad), como la
# referencia. Opuestos del modelo enfrentados: D(Impulsor)↕S(Sostenedor), I(Conector)↔C(Estratega). ──
AXIS_LABEL_ES = {'D': 'Impulsor', 'I': 'Conector', 'S': 'Sostenedor', 'C': 'Estratega'}
RADAR_SCORES = {'D': 85, 'C': 52, 'I': 30, 'S': 18}   # muestra, coherente con Mateo (D dominante)
RADAR_POS = [('D', -90, 'top'), ('I', 0, 'right'), ('S', 90, 'bottom'), ('C', 180, 'left')]

def radar_html():
    cx, cy, R = 150, 150, 96
    def pt(angle, frac):
        a = math.radians(angle); return (cx + math.cos(a) * R * frac, cy + math.sin(a) * R * frac)
    rings = ''.join(
        f'<circle cx="{cx}" cy="{cy}" r="{R*f:.1f}" fill="none" stroke="#E8E8ED" stroke-width="1"'
        f'{"" if f==1 else " stroke-dasharray=\'2 4\'"}/>'
        for f in (0.25, 0.5, 0.75, 1.0))
    spokes = ''.join(
        (lambda x, y: f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" stroke="#E8E8ED" stroke-width="1"/>')(*pt(ang, 1.0))
        for _, ang, _ in RADAR_POS)
    pts = [pt(ang, RADAR_SCORES[ax] / 100) for ax, ang, _ in RADAR_POS]
    poly = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    maxax = max(RADAR_SCORES, key=RADAR_SCORES.get)
    verts = ''
    for (ax, ang, _), (x, y) in zip(RADAR_POS, pts):
        if ax == maxax:
            verts += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="11" fill="{accent}" opacity="0.16"/>'
        verts += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="#fff" stroke="{accent}" stroke-width="2.2"/>'
    # labels dibujados como texto SVG en las puntas de cada eje (anchor por lado, con margen en el viewBox)
    LP = {'top': (150, 30, 'middle', 150, 47), 'bottom': (150, 268, 'middle', 150, 285),
          'left': (46, 145, 'end', 46, 163), 'right': (254, 145, 'start', 254, 163)}
    labels = ''
    for ax, _, pos in RADAR_POS:
        nx, ny, anc, sx, sy = LP[pos]
        labels += (f'<text x="{nx}" y="{ny}" text-anchor="{anc}" class="r-name">{AXIS_LABEL_ES[ax]}</text>'
                   f'<text x="{sx}" y="{sy}" text-anchor="{anc}" class="r-score">'
                   f'<tspan fill="{accent}">{RADAR_SCORES[ax]}</tspan><tspan class="r-max">/100</tspan></text>')
    return (f'<div class="radar"><svg class="radar-svg" viewBox="-46 0 392 300" role="img" '
            f'aria-label="Radar de los cuatro ejes de Mateo">'
            f'<g>{rings}{spokes}</g>'
            f'<polygon points="{poly}" fill="{accent}" fill-opacity="0.12" stroke="{accent}" '
            f'stroke-width="2" stroke-linejoin="round"/>{verts}{labels}</svg></div>')

def render_section(sec):
    k = sec['kind']
    if k == 'texto':
        b = sec['bloque']
        ej = example(b['ejemplo']) if b.get('ejemplo') else ''
        viz = radar_html() if sec['id'] == 'receta' else ''   # "Su mezcla" abre con el radar de los 4 ejes
        return f'<section class="card">{header(sec)}{viz}<p class="body">{rich(b["cuerpo"])}</p>{ej}</section>'
    if k == 'palabras':
        p = sec['palabras']
        con = ''.join(f'<span class="chip chip-con">{esc(c)}</span>' for c in p['puente'])
        rui = ''.join(f'<span class="chip chip-rui">{esc(c)}</span>' for c in p['ruido'])
        return (f'<section class="card">{header(sec)}'
                f'<div class="pal-grid">'
                f'<div><h3 class="pal-h pal-h-con">{esc(ui["conectan"])}</h3>{con}</div>'
                f'<div><h3 class="pal-h pal-h-rui">{esc(ui["ruido"])}</h3>{rui}</div>'
                f'</div><p class="pal-nota">{rich(p["nota"])}</p></section>')
    if k == 'guia':
        g = sec['guia']
        steps = [(ui['antes'], g['antes']), (ui['durante'], g['durante']), (ui['despues'], g['despues'])]
        rows = ''.join(f'<div class="guia-row"><div class="guia-k">{esc(k2)}</div><div class="guia-v">{rich(v)}</div></div>' for k2, v in steps)
        return (f'<section class="card">{header(sec)}'
                f'<p class="guia-lead">{esc(g["lead"])}</p>'
                f'<div class="guia-steps">{rows}</div>{example(g["ejemplo"])}</section>')
    return ''

# ── hero ──
meta_line = ' · '.join([hero['nombre'], f"{prof['edad']} {ui['edad']}", prof['dep'], '07 de julio de 2026'])
veta_h1 = ''
if hero.get('veta'):
    v = hero['veta']
    post = f' <span class="h1-mut">{esc(v["post"])}</span>' if v.get('post') else ''
    veta_h1 = f' <span class="h1-mut">{esc(v["pre"])}</span> <span style="color:{veta}">{esc(v["word"])}</span>{post}'
# ── Hero premium (ref del owner): nombre serif + dos ORBES DE VIDRIO VIVOS (morph+float) + pills flotantes ──
def hex_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def orb_bg(hx):   # vidrio TRANSPARENTE: apenas teñido, con un brillo suave arriba a la izquierda
    r, g, b = hex_rgb(hx)
    return (f"radial-gradient(circle at 36% 30%, rgba(255,255,255,.62), rgba(255,255,255,0) 48%),"
            f"radial-gradient(circle at 52% 55%, rgba({r},{g},{b},.30), rgba({r},{g},{b},.15) 62%, rgba({r},{g},{b},.05) 100%)")
def orb_shadow(hx):   # rim fino de color (para que se lea el borde donde se cruzan) + halo muy suave
    r, g, b = hex_rgb(hx)
    return (f"inset 0 0 0 1px rgba({r},{g},{b},.16), inset 0 1px 12px rgba(255,255,255,.45), "
            f"0 14px 38px -18px rgba({r},{g},{b},.30)")

USER_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"></circle><path d="M5.5 19a6.5 6.5 0 0 1 13 0"></path></svg>'
CHART_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15l4-4 3 3 5-6"></path><path d="M4 20h16"></path></svg>'
SPARK_SVG = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M12 2l1.5 6.2L20 10l-6.5 1.8L12 18l-1.5-6.2L4 10l6.5-1.8z"></path></svg>'

orb_ring = ('<svg class="orb-ring" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
            '<circle cx="232" cy="172" r="152" fill="none" stroke="#D4BCE8" stroke-width="1" '
            'stroke-dasharray="2 8" opacity="0.6"></circle></svg>')

PILL_LEVEL = {'Parejo': 'parejo', 'Con matices': 'con matices', 'Claro': 'claro', 'De lleno': 'muy marcado'}

def orb_div(cls, hx):
    return f'<div class="orb {cls}" style="background:{orb_bg(hx)};box-shadow:{orb_shadow(hx)}"></div>'
def pill(cls, hx, label):
    return f'<div class="opill {cls}"><span class="opill-dot" style="background:{hx}"></span>{esc(label)}</div>'

def build_hero(c):
    pax, plab = c['primary']; pcol = colors[pax]
    if c.get('parejo'):                                  # dos ejes parejos, sin jerarquía (unido por "y")
        sax, slab = c['parejo']; scol = colors[sax]
        name = (f'<span class="np" style="color:{pcol}">{esc(plab)}</span> '
                f'<span class="nc">y</span> <span class="nv" style="color:{scol}">{esc(slab)}</span>')
        orbs = orb_div('orb-1 orb-eq', pcol) + orb_div('orb-2 orb-eq', scol)
        pills = pill('opill-1', pcol, plab) + pill('opill-2', scol, slab)
    elif c.get('veta'):                                  # primario + veta (conector: con veta / con tonos de / con destellos de)
        vax, vlab, conn = c['veta']; vcol = colors[vax]
        name = (f'<span class="np" style="color:{pcol}">{esc(plab)}</span> '
                f'<span class="nc">{esc(conn)}</span> <span class="nv" style="color:{vcol}">{esc(vlab)}</span>')
        orbs = orb_div('orb-1', pcol) + orb_div('orb-2', vcol)
        pills = pill('opill-1', pcol, plab) + pill('opill-2', vcol, vlab)
    else:                                                # un solo eje preponderante (sin veta) => un orbe
        name = f'<span class="np" style="color:{pcol}">{esc(plab)}</span>'
        orbs = orb_div('orb-1 orb-solo', pcol)
        pills = pill('opill-solo', pcol, plab)
    conf = (f'<div class="hx-conf"><span class="opill-spark">{SPARK_SVG}</span>'
            f'Perfil {esc(PILL_LEVEL.get(c["level"], c["level"].lower()))}{tip_el(METER_TIP)}</div>')
    return (f'<div class="card hero-lux"><div class="hx-grid"><div class="hx-left">'
            f'<div class="hx-meta"><div class="kidmeta">{esc(c["meta"])}</div>'
            f'<div class="adulto">{esc(ui["adulto"])}: {esc(c.get("adult", "Marian"))}</div></div>'
            f'<p class="hx-eyebrow">Su perfil hoy</p><h1 class="hx-name">{name}</h1>'
            f'<p class="hx-lead">{rich(c["lead"])}</p>{conf}</div>'
            f'<div class="hx-right">{orb_ring}{orbs}{pills}</div></div></div>')

CASES = [
    {'label': 'Un solo eje preponderante (sin veta)', 'meta': 'Sofi · 10 años · Natación · 07 jul 2026',
     'adult': 'Ana', 'primary': ('S', 'Sostenedor'), 'level': 'De lleno',
     'lead': 'El juego de Sofi se apoya **de lleno en el sostén del grupo**: cuida el clima y se asegura de que todos estén bien antes de arrancar. Hoy, su manera de estar en la actividad pasa claramente por ahí.'},
    {'label': 'Veta apenas (con destellos de)', 'meta': 'Bruno · 13 años · Handball · 07 jul 2026',
     'adult': 'Marcela', 'primary': ('I', 'Conector'), 'veta': ('C', 'Estratega', 'con destellos de'), 'level': 'Con matices',
     'lead': 'El juego de Bruno se inclina hacia **el vínculo con los demás**, con un destello de mirada estratégica. Tiende a sumar y entusiasmar al grupo, y de a ratos se toma un segundo para leer la jugada antes de moverse.'},
    {'label': 'Veta media (con tonos de)', 'meta': 'Mateo · 11 años · Fútbol · 07 jul 2026',
     'adult': 'Marian', 'primary': ('D', 'Impulsor'), 'veta': ('C', 'Estratega', 'con tonos de'), 'level': 'Claro',
     'lead': hero['lead']},
    {'label': 'Veta afirmada (con veta)', 'meta': 'Tomás · 14 años · Ajedrez · 07 jul 2026',
     'adult': 'Diego', 'primary': ('C', 'Estratega'), 'veta': ('S', 'Sostenedor', 'con veta'), 'level': 'De lleno',
     'lead': 'El juego de Tomás se apoya **de lleno en el detalle y el plan**, con una veta que cuida al grupo. Suele querer entender cómo conviene hacer las cosas, sin perder de vista que el equipo esté bien.'},
    {'label': 'Otro cruce de colores (sostén + conexión)', 'meta': 'Emma · 9 años · Gimnasia · 07 jul 2026',
     'adult': 'Lucía', 'primary': ('S', 'Sostenedor'), 'veta': ('I', 'Conector', 'con tonos de'), 'level': 'Claro',
     'lead': 'El juego de Emma se inclina hacia **el sostén del grupo**, con tonos de conexión. Tiende a cuidar el clima y, cuando el momento lo pide, también entusiasma y suma a los demás.'},
    {'label': 'Sin nombre único: dos ejes parejos', 'meta': 'Lucas · 12 años · Básquet · 07 jul 2026',
     'adult': 'Pablo', 'primary': ('D', 'Impulsor'), 'parejo': ('I', 'Conector'), 'level': 'Parejo',
     'lead': 'Lucas juega hoy con **dos motores bien parejos**: la acción y el vínculo con los demás. No es indefinición, al contrario: dispone de dos registros y tiende a elegir según lo que pide cada momento.'},
]

heroes_html = ''.join(
    f'<div class="case"><div class="case-tag">{esc(c["label"])}</div>{build_hero(c)}</div>' for c in CASES)

groups_html = ''
for key, ids in GROUPS:
    secs = [byid[i] for i in ids if i in byid]
    if not secs: continue
    title = GT[key].replace('${n}', hero['nombre'])
    inner = ''.join(render_section(s) for s in secs)
    groups_html += (f'<div class="group"><div class="group-head"><div class="eyebrow">{esc(title)}</div></div>{inner}</div>')

footer_full = d['footer'].replace('${n}', hero['nombre'])
fdot = footer_full.find('. ')
fhead = footer_full[:fdot+1] if fdot >= 0 else footer_full
frest = footer_full[fdot+2:] if fdot >= 0 else ''
footer_html = f'<div class="footer"><span class="footer-h">{esc(fhead)}</span> {rich(frest)}</div>'

banner = '''<div class="banner">
  <div class="banner-tag">Preview de maqueta · variantes de hero</div>
  <div class="banner-title">Todos los casos del hero, en el nuevo diseño</div>
  <p class="banner-sub">El mismo hero (nombre serif + orbes de vidrio vivos + pastilla de confianza) aplicado a cada caso de perfil, para ver cómo se comporta:</p>
  <ul class="banner-list">
    <li><b>Un solo eje</b> (sin veta): un orbe.</li>
    <li><b>Veta en sus tres intensidades</b>: "con destellos de" / "con tonos de" / "con veta".</li>
    <li><b>Distintos cruces de color</b> según qué ejes se combinan.</li>
    <li><b>Sin nombre único</b>: dos ejes parejos (unidos por "y").</li>
  </ul>
  <p class="banner-note">La definición de "Perfil ___" (en el (i)) quedó más profesional. Saqué el radar y el resto del cuerpo para enfocar el hero; volvemos al radar más adelante. Es solo preview.</p>
</div>'''

style = ('<style>'
'@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;'
'src:url(data:font/woff2;base64,' + FONT_B64 + ') format("woff2");}'
'@font-face{font-family:"Fraunces";font-style:normal;font-weight:100 900;font-display:swap;'
'src:url(data:font/woff2;base64,' + SERIF_B64 + ') format("woff2");}'
'''
:root{
  --navy:#1D1D1F; --sec:#424245; --grey:#86868B; --light:#AEAEB2; --border:#E8E8ED;
  --bg:#F8F8FA; --neutral:#F5F5F7; --paper:#ffffff;
  --v50:#F9F5FC; --v100:#EDE5F5; --v200:#D4BCE8; --v400:#A97BD2; --v500:#955FB5; --v600:#7A4D96;
  --page:#F5F5F7; --page-ink:#1D1D1F; --shadow:0 1px 3px rgba(0,0,0,.04);
}
@media (prefers-color-scheme: dark){
  :root{ --page:#141416; --page-ink:#e9e9ec; --shadow:0 1px 2px rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5); }
}
:root[data-theme="light"]{ --page:#F5F5F7; --page-ink:#1D1D1F; --shadow:0 1px 3px rgba(0,0,0,.04); }
:root[data-theme="dark"]{ --page:#141416; --page-ink:#e9e9ec; --shadow:0 1px 2px rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5); }
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--page-ink);
  font-family:"Inter",-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;line-height:1.5;font-feature-settings:"cv11";}
.wrap{max-width:740px;margin:0 auto;padding:26px 18px 64px;}
/* card = el shell del dashboard: radio 14, sombra sutil, sin borde. El informe es un documento "papel". */
.card{background:var(--paper);border-radius:14px;padding:20px 24px;box-shadow:var(--shadow);color:var(--sec);}
/* ── Hero premium: serif de display + orbes de vidrio vivos + pills flotantes ── */
.hero-lux{padding:30px 32px;overflow:visible;}
.hx-grid{display:grid;grid-template-columns:1fr;gap:22px;}
@media(min-width:660px){.hx-grid{grid-template-columns:1.02fr .98fr;align-items:center;gap:18px;}}
.hx-left{min-width:0;}
.hx-meta{margin-bottom:18px;}
.kidmeta{font-size:12px;font-weight:600;color:var(--sec);}
.adulto{margin-top:2px;font-size:11px;color:var(--light);}
.hx-eyebrow{margin:0 0 9px;font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--v500);}
.hx-name{margin:0;font-family:"Fraunces","Inter",Georgia,serif;font-weight:440;font-size:clamp(19px,3.1vw,26px);
  line-height:1.1;letter-spacing:-.008em;color:var(--navy);}
.hx-name .np{display:block;}
.hx-name .nc{color:var(--navy);font-weight:400;}
.hx-name .nv{}
.hx-lead{margin:17px 0 0;font-size:13.5px;line-height:1.62;color:var(--sec);max-width:46ch;}
/* orbes */
.hx-right{position:relative;min-height:320px;}
@media(max-width:659px){.hx-right{min-height:250px;margin-top:4px;}}
.orb-ring{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.orb{position:absolute;border-radius:50%;will-change:border-radius,transform;}
/* dos lentes de vidrio transparentes, claramente superpuestas (se cruzan en el centro-derecha) */
.orb-1{width:62%;aspect-ratio:1;left:3%;top:6%;z-index:2;
  animation:orbMorphA 9s ease-in-out infinite,orbFloatA 12s ease-in-out infinite;}
/* orbe SECUNDARIO (veta): apenas más chico que el primario, para que se lea la jerarquía */
.orb-2{width:50%;aspect-ratio:1;left:36%;top:34%;z-index:1;
  animation:orbMorphB 8s ease-in-out infinite,orbFloatB 14s ease-in-out infinite;}
@keyframes orbMorphA{0%,100%{border-radius:58% 42% 47% 53% / 56% 51% 49% 44%}50%{border-radius:45% 55% 55% 45% / 50% 45% 55% 50%}}
@keyframes orbMorphB{0%,100%{border-radius:52% 48% 44% 56% / 53% 47% 53% 47%}50%{border-radius:61% 39% 56% 44% / 46% 57% 43% 54%}}
@keyframes orbFloatA{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-9px)}}
@keyframes orbFloatB{0%,100%{transform:translate(0,0)}50%{transform:translate(-7px,7px)}}
@media(prefers-reduced-motion:reduce){.orb{animation:none!important}}
/* pills flotantes */
.opill{position:absolute;display:inline-flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--border);
  border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:var(--navy);white-space:nowrap;
  box-shadow:0 5px 16px rgba(0,0,0,.06);z-index:3;}
.opill-dot{width:7px;height:7px;border-radius:999px;flex:none;}
.opill-spark{display:inline-flex;color:var(--v500);}
.opill-1{top:9%;right:-2px;}
.opill-2{bottom:24%;right:0;}
/* confianza como pastilla EN FLUJO, debajo del párrafo (columna izquierda) */
.hx-conf{display:inline-flex;align-items:center;gap:6px;margin-top:16px;background:var(--v50);border:1px solid var(--v100);
  border-radius:999px;padding:5px 5px 5px 11px;font-size:11.5px;font-weight:600;color:var(--v600);}
/* variantes de orbes/pills por caso */
.orb-solo{width:70%;left:15%;top:6%;}                     /* un solo eje: orbe MÁS grande que el compuesto */
.orb-1.orb-eq{width:56%;left:5%;top:11%;}                 /* parejos: mismo tamaño, solape simétrico */
.orb-2.orb-eq{width:56%;left:35%;top:29%;}
.opill-solo{position:absolute;display:inline-flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--border);
  border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:var(--navy);white-space:nowrap;
  box-shadow:0 5px 16px rgba(0,0,0,.06);z-index:3;top:40%;right:0;}
/* etiqueta de cada caso en la galería */
.case{margin-bottom:26px;}
.case-tag{display:flex;align-items:center;gap:8px;margin:0 2px 9px;font-size:11px;font-weight:700;
  text-transform:uppercase;letter-spacing:.08em;color:var(--v600);}
.case-tag::before{content:"";width:6px;height:6px;border-radius:999px;background:var(--v400);flex:none;}
/* divisor del resto */
.rest-divider{display:flex;align-items:center;gap:12px;margin:34px 2px 4px;color:var(--light);
  font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;}
.rest-divider::before,.rest-divider::after{content:"";flex:1;height:1px;background:var(--border);}
/* radar de "Su mezcla": monocromo en el color del eje (identidad); labels como texto SVG en las puntas */
.radar{width:330px;max-width:100%;margin:8px auto 20px;}
.radar-svg{width:100%;height:auto;display:block;font-family:"Inter",-apple-system,sans-serif;}
.r-name{fill:#1D1D1F;font-size:12.5px;font-weight:600;}
.r-score{font-size:16px;font-weight:800;letter-spacing:-.01em;}
.r-max{fill:#AEAEB2;font-size:10px;font-weight:600;}
.group{margin-top:30px;}
.group-head{padding:0 4px;margin-bottom:10px;}
.eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--grey);}
/* separación entre cards (mismo ritmo que el dashboard) */
.group .card + .card{margin-top:12px;}
.sec-h{display:flex;align-items:center;gap:8px;margin:0 0 9px;font-size:15px;font-weight:600;color:var(--navy);}
.dot{width:7px;height:7px;border-radius:999px;flex:none;}
.body{font-size:15px;line-height:1.6;color:var(--sec);margin:0;}
.body strong,.lead strong,.pal-nota strong,.guia-v strong,.ejemplo strong,.footer strong{font-weight:600;color:var(--navy);}
/* aside "bajada a tierra": mismo patrón que los asides del dashboard (filete violeta, sin caja pesada) */
.ejemplo{margin-top:12px;padding:2px 0 2px 14px;border-left:2px solid var(--v200);
  font-size:13.5px;line-height:1.6;color:var(--sec);}
.pal-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media (max-width:520px){.pal-grid{grid-template-columns:1fr;}}
.pal-h{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;}
.pal-h-con{color:#15803D;}
.pal-h-rui{color:var(--grey);}
.chip{display:block;margin-bottom:8px;border-radius:10px;padding:8px 12px;font-size:13.5px;line-height:1.4;}
.chip-con{background:#F0FDF4;color:var(--navy);}
.chip-rui{background:var(--bg);border:1px solid var(--border);color:var(--grey);}
.pal-nota{margin-top:16px;font-size:13.5px;line-height:1.6;color:var(--sec);}
.guia-lead{margin:0 0 6px;font-size:14px;color:var(--grey);}
.guia-steps{display:flex;flex-direction:column;}
.guia-row{display:grid;grid-template-columns:80px 1fr;gap:16px;padding:13px 0;border-top:1px solid var(--border);}
.guia-row:first-child{border-top:0;padding-top:4px;}
/* pasos de la guía = accionable => label en violeta (cromática de marca) */
.guia-k{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding-top:2px;color:var(--v500);}
.guia-v{font-size:14.5px;line-height:1.6;color:var(--sec);}
.footer{margin-top:26px;background:var(--bg);border-radius:14px;padding:18px 22px;font-size:13px;line-height:1.6;color:var(--sec);}
.footer-h{font-weight:600;color:var(--navy);}
/* (i) tooltip: el InfoTip del sistema (icono redondo, Info de lucide, hover violeta, burbuja navy) */
.tipwrap{position:relative;display:inline-flex;flex:none;}
.itip{width:18px;height:18px;flex:none;display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--border);background:var(--bg);border-radius:999px;line-height:1;color:var(--grey);
  cursor:pointer;transition:background .15s,border-color .15s,color .15s;padding:0;}
.itip:hover{background:var(--v50);border-color:var(--v200);color:var(--v600);}
.itip:focus-visible{outline:2px solid #0071E3;outline-offset:2px;}
.itip[aria-expanded="true"]{background:var(--v50);border-color:var(--v200);color:var(--v600);}
.tipbox{display:none;position:absolute;left:0;top:100%;margin-top:6px;z-index:9999;
  width:max-content;max-width:230px;white-space:normal;  /* se ajusta al texto y SIEMPRE envuelve (aunque la pill sea nowrap) */
  background:var(--navy);color:#fff;border-radius:8px;padding:9px 12px;font-size:11px;font-weight:400;
  line-height:1.5;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.28);}
.tipbox.open{display:block;}
/* variante que abre hacia ARRIBA y anclada a la DERECHA (para pills al borde inferior-derecho: no se corta) */
.tipbox-up{top:auto;bottom:100%;left:auto;right:0;transform:none;margin-top:0;margin-bottom:9px;width:212px;text-align:left;}
/* review banner */
.banner{border-radius:14px;padding:20px 22px;margin-bottom:22px;background:var(--v50);border:1px solid var(--v100);}
.banner-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--v600);}
.banner-title{font-size:17px;font-weight:700;color:var(--navy);margin:5px 0 6px;}
.banner-sub{margin:0 0 10px;font-size:13px;color:var(--sec);}
.banner-list{margin:0;padding-left:18px;font-size:13.5px;line-height:1.6;color:var(--sec);}
.banner-list li{margin-bottom:6px;}
.banner-list b{font-weight:700;color:var(--navy);}
.banner-list code{background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:0 5px;font-size:12px;}
.banner-note{margin:12px 0 0;font-size:12px;color:var(--grey);}
.v-chip{color:var(--v600);font-weight:600;}
.mini-i{display:inline-flex;width:16px;height:16px;align-items:center;justify-content:center;
  border:1px solid var(--v200);background:var(--v50);border-radius:999px;color:var(--v600);vertical-align:middle;}
'''
'</style>')

script = '''<script>
(function(){
  var openBox=null, openBtn=null;
  function show(box,btn){ if(openBox&&openBox!==box) hide(); box.classList.add('open'); btn.setAttribute('aria-expanded','true'); openBox=box; openBtn=btn; }
  function hide(){ if(openBox){ openBox.classList.remove('open'); openBtn.setAttribute('aria-expanded','false'); openBox=null; openBtn=null; } }
  document.querySelectorAll('.itip').forEach(function(btn){
    var box=btn.parentElement.querySelector('.tipbox');
    btn.addEventListener('mouseenter',function(){ show(box,btn); });
    btn.addEventListener('mouseleave',function(){ hide(); });
    btn.addEventListener('click',function(e){ e.stopPropagation(); (openBox===box)?hide():show(box,btn); });
  });
  document.addEventListener('click',function(e){ if(openBox && !openBox.parentElement.contains(e.target)) hide(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') hide(); });
})();
</script>'''

doc = f'<title>Maqueta informe Argo · variantes de hero</title>{style}<div class="wrap">{banner}{heroes_html}</div>{script}'
open('argo-informe-preview.html', 'w').write(doc)
print('wrote argo-informe-preview.html', len(doc), 'chars')
