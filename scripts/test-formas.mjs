// scripts/test-formas.mjs
// Verifies the 7-form cascade (spec §6) partitions the 455 compositions: each form has its exact
// comp count, masses sum to 100.00%, and no form spans two confidence bands. Exit 1 on failure.
import assert from 'node:assert';

const N = 12;
const P = Math.pow(0.25, 12);
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

// Cascade — MUST match classifyForma in src/lib/nullDistribution.ts (both are checked against §6).
function classifyForma(s) {
  const top = s[0], second = s[1], B = top - second;
  const nF = s.filter((x) => x >= top - 1).length;
  if (B === 0) return nF === 2 ? 'duo_empate' : 'equilibrio';
  if (B === 1) return second >= 4 ? 'duo' : 'versatil';
  if (B <= 3) return 'lider_acompanante';
  if (B <= 5) return 'definido';
  return 'muy_definido';
}
const banda = (B) => (B >= 4 ? 'definido' : B >= 2 ? 'con_matices' : 'mezcla');

const expected = {
  duo_empate: [30, 9.85], equilibrio: [17, 12.94], duo: [72, 16.65], versatil: [12, 19.83],
  lider_acompanante: [132, 33.67], definido: [88, 6.27], muy_definido: [104, 0.79],
};

const stat = {};
const formBands = {};
let comps = 0, totalMass = 0;
for (let a = 0; a <= N; a++)
  for (let b = 0; b <= N - a; b++)
    for (let c = 0; c <= N - a - b; c++) {
      const d = N - a - b - c;
      if (d < 0) continue;
      comps++;
      const s = [a, b, c, d].sort((x, y) => y - x);
      const p = (fact(N) / (fact(a) * fact(b) * fact(c) * fact(d))) * P;
      const f = classifyForma(s);
      stat[f] = stat[f] || { comps: 0, mass: 0 };
      stat[f].comps++; stat[f].mass += p; totalMass += p;
      (formBands[f] = formBands[f] || new Set()).add(banda(s[0] - s[1]));
    }

console.log('forma              comps    masa%   banda');
for (const [f, { comps: c, mass: m }] of Object.entries(stat))
  console.log(f.padEnd(18), String(c).padStart(4), (m * 100).toFixed(2).padStart(8), [...formBands[f]].join(','));

assert.strictEqual(comps, 455, '455 composiciones');
assert.strictEqual(+(totalMass * 100).toFixed(2), 100.0, 'masas suman 100.00%');
for (const [f, [ec, em]] of Object.entries(expected)) {
  assert.ok(stat[f] && stat[f].comps >= 1, `${f} tiene >=1 composicion`);
  assert.strictEqual(stat[f].comps, ec, `${f} comps == ${ec}`);
  assert.strictEqual(+(stat[f].mass * 100).toFixed(2), em, `${f} masa == ${em}%`);
}
// Ninguna forma cruza dos bandas (definido y muy_definido viven ambas, por separado, en 'definido').
for (const [f, bands] of Object.entries(formBands))
  assert.strictEqual(bands.size, 1, `${f} vive en una sola banda (${[...bands]})`);
console.log('\n✓ test-formas: la cascada de 7 formas particiona las 455 (100.00%), ninguna cruza banda');
