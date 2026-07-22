import html
FONT_B64 = open('inter-var.b64').read().strip()

def esc(s): return html.escape(s, quote=True)
import re
def rich(s):
    out, i = [], 0
    for m in re.finditer(r'\*\*([^*]+)\*\*', s):
        out.append(esc(s[i:m.start()])); out.append('<strong>' + esc(m.group(1)) + '</strong>'); i = m.end()
    out.append(esc(s[i:]))
    return ''.join(out)

# ── colores (tokens Argo) ──
AXIS = {'D':'#f97316','I':'#f59e0b','S':'#22c55e','C':'#6366f1'}
AXIS_LABEL = {'D':'Impulsor','I':'Conector','S':'Sostenedor','C':'Estratega'}
V600 = '#7A4D96'

# ── datos de muestra (adulto Estratega con veta Sostenedor ↔ niño Impulsor) ──
recipient = 'Marian'
email = 'marian@ejemplo.com'
child = 'Mateo'
adult_primary, adult_veta = 'C', 'S'
child_axis = 'D'
adult_color = AXIS[adult_primary]
child_color = AXIS[child_axis]
counts = {'C':9, 'S':6, 'I':5, 'D':4}   # dominante C
pressure = 'regulado'   # regulado | reactivo | evitativo

saludo = ("Gracias por hacer este recorrido, Marian. Lo que sigue no es un manual sobre Mateo ni sobre ti, "
          "sino un puente entre dos formas distintas de estar en la actividad. Léelo con calma: no hay una "
          "manera correcta de acompañar, hay la tuya, y conocerla un poco mejor ya es media cancha ganada.")
perfil_adulto = ("Tu estilo tiende a apoyarse en el **plan y la mirada larga**: sueles querer entender cómo "
                 "conviene hacer las cosas antes de lanzarte, y eso les da a quienes te rodean una sensación de "
                 "orden y previsibilidad. Bajo presión sueles mantener la calma y ordenar, más que empujar. Es un "
                 "gran recurso, y también el punto desde donde a veces cuesta encontrarse con un chico que decide "
                 "y arranca primero, y piensa después.")

puentes = [
  { 'titulo': 'Cuando él arranca antes de pensar',
    'como_esta_el': 'Mateo tiende a decidir y moverse rápido: siente que avanzar es la forma de resolver, y detenerse a planear puede vivirlo como frenar algo que ya estaba en marcha.',
    'lo_que_traes': 'Tú sueles ver el paso siguiente y los riesgos antes de que aparezcan. Esa anticipación es un regalo: puede ahorrarle a Mateo más de un tropiezo.',
    'el_puente': 'En lugar de pedirle que frene, prueba ofrecerle tu mirada como una pregunta corta en movimiento: "¿y si esto no sale, cuál es el plan B?". Le sumas cabeza sin apagarle el impulso.',
    'pregunta': '¿En qué momento de esta semana podrías dejar que Mateo arranque a su modo, y sumar tu mirada solo si hace falta?' },
  { 'titulo': 'El ritmo de cada uno',
    'como_esta_el': 'A Mateo lo enciende lo inmediato: quiere ver que su acción produce un efecto ya. La espera y los procesos largos suelen costarle más.',
    'lo_que_traes': 'Tú aportas el tiempo largo: sabes que las cosas buenas se construyen de a poco y no todo se resuelve en el primer intento.',
    'el_puente': 'Tradúcele tu paciencia a metas cortas y visibles: en lugar de "esto lleva meses", "esta semana logramos esto". Conviertes tu horizonte largo en pequeñas victorias que él sí puede sentir.',
    'pregunta': '¿Cuál sería una meta chica y concreta que Mateo pueda ver cumplida antes del fin de semana?' },
  { 'titulo': 'Cuando algo sale mal',
    'como_esta_el': 'Ante un error, Mateo tiende a querer volver a la acción enseguida: quedarse a analizar puede sentirlo como quedarse atascado.',
    'lo_que_traes': 'Tú sueles querer entender qué pasó para que no se repita. Esa lectura tranquila es justo lo que evita tropezar dos veces con la misma piedra.',
    'el_puente': 'Dale primero el movimiento que necesita y deja el análisis para después, en frío: "ahora seguimos, y en un rato pensamos juntos qué ajustar". Así tu reflexión llega cuando él puede escucharla.',
    'pregunta': '¿Cómo te suena separar el "seguimos" del "pensemos qué pasó", para que Mateo pueda recibir los dos?' },
  { 'titulo': 'Lo que más lo motiva',
    'como_esta_el': 'A Mateo lo mueve sentir que su empuje deja una marca concreta. El reconocimiento de su iniciativa suele ser su mejor combustible.',
    'lo_que_traes': 'Tú tiendes a reconocer el proceso y la decisión bien pensada, más que el golpe de efecto. Esa mirada le enseña que lo bien hecho también vale.',
    'el_puente': 'Une las dos cosas: reconoce su empuje y, en la misma frase, nombra la buena decisión que hubo detrás. "Me encantó cómo te animaste, y además elegiste bien el momento". Le hablas en su idioma y le sumas el tuyo.',
    'pregunta': '¿Qué decisión concreta de Mateo podrías reconocer hoy, además de sus ganas?' },
]
cierre = ("Ninguno de los dos tiene que cambiar quién es. El puente no es que Mateo se vuelva planificador ni que "
          "tú te vuelvas impulsivo: es que cada uno le preste al otro un poco de su fortaleza. Tu calma y tu mirada "
          "larga, su empuje y sus ganas. Juntos, son un gran equipo.")

