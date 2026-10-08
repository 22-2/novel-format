import { SECTION_SEPARATOR, SPLIT_MARKER, TRAILER_HEADING } from "./constants.js";
import { COMMENT_DELIMITER, removeInlineComments, togglesCommentBlock } from "./comments.js";
import { normalizeNotation } from "./notation.js";
const HEADING_PATTERN = /^#{1,6}\s/;
const DIALOGUE_BRACKETS = {
    "「": { closer: "」", bracket: "speech" },
    "『": { closer: "』", bracket: "quote" },
    "（": { closer: "）", bracket: "thought" },
};
/** 複数行にわたってよいカッコ。表示・再生された文言は、開きから閉じまでを連続した行で書くため */
const MULTILINE_OPEN = "『";
const MULTILINE_CLOSE = "』";
/** 本文を行に分け、空行を除いた各行を種類ごとに分類する。地の文とセリフの表記は normalizeNotation でそろえる */
export function parseLines(body, { separator = SECTION_SEPARATOR, commentPrefixes = [], trailerHeading = TRAILER_HEADING, } = {}) {
    const rawLines = body.split(/\r\n|\n|\r/);
    const lines = [];
    let blankLinesBefore = 0;
    let inCommentBlock = false;
    // 閉じていない `『` の数。0より大きい間は、続く行を複数行の `『』` の一部とみなす
    let openQuotes = 0;
    for (const [index, raw] of rawLines.entries()) {
        const trimmed = raw.trim();
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
        }
        else if (structuralKind !== null) {
            lines.push({ kind: structuralKind, text: trimmed, blankLinesBefore });
            openQuotes = 0;
        }
        else {
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
function isTrailerHeading(trimmed, trailerHeading) {
    if (trailerHeading === "")
        return false;
    return HEADING_PATTERN.test(trimmed) && trimmed.replace(/^#+/, "").trim() === trailerHeading;
}
/** 見出し・コメント・区切りなど、本文以外の行の種類を返す。本文の行なら null */
function classifyStructure(raw, trimmed, separator, commentPrefixes) {
    // 見出しはコメント接頭辞より優先する。
    // 理由: `#` で始まるメモ行をコメント扱いにしたいとき、`## 見出し` まで消えないようにするため。
    if (HEADING_PATTERN.test(trimmed))
        return trimmed.includes(SPLIT_MARKER) ? "split" : "heading";
    if (commentPrefixes.some((prefix) => raw.startsWith(prefix)))
        return "comment";
    if (trimmed.includes(SPLIT_MARKER))
        return "split";
    // 空文字は全ての行に含まれてしまうため、区切り記号として扱わない
    if (separator !== "" && trimmed.includes(separator))
        return "separator";
    return null;
}
/** 対応するカッコで始まり閉じカッコで終わる行なら、そのカッコの種類を返す */
function dialogueBracketOf(text) {
    const entry = DIALOGUE_BRACKETS[text.charAt(0)];
    return entry !== undefined && text.endsWith(entry.closer) ? entry.bracket : undefined;
}
function countUnclosedQuotes(text) {
    return text.split(MULTILINE_OPEN).length - text.split(MULTILINE_CLOSE).length;
}
