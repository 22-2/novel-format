import type { CompileOptions } from "./types.js";
/**
 * 原稿から執筆用の要素を取り除き、そのまま投稿できる小説テキストにする。
 * - フロントマター、`%%コメント%%`、commentPrefixes で始まる行、本文の終わりを示す見出し（`## MOC`）から後ろを除去する
 * - 見出しを除去し、その位置を空行2つにする
 * - `@split` と `@split` の付いた見出しを区切り記号に置き換える
 * - そのうえで format と同じ整形をする
 */
export declare function compile(text: string, options?: CompileOptions): string;
