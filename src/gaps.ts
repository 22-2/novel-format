import type { DialogueBracket, Line } from "./lines.js";

/**
 * 地の文を挟まずに連続させないカッコ。
 * 心中（`（）`）は視点人物の思考なので話者が分かる。これに接するセリフ（`「」`）か心中が対象。
 * `『』` は表示文言や人ならざる声で、視点人物の発言ではないため対象にしない。
 */
const COVERED_BRACKETS: ReadonlySet<DialogueBracket> = new Set(["speech", "thought"]);

/**
 * 同じ人物のセリフと心中が、地の文を挟まずに連続している位置に目印を挟む。
 * marker が空文字なら何もしない。
 *
 * セリフの話者はテキストから判別できないため、心中に接するセリフは話者が違う場合もある。
 * 書き手が確かめる目印として入れ、自動で書き換えはしない。
 *
 * すでに目印がある位置には挟まらない。目印の行（kind が gap）はカッコを持たないため、
 * 前後の組み合わせが対象にならない。
 */
export function insertNarrationGapMarkers(lines: readonly Line[], marker: string): Line[] {
  if (marker === "") return [...lines];

  const result: Line[] = [];
  // 目印の判定に使う直前の行。コメント行は含めない
  let previous: Line | undefined;

  for (const line of lines) {
    if (line.kind === "comment") {
      // すでにコメントが挟まっている位置には入れない。書き手が手を入れた場所だと見なす
      result.push(line);
      previous = undefined;
      continue;
    }

    if (previous !== undefined && needsNarrationGap(previous, line)) {
      // 地の文が入る位置なので、地の文と同じく前後が空行二行になる kind にする
      result.push({ kind: "gap", text: marker, blankLinesBefore: 2 });
    }
    result.push(line);
    previous = line;
  }

  return result;
}

function needsNarrationGap(previous: Line, current: Line): boolean {
  const brackets = [previous.bracket, current.bracket];
  if (!brackets.every((bracket) => bracket !== undefined && COVERED_BRACKETS.has(bracket))) return false;
  // 「」同士は話者が替わっていれば正しい並びなので、心中が絡む組み合わせだけを対象にする
  return brackets.includes("thought");
}
