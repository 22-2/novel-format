import type { Line } from "./lines.js";
import type { FormatOptions } from "./types.js";

/**
 * 行を並べ、行間の空行数をルールに従ってそろえたテキストを返す。
 * 出力は先頭の空行なし、末尾は改行1つ。
 */
export function layoutLines(
  lines: readonly Line[],
  { preserveDialogueSpacing = false }: Pick<FormatOptions, "preserveDialogueSpacing"> = {},
): string {
  const output: string[] = [];
  // 空行ルールの基準にする直前の行。コメント行は前後の関係に影響させないため含めない
  let previous: Line | undefined;
  let afterBreak = false;

  for (const line of lines) {
    if (line.kind === "break") {
      afterBreak = previous !== undefined;
      continue;
    }

    if (output.length > 0) {
      const blankLines =
        line.kind === "comment"
          ? line.blankLinesBefore
          : blankLinesBetween(previous, line, afterBreak, preserveDialogueSpacing);
      output.push(...Array<string>(blankLines).fill(""));
    }
    output.push(line.text);

    if (line.kind !== "comment") {
      previous = line;
      afterBreak = false;
    }
  }

  return output.length === 0 ? "" : `${output.join("\n")}\n`;
}

/**
 * 空行ルール（上にあるものほど優先）
 * 1. 区切り行の前後は空行3つ
 * 2. 見出しの前後、見出しを消した位置、本文の終わりを示す見出し（trailer）の前は空行2つ
 * 3. セリフ同士の間は空行なし（preserveDialogueSpacing なら元の空行数のまま）
 * 4. セリフと地の文の境目は空行2つ
 * 5. それ以外は、元の空行があれば空行2つ、なければ空行なし
 */
function blankLinesBetween(
  previous: Line | undefined,
  current: Line,
  afterBreak: boolean,
  preserveDialogueSpacing: boolean,
): number {
  if (isSectionBreak(current) || (previous !== undefined && isSectionBreak(previous))) return 3;
  if (current.kind === "heading" || current.kind === "trailer" || previous?.kind === "heading" || afterBreak) return 2;
  if (previous?.kind === "dialogue" && current.kind === "dialogue") {
    return preserveDialogueSpacing ? current.blankLinesBefore : 0;
  }
  if (previous !== undefined && (previous.kind === "dialogue") !== (current.kind === "dialogue")) return 2;
  return current.blankLinesBefore > 0 ? 2 : 0;
}

function isSectionBreak(line: Line): boolean {
  return line.kind === "separator" || line.kind === "split";
}
