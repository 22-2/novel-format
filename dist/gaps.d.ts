import type { Line } from "./lines.js";
/**
 * 同じ人物のセリフと心中が、地の文を挟まずに連続している位置に目印のコメントを挟む。
 * marker が空文字なら何もしない。
 *
 * セリフの話者はテキストから判別できないため、心中に接するセリフは話者が違う場合もある。
 * 書き手が確かめる目印として入れ、自動で書き換えはしない。
 */
export declare function insertNarrationGapMarkers(lines: readonly Line[], marker: string): Line[];
