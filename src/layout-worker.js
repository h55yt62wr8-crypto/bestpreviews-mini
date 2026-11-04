import backend from './feed-worker.js';

const css = `
:root{--bg:#091321;--card:#102030;--line:#26384b;--accent:#62dacb;--muted:#a5b5c7;--fg:#f1f5fb}html[data-theme=light]{color-scheme:light;--bg:#f3f7fa;--card:#e6eff4;--line:#cbd9e3;--accent:#087f78;--muted:#53677b;--fg:#162638}body{background:radial-gradient(ellipse at 100% 30%,#0b55552a,transparent 60%),var(--bg);color:var(--fg)}body:before{display:none}main{max-width:900px;padding:0 20px calc(125px + env(safe-area-inset-bottom));padding-top:0}header{margin:0 -20px 26px;padding:26px 20px;border-bottom:1px solid var(--line);min-height:112px;gap:12px}.brand{display:flex;gap:12px;align-items:center;color:var(--fg);font-size:27px;letter-spacing:-1px;line-height:1.1}.brand span{color:inherit}.brand svg{width:37px;height:37px;flex-shrink:0}.brand small{display:block;font-size:9px;letter-spacing:3px;font-weight:600;color:var(--muted);margin-top:10px}.theme-button{border-radius:50%;width:45px;height:45px;min-width:45px;padding:10px;background:transparent;color:var(--muted)}.section-kicker{font-size:10px;letter-spacing:2px;color:var(--accent);font-weight:750;margin-bottom:8px}.heading-row{display:flex;align-items:center;justify-content:space-between;gap:12px}h1{font-size:36px;letter-spacing:-1.3px;line-height:1.15;margin:0}h1:after{content:'.';color:var(--accent)}#refresh{width:46px;min-width:46px;height:46px;color:var(--muted);font-size:24px;background:var(--card)}.status{font-size:12px;margin:25px 0;color:var(--muted)}.toolbar{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(0,1fr);gap:10px;margin-bottom:14px}#search{margin:0}input,select{color:var(--fg);font-size:13px;height:54px;border-color:var(--line)}.controls{align-items:center;gap:3px;margin-bottom:15px}.controls button{border-color:transparent;background:none;color:var(--muted);font-size:13px;font-weight:700;padding:11px 10px}.controls button[aria-pressed=true]{background:#62dacb12;border-color:#62dacb45;color:var(--fg)}.total-count{margin-left:auto;font-size:12px;color:var(--muted);white-space:nowrap}#list{display:grid;gap:15px}article{position:relative;isolation:isolate;margin:0;padding:21px 19px 0;overflow:hidden;background:linear-gradient(120deg,var(--card),var(--bg));border-radius:20px;border-color:var(--line)}article:first-child{border-color:#62dacb66;background:linear-gradient(115deg,#20696355,var(--bg))}article:before{content:'';position:absolute;width:150px;height:220px;right:-20px;top:12px;transform:rotate(-24deg);border:1px solid #7b9eb32b;background:linear-gradient(transparent 49.7%,#7b9eb32b 50%,transparent 50.5%);z-index:-1}article:after{content:'';position:absolute;width:77px;height:77px;right:15px;top:77px;border:1px solid #7b9eb32b;border-radius:50%;z-index:-1}.meta{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent);font-weight:750;margin-bottom:24px;padding-right:32px}article h2{font-size:25px;font-weight:780;letter-spacing:-.5px;line-height:1.2;margin:0 0 19px;min-width:0}.team-row{display:flex;align-items:center;gap:14px;min-height:43px}.team-text{overflow-wrap:anywhere;min-width:0}.neutral-badge{width:40px;height:43px;flex-shrink:0;border-radius:10px;background:#91a7bd0a;display:grid;place-items:center;color:var(--muted)}.neutral-badge svg{width:25px;height:29px}.versus{font-size:10px;font-weight:400;letter-spacing:2px;color:var(--muted);margin:5px 0 5px 54px}.actions{position:relative;margin:0 -19px;border-top:1px solid var(--line);min-height:61px;padding:13px 19px;display:flex;align-items:center;justify-content:space-between;gap:10px}.read{background:none;color:var(--accent);border:0;min-height:36px;padding:0;font-size:14px;flex:0 0 auto;font-weight:750}.published{font-size:12px;color:var(--muted)}.save-icon{position:absolute;right:11px;top:10px;background:none!important;border:0;color:var(--muted);padding:9px;min-height:44px;min-width:44px}.save-icon[aria-pressed=true]{color:var(--accent)}.save-icon svg{width:19px;height:23px}.share-small{font-size:12px;min-height:36px;display:flex;align-items:center}.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:20;border-top:1px solid var(--line);background:var(--bg);display:flex;justify-content:center;padding:13px 10px calc(13px + env(safe-area-inset-bottom))}.bottom-nav button{background:none;border:0;border-radius:0;color:var(--muted);width:150px;max-width:33%;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:12px;padding:3px;min-height:51px}.bottom-nav button[aria-pressed=true]{color:var(--accent)}.bottom-nav svg{width:23px;height:23px}footer{margin-top:25px;color:var(--muted);font-size:11px}dialog{width:min(92%,480px);max-height:80vh;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:18px;padding:23px}dialog::backdrop{background:#0009}dialog p{font-size:14px;color:var(--muted)}dialog h2{font-size:22px}dialog button{margin:8px 8px 0 0}.empty{color:var(--muted)}@media(min-width:760px){#list{grid-template-columns:1fr 1fr}article h2{font-size:25px}}@media(max-width:360px){main{padding-left:14px;padding-right:14px}header{margin-left:-14px;margin-right:-14px;padding-left:14px;padding-right:14px}.brand{font-size:24px}h1{font-size:31px}.controls button{padding:10px 7px;font-size:12px}.actions{flex-wrap:wrap;gap:8px}.published{font-size:11px}.share-small{font-size:11px}article h2{font-size:22px}.total-count{font-size:11px}}
`;

