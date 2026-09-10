// Dependency-free utility for converting a small subset of API-supplied
// HTML into markdown/plain text - matches the structured object format of
// DateFormatter/StringFormatter. Built for scheme details' own rich-text
// fields (SchemeDetailsUseCases.ts) but not specific to them, so any other
// screen getting HTML back from an endpoint can reuse it.

export const HtmlFormatter = {
  /**
   * Converts inline HTML to inline markdown: <strong>/<b> -> **bold**,
   * <a href> -> [text](url), <br> -> newline, everything else stripped,
   * plus the handful of entities these fields actually use decoded.
   */
  inlineToMarkdown(html: string): string {
    return html
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[ \t]+/g, ' ')
      .trim();
  },

  /**
   * Converts block HTML to a small markdown subset: <ul>/<ol><li> bullets/
   * numbered lines (tracking which so <li> knows "- " vs "N. "), <p>/
   * <blockquote> paragraphs, plus inlineToMarkdown's own inline bold/links.
   * Falls back to one plain paragraph if none of those block tags are
   * present at all. Unparseable, null, or empty input returns ''.
   */
  toMarkdown(html: unknown): string {
    if (typeof html !== 'string' || html.trim() === '') {return '';}

    let ordered = false;
    let orderedIndex = 0;
    const lines: string[] = [];
    const blockPattern =
      /<ol[^>]*>|<\/ol>|<ul[^>]*>|<\/ul>|<li[^>]*>([\s\S]*?)<\/li>|<blockquote[^>]*>([\s\S]*?)<\/blockquote>|<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match: RegExpExecArray | null;
    while ((match = blockPattern.exec(html))) {
      const [tag, liContent, quoteContent, pContent] = match;
      if (/^<ol/i.test(tag)) {
        ordered = true;
        orderedIndex = 0;
        continue;
      }
      if (/^<\/ol/i.test(tag) || /^<ul/i.test(tag)) {
        ordered = false;
        continue;
      }
      if (/^<\/ul/i.test(tag)) {continue;}

      if (liContent !== undefined) {
        const text = HtmlFormatter.inlineToMarkdown(liContent);
        if (!text) {continue;}
        orderedIndex += 1;
        lines.push(ordered ? `${orderedIndex}. ${text}` : `- ${text}`);
        continue;
      }
      const text = HtmlFormatter.inlineToMarkdown(quoteContent ?? pContent ?? '');
      if (text) {lines.push(quoteContent !== undefined ? `> ${text}` : text);}
    }

    // No <li>/<p>/<blockquote> at all - treat the whole string as one
    // paragraph rather than dropping it.
    return lines.length > 0 ? lines.join('\n') : HtmlFormatter.inlineToMarkdown(html);
  },

  findList(html: unknown): string[] {
    if (typeof html !== 'string' || html.trim() === '') {return [];}

    const items: string[] = [];
    const pattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const text = HtmlFormatter.inlineToMarkdown(match[1]);
      if (text) {items.push(text);}
    }
    return items;
  },
};
