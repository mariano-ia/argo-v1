import json

SRC = '/Users/marianonoceti/Desktop/Antigravity/Argo Project/docs/_i18n/report-v4-translations.json'
OUT = '/Users/marianonoceti/Desktop/Antigravity/Argo Project/src/lib/reportEjeContentI18n.ts'
t = json.load(open(SRC))

CANON_LABEL = {
    'en': {'D': 'Driver', 'I': 'Connector', 'S': 'Sustainer', 'C': 'Strategist'},
    'pt': {'D': 'Impulsionador', 'I': 'Conector', 'S': 'Sustentador', 'C': 'Estrategista'},
}


def apply_fixes(lang, eje):
    """Aplica los fixes del verificador (docs/METODO-V4-EN-PT-INTEGRACION.md)."""
    def rep(axis, path, old, new):
        d = eje[axis]
        *parents, leaf = path
        for p in parents:
            d = d[p]
        assert old in d[leaf], f'{lang}.{axis}.{".".join(path)}: no se encontró {old!r}'
        d[leaf] = d[leaf].replace(old, new)

    if lang == 'en':
        # doble {nombre} → pronombre en la 2ª/1ª ocurrencia (naturalidad, no género)
        rep('D', ['combustible', 'cuerpo'], 'When {nombre} senses', 'When they sense')
        rep('D', ['guia', 'antes'], 'Offer {nombre} a concrete goal', 'Offer them a concrete goal')
    elif lang == 'pt':
        # 1. S.palabrasNota: quitar comillas dobles envolventes de más
        s = eje['S']['palabrasNota']
        if s.startswith('"') and s.endswith('"'):
            eje['S']['palabrasNota'] = s[1:-1]
        # 2. I.reset.cuerpo: "não está nisso sozinho" (género) → neutro
        rep('I', ['reset', 'cuerpo'], 'não está nisso sozinho', 'não enfrenta isso em solidão')
        # 3. S.palabrasPuente: "Obrigado por sustentar…" (género del adulto) → neutro
        pp = eje['S']['palabrasPuente']
        pp[:] = ['Que bom poder contar com você para sustentar o grupo.' if x == 'Obrigado por sustentar o grupo.' else x for x in pp]
        assert 'Que bom poder contar com você para sustentar o grupo.' in pp
        # 4. D.ecos.cuerpo: {nombre} DENTRO de la negrita final → neutro
        rep('D', ['ecos', 'cuerpo'], '**o jeito de {nombre} estar no mundo**', '**seu jeito de estar no mundo**')
        # 5. I.guia.despues: {nombre} DENTRO de la negrita → neutro
        rep('I', ['guia', 'despues'], '**quando {nombre} soma ao ânimo do grupo**', '**quando soma ao ânimo do grupo**')
        # 6. S.guia.lead: unificar con D/I/C
        eje['S']['guia']['lead'] = 'Três momentos em que uma pequena intenção muda muita coisa.'
    return eje


def build(lang):
    eje = json.loads(json.dumps(t['eje'][lang]))  # deep copy
    eje = apply_fixes(lang, eje)
    out = {}
    for axis in ('D', 'I', 'S', 'C'):
        e = eje[axis]
        out[axis] = {
            'eje': axis,
            'label': CANON_LABEL[lang][axis],  # override: usar el canónico (el del payload venía sin traducir)
            'combustible': e['combustible'],
            'palabrasPuente': e['palabrasPuente'],
            'palabrasRuido': e['palabrasRuido'],
            'palabrasNota': e['palabrasNota'],
            'guia': e['guia'],
            'reset': e['reset'],
            'ecos': e['ecos'],
        }
    return out


def emit(v, ind):
    sp = '  ' * ind
    if isinstance(v, dict):
        rows = [f'{sp}  {json.dumps(k, ensure_ascii=False)}: {emit(val, ind + 1)}' for k, val in v.items()]
        return '{\n' + ',\n'.join(rows) + f'\n{sp}}}'
    if isinstance(v, list):
        return '[' + ', '.join(json.dumps(x, ensure_ascii=False) for x in v) + ']'
    return json.dumps(v, ensure_ascii=False)


EN = {a: build('en')[a] for a in ('D', 'I', 'S', 'C')}
PT = {a: build('pt')[a] for a in ('D', 'I', 'S', 'C')}

# Motor (voz nueva con ejemplo) desde bodies.*.motor
def motor(lang):
    m = t['bodies'][lang]['motor']
    return {
        'rapido': {'cuerpo': m['rapido_cuerpo'], 'ejemplo': m['rapido_ej']},
        'intermedio': {'cuerpo': m['intermedio_cuerpo'], 'ejemplo': m['intermedio_ej']},
        'lento': {'cuerpo': m['lento_cuerpo'], 'ejemplo': m['lento_ej']},
    }

header = '''// src/lib/reportEjeContentI18n.ts
// Contenido de eje (combustible/palabras/guia/reset/ecos) + motor, en EN y PT. GENERADO por
// scripts/gen_eje.py desde docs/_i18n/report-v4-translations.json (traducciones verificadas por 3
// workflows adversariales) con los fixes del verificador aplicados (docs/METODO-V4-EN-PT-INTEGRACION.md).
// NO editar a mano: editar el JSON o el generador y correr `python3 scripts/gen_eje.py`.
// El es vive en archetypeContentV4.EJE_BASE_DRAFT_ES (voz aprobada por el owner, snapshot-guarded).
import type { Axis } from './evidenceFicha';
import type { EjeBaseContent, ReportBlock } from './archetypeContentV4';

export const EJE_BASE_EN: Record<Axis, EjeBaseContent> = '''

body_en = emit(EN, 0) + ';\n\n'
body_pt = 'export const EJE_BASE_PT: Record<Axis, EjeBaseContent> = ' + emit(PT, 0) + ';\n\n'
motor_en = 'export const MOTOR_EN: Record<\'rapido\' | \'intermedio\' | \'lento\', ReportBlock> = ' + emit(motor('en'), 0) + ';\n\n'
motor_pt = 'export const MOTOR_PT: Record<\'rapido\' | \'intermedio\' | \'lento\', ReportBlock> = ' + emit(motor('pt'), 0) + ';\n'

out = header + body_en + body_pt + motor_en + motor_pt
open(OUT, 'w').write(out)
print('reportEjeContentI18n.ts:', len(out), 'chars')
