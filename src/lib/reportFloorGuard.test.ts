// src/lib/reportFloorGuard.test.ts  (run via: tsx --test)
//
// GARANTÍA DEL PISO: el informe determinista (Capa 1, buildReportV4) debe pasar TODOS los guards
// para CUALQUIER combinación posible de arquetipo × registro × idioma × marco. Es la pieza que hace
// cumplible el requisito "nunca sale mal, pero tampoco puede dejar de salir": si el piso siempre pasa
// el gate, un informe válido SIEMPRE se puede entregar al primer intento, y un HOLD solo puede venir
// de un defecto REAL de dato (ficha rota) — no de una frase de template que roza un guard.
//
// Corre el Cartesiano contra los DOS gates que existen:
//   1. gateReportV4  (api/session.ts) — el que SELLA report_status y decide el envío del email.
//   2. qualityGate   (reportQuality.ts) — el canónico/puro (shadow, report_qc, aceptación de Capa 2).
// Ambos deben dar ready/pass. Cualquier fallo aquí es un template o guard que dejaría un informe
// retenido en producción (fue exactamente el caso "va a ser" del Estratega es/pt).
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportV4, sportFrame } from './reportV4';
import { qualityGate, holdClass, DATA_HOLD_REASONS } from './reportQuality';
import { gateReportV4 } from '../../api/session';

type Axis = 'D' | 'I' | 'S' | 'C';
type Vec = Record<Axis, number>;

// Ficha desde un vector agrupado por eje (suma 12).
const answersFrom = (vec: Vec) => {
  const out: { axis: Axis; responseTimeMs: number; question_id: string }[] = [];
  let n = 0;
  (['D', 'I', 'S', 'C'] as const).forEach((ax) => { for (let i = 0; i < vec[ax]; i++) out.push({ axis: ax, responseTimeMs: 1200, question_id: `q${++n}` }); });
  return out;
};
// Ficha desde una secuencia ORDENADA (para ejercitar tormenta/contingencia con desvío real).
const orderedFrom = (seq: Axis[]) => seq.map((ax, i) => ({ axis: ax, responseTimeMs: 1000, question_id: `q${i + 1}` }));

const GAMES = { impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never, rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never };

// ── Vectores que cubren los 12 nombres + registros ────────────────────────────
const ROTUNDO: { label: string; vec: Vec }[] = [
  { label: 'D rotundo', vec: { D: 10, I: 1, S: 1, C: 0 } },
  { label: 'I rotundo', vec: { D: 1, I: 10, S: 1, C: 0 } },
  { label: 'S rotundo', vec: { D: 0, I: 1, S: 10, C: 1 } },
  { label: 'C rotundo', vec: { D: 1, I: 1, S: 0, C: 10 } },
];
const BLENDS: { label: string; vec: Vec }[] = [ // vetas NO opuestas (D↔S, I↔C prohibidas)
  { label: 'D con veta I', vec: { D: 7, I: 4, S: 1, C: 0 } },
  { label: 'D con veta C', vec: { D: 7, I: 1, S: 0, C: 4 } },
  { label: 'I con veta D', vec: { D: 4, I: 7, S: 1, C: 0 } },
  { label: 'I con veta S', vec: { D: 1, I: 7, S: 4, C: 0 } },
  { label: 'S con veta I', vec: { D: 0, I: 4, S: 7, C: 1 } },
  { label: 'S con veta C', vec: { D: 0, I: 1, S: 7, C: 4 } },
  { label: 'C con veta D', vec: { D: 4, I: 1, S: 0, C: 7 } },
  { label: 'C con veta S', vec: { D: 0, I: 1, S: 4, C: 7 } },
];
const OPPOSITE: { label: string; vec: Vec }[] = [ // veta diagonal opuesta => nombre primario PURO
  { label: 'D veta opuesta S', vec: { D: 7, I: 0, S: 5, C: 0 } },
  { label: 'S veta opuesta D', vec: { D: 5, I: 0, S: 7, C: 0 } },
  { label: 'I veta opuesta C', vec: { D: 0, I: 7, S: 0, C: 5 } },
  { label: 'C veta opuesta I', vec: { D: 0, I: 5, S: 0, C: 7 } },
];
const PAREJO: { label: string; vec: Vec }[] = [
  { label: 'D/I parejo', vec: { D: 6, I: 6, S: 0, C: 0 } },
  { label: 'S/C parejo', vec: { D: 0, I: 0, S: 6, C: 6 } },
  { label: 'D/C parejo', vec: { D: 6, I: 0, S: 0, C: 6 } },
];
// Secuencias con desvío robusto (posiciones 5-7 = adversidad) para la rama contingencia/tormenta de desvío.
const DESVIO: { label: string; seq: Axis[] }[] = [
  { label: 'D->C desvío', seq: ['D', 'D', 'D', 'D', 'C', 'C', 'C', 'D', 'D', 'I', 'D', 'D'] },
  { label: 'I->S desvío', seq: ['I', 'I', 'I', 'I', 'S', 'S', 'S', 'I', 'I', 'D', 'I', 'I'] },
  { label: 'S->C desvío', seq: ['S', 'S', 'S', 'S', 'C', 'C', 'C', 'S', 'S', 'I', 'S', 'S'] },
  { label: 'C->D desvío', seq: ['C', 'C', 'C', 'C', 'D', 'D', 'D', 'C', 'C', 'I', 'C', 'C'] },
];

