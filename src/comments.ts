/** Obsidianのコメント記法 `%%コメント%%` の区切り */
export const COMMENT_DELIMITER = "%%";

/** 1行の中の `%%…%%`。閉じていないものは行末までをコメントとみなす */
const INLINE_COMMENT_PATTERN = /%%.*?(?:%%|$)/g;

/** 行の中の `%%…%%` の範囲を [開始, 終了) の組で返す */
export function findInlineComments(line: string): Array<[start: number, end: number]> {
  return [...line.matchAll(INLINE_COMMENT_PATTERN)].map((match) => [match.index, match.index + match[0].length]);
}

/** 行の中の `%%…%%` を取り除く */
export function removeInlineComments(line: string): string {
  return line.replace(INLINE_COMMENT_PATTERN, "");
}

/** 行の中の `%%` の数が奇数なら、コメントブロックの開始または終了をまたぐ */
export function togglesCommentBlock(line: string): boolean {
  return line.split(COMMENT_DELIMITER).length % 2 === 0;
}

/**
 * テキストから `%%…%%` を取り除く。閉じていないコメントは末尾までをコメントとみなす（Obsidianと同じ挙動）。
 * コメントだけの行は改行ごと取り除く。
 * 理由: コメントだけの行を空行として残すと、整形時に余計な空行が入るため。
 */
export function stripObsidianComments(text: string): string {
  let result = "";
  let cursor = 0;

  while (true) {
    const open = text.indexOf(COMMENT_DELIMITER, cursor);
    if (open === -1) break;

    const close = text.indexOf(COMMENT_DELIMITER, open + COMMENT_DELIMITER.length);
    const end = close === -1 ? text.length : close + COMMENT_DELIMITER.length;

    result += text.slice(cursor, open);
    const lineHead = result.slice(result.lastIndexOf("\n") + 1);
    const lineEnd = findLineEnd(text, end);
    const lineTail = text.slice(end, lineEnd);

    if (isBlank(lineHead) && isBlank(lineTail)) {
      result = result.slice(0, result.length - lineHead.length);
      cursor = skipLineBreak(text, lineEnd);
    } else {
      cursor = end;
    }
  }

  return result + text.slice(cursor);
}

function isBlank(text: string): boolean {
  return /^[ \t]*$/.test(text);
}

function findLineEnd(text: string, from: number): number {
  const match = /\r|\n/.exec(text.slice(from));
  return match ? from + match.index : text.length;
}

function skipLineBreak(text: string, lineEnd: number): number {
  if (text.startsWith("\r\n", lineEnd)) return lineEnd + 2;
  if (text[lineEnd] === "\r" || text[lineEnd] === "\n") return lineEnd + 1;
  return lineEnd;
}
