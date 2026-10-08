import { joinFrontmatter, splitFrontmatter } from "./frontmatter.js";
import { layoutLines } from "./layout.js";
import { parseLines } from "./lines.js";
import { splitNarration } from "./narration.js";
import type { FormatOptions } from "./types.js";

/**
 * 原稿を小説形式に整える。行は削除しない。
 * - 地の文を句点ごとに改行し、全角スペースで字下げする
 * - 地の文とセリフの記号・表記をそろえる（normalizeNotation）
 * - 行間の空行をそろえる
 * - フロントマター、見出し、区切り、`@split`、コメント、本文の終わりを示す見出し（`## MOC`）から後ろはそのまま残す
 */
export function format(text: string, options: FormatOptions = {}): string {
  const { frontmatter, body } = splitFrontmatter(text);

  const lines = parseLines(body, options).flatMap((line) => (line.kind === "narration" ? splitNarration(line) : [line]));
  const formatted = layoutLines(lines, options);

  return frontmatter === null ? formatted : joinFrontmatter(frontmatter, formatted);
}
