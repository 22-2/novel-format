/** Obsidianのコメント記法 `%%コメント%%` の区切り */
export declare const COMMENT_DELIMITER = "%%";
/** 行の中の `%%…%%` の範囲を [開始, 終了) の組で返す */
export declare function findInlineComments(line: string): Array<[start: number, end: number]>;
/** 行の中の `%%…%%` を取り除く */
export declare function removeInlineComments(line: string): string;
/** 行の中の `%%` の数が奇数なら、コメントブロックの開始または終了をまたぐ */
export declare function togglesCommentBlock(line: string): boolean;
/**
 * テキストから `%%…%%` を取り除く。閉じていないコメントは末尾までをコメントとみなす（Obsidianと同じ挙動）。
 * コメントだけの行は改行ごと取り除く。
 * 理由: コメントだけの行を空行として残すと、整形時に余計な空行が入るため。
 */
export declare function stripObsidianComments(text: string): string;
