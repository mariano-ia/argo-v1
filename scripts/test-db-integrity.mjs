import { createClient } from '@supabase/supabase-js';
const sb = createClient(
  'https://luutdozbhinfiogugjbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dXRkb3piaGluZmlvZ3VnamJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE1NDYyMSwiZXhwIjoyMDg4NzMwNjIxfQ.nDv9zZuAIEfeUqCdVySlUgnbAnJD3TBiCEuyS9IHLm4'
);

const { count: total } = await sb.from('sessions').select('*', { count: 'exact', head: true });
const { count: active } = await sb.from('sessions').select('*', { count: 'exact', head: true }).is('deleted_at', null);
const { count: visible } = await sb.from('sessions').select('*', { count: 'exact', head: true })
    .is('deleted_at', null).not('eje', 'eq', '_pending');
const { count: pending } = await sb.from('sessions').select('*', { count: 'exact', head: true })
    .eq('eje', '_pending');

const { data: pipe } = await sb.from('sessions').select('child_name, eje, motor, archetype_label')
    .ilike('child_name', '%pipe%').limit(1).single();

const { data: latest } = await sb.from('sessions').select('child_name, eje, motor, archetype_label')
    .is('deleted_at', null).not('eje', 'eq', '_pending')
    .order('created_at', { ascending: false }).limit(3);

console.log('=== DB Integrity Check ===');
console.log('Total sessions:', total);
console.log('Active (not deleted):', active);
console.log('Visible (not deleted, not pending):', visible);
console.log('Pending (_pending):', pending);
console.log('Pipe session:', JSON.stringify(pipe));
console.log('Latest 3 visible:');
for (const s of latest || []) {
    console.log(' ', s.child_name, '|', s.eje, s.motor, '|', s.archetype_label);
}

let ok = true;
function check(name, cond) {
    if (cond) console.log('OK:', name);
    else { console.error('FAIL:', name); ok = false; }
}

check('No pending sessions yet', pending === 0);
check('Active = visible (no pending to filter)', active === visible);
check('Pipe exists', pipe != null);
check('Pipe eje is I', pipe && pipe.eje === 'I');
check('Pipe is Conector Reflexivo', pipe && pipe.archetype_label === 'Conector Reflexivo');

if (!ok) process.exit(1);
console.log('\n=== ALL DB CHECKS PASSED ===');
