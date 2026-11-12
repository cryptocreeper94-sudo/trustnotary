/**
 * TrustNotary — Minimal Lume Runtime Primitive Bridge (Zero Business Logic)
 * DarkWave Studios LLC — Copyright 2026
 *
 * Exposes low-level Node 22 primitives (node:sqlite DatabaseSync WAL wrapper,
 * crypto digests, IANA timezone conversion, stream body reader, try/catch wrapper)
 * as plain functions callable from pure .lume modules.
 *
 * DDA 42-Doctrine alignment:
 *   [08] Temporal Determinism -> deterministic IANA America/Chicago epoch conversion
 *   [22] Continuity Layer     -> WAL-mode SQLite + atomic IMMEDIATE transactions
 *   [32] Integrity Layer      -> SHA-256 & HMAC-SHA256 primitives
 *   [35] Collapse Detection   -> attempt() turns exceptions into structured values
 */

import { DatabaseSync } from 'node:sqlite';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function attempt(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export async function attemptAsync(fn, fallback = null) {
  try {
    return await fn();
  } catch (err) {
    return fallback !== null ? fallback : { ok: false, error: String((err && err.message) || err) };
  }
}

export function tryJson(raw, fallback = null) {
  try {
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
}

export function put(obj, key, val) {
  obj[key] = val;
  return obj;
}

export function getProp(obj, key, fallback = null) {
  if (!obj || typeof obj !== 'object') return fallback;
  return key in obj && obj[key] !== undefined ? obj[key] : fallback;
}

export function nowMs() {
  return Date.now();
}

export function isoNow() {
  return new Date().toISOString();
}

export function isoOf(ms) {
  return new Date(Number(ms)).toISOString();
}

export function parseMs(isoStr) {
  const n = Date.parse(String(isoStr || ''));
  return Number.isFinite(n) ? n : 0;
}

export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

export function hmacHex(secret, label, value) {
  return createHmac('sha256', String(secret)).update(`${label}:${value}`).digest('hex');
}

export function safeEq(a, b) {
  const ab = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function randCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[randomInt(0, alphabet.length)];
  return out;
}

export function randPin(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) out += String(randomInt(0, 10));
  return out;
}

export function randId() {
  return randomBytes(12).toString('hex');
}

export function toBase64(strOrBuf) {
  return Buffer.isBuffer(strOrBuf)
    ? strOrBuf.toString('base64')
    : Buffer.from(String(strOrBuf), 'utf8').toString('base64');
}

export function fromBase64(b64) {
  return Buffer.from(String(b64 || ''), 'base64');
}

export function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Return YYYY-MM-DD in the given IANA timezone. */
export function tzDay(ms, tz = 'America/Chicago') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));
}

/** Return minute-of-day (0..1439) in the given IANA timezone. */
export function tzMinuteOfDay(ms, tz = 'America/Chicago') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return (hh === 24 ? 0 : hh) * 60 + mm;
}

/** Day of week 0 (Sun) .. 6 (Sat) for YYYY-MM-DD in civil calendar. */
export function civilDayOfWeek(dayStr) {
  const [y, m, d] = String(dayStr).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

/** Convert YYYY-MM-DD + minuteOfDay (0..1439) in IANA tz to exact UTC epoch ms (handles CST/CDT). */
export function tzSlotToEpoch(dayStr, minuteOfDay, tz = 'America/Chicago') {
  const hh = Math.floor(minuteOfDay / 60);
  const mm = minuteOfDay % 60;
  for (const offsetHours of [5, 6, 4, 7]) {
    const guess = Date.parse(`${dayStr}T00:00:00Z`) + ((hh + offsetHours) * 60 + mm) * 60000;
    if (tzDay(guess, tz) === dayStr && tzMinuteOfDay(guess, tz) === minuteOfDay) {
      return guess;
    }
  }
  return Date.parse(`${dayStr}T00:00:00Z`) + ((hh + 6) * 60 + mm) * 60000;
}

/** Human label like "Wed, Nov 11 · 2:30 PM CT". */
export function formatCentralSlot(ms, tz = 'America/Chicago') {
  return (
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ms)) + ' CT'
  );
}

/** Open WAL-mode SQLite database with atomic transaction helper. */
export function openSqlite(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;');
  return {
    exec(sql) {
      db.exec(sql);
    },
    all(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    get(sql, params = []) {
      return db.prepare(sql).get(...params) ?? null;
    },
    run(sql, params = []) {
      const r = db.prepare(sql).run(...params);
      return { changes: Number(r.changes || 0), lastId: Number(r.lastInsertRowid || 0) };
    },
    tx(fn) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const res = fn();
        db.exec('COMMIT');
        return { ok: true, value: res };
      } catch (err) {
        try {
          db.exec('ROLLBACK');
        } catch {}
        return { ok: false, error: String((err && err.message) || err) };
      }
    },
    close() {
      db.close();
    },
  };
}

/** Read HTTP request body up to maxBytes. */
export function readReqBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function parseQuery(rawUrl) {
  const u = new URL(String(rawUrl || '/'), 'http://localhost');
  const params = {};
  for (const [k, v] of u.searchParams.entries()) params[k] = v;
  return { pathname: u.pathname, query: params };
}

export function sendHttp(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
  return true;
}

export function formEncode(obj) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined && v !== null) sp.append(k, String(v));
  }
  return sp.toString();
}
