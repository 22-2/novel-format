import { splitMd, generateMdText } from "./markdown.js";
import { processNovelLines, reconstructNovelText } from "./helpers.js";
import { SECTION_SEPARATOR } from "./constants.js";
export function format(text, { separator = SECTION_SEPARATOR, preserveDialogueSpacing } = {}) {
    const { frontmatter, content: body } = splitMd(text);
    const processedLines = processNovelLines(body, { separator });
    const resultBody = reconstructNovelText(processedLines, { separator, preserveDialogueSpacing });
    if (frontmatter) {
        return generateMdText(resultBody, frontmatter);
    }
    return resultBody;
}
export * from "./types.js";
export * from "./constants.js";
export { preprocessMarkdown } from "./preprocess.js";
