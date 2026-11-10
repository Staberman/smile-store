import assert from "node:assert/strict";
import test from "node:test";
import { buyEvent, opensLink, whatsAppEvent } from "../../lib/visitor-events.mjs";
import { contactMessage, whatsAppContactUrl } from "../../lib/whatsapp-contact.mjs";

const STORE_CHAT = "https://wa.me/5493412613504";
const AVIATOR = { name: "Aviator Classic RB3025", ref: "329817846" };
// A contact link as WhatsAppContactLink renders it once hydrated.
const contactLink = (source, product = null) =>
  whatsAppContactUrl(STORE_CHAT, contactMessage({ source, product }));
// The page segments of a contact event: the path between /eventos/whatsapp
// and the trailing source and product segments.
const pageOf = (pathname) =>
  whatsAppEvent(contactLink("G"), pathname)?.path.replace(/\/G\/web$/, "");

test("starting a purchase records the product and the traffic source under /eventos/comprar", () => {
  assert.deepEqual(buyEvent("ray-ban-aviator-classic-rb3025-2mx8q", "S"), {
    route: "/eventos/comprar/[slug]",
    path: "/eventos/comprar/ray-ban-aviator-classic-rb3025-2mx8q/S",
  });
  assert.equal(buyEvent("aviator-2mx8q", "I").path, "/eventos/comprar/aviator-2mx8q/I");
});

test("a purchase with an unknown source is recorded as D", () => {
  for (const source of [undefined, null, "", "x", "GG", "web"]) {
    assert.equal(buyEvent("aviator-2mx8q", source).path, "/eventos/comprar/aviator-2mx8q/D", `source ${JSON.stringify(source)}`);
  }
});

test("a slug that is not route-shaped is recorded as _otro", () => {
  for (const slug of ["", "Ray-Ban", "ray ban", "ray%20ban", "a/b", "-ray", "ray--ban", "x".repeat(81), undefined]) {
    assert.equal(buyEvent(slug, "G").path, "/eventos/comprar/_otro/G", `slug ${JSON.stringify(slug)}`);
  }
});

test("a contact records the page, then the source and product of the Ref its message carries", () => {
  assert.deepEqual(whatsAppEvent(contactLink("G", AVIATOR), "/tienda/productos/aviator-2mx8q", "I"), {
    route: "/eventos/whatsapp",
    path: "/eventos/whatsapp/tienda/productos/aviator-2mx8q/G/329817846",
  });
  assert.deepEqual(whatsAppEvent(contactLink("M"), "/contacto", "M"), {
    route: "/eventos/whatsapp",
    path: "/eventos/whatsapp/contacto/M/web",
  });
  // The server-rendered link (before hydration, or without JavaScript).
  assert.equal(whatsAppEvent(contactLink("D"), "/", "G").path, "/eventos/whatsapp/home/D/web");
});

test("a contact whose message carries no Ref records the session source and web", () => {
  const links = [
    STORE_CHAT,
    `${STORE_CHAT}?text=${encodeURIComponent("Hola Smile, estoy interesado/a en Aviator.")}`,
    `${STORE_CHAT}#chat`,
  ];
  for (const href of links) {
    assert.deepEqual(whatsAppEvent(href, "/contacto", "W"), {
      route: "/eventos/whatsapp",
      path: "/eventos/whatsapp/contacto/W/web",
    });
    assert.equal(whatsAppEvent(href, "/contacto").path, "/eventos/whatsapp/contacto/D/web");
  }
});

test("every new path starts with the path the same click recorded before", () => {
  // Paths recorded before the source and product segments were added.
  assert.equal(
    buyEvent("aviator-2mx8q", "G").path.startsWith("/eventos/comprar/aviator-2mx8q/"),
    true,
  );
  const contact = whatsAppEvent(contactLink("S", AVIATOR), "/tienda/productos/aviator-2mx8q", "S").path;
  assert.equal(contact.startsWith("/eventos/whatsapp/tienda/productos/aviator-2mx8q/"), true);
  const generic = whatsAppEvent(contactLink("I"), "/contacto", "I").path;
  assert.equal(generic.startsWith("/eventos/whatsapp/contacto/"), true);
  // A share keeps its old path exactly.
  assert.equal(whatsAppEvent("https://wa.me/?text=Aviator", "/contacto", "G").path, "/eventos/compartir/contacto");
});

test("the source segment is the only single upper-case letter, so old and new paths read apart", () => {
  const contact = whatsAppEvent(contactLink("A", AVIATOR), "/tienda/marcas/premium/balenciaga", "A").path;
  const segments = contact.split("/");
  assert.equal(segments.at(-2), "A");
  assert.equal(segments.at(-1), "329817846");
  assert.deepEqual(segments.slice(0, -2).filter((segment) => /^[A-Z]$/.test(segment)), []);
  assert.equal(buyEvent("aviator-2mx8q", "B").path.split("/").at(-1), "B");
});

