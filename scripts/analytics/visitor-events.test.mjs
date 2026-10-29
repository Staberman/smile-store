import assert from "node:assert/strict";
import test from "node:test";
import { buyEvent, opensLink, whatsAppEvent } from "../../lib/visitor-events.mjs";

const CONTACT_LINK = "https://wa.me/5493412613504";
const pageOf = (pathname) => whatsAppEvent(CONTACT_LINK, pathname)?.path;

test("starting a purchase records the product under /eventos/comprar", () => {
  assert.deepEqual(buyEvent("ray-ban-aviator-classic-rb3025-2mx8q"), {
    route: "/eventos/comprar/[slug]",
    path: "/eventos/comprar/ray-ban-aviator-classic-rb3025-2mx8q",
  });
});

test("a slug that is not route-shaped is recorded as _otro", () => {
  for (const slug of ["", "Ray-Ban", "ray ban", "ray%20ban", "a/b", "-ray", "ray--ban", "x".repeat(81), undefined]) {
    assert.equal(buyEvent(slug).path, "/eventos/comprar/_otro", `slug ${JSON.stringify(slug)}`);
  }
});

test("a wa.me link with a phone number is recorded as a contact under /eventos/whatsapp", () => {
  const links = [
    CONTACT_LINK,
    `${CONTACT_LINK}?text=${encodeURIComponent("Hola Smile, estoy interesado/a en Aviator.")}`,
    `${CONTACT_LINK}#chat`,
  ];
  for (const href of links) {
    assert.deepEqual(whatsAppEvent(href, "/contacto"), {
      route: "/eventos/whatsapp",
      path: "/eventos/whatsapp/contacto",
    });
  }
});

test("a wa.me link without a phone number is recorded as a share under /eventos/compartir", () => {
  const productPage = "/tienda/productos/aviator-2mx8q";
  const links = [
    `https://wa.me/?text=${encodeURIComponent("Aviator https://smiletiendaimp.com.ar/tienda/productos/aviator-2mx8q")}`,
    "https://wa.me/",
    "https://wa.me/#compartir",
  ];
  for (const href of links) {
    const event = whatsAppEvent(href, productPage);
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
  const contact = whatsAppEvent(`${CONTACT_LINK}?text=Hola%20Smile`, "/tienda/productos/aviator-2mx8q");
  assert.equal(contact.path, "/eventos/whatsapp/tienda/productos/aviator-2mx8q");
  assert.doesNotMatch(contact.path, /5493412613504|Hola|text/);

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
