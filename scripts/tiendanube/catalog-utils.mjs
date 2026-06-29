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
  const namedEntities = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    aacute: "á",
    eacute: "é",
    iacute: "í",
    oacute: "ó",
    uacute: "ú",
    Aacute: "Á",
    Eacute: "É",
    Iacute: "Í",
    Oacute: "Ó",
    Uacute: "Ú",
    ntilde: "ñ",
    Ntilde: "Ñ",
    uuml: "ü",
    Uuml: "Ü",
    Egrave: "È",
    deg: "°",
    bull: "•",
    middot: "·",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    ndash: "–",
    mdash: "—",
    hellip: "…",
    reg: "®",
    copy: "©",
    trade: "™",
  };

  return String(value ?? "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (entity, token) => {
    if (token.startsWith("#x") || token.startsWith("#X")) {
      const codePoint = Number.parseInt(token.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    if (token.startsWith("#")) {
      const codePoint = Number.parseInt(token.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    return namedEntities[token] ?? entity;
  });
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
  const assignmentIndex = source.indexOf(assignmentName);
  if (assignmentIndex === -1) return null;

  let index = assignmentIndex + assignmentName.length;
  while (index < source.length && /\s/.test(source[index])) index += 1;
  if (source[index] !== "=") return null;

  index += 1;
  while (index < source.length && /\s/.test(source[index])) index += 1;

  const open = source[index];
  const close = open === "[" ? "]" : open === "{" ? "}" : null;
  if (!close) return null;

  const stack = [open];
  let quoted = null;
  let escaped = false;

  for (let scan = index + 1; scan < source.length; scan += 1) {
    const char = source[scan];

    if (quoted) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quoted) quoted = null;
      continue;
    }

    if (char === "\"" || char === "'") {
      quoted = char;
      continue;
    }

    if (char === "[" || char === "{") {
      stack.push(char);
      continue;
    }

    if (char === "]" || char === "}") {
      const last = stack[stack.length - 1];
      if ((last === "[" && char !== "]") || (last === "{" && char !== "}")) {
        return null;
      }

      stack.pop();
      if (stack.length === 0) {
        const payload = source.slice(index, scan + 1);
        try {
          return JSON.parse(payload);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}
