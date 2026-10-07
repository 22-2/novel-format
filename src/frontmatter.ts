const FRONTMATTER_PATTERN = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

/** 先頭のYAMLフロントマターと本文を分ける。フロントマターがなければ frontmatter は null */
export function splitFrontmatter(text: string): { frontmatter: string | null; body: string } {
  const match = text.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { frontmatter: null, body: text };
  }
  return { frontmatter: match[1] ?? "", body: text.slice(match[0].length) };
}

/** フロントマターと本文を、間に空行1つを挟んで結合する */
export function joinFrontmatter(frontmatter: string, body: string): string {
  const header = frontmatter === "" ? "---\n---\n" : `---\n${frontmatter}\n---\n`;
  return body === "" ? header : `${header}\n${body}`;
}
