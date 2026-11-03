import original from './index.js';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
const candidates = ['https://bestpreviews.com/feed/', 'https://bestpreviews.com/rss'];
const list = x => x == null ? [] : Array.isArray(x) ? x : [x];
const str = x => typeof x === 'string' ? x.slice(0, 1000) : '';
function safe(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && ['bestpreviews.com', 'www.bestpreviews.com'].includes(u.hostname) && !u.username && !u.password && !u.port ? u.href : ''; } catch { return ''; }
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
async function read(response) {
  if (!response.body) throw new Error('EMPTY_BODY');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let bytes = 0, value = '';
  try {
    while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 2000000) throw new Error('BODY_TOO_LARGE'); value += decoder.decode(part.value, { stream: true }); }
    return value + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); }
}
async function obtain(source, diagnostic) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
  try {
    let url = source;
    for (let hop = 0; hop < 5; hop++) {
      const response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
      diagnostic.status = response.status; diagnostic.contentType = (response.headers.get('content-type') || '').slice(0, 120);
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        const target = location ? safe(new URL(location, url).href) : '';
        if (response.body) await response.body.cancel().catch(() => {});
        if (!target) throw new Error('UNSAFE_OR_MISSING_REDIRECT');
        url = target; continue;
      }
      if (!response.ok) { if (response.body) await response.body.cancel().catch(() => {}); throw new Error('UPSTREAM_HTTP_' + response.status); }
      const xml = (await read(response)).trim();
      if (/<!doctype\s+html|<html[\s>]/i.test(xml)) throw new Error('HTML_INSTEAD_OF_RSS');
      if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('XML_DECLARATION_REJECTED');
      if (XMLValidator.validate(xml) !== true) throw new Error('INVALID_XML');
      let parsed;
      try { parsed = new XMLParser({ ignoreAttributes: true, parseTagValue: false, processEntities: true }).parse(xml); } catch { throw new Error('XML_PARSE_FAILED'); }
      if (!parsed.rss?.channel) throw new Error('RSS_CHANNEL_MISSING');
      const unique = new Map();
      for (const row of list(parsed.rss.channel.item).slice(0, 200)) {
        const link = safe(str(row.link)), title = str(row.title);
        if (!link || !title) continue;
        const date = Date.parse(str(row.pubDate));
        unique.set(link, { id: link, url: link, title, publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null, categories: list(row.category).map(str).filter(Boolean).slice(0, 12) });
      }
      if (!unique.size) throw new Error('NO_USABLE_ARTICLES');
      return { source: url, fetchedAt: Date.now(), items: [...unique.values()].sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)) };
    }
    throw new Error('TOO_MANY_REDIRECTS');
  } catch (error) {
    const known = /^(EMPTY_BODY|BODY_TOO_LARGE|UNSAFE_OR_MISSING_REDIRECT|UPSTREAM_HTTP_\d{3}|HTML_INSTEAD_OF_RSS|XML_DECLARATION_REJECTED|INVALID_XML|XML_PARSE_FAILED|RSS_CHANNEL_MISSING|NO_USABLE_ARTICLES|TOO_MANY_REDIRECTS)$/;
    diagnostic.code = controller.signal.aborted ? 'TIMEOUT' : known.test(error.message) ? error.message : 'NETWORK_OR_RUNTIME_ERROR';
    throw error;
  } finally { clearTimeout(timer); }
}
async function feed(request) {
  const key = new Request(new URL('/__feed_cache_v2', request.url).href);
  let saved = null;
  try { const hit = await caches.default.match(key); if (hit) saved = await hit.json(); } catch {}
  if (saved && Date.now() - saved.fetchedAt < 300000) return json({ ...saved, stale: false, importerVersion: 2 });
  const diagnostics = [];
  for (const source of candidates) {
    const attempt = { source }; diagnostics.push(attempt);
    try {
      const data = await obtain(source, attempt);
      try { await caches.default.put(key, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } })); } catch {}
      return json({ ...data, stale: false, importerVersion: 2 });
    } catch {}
  }
  if (saved) return json({ ...saved, stale: true, importerVersion: 2, warning: 'Feed unavailable. Showing cached articles.', diagnostics });
  return json({ items: [], importerVersion: 2, error: 'Feed retrieval failed; see diagnostic codes.', diagnostics }, 503);
}
export default { async fetch(request, env, ctx) {
  if (request.method === 'GET' && new URL(request.url).pathname === '/api/feed') return feed(request);
  return original.fetch(request, env, ctx);
} };
