import { SECTION_SEPARATOR, SPLIT_MARKER } from "./constants.js";
import { COMMENT_DELIMITER, removeInlineComments, togglesCommentBlock } from "./comments.js";
import type { FormatOptions } from "./types.js";

/**
 * 行の種類
 * - narration: 地の文
 * - dialogue: セリフ（対応するカッコで始まり、閉じカッコで終わる行）
 * - heading: Markdownの見出し（`#` 〜 `######` + 空白）
 * - separator: 区切り記号を含む行
 * - split: 区切りの目印（`@split`）を含む行
 * - comment: `%%…%%` のコメント行、または commentPrefixes で始まる行
 * - break: compile で見出しを消した位置。テキストは出力せず、前後の空行だけを決める
 */
export type LineKind = "narration" | "dialogue" | "heading" | "separator" | "split" | "comment" | "break";

export interface Line {
  kind: LineKind;
  text: string;
  /** 元テキストでこの行の直前にあった連続空行の数 */
  blankLinesBefore: number;
}

const HEADING_PATTERN = /^#{1,6}\s/;

const DIALOGUE_BRACKETS: Readonly<Record<string, string>> = {
  "「": "」",
  "『": "』",
  "（": "）",
};

/** 本文を行に分け、空行を除いた各行を種類ごとに分類する */
export function parseLines(
  body: string,
  { separator = SECTION_SEPARATOR, commentPrefixes = [] }: Pick<FormatOptions, "separator" | "commentPrefixes"> = {},
): Line[] {
  const lines: Line[] = [];
  let blankLinesBefore = 0;
  let inCommentBlock = false;

  for (const raw of body.split(/\r\n|\n|\r/)) {
    const trimmed = raw.trim();
    // コメントブロックの中は空行も含めてコメントの一部なので、空行の判定より先に見る
    const isCommentBlockLine = inCommentBlock || trimmed.startsWith(COMMENT_DELIMITER);

    if (!isCommentBlockLine && trimmed === "") {
      blankLinesBefore++;
      continue;
    }

    const kind = isCommentBlockLine ? "comment" : classifyLine(raw, trimmed, separator, commentPrefixes);
    // コメント行は中身を変えずに残すため、行頭の空白も保持する
    lines.push({ kind, text: kind === "comment" ? raw.trimEnd() : trimmed, blankLinesBefore });
    blankLinesBefore = 0;

    if (togglesCommentBlock(raw)) {
      inCommentBlock = !inCommentBlock;
    }
  }

  return lines;
}

function classifyLine(raw: string, trimmed: string, separator: string, commentPrefixes: readonly string[]): LineKind {
  // 見出しはコメント接頭辞より優先する。
  // 理由: `#` で始まるメモ行をコメント扱いにしたいとき、`## 見出し` まで消えないようにするため。
  if (HEADING_PATTERN.test(trimmed)) return "heading";
  if (commentPrefixes.some((prefix) => raw.startsWith(prefix))) return "comment";
  if (trimmed.includes(SPLIT_MARKER)) return "split";
  // 空文字は全ての行に含まれてしまうため、区切り記号として扱わない
  if (separator !== "" && trimmed.includes(separator)) return "separator";
  if (isDialogue(removeInlineComments(trimmed).trim())) return "dialogue";
  return "narration";
}

function isDialogue(text: string): boolean {
  const closer = DIALOGUE_BRACKETS[text.charAt(0)];
  return closer !== undefined && text.endsWith(closer);
}
