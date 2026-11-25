import { initDb, run, saveOrigami } from './db.js';
import { origamis } from './data.js';

await initDb();
// Reemplaza los origamis base (conserva los generados con IA)
await run('DELETE FROM pasos WHERE origami_id IN (SELECT id FROM origamis WHERE generado_ia = 0)');
await run('DELETE FROM origamis WHERE generado_ia = 0');
for (const o of origamis) await saveOrigami(o);
console.log('Base de datos lista con', origamis.length, 'origamis');
process.exit(0);
