<?php

use ApiPro\Page;

/**
 * api-pro's documentation — a real docs site (sticky sidebar nav +
 * sections), one level under the showcase homepage. $version arrived via
 * (new Page())->props(['version' => ...]) in HomeController::docs() — a
 * real local variable in this file's scope, nothing more.
 *
 * @var string $version
 */
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Docs — api-pro</title>
<style>
  :root {
    --bg: #0f1720; --panel: #182430; --panel-2: #1e2c3a; --border: #2b3a4a;
    --text: #e6edf3; --muted: #8b9bab; --accent: #4da3ff;
    --get: #2f9e5b; --post: #c98a1a; --put: #3d7fc9; --delete: #d64545;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  code { background: var(--panel-2); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; font-size: 13px; }
  pre code { background: none; border: none; padding: 0; }

  .site-header { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 14px 32px; border-bottom: 1px solid var(--border); background: rgba(15, 23, 32, 0.9); backdrop-filter: blur(6px); }
  .brand { display: flex; align-items: baseline; gap: 8px; font-weight: 700; font-size: 17px; }
  .brand .dot { color: var(--accent); }
  .brand .version { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-weight: 400; }
  nav.site-nav { display: flex; align-items: center; gap: 24px; font-size: 14px; }
  nav.site-nav a { color: var(--text); }
  nav.site-nav a.current { color: var(--accent); }
  nav.site-nav a.button { color: #06192e; background: var(--accent); padding: 7px 14px; border-radius: 6px; font-weight: 600; }
  nav.site-nav a.button:hover { text-decoration: none; opacity: .9; }

  .layout { display: grid; grid-template-columns: 260px 1fr; max-width: 1180px; margin: 0 auto; align-items: start; }

  .toc { position: sticky; top: 65px; padding: 32px 20px; height: calc(100vh - 65px); overflow-y: auto; border-right: 1px solid var(--border); }
  .toc h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 20px 0 8px; }
  .toc h4:first-child { margin-top: 0; }
  .toc ul { list-style: none; margin: 0 0 4px; padding: 0; }
  .toc li a { display: block; padding: 5px 10px; border-radius: 6px; font-size: 13px; color: var(--muted); }
  .toc li a:hover { background: var(--panel-2); color: var(--text); text-decoration: none; }
  .toc li a.active { background: var(--panel-2); color: var(--accent); }

  .content { padding: 40px 40px 100px; max-width: 760px; }
  .content > p.lead { color: var(--muted); font-size: 15px; margin: 0 0 40px; }
  section.doc { margin-bottom: 48px; padding-top: 8px; }
  section.doc h2 { font-size: 22px; margin: 0 0 6px; scroll-margin-top: 80px; }
  section.doc .doc-badge { display: inline-block; font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 7px; margin-bottom: 14px; }
  section.doc p { color: var(--text); font-size: 14.5px; margin: 0 0 14px; }
  section.doc p.muted { color: var(--muted); font-size: 13.5px; }
  section.doc h3 { font-size: 15px; margin: 24px 0 8px; }
  section.doc ul, section.doc ol { padding-left: 22px; margin: 0 0 14px; font-size: 14.5px; }
  section.doc li { margin-bottom: 6px; }
  pre.code-block { background: #0a1119; border: 1px solid var(--border); border-radius: 8px; padding: 16px 18px; font-size: 13px; overflow-x: auto; margin: 0 0 16px; line-height: 1.6; }
  pre.code-block .k { color: var(--post); } pre.code-block .s { color: var(--get); } pre.code-block .c { color: var(--muted); } pre.code-block .f { color: var(--accent); }
  table.doc-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 0 0 16px; }
  table.doc-table th, table.doc-table td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--border); }
  table.doc-table th { color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
  .method-tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; color: #fff; }
  .method-GET { background: var(--get); } .method-POST { background: var(--post); } .method-PUT { background: var(--put); } .method-DELETE { background: var(--delete); }

  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .toc { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
  }
</style>
</head>
<body>

<header class="site-header">
  <div class="brand"><span class="dot">●</span> api-pro <span class="version">v<?= Page::html($version) ?></span></div>
  <nav class="site-nav">
    <a href="/api/api-pro">Home</a>
    <a href="/api/api-pro/docs" class="current">Docs</a>
    <a href="/tester">Tester</a>
    <a href="/tester" class="button">Try it live</a>
  </nav>
</header>

<div class="layout">
  <nav class="toc" id="toc">
    <h4>Get started</h4>
    <ul>
      <li><a href="#overview">Overview</a></li>
      <li><a href="#structure">Project structure</a></li>
      <li><a href="#cli">The <code>apc</code> CLI</a></li>
    </ul>
    <h4>Building an API</h4>
    <ul>
      <li><a href="#routing">Controllers &amp; routing</a></li>
      <li><a href="#middleware">Middleware</a></li>
      <li><a href="#input">Validating input</a></li>
      <li><a href="#packet">Packet responses</a></li>
    </ul>
    <h4>Features</h4>
    <ul>
      <li><a href="#session">Sessions (JWT)</a></li>
      <li><a href="#prosql">ProSql</a></li>
      <li><a href="#page">Pages</a></li>
      <li><a href="#tester">Tester</a></li>
    </ul>
  </nav>

  <main class="content">
    <p class="lead">Everything api-pro does, in the order you'll actually use it — from an empty project to a running, documented API.</p>

    <section class="doc" id="overview">
      <h2>Overview</h2>
      <p>api-pro is a small PHP framework built around the same ideas Spring Boot uses: attributes declare routing instead of a separate routes file, a container autowires constructors instead of manual instantiation, and one uniform response envelope replaces ad-hoc array shapes. There's no build step and no framework binary — it's PHP files, autoloaded by Composer, run by PHP's own built-in server or any standard web server.</p>
      <p class="muted">Everything here is real — every code sample on this page is copied from a controller actually running in this app.</p>
    </section>

    <section class="doc" id="structure">
      <h2>Project structure</h2>
      <span class="doc-badge">project layout</span>
      <pre class="code-block"><span class="c">ap/
├── apc                    </span># the CLI entry point<span class="c">
├── app.php                </span># name, version, env, module list<span class="c">
├── index.php              </span># front controller<span class="c">
├── runner/                </span># boot-time config (never web-reachable)<span class="c">
│   ├── runner.php
│   ├── controllers.php
│   ├── session.php
│   ├── prosql.php
│   └── tester.php
├── lib/                   </span># Page templates &amp; views (never web-reachable)<span class="c">
│   ├── page.html
│   └── page/
├── packages/              </span># the framework itself, as packages<span class="c">
│   ├── api-pro/           </span># core: Kernel, Router, Container, Packet...<span class="c">
│   ├── pro-sql/           </span># QueryBuilder, Repository<span class="c">
│   ├── session/           </span># stateless JWT sessions<span class="c">
│   └── tester/             </span># the API explorer at /tester<span class="c">
└── src/                   </span># YOUR application<span class="c">
    ├── Application.php    </span># the app's own Module<span class="c">
    ├── Controllers/
    └── Services/</span></pre>
      <p>Everything under <code>packages/</code> is framework code — your own controllers and services live in <code>src/</code>. <code>runner/</code> and <code>lib/</code> hold configuration and templates the framework reads directly off disk; both are blocked from direct web access.</p>
    </section>

    <section class="doc" id="cli">
      <h2>The <code>apc</code> CLI</h2>
      <table class="doc-table">
        <tr><th>Command</th><th>What it does</th></tr>
        <tr><td><code>apc -v</code></td><td>Print the app's name/version.</td></tr>
        <tr><td><code>apc start [host:port]</code></td><td>Clean + rebuild, then start PHP's built-in server (default <code>127.0.0.1:7070</code>).</td></tr>
        <tr><td><code>apc build [--clean]</code></td><td>Warm (or clear) the compiled route cache.</td></tr>
        <tr><td><code>apc install [version]</code></td><td>Resolve every module in <code>app.php</code> and verify the app boots.</td></tr>
        <tr><td><code>apc module &lt;name&gt; [version]</code></td><td>Add/update a module reference.</td></tr>
      </table>
      <p class="muted">Route compilation only ever caches to disk outside <code>env: local</code> — in local development every request recompiles fresh, so editing a controller takes effect immediately.</p>
    </section>

    <section class="doc" id="routing">
      <h2>Controllers &amp; routing</h2>
      <p>A controller is a plain class with a <code>#[RestController(prefix: '/users')]</code> attribute; each action gets <code>#[GetMapping]</code>/<code>#[PostMapping]</code>/<code>#[PutMapping]</code>/<code>#[DeleteMapping]</code> (all just <code>#[RequestMapping]</code> under the hood). The module's own prefix (<code>/api</code>, from <code>Application::prefix()</code>) is prepended automatically.</p>
      <pre class="code-block"><span class="c">#[RestController(prefix: '/users')]</span>
<span class="k">class</span> UserController
{
    <span class="k">public function</span> __construct(<span class="k">private readonly</span> UserService $userService) {}

    <span class="c">#[GetMapping]</span>                 <span class="c">// GET /api/users</span>
    <span class="k">public function</span> <span class="f">index</span>(Request $request): array
    {
        <span class="k">return</span> $this-&gt;userService-&gt;all();
    }

    <span class="c">#[GetMapping('/{id}')]</span>        <span class="c">// GET /api/users/{id}</span>
    <span class="k">public function</span> <span class="f">show</span>(Request $request): array
    {
        $id = $request->params-&gt;getInt(<span class="s">'id'</span>);
        <span class="k">return</span> $this-&gt;userService-&gt;find($id) ?? <span class="k">throw new</span> PacketFailed(<span class="s">'User not found'</span>, 404);
    }
}</pre>
      <p>Every attribute is read once, via Reflection, by <code>RouteCompiler</code> — never per-request. The result is a plain, cacheable route table; <code>Router::dispatch()</code> just matches a path against it and calls the method directly, no Reflection at dispatch time.</p>
      <p>Register the controller class in <code>runner/controllers.php</code> and it's live — nothing else to wire up.</p>
    </section>

    <section class="doc" id="middleware">
      <h2>Middleware</h2>
      <p><code>#[Middleware(...)]</code> wraps a request in an onion model: outermost middleware runs first on the way in, last on the way out. Declare it on the class (every action) or a single method (a method-level entry of the same middleware class overrides, not stacks on, the class-level one).</p>
      <pre class="code-block"><span class="c">#[RestController(prefix: '/health')]</span>
<span class="c">#[Middleware(new SessionMiddleware(mandatory: true))]   </span><span class="c">// class-level default</span>
<span class="k">class</span> HealthController
{
    <span class="c">#[GetMapping('/ping')]</span>
    <span class="c">#[Middleware(new SessionMiddleware(mandatory: false))]  </span><span class="c">// this action only</span>
    <span class="k">public function</span> <span class="f">ping</span>(Request $request): array { <span class="c">/* ... */</span> }
}</pre>
      <p class="muted">Building it with <code>new</code> inside the attribute only ever carries plain config (like <code>mandatory</code>) — the container still resolves the middleware's real service dependencies fresh at dispatch time.</p>
    </section>

    <section class="doc" id="input">
      <h2>Validating input</h2>
      <p><code>$request-&gt;query</code>, <code>$request-&gt;body</code>, and <code>$request-&gt;params</code> are all an <code>InputBag</code> — typed getters that validate and coerce, 400-ing automatically on anything invalid.</p>
      <pre class="code-block">$mail     = $request->body->getMail(<span class="s">'mail'</span>);            <span class="c">// mandatory — 400 if missing/invalid</span>
$password = $request->body->getPassword(<span class="s">'password'</span>);
$roles    = $request->body->getJson(<span class="s">'roles'</span>, []);        <span class="c">// optional — [] if absent</span>
$lang     = $request->query->getString(<span class="s">'lang'</span>, <span class="s">'en'</span>);   <span class="c">// optional — 'en' if absent</span>
$id       = $request->params->getInt(<span class="s">'id'</span>);              <span class="c">// mandatory path param</span></pre>
      <p><strong>Omit the default (or pass <code>null</code>) and the field is mandatory</strong>; any other default — including <code>''</code>, <code>0</code>, <code>false</code>, <code>[]</code> — makes it optional. <code>getMail()</code>/<code>getPassword()</code> take a <code>required: bool</code> instead. Available getters: <code>getString</code>, <code>getInt</code>, <code>getFloat</code>, <code>getBool</code>, <code>getArray</code>, <code>getJson</code>, <code>getMail</code>, <code>getPassword</code>.</p>
    </section>

    <section class="doc" id="packet">
      <h2>Packet responses</h2>
      <p>Every JSON response — success or failure — is the same shape: <code>{ success, message, data }</code>. A controller returning a plain array/scalar gets it wrapped in a success <code>Packet</code> automatically; nothing extra to write.</p>
      <pre class="code-block"><span class="k">return</span> $user;  <span class="c">// -&gt; { "success": true, "message": "Success", "data": {...} }</span></pre>
      <p><strong><code>PacketSuccess</code></strong> and <strong><code>PacketFailed</code></strong> are the two shapes you write explicitly:</p>
      <pre class="code-block"><span class="k">return new</span> PacketSuccess($data, <span class="s">'Validated'</span>);        <span class="c">// custom message</span>
<span class="k">throw new</span> PacketFailed(<span class="s">'User not found'</span>, 404);   <span class="c">// any status, from anywhere</span></pre>
      <p><code>PacketFailed</code> is a real exception — throw it from a controller, a middleware, or <code>InputBag</code>'s own validation, and <code>Kernel::handle()</code> catches it in exactly one place and converts it. No <code>Response::json()</code> call needed anywhere.</p>
    </section>

    <section class="doc" id="session">
      <h2>Sessions (JWT)</h2>
      <p>A stateless, signed token — not native <code>$_SESSION</code>. <code>Session::create($id, $data)</code> issues one; <code>SessionMiddleware</code> resolves the incoming bearer token before your controller runs and re-attaches a (possibly re-encoded) one to the response afterward via <code>Session::response()</code>.</p>
      <pre class="code-block">$this->session->create((string) $user[<span class="s">'id'</span>], $user);
<span class="k">return</span> [<span class="s">'status'</span> =&gt; <span class="s">'LOGGED_IN'</span>, <span class="s">'user'</span> =&gt; $user];
<span class="c">// -&gt; response carries a "token" field automatically</span></pre>
      <p><code>mandatory: true</code> (the default) rejects with a 401 before the controller ever runs if no valid token came in. Set config <code>enc: true</code> to encrypt the token's data payload; bump <code>SESSION_VERSION</code> to invalidate every outstanding token at once.</p>
    </section>

    <section class="doc" id="prosql">
      <h2>ProSql</h2>
      <p>A lazy PDO connection, a fluent, parameter-bound query builder, and a base <code>Repository</code> for straightforward CRUD — configured once via <code>runner/prosql.php</code>, read through <code>Runner::get('prosql')</code>.</p>
      <pre class="code-block">$rows = (<span class="k">new</span> QueryBuilder($connection))
    -&gt;table(<span class="s">'users'</span>)
    -&gt;where(<span class="s">'active'</span>, <span class="s">'='</span>, <span class="k">true</span>)
    -&gt;orderBy(<span class="s">'created_at'</span>, <span class="s">'desc'</span>)
    -&gt;get();</pre>
    </section>

    <section class="doc" id="page">
      <h2>Pages</h2>
      <p><code>ApiPro\Page</code> is <code>Packet</code>'s counterpart for HTML instead of JSON. Two modes: a fluent builder filling in <code>lib/page.html</code>'s placeholders, or <strong>view mode</strong> — a complete, hand-written PHP file under <code>lib/page/</code>, with <code>props()</code> extracted as real local variables. This page, and the homepage, are both view-mode pages.</p>
      <pre class="code-block"><span class="k">return</span> (<span class="k">new</span> Page())
    -&gt;view(<span class="s">'HomePage'</span>)
    -&gt;props([<span class="s">'posts'</span> =&gt; $this-&gt;postService-&gt;all()]);</pre>
      <p>Return a <code>Page</code> and <code>Kernel::handle()</code> renders and sends it as <code>text/html</code> automatically — the same way returning a <code>Packet</code> sends JSON.</p>
    </section>

    <section class="doc" id="tester">
      <h2>Tester</h2>
      <p>A Swagger-like API explorer at <a href="/tester">/tester</a> — every registered route, grouped by controller, with real fields (required <code>*</code>/optional, typed) read straight from your controller's own source via <code>RouteCompiler</code>, not guessed. A single Bearer token in the header applies to every request; <code>Tester::comment("...")</code> inside a method body documents that endpoint without an annotation.</p>
      <p class="muted"><a href="/tester">Open the Tester →</a></p>
    </section>
  </main>
</div>

<script>
  // Highlights whichever section's heading is nearest the top of the
  // viewport — a plain scroll-driven active state, no routing/frameworks.
  const links = [...document.querySelectorAll('#toc a')];
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function updateActive() {
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top - 90 <= 0) current = section;
    }
    links.forEach(a => {
      a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id);
    });
  }

  document.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
</script>
</body>
</html>
