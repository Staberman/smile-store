export function parseTiendanubePrice(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.round(parsed);
}

export function normalizeImageUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("http://")) return raw.replace(/^http:\/\//, "https://");
  if (raw.startsWith("https://")) return raw;

  return null;
}

export function stripBase64Images(html) {
  return String(html ?? "").replace(
    /<img\b[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi,
    "",
  );
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

export function htmlToText(html) {
  return decodeHtmlEntities(
    stripBase64Images(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|li|div|h[1-6])>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCategoryField(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { path: [], tags: [] };

  const [pathPart, ...tagParts] = raw.split(",");
  const path = pathPart
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
  const tags = tagParts.map((part) => part.trim()).filter(Boolean);

  return { path, tags };
}

export function extractAssignedJson(html, assignmentName) {
  const source = String(html ?? "");
  const escaped = assignmentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escaped}\\s*=\\s*([\\[{][\\s\\S]*?[\\]}])\\s*;`,
    "m",
  );
  const match = source.match(pattern);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
