<?php

use ApiPro\Page;
use ApiPro\Runner;

/**
 * A simple contact page. There's no real organization behind this demo
 * project, so this deliberately doesn't invent a real-looking
 * email/phone/address — that would misrepresent something that doesn't
 * exist. example.com is IANA/RFC-2606-reserved specifically for
 * documentation like this; swap it for a real address if you deploy
 * this as an actual project with someone to contact.
 */
$version = Runner::get('version');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contact — api-pro</title>
<style>
  :root {
    --bg: #0f1720; --panel: #182430; --panel-2: #1e2c3a; --border: #2b3a4a;
    --text: #e6edf3; --muted: #8b9bab; --accent: #4da3ff; --accent-2: #7c5cff;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; }

  .site-header { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 14px 32px; border-bottom: 1px solid var(--border); background: rgba(15, 23, 32, 0.9); backdrop-filter: blur(6px); }
  .brand { display: flex; align-items: baseline; gap: 8px; font-weight: 700; font-size: 17px; }
  .brand .dot { color: var(--accent); }
  .brand .version { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-weight: 400; }
  nav.site-nav { display: flex; align-items: center; gap: 24px; font-size: 14px; }
  nav.site-nav a { color: var(--text); }
  nav.site-nav a.current { color: var(--accent); }
  nav.site-nav a.button { color: #06192e; background: var(--accent); padding: 7px 14px; border-radius: 6px; font-weight: 600; }
  nav.site-nav a.button:hover { text-decoration: none; opacity: .9; }

  main { max-width: 620px; margin: 0 auto; padding: 56px 32px 40px; }
  .eyebrow { color: var(--accent); font-family: ui-monospace, monospace; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 12px; }
  h1 { font-size: 32px; margin: 0 0 20px; }
  p { color: var(--muted); font-size: 15px; margin: 0 0 16px; }

  .notice { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 20px 22px; margin-bottom: 24px; }
  .notice .tag { display: inline-block; font-family: ui-monospace, monospace; font-size: 11px; color: var(--accent); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; margin-bottom: 10px; }
  .notice p { margin: 0; font-size: 14px; }

  dl { display: grid; grid-template-columns: 100px 1fr; gap: 10px 16px; font-size: 14px; }
  dt { color: var(--muted); }
  dd { margin: 0; }

  .site-footer { border-top: 1px solid var(--border); padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 13px; max-width: 1080px; margin: 0 auto; }
  .site-footer a { color: var(--muted); }
  .site-footer a:hover { color: var(--text); }
</style>
</head>
<body>

<header class="site-header">
  <div class="brand"><span class="dot">●</span> api-pro <span class="version">v<?= Page::html($version) ?></span></div>
  <nav class="site-nav">
    <a href="/ap/v1/site">Home</a>
    <a href="/ap/v1/site/docs">Docs</a>
    <a href="/ap/v1/site/releases">Releases</a>
    <a href="/ap/v1/site/about">About</a>
    <a href="/ap/v1/site/contact" class="current">Contact</a>
    <a href="/tester">Tester</a>
    <a href="/tester" class="button">Try it live</a>
  </nav>
</header>

<main>
  <div class="eyebrow">Contact</div>
  <h1>Get in touch</h1>

  <div class="notice">
    <span class="tag">placeholder</span>
    <p>This is a demo/learning project (see <a href="/ap/v1/site/about">About</a>) — there's no real team monitoring the details below. Replace them with your own before deploying this anywhere real.</p>
  </div>

  <dl>
    <dt>Email</dt>
    <dd><a href="mailto:hello@example.com">hello@example.com</a></dd>
    <dt>Docs</dt>
    <dd><a href="/ap/v1/site/docs">/docs</a></dd>
    <dt>API explorer</dt>
    <dd><a href="/tester">/tester</a></dd>
  </dl>
</main>

<footer class="site-footer">
  <span>api-pro v<?= Page::html($version) ?> — built with itself.</span>
  <span><a href="/ap/v1/site/docs">Docs</a> · <a href="/tester">Tester</a></span>
</footer>

</body>
</html>
