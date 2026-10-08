import type { FormatOptions } from "./types.js";
/**
 * 原稿を小説形式に整える。行は削除しない。
 * - 地の文を句点ごとに改行し、全角スペースで字下げする
 * - 地の文とセリフの記号・表記をそろえる（normalizeNotation）
 * - 心中とセリフが地の文を挟まずに連続する位置に目印のコメントを挟む（narrationGapMarker）
 * - 行間の空行をそろえる
 * - フロントマター、見出し、区切り、`@split`、コメント、本文の終わりを示す見出し（`## MOC`）から後ろはそのまま残す
 */
export declare function format(text: string, options?: FormatOptions): string;
