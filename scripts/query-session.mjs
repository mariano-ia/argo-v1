import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(url, key);

const { data, error } = await sb
  .from('sessions')
  .select('id, child_name, adult_email, eje, motor, eje_secundario, archetype_label, answers, created_at, deleted_at')
  .eq('adult_email', 'isabella.moglia.lopez@colegioandersen.org')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) { console.error('Error:', error.message); process.exit(1); }
if (data.length === 0) { console.log('No sessions found'); process.exit(0); }

const ARQUETIPOS = {
  'D-Rápido': 'Impulsor Dinámico',
  'D-Medio': 'Impulsor Decidido',
  'D-Lento': 'Impulsor Persistente',
  'I-Rápido': 'Conector Dinámico',
  'I-Medio': 'Conector Decidido',
  'I-Lento': 'Conector Persistente',
  'S-Rápido': 'Sostenedor Dinámico',
  'S-Medio': 'Sostenedor Decidido',
  'S-Lento': 'Sostenedor Persistente',
  'C-Rápido': 'Estratega Dinámico',
  'C-Medio': 'Estratega Decidido',
  'C-Lento': 'Estratega Persistente',
};

for (const s of data) {
  const axes = { D: 0, I: 0, S: 0, C: 0 };
  let totalMs = 0;
  for (const a of (s.answers || [])) {
    axes[a.axis]++;
    totalMs += a.responseTimeMs;
  }
  const n = s.answers?.length || 1;
  const avgMs = Math.round(totalMs / n);

  const sorted = Object.entries(axes).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const second = sorted[1];
  const diff = top[1] - second[1];

  console.log('═══════════════════════════════════════');
  console.log(`Child: ${s.child_name} | ${s.created_at}`);
  console.log(`Result: ${s.archetype_label} (eje=${s.eje}, motor=${s.motor}, sec=${s.eje_secundario})`);
  console.log(`Axes: D=${axes.D} I=${axes.I} S=${axes.S} C=${axes.C}`);
  console.log(`Ranking: ${sorted.map(([k, v]) => `${k}=${v}`).join(' > ')}`);
  console.log(`Diff top-2nd: ${diff} | AvgMs: ${avgMs}ms`);

  // What-if: if eje were the second-highest
  const altEje = second[0];
  const altArch = ARQUETIPOS[`${altEje}-${s.motor}`];
  console.log(`\nAlternative (2nd eje=${altEje}): ${altArch}`);

  // What-if: different motor
  let altMotor;
  if (avgMs < 5000) altMotor = 'Rápido';
  else if (avgMs > 12000) altMotor = 'Lento';
  else {
    // Show all 3 possibilities
    console.log(`Motor zone: Medio range (${avgMs}ms)`);
    console.log(`  If Rápido: ${ARQUETIPOS[`${s.eje}-Rápido`]}`);
    console.log(`  If Medio:  ${ARQUETIPOS[`${s.eje}-Medio`]}`);
    console.log(`  If Lento:  ${ARQUETIPOS[`${s.eje}-Lento`]}`);
  }

  if (diff <= 1) {
    console.log(`\n⚠ Near-tie (diff=${diff}) — tiebreaker was likely applied`);
  }
  console.log('');
}
