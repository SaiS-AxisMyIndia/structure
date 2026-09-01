<?php

declare(strict_types=1);

namespace Gerogo;

use ReflectionMethod;
use ReflectionNamedType;
use ReflectionUnionType;
use RuntimeException;

/**
 * A complete HTML page — the same idea as `Packet`, but for full web
 * pages instead of a JSON envelope. Two ways to build one:
 *
 * 1. The fluent builder, filling in `lib/page.html`'s `{{...}}` placeholders:
 *
 *    return (new Page())
 *        ->title('Dashboard')
 *        ->style('body { font-family: sans-serif; }')
 *        ->body('<h1>Hello</h1>')
 *        ->script('console.log("loaded");');
 *
 * 2. A named PHP view file under `lib/page/` — the whole page (doctype
 *    included) is hand-written PHP+HTML there:
 *
 *    return new Page($request, 'HomePage'); // lib/page/HomePage.php
 *
 * No separate "props" step — `$request` (once set here) is the only
 * thing available inside the view file's scope, a real local variable,
 * nothing else. A view pulls whatever it needs straight from `$request`
 * — the same InputBag getters a controller would use (see
 * `Request::all()` for the whole thing as one `{query, body, params}`
 * array). For a value that isn't real request data — something only a
 * constructor-injected service can produce — the controller ADDS it to
 * the request before returning, via InputBag's addX() methods (the
 * write counterpart to getX() — see its own docblock), so the view
 * reads it back through the exact same getX() call:
 *
 *    // a controller action:
 *    public function home(Request $request): Page
 *    {
 *        $request->body->addJson('posts', $this->postService->all());
 *        return new Page($request, 'HomePage');
 *    }
 *
 *    // lib/page/HomePage.php
 *    <?php
 *    use Gerogo\Request;
 *    /** @var Request $request *\/
 *    $posts = $request->body->getJson('posts', []);
 *    $name = $request->query->getString('name', 'World'); // real query field — optional, 'World' if absent
 *    ?>
 *    <!doctype html>
 *    ...
 *    <?php foreach ($posts as $post): ?>
 *      <li><?= Page::html($post['text']) ?></li>
 *    <?php endforeach; ?>
 *
 * Validating real request data in the controller before returning works
 * exactly the same way — do the InputBag calls there (so a missing/
 * invalid required field 400s before the view ever runs) and just
 * return the Page:
 *
 *    public function show(Request $request): Page
 *    {
 *        $id = $request->params->getInt('id'); // 400s here if missing/invalid
 *        return new Page($request, 'UserPage');
 *    }
 *
 * A validation failure (InputBag, or anything throwing `PacketFailed`)
 * during a `#[PageController]` route's dispatch renders as a styled HTML
 * error page (see `Page::failed()`), not a JSON body — Kernel::handle()
 * decides which, from `Request::$isPage`.
 *
 * A controller action returning a `Page` gets it rendered and sent as
 * `text/html` automatically by `Kernel::handle()` — the same way
 * returning a `Packet` gets sent as JSON. Call `->send()` directly
 * instead if you want to write the response and stop right there (the
 * same pattern `Response::json()`/`Response::html()` already use).
 */
