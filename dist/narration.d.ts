import type { Line } from "./lines.js";
/** 地の文の行を句点ごとの段落に分け、それぞれを全角スペースで字下げする */
export declare function splitNarration(line: Line): Line[];
