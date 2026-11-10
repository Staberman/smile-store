import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySource,
  DIRECT_SOURCE,
  isSourceCode,
  SOURCE_CODES,
} from "../../lib/traffic-source.mjs";

const OWN_HOSTS = ["smiletiendaimp.com.ar", "smiletienda.mitiendanube.com"];
const fromReferrer = (referrer) => classifySource({ referrer, ownHosts: OWN_HOSTS });
const fromSearch = (search, referrer = "") => classifySource({ search, referrer, ownHosts: OWN_HOSTS });

test("there are exactly the ten documented one-letter codes", () => {
  assert.deepEqual(Object.keys(SOURCE_CODES).sort(), ["A", "B", "D", "F", "G", "I", "M", "O", "S", "W"]);
  for (const code of Object.keys(SOURCE_CODES)) assert.equal(isSourceCode(code), true);
  for (const value of ["", "g", "GG", "X", "web", null, undefined, 1]) {
    assert.equal(isSourceCode(value), false, `value ${JSON.stringify(value)}`);
  }
  assert.equal(DIRECT_SOURCE, "D");
});

test("G: Google search referrers, in any country domain and the Android Google app", () => {
  for (const referrer of [
    "https://www.google.com/",
    "https://www.google.com.ar/",
    "https://google.es/",
    "https://www.google.co.uk/search?q=ray-ban",
    "android-app://com.google.android.googlequicksearchbox/https/www.google.com",
  ]) {
    assert.equal(fromReferrer(referrer), "G", referrer);
  }
});

test("S: srsltid, which Google adds to Shopping and product results, or utm_medium=shopping", () => {
  assert.equal(fromSearch("?srsltid=AfmBOoq123"), "S");
  // srsltid wins over the Google referrer the same click carries.
  assert.equal(fromSearch("?srsltid=AfmBOoq123", "https://www.google.com/"), "S");
  assert.equal(fromSearch("?utm_source=google&utm_medium=shopping"), "S");
  assert.equal(fromSearch("?utm_medium=Shopping"), "S");
});

test("M: the Google Business Profile link (utm_source or utm_campaign gbp) and Maps", () => {
  assert.equal(fromSearch("?utm_source=gbp&utm_medium=organic&utm_campaign=gbp"), "M");
  assert.equal(fromSearch("?utm_source=gbp"), "M");
  assert.equal(fromSearch("?utm_source=google&utm_medium=organic&utm_campaign=gbp"), "M");
  assert.equal(fromReferrer("https://maps.google.com/"), "M");
  assert.equal(fromReferrer("https://maps.google.com.ar/"), "M");
});

test("B: Bing and other search engines", () => {
  for (const referrer of [
    "https://www.bing.com/",
    "https://duckduckgo.com/",
    "https://ar.search.yahoo.com/",
    "https://www.ecosia.org/",
    "https://search.brave.com/",
  ]) {
    assert.equal(fromReferrer(referrer), "B", referrer);
  }
  assert.equal(fromSearch("?utm_source=bing&utm_medium=cpc"), "B");
});

test("A: AI assistants, by referrer or by the utm_source they add", () => {
  for (const referrer of [
    "https://chatgpt.com/",
    "https://chat.openai.com/",
    "https://www.perplexity.ai/",
    "https://gemini.google.com/",
    "https://copilot.microsoft.com/",
    "https://claude.ai/",
  ]) {
    assert.equal(fromReferrer(referrer), "A", referrer);
  }
  // ChatGPT tags the links it cites with utm_source=chatgpt.com.
  assert.equal(fromSearch("?utm_source=chatgpt.com"), "A");
  assert.equal(fromSearch("?utm_source=perplexity"), "A");
});

test("I: Instagram, by referrer or utm_source", () => {
  for (const referrer of ["https://www.instagram.com/", "https://instagram.com/", "https://l.instagram.com/"]) {
    assert.equal(fromReferrer(referrer), "I", referrer);
  }
  assert.equal(fromSearch("?utm_source=instagram&utm_medium=social&utm_campaign=bio"), "I");
  assert.equal(fromSearch("?utm_source=Instagram&utm_medium=social&utm_campaign=stories"), "I");
});

test("F: Facebook referrers", () => {
  for (const referrer of [
    "https://www.facebook.com/",
    "https://facebook.com/",
    "https://l.facebook.com/",
    "https://m.facebook.com/",
    "https://lm.facebook.com/",
  ]) {
    assert.equal(fromReferrer(referrer), "F", referrer);
  }
});

test("W: links shared over WhatsApp (utm_source=whatsapp)", () => {
  assert.equal(fromSearch("?utm_source=whatsapp"), "W");
  assert.equal(fromSearch("?utm_source=whatsapp&utm_medium=social&utm_campaign=estados"), "W");
});

test("D: no referrer, or a blank one", () => {
  assert.equal(classifySource(), "D");
  assert.equal(classifySource({}), "D");
  assert.equal(fromReferrer(""), "D");
  assert.equal(fromReferrer("   "), "D");
  assert.equal(fromSearch("?orden=precio"), "D");
});

test("O: referrers and utm_source values no rule names", () => {
  assert.equal(fromReferrer("https://www.mercadolibre.com.ar/"), "O");
  assert.equal(fromReferrer("https://google.example.com/"), "O");
  assert.equal(fromReferrer("https://notinstagram.com/"), "O");
  assert.equal(fromReferrer("not a url"), "O");
  assert.equal(fromSearch("?utm_source=newsletter&utm_medium=email"), "O");
  assert.equal(fromSearch("?utm_medium=email"), "O");
});

test("UTM parameters take precedence over srsltid and the referrer", () => {
  assert.equal(fromSearch("?utm_source=instagram&srsltid=abc", "https://www.google.com/"), "I");
  assert.equal(fromSearch("?utm_source=whatsapp", "https://www.facebook.com/"), "W");
  assert.equal(fromSearch("?utm_source=gbp&utm_medium=organic&utm_campaign=gbp", "https://www.google.com/"), "M");
  // An empty utm_source is not a tag.
  assert.equal(fromSearch("?utm_source=", "https://www.google.com/"), "G");
});

test("an own-domain referrer names no source: it counts as direct when the session has none", () => {
  assert.equal(fromReferrer("https://smiletiendaimp.com.ar/tienda/relojes"), "D");
  assert.equal(fromReferrer("https://www.smiletiendaimp.com.ar/"), "D");
  assert.equal(fromReferrer("https://smiletienda.mitiendanube.com/checkout/"), "D");
  assert.equal(
    classifySource({ referrer: "https://smile-store-abc.vercel.app/", ownHosts: ["smile-store-abc.vercel.app"] }),
    "D",
  );
});

test("a session is classified once: its previous code wins over anything the page shows", () => {
  const visit = (overrides) => classifySource({ ownHosts: OWN_HOSTS, previous: "I", ...overrides });
  assert.equal(visit({ referrer: "https://smiletiendaimp.com.ar/tienda" }), "I");
  assert.equal(visit({ referrer: "" }), "I");
  assert.equal(visit({ referrer: "https://www.google.com/" }), "I");
  assert.equal(visit({ search: "?utm_source=whatsapp" }), "I");
  assert.equal(visit({ search: "?srsltid=abc" }), "I");
});

test("an invalid previous code is ignored and the visit is classified again", () => {
  for (const previous of ["", "x", "GOOGLE", "{}", null, undefined]) {
    assert.equal(
      classifySource({ previous, referrer: "https://www.google.com/", ownHosts: OWN_HOSTS }),
      "G",
      `previous ${JSON.stringify(previous)}`,
    );
  }
});
