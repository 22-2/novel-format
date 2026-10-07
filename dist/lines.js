import { SECTION_SEPARATOR, SPLIT_MARKER } from "./constants.js";
import { COMMENT_DELIMITER, removeInlineComments, togglesCommentBlock } from "./comments.js";
const HEADING_PATTERN = /^#{1,6}\s/;
const DIALOGUE_BRACKETS = {
    "「": "」",
    "『": "』",
    "（": "）",
};
/** 本文を行に分け、空行を除いた各行を種類ごとに分類する */
export function parseLines(body, { separator = SECTION_SEPARATOR, commentPrefixes = [] } = {}) {
    const lines = [];
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
function classifyLine(raw, trimmed, separator, commentPrefixes) {
    // 見出しはコメント接頭辞より優先する。
    // 理由: `#` で始まるメモ行をコメント扱いにしたいとき、`## 見出し` まで消えないようにするため。
    if (HEADING_PATTERN.test(trimmed))
        return "heading";
    if (commentPrefixes.some((prefix) => raw.startsWith(prefix)))
        return "comment";
    if (trimmed.includes(SPLIT_MARKER))
        return "split";
    // 空文字は全ての行に含まれてしまうため、区切り記号として扱わない
    if (separator !== "" && trimmed.includes(separator))
        return "separator";
    if (isDialogue(removeInlineComments(trimmed).trim()))
        return "dialogue";
    return "narration";
}
function isDialogue(text) {
    const closer = DIALOGUE_BRACKETS[text.charAt(0)];
    return closer !== undefined && text.endsWith(closer);
}