function enhance() {
  const by = id => document.getElementById(id);
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const icon = path => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';
  const book = 'M6 3h12v18l-6-4-6 4Z';
  const brand = document.querySelector('.brand');
  brand.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M17 1C8 2 1 10 1 20c0 3 1 5 2 7l14-12c3-3 3-9 0-14ZM5 32c7 9 21 10 29 1l-12-9c-4-3-9-1-17 8Z"/><path fill="#0a8c82" d="M23 1c11 2 18 12 15 25L26 15c-4-4-4-9-3-14Z"/></svg><div>Best<span style="font-weight:400">Previews</span><small>THE FOOTBALL PREVIEW</small></div>';
  document.querySelector('header .eyebrow').remove();
  const website = document.querySelector('header>a');
  const footer = document.querySelector('footer');
  if (website) { footer.append(document.createElement('br'), website); }
  const theme = make('button','theme-button','☼');theme.setAttribute('aria-label','Switch colour theme');document.querySelector('header').append(theme);
  function setTheme(value) { document.documentElement.dataset.theme=value; try {localStorage.setItem('bp-layout-theme',value);}catch{} const t=window.Telegram?.WebApp;try{if(t?.initData&&t.isVersionAtLeast('6.9')){t.setHeaderColor(value==='light'?'#f3f7fa':'#091321');t.setBackgroundColor(value==='light'?'#f3f7fa':'#091321');}}catch{} }
  try{setTheme(localStorage.getItem('bp-layout-theme')==='light'?'light':'dark');}catch{setTheme('dark');}
  theme.onclick=()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light');
  const heading=document.querySelector('h1'), row=make('div','heading-row');heading.before(make('div','section-kicker','◉  YOUR MATCHDAY, SIMPLIFIED'),row);row.append(heading,by('refresh'));
  const toolbar=make('div','toolbar');by('search').before(toolbar);toolbar.append(by('search'),by('category'));toolbar.before(by('status'));
  const controls=document.querySelector('.controls');
  const latest=make('button','','Latest'), upcoming=make('button','','Upcoming'), savedButton=by('saved'), count=make('span','total-count');controls.prepend(latest,upcoming);controls.append(count);
  let mode='latest';
  const nav=make('nav','bottom-nav');nav.setAttribute('aria-label','Main navigation');
  function navButton(label,path){const b=make('button');b.innerHTML=icon(path);b.append(document.createTextNode(label));nav.append(b);return b;}
  const previewsNav=navButton('Previews','M3 2h18v20H3ZM12 2v20M3 8h4v8H3m18-8h-4v8h4');
  const savedNav=navButton('Saved',book);
  const settingsNav=navButton('Settings','M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0');document.body.append(nav);
  const settings=make('dialog');settings.setAttribute('aria-label','Your settings');settings.innerHTML='<h2>Your settings</h2><p>Device-local saves only. No Telegram identity or account synchronization is used.</p><p>Article dates are publication dates, not kickoff times. Neutral badges are placeholders, not official club crests. Website categories are not verified competitions.</p><p>The logo symbol and layout are reconstructed from your screenshot.</p>';
  const switchTheme=make('button','','Switch theme'), clear=make('button','','Clear saved previews'), close=make('button','','Close');settings.append(switchTheme,clear,close);document.body.append(settings);switchTheme.onclick=()=>theme.click();clear.onclick=()=>by('clear').click();close.onclick=()=>settings.close();settingsNav.onclick=()=>settings.showModal();
  function updateTabs(){latest.setAttribute('aria-pressed',String(mode==='latest'));upcoming.setAttribute('aria-pressed',String(mode==='upcoming'));savedButton.setAttribute('aria-pressed',String(mode==='saved'));previewsNav.setAttribute('aria-pressed',String(mode!=='saved'));savedNav.setAttribute('aria-pressed',String(mode==='saved'));}
  const originalSaved=savedButton.onclick;
  savedButton.onclick=()=>{originalSaved();mode=savedOnly?'saved':'latest';render();updateTabs();};
  latest.onclick=()=>{if(savedOnly)originalSaved();mode='latest';heading.textContent='Latest previews';render();updateTabs();};
  upcoming.onclick=()=>{if(savedOnly)originalSaved();mode='upcoming';heading.textContent='Upcoming previews';render();updateTabs();};
  previewsNav.onclick=()=>{latest.click();window.scrollTo({top:0});};savedNav.onclick=()=>{if(mode!=='saved')savedButton.click();window.scrollTo({top:0});};
  function decode(value){const area=document.createElement('textarea');area.innerHTML=value;return area.value;}
  function restyle(){
    updateTabs();savedButton.textContent='Saved '+saved.length;
    if(mode==='upcoming'){if(!by('list').querySelector('[data-upcoming]')){const p=make('p','empty','Verified kickoff data is not connected. Use Latest; publication dates are not kickoff times.');p.dataset.upcoming='true';by('list').replaceChildren(p);}count.textContent='Not connected';return;}
    const articles=by('list').querySelectorAll('article');count.textContent=articles.length+' previews';
    for(const article of articles){
      if(article.dataset.layout==='3')continue;article.dataset.layout='3';
      const h=article.querySelector('h2'), meta=article.querySelector('.meta'), actions=article.querySelector('.actions');
      const label=meta.textContent.split(' · Published ');meta.textContent=label[0];
      const save=actions.querySelector('button');save.className='save-icon';save.innerHTML=icon(book);article.append(save);
      const title=decode(h.textContent), teams=title.split(/\s+vs\.?\s+/i);h.replaceChildren();
      for(let i=0;i<(teams.length===2?2:1);i++){if(i)h.append(make('div','versus','VS'));const r=make('div','team-row'),badge=make('span','neutral-badge');badge.innerHTML=icon('M4 3 12 1l8 2v10c0 5-4 9-8 12-4-3-8-7-8-12Z');badge.title='Neutral badge: verified club crest not available';r.append(badge,make('span','team-text',teams.length===2?teams[i]:title));h.append(r);}
      const date=make('span','published',label[1]?'◷ Published '+label[1]:'Publication date unavailable');actions.prepend(date);
      const share=actions.querySelector('a:not(.read)');if(share)share.className='share-small';
    }
  }
  new MutationObserver(restyle).observe(by('list'),{childList:true});restyle();
}

export default {async fetch(request,env,ctx){
  const response=await backend.fetch(request,env,ctx);
  if(request.method!=='GET'||new URL(request.url).pathname!=='/'||response.status!==200)return response;
  return new HTMLRewriter().on('head',{element(el){el.append('<style>'+css+'</style>',{html:true});}}).on('body',{element(el){el.append('<script>('+enhance.toString()+')();</script>',{html:true});}}).transform(response);
}};