test("a wa.me link without a phone number is recorded as a share under /eventos/compartir", () => {
  const productPage = "/tienda/productos/aviator-2mx8q";
  const links = [
    `https://wa.me/?text=${encodeURIComponent("Aviator https://smiletiendaimp.com.ar/tienda/productos/aviator-2mx8q")}`,
    "https://wa.me/",
    "https://wa.me/#compartir",
  ];
  for (const href of links) {
    const event = whatsAppEvent(href, productPage, "G");
    assert.deepEqual(event, {
      route: "/eventos/compartir",
      path: "/eventos/compartir/tienda/productos/aviator-2mx8q",
    });
    assert.doesNotMatch(event.path, /^\/eventos\/whatsapp/);
  }
});

test("a share names its page with the same scheme as a contact", () => {
  const share = (pathname) => whatsAppEvent("https://wa.me/?text=Aviator", pathname)?.path;
  assert.equal(share("/"), "/eventos/compartir/home");
  assert.equal(share("/tienda/relojes/?orden=precio#top"), "/eventos/compartir/tienda/relojes");
  assert.equal(share("/Tienda/productos/ray%20ban"), "/eventos/compartir/_otro");
});

test("links that are neither a contact nor a share record nothing", () => {
  const links = [
    "https://instagram.com/smile",
    "mailto:hola@smiletiendaimp.com.ar",
    "/contacto",
    "http://wa.me/5493412613504",
    "https://api.whatsapp.com/send?phone=5493412613504",
    "https://wa.me.example.com/5493412613504",
    "https://wa.me/message/ABCDEF123",
    "https://wa.me/5493412613504/extra",
    "",
    undefined,
  ];
  for (const href of links) {
    assert.equal(whatsAppEvent(href, "/contacto"), null, `href ${JSON.stringify(href)}`);
  }
});

test("the WhatsApp event keeps neither the phone number nor the message", () => {
  const contact = whatsAppEvent(contactLink("G", AVIATOR), "/tienda/productos/aviator-2mx8q", "G");
  assert.equal(contact.path, "/eventos/whatsapp/tienda/productos/aviator-2mx8q/G/329817846");
  assert.doesNotMatch(contact.path, /5493412613504|Hola|text|Ref|Aviator Classic/);

  const share = whatsAppEvent("https://wa.me/?text=Mir%C3%A1%20esto", "/contacto");
  assert.equal(share.path, "/eventos/compartir/contacto");
  assert.doesNotMatch(share.path, /Mir|text/);
});

test("the WhatsApp event names the page the click happened on", () => {
  assert.equal(pageOf("/"), "/eventos/whatsapp/home");
  assert.equal(pageOf("/contacto"), "/eventos/whatsapp/contacto");
  assert.equal(pageOf("/tienda/productos/aviator-2mx8q"), "/eventos/whatsapp/tienda/productos/aviator-2mx8q");
  assert.equal(pageOf("/tienda/marcas/premium/balenciaga"), "/eventos/whatsapp/tienda/marcas/premium/balenciaga");
});

test("the page path drops its query string, fragment and extra slashes", () => {
  assert.equal(pageOf("/contacto/"), "/eventos/whatsapp/contacto");
  assert.equal(pageOf("//tienda//relojes///"), "/eventos/whatsapp/tienda/relojes");
  assert.equal(pageOf("/tienda/relojes?orden=precio&email=a@b.com#top"), "/eventos/whatsapp/tienda/relojes");
  assert.equal(pageOf("/?utm_source=instagram"), "/eventos/whatsapp/home");
  assert.equal(pageOf("/#faq"), "/eventos/whatsapp/home");
});

test("a page path that is too deep or not route-shaped is recorded as _otro", () => {
  const paths = [
    "/a/b/c/d/e",
    "/Contacto",
    "/tienda/productos/ray%20ban",
    "/tienda/productos/año",
    `/tienda/${"x".repeat(81)}`,
    "/tienda/productos/hola smile",
    undefined,
  ];
  for (const pathname of paths) {
    assert.equal(pageOf(pathname), "/eventos/whatsapp/_otro", `pathname ${JSON.stringify(pathname)}`);
  }
});

test("only a primary click or a middle click opens a link", () => {
  assert.equal(opensLink("click", 0), true);
  assert.equal(opensLink("auxclick", 1), true);
  // One opening fires one of the two, so neither counts the other's button.
  assert.equal(opensLink("click", 1), false);
  assert.equal(opensLink("auxclick", 0), false);
  // A right click opens the context menu, not the link.
  assert.equal(opensLink("auxclick", 2), false);
  assert.equal(opensLink("click", 2), false);
  assert.equal(opensLink("mousedown", 0), false);
  assert.equal(opensLink("mouseover", 0), false);
});
