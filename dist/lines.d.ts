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
/** 本文を行に分け、空行を除いた各行を種類ごとに分類する */
export declare function parseLines(body: string, { separator, commentPrefixes }?: Pick<FormatOptions, "separator" | "commentPrefixes">): Line[];
