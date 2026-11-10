import assert from "node:assert/strict";
import test from "node:test";
import {
  contactMessage,
  contactRefFromHref,
  GENERIC_REF,
  productRef,
  SERVER_CONTACT_MESSAGE,
  whatsAppContactUrl,
} from "../../lib/whatsapp-contact.mjs";

const STORE_CHAT = "https://wa.me/5493412613504";
const AVIATOR = { name: "Aviator Classic RB3025", ref: "329817846" };

test("a product's reference is its Tiendanube id", () => {
  assert.equal(productRef(329817846), "329817846");
  assert.equal(productRef("329817846"), "329817846");
  for (const id of [null, undefined, "", 0, -5, 1.5, "abc", "0123", "12 34", Number.NaN, {}]) {
    assert.equal(productRef(id), null, `id ${JSON.stringify(id)}`);
  }
});

test("on a product page the message names the product and ends with SRC-productRef", () => {
  assert.equal(
    contactMessage({ source: "G", product: AVIATOR }),
    "Hola! Te escribo desde la web por el Aviator Classic RB3025. (Ref G-329817846)",
  );
});

test("elsewhere the message is about the store and ends with SRC-WEB", () => {
  assert.equal(GENERIC_REF, "WEB");
  assert.equal(contactMessage({ source: "I" }), "Hola! Te escribo desde la web de Smile. (Ref I-WEB)");
  assert.equal(contactMessage({ source: "I", product: null }), "Hola! Te escribo desde la web de Smile. (Ref I-WEB)");
});

test("an unknown source is written as D and a missing product reference as WEB", () => {
  assert.equal(contactMessage({ source: null, product: AVIATOR }).endsWith("(Ref D-329817846)"), true);
  assert.equal(contactMessage({ source: "x" }).endsWith("(Ref D-WEB)"), true);
  assert.equal(contactMessage().endsWith("(Ref D-WEB)"), true);
  assert.equal(
    contactMessage({ source: "S", product: { name: "Aviator", ref: null } }),
    "Hola! Te escribo desde la web por el Aviator. (Ref S-WEB)",
  );
  // A product without a usable name falls back to the store message.
  assert.equal(
    contactMessage({ source: "S", product: { name: "  ", ref: "329817846" } }),
    "Hola! Te escribo desde la web de Smile. (Ref S-329817846)",
  );
});

test("the product name is written on one line", () => {
  assert.equal(
    contactMessage({ source: "G", product: { name: "  Wayfarer\n Liteforce   4195 ", ref: "1" } }),
    "Hola! Te escribo desde la web por el Wayfarer Liteforce 4195. (Ref G-1)",
  );
});

test("the server-rendered message is the generic one with Ref D-WEB", () => {
  assert.equal(SERVER_CONTACT_MESSAGE, "Hola! Te escribo desde la web de Smile. (Ref D-WEB)");
});

test("the wa.me link carries the message URL-encoded in ?text=", () => {
  const message = contactMessage({ source: "A", product: { name: "Dolce&Gabbana DG005 #2 50%", ref: "300000001" } });
  const url = whatsAppContactUrl(STORE_CHAT, message);
  assert.equal(
    url,
    "https://wa.me/5493412613504?text=Hola!%20Te%20escribo%20desde%20la%20web%20por%20el%20Dolce%26Gabbana%20DG005%20%232%2050%25.%20(Ref%20A-300000001)",
  );
  // The text survives the round trip whole: "&", "#" and "%" do not cut it.
  assert.equal(new URL(url).searchParams.get("text"), message);
  assert.equal(new URL(url).hash, "");
  assert.equal(
    whatsAppContactUrl(STORE_CHAT, SERVER_CONTACT_MESSAGE),
    "https://wa.me/5493412613504?text=Hola!%20Te%20escribo%20desde%20la%20web%20de%20Smile.%20(Ref%20D-WEB)",
  );
});

test("a contact link's reference is read back from its message", () => {
  const link = (source, product) => whatsAppContactUrl(STORE_CHAT, contactMessage({ source, product }));
  assert.deepEqual(contactRefFromHref(link("G", AVIATOR)), { source: "G", productRef: "329817846" });
  assert.deepEqual(contactRefFromHref(link("W")), { source: "W", productRef: null });
  assert.deepEqual(contactRefFromHref(whatsAppContactUrl(STORE_CHAT, SERVER_CONTACT_MESSAGE)), {
    source: "D",
    productRef: null,
  });
});

test("only a reference at the end of the message counts", () => {
  // A product name cannot fake the code: the real one closes the message.
  const tricky = contactMessage({ source: "F", product: { name: "Aviator (Ref G-1)", ref: "329817846" } });
  assert.deepEqual(contactRefFromHref(whatsAppContactUrl(STORE_CHAT, tricky)), { source: "F", productRef: "329817846" });

  for (const href of [
    STORE_CHAT,
    `${STORE_CHAT}?text=Hola`,
    `${STORE_CHAT}?text=${encodeURIComponent("(Ref G-123) y algo más")}`,
    `${STORE_CHAT}?text=${encodeURIComponent("(Ref X-123)")}`,
    `${STORE_CHAT}?text=${encodeURIComponent("(Ref g-123)")}`,
    `${STORE_CHAT}?text=${encodeURIComponent("(Ref G-abc)")}`,
    "not a url",
    "",
  ]) {
    assert.equal(contactRefFromHref(href), null, `href ${JSON.stringify(href)}`);
  }
});
