<?php

use Gerogo\Page;
use Gerogo\Runner;

/**
 * A simple releases/changelog page — one real version (whatever
 * Runner::get('version') actually says in app.php, not a hardcoded
 * number), described honestly by what's actually in this codebase
 * right now rather than a fabricated multi-version history. Extend the
 * $releases list below as real versions actually ship.
 */
$version = Runner::get('version');
$releases = [
    [
        'version' => $version,
        'current' => true,
        'highlights' => [
            'Attribute-based routing, DI container, and a uniform Packet response envelope',
            'Stateless JWT sessions with a real access + refresh token flow',
            'ProSql: a fluent query builder, a base ProRepo, and #[ProEntity]/#[Primary]/#[Link]/#[Timestamp]/#[Unique] attributes feeding an `apc build` schema sync (report/update/force via TABLE_WRITE)',
            'Tester — a Swagger-style API explorer at /tester',
            'AppViewer — a live renderer for every Page-returning route, at /app-viewer',
        ],
    ],
];
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Releases — gerogo</title>
<style>
  :root {
    --bg: #0f1720; --panel: #182430; --panel-2: #1e2c3a; --border: #2b3a4a;
    --text: #e6edf3; --muted: #8b9bab; --accent: #74e18b; --accent-2: #2f9e5b;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
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

  main { max-width: 780px; margin: 0 auto; padding: 56px 32px 40px; }
  .eyebrow { color: var(--accent); font-family: ui-monospace, monospace; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 12px; }
  h1 { font-size: 32px; margin: 0 0 12px; }
  p.lead { color: var(--muted); font-size: 15px; max-width: 560px; margin: 0 0 40px; }

  .release { border: 1px solid var(--border); border-radius: 10px; padding: 24px 26px; margin-bottom: 20px; background: var(--panel); }
  .release-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .release-head .v { font-family: ui-monospace, monospace; font-size: 18px; font-weight: 700; }
  .release-head .badge { font-size: 11px; color: #06192e; background: var(--accent); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
  .release ul { margin: 0; padding-left: 20px; color: var(--muted); font-size: 14px; }
  .release li { margin-bottom: 8px; }
  .release li:last-child { margin-bottom: 0; }
  .release code { color: var(--text); }

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
    <a href="/ap/v1/site/releases" class="current">Releases</a>
    <a href="/ap/v1/site/about">About</a>
    <a href="/ap/v1/site/contact">Contact</a>
    <a href="/tester">Tester</a>
    <a href="/tester" class="button">Try it live</a>
  </nav>
</header>

<main>
  <div class="eyebrow">Changelog</div>
  <h1>Releases</h1>
  <p class="lead">What's actually in each version — no marketing copy, just what shipped.</p>

  <?php foreach ($releases as $release): ?>
    <div class="release">
      <div class="release-head">
        <span class="v">v<?= Page::html($release['version']) ?></span>
        <?php if ($release['current']): ?><span class="badge">current</span><?php endif; ?>
      </div>
      <ul>
        <?php foreach ($release['highlights'] as $highlight): ?>
          <li><?= Page::html($highlight) ?></li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endforeach; ?>
</main>

<footer class="site-footer">
  <span>gerogo v<?= Page::html($version) ?> — built with itself.</span>
  <span><a href="/ap/v1/site/docs">Docs</a> · <a href="/tester">Tester</a></span>
</footer>

</body>
</html>
