
/**
 * Pre-processes markdown text to handle list structures and @split suffix.
 * - Flattens lists by removing parent items.
 * - Replaces lines with @split suffix with the separator.
 * - Strips list markers from leaf items.
 */
export function preprocessMarkdown(body: string, separator: string = "＊＊＊"): string {
  const lines = body.split(/\r\n|\n|\r/);
  const resultLines: string[] = [];

  // Metadata for each line to help with lookahead
  const metaLines = lines.map(line => {
    // Check indentation level (spaces at start)
    const matchIndent = line.match(/^(\s*)/);
    const indentLevel = matchIndent ? matchIndent[1].length : 0;

    // Check if it is a list item
    const trimmed = line.trim();
    const isList = /^[-*]\s/.test(trimmed);

    // Check for @split
    const hasSplit = trimmed.includes("@split");

    return {
      original: line,
      trimmed,
      indentLevel,
      isList,
      hasSplit
    };
  });

  for (let i = 0; i < metaLines.length; i++) {
    const current = metaLines[i];

    // If it's a split line, replace immediately with separator
    if (current.hasSplit) {
      resultLines.push(separator);
      continue;
    }

    // If it's a list item
    if (current.isList) {
      // Look ahead to find the next non-empty line to compare indentation
      let isParent = false;
      for (let j = i + 1; j < metaLines.length; j++) {
        const next = metaLines[j];
        if (next.trimmed === "") continue; // Skip empty lines

        // If next line is more indented, current is a parent
        if (next.indentLevel > current.indentLevel) {
          isParent = true;
        }
        break; // Stop after checking the immediate next content line
      }

      if (isParent) {
        // Skip parent items
        continue;
      }

      // It's a leaf item: strip list marker and add to result
      // Remove "- " or "* " from the start of trimmed string
      const stripped = current.trimmed.replace(/^[-*]\s+/, "");
      resultLines.push(stripped);
    } else {
      // Not a list item (or empty line), keep as is
      resultLines.push(current.original);
    }
  }

  return resultLines.join("\n");
}
