import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const dbFile = process.env.SQLITE_FILE || path.resolve(process.cwd(), 'server', 'db.sqlite');

let SQL;
let db;

// In ESM `require` is not available. Locate the wasm file inside node_modules/sql.js/dist.
const locateFile = (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);

const ensureDir = (f) => {
  try { fs.mkdirSync(path.dirname(f), { recursive: true }); } catch (e) {}
};

const init = async () => {
  if (db) return;
  SQL = await initSqlJs({ locateFile });
  ensureDir(dbFile);
  try {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } catch (e) {
    db = new SQL.Database();
  }
};

const query = async (sql, params = []) => {
  await init();
  const trimmed = sql.trim().toLowerCase();

  // Use prepared statements for parameter binding
  const stmt = db.prepare(sql);
  try {
    if (params && params.length) stmt.bind(params);

    if (trimmed.startsWith('select') || trimmed.startsWith('pragma') || trimmed.startsWith('with')) {
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return { rows };
    } else {
      // run statement
      stmt.step();
      // persist DB
      const data = db.export();
      fs.writeFileSync(dbFile, Buffer.from(data));
      return { rows: [], info: {} };
    }
  } finally {
    try { stmt.free(); } catch (e) {}
  }
};

const end = async () => {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(dbFile, Buffer.from(data));
  } catch (e) {}
  try { db.close(); } catch (e) {}
  db = null;
};

export default {
  query,
  end,
  client: 'sqljs',
};