L = {'eyebrow':'Informe para el adulto','greeting':'Te damos la bienvenida','style':'Tu estilo natural',
     'closing':'Para llevar','childState':'Cómo tiende a estar','adultStrength':'Lo que tú traes',
     'bridge':'El puente','reflection':'Una pregunta para llevarte','composition':'Composición del perfil',
     'pressure':'Estilo bajo presión','tipLabel':'Qué mide esto'}
PRESS = [('regulado','Regulado'),('reactivo','Reactivo'),('evitativo','Evitativo')]

INFO_SVG = ('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>')
def tip(text):
    return (f'<span class="tipwrap"><button type="button" class="itip" aria-label="{esc(L["tipLabel"])}" '
            f'aria-expanded="false">{INFO_SVG}</button><span class="tipbox" role="tooltip">{esc(text)}</span></span>')

def sec_head(title, dot=None, tiptext=None):
    dotc = dot or adult_color
    t = tip(tiptext) if tiptext else ''
    return (f'<h2 class="sec-h"><span class="dot" style="background:{dotc}"></span>'
            f'<span class="sec-t">{esc(title)}</span>{t}</h2>')

def aside(text):   # ejemplo/pregunta con filete violeta (mismo patrón que el informe)
    return f'<div class="ejemplo">{rich(text)}</div>'

# ── brújula: perfil del adulto como el hero del informe (nombre coloreado + datos) ──
prof_name = (f'<span style="color:{adult_color}">{AXIS_LABEL[adult_primary]}</span> '
             f'<span class="h1-mut">con veta</span> <span style="color:{AXIS[adult_veta]}">{AXIS_LABEL[adult_veta]}</span>')

maxc = max(counts.values())
comp_rows = ''
for ax in ['D','I','S','C']:
    pct = (counts.get(ax,0)/maxc)*100
    dom = ax == adult_primary
    comp_rows += (f'<div class="comp-row"><span class="comp-label">{AXIS_LABEL[ax]}</span>'
                  f'<span class="comp-track"><span class="comp-fill" style="width:{pct:.0f}%;background:{AXIS[ax]};opacity:{1 if dom else 0.32}"></span></span></div>')

pr_segs = ''.join(f'<span class="pr-seg" style="background:{V600 if p==pressure else ""}"></span>' for p,_ in PRESS)
pr_labels = ''.join(f'<span class="{ "pr-on" if p==pressure else "" }">{esc(lbl)}</span>' for p,lbl in PRESS)

brujula = f'''<div class="card hero">
  <div class="wordmark"><span class="wm-a">Argo</span><span class="wm-b">Puente®</span></div>
  <h1 class="h1 prof-name">{prof_name}</h1>
  <div class="widget">
    <div class="widget-h"><span>{esc(L["composition"])}</span>{tip("Cómo se reparten tus respuestas entre los cuatro colores del modelo. La barra llena marca el que más pesa; las tenues, los que también están.")}</div>
    <div class="comp">{comp_rows}</div>
  </div>
  <div class="widget">
    <div class="widget-h"><span>{esc(L["pressure"])}</span>{tip("Cómo tiendes a responder cuando la situación aprieta: regulando y ordenando, reaccionando en caliente, o corriéndote del problema.")}</div>
    <div class="pressure"><div class="pr-segs">{pr_segs}</div><div class="pr-labels">{pr_labels}</div></div>
  </div>
</div>'''

saludo_card = f'''<div class="card">
  {sec_head(L["greeting"])}
  <p class="body">{rich(saludo)}</p>
  <div class="note">ArgoPuente® no es un servicio clínico ni terapéutico. Es una lente para autoconocerte y tender puentes con el niño en el deporte.</div>
</div>'''

