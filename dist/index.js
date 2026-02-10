import { splitMd, generateMdText } from "./markdown";
import { processNovelLines, reconstructNovelText } from "./helpers";
import { SECTION_SEPARATOR } from "./constants";
export function formatNovelTextCore(text, { separator = SECTION_SEPARATOR } = {}) {
    const { frontmatter, content: body } = splitMd(text);
    const processedLines = processNovelLines(body, { separator });
    const resultBody = reconstructNovelText(processedLines);
    if (frontmatter) {
        return generateMdText(resultBody, frontmatter);
    }
    return resultBody;
}
export * from "./types";
export * from "./constants";
export { preprocessMarkdown } from "./preprocess";
