#!/usr/bin/env node
// Migrate api/cheesecakes.json into the Firestore `cheesecakes` collection,
// and optionally bootstrap the admin allowlist.
//
// Usage:
//   FIREBASE_TOKEN=$(node scripts/print-access-token.mjs) \
//   node scripts/migrate-to-firestore.mjs [--admin-uid <uid>] [--dry-run]
//
// The token must be an OAuth2 access token for a project owner/editor
// (IAM-authenticated requests bypass security rules).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PROJECT = "cheesecake-d2a31";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const token = process.env.FIREBASE_TOKEN;
if (!token) { console.error("Set FIREBASE_TOKEN to an OAuth2 access token."); process.exit(1); }

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const adminUidIdx = args.indexOf("--admin-uid");
const adminUid = adminUidIdx >= 0 ? args[adminUidIdx + 1] : null;

const here = dirname(fileURLToPath(import.meta.url));
const json = JSON.parse(readFileSync(join(here, "..", "api", "cheesecakes.json"), "utf8"));

// ── JS value → Firestore REST value ─────────────────────────────
function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFields(v) } };
  throw new Error(`Unsupported value: ${v}`);
}
function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    fields[k] = toValue(v);
  }
  return fields;
}

async function setDoc(path, obj, overrides = {}) {
  if (dryRun) { console.log(`[dry-run] would write ${path}`); return; }
  const fields = { ...toFields(obj), ...overrides };
  const res = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

let count = 0;
for (const cake of json.cheesecakes) {
  // rating is always a double, even when whole (8 → 8.0)
  await setDoc(`cheesecakes/${cake.id}`, cake, { rating: { doubleValue: cake.rating } });
  count++;
  console.log(`✓ cheesecakes/${cake.id}  ${cake.name} (rank ${cake.rank})`);
}
console.log(`${count} cheesecakes written.`);

if (adminUid) {
  await setDoc(`admins/${adminUid}`, { addedAt: new Date().toISOString(), role: "owner" });
  console.log(`✓ admins/${adminUid}`);
}
