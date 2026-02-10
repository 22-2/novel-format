export function splitMd(markdownText: string): {
  content: string;
  frontmatter: string;
} {
  const frontmatterPattern = /^---\r?\n(.*?)\r?\n---\r?\n(.*)/s;
  const match = markdownText.match(frontmatterPattern);
  if (!match) {
    return { content: markdownText, frontmatter: "" };
  }
  const [, frontmatter, content] = match as unknown as [null, string, string];

  return {
    content,
    frontmatter,
  };
}

export function generateMdText(body: string, frontmatter: string): string {
  return `---\n${frontmatter}\n---\n\n${body}`;
}
