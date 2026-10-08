import { stripObsidianComments } from "./comments.js";
import { SECTION_SEPARATOR } from "./constants.js";
import { splitFrontmatter } from "./frontmatter.js";
import { layoutLines } from "./layout.js";
import { parseLines } from "./lines.js";
import { splitNarration } from "./narration.js";
/**
 * 原稿から執筆用の要素を取り除き、そのまま投稿できる小説テキストにする。
 * - フロントマター、`%%コメント%%`、commentPrefixes で始まる行、本文の終わりを示す見出し（`## MOC`）から後ろを除去する
 * - 見出しを除去し、その位置を空行2つにする
 * - `@split` と `@split` の付いた見出しを区切り記号に置き換える
 * - そのうえで format と同じ整形をする
 */
export function compile(text, options = {}) {
    const { body } = splitFrontmatter(text);
    const separator = options.separator ?? SECTION_SEPARATOR;
    const lines = parseLines(stripObsidianComments(body), options)
        .flatMap((line) => compileLine(line, separator))
        .flatMap((line) => (line.kind === "narration" ? splitNarration(line) : [line]));
    return layoutLines(lines);
}
function compileLine(line, separator) {
    switch (line.kind) {
        case "comment":
        case "trailer":
            return [];
        case "heading":
            return [{ ...line, kind: "break", text: "" }];
        case "split":
            return [{ ...line, kind: "separator", text: separator }];
        default:
            return [line];
    }
}
