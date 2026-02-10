export function splitMd(markdownText) {
    const frontmatterPattern = /^---\r?\n(.*?)\r?\n---\r?\n(.*)/s;
    const match = markdownText.match(frontmatterPattern);
    if (!match) {
        return { content: markdownText, frontmatter: "" };
    }
    const [, frontmatter, content] = match;
    return {
        content,
        frontmatter,
    };
}
export function generateMdText(body, frontmatter) {
    return `---\n${frontmatter}\n---\n\n${body}`;
}
