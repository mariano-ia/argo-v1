// scripts/enum-bandas.mjs
// EXACT enumeration of the 455 compositions of 12 votes over 4 axes (multinomial(12, 1/4)).
// Reproduces the null masses in docs/METODO-CALCULO-NUEVO.md §7. NOT Monte Carlo.
// Usage: `node scripts/enum-bandas.mjs`         -> prints the masses (JSON)
//        `node scripts/enum-bandas.mjs --check`  -> asserts vs the spec (exit 1 on drift)
// Kept in sync (independently) with src/lib/nullDistribution.ts via qa:unit.
import assert from 'node:assert';

const N = 12;
const P = Math.pow(0.25, 12);
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const pct = (x) => +(x * 100).toFixed(2);

let comps = 0;
const mB = {};
const mB2 = {};
let gateAdopted = 0, gateTop7 = 0, gateOld = 0;
let pB1 = 0, b2ge4_B1 = 0, b2le1_B1 = 0, b2_23_B1 = 0, blendNamed = 0, oppMonitor = 0;

for (let a = 0; a <= N; a++)
  for (let b = 0; b <= N - a; b++)
    for (let c = 0; c <= N - a - b; c++) {
      const d = N - a - b - c;
      if (d < 0) continue;
      comps++;
      const s = [a, b, c, d].sort((x, y) => y - x);
      const p = (fact(N) / (fact(a) * fact(b) * fact(c) * fact(d))) * P;
      const top = s[0], B = s[0] - s[1], B2 = s[1] - s[2];
      mB[B] = (mB[B] || 0) + p;
      mB2[B2] = (mB2[B2] || 0) + p;
      const named = B >= 4 || (B >= 2 && top >= 7);
      if (named) gateAdopted += p;
      if (B >= 2 && top >= 7) gateTop7 += p;
      if (B >= 2 && top >= 6) gateOld += p;
      if (B >= 1) {
        pB1 += p;
        if (B2 >= 4) { b2ge4_B1 += p; oppMonitor += p / 3; }
        if (B2 <= 1) b2le1_B1 += p;
        if (B2 >= 2 && B2 <= 3) b2_23_B1 += p;
      }
      if (B2 >= 4 && named) blendNamed += p;
    }

const sum = (o, pred) => Object.entries(o).reduce((t, [k, v]) => (pred(+k) ? t + v : t), 0);
const out = {
  comps,
  P_B: {
    eq0: pct(mB[0]), eq1: pct(mB[1]), eq2: pct(mB[2]), eq3: pct(mB[3]), eq4: pct(mB[4]), eq5: pct(mB[5]),
    ge6: pct(sum(mB, (k) => k >= 6)), ge2: pct(sum(mB, (k) => k >= 2)),
    ge4: pct(sum(mB, (k) => k >= 4)), ge5: pct(sum(mB, (k) => k >= 5)),
  },
  nameGate: { adopted: pct(gateAdopted), component_top7: pct(gateTop7), old_top6: pct(gateOld) },
  P_B2_marginal: {
    le1: pct(sum(mB2, (k) => k <= 1)), range2to3: pct(sum(mB2, (k) => k >= 2 && k <= 3)), ge4: pct(sum(mB2, (k) => k >= 4)),
  },
  P_B2_condB1: { le1: pct(b2le1_B1 / pB1), range2to3: pct(b2_23_B1 / pB1), ge4: pct(b2ge4_B1 / pB1), pB1: pct(pB1) },
  blend: { blendNamed: +(blendNamed * 100).toFixed(3), oppositeMonitorJoint: +(oppMonitor * 100).toFixed(3) },
};
console.log(JSON.stringify(out, null, 2));

if (process.argv.includes('--check')) {
  assert.strictEqual(out.comps, 455, '455 composiciones');
  assert.strictEqual(out.nameGate.adopted, 7.68, 'name-gate adoptado 7.68%');
  assert.strictEqual(out.nameGate.component_top7, 5.70, 'componente top>=7 5.70%');
  assert.strictEqual(out.nameGate.old_top6, 20.90, 'gate viejo top>=6 20.90%');
  assert.strictEqual(out.P_B.ge4, 7.06, 'P(B>=4) 7.06%');
  assert.strictEqual(out.P_B.ge5, 2.78, 'P(B>=5) 2.78%');
  assert.strictEqual(out.P_B.ge6, 0.79, 'P(B>=6) 0.79%');
  assert.strictEqual(out.P_B2_condB1.le1, 75.72, 'B2<=1|B>=1 75.72%');
  assert.strictEqual(out.P_B2_condB1.range2to3, 23.14, 'B2=2-3|B>=1 23.14%');
  assert.strictEqual(out.P_B2_condB1.ge4, 1.15, 'B2>=4|B>=1 1.15%');
  assert.strictEqual(out.blend.blendNamed, 0.092, 'blend nombrado 0.092%');
  assert.strictEqual(out.blend.oppositeMonitorJoint, 0.295, 'monitor opuestos 0.295%');
  console.log('\n✓ enum-bandas: las masas del nulo coinciden con el spec §7');
}
