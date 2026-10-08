import { NARRATION_GAP_MARKER, SECTION_SEPARATOR, SPLIT_MARKER, TRAILER_HEADING } from "./constants.js";
import { COMMENT_DELIMITER, removeInlineComments, togglesCommentBlock } from "./comments.js";
import { normalizeNotation } from "./notation.js";
import type { FormatOptions } from "./types.js";

/**
 * 行の種類
 * - narration: 地の文
 * - dialogue: セリフ（対応するカッコで始まり、閉じカッコで終わる行。複数行にわたる `『』` の各行も含む）
 * - heading: Markdownの見出し（`#` 〜 `######` + 空白）
 * - separator: 区切り記号を含む行
 * - split: 区切りの目印（`@split`）を含む行。`## 翌朝@split` のような見出しも含む
 * - comment: `%%…%%` のコメント行、または commentPrefixes で始まる行
 * - gap: 地の文を入れる位置を示す目印（narrationGapMarker）の行。地の文と同じ空行の扱いにする
 * - trailer: 本文の終わりを示す見出し（`## MOC`）から末尾まで。テキストは元のまま持つ
 * - break: compile で見出しを消した位置。テキストは出力せず、前後の空行だけを決める
 */
export type LineKind =
  | "narration"
  | "dialogue"
  | "heading"
  | "separator"
  | "split"
  | "comment"
  | "gap"
  | "trailer"
  | "break";

/**
 * セリフのカッコの種類
 * - speech: `「」` のセリフ
 * - thought: `（）` の心中。視点人物の思考なので、話者が分かる
 * - quote: `『』` の声・表示。表示文言や人ならざる声で、視点人物の発言ではない
 */
export type DialogueBracket = "speech" | "thought" | "quote";

export interface Line {
  kind: LineKind;
  text: string;
  /** 元テキストでこの行の直前にあった連続空行の数 */
  blankLinesBefore: number;
  /** kind が dialogue のときのカッコの種類 */
  bracket?: DialogueBracket;
}

const HEADING_PATTERN = /^#{1,6}\s/;

const DIALOGUE_BRACKETS: Readonly<Record<string, { closer: string; bracket: DialogueBracket }>> = {
  "「": { closer: "」", bracket: "speech" },
  "『": { closer: "』", bracket: "quote" },
  "（": { closer: "）", bracket: "thought" },
};

/** 複数行にわたってよいカッコ。表示・再生された文言は、開きから閉じまでを連続した行で書くため */
const MULTILINE_OPEN = "『";
const MULTILINE_CLOSE = "』";