const LANGS = ['es', 'en', 'pt'] as const;
const FRAMES: { deporte: string }[] = [{ deporte: 'Fútbol' } /* equipo */, { deporte: 'Tenis' } /* individual */];
const NOMBRE = 'Mateo';

type Case = { label: string; ficha: ReturnType<typeof resolveEvidenceFicha> };
function flatCases(edadMeses = 132): Case[] {
  return [...ROTUNDO, ...BLENDS, ...OPPOSITE, ...PAREJO].map(({ label, vec }) => ({
    label, ficha: resolveEvidenceFicha(answersFrom(vec) as never, { edadMeses, questionVersion: 'v4' }),
  }));
}
function desvioCases(edadMeses = 132): Case[] {
  return DESVIO.map(({ label, seq }) => ({
    label, ficha: resolveEvidenceFicha(orderedFrom(seq) as never, { edadMeses, questionVersion: 'v4' }),
  }));
}

// Corre AMBOS gates sobre un informe y devuelve los fallos (vacío = limpio).
function gateFailures(ficha: ReturnType<typeof resolveEvidenceFicha>, nombre: string, lang: 'es' | 'en' | 'pt', deporte: string, label: string): string[] {
  const report = buildReportV4(ficha, { nombre, frame: sportFrame(deporte), lang } as never);
  const fails: string[] = [];
  const seal = gateReportV4(report, ficha, nombre, lang);
  if (seal.status !== 'ready') fails.push(`[${lang}/${deporte}/${label}] gateReportV4(sello) => ${seal.status}: ${seal.reason}`);
  const qc = qualityGate(report, ficha, { nombre, lang });
  if (!qc.pass) fails.push(`[${lang}/${deporte}/${label}] qualityGate(canónico) => ${qc.reasons.map((r) => `${r.code}(${r.detail})`).join('; ')}`);
  return fails;
}

test('PISO: todo arquetipo × registro × idioma × marco pasa AMBOS gates (nunca sale un informe "mal")', () => {
  const failures: string[] = [];
  for (const lang of LANGS) {
    for (const { deporte } of FRAMES) {
      for (const c of [...flatCases(), ...desvioCases()]) {
        failures.push(...gateFailures(c.ficha, NOMBRE, lang, deporte, c.label));
      }
    }
  }
  assert.strictEqual(failures.length, 0, `El piso determinista trae ${failures.length} defecto(s) de guard/forma:\n  ${failures.join('\n  ')}`);
});

test('PISO: barrido de edad (motor age-fair) en los 4 rotundo pasa AMBOS gates', () => {
  const failures: string[] = [];
  for (const edadMeses of [108, 180]) {
    for (const lang of LANGS) {
      for (const { label, vec } of ROTUNDO) {
        const ficha = resolveEvidenceFicha(answersFrom(vec) as never, { edadMeses, questionVersion: 'v4', games: GAMES } as never);
        failures.push(...gateFailures(ficha, NOMBRE, lang, 'Fútbol', `${label} @${edadMeses}m`));
      }
    }
  }
  assert.strictEqual(failures.length, 0, `Motor age-fair trae defectos:\n  ${failures.join('\n  ')}`);
});

test('PISO: nombre compuesto con espacio ("Ana María") no retiene por nombre en ningún idioma', () => {
  const failures: string[] = [];
  for (const lang of LANGS) {
    const ficha = resolveEvidenceFicha(answersFrom({ D: 10, I: 1, S: 1, C: 0 }) as never, { edadMeses: 132, questionVersion: 'v4' });
    failures.push(...gateFailures(ficha, 'Ana María', lang, 'Fútbol', 'nombre con espacio'));
  }
  assert.strictEqual(failures.length, 0, `Un nombre con espacio no debería retener nada:\n  ${failures.join('\n  ')}`);
});

// ── Piece 2: clasificación de holds (data = humano, content = auto-recuperable) ──
test('holdClass: los defectos de ENTRADA son "data"; forma/guards son "content"', () => {
  for (const r of ['datos_insuficientes', 'nombre_invalido', 'axis_mismatch', 'empate_total', 'idioma'] as const) {
    assert.strictEqual(holdClass(r), 'data', `${r} debería ser data`);
    assert.ok(DATA_HOLD_REASONS.has(r));
  }
  for (const r of ['forma_corta', 'faltan_secciones', 'placeholder', 'literal_basura', 'guard_prohibido', 'guard_determinista', 'guard_voseo', 'guard_guion', 'veta_inconsistente', 'repeticion', 'procedencia_fallback'] as const) {
    assert.strictEqual(holdClass(r), 'content', `${r} debería ser content`);
  }
});
