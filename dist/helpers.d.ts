import { FormatNovelTextOptions, ProcessedLine } from "./types";
/**
 * 本文を行ごとに処理して小説形式に整形します
 */
export declare function processNovelLines(body: string, options?: FormatNovelTextOptions): ProcessedLine[];
/**
 * 処理された行データからテキストを再構築します
 */
export declare function reconstructNovelText(processedLines: ProcessedLine[]): string;
