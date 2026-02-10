/**
 * Pre-processes markdown text to handle list structures and @split suffix.
 * - Flattens lists by removing parent items.
 * - Replaces lines with @split suffix with the separator.
 * - Strips list markers from leaf items.
 */
export declare function preprocessMarkdown(body: string, separator?: string): string;