class Page
{
    private const DEFAULT_TEMPLATE = <<<'HTML'
    <!doctype html>
    <html lang="{{lang}}">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{title}}</title>
    {{styles}}
    </head>
    <body>
    {{body}}
    {{scripts}}
    </body>
    </html>
    HTML;

    private string $lang = 'en';
    private string $title = '';
    private string $body = '';

    /** @var list<string> */
    private array $styles = [];

    /** @var list<string> */
    private array $scripts = [];

    private ?string $view = null;

    /** Set only by failed() — bypasses view()/builder mode entirely; see render(). */
    private ?string $raw = null;

    /**
     * Shorthand for `(new Page())->view($view)` when `$view` is given —
     * PLUS, either way, `$request` (once set here) is what makes
     * `$request` itself available inside the view file's scope (see
     * renderView()). Both arguments are optional and independent: plain
     * `new Page()` (the builder mode) still works exactly as before.
     */
    public function __construct(private readonly ?Request $request = null, ?string $view = null)
    {
        if ($view !== null) {
            $this->view = $view;
        }
    }

    public function lang(string $lang): static
    {
        $this->lang = $lang;

        return $this;
    }

    public function title(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    /** The page's inner HTML — not escaped, since this is the whole point of a Page: you're writing markup, not text. */
    public function body(string $html): static
    {
        $this->body = $html;

        return $this;
    }

    /** Adds one <style> block; call repeatedly to add more. */
    public function style(string $css): static
    {
        $this->styles[] = $css;

        return $this;
    }

    /** Adds one <script> block; call repeatedly to add more. */
    public function script(string $js): static
    {
        $this->scripts[] = $js;

        return $this;
    }

    /**
     * Switches this Page to view mode: render `lib/page/{$name}.php`
     * instead of the `lib/page.html` template — a complete, hand-written
     * page, not filled-in placeholders. `title()`/`body()`/`style()`/
     * `script()` are ignored once a view is set.
     */
    public function view(string $name): static
    {
        $this->view = $name;

        return $this;
    }

    /**
     * The view name set via view() (or the constructor), or null if this
     * Page is using the template builder (title()/body()/...) instead.
     */
    public function getView(): ?string
    {
        return $this->view;
    }

    /**
     * Whether $controllerClass::$action declares Page (or Page as one
     * member of a union return type) as its return type — checked via
     * Reflection, since RouteCompiler's own compiled route table
     * carries no return-type info at all (Kernel::handle() only ever
     * needs the actual runtime value, never a static declaration).
     *
     * Shared, generic detection for any dev tool that needs to tell a
     * page-rendering route apart from a JSON/API one — e.g. Tester
     * excludes these from its request-testing UI, AppViewer includes
     * only these. Deliberately return-type-based only: which
     * namespace/directory a project happens to keep its page
     * controllers in is an app-specific convention, not something this
     * framework class should know about.
     */
    public static function isReturnedBy(string $controllerClass, string $action): bool
    {
        $type = (new ReflectionMethod($controllerClass, $action))->getReturnType();

        if ($type instanceof ReflectionNamedType) {
            return $type->getName() === self::class;
        }

        if ($type instanceof ReflectionUnionType) {
            foreach ($type->getTypes() as $member) {
                if ($member instanceof ReflectionNamedType && $member->getName() === self::class) {
                    return true;
                }
            }
        }

        return false;
    }

    public function render(): string
    {
        if ($this->raw !== null) {
            return $this->raw;
        }

        if ($this->view !== null) {
            return $this->renderView();
        }

        $styles = implode("\n", array_map(static fn (string $css): string => "<style>$css</style>", $this->styles));
        $scripts = implode("\n", array_map(static fn (string $js): string => "<script>$js</script>", $this->scripts));

        return strtr($this->loadTemplate(), [
            '{{lang}}' => htmlspecialchars($this->lang, ENT_QUOTES),
            '{{title}}' => htmlspecialchars($this->title, ENT_QUOTES),
            '{{styles}}' => $styles,
            '{{body}}' => $this->body,
            '{{scripts}}' => $scripts,
        ]);
    }

    public function send(int $status = 200): never
    {
        Response::html($this->render(), $status);
    }

    /** Escapes a value for safe HTML output — for use inside a view file, e.g. `<?= Page::html($post['text']) ?>`. */
    public static function html(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    private const DEFAULT_FAILED_TEMPLATE = <<<'HTML'
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{status}} {{reason}}</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #111; color: #eee; }
      .box { text-align: center; }
      h1 { font-size: 1.5rem; margin-bottom: .5rem; }
      p { color: #999; }
    </style>
    </head>
    <body>
    <div class="box">
      <h1>{{status}} {{reason}}</h1>
      <p>{{message}}</p>
    </div>
    </body>
    </html>
    HTML;

    /**
     * A styled HTML error page for a request-time failure ON A PAGE
     * ROUTE — the same idea as `CrashPage`, but for an ordinary caught
     * failure (validation, auth, a `PacketFailed` thrown anywhere) with
     * its real HTTP status, not `CrashPage`'s always-503 boot failure.
     * `Kernel::handle()` reaches for this instead of a JSON `Packet`
     * whenever `Request::$isPage` is true — see its own comment for
     * exactly when.
     *
     * Fills in **[lib/default.html](lib/default.html)**'s `{{status}}`/
     * `{{reason}}`/`{{message}}` placeholders — the same
     * customize-by-editing-a-file convention `lib/page.html` already
     * uses for the builder-mode template (see loadTemplate()); falls
     * back to an identical built-in template if that file is ever
     * missing or deleted. Bypasses view()/builder mode entirely (see
     * render()) — this is a COMPLETE document already, not a `{{body}}`
     * fragment to wrap in another one.
     */
    public static function failed(int $status, string $message): self
    {
        $page = new self();
        $page->raw = strtr($page->loadFailedTemplate(), [
            '{{status}}' => (string) $status,
            '{{reason}}' => self::statusText($status),
            '{{message}}' => self::html($message),
        ]);

        return $page;
    }

    /** A short, human reason phrase for the common statuses a Page route actually fails with — falls back to plain "Error" for anything else. */
    private static function statusText(int $status): string
    {
        return match ($status) {
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            409 => 'Conflict',
            422 => 'Unprocessable Entity',
            429 => 'Too Many Requests',
            500 => 'Internal Server Error',
            503 => 'Service Unavailable',
            default => 'Error',
        };
    }

    private function renderView(): string
    {
        $path = $this->basePath() . "/lib/page/{$this->view}.php";

        if (!is_file($path)) {
            throw new RuntimeException("Page view [{$this->view}] not found — expected $path.");
        }

        // A static closure so the view file's scope gets exactly
        // $request (if one was given — see the constructor), nothing
        // from $this — the same isolation a real templating engine
        // gives you.
        $render = static function (string $__viewPath, array $__vars): string {
            extract($__vars, EXTR_SKIP);
            ob_start();
            require $__viewPath;

            return (string) ob_get_clean();
        };

        return $render($path, $this->request !== null ? ['request' => $this->request] : []);
    }

    private function loadTemplate(): string
    {
        $path = $this->basePath() . '/lib/page.html';

        if (is_file($path)) {
            $template = file_get_contents($path);

            if ($template !== false) {
                return $template;
            }
        }

        return self::DEFAULT_TEMPLATE;
    }

    private function loadFailedTemplate(): string
    {
        $path = $this->basePath() . '/lib/default.html';

        if (is_file($path)) {
            $template = file_get_contents($path);

            if ($template !== false) {
                return $template;
            }
        }

        return self::DEFAULT_FAILED_TEMPLATE;
    }

    private function basePath(): string
    {
        return Runner::get('base_path') ?? getcwd();
    }
}
