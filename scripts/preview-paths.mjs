import { parseDocument } from "htmlparser2";

export function normalizePrefix(value = "/") {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(value)) throw new Error("SITE_PATH_PREFIX must be / or a slash-delimited local path.");
  return value;
}

export function prefixUrl(value, prefix) {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith(prefix)
    ? prefix.slice(0, -1) + value : value;
}

// Rewrite only generated HTML attribute spans. Preserve text, JSON-LD, absolute
// production canonicals and external service URLs byte-for-byte.
export function previewHtml(html, prefix) {
  if (prefix === "/") return html;
  const edits = [];
  const doc = parseDocument(html, { withStartIndices: true });
  function visit(node) {
    if (node.attribs) {
      const start = node.startIndex;
      let end = start, quote = null;
      for (; end < html.length; end++) {
        const char = html[end];
        if (quote) { if (char === quote) quote = null; }
        else if (char === '"' || char === "'") quote = char;
        else if (char === ">") { end++; break; }
      }
      let tag = html.slice(start, end);
      // Consume each complete attribute, including non-URL ones, so quoted
      // example text cannot be mistaken for an actual href/src attribute.
      tag = tag.replace(/(\s+)([^\s=/>]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/g, (all, space, attr, equals, raw) => {
        const quote = /^["']/.test(raw) ? raw[0] : "";
        const value = quote ? raw.slice(1, -1) : raw;
        let mapped = value;
        if (attr === "srcset") mapped =
          value.split(",").map(part => part.replace(/^(\s*)(\S+)/, (_, space, url) => space + prefixUrl(url, prefix))).join(",");
        else if (["href", "src", "action", "poster", "data-full", "data-full-fallback", "data-full-2x", "data-thumb"].includes(attr)) mapped = prefixUrl(value, prefix);
        else if (node.name === "meta" && attr === "content" && node.attribs.name === "robots") mapped = "noindex,follow";
        else if (node.name === "meta" && attr === "content" && node.attribs["http-equiv"] === "refresh") mapped = value.replace(/url=(\/.*)/, (_, url) => "url=" + prefixUrl(url, prefix));
        return space + attr + equals + quote + mapped + quote;
      });
      if (node.name === "html") tag = tag.slice(0, -1) + ' data-site-base="' + prefix + '">';
      if (tag !== html.slice(start, end)) edits.push({ start, end, value: tag });
    }
    for (const child of node.children || []) visit(child);
  }
  visit(doc);
  for (const e of edits.sort((a, b) => b.start - a.start)) html = html.slice(0, e.start) + e.value + html.slice(e.end);
  if (!/<meta\s+name="robots"/.test(html)) html = html.replace("</head>", '<meta name="robots" content="noindex,follow" />\n</head>');
  // The two compatibility layouts use this exact local redirect expression.
  return html.replace(/window\.location\.replace\("(\/[^"]*)"/g, (_, url) => 'window.location.replace("' + prefixUrl(url, prefix) + '"');
}
