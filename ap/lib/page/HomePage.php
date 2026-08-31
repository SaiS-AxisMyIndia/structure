<?php

use ApiPro\Page;
use ApiPro\Request;
use ApiPro\Runner;

/**
 * api-pro's showcase homepage — a real website (nav, hero, feature grid,
 * quick start, footer), not a bare demo page. $request arrives via
 * `new Page($request, 'HomePage')` in Lib\Controllers\HomeController::home()
 * — $posts was added onto it there (`$request->body->addJson('posts', ...)`,
 * InputBag's write counterpart to getJson()) since it comes from
 * PostService, not the real request, and this file reads it back the
 * exact same way it would any other body field. The "Live demo" section
 * at the bottom is the one part that's actually interactive: its JS
 * posts to the real POST /ap/v1/api-pro/posts endpoint
 * (App\Controllers\HomeController — a different class, same short name,
 * see its own docblock) and appends whatever comes back — proof this is
 * a working framework, not a mockup.
 *
 * @var Request $request
 */
$posts = $request->body->getJson('posts', []);
$version = Runner::get('version');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>api-pro — a Spring-Boot-style framework for PHP</title>
<style>
  :root {
    --bg: #0f1720; --panel: #182430; --panel-2: #1e2c3a; --border: #2b3a4a;
    --text: #e6edf3; --muted: #8b9bab; --accent: #4da3ff; --accent-2: #7c5cff;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre { font-family: ui-monospace, "SF Mono", Menlo, monospace; }

  .site-header { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 14px 32px; border-bottom: 1px solid var(--border); background: rgba(15, 23, 32, 0.9); backdrop-filter: blur(6px); }
  .brand { display: flex; align-items: baseline; gap: 8px; font-weight: 700; font-size: 17px; }
  .brand .dot { color: var(--accent); }
  .brand .version { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-weight: 400; }
  nav.site-nav { display: flex; align-items: center; gap: 24px; font-size: 14px; }
  nav.site-nav a { color: var(--text); }
  nav.site-nav a.current { color: var(--accent); }
  nav.site-nav a.button { color: #06192e; background: var(--accent); padding: 7px 14px; border-radius: 6px; font-weight: 600; }
  nav.site-nav a.button:hover { text-decoration: none; opacity: .9; }

  main { max-width: 1080px; margin: 0 auto; padding: 0 32px; }

  .hero { text-align: center; padding: 88px 0 64px; }
  .hero .eyebrow { color: var(--accent); font-family: ui-monospace, monospace; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 16px; }
  .hero h1 { font-size: 44px; margin: 0 0 18px; letter-spacing: -0.01em; }
  .hero h1 span { background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .hero p.lead { color: var(--muted); font-size: 17px; max-width: 620px; margin: 0 auto 32px; }
  .hero .cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .cta a.primary { background: var(--accent); color: #06192e; padding: 12px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .cta a.primary:hover { text-decoration: none; opacity: .9; }
  .cta a.secondary { background: var(--panel); border: 1px solid var(--border); color: var(--text); padding: 12px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .cta a.secondary:hover { text-decoration: none; border-color: var(--accent); }

  section { padding: 56px 0; border-top: 1px solid var(--border); }
  section > h2 { font-size: 26px; margin: 0 0 8px; text-align: center; }
  section > p.section-sub { color: var(--muted); text-align: center; max-width: 560px; margin: 0 auto 40px; font-size: 14px; }

  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .feature { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 22px; }
  .feature .icon { width: 34px; height: 34px; border-radius: 8px; background: var(--panel-2); display: flex; align-items: center; justify-content: center; font-family: ui-monospace, monospace; font-weight: 700; color: var(--accent); margin-bottom: 14px; }
  .feature h3 { font-size: 15px; margin: 0 0 6px; }
  .feature p { color: var(--muted); font-size: 13px; margin: 0; }

  .quickstart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  .quickstart-grid .copy h3 { font-size: 18px; margin: 0 0 10px; }
  .quickstart-grid .copy p { color: var(--muted); font-size: 14px; margin: 0 0 14px; }
  .quickstart-grid .copy ol { color: var(--muted); font-size: 14px; padding-left: 20px; margin: 0; }
  .quickstart-grid .copy li { margin-bottom: 6px; }
  pre.code-block { background: #0a1119; border: 1px solid var(--border); border-radius: 10px; padding: 20px; font-size: 13px; overflow-x: auto; margin: 0; line-height: 1.6; }
  pre.code-block .k { color: #c98a1a; } pre.code-block .s { color: #2f9e5b; } pre.code-block .c { color: var(--muted); } pre.code-block .f { color: var(--accent); }

  .demo-panel { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 28px; max-width: 640px; margin: 0 auto; }
  .demo-panel .demo-tag { display: inline-block; font-family: ui-monospace, monospace; font-size: 11px; color: var(--accent); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; margin-bottom: 14px; }
  form#post-form { display: flex; gap: 8px; margin-bottom: 20px; }
  input[type=text] { flex: 1; background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 10px 12px; font-size: 14px; }
  button { background: var(--accent); color: #06192e; border: none; border-radius: 6px; padding: 10px 18px; font-weight: 600; font-size: 14px; cursor: pointer; }
  button:hover { opacity: .9; }
  ul#post-list { list-style: none; padding: 0; margin: 0; }
  ul#post-list li { background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; margin-bottom: 8px; }
  ul#post-list li .text { display: block; margin-bottom: 4px; }
  ul#post-list li .when { color: var(--muted); font-size: 11px; font-family: ui-monospace, monospace; }
  .error { color: #d64545; font-size: 13px; margin: -8px 0 16px; display: none; }

  .site-footer { border-top: 1px solid var(--border); padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 13px; max-width: 1080px; margin: 0 auto; }
  .site-footer a { color: var(--muted); }
  .site-footer a:hover { color: var(--text); }

  @media (max-width: 820px) {
    .features { grid-template-columns: 1fr 1fr; }
    .quickstart-grid { grid-template-columns: 1fr; }
    nav.site-nav { gap: 14px; }
  }
  @media (max-width: 560px) {
    .features { grid-template-columns: 1fr; }
    .hero h1 { font-size: 32px; }
  }
</style>
</head>
<body>

<header class="site-header">
  <div class="brand"><span class="dot">●</span> api-pro <span class="version">v<?= Page::html($version) ?></span></div>
  <nav class="site-nav">
    <a href="/ap/v1/site" class="current">Home</a>
    <a href="/ap/v1/site/docs">Docs</a>
    <a href="/ap/v1/site/releases">Releases</a>
    <a href="/ap/v1/site/about">About</a>
    <a href="/ap/v1/site/contact">Contact</a>
    <a href="/tester">Tester</a>
    <a href="/tester" class="button">Try it live</a>
  </nav>
</header>

<main>
  <section class="hero" style="border-top: none;">
    <div class="eyebrow">A micro-framework for PHP</div>
    <h1>Spring Boot's <span>developer experience</span>,<br>in plain PHP.</h1>
    <p class="lead">
      Attribute-based routing, constructor-injected services, a middleware
      pipeline, a uniform response envelope, stateless JWT sessions, and a
      Swagger-style API explorer — no build step, no framework binary,
      just PHP files and one CLI.
    </p>
    <div class="cta">
      <a class="primary" href="/ap/v1/site/docs">Read the docs</a>
      <a class="secondary" href="/tester">Open the API explorer</a>
    </div>
  </section>

  <section id="features">
    <h2>Everything a small API needs</h2>
    <p class="section-sub">Each piece works on its own and composes cleanly with the rest.</p>
    <div class="features">
      <div class="feature"><div class="icon">#[]</div><h3>Attribute routing</h3><p><code>#[RestController]</code>, <code>#[GetMapping]</code>/<code>#[PostMapping]</code>/etc. compile once into a plain, cacheable route table — no runtime Reflection per request.</p></div>
      <div class="feature"><div class="icon">DI</div><h3>Constructor injection</h3><p>A container autowires your controllers' and services' constructors by type, the same way Spring wires a <code>@Service</code> into a <code>@RestController</code>.</p></div>
      <div class="feature"><div class="icon">◐→</div><h3>Middleware pipeline</h3><p><code>#[Middleware(...)]</code> wraps a request in an onion model — a method-level declaration overrides the same class at the class level.</p></div>
      <div class="feature"><div class="icon">{ }</div><h3>Packet responses</h3><p>Every JSON response is the same <code>{success, message, data}</code> shape (HTTP 200 unless you ask otherwise). Throw <code>PacketFailed</code> anywhere to fail, with an optional real status and an optional app-level <code>error_code</code> — no <code>Response::json()</code> needed.</p></div>
      <div class="feature"><div class="icon">JWT</div><h3>Stateless sessions</h3><p>Signed, optionally encrypted tokens — no server-side session store. <code>Session::create()</code>/<code>resolve()</code>/<code>logout()</code>, done.</p></div>
      <div class="feature"><div class="icon">✓</div><h3>Typed input validation</h3><p><code>InputBag</code>'s <code>getString()</code>/<code>getInt()</code>/<code>getMail()</code>/etc. validate and coerce query/body/path params, 400-ing automatically on a bad value.</p></div>
      <div class="feature"><div class="icon">DB</div><h3>ProSql</h3><p>A lazy PDO wrapper, a fluent parameter-bound query builder, and a base <code>ProRepo</code> for straightforward CRUD.</p></div>
      <div class="feature"><div class="icon">▤</div><h3>Tester</h3><p>A Swagger-like explorer at <code>/tester</code> — every route, its real fields (required/optional, typed), generated straight from your source.</p></div>
      <div class="feature"><div class="icon">$_</div><h3><code>apc</code> CLI</h3><p><code>apc start</code>, <code>apc build</code>, <code>apc clean</code>, <code>apc install</code> — build, run, and manage modules from one command.</p></div>
    </div>
  </section>

  <section id="quickstart">
    <h2>A whole endpoint in eight lines</h2>
    <p class="section-sub">No boilerplate, no XML, no separate route file to keep in sync.</p>
    <div class="quickstart-grid">
      <div class="copy">
        <h3>How it fits together</h3>
        <p>A controller declares its own prefix and each action's HTTP method + path as attributes, right on the method. The framework compiles that into a route table once — nothing here runs via Reflection on every request.</p>
        <ol>
          <li>Return a plain array/scalar — it's wrapped in a success <code>Packet</code> automatically.</li>
          <li><code>throw new PacketFailed('message', httpStatus: 404)</code> to fail from anywhere, with a real status if you want one.</li>
          <li>Add the class to <code>runner/controllers.php</code> and it's live.</li>
        </ol>
      </div>
      <pre class="code-block"><span class="c">#[RestController(prefix: '/users')]</span>
<span class="k">class</span> UserController
{
    <span class="k">public function</span> __construct(
        <span class="k">private readonly</span> UserService $userService,
    ) {}

    <span class="c">#[GetMapping('/{id}')]</span>
    <span class="k">public function</span> <span class="f">show</span>(Request $request): array
    {
        $id = $request->params-&gt;getInt(<span class="s">'id'</span>);
        $user = $this-&gt;userService-&gt;find($id);

        <span class="k">if</span> ($user === null) {
            <span class="k">throw new</span> PacketFailed(<span class="s">'User not found'</span>, httpStatus: 404);
        }

        <span class="k">return</span> $user;
    }
}</pre>
    </div>
  </section>

  <section id="demo">
    <h2>See it running</h2>
    <p class="section-sub">Not a screenshot — this posts to the real <code>POST /ap/v1/api-pro/posts</code> endpoint below and renders whatever it sends back.</p>
    <div class="demo-panel">
      <span class="demo-tag">ApiPro\Page::view('HomePage') + Packet</span>
      <form id="post-form">
        <input type="text" id="post-text" placeholder="Write something…" required>
        <button type="submit">Post</button>
      </form>
      <p class="error" id="post-error"></p>
      <ul id="post-list">
        <?php foreach ($posts as $post): ?>
        <li data-id="<?= Page::html($post['id']) ?>">
          <span class="text"><?= Page::html($post['text']) ?></span>
          <span class="when"><?= Page::html($post['createdAt']) ?></span>
        </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </section>
</main>

<footer class="site-footer">
  <span>api-pro v<?= Page::html($version) ?> — built with itself.</span>
  <span><a href="/ap/v1/site/docs">Docs</a> · <a href="/ap/v1/site/releases">Releases</a> · <a href="/ap/v1/site/about">About</a> · <a href="/ap/v1/site/contact">Contact</a> · <a href="/tester">Tester</a></span>
</footer>

<script>
  document.getElementById('post-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = document.getElementById('post-text');
    const errorEl = document.getElementById('post-error');
    const text = input.value.trim();

    errorEl.style.display = 'none';

    if (!text) return;

    try {
      const res = await fetch('/ap/v1/api-pro/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        errorEl.textContent = result.message || 'Failed to post.';
        errorEl.style.display = 'block';
        return;
      }

      const li = document.createElement('li');
      li.dataset.id = result.data.id;

      const textSpan = document.createElement('span');
      textSpan.className = 'text';
      textSpan.textContent = result.data.text;

      const whenSpan = document.createElement('span');
      whenSpan.className = 'when';
      whenSpan.textContent = result.data.createdAt;

      li.appendChild(textSpan);
      li.appendChild(whenSpan);
      document.getElementById('post-list').appendChild(li);

      input.value = '';
    } catch (e) {
      errorEl.textContent = 'Request failed: ' + e.message;
      errorEl.style.display = 'block';
    }
  });
</script>
</body>
</html>