estilo_card = f'<div class="card">{sec_head(L["style"])}<p class="body">{rich(perfil_adulto)}</p></div>'

def bridge_card(i, p):
    triad = (
      f'<div class="tri" style="border-color:{child_color}"><span class="tri-label" style="color:{child_color}">{esc(L["childState"])}</span>'
      f'<span class="tri-text">{rich(p["como_esta_el"])}</span></div>'
      f'<div class="tri" style="border-color:{adult_color}"><span class="tri-label" style="color:{adult_color}">{esc(L["adultStrength"])}</span>'
      f'<span class="tri-text">{rich(p["lo_que_traes"])}</span></div>'
      f'<div class="tri" style="border-color:{V600}"><span class="tri-label" style="color:{V600}">{esc(L["bridge"])}</span>'
      f'<span class="tri-text">{rich(p["el_puente"])}</span></div>')
    return (f'<div class="card">{sec_head(f"Puente {i}")}'
            f'<h3 class="bridge-title">{esc(p["titulo"])}</h3>'
            f'<div class="triad">{triad}</div>'
            f'<div class="refl"><span class="refl-label">{esc(L["reflection"])}</span>{rich(p["pregunta"])}</div></div>')

bridges = ''.join(bridge_card(i+1, p) for i,p in enumerate(puentes))
cierre_card = f'<div class="card">{sec_head(L["closing"])}<p class="body">{rich(cierre)}</p></div>'

notes = ('<div class="notes">'
         f'<p>También te enviamos este informe a {esc(email)}. Puedes revisarlo cuando quieras.</p>'
         '<p class="notes-mut">Guardamos tu perfil para reutilizarlo en nuevos puentes sin repetir el cuestionario. '
         'Si quieres que lo eliminemos, escríbenos a hola@argomethod.com.</p></div>')

banner = '''<div class="banner">
  <div class="banner-tag">Preview de maqueta · cohesión con el dashboard</div>
  <div class="banner-title">ArgoPuente® con la misma mano que el informe</div>
  <p class="banner-sub">Mismo sistema visual que la maqueta del informe del niño: fuente Inter, cards <code>shadow-argo</code>, escala y pesos del dashboard, y color disciplinado.</p>
  <ul class="banner-list">
    <li>El perfil del adulto se muestra como el <b>hero del informe</b> (nombre coloreado "Estratega con veta Sostenedor"), no como pills sueltas.</li>
    <li>Los encabezados pasan de micro-caps <code>text-[11px]</code> con tracking ancho + iconos a <b>punto + título 15/semibold</b>, igual que el informe.</li>
    <li>La triada de cada puente (cómo está / lo que traes / el puente) deja las cajas con borde y pasa a <b>asides con filete</b>: niño en su color, adulto en el suyo, el puente en <span class="v-chip">violeta</span>.</li>
    <li><b>(i)</b> del sistema en los widgets de datos (composición, presión), donde más se abre "el algoritmo".</li>
  </ul>
</div>'''

