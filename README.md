# BestPreviews Mini App — replacement source

This is a new minimal Cloudflare Worker implementation, NOT a recovered copy of the earlier missing ZIP. The existing app/ placeholder directories are unused and harmless. No bot token, login, external database or paid API is required by this version.

## Features and limits

- Navy/teal mobile interface with subtle pitch striping, readable article cards, title search and website-category filters. Categories are not guaranteed to be leagues.
- Fixed server-side RSS source: https://bestpreviews.com/feed/ . No arbitrary proxy URLs. RSS is validated, size-limited, deduplicated and restricted to HTTPS BestPreviews article links. Feed HTML is never inserted into the UI.
- Publication dates only: no inferred kickoff, live scores, odds, AI or predictions. Full articles open on the website. Text branding only; no fabricated team crests or claim of an official logo.
- Refresh is request-driven with a five-minute cache freshness window; an open visible app checks every five minutes. This is not a background scheduled importer.
- Edge cache retains a copy for at most 24 hours, subject to eviction and data-center locality; it is not durable storage or a permanent article archive. A stale copy is used on upstream failure if available.
- Up to 100 saved article objects are kept in browser localStorage, not Telegram-account sync. Clear saved previews removes them. No Telegram identity is read, submitted or authenticated.
- Telegram SDK initialization is included. Real-device verification is still required.

## Status

Source prepared for deployment; not yet runtime-tested or deployed by the assistant. No claimed historical test counts apply to this replacement. Feed fetching failed in the assistant's web fetch check; verify /api/feed after deployment. Redirects are deliberately rejected: if the feed address changes, update FEED to the verified canonical URL.

## Deploy from your Mac

Install a current supported Node.js LTS release first. In Terminal:

```sh
git clone https://github.com/h55yt62wr8-crypto/bestpreviews-mini.git
cd bestpreviews-mini
npm install
npm audit
npm run check
npm run dev
```

Open the local URL printed by Wrangler. Inspect the interface and /api/feed. Stop with Ctrl+C. Then:

```sh
npx wrangler login
npm run deploy
```

Approve login in your own browser and choose the intended Cloudflare account. Review your account's current limits/pricing before deploying. Copy the actual HTTPS workers.dev URL printed by Wrangler; no custom DNS or main-site changes are needed. If a Worker with this name already exists, do not overwrite it without checking what it serves; change the name in wrangler.jsonc instead. npm install generates package-lock.json: review and commit it for repeatable installs.

## Alternative: Cloudflare dashboard Git integration

Use Workers & Pages -> create/import a Worker from an existing Git repository. Authorize only this GitHub repo. Select main, root directory /, no custom build step, deploy command npx wrangler deploy. Use the package manager install step if requested. Dashboard wording may vary. If offered Pages instead, select Workers: this repository is a Worker, not a static Pages upload. The connected assistant tool cannot perform this deployment.

## Telegram setup after HTTPS works

Use official @BotFather, /mybots, select @Bestpreviews_agent_Bot, Bot Settings -> Configure Mini App -> Enable Mini App. Paste the actual deployed HTTPS root URL. Then Bot Settings -> Menu Button: set the same URL and button text Open BestPreviews. Do not use localhost, the feed, GitHub URL or a guessed domain. Do not change existing webhooks. Once configured, test https://t.me/Bestpreviews_agent_Bot?startapp . The assistant's current Telegram connector cannot configure these settings.

## Launch checks

1. npm audit and npm run check complete successfully; inspect any errors before deploying.
2. HTTPS root shows the interface; /api/health returns ok.
3. /api/feed returns real current titles and safe website links, or an honest 503 if upstream fails. Health alone does not prove RSS works.
4. Verify search, categories, save/unsave, clear, sharing and full article links.
5. Check on iPhone Telegram and desktop Telegram; confirm the first card is easy to find and text is readable.
6. Save, close and reopen on the SAME device. Do not promise cross-device sync. Changing app hostname changes its localStorage origin.
7. Publish a real website article and verify it appears after cache expiry and a refresh.
8. If feed is unavailable, inspect Cloudflare Worker logs and website firewall logs. Do not disable site-wide Cloudflare protection.

## Optional custom domain

After the workers.dev deployment passes testing, add app.bestpreviews.com through the Worker's Custom Domains settings in the correct Cloudflare account. Do not change apex/www or email DNS. Update both BotFather URLs only after the new address works.

## References

Cloudflare configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
Telegram Mini Apps: https://core.telegram.org/bots/webapps
