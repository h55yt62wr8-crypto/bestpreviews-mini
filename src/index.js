import { XMLParser, XMLValidator } from 'fast-xml-parser';

const FEED = 'https://bestpreviews.com/feed/';
const HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
const parser = new XMLParser({ ignoreAttributes: true, processEntities: true, parseTagValue: false, trimValues: true });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => typeof value === 'string' ? value.slice(0, 1000) : '';
function articleURL(value) {
  try {
    const u = new URL(text(value));
    return u.protocol === 'https:' && ['bestpreviews.com', 'www.bestpreviews.com'].includes(u.hostname) && !u.username && !u.password && !u.port ? u.href : '';
  } catch { return ''; }
}
function parseFeed(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('Invalid feed XML');
  const data = parser.parse(xml);
  if (!data.rss?.channel) throw new Error('RSS channel missing');
  const unique = new Map();
  for (const item of array(data.rss.channel.item).slice(0, 200)) {
    const url = articleURL(item.link);
    const title = text(item.title);
    if (!url || !title) continue;
    const date = Date.parse(text(item.pubDate));
    unique.set(url, { id: url, url, title, publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null, categories: array(item.category).map(text).filter(Boolean).slice(0, 12) });
  }
  const items = [...unique.values()].sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
  if (!items.length) throw new Error('Feed contains no usable articles');
  return items;
}
async function boundedText(response) {
  if (!response.body) throw new Error('Empty response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2000000) throw new Error('Feed exceeds size limit');
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); }
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
async function feedResponse(request) {
  const cache = caches.default;
  const key = new Request(new URL('/__feed_cache_v1', request.url).href);
  let saved = null;
  try {
    const hit = await cache.match(key);
    if (hit) saved = await hit.json();
  } catch {}
  if (saved && Date.now() - saved.fetchedAt < 300000) return json({ ...saved, stale: false });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(FEED, { signal: controller.signal, redirect: 'error', headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
    if (!response.ok) throw new Error('Upstream unavailable');
    const items = parseFeed(await boundedText(response));
    const result = { source: FEED, fetchedAt: Date.now(), items };
    try { await cache.put(key, new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } })); } catch {}
    return json({ ...result, stale: false });
  } catch {
    if (saved) return json({ ...saved, stale: true, warning: 'Website feed unavailable. Showing an older cached copy.' });
    return json({ source: FEED, items: [], error: 'Website feed is unavailable. Please retry or open BestPreviews.com.' }, 503);
  } finally { clearTimeout(timer); }
}

