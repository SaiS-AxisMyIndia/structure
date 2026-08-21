<?php

use ApiPro\Page;

/**
 * A sample Page rendered in view mode — the whole document, doctype
 * included, is hand-written PHP+HTML right here, not filled into
 * lib/page.html's placeholders. $posts arrived via
 * (new Page())->props(['posts' => ...]) in HomeController::home() —
 * it's a real local variable in this file's scope, nothing more.
 *
 * @var list<array{id: int, text: string, createdAt: string}> $posts
 */
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>api-pro</title>
<style>
  :root { --bg: #0f1720; --panel: #182430; --border: #2b3a4a; --text: #e6edf3; --muted: #8b9bab; --accent: #4da3ff; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); }
  main { max-width: 640px; margin: 0 auto; padding: 48px 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  p.sub { color: var(--muted); font-size: 13px; margin: 0 0 32px; }
  form { display: flex; gap: 8px; margin-bottom: 24px; }
  input[type=text] { flex: 1; background: var(--panel); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 10px 12px; font-size: 14px; }
  button { background: var(--accent); color: #06192e; border: none; border-radius: 6px; padding: 10px 18px; font-weight: 600; font-size: 14px; cursor: pointer; }
  button:hover { opacity: .9; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; margin-bottom: 8px; }
  li .text { display: block; margin-bottom: 4px; }
  li .when { color: var(--muted); font-size: 11px; font-family: ui-monospace, monospace; }
  .error { color: #d64545; font-size: 13px; margin: -8px 0 16px; display: none; }
</style>
</head>
<body>
<main>
  <h1>api-pro</h1>
  <p class="sub">
    A sample page — <code>ApiPro\Page::view('HomePage')</code>, props passed
    in from <code>HomeController</code>, list posts to it right here.
  </p>

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
</main>

<script>
  document.getElementById('post-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = document.getElementById('post-text');
    const errorEl = document.getElementById('post-error');
    const text = input.value.trim();

    errorEl.style.display = 'none';

    if (!text) return;

    try {
      const res = await fetch('/api/api-pro/posts', {
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