/** 本文を行に分け、空行を除いた各行を種類ごとに分類する。地の文とセリフの表記は normalizeNotation でそろえる */
export function parseLines(
  body: string,
  {
    separator = SECTION_SEPARATOR,
    commentPrefixes = [],
    trailerHeading = TRAILER_HEADING,
    narrationGapMarker = NARRATION_GAP_MARKER,
  }: Pick<
    FormatOptions,
    "separator" | "commentPrefixes" | "trailerHeading" | "narrationGapMarker"
  > = {},
): Line[] {
  const rawLines = body.split(/\r\n|\n|\r/);
  const lines: Line[] = [];
  let blankLinesBefore = 0;
  let inCommentBlock = false;
  // 閉じていない `『` の数。0より大きい間は、続く行を複数行の `『』` の一部とみなす
  let openQuotes = 0;

  for (const [index, raw] of rawLines.entries()) {
    const trimmed = raw.trim();

    // 目印は `%%…%%` の形をしているため、コメントの判定より先に見る。
    // 理由: コメント行にすると前後の空行が元のまま残り、再整形で空行二行が保てないため。
    if (!inCommentBlock && narrationGapMarker !== "" && trimmed === narrationGapMarker) {
      lines.push({ kind: "gap", text: trimmed, blankLinesBefore });
      blankLinesBefore = 0;
      openQuotes = 0;
      continue;
    }

    // コメントブロックの中は空行も含めてコメントの一部なので、空行の判定より先に見る
    const isCommentBlockLine = inCommentBlock || trimmed.startsWith(COMMENT_DELIMITER);

    if (!isCommentBlockLine && trimmed === "") {
      blankLinesBefore++;
      // 『』の中に空行は入らないので、閉じ忘れがあっても空行で打ち切る。
      // 理由: 打ち切らないと、閉じ忘れ以降の段落がすべてセリフ扱いになり、段落間の空行が消えるため。
      openQuotes = 0;
      continue;
    }

    if (!isCommentBlockLine && isTrailerHeading(trimmed, trailerHeading)) {
      lines.push({ kind: "trailer", text: rawLines.slice(index).join("\n").trimEnd(), blankLinesBefore });
      return lines;
    }

    const structuralKind = isCommentBlockLine ? "comment" : classifyStructure(raw, trimmed, separator, commentPrefixes);
    if (structuralKind === "comment") {
      // コメント行は中身を変えずに残すため、行頭の空白も保持する
      lines.push({ kind: "comment", text: raw.trimEnd(), blankLinesBefore });
    } else if (structuralKind !== null) {
      lines.push({ kind: structuralKind, text: trimmed, blankLinesBefore });
      openQuotes = 0;
    } else {
      const text = normalizeNotation(trimmed);
      const content = removeInlineComments(text).trim();
      const continuesQuote = openQuotes > 0;
      const unclosedQuotes = countUnclosedQuotes(content);
      const startsQuote = !continuesQuote && content.startsWith(MULTILINE_OPEN) && unclosedQuotes > 0;
      const isQuoteLine = continuesQuote || startsQuote;
      const closedBracket = dialogueBracketOf(content);
      const kind = isQuoteLine || closedBracket !== undefined ? "dialogue" : "narration";

      lines.push({
        kind,
        text,
        blankLinesBefore,
        ...(kind === "dialogue" && { bracket: isQuoteLine ? "quote" : closedBracket }),
      });
      openQuotes = isQuoteLine ? Math.max(0, openQuotes + unclosedQuotes) : 0;
    }
    blankLinesBefore = 0;

    if (togglesCommentBlock(raw)) {
      inCommentBlock = !inCommentBlock;
    }
  }

  return lines;
}

function isTrailerHeading(trimmed: string, trailerHeading: string): boolean {
  if (trailerHeading === "") return false;
  return HEADING_PATTERN.test(trimmed) && trimmed.replace(/^#+/, "").trim() === trailerHeading;
}

/** 見出し・コメント・区切りなど、本文以外の行の種類を返す。本文の行なら null */
function classifyStructure(
  raw: string,
  trimmed: string,
  separator: string,
  commentPrefixes: readonly string[],
): Exclude<LineKind, "narration" | "dialogue" | "trailer" | "break"> | null {
  // 見出しはコメント接頭辞より優先する。
  // 理由: `#` で始まるメモ行をコメント扱いにしたいとき、`## 見出し` まで消えないようにするため。
  if (HEADING_PATTERN.test(trimmed)) return trimmed.includes(SPLIT_MARKER) ? "split" : "heading";
  if (commentPrefixes.some((prefix) => raw.startsWith(prefix))) return "comment";
  if (trimmed.includes(SPLIT_MARKER)) return "split";
  // 空文字は全ての行に含まれてしまうため、区切り記号として扱わない
  if (separator !== "" && trimmed.includes(separator)) return "separator";
  return null;
}

/** 対応するカッコで始まり閉じカッコで終わる行なら、そのカッコの種類を返す */
function dialogueBracketOf(text: string): DialogueBracket | undefined {
  const entry = DIALOGUE_BRACKETS[text.charAt(0)];
  return entry !== undefined && text.endsWith(entry.closer) ? entry.bracket : undefined;
}

function countUnclosedQuotes(text: string): number {
  return text.split(MULTILINE_OPEN).length - text.split(MULTILINE_CLOSE).length;
}
