// Dependency-free utility for string formatting, sanitization, and code extraction.
// Matches the structured object format of DateFormatter. Unparseable, null,
// or empty inputs return safe fallbacks ('', []) rather than throwing errors.

export const StringFormatter = {
  /**
   * Capitalizes the first letter of each sentence in a text.
   * Preserves surrounding punctuation and whitespace.
   */
  upperSentence(text: string | null | undefined): string {
    if (!text || typeof text !== 'string') return '';

    return text.replace(/(^\s*|[.!?]\s*)([a-z])/g, (_, separator, letter) => {
      return separator + letter.toUpperCase();
    });
  },

  /**
   * Converts a string into a clean code identifier (snake_case).
   * Removes special characters/accents, replaces spaces with underscores,
   * forces lowercase, and prevents leading/trailing underscores.
   */
  toCode(text: string | null | undefined): string {
    if (!text || typeof text !== 'string') return '';

    return text
      .trim()
      .toLowerCase()
      .normalize('NFD') // Normalizes accented characters (e.g., é -> e)
      .replace(/[\u0300-\u036f]/g, '') // Removes diacritics
      .replace(/[^a-z0-9\s_-]/g, '') // Removes special characters
      .replace(/[\s-]+/g, '_') // Replaces spaces and hyphens with a single underscore
      .replace(/^_+|_+$/g, ''); // Trims leading/trailing underscores
  },

  /**
   * Extracts code-like substrings (valid snake_case/alphanumeric tokens) from raw text.
   * Filters out duplicates and returns an array of unique identifiers.
   */
  extractCode(text: string | null | undefined): string[] {
    if (!text || typeof text !== 'string') return [];

    const matches = text.match(/\b[a-z0-9_]+\b/gi);
    if (!matches) return [];

    // Normalizes extracted tokens using toCode and returns unique non-empty results
    const uniqueCodes = new Set(
      matches.map((token) => this.toCode(token)).filter(Boolean)
    );

    return Array.from(uniqueCodes);
  },
};