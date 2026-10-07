import type { Line } from "./lines.js";
import type { FormatOptions } from "./types.js";
/**
 * 行を並べ、行間の空行数をルールに従ってそろえたテキストを返す。
 * 出力は先頭の空行なし、末尾は改行1つ。
 */
export declare function layoutLines(lines: readonly Line[], { preserveDialogueSpacing }?: Pick<FormatOptions, "preserveDialogueSpacing">): string;
