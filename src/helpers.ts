import { FormatNovelTextOptions, ProcessedLine } from "./types";


/**
 * 本文を行ごとに処理して小説形式に整形します
 */
export function processNovelLines(
  body: string,
  options: FormatNovelTextOptions = {},
): ProcessedLine[] {
  // 行に分割して処理（元の改行単位）
  const lines = body.split(/\r\n|\n|\r/);
  const processedLines: ProcessedLine[] = [];

  let precedingEmptyLineCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      precedingEmptyLineCount++;
      continue;
    }

    // セパレータ行の判定
    const isSeparator = options.separator ? trimmed.includes(options.separator) : false;
    if (isSeparator) {
      // セパレータ行は再構築時に前後の空行数を正規化する
      processedLines.push({
        text: trimmed,
        isDialogue: false,
        precedingEmptyLineCount,
        isSeparator: true,
      });
      precedingEmptyLineCount = 0;
      continue;
    }

    // セリフ判定（行頭が対応する開きカッコで始まり、行末が対応する閉じカッコで終わる）
    const bracketPairs: Record<string, string> = {
      "「": "」",
      "『": "』",
      "（": "）",
    };
    const firstChar = trimmed.charAt(0);
    const expectedCloser = bracketPairs[firstChar];
    const isDialogue = expectedCloser ? trimmed.endsWith(expectedCloser) : false;

    // 1. 句点で改行する（セリフは除外）
    const normalizedLines = isDialogue
      ? [trimmed]
      : trimmed.replace(/。(?!\n)/g, "。\n").split("\n");

    for (let i = 0; i < normalizedLines.length; i++) {
      const normalizedTrimmed = normalizedLines[i]?.trim() ?? "";
      if (normalizedTrimmed === "") continue;

      // 2. 字下げする（セリフ以外）
      const newText = !isDialogue ? `　${normalizedTrimmed}` : normalizedTrimmed;

      processedLines.push({
        text: newText,
        isDialogue,
        precedingEmptyLineCount: i === 0 ? precedingEmptyLineCount : 0,
        isSeparator: false,
      });
    }

    precedingEmptyLineCount = 0;
  }
  return processedLines;
}

/**
 * 処理された行データからテキストを再構築します
 */
export function reconstructNovelText(processedLines: ProcessedLine[]): string {
  if (processedLines.length === 0) return "";

  const emptyLinesToSeparator = (emptyLines: number) => "\n".repeat(emptyLines + 1);

  let result = "";
  for (let i = 0; i < processedLines.length; i++) {
    const current = processedLines[i]!;
    const prev = i > 0 ? processedLines[i - 1] : undefined;

    if (i === 0) {
      result = current.text;
      if (current.precedingEmptyLineCount > 0) {
        // セパレータが先頭に来るケースのみ、先頭側も「空行3つ」に寄せる
        result = (current.isSeparator ? "\n\n\n" : "\n\n") + result;
      }
    } else {
      const isDialogueBoundary =
        !!prev && !current.isSeparator && !prev.isSeparator && current.isDialogue !== prev.isDialogue;

      const isDialogueToDialogue =
        !!prev && !current.isSeparator && !prev.isSeparator && current.isDialogue && prev.isDialogue;

      // セパレータ行の前後は必ず空行3つ
      // セリフ⇄地の文の境目は必ず空行2つ
      const emptyLinesBetween = current.isSeparator || prev?.isSeparator
        ? 3
        : isDialogueToDialogue
          ? 0
        : isDialogueBoundary
          ? 2
          : current.precedingEmptyLineCount > 0
            ? 2
            : 0;

      result += emptyLinesToSeparator(emptyLinesBetween) + current.text;
    }
  }
  return result.trimEnd() + "\n";
}
