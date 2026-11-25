import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const transitions = {
  queued: new Set(['processing']),
  processing: new Set(['completed', 'failed']),
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    originalName: row.original_name,
    status: row.status,
    phase: row.phase,
    errorCode: row.error_code,
    sampleRate: row.sample_rate,
    channels: row.channels,
    originalBytes: row.original_bytes,
    outputBytes: row.output_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseCursor(cursor) {
  if (!cursor) return null;
  const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  if (!Number.isInteger(value.createdAt) || typeof value.id !== 'string') {
    throw new Error('Invalid cursor');
  }
  return value;
}

export function openJobStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
      phase TEXT,
      error_code TEXT,
      sample_rate INTEGER,
      channels INTEGER,
      original_bytes INTEGER,
      output_bytes INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT
  `);
  db.exec('CREATE INDEX IF NOT EXISTS jobs_order ON jobs(created_at DESC, id DESC)');

  return {
    create(job) {
      const createdAt = job.createdAt ?? Date.now();
      db.prepare(`
        INSERT INTO jobs (id, original_name, status, sample_rate, channels,
                          original_bytes, created_at, updated_at)
        VALUES (?, ?, 'queued', ?, ?, ?, ?, ?)
      `).run(job.id, job.originalName, job.sampleRate, job.channels,
        job.originalBytes, createdAt, createdAt);
      return this.get(job.id);
    },

    get(id) {
      return fromRow(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id));
    },

    listPage(cursor = null) {
      const after = parseCursor(cursor);
      const rows = after
        ? db.prepare(`
            SELECT * FROM jobs
            WHERE created_at < ? OR (created_at = ? AND id < ?)
            ORDER BY created_at DESC, id DESC LIMIT 21
          `).all(after.createdAt, after.createdAt, after.id)
        : db.prepare('SELECT * FROM jobs ORDER BY created_at DESC, id DESC LIMIT 21').all();
      const items = rows.slice(0, 20).map(fromRow);
      const last = items.at(-1);
      return {
        items,
        nextCursor: rows.length > 20
          ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString('base64url')
          : null,
      };
    },

    transition(id, expected, next, patch = {}) {
      if (!transitions[expected]?.has(next)) return false;
      const result = db.prepare(`
        UPDATE jobs SET status = ?, phase = ?, error_code = ?, output_bytes = ?, updated_at = ?
        WHERE id = ? AND status = ?
      `).run(next, patch.phase ?? null, patch.errorCode ?? null,
        patch.outputBytes ?? null, Date.now(), id, expected);
      return result.changes === 1;
    },

    setPhase(id, phase) {
      return db.prepare(`
        UPDATE jobs SET phase = ?, updated_at = ?
        WHERE id = ? AND status = 'processing'
      `).run(phase, Date.now(), id).changes === 1;
    },

    requeueInterrupted() {
      return db.prepare(`
        UPDATE jobs SET status = 'queued', phase = NULL, error_code = NULL, updated_at = ?
        WHERE status = 'processing'
      `).run(Date.now()).changes;
    },

    close() {
      db.close();
    },
  };
}