style = ('<style>'
'@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;'
'src:url(data:font/woff2;base64,' + FONT_B64 + ') format("woff2");}'
'''
:root{
  --navy:#1D1D1F; --sec:#424245; --grey:#86868B; --light:#AEAEB2; --border:#E8E8ED;
  --bg:#F8F8FA; --neutral:#F5F5F7; --paper:#ffffff;
  --v50:#F9F5FC; --v100:#EDE5F5; --v200:#D4BCE8; --v400:#A97BD2; --v500:#955FB5; --v600:#7A4D96;
  --page:#F5F5F7; --page-ink:#1D1D1F; --shadow:0 1px 3px rgba(0,0,0,.04);
}
@media (prefers-color-scheme: dark){ :root{ --page:#141416; --page-ink:#e9e9ec; --shadow:0 1px 2px rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5);} }
:root[data-theme="light"]{ --page:#F5F5F7; --page-ink:#1D1D1F; --shadow:0 1px 3px rgba(0,0,0,.04);}
:root[data-theme="dark"]{ --page:#141416; --page-ink:#e9e9ec; --shadow:0 1px 2px rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5);}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--page-ink);
  font-family:"Inter",-apple-system,BlinkMacSystemFont,system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;}
.wrap{max-width:680px;margin:0 auto;padding:26px 18px 64px;}
.pagehead{margin:0 0 18px;padding:0 2px;}
.pagehead .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--light);margin:0 0 6px;}
.pagehead h1{margin:0;font-size:26px;font-weight:700;letter-spacing:-.02em;color:var(--navy);}
.pagehead .email{margin:3px 0 0;font-size:12px;color:var(--light);}
.card{background:var(--paper);border-radius:14px;padding:20px 24px;box-shadow:var(--shadow);color:var(--sec);}
.card + .card{margin-top:12px;}
.hero{padding:26px 28px;}
.wordmark{font-size:20px;letter-spacing:-.01em;margin-bottom:14px;}
.wordmark .wm-a{font-weight:800;color:var(--navy);}
.wordmark .wm-b{font-weight:200;color:var(--grey);}
.h1{margin:0;font-size:26px;font-weight:700;line-height:1.18;letter-spacing:-.02em;color:var(--navy);text-wrap:balance;}
.h1-mut{font-weight:400;color:var(--grey);}
.prof-name{margin-bottom:2px;}
.widget{margin-top:20px;}
.widget-h{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--grey);margin-bottom:11px;}
.comp{display:flex;flex-direction:column;gap:9px;}
.comp-row{display:flex;align-items:center;gap:12px;}
.comp-label{font-size:12px;font-weight:500;color:var(--grey);width:88px;flex:none;}
.comp-track{flex:1;height:8px;background:var(--bg);border-radius:999px;overflow:hidden;}
.comp-fill{display:block;height:100%;border-radius:999px;}
.pressure{}
.pr-segs{display:flex;gap:3px;}
.pr-seg{height:4px;flex:1;border-radius:2px;background:rgba(0,0,0,.07);}
.pr-labels{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--grey);}
.pr-labels .pr-on{color:var(--v600);font-weight:700;}
.sec-h{display:flex;align-items:center;gap:8px;margin:0 0 9px;font-size:15px;font-weight:600;color:var(--navy);}
.dot{width:7px;height:7px;border-radius:999px;flex:none;}
.body{font-size:15px;line-height:1.6;color:var(--sec);margin:0;}
.body strong,.tri-text strong,.refl strong{font-weight:600;color:var(--navy);}
.note{margin-top:16px;background:var(--bg);border-radius:10px;padding:11px 14px;font-size:12px;line-height:1.55;color:var(--grey);}
.ejemplo{margin-top:12px;padding:2px 0 2px 14px;border-left:2px solid var(--v200);font-size:13.5px;line-height:1.6;color:var(--sec);}
.bridge-title{margin:2px 0 14px;font-size:17px;font-weight:600;letter-spacing:-.01em;color:var(--navy);}
.triad{display:flex;flex-direction:column;gap:12px;}
.tri{padding:1px 0 1px 14px;border-left:2px solid;}
.tri-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}
.tri-text{display:block;font-size:14px;line-height:1.6;color:var(--sec);}
.refl{margin-top:16px;background:var(--v50);border-radius:12px;padding:13px 16px;font-size:14px;line-height:1.6;color:var(--navy);}
.refl-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--v600);margin-bottom:4px;}
.notes{margin-top:20px;padding:0 6px;color:var(--grey);}
.notes p{margin:0 0 6px;font-size:12px;line-height:1.55;}
.notes .notes-mut{color:var(--light);font-size:11px;}
/* (i) tooltip: el InfoTip del sistema */
.tipwrap{position:relative;display:inline-flex;flex:none;}
.itip{width:18px;height:18px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);
  background:var(--bg);border-radius:999px;line-height:1;color:var(--grey);cursor:pointer;transition:background .15s,border-color .15s,color .15s;padding:0;}
.itip:hover,.itip[aria-expanded="true"]{background:var(--v50);border-color:var(--v200);color:var(--v600);}
.itip:focus-visible{outline:2px solid #0071E3;outline-offset:2px;}
.tipbox{display:none;position:absolute;left:0;top:100%;margin-top:6px;z-index:9999;width:250px;background:var(--navy);color:#fff;
  border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.55;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.28);}
.tipbox.open{display:block;}
.banner{border-radius:14px;padding:20px 22px;margin-bottom:22px;background:var(--v50);border:1px solid var(--v100);}
.banner-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--v600);}
.banner-title{font-size:17px;font-weight:700;color:var(--navy);margin:5px 0 6px;}
.banner-sub{margin:0 0 10px;font-size:13px;color:var(--sec);}
.banner-list{margin:0;padding-left:18px;font-size:13.5px;line-height:1.6;color:var(--sec);}
.banner-list li{margin-bottom:6px;}
.banner-list b{font-weight:700;color:var(--navy);}
.banner-list code{background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:0 5px;font-size:12px;}
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

doc = (f'<title>Maqueta ArgoPuente · cohesión</title>{style}<div class="wrap">'
       f'{banner}{pagehead}{brujula}{saludo_card}{estilo_card}{bridges}{cierre_card}{notes}</div>{script}')
open('argo-puente-preview.html','w').write(doc)
print('wrote argo-puente-preview.html', len(doc), 'chars')
