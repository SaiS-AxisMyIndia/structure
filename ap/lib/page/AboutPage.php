<?php

use Gerogo\Page;
use Gerogo\Runner;

/**
 * A simple "what this project is" page — describes gerogo itself
 * honestly (a demo/learning framework, not a real product with a real
 * team behind it), matching the tone already established in
 * README.md/HomePage.php rather than inventing marketing claims this
 * project can't back up. No props/$request needed here — Runner::get()
 * is a plain static call, available anywhere, not just a controller.
 */
$version = Runner::get('version');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>About — gerogo</title>
<style>
  :root {
    --bg: #0f1720; --panel: #182430; --panel-2: #1e2c3a; --border: #2b3a4a;
    --text: #e6edf3; --muted: #8b9bab; --accent: #74e18b; --accent-2: #2f9e5b;
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

  main { max-width: 700px; margin: 0 auto; padding: 56px 32px 40px; }
  .eyebrow { color: var(--accent); font-family: ui-monospace, monospace; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 12px; }
  h1 { font-size: 32px; margin: 0 0 20px; }
  p { color: var(--muted); font-size: 15px; margin: 0 0 16px; }
  p strong { color: var(--text); }
  ul { color: var(--muted); font-size: 15px; padding-left: 20px; margin: 0 0 16px; }
  li { margin-bottom: 6px; }

  .site-footer { border-top: 1px solid var(--border); padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 13px; max-width: 1080px; margin: 0 auto; }
  .site-footer a { color: var(--muted); }
  .site-footer a:hover { color: var(--text); }
</style>
</head>
<body>

<header class="site-header">
  <div class="brand"><span class="dot">●</span> gerogo <span class="version">v<?= Page::html($version) ?></span></div>
  <nav class="site-nav">
    <a href="/ap/v1/site">Home</a>
    <a href="/ap/v1/site/docs">Docs</a>
    <a href="/ap/v1/site/releases">Releases</a>
    <a href="/ap/v1/site/about" class="current">About</a>
    <a href="/ap/v1/site/contact">Contact</a>
    <a href="/tester">Tester</a>
    <a href="/tester" class="button">Try it live</a>
  </nav>
</header>

<main>
  <div class="eyebrow">About</div>
  <h1>What this is</h1>

  <p><strong>gerogo</strong> is a small PHP micro-framework built around the same ideas Spring Boot gives you: attribute-based routing instead of a separate routes file, constructor injection instead of manual instantiation, and one uniform response envelope (<code>Packet</code>) instead of ad-hoc array shapes.</p>

  <p>This site — the homepage, these docs, the Tester at <a href="/tester">/tester</a>, and the AppViewer at <a href="/app-viewer">/app-viewer</a> — is the framework's own showcase, running on itself. Every feature described in the docs is real, working code in this same codebase, not a mockup.</p>

  <p>It's a demo/learning project, not a maintained product with a support team behind it — there's no company, no SLA, and no roadmap beyond what's already built. If you're using it as a starting point for something real, treat every default (secrets, credentials, the demo data in <code>UserService</code>/<code>PostService</code>) as exactly that: a default, meant to be replaced.</p>

  <p>Built with:</p>
  <ul>
    <li>PHP 8.1+ (per every package's own composer.json), no framework binary, no build step</li>
    <li>A small set of packages under <code>packages/</code> — the web framework, the MySQL layer, the session layer, and the two dev tools (Tester, AppViewer)</li>
  </ul>
</main>

<footer class="site-footer">
  <span>gerogo v<?= Page::html($version) ?> — built with itself.</span>
  <span><a href="/ap/v1/site/docs">Docs</a> · <a href="/tester">Tester</a></span>
</footer>

</body>
</html>
