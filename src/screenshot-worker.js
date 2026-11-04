import layout from './layout-worker.js';

const additions = `<style>
.topinner,.shell{max-width:700px}.cards{grid-template-columns:minmax(0,1fr)!important;gap:14px}.topinner{padding:28px 18px}.shell{padding-left:18px;padding-right:18px}.body{padding:22px 18px 20px}.match{border-radius:20px}.team{min-height:46px}.badge{width:42px;height:44px}.name{font-size:24px}.category{margin-bottom:22px}.cardfoot{min-height:60px}.guide-shortcut{display:block;width:100%;margin-top:12px;padding:10px 14px;text-align:left;color:var(--mint);background:transparent}.guide-list{padding:0;list-style:none}.guide-list li{border-top:1px solid var(--line);padding:12px 0}.guide-list h3{font-size:15px;margin:0 0 5px}.guide-list p{margin:0;font-size:13px}.guide-link{display:inline-block;padding:12px 0}.guide-disclaimer{font-size:12px;color:var(--muted)}
</style>`;
const guide = `<dialog id="betting-guide" aria-labelledby="guide-title"><h2 id="guide-title">Betting Guide</h2><p>Essential reading from the current BestPreviews Betting Guides catalogue.</p><ul class="guide-list"><li><h3>Stake &amp; bet slips</h3><p>What a stake is, what to check on your slip, and how winning, losing and void bets are settled.</p></li><li><h3>Odds &amp; probability</h3><p>Understand implied probability and the bookmaker's margin.</p></li><li><h3>Common football markets</h3><p>Find the guides to goals bets, double chance, draw no bet and handicaps.</p></li><li><h3>Value &amp; betting edge</h3><p>Understand how an estimated probability compares with the available odds.</p></li><li><h3>Bankroll management</h3><p>Read about an affordable bankroll, units and staking plans.</p></li><li><h3>Gambler's fallacy</h3><p>Recognise when streaks are steering your decisions.</p></li></ul><a class="guide-link" href="https://bestpreviews.com/betting-guides/" target="_blank" rel="noopener noreferrer">Browse the full guides ↗</a><p class="guide-disclaimer">Educational content, not a promise of profit. Only bet what you can afford to lose.</p><button id="close-betting-guide" type="button">Close</button></dialog><script>
(()=>{const guide=document.getElementById('betting-guide'),button=document.getElementById('betting-guide-open');button.addEventListener('click',()=>guide.showModal());document.getElementById('close-betting-guide').addEventListener('click',()=>guide.close());})();
</script>`;

export default {
 async fetch(request, env, ctx) {
  const response = await layout.fetch(request, env, ctx);
  if (request.method !== 'GET' || new URL(request.url).pathname !== '/' || !response.headers.get('content-type')?.includes('text/html')) return response;
  return new HTMLRewriter()
   .on('head', {element(element) {element.append(additions, {html:true});}})
   .on('.toolbar', {element(element) {element.after('<button id="betting-guide-open" class="guide-shortcut" type="button" aria-haspopup="dialog">Betting Guide <span aria-hidden="true">↗</span></button>', {html:true});}})
   .on('body', {element(element) {element.append(guide, {html:true});}})
   .transform(response);
 }
};