const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#091822"><title>BestPreviews | Football previews</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root{color-scheme:dark;--bg:#091822;--card:#112733;--line:#25434f;--accent:#6fe5cf;--muted:#b3c8d0}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% 0,#194c50 0,transparent 50%),var(--bg);color:#f4fafb;font:16px/1.5 system-ui,-apple-system,sans-serif;min-height:100vh}body:before{content:'';position:fixed;inset:0;pointer-events:none;opacity:.045;background:repeating-linear-gradient(90deg,transparent 0 58px,#fff 59px 60px);z-index:-1}main{max-width:780px;margin:auto;padding:22px 18px calc(35px + env(safe-area-inset-bottom));padding-top:max(22px,env(safe-area-inset-top))}header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}.brand{font-size:23px;font-weight:850;letter-spacing:-.8px}.brand span{color:var(--accent)}.eyebrow{color:var(--muted);font-size:12px;letter-spacing:1.5px;text-transform:uppercase}a{color:var(--accent)}h1{font-size:28px;margin:0 0 14px}h2{font-size:20px;line-height:1.35;margin:10px 0 17px;overflow-wrap:anywhere}input,select,button,.read{font:inherit;border-radius:12px;min-height:46px}input,select{width:100%;background:var(--card);border:1px solid var(--line);color:#fff;padding:11px}input{margin-bottom:10px}.controls{display:flex;gap:9px;margin-bottom:13px}.controls select{flex:1;min-width:0}button{cursor:pointer;background:var(--card);color:#fff;border:1px solid var(--line);padding:9px 13px}button[aria-pressed=true],.read{background:var(--accent);color:#082b28;border-color:var(--accent)}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #fff;outline-offset:3px}.status{color:var(--muted);font-size:13px;margin:12px 0}article{background:linear-gradient(135deg,#15323f,#10222d);border:1px solid var(--line);border-radius:18px;padding:18px;margin:13px 0;box-shadow:0 8px 24px #0002}.meta{color:var(--accent);font-size:13px}.actions{display:flex;gap:9px;flex-wrap:wrap}.read{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;text-decoration:none;font-weight:750;flex:1}.empty{padding:22px;border:1px dashed var(--line);border-radius:15px;color:var(--muted)}footer{font-size:12px;color:var(--muted);margin-top:25px}footer button{font-size:12px;margin-top:12px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(prefers-reduced-motion:no-preference){button,.read{transition:background .15s,transform .15s}.read:active,button:active{transform:scale(.98)}}
</style></head><body><main>
<header><div><div class="brand">Best<span>Previews</span></div><div class="eyebrow">Football. Straight to the point.</div></div><a href="https://bestpreviews.com/" target="_blank" rel="noopener noreferrer">Website ↗</a></header>
<h1>Latest previews</h1><label class="sr" for="search">Search previews</label><input id="search" type="search" placeholder="Search teams or previews…" autocomplete="off"><div class="controls"><label class="sr" for="category">Filter by website category</label><select id="category"><option value="">All categories</option></select><button id="saved" aria-pressed="false">Saved</button><button id="refresh" aria-label="Refresh previews">↻</button></div>
<p class="status" id="status" role="status">Loading website feed…</p><section id="list" aria-label="Previews"></section>
<footer>Article dates are publication dates, not kickoff times. Full analysis opens on BestPreviews.com. Saves stay in this browser on this device; no Telegram identity is collected by this app. Your hosting provider and Telegram may process connection data.<br><button id="clear">Clear saved previews</button></footer>
</main><script>
'use strict';
const tg = window.Telegram && window.Telegram.WebApp;
try { if (tg && tg.initData) { tg.ready(); tg.expand(); if(tg.isVersionAtLeast('6.1')) tg.setBackgroundColor('#091822'); if(tg.isVersionAtLeast('6.9')) tg.setHeaderColor('#091822'); } } catch {}
const $ = id => document.getElementById(id);
const STORE = 'bestpreviews-saved-v1';
let items = [], saved = [], savedOnly = false, busy = false;
function valid(item){try{const u=new URL(item.url);return u.protocol==='https:'&&['bestpreviews.com','www.bestpreviews.com'].includes(u.hostname)&&!u.username&&!u.password&&!u.port&&typeof item.title==='string';}catch{return false;}}
try { const value=JSON.parse(localStorage.getItem(STORE)||'[]'); if(Array.isArray(value)) saved=value.filter(valid).slice(0,100); } catch {}
function store(){try{localStorage.setItem(STORE,JSON.stringify(saved));return true;}catch{$('status').textContent='Storage unavailable: saves work only until this screen closes.';return false;}}
function el(tag,content,cls){const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;}
function render(){
 const query=$('search').value.toLowerCase().trim(), category=$('category').value;
 const filtered=(savedOnly?saved:items).filter(x=>x.title.toLowerCase().includes(query)&&(!category||(x.categories||[]).includes(category)));
 $('list').replaceChildren();
 if(!filtered.length){$('list').append(el('p',savedOnly?'No saved previews match. Save one from Latest previews.':'No previews match, or the feed has not loaded. Try refreshing or open the website.','empty'));return;}
 for(const item of filtered){
  const card=el('article'), date=new Date(item.publishedAt), categories=Array.isArray(item.categories)?item.categories:[];
  card.append(el('div',(categories.slice(0,2).join(' · ')||'Football preview')+(item.publishedAt&&!Number.isNaN(date.getTime())?' · Published '+date.toLocaleDateString():''),'meta'),el('h2',item.title));
  const actions=el('div',undefined,'actions'), read=el('a','Read preview ↗','read');read.href=item.url;read.target='_blank';read.rel='noopener noreferrer';
  const active=saved.some(x=>x.url===item.url), save=el('button',active?'Saved ✓':'Save');save.setAttribute('aria-pressed',String(active));save.setAttribute('aria-label',(active?'Unsave ':'Save ')+item.title);
  save.onclick=()=>{saved=active?saved.filter(x=>x.url!==item.url):[item,...saved].slice(0,100);store();render();};
  const share=el('a','Share');share.href='https://t.me/share/url?url='+encodeURIComponent(item.url)+'&text='+encodeURIComponent(item.title);share.target='_blank';share.rel='noopener noreferrer';share.style.alignSelf='center';
  actions.append(read,save,share);card.append(actions);$('list').append(card);
 }
}
function updateCategories(){const selected=$('category').value;const values=[...new Set([...items,...saved].flatMap(x=>Array.isArray(x.categories)?x.categories:[]))].sort();$('category').replaceChildren(new Option('All categories',''),...values.map(x=>new Option(x,x)));if(values.includes(selected))$('category').value=selected;}
async function load(){
 if(busy)return;busy=true;$('refresh').disabled=true;$('status').textContent='Checking website feed…';
 try{const response=await fetch('/api/feed',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Feed unavailable');items=Array.isArray(data.items)?data.items.filter(valid):[];updateCategories();$('status').textContent=(data.stale?'Older cached copy · ':'')+items.length+' previews · Feed checked '+new Date(data.fetchedAt).toLocaleString()+(data.warning?' · '+data.warning:'');}
 catch{$('status').textContent='Could not refresh the feed. Existing previews and saved articles remain available. Retry or open the website.';}
 finally{busy=false;$('refresh').disabled=false;render();}
}
$('search').oninput=render;$('category').onchange=render;$('refresh').onclick=load;
$('saved').onclick=()=>{savedOnly=!savedOnly;$('saved').setAttribute('aria-pressed',String(savedOnly));document.querySelector('h1').textContent=savedOnly?'Saved previews':'Latest previews';updateCategories();render();};
$('clear').onclick=()=>{if(confirm('Remove all previews saved on this device?')){saved=[];store();updateCategories();render();}};
load();setInterval(()=>{if(!document.hidden)load();},300000);
</script></body></html>`;

export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { ...HEADERS, Allow: 'GET' } });
    if (path === '/api/feed') return feedResponse(request);
    if (path === '/api/health') return json({ ok: true, service: 'bestpreviews-mini', note: 'Worker health only; use /api/feed to check upstream.' });
    if (path !== '/') return new Response('Not found', { status: 404, headers: HEADERS });
    return new Response(HTML, { headers: { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'" } });
  }
};
