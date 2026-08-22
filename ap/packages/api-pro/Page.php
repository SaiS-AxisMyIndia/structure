<?php

declare(strict_types=1);

namespace ApiPro;

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
 *    included) is hand-written PHP+HTML there, with `props()` extracted
 *    into real local variables in that file's scope:
 *
 *    return (new Page())
 *        ->view('HomePage')
 *        ->props(['posts' => $this->postService->all()]);
 *
 *    // lib/page/HomePage.php:
 *    <?php /** @var array $posts *\/ ?>
 *    <!doctype html>
 *    ...
 *    <?php foreach ($posts as $post): ?>
 *      <li><?= Page::html($post['text']) ?></li>
 *    <?php endforeach; ?>
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

    /** @var array<string, mixed> */
    private array $props = [];

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
     * Data made available inside the view file as real local variables
     * (e.g. `props(['posts' => $list])` -> `$posts` inside HomePage.php)
     * — merged with whatever was set before, so you can call this more
     * than once. Only meaningful together with `view()`.
     *
     * @param array<string, mixed> $data
     */
    public function props(array $data): static
    {
        $this->props = [...$this->props, ...$data];

        return $this;
    }

    /**
     * Reads back whatever props() has accumulated so far — e.g. for a
     * dev tool (AppViewer) that wants to show what a page was actually
     * rendered with, without re-parsing its rendered HTML output.
     *
     * @return array<string, mixed>
     */
    public function getProps(): array
    {
        return $this->props;
    }

    /**
     * The view name set via view(), or null if this Page is using the
     * template builder (title()/body()/...) instead — e.g. for AppViewer
     * to build a brand-new Page with the same view but different props,
     * without needing to know in advance which view a given controller
     * action happens to use.
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

    private function renderView(): string
    {
        $path = $this->basePath() . "/lib/page/{$this->view}.php";

        if (!is_file($path)) {
            throw new RuntimeException("Page view [{$this->view}] not found — expected $path.");
        }

        // A static closure so the view file's scope gets exactly the
        // extracted props, nothing from $this — the same isolation a
        // real templating engine gives you.
        $render = static function (string $__viewPath, array $__props): string {
            extract($__props, EXTR_SKIP);
            ob_start();
            require $__viewPath;

            return (string) ob_get_clean();
        };

        return $render($path, $this->props);
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

    private function basePath(): string
    {
        return Runner::get('base_path') ?? getcwd();
    }
}
