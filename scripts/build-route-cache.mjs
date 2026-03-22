#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input || "";
const apiKey = args.apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
const outCsvPath = args.output || path.resolve(process.cwd(), "route-cache.csv");
const outJsonPath = args.json || path.resolve(process.cwd(), "route-cache.json");
const delayMs = Number.isFinite(Number(args.delayMs)) ? Math.max(0, Number(args.delayMs)) : 120;
const defaultCountry = args.country || "TR";

if (!inputPath) {
  console.error("Missing --input <path>. Use schools JSON/CSV exported from scheduler.");
  process.exit(1);
}
if (!apiKey) {
  console.error("Missing API key. Pass --api-key or set GOOGLE_MAPS_API_KEY.");
  process.exit(1);
}

const startedAt = new Date().toISOString();
const schools = await loadSchools(inputPath, defaultCountry);
if (!schools.length) {
  console.error("No schools found in input.");
  process.exit(1);
}

console.log(`Loaded ${schools.length} school(s). Computing directed school-pair drive times...`);
const entries = await buildRouteCacheEntries(schools, apiKey, delayMs);

await writeCsv(outCsvPath, entries);
await writeJson(outJsonPath, {
  generatedAt: new Date().toISOString(),
  sourceInput: path.resolve(inputPath),
  routeCache: entries
});

const okCount = entries.filter((item) => item.status === "ok").length;
const errorCount = entries.length - okCount;
console.log(`Done. Generated ${entries.length} pairs (${okCount} ok, ${errorCount} unresolved).`);
console.log(`CSV:  ${outCsvPath}`);
console.log(`JSON: ${outJsonPath}`);
console.log(`Started: ${startedAt}`);

async function loadSchools(filePath, countryFallback) {
  const absolute = path.resolve(filePath);
  const ext = path.extname(absolute).toLowerCase();
  if (ext === ".json") {
    const payload = JSON.parse(await fs.readFile(absolute, "utf8"));
    return normalizeSchoolRows(extractSchoolRowsFromJson(payload), countryFallback);
  }
  if (ext === ".csv") {
    const rows = parseCsv(await fs.readFile(absolute, "utf8"));
    return normalizeSchoolRows(rowsToObjects(rows), countryFallback);
  }
  throw new Error("Unsupported input type. Use .json or .csv");
}

function extractSchoolRowsFromJson(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.schools)) {
      return payload.schools;
    }
  }
  return [];
}

function normalizeSchoolRows(rows, countryFallback) {
  const out = [];
  rows.forEach((row, index) => {
    const id = String(row.id || "").trim() || `school_${index + 1}`;
    const name = String(row.name || row.school || row.schoolName || "").trim();
    const district = String(row.district || "").trim();
    const addressLine = String(row.addressLine || row.address || row.adres || "").trim();
    const city = String(row.city || row.il || "").trim();
    const country = String(row.country || row.ulke || "").trim() || countryFallback;
    if (!name) {
      return;
    }
    out.push({ id, name, district, addressLine, city, country });
  });
  return out;
}

async function buildRouteCacheEntries(schools, key, delayMsValue) {
  const entries = [];
  for (let i = 0; i < schools.length; i += 1) {
    const origin = schools[i];
    const originQuery = schoolQuery(origin);
    const destinations = schools.filter((item) => item.id !== origin.id);

    const chunks = chunk(destinations, 25);
    for (let c = 0; c < chunks.length; c += 1) {
      const chunkItems = chunks[c];
      const destinationQueries = chunkItems.map((item) => schoolQuery(item));
      let batch = [];
      try {
        batch = await fetchDistanceMatrixBatch(originQuery, destinationQueries, key);
      } catch (_error) {
        batch = chunkItems.map(() => ({
          status: "error",
          durationMinutes: null,
          distanceKm: null
        }));
      }

      const fetchedAt = new Date().toISOString();
      for (let j = 0; j < chunkItems.length; j += 1) {
        const toSchool = chunkItems[j];
        const result = batch[j] || { status: "error", durationMinutes: null, distanceKm: null };
        entries.push({
          fromSchoolId: origin.id,
          fromSchoolName: origin.name,
          fromDistrict: origin.district,
          toSchoolId: toSchool.id,
          toSchoolName: toSchool.name,
          toDistrict: toSchool.district,
          durationMinutes: result.durationMinutes,
          distanceKm: result.distanceKm,
          status: result.status,
          fetchedAt,
          provider: "google"
        });
      }

      process.stdout.write(`\rOrigin ${i + 1}/${schools.length} | batch ${c + 1}/${chunks.length}        `);
      if (delayMsValue > 0) {
        await sleep(delayMsValue);
      }
    }
  }
  process.stdout.write("\n");
  return entries;
}

async function fetchDistanceMatrixBatch(origin, destinations, key) {
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destinations.join("|"));
  url.searchParams.set("mode", "driving");
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("traffic_model", "best_guess");
  url.searchParams.set("key", key);

  const response = await fetch(url.toString());
  const payload = await response.json();
  if (!response.ok || payload.status !== "OK") {
    throw new Error(payload?.error_message || payload?.status || "Distance Matrix request failed");
  }

  const elements = payload.rows?.[0]?.elements || [];
  return elements.map((element) => {
    if (!element || element.status !== "OK") {
      return { status: "not_found", durationMinutes: null, distanceKm: null };
    }
    const durationSec = Number(element.duration_in_traffic?.value ?? element.duration?.value ?? NaN);
    const distanceMeters = Number(element.distance?.value ?? NaN);
    return {
      status: Number.isFinite(durationSec) ? "ok" : "error",
      durationMinutes: Number.isFinite(durationSec) ? Math.max(1, Math.round(durationSec / 60)) : null,
      distanceKm: Number.isFinite(distanceMeters) ? Math.round((distanceMeters / 1000) * 10) / 10 : null
    };
  });
}

function schoolQuery(school) {
  const parts = [
    String(school.addressLine || "").trim(),
    String(school.name || "").trim(),
    String(school.district || "").trim(),
    String(school.city || "").trim(),
    String(school.country || "").trim()
  ].filter(Boolean);
  return parts.join(", ");
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeCsv(outputPath, entries) {
  const header = [
    "fromSchoolId",
    "fromSchoolName",
    "fromDistrict",
    "toSchoolId",
    "toSchoolName",
    "toDistrict",
    "durationMinutes",
    "distanceKm",
    "status",
    "fetchedAt",
    "provider"
  ];
  const lines = [header.join(",")]
    .concat(entries.map((item) => header.map((key) => csvEscape(item[key])).join(",")));
  await fs.writeFile(path.resolve(outputPath), lines.join("\n"), "utf8");
}

async function writeJson(outputPath, value) {
  await fs.writeFile(path.resolve(outputPath), JSON.stringify(value, null, 2), "utf8");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/["\n,]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseCsvLine(line));
}

function parseCsvLine(line) {
  const parts = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((item) => item.trim());
}

function rowsToObjects(rows) {
  if (!rows.length) {
    return [];
  }
  const header = rows[0].map((item) => String(item || "").trim());
  return rows.slice(1).map((row) => {
    const out = {};
    header.forEach((key, idx) => {
      out[key] = row[idx];
    });
    return out;
  });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) {
      continue;
    }
    const key = part.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}
