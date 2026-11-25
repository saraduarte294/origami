import 'dotenv/config';
import pg from 'pg';

const isPg = process.env.DB_TYPE === 'postgres';
let sqlite, pool;

if (isPg) {
  pool = new pg.Pool(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: String(process.env.DB_PASSWORD ?? ''),
        database: process.env.DB_NAME || 'origami',
      });
} else {
  const { default: Database } = await import('better-sqlite3');
  sqlite = new Database(process.env.SQLITE_FILE || './origami.db');
}

// Convierte "?" a "$1, $2..." para PostgreSQL
const toPg = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

export async function all(sql, params = []) {
  if (isPg) return (await pool.query(toPg(sql), params)).rows;
  return sqlite.prepare(sql).all(...params);
}

export async function get(sql, params = []) {
  return (await all(sql, params))[0];
}

export async function run(sql, params = []) {
  if (isPg) {
    const isInsert = /^\s*insert/i.test(sql);
    const hasReturning = /returning/i.test(sql);
    const finalSql = toPg(sql) + (isInsert && !hasReturning ? ' RETURNING id' : '');
    const r = await pool.query(finalSql, params);
    return { id: r.rows[0]?.id, changes: r.rowCount };
  }
  const r = sqlite.prepare(sql).run(...params);
  return { id: Number(r.lastInsertRowid), changes: r.changes };
}

export async function initDb() {
  const idType = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  
  await run(`CREATE TABLE IF NOT EXISTS origamis (
    id ${idType},
    nombre TEXT NOT NULL UNIQUE,
    categoria TEXT,
    dificultad TEXT,
    descripcion TEXT,
    materiales TEXT,
    generado_ia INTEGER DEFAULT 0,
    plegado TEXT
  )`);

  if (isPg) {
    await run('ALTER TABLE origamis ADD COLUMN IF NOT EXISTS plegado TEXT');
  } else if (!(await all('PRAGMA table_info(origamis)')).some((c) => c.name === 'plegado')) {
    await run('ALTER TABLE origamis ADD COLUMN plegado TEXT');
  }

  await run(`CREATE TABLE IF NOT EXISTS pasos (
    id ${idType},
    origami_id INTEGER NOT NULL REFERENCES origamis(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    titulo TEXT,
    instruccion TEXT NOT NULL
  )`);
}

export async function saveOrigami(o) {
  const { id } = await run(
    `INSERT INTO origamis (nombre, categoria, dificultad, descripcion, materiales, generado_ia, plegado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      o.nombre,
      o.categoria || 'Objetos',
      o.dificultad || 'Fácil',
      o.descripcion || '',
      o.materiales || '1 hoja de papel',
      o.generado_ia ? 1 : 0,
      o.plegado ? (typeof o.plegado === 'string' ? o.plegado : JSON.stringify(o.plegado)) : null,
    ]
  );

  if (Array.isArray(o.pasos)) {
    for (const [i, p] of o.pasos.entries()) {
      await run(
        `INSERT INTO pasos (origami_id, numero, titulo, instruccion) VALUES (?, ?, ?, ?)`,
        [id, p.numero || i + 1, p.titulo || `Paso ${i + 1}`, p.instruccion || '']
      );
    }
  }

  return id;
}
