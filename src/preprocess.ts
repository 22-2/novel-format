import { SECTION_SEPARATOR } from "./constants";

/**
 * Pre-processes markdown text to handle list structures and @split suffix.
 * - Flattens lists by removing parent items.
 * - Replaces lines with @split suffix with the separator.
 * - Strips list markers from leaf items.
 * - Between sibling parent groups, inserts exactly 2 blank lines.
 * - Empty leaf items ("- " with no content) become blank lines within a group.
 * - Leading/trailing empty leaf items within a group are stripped.
 */
export function preprocessMarkdown(body: string, separator: string = SECTION_SEPARATOR): string {
  const rawLines = body.split(/\r\n|\n|\r/);

  // ---- Step 1: Annotate each line ----
  const meta = rawLines.map(raw => {
    const indent = raw.match(/^(\s*)/)?.[1]?.length ?? 0;
    const trimmed = raw.trim();
    const isBlank = trimmed === "";
    const hasSplit = !isBlank && trimmed.includes("@split");
    // Matches "- text", "- ", "-", "* text", "* ", "*"
    const listMatch = !hasSplit ? trimmed.match(/^[-*](\s(.*))?$/) : null;
    const isList = listMatch !== null;
    // Content after the list marker; null means the item is empty
    const listContent = isList ? (listMatch![2]?.trim() || null) : null;
    return { raw, indent, trimmed, isBlank, hasSplit, isList, listContent };
  });

  // ---- Step 2: Parent detection ----
  // A list item is a "parent" if the next non-blank list item is more indented.
  function isParent(idx: number): boolean {
    const cur = meta[idx]!;
    for (let j = idx + 1; j < meta.length; j++) {
      const nxt = meta[j]!;
      if (nxt.isBlank) continue;
      if (nxt.isList && nxt.indent > cur.indent) return true;
      break;
    }
    return false;
  }

  // ---- Step 3: Process ----
  const resultLines: string[] = [];

  // Current parent-group buffer.
  // null entry = blank line (from an empty leaf item or a blank line inside a list block).
  let groupBuffer: Array<string | null> | null = null;
  // Whether we have already emitted at least one list group to resultLines.
  let hadPreviousGroup = false;

  function flushGroup() {
    if (groupBuffer === null) return;

    // Trim leading blank entries
    let a = 0;
    while (a < groupBuffer.length && groupBuffer[a] === null) a++;
    // Trim trailing blank entries
    let b = groupBuffer.length - 1;
    while (b >= a && groupBuffer[b] === null) b--;

    const trimmed = groupBuffer.slice(a, b + 1);
    groupBuffer = null;

    if (trimmed.length === 0) return;

    if (hadPreviousGroup) {
      // Insert exactly 2 blank lines between groups
      resultLines.push("", "");
    }
    for (const entry of trimmed) {
      resultLines.push(entry ?? "");
    }
    hadPreviousGroup = true;
  }

  for (let i = 0; i < meta.length; i++) {
    const line = meta[i]!;

    // @split: flush any open group then emit separator
    if (line.hasSplit) {
      flushGroup();
      hadPreviousGroup = false;
      resultLines.push(separator);
      continue;
    }

    // Parent list item: start a new group (flushing the previous one)
    if (line.isList && isParent(i)) {
      flushGroup();
      groupBuffer = [];
      continue;
    }

    // Leaf list item (possibly empty)
    if (line.isList) {
      if (groupBuffer === null) {
        // Leaf without a preceding parent — treat as its own group
        groupBuffer = [];
      }
      groupBuffer.push(line.listContent); // null for empty, string for content
      continue;
    }

    // Blank line inside a list group → becomes a blank entry in the group
    if (line.isBlank && groupBuffer !== null) {
      groupBuffer.push(null);
      continue;
    }

    // Plain non-list line: flush any open group, then pass through as-is
    flushGroup();
    hadPreviousGroup = false;
    resultLines.push(line.raw);
  }

  flushGroup();

  return resultLines.join("\n");
}
