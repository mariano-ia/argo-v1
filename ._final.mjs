import { chromium } from 'playwright';
const OUT = '/private/tmp/claude-501/-Users-marianonoceti-Desktop-Antigravity-Argo-Project/5c658bb0-3970-4e80-86f9-718300c17ab2/scratchpad';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1200, height: 1250 } });
const errs = [];
pg.on('pageerror', e => errs.push('PAGEERR: '+e.message));
pg.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await pg.goto('http://localhost:5173/dashboard/players?dev', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1000);
await pg.locator('text=Valentina López').first().click();
await pg.waitForTimeout(700);
await pg.screenshot({ path: OUT + '/final_dash.png', fullPage: false });
// Open the memory modal
const memBtn = pg.locator('button:has-text("Memory"), button:has-text("Memoria")').first();
if (await memBtn.count()) { await memBtn.click(); await pg.waitForTimeout(700); await pg.screenshot({ path: OUT + '/final_memory.png' }); }
const t = await pg.locator('body').innerText();
console.log('summary section present (should be false):', /consolidated summary|resumen consolidado|resumo consolidado/i.test(t));
console.log('episodes section present (should be true):', /recent episodes|episodios recientes|episódios recentes/i.test(t));
console.log('pageerrors:', errs.length ? errs.slice(0,6) : 'none');
await b.close();
