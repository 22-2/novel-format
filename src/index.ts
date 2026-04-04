import { splitMd, generateMdText } from "./markdown.js";
import type { FormatNovelTextOptions } from "./types.js";
import { processNovelLines, reconstructNovelText } from "./helpers.js";
import { SECTION_SEPARATOR } from "./constants.js";

export function format(
	text: string,
	{ separator = SECTION_SEPARATOR }: FormatNovelTextOptions = {}
): string {
	const { frontmatter, content: body } = splitMd(text);

	const processedLines = processNovelLines(body, { separator });
	const resultBody = reconstructNovelText(processedLines);

	if (frontmatter) {
		return generateMdText(resultBody, frontmatter);
	}
	return resultBody;
}

export * from "./types.js";
export * from "./constants.js";
export { preprocessMarkdown } from "./preprocess.js";
