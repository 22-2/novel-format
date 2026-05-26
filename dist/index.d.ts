import type { FormatNovelTextOptions } from "./types.js";
export declare function format(text: string, { separator, preserveDialogueSpacing }?: FormatNovelTextOptions): string;
export * from "./types.js";
export * from "./constants.js";
export { preprocessMarkdown } from "./preprocess.js";
