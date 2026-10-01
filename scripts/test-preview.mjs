import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import vm from "node:vm";
import { parseDocument } from "htmlparser2";
import { fromRoot, walk } from "./lib.mjs";
import { normalizePrefix, prefixUrl, previewHtml } from "./preview-paths.mjs";
const prefix = normalizePrefix(process.env.SITE_PATH_PREFIX || "/pbb-website/");
assert.notEqual(prefix, "/");
assert.throws(() => normalizePrefix("//bad/"));
assert.equal(prefixUrl("//cdn.example/a", prefix), "//cdn.example/a");
assert.equal(prefixUrl("https://pbb.ph/status/", prefix), "https://pbb.ph/status/");
const sample = '<html><head></head><body><img src="/a.png" srcset="/a.png 1x, /b.png 2x"><a href="/deep/?a=1#b">x</a><form action="https://formspree.io/f/test"></form></body></html>';
assert(previewHtml(sample, prefix).includes('href="' + prefix + 'deep/?a=1#b"'));
assert(previewHtml(sample, prefix).includes('srcset="' + prefix + 'a.png 1x, ' + prefix + 'b.png 2x"'));
assert.equal(previewHtml(sample, "/"), sample);
assert(previewHtml('<a title="a > b" href="/x/">x</a>', prefix).includes('href="' + prefix + 'x/"'));
const quotedExample = `<a title="example href='/x/'" href="/real/">x</a>`;
const rewrittenExample = previewHtml(quotedExample, prefix);
assert(rewrittenExample.includes(`title="example href='/x/'"`));
assert(rewrittenExample.includes('href="' + prefix + 'real/"'));
const nodes = n => [n, ...(n.children || []).flatMap(nodes)];
let references = 0;
const files = walk(fromRoot("dist"), f => f.endsWith(".html"));
assert.equal(files.length, 28);
for (const file of files) {
  const html = fs.readFileSync(file, "utf8"), all = nodes(parseDocument(html));
  assert.equal(all.find(n => n.name === "html").attribs["data-site-base"], prefix);
  assert(all.some(n => n.name === "meta" && n.attribs.name === "robots" && n.attribs.content === "noindex,follow"));
  assert(all.find(n => n.name === "link" && n.attribs.rel === "canonical").attribs.href.startsWith("https://pbb.ph/"));
  for (const n of all) {
    const a = n.attribs || {};
    const urls = ["href", "src", "poster", "action", "data-full", "data-full-fallback", "data-full-2x", "data-thumb"].map(k => a[k]).filter(Boolean);
    if (a.srcset) urls.push(...a.srcset.split(",").map(s => s.trim().split(/\s+/)[0]));
    for (const url of urls) {
      if (!url.startsWith("/") || url.startsWith("//")) continue;
      assert(url.startsWith(prefix), file + ": escaped project path " + url);
      const relative = decodeURI(url.slice(prefix.length).split(/[?#]/)[0]);
      let target = fromRoot("dist", relative);
      if (!path.extname(target) || relative.endsWith("/")) target = path.join(target, "index.html");
      assert(fs.existsSync(target), file + ": missing " + url); references++;
    }
  }
  if (file.endsWith("gallery.html") || file.endsWith("deployment-model.html")) {
    assert(html.includes('window.location.replace("' + prefix));
    assert(html.includes('content="0; url=' + prefix));
  }
}
// Exercise the client-generated gallery paths independently of rendered attributes.
const context = { document: { documentElement: { dataset: { siteBase: prefix } }, addEventListener() {} }, window: {}, galleryItems: [{ thumb: "assets/gallery/test.webp", full: "https://example.org/a.webp" }] };
vm.runInNewContext(fs.readFileSync(fromRoot("src/assets/gallery-route.js"), "utf8"), context);
assert.equal(context.galleryItems[0].thumb, prefix + "assets/gallery/test.webp");
assert.equal(context.galleryItems[0].full, "https://example.org/a.webp");
assert(!fs.existsSync(fromRoot("dist/CNAME")));
console.log(`Preview verified: ${files.length} pages, ${references} local references, noindex, production canonicals, compatibility redirects and dynamic gallery paths.`);
