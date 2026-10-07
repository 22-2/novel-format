import { findInlineComments } from "./comments.js";
const INDENT = "　";
/**
 * 段落を区切る句点。閉じカッコが続く句点では区切らない。
 * 理由: `彼は「はい。」と言った。` のような文で、カッコの途中で改行しないため。
 */
const SENTENCE_END_PATTERN = /。(?![」』）])/g;
/** 地の文の行を句点ごとの段落に分け、それぞれを全角スペースで字下げする */
export function splitNarration(line) {
    return splitSentences(line.text).map((sentence, index) => ({
        kind: "narration",
        text: `${INDENT}${sentence}`,
        blankLinesBefore: index === 0 ? line.blankLinesBefore : 0,
    }));
}
function splitSentences(text) {
    const comments = findInlineComments(text);
    // %%コメント%% の中の句点で区切るとコメントが壊れるため、コメントの外側の句点だけで区切る
    const isInComment = (position) => comments.some(([start, end]) => start < position && position <= end);
    const sentences = [];
    let start = 0;
    for (const match of text.matchAll(SENTENCE_END_PATTERN)) {
        const end = match.index + match[0].length;
        if (isInComment(end))
            continue;
        sentences.push(text.slice(start, end));
        start = end;
    }
    sentences.push(text.slice(start));
    return sentences.map((sentence) => sentence.trim()).filter((sentence) => sentence !== "");
}
